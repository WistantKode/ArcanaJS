import { Mailable } from "../Mailable";
import { MailQueueConfig } from "../types";

/**
 * Queue job for email sending
 */
interface MailJob {
  id: string;
  mailable: Mailable;
  attempts: number;
  createdAt: Date;
  nextRetry?: Date;
}

/**
 * Mail queue for async email processing
 */
export class MailQueue {
  private static config?: MailQueueConfig;
  private static queue: MailJob[] = [];
  private static processing = false;
  private static redisClient?: any;

  /**
   * Initialize the mail queue
   */
  static async init(config: MailQueueConfig) {
    this.config = config;

    if (config.driver === "redis" && config.redis) {
      await this.initRedis(config.redis);
    }

    // Start processing queue
    this.startProcessing();
  }

  /**
   * Initialize Redis connection
   */
  private static async initRedis(
    redisConfig: NonNullable<MailQueueConfig["redis"]>
  ) {
    try {
      const Redis = require("ioredis");
      this.redisClient = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db || 0,
      });

      this.redisClient.on("error", (err: Error) => {
        console.error("Redis connection error:", err);
      });
    } catch (error) {
      console.warn("Redis not available, falling back to memory queue");
      this.config!.driver = "memory";
    }
  }

  /**
   * Add a job to the queue
   */
  static async add(mailable: Mailable): Promise<void> {
    const job: MailJob = {
      id: this.generateId(),
      mailable,
      attempts: 0,
      createdAt: new Date(),
    };

    if (this.config?.driver === "redis" && this.redisClient) {
      await this.redisClient.lpush("mail:queue", JSON.stringify(job));
    } else {
      this.queue.push(job);
    }
  }

  /**
   * Start processing the queue
   */
  private static startProcessing() {
    if (this.processing) return;
    this.processing = true;

    setInterval(async () => {
      await this.processNext();
    }, 1000);
  }

  /**
   * Process next job in queue
   */
  private static async processNext() {
    let job: MailJob | null = null;

    if (this.config?.driver === "redis" && this.redisClient) {
      const data = await this.redisClient.rpop("mail:queue");
      if (data) {
        job = JSON.parse(data);
      }
    } else {
      job = this.queue.shift() || null;
    }

    if (!job) return;

    // Check if we should retry
    if (job.nextRetry && new Date() < job.nextRetry) {
      await this.add(job.mailable);
      return;
    }

    try {
      await job.mailable.send();
    } catch (error) {
      await this.handleFailedJob(job, error as Error);
    }
  }

  /**
   * Handle failed job
   */
  private static async handleFailedJob(job: MailJob, error: Error) {
    const maxRetries = this.config?.retries || 3;
    job.attempts++;

    if (job.attempts < maxRetries) {
      // Calculate exponential backoff
      const delay =
        (this.config?.retryDelay || 60) * Math.pow(2, job.attempts - 1);
      job.nextRetry = new Date(Date.now() + delay * 1000);

      console.warn(
        `Mail job ${job.id} failed (attempt ${job.attempts}/${maxRetries}), retrying in ${delay}s`
      );

      await this.add(job.mailable);
    } else {
      console.error(
        `Mail job ${job.id} failed after ${maxRetries} attempts:`,
        error
      );
      await this.storeFailedJob(job, error);
    }
  }

  /**
   * Store failed job for manual review
   */
  private static async storeFailedJob(job: MailJob, error: Error) {
    const failedJob = {
      ...job,
      error: error.message,
      failedAt: new Date(),
    };

    if (this.config?.driver === "redis" && this.redisClient) {
      await this.redisClient.lpush("mail:failed", JSON.stringify(failedJob));
    } else {
      // In memory, just log it
      console.error("Failed mail job:", failedJob);
    }
  }

  /**
   * Generate unique job ID
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue size
   */
  static async size(): Promise<number> {
    if (this.config?.driver === "redis" && this.redisClient) {
      return await this.redisClient.llen("mail:queue");
    }
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  static async clear(): Promise<void> {
    if (this.config?.driver === "redis" && this.redisClient) {
      await this.redisClient.del("mail:queue");
    } else {
      this.queue = [];
    }
  }
}
