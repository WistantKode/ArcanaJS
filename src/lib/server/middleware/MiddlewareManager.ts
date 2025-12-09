import compression from "compression";
import cookieParser from "cookie-parser";
import express, { Express, RequestHandler } from "express";
import helmet from "helmet";
import path from "path";
import React from "react";
import { createArcanaJSMiddleware } from "../ArcanaJSMiddleware";
import { createCsrfMiddleware } from "../CsrfMiddleware";
import { createDynamicRouter } from "../DynamicRouter";
import { responseHandler } from "../ResponseHandlerMiddleware";
import { ArcanaJSConfig, ResolvedViews } from "../config/types";

export interface MiddlewareConfig {
  staticDir: string;
  distDir: string;
  indexFile: string;
  layout?: React.FC<any>;
  apiBase: string;
}

/**
 * Manages Express middleware setup and configuration
 */
export class MiddlewareManager {
  private app: Express;
  private config: MiddlewareConfig;

  constructor(app: Express, config: ArcanaJSConfig) {
    this.app = app;
    this.config = {
      staticDir: config.staticDir || "public",
      distDir: config.distDir || ".arcanajs/client",
      indexFile: config.indexFile || ".arcanajs/client/index.html",
      layout: config.layout,
      apiBase: config.apiBase || "/api",
    };
  }

  /**
   * Setup all middleware in the correct order
   */
  public setup(
    views: ResolvedViews,
    routes?: RequestHandler | RequestHandler[],
    apiRoutes?: RequestHandler | RequestHandler[]
  ): void {
    const root = process.cwd();

    this.setupNonceGeneration();
    this.setupSecurityHeaders();
    this.setupParsers();
    this.setupStaticFiles(root);
    this.setupCompression();
    this.setupArcanaJSMiddleware(views, root);
    this.mountRoutes(apiRoutes, this.config.apiBase);
    this.mountRoutes(routes);
    this.setupDynamicRouter(views);
    this.setupErrorHandlers();
  }

  /**
   * Generate nonce for CSP
   */
  private setupNonceGeneration(): void {
    this.app.use(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        const nonce = require("crypto").randomBytes(16).toString("base64");
        res.locals.nonce = nonce;
        next();
      }
    );
  }

  /**
   * Setup security headers with Helmet
   */
  private setupSecurityHeaders(): void {
    const isDevelopment = process.env.NODE_ENV === "development";

    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "style-src": ["'self'", "'unsafe-inline'"],
            "script-src": [
              "'self'",
              (req, res) => `'nonce-${(res as express.Response).locals.nonce}'`,
            ],
            "connect-src": isDevelopment
              ? ["'self'", "ws://localhost:*", "wss://localhost:*"]
              : ["'self'"],
          },
        },
      })
    );
  }

  /**
   * Setup body parsers and cookie parser
   */
  private setupParsers(): void {
    this.app.use(cookieParser());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(createCsrfMiddleware());
    this.app.use(responseHandler);
  }

  /**
   * Setup static file serving
   */
  private setupStaticFiles(root: string): void {
    const isProduction = process.env.NODE_ENV === "production";
    const staticOptions = { index: false, maxAge: isProduction ? "1y" : "0" };

    const staticPaths = [
      path.resolve(root, this.config.distDir),
      path.resolve(root, this.config.staticDir),
    ].filter((p, i, a) => a.indexOf(p) === i);

    for (const p of staticPaths) {
      this.app.use(express.static(p, staticOptions));
    }
  }

  /**
   * Setup response compression
   */
  private setupCompression(): void {
    this.app.use(compression());
  }

  /**
   * Setup ArcanaJS specific middleware
   */
  private setupArcanaJSMiddleware(views: ResolvedViews, root: string): void {
    this.app.use(
      createArcanaJSMiddleware({
        views,
        indexFile: path.resolve(root, this.config.indexFile),
        layout: this.config.layout,
      })
    );
  }

  /**
   * Mount routes (API or web)
   */
  private mountRoutes(
    target: RequestHandler | RequestHandler[] | undefined,
    base?: string
  ): void {
    if (!target) return;

    const items = Array.isArray(target) ? target : [target];
    for (const r of items) {
      if (!r) continue;
      try {
        if (typeof (r as any).getRouter === "function") {
          this.app.use(base || "/", (r as any).getRouter());
        } else {
          this.app.use(base || "/", r as RequestHandler);
        }
        if (base) {
          console.log(`API routes mounted at ${base}`);
        }
      } catch (err) {
        console.error(
          `Error mounting routes${base ? ` at ${base}` : ""}:`,
          err
        );
      }
    }
  }

  /**
   * Setup dynamic router for views
   */
  private setupDynamicRouter(views: ResolvedViews): void {
    this.app.use(createDynamicRouter(views));
  }

  /**
   * Setup 404 and error handlers
   */
  private setupErrorHandlers(): void {
    // 404 handler
    this.app.use((req: express.Request, res: express.Response) => {
      if (req.get("X-ArcanaJS-Request") || req.query.format === "json") {
        res.status(404).json({
          page: "NotFoundPage",
          data: { url: req.url },
          params: {},
          csrfToken: res.locals.csrfToken,
        });
      } else {
        res.status(404).renderPage("NotFoundPage", { url: req.url });
      }
    });

    // Error handler
    this.app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        console.error(err);
        const message =
          process.env.NODE_ENV === "production"
            ? "Internal Server Error"
            : err.message;

        if (req.get("X-ArcanaJS-Request") || req.query.format === "json") {
          res.status(500).json({
            page: "ErrorPage",
            data: { message },
            params: {},
            csrfToken: res.locals.csrfToken,
          });
        } else {
          res.status(500).renderPage("ErrorPage", { message });
        }
      }
    );
  }
}
