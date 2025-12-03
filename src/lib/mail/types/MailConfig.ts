import { Transporter } from "nodemailer";

/**
 * Supported mail transport drivers
 */
export type MailDriver = "smtp" | "sendgrid" | "mailgun" | "ses" | "log";

/**
 * SMTP Configuration
 */
export interface SMTPConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized?: boolean;
  };
}

/**
 * SendGrid Configuration
 */
export interface SendGridConfig {
  apiKey: string;
}

/**
 * Mailgun Configuration
 */
export interface MailgunConfig {
  apiKey: string;
  domain: string;
  host?: string;
}

/**
 * AWS SES Configuration
 */
export interface SESConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

/**
 * Mail Queue Configuration
 */
export interface MailQueueConfig {
  enabled: boolean;
  driver: "memory" | "redis";
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  retries?: number;
  retryDelay?: number;
}

/**
 * Mail Template Configuration
 */
export interface MailTemplateConfig {
  engine: "ejs" | "handlebars";
  viewsPath: string;
  layoutsPath?: string;
  defaultLayout?: string;
  inlineCss?: boolean;
}

/**
 * Default Sender Configuration
 */
export interface MailFromConfig {
  address: string;
  name?: string;
}

/**
 * Main Mail Configuration
 */
export interface MailConfig {
  /**
   * Default mail driver to use
   */
  default: MailDriver;

  /**
   * Default "from" address and name
   */
  from: MailFromConfig;

  /**
   * SMTP Configuration
   */
  smtp?: SMTPConfig;

  /**
   * SendGrid Configuration
   */
  sendgrid?: SendGridConfig;

  /**
   * Mailgun Configuration
   */
  mailgun?: MailgunConfig;

  /**
   * AWS SES Configuration
   */
  ses?: SESConfig;

  /**
   * Queue Configuration
   */
  queue?: MailQueueConfig;

  /**
   * Template Configuration
   */
  templates?: MailTemplateConfig;

  /**
   * Reply-to address
   */
  replyTo?: MailFromConfig;
}

/**
 * Mail Message Options
 */
export interface MailMessage {
  to: string | string[];
  from?: MailFromConfig;
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: MailAttachment[];
  headers?: Record<string, string>;
  priority?: "high" | "normal" | "low";
}

/**
 * Mail Attachment
 */
export interface MailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
  cid?: string;
}

/**
 * Nodemailer Transporter Type
 */
export type MailTransporter = Transporter;
