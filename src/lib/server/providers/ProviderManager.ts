import {
  AutoRegisterConfig,
  AutoRegisterProvider,
} from "../../di/providers/AutoRegisterProvider";
import { ServiceProvider } from "../ServiceProvider";
import { ArcanaJSConfig } from "../config/types";

/**
 * Manages service providers lifecycle (registration, boot, shutdown)
 */
export class ProviderManager {
  private providers: ServiceProvider[] = [];
  private app: any;
  private config: ArcanaJSConfig;

  constructor(app: any, config: ArcanaJSConfig) {
    this.app = app;
    this.config = config;
  }

  /**
   * Register all service providers
   */
  public async register(): Promise<void> {
    // Auto-discovery provider
    if (this.config.autoDiscovery && this.config.autoDiscovery.enabled) {
      await this.registerAutoDiscoveryProvider();
    }

    // Custom providers
    if (this.config.providers) {
      await this.registerCustomProviders();
    }
  }

  /**
   * Register auto-discovery provider with ArcanaJS structure
   */
  private async registerAutoDiscoveryProvider(): Promise<void> {
    const directories = [
      "src/app/Http/Controllers",
      "src/app/Services",
      "src/app/Repositories",
    ];

    const config: AutoRegisterConfig = {
      ...this.config.autoDiscovery!,
      directories,
    };

    const provider = new AutoRegisterProvider(this.app, config);
    await provider.register();
    this.providers.push(provider);
  }

  /**
   * Register custom service providers
   */
  private async registerCustomProviders(): Promise<void> {
    for (const ProviderClass of this.config.providers!) {
      const provider = new ProviderClass(this.app);
      await provider.register();
      this.providers.push(provider);
    }
  }

  /**
   * Boot all registered providers
   */
  public async boot(): Promise<void> {
    for (const provider of this.providers) {
      await provider.boot();
    }
  }

  /**
   * Shutdown all providers gracefully
   */
  public async shutdown(): Promise<void> {
    if (this.providers.length === 0) return;

    console.log("⏳ Shutting down providers...");
    for (const provider of this.providers) {
      if (provider.shutdown) {
        try {
          await provider.shutdown();
          console.log(`✓ ${provider.constructor.name} shut down`);
        } catch (err) {
          console.error(
            `✗ Error shutting down provider ${provider.constructor.name}:`,
            err
          );
        }
      }
    }
  }

  /**
   * Get all registered providers
   */
  public getProviders(): ServiceProvider[] {
    return this.providers;
  }
}
