import { Express } from "express";
import { ArcanaJSConfig, ArcanaJSServer } from "./server/ArcanaJSServer";

// ============================================================================
// Server Core Exports
// ============================================================================

export * from "./server/ArcanaJSMiddleware";
export * from "./server/ArcanaJSServer";
export { default as ControllerBinder } from "./server/ControllerBinder";

// ============================================================================
// Routing Exports
// ============================================================================

export * from "./server/DynamicRouter";
export * from "./server/Router";
export { default as Route } from "./server/Router";

// ============================================================================
// Middleware Exports
// ============================================================================

export * from "./server/CsrfMiddleware";
export * from "./server/ResponseHandlerMiddleware";

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
