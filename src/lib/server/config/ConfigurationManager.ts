import { Container } from "../../di/Container";
import { ArcanaJSConfig } from "./types";

/**
 * Manages configuration loading and registration in the DI container
 */
export class ConfigurationManager {
  private container: Container;
  private config: ArcanaJSConfig;

  constructor(container: Container, config: ArcanaJSConfig) {
    this.container = container;
    this.config = config;
  }

  /**
   * Load and register all configurations in the container
   */
  public async load(): Promise<void> {
    if (this.config.auth) {
      this.container.singleton("AuthConfig", () => this.config.auth);
    }

    if (this.config.mail) {
      this.container.singleton("MailConfig", () => this.config.mail);
    }

    if (this.config.database) {
      this.container.singleton("DatabaseConfig", () => this.config.database);
    }
  }

  /**
   * Get a specific configuration value
   */
  public get<T>(key: keyof ArcanaJSConfig): T | undefined {
    return this.config[key] as T | undefined;
  }

  /**
   * Get the full configuration object
   */
  public getAll(): ArcanaJSConfig {
    return this.config;
  }
}
