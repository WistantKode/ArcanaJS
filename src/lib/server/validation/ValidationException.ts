export class ValidationException extends Error {
  public errors: Record<string, string[]>;
  public status: number;

  constructor(errors: Record<string, string[]>) {
    super("The given data was invalid.");
    this.name = "ValidationException";
    this.errors = errors;
    this.status = 422;
  }
}
