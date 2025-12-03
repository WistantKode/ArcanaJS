export { MongoAdapter } from "./adapters/MongoAdapter";
export { MySQLAdapter } from "./adapters/MySQLAdapter";
export { PostgresAdapter } from "./adapters/PostgresAdapter";
export { Model } from "./Model";
export { QueryBuilder } from "./QueryBuilder";
export { BelongsTo } from "./relations/BelongsTo";
export { BelongsToMany } from "./relations/BelongsToMany";
export { HasMany } from "./relations/HasMany";
export { HasOne } from "./relations/HasOne";
export { Relation } from "./relations/Relation";
export { Macroable } from "./support/Macroable";
export type {
  ColumnDefinition,
  Connection,
  DatabaseAdapter,
  DatabaseConfig,
  JoinClause,
  OrderByClause,
  SelectOptions,
  WhereClause,
} from "./types";

// MongoDB Extensions (must be imported to register macros)
export * from "./extensions/MongoExtensions";

export { DatabaseProvider } from "./providers/DatabaseProvider";
