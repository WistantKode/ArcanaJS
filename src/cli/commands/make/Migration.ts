import { toPascalCase } from "../../utils/toPascalCase";
import { writeFile } from "../../utils/writeFile";

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

export default makeMigration;
