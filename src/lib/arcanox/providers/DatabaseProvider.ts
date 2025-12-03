import path from "path";
import { ServiceProvider } from "../../server/support/ServiceProvider";
import { dynamicRequire } from "../../server/utils/dynamicRequire";
import { Model } from "../Model";
import { Schema } from "../schema";
import { DatabaseAdapter } from "../types";

export class DatabaseProvider extends ServiceProvider {
  async register() {
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

    this.app.container.singleton("DatabaseAdapter", () => adapter);

    this.app.container.singleton("DBConnection", async () => {
      const conn = await adapter.connect(databaseConfig);
      Model.setAdapter(adapter);
      Schema.setAdapter(adapter);
      console.log(
        `Connected to ${databaseConfig.type} database: ${databaseConfig.database}`
      );
      return conn;
    });
  }

  async shutdown() {
    try {
      const adapter = (await this.app.container.make(
        "DatabaseAdapter"
      )) as DatabaseAdapter;
      await adapter.disconnect();
      console.log("Database connection closed.");
    } catch (err) {
      // No database configured or already closed
    }
  }
}
