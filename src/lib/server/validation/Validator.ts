import { ValidationException } from "./ValidationException";

export class Validator {
  protected data: any;
  protected rules: Record<string, string>;
  protected errors: Record<string, string[]> = {};

  constructor(data: any, rules: Record<string, string>) {
    this.data = data;
    this.rules = rules;
  }

  static make(data: any, rules: Record<string, string>): Validator {
    return new Validator(data, rules);
  }

  fails(): boolean {
    this.validate();
    return Object.keys(this.errors).length > 0;
  }

  passes(): boolean {
    return !this.fails();
  }

  errors_(): Record<string, string[]> {
    return this.errors;
  }

  validate(): Record<string, any> {
    this.errors = {};
    const validated: Record<string, any> = {};

    for (const [field, ruleString] of Object.entries(this.rules)) {
      const rules = ruleString.split("|");
      const value = this.data[field];

      for (const rule of rules) {
        if (rule === "required") {
          if (value === undefined || value === null || value === "") {
            this.addError(field, `${field} is required.`);
          }
        } else if (rule === "string") {
          if (value !== undefined && typeof value !== "string") {
            this.addError(field, `${field} must be a string.`);
          }
        } else if (rule === "numeric") {
          if (value !== undefined && isNaN(Number(value))) {
            this.addError(field, `${field} must be a number.`);
          }
        } else if (rule === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (value !== undefined && !emailRegex.test(String(value))) {
            this.addError(field, `${field} must be a valid email address.`);
          }
        } else if (rule.startsWith("min:")) {
          const min = parseInt(rule.split(":")[1]);
          if (typeof value === "string" && value.length < min) {
            this.addError(
              field,
              `${field} must be at least ${min} characters.`
            );
          } else if (typeof value === "number" && value < min) {
            this.addError(field, `${field} must be at least ${min}.`);
          }
        } else if (rule.startsWith("max:")) {
          const max = parseInt(rule.split(":")[1]);
          if (typeof value === "string" && value.length > max) {
            this.addError(
              field,
              `${field} must not be greater than ${max} characters.`
            );
          } else if (typeof value === "number" && value > max) {
            this.addError(field, `${field} must not be greater than ${max}.`);
          }
        }
      }

      if (value !== undefined) {
        validated[field] = value;
      }
    }

    if (Object.keys(this.errors).length > 0) {
      throw new ValidationException(this.errors);
    }

    return validated;
  }

  protected addError(field: string, message: string) {
    if (!this.errors[field]) {
      this.errors[field] = [];
    }
    this.errors[field].push(message);
  }
}
