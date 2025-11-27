/**
 * ArcanaJS Configuration Template
 *
 * This file defines the configuration for your ArcanaJS application.
 *
 * @type {import('arcanajs').ArcanaJSUserConfig}
 */
export default {
  // Server configuration
  server: {
    // Port to run the server on
    port: 3000,

    // Static files directory
    staticDir: "public",

    // Distribution directory for built assets
    distDir: "dist/public",
  },

  // Build configuration
  build: {
    // Output directory for build
    outDir: "dist",

    // Enable source maps (automatically set based on NODE_ENV)
    // sourcemap: true,

    // Enable minification (automatically set based on NODE_ENV)
    // minify: true,
  },

  // Views configuration
  views: {
    // Directory containing view files
    dir: "src/views",

    // Custom layout component (optional)
    // layout: undefined,
  },
};
