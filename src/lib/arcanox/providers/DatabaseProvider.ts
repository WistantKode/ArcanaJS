import path from "path";
import { Container } from "../../server/Container";
import { Model } from "../Model";
import { Schema } from "../schema";
import { DatabaseAdapter } from "../types";

import { dynamicRequire } from "../../server/utils/dynamicRequire";

export class DatabaseProvider {
  static async register(container: Container) {
    let databaseConfig: any;

    try {
      const configPath = path.resolve(process.cwd(), "src/config/database");
      databaseConfig =
        dynamicRequire(configPath).default || dynamicRequire(configPath);
    } catch (err) {
      console.warn("No database config found. Skipping database setup.");
      return;
    }

    const adapter: DatabaseAdapter = (() => {
      switch (databaseConfig.type) {
        case "mysql":
          return new (require("../adapters/MySQLAdapter").default)();
        case "mongodb":
          return new (require("../adapters/MongoAdapter").default)();
        case "postgres":
          return new (require("../adapters/PostgresAdapter").default)();
        default:
          throw new Error(`Unsupported DB type ${databaseConfig.type}`);
      }
    })();

    container.singleton("DatabaseAdapter", () => adapter);

    container.singleton("DBConnection", async () => {
      const conn = await adapter.connect(databaseConfig);
      Model.setAdapter(adapter);
      Schema.setAdapter(adapter);
      console.log(
        `Connected to ${databaseConfig.type} database: ${databaseConfig.database}`
      );
      return conn;
    });
  }

  static async close(container: Container) {
    try {
      const adapter = (await container.make(
        "DatabaseAdapter"
      )) as DatabaseAdapter;
      await adapter.disconnect();
      console.log("Database connection closed.");
    } catch (err) {
      // No database configured or already closed
    }
  }
}
