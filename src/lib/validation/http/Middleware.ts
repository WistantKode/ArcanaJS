import type { NextFunction, Request, Response } from "express";
import type {
  MiddlewareHandler,
  MiddlewareInterface,
  ParameterizedMiddleware,
} from "../types";

/**
 * Base middleware contract
 */
export interface Middleware extends MiddlewareInterface {
  handle(req: Request, res: Response, next: NextFunction): void | Promise<void>;
}

/**
 * Helper to wrap simple functions as middleware
 */
export function createMiddleware(fn: MiddlewareHandler): MiddlewareInterface {
  return { handle: fn };
}

/**
 * Helper to build parameterized middleware
 */
export function withParams(
  fn: ParameterizedMiddleware,
  ...params: any[]
): MiddlewareInterface {
  return {
    handle: (req: Request, res: Response, next: NextFunction) =>
      fn.handle(req, res, next, ...params),
  } as MiddlewareInterface;
}
