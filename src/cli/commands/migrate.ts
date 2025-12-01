import path from "path";
import { MySQLAdapter } from "../../lib/arcanox/adapters/MySQLAdapter";
import { PostgresAdapter } from "../../lib/arcanox/adapters/PostgresAdapter";
import { MigrationRunner } from "../../lib/arcanox/schema/Migration";

export const handleMigrate = async (args: string[]) => {
  const command = args[0]; // migrate, migrate:rollback, etc.

  // Load config
  const configPath = path.resolve(process.cwd(), "database/config.ts");

  // Dynamic require helper
  const dynamicRequire = (id: string) => {
    if (typeof __non_webpack_require__ !== "undefined") {
      return __non_webpack_require__(id);
    }
    return eval("require")(id);
  };

  // We need to register ts-node to load the config if it's a TS file
  try {
    dynamicRequire("ts-node").register({
      transpileOnly: true,
      compilerOptions: {
        module: "commonjs",
      },
    });
  } catch (e) {
    // ts-node might not be installed, try loading js
  }

  let config;
  try {
    const module = dynamicRequire(configPath);
    config = module.default || module.databaseConfig || module;
  } catch (error) {
    console.error("Failed to load database config:", error);
    process.exit(1);
  }

  // Connect to DB
  let adapter;
  if (config.type === "postgres") {
    adapter = new PostgresAdapter();
  } else if (config.type === "mysql") {
    adapter = new MySQLAdapter();
  } else {
    console.error(`Unsupported database type: ${config.type}`);
    process.exit(1);
  }

  try {
    await adapter.connect(config);

    const migrationsPath = path.resolve(process.cwd(), "database/migrations");
    const runner = new MigrationRunner(adapter, migrationsPath);

    switch (command) {
      case "migrate":
        await runner.run();
        break;
      case "migrate:rollback":
        await runner.rollback();
        break;
      case "migrate:reset":
        await runner.reset();
        break;
      case "migrate:fresh":
        await runner.fresh();
        break;
      case "migrate:status":
        const status = await runner.status();
        console.table(status);
        break;
      default:
        console.error(`Unknown migrate command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await adapter.disconnect();
  }
};
