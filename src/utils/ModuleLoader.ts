/**
 * Professional Module Loader Utility
 *
 * This utility provides a centralized way to load modules dynamically at runtime,
 * bypassing Webpack bundling when necessary. It also handles TypeScript registration
 * for on-the-fly compilation.
 */
export class ModuleLoader {
  private static tsNodeRegistered = false;

  /**
   * Dynamically require a module at runtime.
   *
   * This method bypasses Webpack's static analysis and bundling, allowing
   * access to user-land modules, configuration files, and native Node.js modules
   * that shouldn't be bundled with the framework.
   *
   * @param id - The module identifier or path to require
   * @returns The required module
   */
  static require(id: string): any {
    // 1. Try module.require (Node environment)
    try {
      // Use eval to avoid Webpack bundling
      const r = eval("module.require");
      if (r) {
        return r(id);
      }
    } catch (e) {
      // Ignore
    }

    // 2. Try to use createRequire from module (ESM support)
    try {
      // Use eval to hide require from webpack
      const r = eval("req" + "uire");
      const { createRequire } = r("module");
      if (createRequire) {
        const nativeRequire = createRequire(process.cwd() + "/");
        return nativeRequire(id);
      }
    } catch (e) {
      // Ignore
    }

    // 3. Fallback to process.mainModule (Legacy)
    try {
      const _global = global as any;
      const nativeRequire = _global["process"]?.["mainModule"]?.["require"];
      if (nativeRequire) {
        return nativeRequire(id);
      }
    } catch (e) {
      // Ignore errors during lookup
    }

    // 4. Last resort: new Function("return require")
    try {
      const r = new Function("return req" + "uire")();
      return r(id);
    } catch (e) {
      // Ignore
    }

    throw new Error(`Could not require module '${id}'`);
  }
  /**
   * Registers ts-node for runtime TypeScript compilation.
   *
   * This is useful when the framework needs to load and execute TypeScript files
   * directly from the user's project (e.g., configuration, migrations).
   *
   * @returns true if registration was successful, false otherwise
   */
  static registerTsNode(): boolean {
    if (this.tsNodeRegistered) {
      return true;
    }

    // Try to register tsconfig-paths for alias support
    try {
      this.require("tsconfig-paths/register");
    } catch (e) {
      // ignore tsconfig-paths failure
    }

    try {
      const tsNode = this.require("ts-node");
      // Check if ts-node is already registered by checking the service
      if (!tsNode.register) {
        return false;
      }

      tsNode.register({
        transpileOnly: true,
        compilerOptions: {
          module: "commonjs",
          moduleResolution: "node",
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          esModuleInterop: true,
        },
      });

      this.tsNodeRegistered = true;
      return true;
    } catch (e) {
      return false;
    }
  }
}
