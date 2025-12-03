import { writeFile } from "../../utils/writeFile";

export default async function makeRequest(name: string) {
  const content = `import { FormRequest } from "arcanajs/server";

export class ${name} extends FormRequest {
  /**
   * Determine if the user is authorized to make this request.
   */
  public authorize(): boolean {
    return true;
  }

  /**
   * Get the validation rules that apply to the request.
   */
  public rules(): Record<string, string> {
    return {
      // 'field': 'required|string',
    };
  }
}
`;

  await writeFile("app/Requests", `${name}.ts`, content);
}
