import { spawn } from "child_process";
import path from "path";
import webpack from "webpack";
import { createClientConfig, createServerConfig } from "./webpack.config";

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.error("Please specify a command: dev, build, start");
  process.exit(1);
}

const runCompiler = (compiler: webpack.Compiler) => {
  return new Promise<void>((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        console.error(err);
        return reject(err);
      }
      if (stats && stats.hasErrors()) {
        console.error(stats.toString({ colors: true }));
        return reject(new Error("Webpack build failed"));
      }
      console.log(stats?.toString({ colors: true }));
      resolve();
    });
  });
};

let serverProcess: ReturnType<typeof spawn> | null = null;

const startDevServer = () => {
  if (serverProcess) {
    serverProcess.kill();
  }

  const serverPath = path.resolve(process.cwd(), "dist/server.js");
  serverProcess = spawn("node", [serverPath], { stdio: "inherit" });

  serverProcess.on("close", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`Dev server exited with code ${code}`);
    }
  });
};

const watchCompiler = (
  compiler: webpack.Compiler,
  onBuildComplete?: () => void
) => {
  compiler.watch({}, (err, stats) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(stats?.toString({ colors: true }));

    if (stats && !stats.hasErrors() && onBuildComplete) {
      onBuildComplete();
    }
  });
};

const build = async () => {
  process.env.NODE_ENV = "production";
  console.log("Building for production...");

  const clientConfig = createClientConfig();
  const serverConfig = createServerConfig();

  try {
    await runCompiler(webpack(clientConfig));
    await runCompiler(webpack(serverConfig));
    console.log("Build complete.");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
};

const dev = async () => {
  process.env.NODE_ENV = "development";
  console.log("Starting development server...");

  const clientConfig = createClientConfig();
  const serverConfig = createServerConfig();

  // Watch client
  watchCompiler(webpack(clientConfig));

  // Watch server and restart on build
  watchCompiler(webpack(serverConfig), () => {
    console.log("Server build complete. Restarting server...");
    startDevServer();
  });
};

const start = () => {
  process.env.NODE_ENV = "production";
  const serverPath = path.resolve(process.cwd(), "dist/server.js");
  console.log(`Starting server at ${serverPath}...`);

  const child = spawn("node", [serverPath], { stdio: "inherit" });

  child.on("close", (code) => {
    process.exit(code || 0);
  });
};

switch (command) {
  case "build":
    build();
    break;
  case "dev":
    dev();
    break;
  case "start":
    start();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
