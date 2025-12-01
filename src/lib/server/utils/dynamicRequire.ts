/**
 * Helper to dynamically require modules at runtime, bypassing Webpack bundling.
 * This is necessary for loading user configuration files, migrations, and views
 * that are not part of the framework bundle but exist in the user's project.
 */
export const dynamicRequire = (id: string) => {
  if (typeof __non_webpack_require__ !== "undefined") {
    return __non_webpack_require__(id);
  }
  // Fallback for non-webpack environments (e.g. direct node execution)
  // We use eval to prevent Webpack from seeing this as a dependency
  return eval("require")(id);
};
