import type { Faker } from "@faker-js/faker";
import { Model } from "../Model";

/**
 * Base Factory class
 */
export abstract class Factory<T extends Model> {
  protected abstract model: new () => T;
  protected faker: Faker;

  constructor() {
    // We'll load faker dynamically to avoid bundling it if not used
    // But for type safety we declare it here
    this.faker = require("@faker-js/faker").faker;
  }

  /**
   * Define the model's default state.
   */
  abstract definition(): Record<string, any>;

  /**
   * Create a new model instance with attributes.
   */
  make(attributes: Partial<T> = {}): T {
    const instance = new this.model();
    const defaults = this.definition();

    // Merge defaults with overrides
    const data = { ...defaults, ...attributes };

    // Fill model
    instance.fill(data);

    return instance;
  }

  /**
   * Create and save a new model instance.
   */
  async create(attributes: Partial<T> = {}): Promise<T> {
    const instance = this.make(attributes);
    await instance.save();
    return instance;
  }

  /**
   * Create multiple instances
   */
  async createMany(count: number, attributes: Partial<T> = {}): Promise<T[]> {
    const instances: T[] = [];
    for (let i = 0; i < count; i++) {
      instances.push(await this.create(attributes));
    }
    return instances;
  }
}
