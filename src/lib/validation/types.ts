/**
 * ArcanaJS Validation Types
 *
 * Professional validation system with comprehensive type definitions
 * for building robust form validation and data sanitization.
 */

import type { NextFunction, Request, Response } from "express";
import type { DatabaseAdapter } from "../arcanox/types";

// =============================================================================
// CORE VALIDATION TYPES
// =============================================================================

/**
 * Validation rule definition
 */
export type ValidationRule =
  | string
  | ValidationRuleObject
  | ValidationRuleFunction
  | ValidationRuleArray;

/**
 * Array of validation rules
 */
export type ValidationRuleArray = Array<
  string | ValidationRuleObject | ValidationRuleFunction
>;

/**
 * Object-based rule definition
 */
export interface ValidationRuleObject {
  rule: string;
  params?: Record<string, any>;
  message?: string;
  when?: (data: any) => boolean;
  bail?: boolean;
}

/**
 * Custom validation function
 */
export type ValidationRuleFunction = (
  value: any,
  data: any,
  field: string,
  params?: any
) => boolean | string | Promise<boolean | string>;

/**
 * Validation rules map
 */
export type ValidationRules = Record<string, ValidationRule>;

/**
 * Validation messages map
 */
export type ValidationMessages = Record<
  string,
  string | Record<string, string>
>;

/**
 * Validation attributes (field display names)
 */
export type ValidationAttributes = Record<string, string>;

/**
 * Validation errors structure
 */
export type ValidationErrors = Record<string, string[]>;

/**
 * Validated data result
 */
export type ValidatedData<T = Record<string, any>> = T;

// =============================================================================
// VALIDATOR OPTIONS
// =============================================================================

/**
 * Validator configuration options
 */
export interface ValidatorOptions {
  /** Stop validation on first failure */
  stopOnFirstFailure?: boolean;
  /** Database adapter for database rules */
  databaseAdapter?: DatabaseAdapter;
  /** Custom error messages */
  messages?: ValidationMessages;
  /** Custom attribute names */
  attributes?: ValidationAttributes;
  /** Locale for error messages */
  locale?: string;
  /** Whether to throw on failure */
  throwOnFailure?: boolean;
  /** Enable strict mode (reject unknown fields) */
  strict?: boolean;
  /** Fields to include in validation */
  only?: string[];
  /** Fields to exclude from validation */
  except?: string[];
}

/**
 * Validator result
 */
export interface ValidatorResult<T = Record<string, any>> {
  valid: boolean;
  data: T;
  errors: ValidationErrors;
  messages: string[];
}

// =============================================================================
// RULE DEFINITION TYPES
// =============================================================================

/**
 * Built-in validation rule names
 */
export type BuiltInRule =
  // Presence rules
  | "required"
  | "required_if"
  | "required_unless"
  | "required_with"
  | "required_with_all"
  | "required_without"
  | "required_without_all"
  | "present"
  | "filled"
  | "nullable"
  | "sometimes"
  // Type rules
  | "string"
  | "numeric"
  | "integer"
  | "float"
  | "boolean"
  | "array"
  | "object"
  | "json"
  // Format rules
  | "email"
  | "url"
  | "uuid"
  | "ip"
  | "ipv4"
  | "ipv6"
  | "mac_address"
  | "alpha"
  | "alpha_num"
  | "alpha_dash"
  | "regex"
  | "not_regex"
  // Size rules
  | "min"
  | "max"
  | "size"
  | "between"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  // Comparison rules
  | "same"
  | "different"
  | "confirmed"
  | "in"
  | "not_in"
  // Date rules
  | "date"
  | "date_format"
  | "before"
  | "before_or_equal"
  | "after"
  | "after_or_equal"
  // Database rules
  | "unique"
  | "exists"
  // File rules
  | "file"
  | "image"
  | "mimes"
  | "mimetypes"
  | "dimensions"
  // String rules
  | "starts_with"
  | "ends_with"
  | "contains"
  | "doesnt_start_with"
  | "doesnt_end_with"
  | "lowercase"
  | "uppercase"
  // Array rules
  | "distinct"
  | "in_array"
  // Other
  | "accepted"
  | "accepted_if"
  | "declined"
  | "declined_if"
  | "prohibited"
  | "prohibited_if"
  | "prohibited_unless"
  | "exclude"
  | "exclude_if"
  | "exclude_unless"
  | "bail"
  | "password";

/**
 * Rule parameter types
 */
export interface RuleParams {
  required: never;
  required_if: { field: string; value: any };
  required_unless: { field: string; value: any };
  required_with: { fields: string[] };
  required_with_all: { fields: string[] };
  required_without: { fields: string[] };
  required_without_all: { fields: string[] };
  min: { value: number };
  max: { value: number };
  size: { value: number };
  between: { min: number; max: number };
  in: { values: string[] };
  not_in: { values: string[] };
  same: { field: string };
  different: { field: string };
  unique: {
    table: string;
    column?: string;
    ignore?: string;
    ignoreColumn?: string;
  };
  exists: { table: string; column?: string };
  regex: { pattern: string };
  date_format: { format: string };
  before: { date: string | Date };
  after: { date: string | Date };
  mimes: { types: string[] };
  dimensions: {
    width?: number;
    height?: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    ratio?: string;
  };
  password: {
    min?: number;
    letters?: boolean;
    mixedCase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
    uncompromised?: boolean;
  };
}

// =============================================================================
// FORM REQUEST TYPES
// =============================================================================

/**
 * Form request context
 */
export interface FormRequestContext {
  request: Request;
  response: Response;
  user?: any;
  params: Record<string, string>;
  query: Record<string, string>;
}

/**
 * Authorization result
 */
export type AuthorizationResult = boolean | Promise<boolean>;

/**
 * Form request hooks
 */
export interface FormRequestHooks {
  /** Called before validation */
  prepareForValidation?: (
    data: Record<string, any>
  ) => Record<string, any> | Promise<Record<string, any>>;
  /** Called after successful validation */
  passedValidation?: (data: Record<string, any>) => void | Promise<void>;
  /** Called after failed validation */
  failedValidation?: (errors: ValidationErrors) => void | Promise<void>;
  /** Called after authorization */
  afterAuthorization?: (authorized: boolean) => void | Promise<void>;
}

// =============================================================================
// JSON RESOURCE TYPES
// =============================================================================

/**
 * Resource transformation options
 */
export interface ResourceOptions {
  /** Include additional data */
  with?: string[];
  /** Exclude fields */
  without?: string[];
  /** Wrap response in key */
  wrap?: string | null;
  /** Include pagination meta */
  preserveKeys?: boolean;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
  from: number | null;
  to: number | null;
  path: string;
  firstPageUrl: string;
  lastPageUrl: string;
  nextPageUrl: string | null;
  prevPageUrl: string | null;
}

/**
 * Resource links
 */
export interface ResourceLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

/**
 * Paginated resource response
 */
export interface PaginatedResource<T = any> {
  data: T[];
  links: ResourceLinks;
  meta: PaginationMeta;
}

/**
 * Resource collection options
 */
export interface CollectionOptions extends ResourceOptions {
  /** Pagination info */
  pagination?: PaginationMeta;
}

/**
 * Conditional resource field
 */
export interface ConditionalField<T = any> {
  condition: boolean | (() => boolean);
  value: T | (() => T);
  default?: T;
}

/**
 * When loaded field (for relationships)
 */
export interface WhenLoadedField<T = any> {
  relationship: string;
  value: T | ((loaded: any) => T);
  default?: T;
}

// =============================================================================
// MIDDLEWARE TYPES
// =============================================================================

/**
 * Middleware handler function
 */
export type MiddlewareHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Middleware class interface
 */
export interface MiddlewareInterface {
  handle: MiddlewareHandler;
}

/**
 * Middleware with parameters
 */
export interface ParameterizedMiddleware {
  handle(
    req: Request,
    res: Response,
    next: NextFunction,
    ...params: any[]
  ): void | Promise<void>;
}

/**
 * Middleware group definition
 */
export interface MiddlewareGroup {
  name: string;
  middleware: Array<MiddlewareHandler | MiddlewareInterface | string>;
}

/**
 * Middleware priority
 */
export interface MiddlewarePriority {
  middleware: string;
  priority: number;
}

// =============================================================================
// SANITIZATION TYPES
// =============================================================================

/**
 * Sanitization rule
 */
export type SanitizationRule =
  | "trim"
  | "ltrim"
  | "rtrim"
  | "lowercase"
  | "uppercase"
  | "capitalize"
  | "escape"
  | "strip_tags"
  | "to_int"
  | "to_float"
  | "to_boolean"
  | "to_date"
  | "normalize_email"
  | "slug"
  | SanitizationFunction;

/**
 * Custom sanitization function
 */
export type SanitizationFunction = (value: any) => any;

/**
 * Sanitization rules map
 */
export type SanitizationRules = Record<
  string,
  SanitizationRule | SanitizationRule[]
>;

// =============================================================================
// ERROR FORMATTING TYPES
// =============================================================================

/**
 * Error format types
 */
export type ErrorFormat = "default" | "flat" | "grouped" | "keyed" | "array";

/**
 * Error formatter function
 */
export type ErrorFormatter = (
  field: string,
  rule: string,
  message: string,
  params?: any
) => any;

/**
 * Default error response
 */
export interface ValidationErrorResponse {
  message: string;
  errors: ValidationErrors;
  status: number;
}

/**
 * Flat error response
 */
export interface FlatErrorResponse {
  message: string;
  errors: string[];
  status: number;
}

// =============================================================================
// RULE BUILDER TYPES
// =============================================================================

/**
 * Rule builder interface for fluent API
 */
export interface RuleBuilder {
  required(): RuleBuilder;
  nullable(): RuleBuilder;
  sometimes(): RuleBuilder;
  bail(): RuleBuilder;
  string(): RuleBuilder;
  numeric(): RuleBuilder;
  integer(): RuleBuilder;
  boolean(): RuleBuilder;
  array(): RuleBuilder;
  object(): RuleBuilder;
  email(): RuleBuilder;
  url(): RuleBuilder;
  uuid(): RuleBuilder;
  min(value: number): RuleBuilder;
  max(value: number): RuleBuilder;
  between(min: number, max: number): RuleBuilder;
  in(...values: string[]): RuleBuilder;
  notIn(...values: string[]): RuleBuilder;
  same(field: string): RuleBuilder;
  different(field: string): RuleBuilder;
  confirmed(): RuleBuilder;
  unique(table: string, column?: string, ignore?: string): RuleBuilder;
  exists(table: string, column?: string): RuleBuilder;
  regex(pattern: string | RegExp): RuleBuilder;
  date(): RuleBuilder;
  before(date: string | Date): RuleBuilder;
  after(date: string | Date): RuleBuilder;
  custom(fn: ValidationRuleFunction): RuleBuilder;
  when(
    condition: boolean | ((data: any) => boolean),
    rules: RuleBuilder | string
  ): RuleBuilder;
  unless(
    condition: boolean | ((data: any) => boolean),
    rules: RuleBuilder | string
  ): RuleBuilder;
  toString(): string;
  toArray(): string[];
}

// =============================================================================
// NESTED VALIDATION TYPES
// =============================================================================

/**
 * Nested object validation
 */
export interface NestedValidation {
  /** Dot notation path */
  path: string;
  /** Rules for nested field */
  rules: ValidationRule;
}

/**
 * Array item validation
 */
export interface ArrayItemValidation {
  /** Rules applied to each item */
  "*": ValidationRule;
  /** Rules for specific indices */
  [index: number]: ValidationRule;
}

// =============================================================================
// VALIDATION EVENTS
// =============================================================================

/**
 * Validation event types
 */
export type ValidationEventType =
  | "validating"
  | "validated"
  | "failed"
  | "passed"
  | "rule:start"
  | "rule:end"
  | "rule:failed";

/**
 * Validation event payload
 */
export interface ValidationEvent {
  type: ValidationEventType;
  field?: string;
  rule?: string;
  value?: any;
  message?: string;
  timestamp: Date;
}

/**
 * Validation event handler
 */
export type ValidationEventHandler = (event: ValidationEvent) => void;

// =============================================================================
// FILE VALIDATION TYPES
// =============================================================================

/**
 * Uploaded file interface
 */
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
  buffer?: Buffer;
}

/**
 * Image dimensions
 */
export interface ImageDimensions {
  width: number;
  height: number;
  ratio?: number;
}

/**
 * File validation options
 */
export interface FileValidationOptions {
  maxSize?: number; // in bytes
  minSize?: number;
  allowedMimes?: string[];
  allowedExtensions?: string[];
  dimensions?: Partial<
    ImageDimensions & {
      minWidth?: number;
      maxWidth?: number;
      minHeight?: number;
      maxHeight?: number;
    }
  >;
}
