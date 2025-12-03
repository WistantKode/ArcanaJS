import jwt from "jsonwebtoken";
import { AuthConfig, JWTPayload } from "./types";
import { TokenBlacklist } from "./utils/TokenBlacklist";

export class JWTService {
  private static config: AuthConfig["jwt"];

  static init(config: AuthConfig["jwt"]) {
    this.config = config;
  }

  static generateToken(payload: JWTPayload, options?: jwt.SignOptions): string {
    return jwt.sign(payload, this.config.secret, {
      expiresIn: (this.config.accessTokenExpiry || "15m") as any,
      algorithm: (this.config.algorithm || "HS256") as jwt.Algorithm,
      ...options,
    });
  }

  static generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign({ ...payload, type: "refresh" }, this.config.secret, {
      expiresIn: (this.config.refreshTokenExpiry || "7d") as any,
      algorithm: (this.config.algorithm || "HS256") as jwt.Algorithm,
    });
  }

  static async verifyToken(token: string): Promise<JWTPayload> {
    if (await TokenBlacklist.isRevoked(token)) {
      throw new Error("Token revoked");
    }

    return jwt.verify(token, this.config.secret) as JWTPayload;
  }

  static async revokeToken(token: string): Promise<void> {
    const decoded = jwt.decode(token) as JWTPayload;
    if (decoded && decoded.exp) {
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      if (expiresIn > 0) {
        await TokenBlacklist.add(token, expiresIn);
      }
    }
  }

  static async refreshAccessToken(refreshToken: string): Promise<string> {
    const payload = await this.verifyToken(refreshToken);
    if (payload.type !== "refresh") {
      throw new Error("Invalid token type");
    }

    // Remove exp, iat, and type from payload before signing new token
    const { exp, iat, type, ...newPayload } = payload;
    return this.generateToken(newPayload as JWTPayload);
  }
}
