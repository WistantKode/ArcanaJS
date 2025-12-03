import path from "path";
import MiddlewareBinder from "../server/MiddlewareBinder";
import { ServiceProvider } from "../server/support/ServiceProvider";
import { dynamicRequire } from "../server/utils/dynamicRequire";
import { JWTService } from "./JWTService";
import { AuthMiddleware } from "./middleware/AuthMiddleware";
import { SessionManager } from "./SessionManager";
import { AuthConfig } from "./types";
import { TokenBlacklist } from "./utils/TokenBlacklist";

export class AuthProvider extends ServiceProvider {
  async register() {
    let authConfig: AuthConfig;

    try {
      const configPath = path.resolve(process.cwd(), "src/config/auth");
      authConfig =
        dynamicRequire(configPath).default || dynamicRequire(configPath);
    } catch (err) {
      console.warn("No auth config found. Skipping auth setup.");
      return;
    }

    // Initialize Services
    JWTService.init(authConfig.jwt);
    await TokenBlacklist.init(
      authConfig.tokenBlacklist,
      authConfig.session.redis
    );

    // Register Session Middleware
    this.app.app.use(SessionManager.createMiddleware(authConfig.session));

    // Register Auth Middleware
    this.app.app.use(MiddlewareBinder.handle(AuthMiddleware));

    // Register in container
    this.app.container.singleton("AuthConfig", () => authConfig);
  }

  async boot() {
    //
  }
}
