import path from "path";
import { ServiceProvider } from "../server/support/ServiceProvider";
import { dynamicRequire } from "../server/utils/dynamicRequire";
import { MailService } from "./MailService";
import { MailConfig } from "./types";

/**
 * Mail Service Provider
 *
 * Registers and bootstraps the mail system
 */
export class MailProvider extends ServiceProvider {
  async register() {
    let mailConfig: MailConfig;

    try {
      const configPath = path.resolve(process.cwd(), "src/config/mail");
      mailConfig =
        dynamicRequire(configPath).default || dynamicRequire(configPath);
    } catch (err) {
      console.warn("No mail config found. Skipping mail setup.");
      return;
    }

    // Initialize Mail Service
    await MailService.init(mailConfig);

    // Register in container
    this.app.container.singleton("MailConfig", () => mailConfig);
    this.app.container.singleton("MailService", () => MailService);

    console.log(`Mail service initialized with driver: ${mailConfig.default}`);
  }

  async boot() {
    // Verify mail connection if not using log driver
    const config = this.app.container.resolve<MailConfig>("MailConfig");

    if (config && config.default !== "log") {
      try {
        const verified = await MailService.verify();
        if (verified) {
          console.log("Mail transporter verified successfully");
        }
      } catch (error) {
        console.warn("Mail transporter verification failed:", error);
      }
    }
  }
}
