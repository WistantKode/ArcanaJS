export interface AuthConfig {
  jwt: {
    secret: string;
    accessTokenExpiry?: string | number;
    refreshTokenExpiry?: string | number;
    algorithm?: "HS256" | "RS256";
  };
  session: {
    secret: string;
    name?: string;
    maxAge?: number;
    secure?: boolean;
    redis?: {
      host: string;
      port: number;
      password?: string;
      db?: number;
    };
  };
  tokenBlacklist?: {
    enabled: boolean;
    storage: "memory" | "redis";
  };
}
