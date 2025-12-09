import { Request, Response } from "express";
import { ValidationException } from "../ValidationException";
import { Validator } from "../Validator";
import type {
  AuthorizationResult,
  FormRequestContext,
  ValidatedData,
  ValidationAttributes,
  ValidationMessages,
  ValidationRules,
  ValidatorOptions,
} from "../types";

/**
 * Professional FormRequest with hooks, custom messages, attributes, and context-aware validation.
 */
export abstract class FormRequest<TValidated = Record<string, any>> {
  protected req: Request;
  protected res?: Response;

  constructor(req: Request, res?: Response) {
    this.req = req;
    this.res = res;
  }

  /** Define validation rules */
  abstract rules(): ValidationRules;

  /** Custom messages (optional) */
  messages(): ValidationMessages {
    return {};
  }

  /** Custom attribute labels (optional) */
  attributes(): ValidationAttributes {
    return {};
  }

  /** Authorization check */
  authorize(): AuthorizationResult {
    return true;
  }

  /** Prepare data before validation */
  async prepareForValidation(
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    return data;
  }

  /** Hook after successful validation */
  async passedValidation(data: TValidated): Promise<void> {}

  /** Hook after failed validation */
  async failedValidation(errors: ValidationException): Promise<void> {
    throw errors;
  }

  /** Access context */
  context(): FormRequestContext {
    return {
      request: this.req,
      response: this.res!,
      user: (this.req as any).user,
      params: this.req.params,
      query: this.req.query as Record<string, string>,
    };
  }

  /** Gather data for validation */
  protected validationData(): Record<string, any> {
    return {
      ...this.req.body,
      ...this.req.query,
      ...this.req.params,
    };
  }

  /** Build validator instance */
  protected async buildValidator(
    options: ValidatorOptions = {}
  ): Promise<Validator> {
    const data = await this.prepareForValidation(this.validationData());
    return Validator.make(
      data,
      this.rules(),
      options,
      this.messages(),
      this.attributes()
    );
  }

  /** Validate and return typed data */
  async validate(
    options: ValidatorOptions = {}
  ): Promise<ValidatedData<TValidated>> {
    const authorized = await Promise.resolve(this.authorize());
    if (!authorized) {
      throw new Error("This action is unauthorized.");
    }

    const validator = await this.buildValidator({
      ...options,
      throwOnFailure: true,
    });

    try {
      const validated =
        (await validator.validate()) as ValidatedData<TValidated>;
      await this.passedValidation(validated);
      return validated;
    } catch (error) {
      if (error instanceof ValidationException) {
        await this.failedValidation(error);
        throw error;
      }
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  input<T = any>(key: string, defaultValue: T | null = null): T | null {
    const data = this.validationData();
    return (data as any)[key] ?? defaultValue;
  }

  only<T = any>(...fields: string[]): T {
    const data = this.validationData();
    const picked: Record<string, any> = {};
    fields.forEach((f) => {
      if (f in data) picked[f] = (data as any)[f];
    });
    return picked as T;
  }

  except<T = any>(...fields: string[]): T {
    const data = this.validationData();
    const result: Record<string, any> = { ...data };
    fields.forEach((f) => delete result[f]);
    return result as T;
  }

  all<T = any>(): T {
    return this.validationData() as T;
  }
}
