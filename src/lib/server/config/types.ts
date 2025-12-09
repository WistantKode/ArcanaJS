import { RequestHandler } from "express";
import React from "react";
import { AutoDiscoveryConfig } from "../../di/decorators/types";
import { ServiceProvider } from "../ServiceProvider";

export interface ArcanaJSConfig {
  port?: number | string;
  views?: Record<string, React.FC<any>>;
  viewsDir?: string;
  viewsContext?: any;
  routes?: RequestHandler | RequestHandler[];
  /** API routes can be provided separately from web routes */
  apiRoutes?: RequestHandler | RequestHandler[];
  /** Base path under which API routes will be mounted (default: '/api') */
  apiBase?: string;
  staticDir?: string;
  distDir?: string;
  indexFile?: string;
  layout?: React.FC<any>;
  /** Automatically register SIGINT/SIGTERM handlers to call stop(). Default: true */
  autoHandleSignals?: boolean;
  /** Auth configuration */
  auth?: any;
  /** Mail configuration */
  mail?: any;
  /** Database configuration */
  database?: any;
  /** Auto-discovery configuration */
  autoDiscovery?: AutoDiscoveryConfig;
  /** Service providers to load */
  providers?: (new (app: any) => ServiceProvider)[];
}

export interface ResolvedViews {
  [key: string]: React.FC<any>;
  NotFoundPage: React.FC<any>;
  ErrorPage: React.FC<any>;
}
