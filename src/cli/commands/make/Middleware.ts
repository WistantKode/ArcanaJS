import { writeFile } from "../../utils/writeFile";

export default async function makeMiddleware(name: string) {
  const content = `import { Middleware, NextFunction, Request, Response } from "arcanajs/server";

export class ${name} implements Middleware {
  public handle(req: Request, res: Response, next: NextFunction): void {
    // Middleware logic here
    next();
  }
}
`;

  await writeFile("app/Http/Middleware", `${name}.ts`, content);
}
