/**
 * ArcanaJS Configuration System
 *
 * Provides utilities for loading and validating ArcanaJS configuration files.
 */

import fs from "fs";
import path from "path";
import type { ArcanaJSUserConfig, ResolvedArcanaJSConfig } from "../types";

/**
 * Define a configuration object with type safety
 *
 * @example
 * ```typescript
 * export default defineConfig({
 *   server: {
 *     port: 3000,
 *   },
 * });
 * ```
 */
export function defineConfig(config: ArcanaJSUserConfig): ArcanaJSUserConfig {
  return config;
}

/**
 * Load ArcanaJS configuration from project root
 *
 * Searches for:
 * - arcanajs.config.js
 * - arcanajs.config.ts
 * - arcanajs.config.mjs
 *
 * @param root - Project root directory (defaults to process.cwd())
 * @returns User configuration object or empty object if not found
 */
export async function loadConfig(
  root: string = process.cwd()
): Promise<ArcanaJSUserConfig> {
  const configFiles = [
    "arcanajs.config.js",
    "arcanajs.config.ts",
    "arcanajs.config.mjs",
  ];

  for (const configFile of configFiles) {
    const configPath = path.resolve(root, configFile);

    if (fs.existsSync(configPath)) {
      try {
        // For TypeScript files, we need ts-node or tsx
        if (configFile.endsWith(".ts")) {
          try {
            require("tsx/cjs");
          } catch {
            try {
              require("ts-node/register");
            } catch {
              console.warn(
                `Found ${configFile} but ts-node/tsx is not available. Skipping.`
              );
              continue;
            }
          }
        }

        const config = require(configPath);
        return config.default || config;
      } catch (error) {
        console.error(`Error loading config from ${configPath}:`, error);
      }
    }
  }

  return {};
}

/**
 * Resolve user configuration with defaults
 *
 * @param userConfig - User-provided configuration
 * @param root - Project root directory
 * @returns Fully resolved configuration with all defaults applied
 */
export function resolveConfig(
  userConfig: ArcanaJSUserConfig,
  root: string = process.cwd()
): ResolvedArcanaJSConfig {
  const mode =
    (process.env.NODE_ENV as "development" | "production") || "development";

  return {
    root,
    mode,
    server: {
      port: userConfig.server?.port || process.env.PORT || 3000,
      staticDir: userConfig.server?.staticDir || "public",
      distDir: userConfig.server?.distDir || "dist/public",
    },
    build: {
      outDir: userConfig.build?.outDir || "dist",
      sourcemap: userConfig.build?.sourcemap ?? mode === "development",
      minify: userConfig.build?.minify ?? mode === "production",
    },
    views: {
      dir: userConfig.views?.dir || "src/views",
      layout: userConfig.views?.layout,
    },
  };
}

/**
 * Load and resolve configuration in one step
 *
 * @param root - Project root directory
 * @returns Fully resolved configuration
 */
export async function loadAndResolveConfig(
  root: string = process.cwd()
): Promise<ResolvedArcanaJSConfig> {
  const userConfig = await loadConfig(root);
  return resolveConfig(userConfig, root);
}
