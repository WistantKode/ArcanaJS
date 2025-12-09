import { IApplication } from "./types/IApplication";

export abstract class ServiceProvider {
  protected app: IApplication;

  constructor(app: IApplication) {
    this.app = app;
  }

  /**
   * Register any application services.
   */
  register(): void {
    //
  }

  /**
   * Bootstrap any application services.
   */
  boot(): void {
    //
  }

  /**
   * Shutdown any application services.
   */
  async shutdown(): Promise<void> {
    //
  }
}
