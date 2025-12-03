export interface JWTPayload {
  sub: string; // User ID
  email?: string;
  roles?: string[];
  permissions?: string[];
  iat?: number; // Issued at
  exp?: number; // Expiration
  jti?: string; // JWT ID for revocation
  [key: string]: any;
}
