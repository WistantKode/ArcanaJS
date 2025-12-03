import makeController from "./make/Controller";
import makeFactory from "./make/Factory";
import makeMiddleware from "./make/Middleware";
import makeMigration from "./make/Migration";
import makeModel from "./make/Model";
import makeProvider from "./make/Provider";
import makeRequest from "./make/Request";
import makeSeeder from "./make/Seeder";

export const handleMake = async (args: string[]) => {
  const type = args[0].split(":")[1]; // model, controller, etc.
  const name = args[1];

  if (!name) {
    console.error(`Please specify a name for the ${type}`);
    process.exit(1);
  }

  switch (type) {
    case "model":
      await makeModel(name);
      break;
    case "controller":
      const isResource = args.includes("--resource") || args.includes("-r");
      await makeController(name, isResource);
      break;
    case "migration":
      await makeMigration(name);
      break;
    case "seeder":
      await makeSeeder(name);
      break;
    case "factory":
      await makeFactory(name);
      break;
    case "request":
      await makeRequest(name);
      break;
    case "middleware":
      await makeMiddleware(name);
      break;
    case "provider":
      await makeProvider(name);
      break;
    default:
      console.error(`Unknown make command: make:${type}`);
      process.exit(1);
  }
};
