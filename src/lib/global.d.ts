import { DatabaseAdapter } from "./arcanox/types";
import { JWTPayload } from "./auth/types";

declare const __non_webpack_require__: NodeJS.Require;

declare global {
  var ArcanaJSDatabaseAdapter: DatabaseAdapter;
  namespace Express {
    interface Request {
      user?: JWTPayload;
      token?: string;
    }

    interface Session {
      userId?: string;
      refreshToken?: string;
    }
  }
}
