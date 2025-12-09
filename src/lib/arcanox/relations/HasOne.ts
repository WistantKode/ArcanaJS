import { Model } from "../Model";
import { QueryBuilder } from "../QueryBuilder";
import { Relation } from "./Relation";

/**
 * HasOne Relationship
 * Defines a one-to-one relationship where the related model contains the foreign key
 */
export class HasOne<R extends Model = any> extends Relation<R> {
  protected foreignKey: string;
  protected localKey: string;

  constructor(
    query: QueryBuilder<R>,
    parent: Model,
    foreignKey: string,
    localKey: string
  ) {
    super(query, parent);
    this.foreignKey = foreignKey;
    this.localKey = localKey;
  }

  /**
   * Add the base constraints for the relation
   */
  addConstraints(): void {
    const localValue = this.parent.getAttribute(this.localKey);
    this.query.where(this.foreignKey, "=", localValue);
  }

  /**
   * Add eager loading constraints for multiple models
   */
  addEagerConstraints(models: Model[]): void {
    const keys = models
      .map((model) => model.getAttribute(this.localKey))
      .filter((k) => k !== null && k !== undefined);
    this.query.whereIn(this.foreignKey, keys);
  }

  /**
   * Match eagerly loaded results to their parent models
   */
  match(models: Model[], results: R[], relation: string): Model[] {
    const dictionary: Record<string, R> = {};

    results.forEach((result) => {
      const key = this.normalizeKey(result.getAttribute(this.foreignKey));
      dictionary[key] = result;
    });

    models.forEach((model) => {
      const key = this.normalizeKey(model.getAttribute(this.localKey));
      const related = dictionary[key] || this.getDefaultFor(model);
      model.setRelation(relation, related);
    });

    return models;
  }

  /**
   * Get the results of the relationship
   */
  async getResults(): Promise<R | null> {
    const result = await this.first();
    return result || this.getDefaultFor(this.parent);
  }

  /**
   * Get the foreign key name
   */
  getForeignKeyName(): string {
    return this.foreignKey;
  }

  /**
   * Get the local key name
   */
  getLocalKeyName(): string {
    return this.localKey;
  }

  /**
   * Get the qualified foreign key name
   */
  getQualifiedForeignKeyName(): string {
    const relatedTable = (
      this.related.prototype.constructor as typeof Model
    ).getTable();
    return `${relatedTable}.${this.foreignKey}`;
  }

  /**
   * Get the qualified parent key name
   */
  getQualifiedParentKeyName(): string {
    const parentTable = (this.parent.constructor as typeof Model).getTable();
    return `${parentTable}.${this.localKey}`;
  }

  /**
   * Set the foreign attributes for creating a new model
   */
  protected setForeignAttributesForCreate(model: R): void {
    (model as any).setAttribute(
      this.foreignKey,
      this.parent.getAttribute(this.localKey)
    );
  }

  /**
   * Create or update the related model
   */
  async save(model: R): Promise<R> {
    this.setForeignAttributesForCreate(model);
    await (model as any).save();
    return model;
  }

  /**
   * Associate the related model with the parent (alias for create)
   */
  async make(attributes: Record<string, any>): Promise<R> {
    const instance = new this.related();
    (instance as any).fill(attributes);
    this.setForeignAttributesForCreate(instance);
    return instance;
  }

  /**
   * Update the related model or create a new one
   */
  async updateOrCreate(
    attributes: Record<string, any>,
    values: Record<string, any> = {}
  ): Promise<R> {
    const existing = await this.first();

    if (existing) {
      await (existing as any).update(values);
      return existing;
    }

    return this.create({ ...attributes, ...values });
  }

  /**
   * Get the first related model or create a new one
   */
  async firstOrCreate(
    attributes: Record<string, any>,
    values: Record<string, any> = {}
  ): Promise<R> {
    const existing = await this.where(
      Object.keys(attributes)[0],
      Object.values(attributes)[0]
    ).first();

    if (existing) {
      return existing;
    }

    return this.create({ ...attributes, ...values });
  }

  /**
   * Get the first related model or return a new instance
   */
  async firstOrNew(
    attributes: Record<string, any>,
    values: Record<string, any> = {}
  ): Promise<R> {
    const existing = await this.where(
      Object.keys(attributes)[0],
      Object.values(attributes)[0]
    ).first();

    if (existing) {
      return existing;
    }

    return this.make({ ...attributes, ...values });
  }
}
