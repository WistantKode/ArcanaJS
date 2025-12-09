import * as net from "net";
import { QueryBuilder } from "../arcanox/QueryBuilder";
import type { DatabaseAdapter } from "../arcanox/types";
import { ValidationException } from "./ValidationException";
import type {
  ValidatedData,
  ValidationAttributes,
  ValidationErrors,
  ValidationEvent,
  ValidationEventHandler,
  ValidationEventType,
  ValidationMessages,
  ValidationRule,
  ValidationRuleFunction,
  ValidationRuleObject,
  ValidationRules,
  ValidatorOptions,
} from "./types";

type RuleResult = true | string | Promise<true | string>;
type NormalizedRule = ValidationRuleObject & {
  name: string;
  params?: any;
  message?: string;
  bail?: boolean;
  when?: (data: any) => boolean;
  fn?: ValidationRuleFunction;
};

/**
 * Professional Validator with rich rules, messages, events, and database-aware checks.
 */
export class Validator<
  TData extends Record<string, any> = Record<string, any>
> {
  protected data: TData;
  protected rules: ValidationRules;
  protected errors: ValidationErrors = {};
  protected databaseAdapter?: DatabaseAdapter;
  protected messages: ValidationMessages = {};
  protected attributes: ValidationAttributes = {};
  protected options: ValidatorOptions;
  protected events: Map<ValidationEventType, ValidationEventHandler[]> =
    new Map();

  private static customValidators: Record<string, ValidationRuleFunction> = {};

  constructor(
    data: TData,
    rules: ValidationRules,
    options: ValidatorOptions = {},
    messages: ValidationMessages = {},
    attributes: ValidationAttributes = {}
  ) {
    this.data = data;
    this.rules = rules;
    this.options = {
      stopOnFirstFailure: false,
      throwOnFailure: true,
      ...options,
    };
    this.messages = messages;
    this.attributes = attributes;

    if (options.databaseAdapter) {
      this.databaseAdapter = options.databaseAdapter;
    }
  }

  // ============================================================================
  // FACTORY METHODS
  // ============================================================================
  static make<T extends Record<string, any>>(
    data: T,
    rules: ValidationRules,
    options: ValidatorOptions = {},
    messages: ValidationMessages = {},
    attributes: ValidationAttributes = {}
  ): Validator<T> {
    return new Validator<T>(data, rules, options, messages, attributes);
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================
  setDatabaseAdapter(adapter: DatabaseAdapter): this {
    this.databaseAdapter = adapter;
    return this;
  }

  setMessages(messages: ValidationMessages): this {
    this.messages = messages;
    return this;
  }

  setAttributes(attributes: ValidationAttributes): this {
    this.attributes = attributes;
    return this;
  }

  on(event: ValidationEventType, handler: ValidationEventHandler): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);
    return this;
  }

  protected emit(event: ValidationEvent): void {
    const handlers = this.events.get(event.type) ?? [];
    handlers.forEach((h) => h(event));
  }

  // ============================================================================
  // CUSTOM RULES
  // ============================================================================
  static registerValidator(name: string, fn: ValidationRuleFunction): void {
    this.customValidators[name] = fn;
  }

  static extend(name: string, fn: ValidationRuleFunction): void {
    this.registerValidator(name, fn);
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================
  async fails(): Promise<boolean> {
    await this.validateRules();
    return Object.keys(this.errors).length > 0;
  }

  async passes(): Promise<boolean> {
    return !(await this.fails());
  }

  errors_(): ValidationErrors {
    return this.errors;
  }

  async validate(): Promise<ValidatedData<TData>> {
    const validated = await this.validateRules();

    if (Object.keys(this.errors).length > 0 && this.options.throwOnFailure) {
      throw new ValidationException(
        this.errors,
        "The given data was invalid.",
        {
          validator: this,
        }
      );
    }

    return validated as ValidatedData<TData>;
  }

  // ============================================================================
  // CORE VALIDATION
  // ============================================================================
  protected async validateRules(): Promise<Partial<TData>> {
    this.errors = {};
    const validated: Partial<TData> = {};

    if (!this.databaseAdapter && this.needsDatabaseAdapter()) {
      await this.autoInjectDatabaseAdapter();
    }

    for (const [field, ruleDef] of Object.entries(this.rules)) {
      const normalizedRules = this.normalizeRule(ruleDef);
      const value = this.getValue(field);

      // support sometimes
      const hasSometimes = normalizedRules.some((r) => r.name === "sometimes");
      if (hasSometimes && value === undefined) {
        continue;
      }

      for (const rule of normalizedRules) {
        if (rule.name === "bail" && this.errors[field]?.length) {
          break;
        }

        // skip nullable
        if (rule.name === "nullable" && this.isEmpty(value)) {
          break;
        }

        // conditional rule
        if (typeof rule.when === "function" && !rule.when(this.data)) {
          continue;
        }

        const result = await this.applyRule(field, value, rule);
        if (result === false) {
          // applyRule handles errors
        }

        if (
          this.options.stopOnFirstFailure &&
          Object.keys(this.errors).length
        ) {
          return validated;
        }
        if (rule.bail && this.errors[field]?.length) {
          break;
        }
      }

      if (value !== undefined && !this.errors[field]) {
        validated[field as keyof TData] = value as any;
      }
    }

    return validated;
  }

  protected normalizeRule(rule: ValidationRule): NormalizedRule[] {
    if (typeof rule === "string") {
      return rule
        .split("|")
        .filter(Boolean)
        .map((segment) => this.parseStringRule(segment));
    }

    if (Array.isArray(rule)) {
      return rule.flatMap((r) => this.normalizeRule(r));
    }

    if (typeof rule === "function") {
      return [
        {
          name: "custom_fn",
          fn: rule,
        } as NormalizedRule,
      ];
    }

    return [
      {
        name: (rule as ValidationRuleObject).rule,
        params: rule.params,
        message: rule.message,
        when: rule.when,
        bail: rule.bail,
      } as NormalizedRule,
    ];
  }

  protected parseStringRule(segment: string): NormalizedRule {
    const [name, ...rest] = segment.split(":");
    const param = rest.join(":") || undefined;
    return { name, params: param } as NormalizedRule;
  }

  protected async applyRule(
    field: string,
    value: any,
    rule: NormalizedRule
  ): Promise<boolean> {
    const ruleName = rule.name;
    const params = rule.params;

    // skip non-required if empty
    if (this.isEmpty(value) && !this.isRequiredRule(ruleName)) {
      return true;
    }

    this.emit({
      type: "rule:start",
      field,
      rule: ruleName,
      value,
      timestamp: new Date(),
    });

    let passed = true;
    let message: string | undefined;

    try {
      if (ruleName === "custom_fn" && rule.fn) {
        const res = await rule.fn(value, this.data, field, params);
        passed = res === true;
        if (res !== true && typeof res === "string") message = res;
      } else if (Validator.customValidators[ruleName]) {
        const res = await Validator.customValidators[ruleName](
          value,
          this.data,
          field,
          params
        );
        passed = res === true;
        if (res !== true && typeof res === "string") message = res;
      } else {
        passed = await this.runBuiltInRule(ruleName, field, value, params);
      }
    } catch (error) {
      passed = false;
      message = error instanceof Error ? error.message : String(error);
    }

    if (!passed) {
      const finalMessage =
        message ||
        this.resolveMessage(field, ruleName, params) ||
        this.defaultMessage(field, ruleName, params);
      this.addError(field, finalMessage);
      this.emit({
        type: "rule:failed",
        field,
        rule: ruleName,
        value,
        message: finalMessage,
        timestamp: new Date(),
      });
      return false;
    }

    this.emit({
      type: "rule:end",
      field,
      rule: ruleName,
      value,
      timestamp: new Date(),
    });
    return true;
  }

  protected async runBuiltInRule(
    rule: string,
    field: string,
    value: any,
    params?: any
  ): Promise<boolean> {
    switch (rule) {
      case "bail":
        return true;
      case "sometimes":
        return true;
      case "nullable":
        return true;
      case "required":
        return !this.isEmpty(value);
      case "present":
        return field in this.data;
      case "filled":
        return !(value === undefined || value === null || value === "");
      case "string":
        return typeof value === "string";
      case "numeric":
        return !isNaN(Number(value));
      case "integer":
        return Number.isInteger(Number(value));
      case "float":
        return !isNaN(parseFloat(value));
      case "boolean":
        return (
          typeof value === "boolean" ||
          value === "true" ||
          value === "false" ||
          value === 0 ||
          value === 1
        );
      case "array":
        return Array.isArray(value);
      case "object":
        return (
          typeof value === "object" && value !== null && !Array.isArray(value)
        );
      case "json":
        return this.isValidJson(value);
      case "email": {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(String(value));
      }
      case "url":
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      case "uuid": {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(String(value));
      }
      case "ip":
        return net.isIP(String(value)) !== 0;
      case "ipv4":
        return net.isIP(String(value)) === 4;
      case "ipv6":
        return net.isIP(String(value)) === 6;
      case "mac_address": {
        const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        return macRegex.test(String(value));
      }
      case "alpha":
        return /^[A-Za-z]+$/.test(String(value));
      case "alpha_num":
        return /^[A-Za-z0-9]+$/.test(String(value));
      case "alpha_dash":
        return /^[A-Za-z0-9_-]+$/.test(String(value));
      case "regex":
        return this.testRegex(value, params, true);
      case "not_regex":
        return this.testRegex(value, params, false);
      case "min":
        return this.checkMin(value, params);
      case "max":
        return this.checkMax(value, params);
      case "size":
        return this.checkSize(value, params);
      case "between": {
        const [min, max] = this.toNumberArray(params);
        return this.checkMin(value, min) && this.checkMax(value, max);
      }
      case "gt":
        return this.compare(value, params, ">");
      case "gte":
        return this.compare(value, params, ">=");
      case "lt":
        return this.compare(value, params, "<");
      case "lte":
        return this.compare(value, params, "<=");
      case "in":
        return this.inArray(value, params, true);
      case "not_in":
        return this.inArray(value, params, false);
      case "same":
        return value === this.getValue(String(params));
      case "different":
        return value !== this.getValue(String(params));
      case "confirmed":
        return value === this.getValue(`${field}_confirmation`);
      case "date":
        return !isNaN(Date.parse(value));
      case "date_format":
        return this.matchDateFormat(value, params);
      case "before":
        return this.compareDate(value, params, "<");
      case "before_or_equal":
        return this.compareDate(value, params, "<=");
      case "after":
        return this.compareDate(value, params, ">");
      case "after_or_equal":
        return this.compareDate(value, params, ">=");
      case "accepted":
        return [true, "true", 1, "1", "yes", "on", "accept"].includes(
          value as any
        );
      case "declined":
        return [false, "false", 0, "0", "no", "off"].includes(value as any);
      case "unique":
        return await this.validateUnique(field, value, params);
      case "exists":
        return await this.validateExists(field, value, params);
      default:
        throw new Error(`Unknown validation rule: ${rule}`);
    }
  }

  // ============================================================================
  // BUILT-IN RULE HELPERS
  // ============================================================================
  protected testRegex(value: any, pattern: any, shouldMatch: boolean): boolean {
    if (!pattern) return true;
    const regex =
      pattern instanceof RegExp ? pattern : new RegExp(String(pattern));
    const result = regex.test(String(value));
    return shouldMatch ? result : !result;
  }

  protected checkMin(value: any, param: any): boolean {
    const min = Number(param);
    if (typeof value === "string" || Array.isArray(value))
      return value.length >= min;
    if (typeof value === "number") return value >= min;
    return false;
  }

  protected checkMax(value: any, param: any): boolean {
    const max = Number(param);
    if (typeof value === "string" || Array.isArray(value))
      return value.length <= max;
    if (typeof value === "number") return value <= max;
    return false;
  }

  protected checkSize(value: any, param: any): boolean {
    const size = Number(param);
    if (typeof value === "string" || Array.isArray(value))
      return value.length === size;
    if (typeof value === "number") return value === size;
    return false;
  }

  protected compare(
    value: any,
    other: any,
    op: ">" | ">=" | "<" | "<="
  ): boolean {
    const left = Number(value);
    const right = Number(other);
    if (isNaN(left) || isNaN(right)) return false;
    switch (op) {
      case ">":
        return left > right;
      case ">=":
        return left >= right;
      case "<":
        return left < right;
      case "<=":
        return left <= right;
    }
  }

  protected compareDate(
    value: any,
    other: any,
    op: ">" | ">=" | "<" | "<="
  ): boolean {
    const left = new Date(value).getTime();
    const right = new Date(other).getTime();
    if (isNaN(left) || isNaN(right)) return false;
    switch (op) {
      case ">":
        return left > right;
      case ">=":
        return left >= right;
      case "<":
        return left < right;
      case "<=":
        return left <= right;
    }
  }

  protected matchDateFormat(value: any, format: string): boolean {
    if (!format) return !isNaN(Date.parse(value));
    // Very light check: ensure same separators and segments length
    const parts = String(format).split(/[-/ :]/);
    const valParts = String(value).split(/[-/ :]/);
    if (parts.length !== valParts.length) return false;
    return !isNaN(Date.parse(value));
  }

  protected toNumberArray(params: any): [number, number] {
    if (Array.isArray(params)) return [Number(params[0]), Number(params[1])];
    const [a, b] = String(params).split(",");
    return [Number(a), Number(b)];
  }

  protected inArray(value: any, params: any, shouldBeIn: boolean): boolean {
    const list = Array.isArray(params)
      ? params
      : String(params)
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
    const exists = list.includes(String(value));
    return shouldBeIn ? exists : !exists;
  }

  // ============================================================================
  // DATABASE RULES
  // ============================================================================
  protected needsDatabaseAdapter(): boolean {
    for (const ruleDef of Object.values(this.rules)) {
      const rules = this.normalizeRule(ruleDef);
      for (const rule of rules) {
        if (rule.name === "unique" || rule.name === "exists") {
          return true;
        }
      }
    }
    return false;
  }

  protected async autoInjectDatabaseAdapter(): Promise<void> {
    try {
      const { Container } = await import("../di/Container");
      const container = Container.getInstance();
      this.databaseAdapter = await container.make("DatabaseAdapter");
    } catch (error) {
      throw new Error(
        "Database adapter not available. Ensure DatabaseProvider is registered."
      );
    }
  }

  protected async validateUnique(
    field: string,
    value: any,
    param: any
  ): Promise<boolean> {
    if (!this.databaseAdapter) {
      throw new Error(
        "Database adapter not set. Use setDatabaseAdapter() before using unique rule."
      );
    }

    const [table, column = field, ignoreId, ignoreColumn = "id"] =
      String(param).split(",");
    if (!table) return false;

    const query = new QueryBuilder(table, this.databaseAdapter);
    query.where(column, value);
    if (ignoreId) {
      query.where(ignoreColumn, "!=", ignoreId);
    }

    const count = await query.count();
    return count === 0;
  }

  protected async validateExists(
    field: string,
    value: any,
    param: any
  ): Promise<boolean> {
    if (!this.databaseAdapter) {
      throw new Error(
        "Database adapter not set. Use setDatabaseAdapter() before using exists rule."
      );
    }

    const [table, column = "id"] = String(param).split(",");
    if (!table) return false;

    const query = new QueryBuilder(table, this.databaseAdapter);
    query.where(column, value);

    return await query.exists();
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================
  protected getValue(field: string): any {
    return field.split(".").reduce((obj: any, key) => obj?.[key], this.data);
  }

  protected isValidJson(value: any): boolean {
    if (typeof value !== "string") return false;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  protected isEmpty(value: any): boolean {
    return value === undefined || value === null || value === "";
  }

  protected isRequiredRule(ruleName: string): boolean {
    return [
      "required",
      "required_if",
      "required_unless",
      "present",
      "filled",
    ].includes(ruleName);
  }

  protected addError(field: string, message: string): void {
    if (!this.errors[field]) {
      this.errors[field] = [];
    }
    this.errors[field].push(message);
  }

  protected resolveMessage(
    field: string,
    rule: string,
    params?: any
  ): string | undefined {
    // field.rule specific
    const key = `${field}.${rule}`;
    if (this.messages[key]) {
      const msg = this.messages[key];
      return typeof msg === "string" ? msg : (msg as any)[rule];
    }

    // rule global
    if (this.messages[rule]) {
      const msg = this.messages[rule];
      if (typeof msg === "string") return msg;
    }

    // field only
    if (this.messages[field] && typeof this.messages[field] === "string") {
      return this.messages[field] as string;
    }

    return undefined;
  }

  protected defaultMessage(field: string, rule: string, params?: any): string {
    const niceField = this.attributes[field] ?? field;
    switch (rule) {
      case "required":
        return `${niceField} is required.`;
      case "present":
        return `${niceField} must be present.`;
      case "filled":
        return `${niceField} must not be empty.`;
      case "string":
        return `${niceField} must be a string.`;
      case "numeric":
        return `${niceField} must be a number.`;
      case "integer":
        return `${niceField} must be an integer.`;
      case "float":
        return `${niceField} must be a float.`;
      case "boolean":
        return `${niceField} must be a boolean.`;
      case "array":
        return `${niceField} must be an array.`;
      case "object":
        return `${niceField} must be an object.`;
      case "json":
        return `${niceField} must be a valid JSON string.`;
      case "email":
        return `${niceField} must be a valid email address.`;
      case "url":
        return `${niceField} must be a valid URL.`;
      case "uuid":
        return `${niceField} must be a valid UUID.`;
      case "ip":
        return `${niceField} must be a valid IP address.`;
      case "ipv4":
        return `${niceField} must be a valid IPv4 address.`;
      case "ipv6":
        return `${niceField} must be a valid IPv6 address.`;
      case "alpha":
        return `${niceField} may only contain letters.`;
      case "alpha_num":
        return `${niceField} may only contain letters and numbers.`;
      case "alpha_dash":
        return `${niceField} may only contain letters, numbers, dashes and underscores.`;
      case "min":
        return `${niceField} must be at least ${params}.`;
      case "max":
        return `${niceField} must not be greater than ${params}.`;
      case "size":
        return `${niceField} must be ${params}.`;
      case "between": {
        const [a, b] = this.toNumberArray(params);
        return `${niceField} must be between ${a} and ${b}.`;
      }
      case "in":
        return `${niceField} is invalid.`;
      case "not_in":
        return `${niceField} is invalid.`;
      case "same":
        return `${niceField} must match ${params}.`;
      case "different":
        return `${niceField} must be different from ${params}.`;
      case "confirmed":
        return `${niceField} confirmation does not match.`;
      case "gt":
        return `${niceField} must be greater than ${params}.`;
      case "gte":
        return `${niceField} must be greater than or equal to ${params}.`;
      case "lt":
        return `${niceField} must be less than ${params}.`;
      case "lte":
        return `${niceField} must be less than or equal to ${params}.`;
      case "date":
        return `${niceField} must be a valid date.`;
      case "date_format":
        return `${niceField} does not match the date format.`;
      case "before":
        return `${niceField} must be before ${params}.`;
      case "before_or_equal":
        return `${niceField} must be before or equal to ${params}.`;
      case "after":
        return `${niceField} must be after ${params}.`;
      case "after_or_equal":
        return `${niceField} must be after or equal to ${params}.`;
      case "unique":
        return `${niceField} has already been taken.`;
      case "exists":
        return `${niceField} is invalid.`;
      default:
        return `${niceField} is invalid.`;
    }
  }
}
