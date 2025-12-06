/**
 * Database connection interface
 */
export interface Connection {
  query(sql: string, params?: any[]): Promise<any>;
  execute(sql: string, params?: any[]): Promise<any>;
  close(): Promise<void>;
}

/**
 * Database adapter interface - implements database-specific operations
 */
export interface DatabaseAdapter {
  connect(config: DatabaseConfig): Promise<Connection>;
  disconnect(): Promise<void>;

  // Schema operations
  createTable(tableName: string, columns: ColumnDefinition[]): Promise<void>;
  dropTable(tableName: string): Promise<void>;
  hasTable(tableName: string): Promise<boolean>;
  hasColumn(tableName: string, columnName: string): Promise<boolean>;

  // Query operations
  select(table: string, options: SelectOptions): Promise<any[]>;
  insert(table: string, data: Record<string, any>): Promise<any>;
  update(table: string, id: any, data: Record<string, any>): Promise<any>;
  delete(table: string, id: any): Promise<boolean>;

  // Transaction support
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;

  // Raw query support
  raw(query: string, params?: any[]): Promise<any>;
}

export interface DatabaseConfig {
  type: "postgres" | "mysql" | "mongodb";
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  url?: string;
  uri?: string;
  pool?: {
    min?: number;
    max?: number;
  };
}

export interface ColumnDefinition {
  name: string;
  type: string;
  length?: number;
  nullable?: boolean;
  default?: any;
  unique?: boolean;
  primary?: boolean;
  autoIncrement?: boolean;
  unsigned?: boolean;
}

export interface SelectOptions {
  columns?: string[];
  where?: WhereClause[];
  orderBy?: OrderByClause[];
  limit?: number;
  offset?: number;
  joins?: JoinClause[];
}

export interface WhereClause {
  column: string;
  operator:
    | "="
    | "!="
    | ">"
    | "<"
    | ">="
    | "<="
    | "LIKE"
    | "IN"
    | "NOT IN"
    | "BETWEEN"
    | "IS NULL"
    | "IS NOT NULL";
  value: any;
  boolean?: "AND" | "OR";
}

export interface OrderByClause {
  column: string;
  direction: "ASC" | "DESC";
}

export interface JoinClause {
  type: "INNER" | "LEFT" | "RIGHT";
  table: string;
  first: string;
  operator: string;
  second: string;
}
