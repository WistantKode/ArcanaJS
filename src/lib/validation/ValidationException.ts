import type {
  ErrorFormat,
  FlatErrorResponse,
  ValidationErrorResponse,
  ValidationErrors,
} from "./types";

// =============================================================================
// VALIDATION EXCEPTION
// =============================================================================

/**
 * Professional ValidationException with multiple error formats
 * and comprehensive error handling capabilities.
 *
 * @example
 * ```typescript
 * // Throw validation exception
 * throw new ValidationException({ email: ['Invalid email format'] });
 *
 * // With custom message
 * throw ValidationException.withMessages({
 *   email: 'Please provide a valid email',
 *   password: 'Password is too weak'
 * });
 *
 * // With redirect
 * throw ValidationException.withRedirect(errors, '/register');
 * ```
 */
export class ValidationException extends Error {
  /**
   * The validation errors
   */
  public readonly errors: ValidationErrors;

  /**
   * HTTP status code
   */
  public readonly status: number = 422;

  /**
   * Error code for programmatic handling
   */
  public readonly code: string = "VALIDATION_ERROR";

  /**
   * Redirect URL after validation failure
   */
  public readonly redirectTo?: string;

  /**
   * Input data that failed validation
   */
  public readonly input?: Record<string, any>;

  /**
   * The validator instance that created this exception
   */
  public readonly validator?: any;

  /**
   * Response format
   */
  public readonly errorFormat: ErrorFormat = "default";

  /**
   * Timestamp of when the error occurred
   */
  public readonly timestamp: Date;

  /**
   * Request path that triggered the error
   */
  public readonly path?: string;

  constructor(
    errors: ValidationErrors,
    message: string = "The given data was invalid.",
    options: {
      status?: number;
      code?: string;
      redirectTo?: string;
      input?: Record<string, any>;
      validator?: any;
      errorFormat?: ErrorFormat;
      path?: string;
    } = {}
  ) {
    super(message);
    this.name = "ValidationException";
    this.errors = errors;
    this.status = options.status ?? 422;
    this.code = options.code ?? "VALIDATION_ERROR";
    this.redirectTo = options.redirectTo;
    this.input = options.input;
    this.validator = options.validator;
    this.errorFormat = options.errorFormat ?? "default";
    this.path = options.path;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationException);
    }
  }

  // ===========================================================================
  // STATIC FACTORY METHODS
  // ===========================================================================

  /**
   * Create exception with simple string messages
   */
  static withMessages(
    messages: Record<string, string | string[]>
  ): ValidationException {
    const errors: ValidationErrors = {};

    for (const [field, message] of Object.entries(messages)) {
      errors[field] = Array.isArray(message) ? message : [message];
    }

    return new ValidationException(errors);
  }

  /**
   * Create exception for a single field
   */
  static forField(field: string, message: string): ValidationException {
    return new ValidationException({ [field]: [message] });
  }

  /**
   * Create exception with redirect URL
   */
  static withRedirect(
    errors: ValidationErrors,
    redirectTo: string
  ): ValidationException {
    return new ValidationException(errors, "The given data was invalid.", {
      redirectTo,
    });
  }

  /**
   * Create exception with input data
   */
  static withInput(
    errors: ValidationErrors,
    input: Record<string, any>
  ): ValidationException {
    // Remove sensitive fields from input
    const safeInput = { ...input };
    const sensitiveFields = [
      "password",
      "password_confirmation",
      "secret",
      "token",
      "api_key",
      "credit_card",
    ];
    sensitiveFields.forEach((field) => delete safeInput[field]);

    return new ValidationException(errors, "The given data was invalid.", {
      input: safeInput,
    });
  }

  /**
   * Create exception from validator instance
   */
  static fromValidator(validator: any): ValidationException {
    return new ValidationException(
      validator.errors_(),
      "The given data was invalid.",
      { validator }
    );
  }

  // ===========================================================================
  // ERROR ACCESS METHODS
  // ===========================================================================

  /**
   * Get all error messages as a flat array
   */
  all(): string[] {
    return Object.values(this.errors).flat();
  }

  /**
   * Get first error message for a field
   */
  first(field?: string): string | undefined {
    if (field) {
      return this.errors[field]?.[0];
    }
    const firstField = Object.keys(this.errors)[0];
    return firstField ? this.errors[firstField][0] : undefined;
  }

  /**
   * Get all error messages for a field
   */
  get(field: string): string[] {
    return this.errors[field] ?? [];
  }

  /**
   * Check if field has errors
   */
  has(field: string): boolean {
    return field in this.errors && this.errors[field].length > 0;
  }

  /**
   * Check if any errors exist
   */
  any(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  /**
   * Get count of total errors
   */
  count(): number {
    return Object.values(this.errors).flat().length;
  }

  /**
   * Get fields that have errors
   */
  keys(): string[] {
    return Object.keys(this.errors);
  }

  /**
   * Check if a specific error message exists
   */
  contains(message: string): boolean {
    return this.all().some((m) => m.includes(message));
  }

  // ===========================================================================
  // ERROR FORMATTING METHODS
  // ===========================================================================

  /**
   * Convert to default response format
   */
  toResponse(): ValidationErrorResponse {
    return {
      message: this.message,
      errors: this.errors,
      status: this.status,
    };
  }

  /**
   * Convert to flat response format
   */
  toFlatResponse(): FlatErrorResponse {
    return {
      message: this.message,
      errors: this.all(),
      status: this.status,
    };
  }

  /**
   * Convert to JSON
   */
  toJSON(): Record<string, any> {
    const json: Record<string, any> = {
      message: this.message,
      errors: this.errors,
      status: this.status,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
    };

    if (this.path) {
      json.path = this.path;
    }

    if (this.redirectTo) {
      json.redirectTo = this.redirectTo;
    }

    return json;
  }

  /**
   * Convert errors to array format
   */
  toArray(): Array<{ field: string; messages: string[] }> {
    return Object.entries(this.errors).map(([field, messages]) => ({
      field,
      messages,
    }));
  }

  /**
   * Convert to keyed format (field => first message)
   */
  toKeyed(): Record<string, string> {
    const keyed: Record<string, string> = {};

    for (const [field, messages] of Object.entries(this.errors)) {
      keyed[field] = messages[0];
    }

    return keyed;
  }

  /**
   * Format errors for logging
   */
  toLogFormat(): string {
    const lines = [`ValidationException: ${this.message}`];

    for (const [field, messages] of Object.entries(this.errors)) {
      for (const message of messages) {
        lines.push(`  - ${field}: ${message}`);
      }
    }

    if (this.path) {
      lines.push(`  Path: ${this.path}`);
    }

    lines.push(`  Time: ${this.timestamp.toISOString()}`);

    return lines.join("\n");
  }

  // ===========================================================================
  // ERROR MANIPULATION METHODS
  // ===========================================================================

  /**
   * Add more errors
   */
  add(field: string, message: string): this {
    if (!this.errors[field]) {
      (this.errors as ValidationErrors)[field] = [];
    }
    (this.errors as ValidationErrors)[field].push(message);
    return this;
  }

  /**
   * Merge with another set of errors
   */
  merge(errors: ValidationErrors): ValidationException {
    const merged = { ...this.errors };

    for (const [field, messages] of Object.entries(errors)) {
      if (merged[field]) {
        merged[field] = [...merged[field], ...messages];
      } else {
        merged[field] = messages;
      }
    }

    return new ValidationException(merged, this.message, {
      status: this.status,
      code: this.code,
      redirectTo: this.redirectTo,
      input: this.input,
    });
  }

  /**
   * Filter errors to only include specific fields
   */
  only(...fields: string[]): ValidationException {
    const filtered: ValidationErrors = {};

    for (const field of fields) {
      if (this.errors[field]) {
        filtered[field] = this.errors[field];
      }
    }

    return new ValidationException(filtered, this.message, {
      status: this.status,
      code: this.code,
    });
  }

  /**
   * Filter errors to exclude specific fields
   */
  except(...fields: string[]): ValidationException {
    const filtered: ValidationErrors = {};

    for (const [field, messages] of Object.entries(this.errors)) {
      if (!fields.includes(field)) {
        filtered[field] = messages;
      }
    }

    return new ValidationException(filtered, this.message, {
      status: this.status,
      code: this.code,
    });
  }

  // ===========================================================================
  // RESPONSE HELPERS
  // ===========================================================================

  /**
   * Send JSON response (Express compatible)
   */
  respond(res: any): void {
    res.status(this.status).json(this.toResponse());
  }

  /**
   * Render error page (for web requests)
   */
  render(res: any, view: string = "errors/validation"): void {
    res.status(this.status).render(view, {
      message: this.message,
      errors: this.errors,
      input: this.input,
    });
  }

  /**
   * Redirect with errors flashed to session
   */
  redirect(res: any, url?: string): void {
    const redirectUrl = url ?? this.redirectTo ?? "/";

    if (res.req?.session) {
      res.req.session.errors = this.errors;
      res.req.session.oldInput = this.input;
    }

    res.redirect(this.status === 422 ? 302 : this.status, redirectUrl);
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if error is a ValidationException
 */
export function isValidationException(
  error: unknown
): error is ValidationException {
  return error instanceof ValidationException;
}

/**
 * Create a validation exception (shorthand)
 */
export function validationError(
  errors: ValidationErrors | Record<string, string>
): ValidationException {
  // Convert string values to arrays
  const normalizedErrors: ValidationErrors = {};

  for (const [field, value] of Object.entries(errors)) {
    normalizedErrors[field] = Array.isArray(value) ? value : [value];
  }

  return new ValidationException(normalizedErrors);
}
