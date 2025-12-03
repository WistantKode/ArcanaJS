import { MailAttachment, MailMessage } from "./types";

/**
 * Abstract base class for creating email messages
 *
 * @example
 * ```typescript
 * class WelcomeEmail extends Mailable {
 *   constructor(private user: User) {
 *     super();
 *   }
 *
 *   build() {
 *     return this
 *       .to(this.user.email)
 *       .subject('Welcome to ArcanaJS!')
 *       .view('emails/welcome', { name: this.user.name });
 *   }
 * }
 *
 * // Send the email
 * await new WelcomeEmail(user).send();
 * ```
 */
export abstract class Mailable {
  protected message: Partial<MailMessage> = {};
  protected viewName?: string;
  protected viewData?: Record<string, any>;

  /**
   * Build the email message
   * Must be implemented by subclasses
   */
  abstract build(): this;

  /**
   * Set the recipient(s)
   */
  to(address: string | string[], name?: string): this {
    this.message.to = address;
    return this;
  }

  /**
   * Set the sender
   */
  from(address: string, name?: string): this {
    this.message.from = { address, name };
    return this;
  }

  /**
   * Set the email subject
   */
  subject(subject: string): this {
    this.message.subject = subject;
    return this;
  }

  /**
   * Set the email view template
   */
  view(template: string, data?: Record<string, any>): this {
    this.viewName = template;
    this.viewData = data;
    return this;
  }

  /**
   * Set HTML content directly
   */
  html(content: string): this {
    this.message.html = content;
    return this;
  }

  /**
   * Set plain text content
   */
  text(content: string): this {
    this.message.text = content;
    return this;
  }

  /**
   * Add CC recipient(s)
   */
  cc(address: string | string[]): this {
    this.message.cc = address;
    return this;
  }

  /**
   * Add BCC recipient(s)
   */
  bcc(address: string | string[]): this {
    this.message.bcc = address;
    return this;
  }

  /**
   * Set reply-to address
   */
  replyTo(address: string): this {
    this.message.replyTo = address;
    return this;
  }

  /**
   * Add an attachment
   */
  attach(attachment: MailAttachment): this {
    if (!this.message.attachments) {
      this.message.attachments = [];
    }
    this.message.attachments.push(attachment);
    return this;
  }

  /**
   * Attach a file from path
   */
  attachFromPath(path: string, filename?: string): this {
    return this.attach({
      filename: filename || path.split("/").pop() || "attachment",
      path,
    });
  }

  /**
   * Attach data as a file
   */
  attachData(
    content: string | Buffer,
    filename: string,
    contentType?: string
  ): this {
    return this.attach({
      filename,
      content,
      contentType,
    });
  }

  /**
   * Set email priority
   */
  priority(level: "high" | "normal" | "low"): this {
    this.message.priority = level;
    return this;
  }

  /**
   * Add custom headers
   */
  withHeaders(headers: Record<string, string>): this {
    this.message.headers = { ...this.message.headers, ...headers };
    return this;
  }

  /**
   * Get the built message
   * @internal
   */
  getMessage(): {
    message: Partial<MailMessage>;
    viewName?: string;
    viewData?: Record<string, any>;
  } {
    this.build();
    return {
      message: this.message,
      viewName: this.viewName,
      viewData: this.viewData,
    };
  }

  /**
   * Send the email immediately
   */
  async send(): Promise<void> {
    const { MailService } = await import("./MailService");
    await MailService.send(this);
  }

  /**
   * Queue the email for async sending
   */
  async queue(): Promise<void> {
    const { MailService } = await import("./MailService");
    await MailService.queue(this);
  }
}
