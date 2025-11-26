import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import webpack from "webpack";
import { createClientConfig, createServerConfig } from "./webpack.config";

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.error("Please specify a command: init, dev, build, start");
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
  onBuildComplete?: () => void,
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

const init = () => {
  console.log("Initializing ArcanaJS project with Tailwind CSS...");

  const cwd = process.cwd();
  const templatesDir = path.resolve(__dirname, "../templates");

  // Create necessary directories
  const publicDir = path.resolve(cwd, "public");
  const srcDir = path.resolve(cwd, "src");
  const clientDir = path.resolve(cwd, "src/client");
  const serverDir = path.resolve(cwd, "src/server");
  const routesDir = path.resolve(cwd, "src/server/routes");
  const controllersDir = path.resolve(cwd, "src/server/controllers");
  const viewsDir = path.resolve(cwd, "src/views");

  [
    publicDir,
    srcDir,
    clientDir,
    serverDir,
    routesDir,
    controllersDir,
    viewsDir,
  ].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${path.relative(cwd, dir)}`);
    }
  });

  // Copy configuration files
  const configFiles = [
    { src: "package.json", dest: "package.json" },
    { src: "postcss.config.js", dest: "postcss.config.js" },
    { src: "globals.css", dest: "src/client/globals.css" },
    { src: "client-index.tsx", dest: "src/client/index.tsx" },
    { src: "server-index.ts", dest: "src/server/index.ts" },
    { src: "server-routes-web.ts", dest: "src/server/routes/web.ts" },
    {
      src: "server-controller-home.ts",
      dest: "src/server/controllers/HomeController.ts",
    },
    {
      src: "HomePage.tsx",
      dest: "src/views/HomePage.tsx",
    },
    {
      src: "arcanajs.png",
      dest: "public/arcanajs.png",
    },
    {
      src: "arcanajs.svg",
      dest: "public/arcanajs.svg",
    },
    {
      src: "favicon.ico",
      dest: "public/favicon.ico",
    },
  ];

  configFiles.forEach(({ src, dest }) => {
    const srcPath = path.resolve(templatesDir, src);
    const destPath = path.resolve(cwd, dest);

    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Created: ${dest}`);
    } else {
      console.log(`Skipped: ${dest} (already exists)`);
    }
  });

  // Create default error pages
  const errorPages = ["NotFoundPage.tsx", "ErrorPage.tsx"];
  errorPages.forEach((page) => {
    const viewPath = path.resolve(cwd, `src/views/${page}`);
    const templatePath = path.resolve(templatesDir, page);

    if (!fs.existsSync(viewPath) && fs.existsSync(templatePath)) {
      fs.copyFileSync(templatePath, viewPath);
      console.log(`Created: src/views/${page}`);
    }
  });

  console.log("\n✅ ArcanaJS project initialized successfully!");
  console.log("\nNext steps:");
  console.log("1. Run 'npm run dev' to start development");
  console.log("2. Visit http://localhost:3000 to see your app");
  console.log("3. Edit src/views/HomePage.tsx to customize your homepage");
  console.log("4. Customize your theme in src/client/globals.css");
  console.log("5. Add your Tailwind classes and enjoy!");
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
  case "init":
    init();
    break;
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
