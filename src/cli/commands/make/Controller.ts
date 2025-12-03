import { toPascalCase } from "../../utils/toPascalCase";
import { writeFile } from "../../utils/writeFile";

const makeController = async (name: string) => {
  const content = `import type { Request, Response } from 'express'

export class ${toPascalCase(name)} {
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

export default ${toPascalCase(name)}
`;
  await writeFile("app/Controllers", `${toPascalCase(name)}.ts`, content);
};

export default makeController;
