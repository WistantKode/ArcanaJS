import { Express } from "express";
import { ArcanaJSServer, ArcanaJSConfig } from "./server/ArcanaJSServer";

export * from "./server/ArcanaJSMiddleware";
export * from "./server/ArcanaJSServer";
export { default as ControllerBinder } from "./server/ControllerBinder";
export * from "./server/DynamicRouter";
export * from "./server/Router";
export { default as Route } from "./server/Router";

/**
 * Create an ArcanaJS server with the given Express app
 * @param app Express application instance
 * @param config Optional ArcanaJS configuration
 * @returns ArcanaJSServer instance
 */
export function createArcanaServer(
  app: Express,
  config?: Partial<ArcanaJSConfig>,
): ArcanaJSServer {
  const server = new ArcanaJSServer({ ...config });
  return server;
}
