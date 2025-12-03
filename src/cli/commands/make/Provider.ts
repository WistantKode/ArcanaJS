import { writeFile } from "../../utils/writeFile";

export default async function makeProvider(name: string) {
  const content = `import { ServiceProvider } from "arcanajs/server";

export class ${name} extends ServiceProvider {
  /**
   * Register any application services.
   */
  public register(): void {
    // Bind services to the container
  }

  /**
   * Bootstrap any application services.
   */
  public boot(): void {
    // Run code on application startup
  }
}
`;

  await writeFile("app/Providers", `${name}.ts`, content);
}
