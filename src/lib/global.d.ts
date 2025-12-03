import { JWTPayload } from "./server/auth/types";

declare const __non_webpack_require__: NodeJS.Require;

declare global {
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
