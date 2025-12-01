import fs from "fs";
import path from "path";

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
      await makeController(name);
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
    default:
      console.error(`Unknown make command: make:${type}`);
      process.exit(1);
  }
};

const makeModel = async (name: string) => {
  const content = `import { Model } from 'arcanajs/arcanox'

export class ${name} extends Model {
  // protected table = '${name.toLowerCase()}s'
  protected fillable = []
}

export default ${name}
`;
  await writeFile("app/Models", `${name}.ts`, content);
};

const makeController = async (name: string) => {
  const content = `import type { Request, Response } from 'express'

export class ${name} {
  async index(req: Request, res: Response) {
    //
  }

  async show(req: Request, res: Response) {
    //
  }

  async store(req: Request, res: Response) {
    //
  }

  async update(req: Request, res: Response) {
    //
  }

  async destroy(req: Request, res: Response) {
    //
  }
}

export default ${name}
`;
  await writeFile("app/Controllers", `${name}.ts`, content);
};

const makeMigration = async (name: string) => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
  const fileName = `${timestamp}_${name}.ts`;

  const content = `import { Migration, Schema } from 'arcanajs/arcanox'

export class ${toPascalCase(name)} extends Migration {
  async up() {
    // await Schema.create('table_name', (table) => {
    //   table.id()
    //   table.timestamps()
    // })
  }

  async down() {
    // await Schema.dropIfExists('table_name')
  }
}

export default ${toPascalCase(name)}
`;
  await writeFile("database/migrations", fileName, content);
};

const makeSeeder = async (name: string) => {
  const content = `import { Seeder } from 'arcanajs/arcanox'

export class ${name} extends Seeder {
  async run() {
    //
  }
}

export default ${name}
`;
  await writeFile("database/seeders", `${name}.ts`, content);
};

const makeFactory = async (name: string) => {
  const modelName = name.replace("Factory", "");
  const content = `import { Factory } from 'arcanajs/arcanox'
import { ${modelName} } from '../../app/Models/${modelName}'

export class ${name} extends Factory<${modelName}> {
  protected model = ${modelName}

  definition() {
    return {
      //
    }
  }
}

export default ${name}
`;
  await writeFile("database/factories", `${name}.ts`, content);
};

const writeFile = async (dir: string, fileName: string, content: string) => {
  const targetDir = path.resolve(process.cwd(), dir);
  const targetFile = path.join(targetDir, fileName);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  if (fs.existsSync(targetFile)) {
    console.error(`File already exists: ${targetFile}`);
    process.exit(1);
  }

  fs.writeFileSync(targetFile, content);
  console.log(`Created: ${path.join(dir, fileName)}`);
};

const toPascalCase = (str: string) => {
  return str.replace(/(^|_)(\w)/g, (_, __, c) => c.toUpperCase());
};
