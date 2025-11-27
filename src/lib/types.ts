/**
 * ArcanaJS Framework - Centralized Type Definitions
 *
 * This file exports all public TypeScript types and interfaces
 * for the ArcanaJS framework.
 */

// ============================================================================
// Server Types
// ============================================================================

export type { ArcanaJSConfig } from "./server/ArcanaJSServer";

// ============================================================================
// Core Application Types
// ============================================================================

export type { ArcanaJSAppProps } from "./shared/core/ArcanaJSApp";

// ============================================================================
// Context Types
// ============================================================================

export type { HeadManager } from "./shared/context/HeadContext";
export type { RouterContextType } from "./shared/context/RouterContext";

// ============================================================================
// Component Prop Types
// ============================================================================

import type React from "react";

/**
 * Props for the Page component
 */
export interface PageProps {
  data?: any;
  children?: React.ReactNode;
}

/**
 * Props for the Head component
 */
export interface HeadProps {
  children?: React.ReactNode;
}

/**
 * Props for the Body component
 */
export interface BodyProps {
  children?: React.ReactNode;
}

/**
 * Props for the Link component
 */
export interface LinkProps {
  to: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

/**
 * Props for the NavLink component
 */
export interface NavLinkProps extends LinkProps {
  activeClassName?: string;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useRouter hook
 */
export interface UseRouterReturn {
  navigateTo: (url: string) => void;
  currentPage: string;
  currentUrl: string;
  params: Record<string, string>;
  csrfToken?: string;
}

/**
 * Return type for useParams hook
 */
export type UseParamsReturn = Record<string, string>;

/**
 * Return type for useLocation hook
 */
export interface UseLocationReturn {
  pathname: string;
  search: string;
  hash: string;
}

/**
 * Return type for useQuery hook
 */
export type UseQueryReturn = URLSearchParams;

/**
 * Return type for usePage hook
 */
export type UsePageReturn = any;

/**
 * Return type for useHead hook
 */
export interface UseHeadReturn {
  push: (tags: React.ReactNode) => void;
}

// ============================================================================
// View Types
// ============================================================================

/**
 * View component type - a React functional component that can receive data and params
 */
export type ViewComponent<T = any> = React.FC<{
  data?: T;
  params?: Record<string, string>;
  navigateTo?: (url: string) => void;
}>;

/**
 * Views registry - maps view names to view components
 */
export type ViewsRegistry = Record<string, React.FC<any>>;

/**
 * Layout component type
 */
export type LayoutComponent = React.FC<{ children: React.ReactNode }>;

// ============================================================================
// Routing Types
// ============================================================================

import type { RequestHandler } from "express";

/**
 * Controller class type
 */
export type ControllerClass = new (...args: any[]) => any;

/**
 * Route action - can be a handler function or a controller/method pair
 */
export type RouteAction = RequestHandler | [ControllerClass, string];

// ============================================================================
// Configuration Types (for future config system)
// ============================================================================

/**
 * User-facing configuration for ArcanaJS
 */
export interface ArcanaJSUserConfig {
  /**
   * Server configuration
   */
  server?: {
    /**
     * Port to run the server on
     * @default 3000
     */
    port?: number | string;

    /**
     * Static files directory
     * @default "public"
     */
    staticDir?: string;

    /**
     * Distribution directory for built assets
     * @default "dist/public"
     */
    distDir?: string;
  };

  /**
   * Build configuration
   */
  build?: {
    /**
     * Output directory for build
     * @default "dist"
     */
    outDir?: string;

    /**
     * Enable source maps
     * @default true in development, false in production
     */
    sourcemap?: boolean;

    /**
     * Enable minification
     * @default true in production, false in development
     */
    minify?: boolean;
  };

  /**
   * Views configuration
   */
  views?: {
    /**
     * Directory containing view files
     * @default "src/views"
     */
    dir?: string;

    /**
     * Custom layout component
     */
    layout?: LayoutComponent;
  };
}

/**
 * Resolved internal configuration
 */
export interface ResolvedArcanaJSConfig extends Required<ArcanaJSUserConfig> {
  root: string;
  mode: "development" | "production";
}
