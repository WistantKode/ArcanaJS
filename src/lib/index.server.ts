import { Express } from "express";
import ArcanaJSServer, { ArcanaJSConfig } from "./server/ArcanaJSServer";

// ============================================================================
// Server Core Exports
// ============================================================================

export { default as ArcanaJSServer } from "./server/ArcanaJSServer";
export { Container } from "./server/Container";

export { Express, NextFunction, Request, Response } from "express";

// ============================================================================
// Routing Exports
// ============================================================================

export { FormRequest } from "./server/http/FormRequest";
export { JsonResource } from "./server/http/JsonResource";
export type { Middleware } from "./server/http/Middleware";
export { default as Route } from "./server/Router";
export { ServiceProvider } from "./server/support/ServiceProvider";
export { ValidationException } from "./server/validation/ValidationException";
export { Validator } from "./server/validation/Validator";

// ============================================================================
// Server Factory Function
// ============================================================================

/**
 * Create an ArcanaJS server with the given Express app
 *
 * @param app - Express application instance
 * @param config - Optional ArcanaJS configuration
 * @returns ArcanaJSServer instance
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { createArcanaServer } from 'arcanajs/server';
 *
 * const app = express();
 * const server = createArcanaServer(app, {
 *   port: 3000,
 *   viewsDir: 'src/views',
 * });
 *
 * server.start();
 * ```
 */
export function createArcanaServer(
  app: Express,
  config?: Partial<ArcanaJSConfig>
): ArcanaJSServer {
  const server = new ArcanaJSServer({ ...config });
  return server;
}
