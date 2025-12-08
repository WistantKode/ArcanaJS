import { dynamicRequire } from "./dynamicRequire";

export function registerTsNode() {
  // Try to register tsconfig-paths for alias support
  try {
    dynamicRequire("tsconfig-paths/register");
  } catch (e) {
    // ignore
  }

  try {
    const tsNode = dynamicRequire("ts-node");
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
    return true;
  } catch (e) {
    return false;
  }
}
