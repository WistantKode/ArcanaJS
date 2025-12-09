import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { ArcanaJSBuild } from "./ArcanaJSBuild";

declare module "webpack-node-externals";

const args = process.argv.slice(2);

// Handle custom environment file
const envFileArg = args.find((arg) => arg.startsWith("--env-file="));
const customEnvFile = envFileArg ? envFileArg.split("=")[1] : null;

if (customEnvFile) {
  const envPath = path.resolve(process.cwd(), customEnvFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`Loaded environment from ${customEnvFile}`);
  } else {
    console.warn(`Warning: Environment file ${customEnvFile} not found.`);
  }
} else {
  // Try to load .env by default
  dotenv.config();
}

const command = args[0];

if (!command) {
  console.error("Please specify a command: init, dev, build, start");
  process.exit(1);
}

const build = async () => {
  const builder = new ArcanaJSBuild();
  await builder.build();
};

const dev = async () => {
  const builder = new ArcanaJSBuild();
  await builder.dev();
};

const start = async () => {
  const builder = new ArcanaJSBuild();
  await builder.start();
};

import { handleDb } from "./commands/db";
import { handleDependency } from "./commands/dependency";
import { handleMake } from "./commands/make";
import { handleMigrate } from "./commands/migrate";

switch (command) {
  case "init":
    console.log("Init command not yet implemented");
    break;
  case "dev":
    dev();
    break;
  case "build":
    build();
    break;
  case "start":
    start();
    break;
  default:
    if (command.startsWith("make:")) {
      handleMake(args);
    } else if (command.startsWith("migrate")) {
      handleMigrate(args);
    } else if (command.startsWith("db:")) {
      handleDb(args);
    } else if (command.startsWith("dependency:")) {
      handleDependency(args);
    } else {
      console.error(`Unknown command: ${command}`);
      process.exit(1);
    }
}
