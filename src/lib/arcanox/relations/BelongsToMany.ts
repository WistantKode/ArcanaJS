import { Model } from "../Model";
import { QueryBuilder } from "../QueryBuilder";
import { Relation } from "./Relation";

export class BelongsToMany<R extends Model = any> extends Relation<R> {
  protected table: string;
  protected foreignPivotKey: string;
  protected relatedPivotKey: string;
  protected parentKey: string;
  protected relatedKey: string;

  constructor(
    query: QueryBuilder<R>,
    parent: Model,
    table: string,
    foreignPivotKey: string,
    relatedPivotKey: string,
    parentKey: string,
    relatedKey: string
  ) {
    super(query, parent);
    this.table = table;
    this.foreignPivotKey = foreignPivotKey;
    this.relatedPivotKey = relatedPivotKey;
    this.parentKey = parentKey;
    this.relatedKey = relatedKey;
  }

  addConstraints(): void {
    this.performJoin();
    this.query.where(
      `${this.table}.${this.foreignPivotKey}`,
      "=",
      this.parent.getAttribute(this.parentKey)
    );
  }

  protected performJoin(query?: QueryBuilder<R>): this {
    const q = query || this.query;
    const relatedTable = this.related.prototype.getTable();

    q.join(
      this.table,
      `${relatedTable}.${this.relatedKey}`,
      "=",
      `${this.table}.${this.relatedPivotKey}`
    );

    return this;
  }

  addEagerConstraints(models: Model[]): void {
    this.performJoin();
    const keys = models
      .map((model) => model.getAttribute(this.parentKey))
      .filter((k) => k !== null);
    this.query.whereIn(`${this.table}.${this.foreignPivotKey}`, keys);
  }

  match(models: Model[], results: R[], relation: string): Model[] {
    const dictionary: Record<string, R[]> = {};

    // In a real implementation, we'd select the pivot fields to map correctly
    // For now, we'll assume the results contain the pivot data or we re-query
    // This is a simplified implementation

    // TODO: Implement proper pivot mapping
    // For now, we'll just map based on the assumption that results are correct

    return models;
  }
}
