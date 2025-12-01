import { Model } from "../Model";
import { QueryBuilder } from "../QueryBuilder";

export abstract class Relation<R extends Model = any> {
  protected query: QueryBuilder<R>;
  protected parent: Model;
  protected related: new () => R;

  constructor(query: QueryBuilder<R>, parent: Model) {
    this.query = query;
    this.parent = parent;
    this.related = (query as any).model;
    this.addConstraints();
  }

  abstract addConstraints(): void;

  abstract addEagerConstraints(models: Model[]): void;

  abstract match(models: Model[], results: R[], relation: string): Model[];

  getQuery(): QueryBuilder<R> {
    return this.query;
  }

  async get(): Promise<R[]> {
    return this.query.get();
  }

  async first(): Promise<R | null> {
    return this.query.first();
  }
}
