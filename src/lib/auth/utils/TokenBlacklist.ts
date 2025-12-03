import { createClient } from "redis";
import { AuthConfig } from "../types";

export class TokenBlacklist {
  private static redisClient: any;
  private static memoryStore: Map<string, number> = new Map();
  private static config: AuthConfig["tokenBlacklist"];

  static async init(
    config: AuthConfig["tokenBlacklist"],
    redisConfig?: AuthConfig["session"]["redis"]
  ) {
    this.config = config;
    if (config?.storage === "redis" && redisConfig) {
      try {
        this.redisClient = createClient({
          url: `redis://${
            redisConfig.password ? `:${redisConfig.password}@` : ""
          }${redisConfig.host}:${redisConfig.port}`,
        });
        await this.redisClient.connect();
        console.log("TokenBlacklist: Connected to Redis");
      } catch (err) {
        console.error("TokenBlacklist: Failed to connect to Redis", err);
        if (this.config) {
          this.config.storage = "memory";
        }
      }
    }

    // Periodic cleanup for memory store
    if (this.config?.storage === "memory") {
      setInterval(() => {
        const now = Date.now();
        for (const [token, exp] of this.memoryStore.entries()) {
          if (exp < now) {
            this.memoryStore.delete(token);
          }
        }
      }, 60 * 60 * 1000); // Every hour
    }
  }

  static async add(token: string, expiresInSeconds: number): Promise<void> {
    if (!this.config?.enabled) return;

    if (this.config.storage === "redis" && this.redisClient) {
      await this.redisClient.set(token, "revoked", {
        EX: expiresInSeconds,
      });
    } else {
      const exp = Date.now() + expiresInSeconds * 1000;
      this.memoryStore.set(token, exp);
    }
  }

  static async isRevoked(token: string): Promise<boolean> {
    if (!this.config?.enabled) return false;

    if (this.config.storage === "redis" && this.redisClient) {
      const result = await this.redisClient.get(token);
      return result === "revoked";
    } else {
      const exp = this.memoryStore.get(token);
      if (!exp) return false;
      if (exp < Date.now()) {
        this.memoryStore.delete(token);
        return false;
      }
      return true;
    }
  }
}
