import { toPascalCase } from "../../utils/toPascalCase";
import { writeFile } from "../../utils/writeFile";

const makeController = async (name: string, isResource = false) => {
  let methods = "";

  if (isResource) {
    methods = `
  async index(req: Request, res: Response) {
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
`;
  } else {
    methods = `
  async index(req: Request, res: Response) {
    //
  }

  async create(req: Request, res: Response) {
    //
  }

  async store(req: Request, res: Response) {
    //
  }

  async show(req: Request, res: Response) {
    //
  }

  async edit(req: Request, res: Response) {
    //
  }

  async update(req: Request, res: Response) {
    //
  }

  async destroy(req: Request, res: Response) {
    //
  }
`;
  }

  const content = `import { Request, Response } from 'arcanajs/server'

export class ${toPascalCase(name)} {${methods}}

export default ${toPascalCase(name)}
`;
  await writeFile("app/Controllers", `${toPascalCase(name)}.ts`, content);
};

export default makeController;
