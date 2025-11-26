import express, { Router as ExpressRouter, RequestHandler } from "express";
import ControllerBinder from "./ControllerBinder";

/**
 * Provides Routing syntax for defining routes with prefixes, middlewares, and groups
 */
export class Router {
  private router: ExpressRouter;
  private middlewareStack: RequestHandler[];
  private prefixStack: string[];

  constructor() {
    this.router = express.Router();
    this.middlewareStack = [];
    this.prefixStack = [];
  }

  /**
   * Create a new router instance
   */
  static create(): Router {
    return new Router();
  }

  /**
   * Add middleware to the current stack
   */
  middleware(...middleware: RequestHandler[]): Router {
    const newRouter = this._clone();
    newRouter.middlewareStack = [...this.middlewareStack, ...middleware];
    return newRouter;
  }

  /**
   * Add prefix to the current stack
   */
  prefix(prefix: string): Router {
    const newRouter = this._clone();
    newRouter.prefixStack = [
      ...this.prefixStack,
      prefix.replace(/^\/|\/$/g, ""),
    ];
    return newRouter;
  }

  /**
   * Create a route group
   */
  group(callback: (router: Router) => void): Router {
    callback(this);
    return this;
  }

  /**
   * Define a GET route
   */
  get(path: string, ...args: any[]): Router {
    const action = args.pop();
    const middlewares = args;
    return this._addRoute("get", path, action, middlewares);
  }

  /**
   * Define a POST route
   */
  post(path: string, ...args: any[]): Router {
    const action = args.pop();
    const middlewares = args;
    return this._addRoute("post", path, action, middlewares);
  }

  /**
   * Define a PUT route
   */
  put(path: string, ...args: any[]): Router {
    const action = args.pop();
    const middlewares = args;
    return this._addRoute("put", path, action, middlewares);
  }

  /**
   * Define a DELETE route
   */
  delete(path: string, ...args: any[]): Router {
    const action = args.pop();
    const middlewares = args;
    return this._addRoute("delete", path, action, middlewares);
  }

  /**
   * Define a PATCH route
   */
  patch(path: string, ...args: any[]): Router {
    const action = args.pop();
    const middlewares = args;
    return this._addRoute("patch", path, action, middlewares);
  }

  /**
   * Define an OPTIONS route
   */
  options(path: string, ...args: any[]): Router {
    const action = args.pop();
    const middlewares = args;
    return this._addRoute("options", path, action, middlewares);
  }

  /**
   * Get the underlying Express router
   */
  getRouter(): ExpressRouter {
    return this.router;
  }

  /**
   * Mount this router to an Express app or router
   */
  mount(app: express.Application | ExpressRouter, basePath = "/"): void {
    (app as any).use(basePath, this.router);
  }

  /**
   * Clone the current router instance
   */
  private _clone(): Router {
    const newRouter = new Router();
    newRouter.router = this.router;
    newRouter.middlewareStack = [...this.middlewareStack];
    newRouter.prefixStack = [...this.prefixStack];
    return newRouter;
  }

  /**
   * Add a route to the router
   */
  private _addRoute(
    method: "get" | "post" | "put" | "delete" | "patch" | "options",
    path: string,
    action: any,
    routeMiddlewares: any[] = []
  ): Router {
    const fullPath = this._buildPath(path);
    const handler = this._buildHandler(action);
    const flatMiddlewares = routeMiddlewares.flat(Infinity) as RequestHandler[];
    const middlewares = [...this.middlewareStack, ...flatMiddlewares, handler];

    this.router[method](fullPath, ...middlewares);
    return this;
  }

  /**
   * Build the full path with prefixes
   */
  private _buildPath(path: string): string {
    const cleanPath = path.replace(/^\//, "");
    const prefixes = this.prefixStack.filter((p) => p !== "");

    if (prefixes.length === 0) {
      return `/${cleanPath}`;
    }

    return `/${prefixes.join("/")}/${cleanPath}`.replace(/\/+/g, "/");
  }

  /**
   * Build the route handler
   */
  private _buildHandler(action: any): RequestHandler {
    if (typeof action === "function") {
      return action;
    }

    if (Array.isArray(action) && action.length === 2) {
      const [controller, method] = action;
      return ControllerBinder.handle(controller, method);
    }

    throw new Error(
      'Action must be a function or array [Controller, "method"]'
    );
  }
}

/**
 * Static Route class for Laravel-like syntax
 */
export class Route {
  private static _router = new Router();

  static create(): Router {
    return Router.create();
  }

  static middleware(...middleware: RequestHandler[]): Router {
    return this._router.middleware(...middleware);
  }

  static prefix(prefix: string): Router {
    return this._router.prefix(prefix);
  }

  static group(callback: (router: Router) => void): Router {
    return this._router.group(callback);
  }

  static get(path: string, ...args: any[]): Router {
    return this._router.get(path, ...args);
  }

  static post(path: string, ...args: any[]): Router {
    return this._router.post(path, ...args);
  }

  static put(path: string, ...args: any[]): Router {
    return this._router.put(path, ...args);
  }

  static delete(path: string, ...args: any[]): Router {
    return this._router.delete(path, ...args);
  }

  static patch(path: string, ...args: any[]): Router {
    return this._router.patch(path, ...args);
  }

  static options(path: string, ...args: any[]): Router {
    return this._router.options(path, ...args);
  }

  static getRouter(): ExpressRouter {
    return this._router.getRouter();
  }

  static mount(app: express.Application, basePath = "/"): void {
    return this._router.mount(app, basePath);
  }

  static reset(): void {
    this._router = new Router();
  }
}

export default Route;
