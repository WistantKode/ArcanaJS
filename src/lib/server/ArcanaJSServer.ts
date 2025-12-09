import express, { Express } from "express";
import { Container } from "../di/Container";
import { ConfigurationManager } from "./config/ConfigurationManager";
import { ArcanaJSConfig, ResolvedViews } from "./config/types";
import { ServerLifecycle } from "./lifecycle/ServerLifecycle";
import { MiddlewareManager } from "./middleware/MiddlewareManager";
import { ProviderManager } from "./providers/ProviderManager";
import { ViewsResolver } from "./views/ViewsResolver";

/**
 * Main ArcanaJS Server class - orchestrates all components
 */
class ArcanaJSServer {
  public app: Express;
  public container: Container;

  private config: ArcanaJSConfig;
  private configManager: ConfigurationManager;
  private providerManager: ProviderManager;
  private middlewareManager: MiddlewareManager;
  private viewsResolver: ViewsResolver;
  private lifecycle: ServerLifecycle;

  private resolvedViews!: ResolvedViews;
  private initialized = false;

  constructor(config: ArcanaJSConfig) {
    this.config = config;
    this.app = express();
    this.container = Container.getInstance();

    // Initialize managers
    this.configManager = new ConfigurationManager(this.container, config);
    this.providerManager = new ProviderManager(this, config);
    this.middlewareManager = new MiddlewareManager(this.app, config);
    this.viewsResolver = new ViewsResolver(config);
    this.lifecycle = new ServerLifecycle(
      this.app,
      config.autoHandleSignals !== false,
      {
        onShutdown: () => this.providerManager.shutdown(),
      }
    );

    // Setup middleware immediately
    this.setupMiddleware();
  }

  /**
   * Initialize async components (config, providers)
   */
  private async initializeAsync(): Promise<void> {
    if (this.initialized) return;

    await this.configManager.load();
    await this.providerManager.register();
    await this.providerManager.boot();

    this.initialized = true;
  }

  /**
   * Setup all middleware and routes
   */
  private setupMiddleware(): void {
    // Resolve views
    this.resolvedViews = this.viewsResolver.resolve();

    // Setup middleware with resolved views and routes
    this.middlewareManager.setup(
      this.resolvedViews,
      this.config.routes,
      this.config.apiRoutes
    );
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    await this.initializeAsync();

    const port = this.config.port || process.env.PORT || 3000;
    await this.lifecycle.start(port);
  }

  /**
   * Stop the server
   */
  public async stop(): Promise<void> {
    await this.lifecycle.stop();
  }

  /**
   * Get the resolved views
   */
  public getViews(): ResolvedViews {
    return this.resolvedViews;
  }

  /**
   * Get the configuration manager
   */
  public getConfigManager(): ConfigurationManager {
    return this.configManager;
  }

  /**
   * Get the provider manager
   */
  public getProviderManager(): ProviderManager {
    return this.providerManager;
  }

  /**
   * Check if server is running
   */
  public isRunning(): boolean {
    return this.lifecycle.isRunning();
  }
}

export default ArcanaJSServer;

// Re-export types and managers for external use
export { ConfigurationManager } from "./config/ConfigurationManager";
export type { ArcanaJSConfig, ResolvedViews } from "./config/types";
export { ServerLifecycle } from "./lifecycle/ServerLifecycle";
export { MiddlewareManager } from "./middleware/MiddlewareManager";
export { ProviderManager } from "./providers/ProviderManager";
export { ViewsResolver } from "./views/ViewsResolver";
