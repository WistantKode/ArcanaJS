import { ChildProcess, spawn } from "child_process";
import fs from "fs";
import path from "path";
import webpack from "webpack";
import { WebSocketServer } from "ws";
import { createClientConfig, createServerConfig } from "./webpack.config";

export class ArcanaJSBuild {
  private cwd: string;
  private serverProcess: ChildProcess | null = null;
  private wss: WebSocketServer | undefined;
  private hmrPort: number | undefined;
  private isServerBuilding = false;
  private pendingReload = false;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  public async build() {
    process.env.NODE_ENV = "production";
    console.log("Creating an optimized production build...");

    // Clean .arcanajs directory
    const buildDir = path.resolve(this.cwd, ".arcanajs");
    if (fs.existsSync(buildDir)) {
      fs.rmSync(buildDir, { recursive: true, force: true });
    }

    const clientConfig = createClientConfig();
    const serverConfig = createServerConfig();

    const compiler = webpack([clientConfig, serverConfig]);

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
        console.log(stats?.toString({ colors: true, preset: "minimal" }));
        console.log("✓ Build complete.");
        resolve();
      });
    });
  }

  public async dev() {
    process.env.NODE_ENV = "development";
    console.log("Starting development server...");

    // Clean .arcanajs directory
    const buildDir = path.resolve(this.cwd, ".arcanajs");
    if (fs.existsSync(buildDir)) {
      fs.rmSync(buildDir, { recursive: true, force: true });
    }

    await this.setupHMR();

    const clientConfig = createClientConfig();
    const serverConfig = createServerConfig();

    const serverCompiler = webpack(serverConfig);
    const clientCompiler = webpack(clientConfig);

    serverCompiler.hooks.invalid.tap("ArcanaJS", () => {
      this.isServerBuilding = true;
    });

    // Watch client
    this.watchCompiler("Client", clientCompiler, () => {
      console.log("Client build complete.");
      if (this.isServerBuilding) {
        console.log("Server is building. Waiting to reload...");
        this.pendingReload = true;
      } else {
        console.log("Reloading browsers...");
        this.broadcastReload();
      }
    });

    // Watch server and restart on build
    this.watchCompiler("Server", serverCompiler, async () => {
      console.log("Server build complete. Restarting server...");
      await this.startDevServer();
      this.isServerBuilding = false;
      if (this.pendingReload) {
        console.log("Pending reload found. Reloading browsers...");
        this.broadcastReload();
        this.pendingReload = false;
      }
    });
  }

  public async start() {
    process.env.NODE_ENV = "production";
    const serverPath = path.resolve(this.cwd, ".arcanajs/server/server.js");
    console.log(`Starting server at ${serverPath}...`);

    if (!fs.existsSync(serverPath)) {
      console.error("Server file not found. Did you run 'arcanajs build'?");
      process.exit(1);
    }

    const child = spawn("node", [serverPath], { stdio: "inherit" });

    child.on("close", (code) => {
      process.exit(code || 0);
    });
  }

  private watchCompiler(
    name: string,
    compiler: webpack.Compiler,
    onBuildComplete?: () => void
  ) {
    const watchOptions = compiler.options.watchOptions || {};
    compiler.watch(watchOptions, (err, stats) => {
      if (err) {
        console.error(`[${name}] Error:`, err);
        return;
      }
      console.log(`[${name}] Build output:`);
      console.log(
        stats?.toString({
          colors: true,
          preset: "minimal",
          assets: false,
          modules: false,
        })
      );

      if (stats && !stats.hasErrors() && onBuildComplete) {
        onBuildComplete();
      }
    });
  }

  private async setupHMR() {
    const HMR_INITIAL_PORT = 3001;
    const MAX_PORT_ATTEMPTS = 10;

    for (let i = 0; i < MAX_PORT_ATTEMPTS; i++) {
      try {
        const currentPort = HMR_INITIAL_PORT + i;
        this.wss = await this.createWSS(currentPort);
        this.hmrPort = currentPort;
        console.log(`HMR Server running on port ${this.hmrPort}`);
        break;
      } catch (err: any) {
        if (err.code === "EADDRINUSE") {
          console.warn(
            `Port ${HMR_INITIAL_PORT + i} is in use, trying next port...`
          );
          if (i === MAX_PORT_ATTEMPTS - 1) {
            throw new Error(
              `Could not start HMR server after ${MAX_PORT_ATTEMPTS} attempts.`
            );
          }
        } else {
          throw err;
        }
      }
    }

    if (!this.wss || !this.hmrPort) {
      throw new Error("Failed to start HMR server.");
    }

    // Graceful shutdown handler
    const cleanup = () => {
      console.log("\nShutting down development server...");

      if (this.wss) {
        this.wss.close(() => {
          console.log("HMR server closed.");
        });
      }

      if (this.serverProcess) {
        this.serverProcess.kill();
        this.serverProcess = null;
      }

      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  }

  private createWSS(port: number): Promise<WebSocketServer> {
    return new Promise((resolve, reject) => {
      const server = new WebSocketServer({ port });

      server.on("listening", () => {
        resolve(server);
      });

      server.on("error", (err: any) => {
        reject(err);
      });
    });
  }

  private broadcastReload() {
    this.wss?.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: "reload" }));
      }
    });
  }

  private startDevServer(): Promise<void> {
    return new Promise((resolve) => {
      if (this.serverProcess) {
        this.serverProcess.kill();
      }

      const serverPath = path.resolve(this.cwd, ".arcanajs/server/server.js");
      this.serverProcess = spawn("node", [serverPath], {
        stdio: ["inherit", "pipe", "inherit"],
        env: { ...process.env, ARCANAJS_HMR_PORT: this.hmrPort?.toString() },
      });

      this.serverProcess.stdout?.on("data", (data) => {
        process.stdout.write(data);
        if (data.toString().includes("Server is running")) {
          resolve();
        }
      });

      this.serverProcess.on("close", (code) => {
        if (code !== 0 && code !== null) {
          console.error(`Dev server exited with code ${code}`);
        }
      });
    });
  }
}
