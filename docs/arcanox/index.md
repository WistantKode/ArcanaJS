# 🔮 Arcanox ORM Documentation

Arcanox is a powerful, Eloquent-style ORM for Node.js, built specifically for the ArcanaJS framework. It provides a beautiful, fluent interface for working with your database, supporting MySQL, PostgreSQL, and MongoDB out of the box.

## 📚 Table of Contents

1. [Getting Started](#getting-started)
2. [Schema Builder](#schema-builder)
3. [Models](#models)
4. [Query Builder](#query-builder)
5. [Relationships](#relationships)
6. [Extensibility](#extensibility)
7. [MongoDB Specifics](#mongodb-specifics)
8. [MySQL Specifics](#mysql-specifics)
9. [PostgreSQL Specifics](#postgresql-specifics)
  
---

## <a name="getting-started"></a> 🚀 Getting Started

### Configuration

Arcanox is configured in `database/config.ts`. You can define multiple connections and choose your default driver.

```typescript
import { DatabaseConfig } from "arcanajs/arcanox";

export const config: DatabaseConfig = {
  default: process.env.DB_CONNECTION || "mysql",

  connections: {
    mysql: {
      driver: "mysql",
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT) || 3306,
      database: process.env.DB_DATABASE || "arcanajs",
      username: process.env.DB_USERNAME || "root",
      password: process.env.DB_PASSWORD || "",
    },
    // ... postgres and mongo configurations
  },
};
```

---

## <a name="schema-builder"></a> 🏗️ Schema Builder

Arcanox provides a database-agnostic way to create and modify tables.

### Creating Tables

Use `Schema.create` in your migrations:

```typescript
import { Schema, Blueprint } from "arcanajs/arcanox";

export async function up() {
  await Schema.create("users", (table: Blueprint) => {
    table.id(); // Auto-incrementing primary key
    table.string("name");
    table.string("email").unique();
    table.string("password");
    table.boolean("is_admin").default(false);
    table.timestamps(); // created_at and updated_at
  });
}
```

### Available Column Types

- `table.id()`
- `table.string('name', length?)`
- `table.text('bio')`
- `table.integer('age')`
- `table.boolean('is_active')`
- `table.date('birthdate')`
- `table.json('settings')`
- `table.timestamps()`

---

## <a name="models"></a> 🧠 Models

Models are the heart of Arcanox. Each database table has a corresponding "Model" which is used to interact with that table.

### Defining a Model

```typescript
import { Model } from "arcanajs/arcanox";

export class User extends Model {
  // Optional: Specify table name (defaults to snake_case plural of class name)
  static tableName = "users";

  // Optional: Specify fillable attributes for mass assignment
  protected fillable = ["name", "email", "password"];

  // Optional: Hide attributes from JSON serialization
  protected hidden = ["password"];
}
```

### Retrieving Models

```typescript
// Get all users
const users = await User.all();

// Find by primary key
const user = await User.find(1);

// Find or throw 404 error
const user = await User.findOrFail(1);
```

### Creating & Updating

```typescript
// Create a new user
const user = await User.create({
  name: "John Doe",
  email: "john@example.com",
});

// Update a user
user.name = "Jane Doe";
await user.save();

// Mass update
await User.update(1, { name: "Jane Doe" });
```

---

## <a name="query-builder"></a> 🔍 Query Builder

The Query Builder provides a fluent interface for creating database queries.

### Basic Queries

```typescript
const users = await User.where("votes", ">", 100)
  .where("status", "active")
  .orderBy("name", "ASC")
  .limit(10)
  .get();
```

### Available Methods

- `where(column, operator, value)`
- `where(column, value)` (implies "=")
- `orWhere(...)`
- `whereIn(column, values)`
- `orderBy(column, direction)`
- `limit(number)`
- `offset(number)`
- `count()`
- `first()`
- `get()`

---

## <a name="relationships"></a> 🤝 Relationships

Arcanox supports standard database relationships.

### One to One

```typescript
class User extends Model {
  profile() {
    return this.hasOne(Profile);
  }
}

// Usage
const profile = await user.profile().first();
```

### One to Many

```typescript
class Post extends Model {
  comments() {
    return this.hasMany(Comment);
  }
}

// Usage
const comments = await post.comments().get();
```

### Belongs To

```typescript
class Comment extends Model {
  post() {
    return this.belongsTo(Post);
  }
}
```

### Many to Many

```typescript
class User extends Model {
  roles() {
    return this.belongsToMany(Role);
  }
}
```

---

## <a name="extensibility"></a> 🔌 Extensibility

Arcanox is designed to be extensible.

### Macros

You can add custom methods to the Query Builder or Models at runtime.

```typescript
import { QueryBuilder } from "arcanajs/arcanox";

QueryBuilder.macro("active", function () {
  return this.where("status", "active");
});

// Usage
const activeUsers = await User.query().active().get();
```

### Raw Queries

For complex queries specific to your database driver, use the `raw` method.

```typescript
// Get the raw database connection/client
const db = await User.adapter.raw("db"); // For Mongo
// or
const result = await User.adapter.raw("SELECT * FROM users WHERE id = ?", [1]); // For SQL
```

---

## <a name="database-specifics"></a> 🗄️ Database Specifics

Arcanox provides a unified API, but also allows you to dive deep into driver-specific features.

- **[MySQL Guide](./mysql.md)**: Raw queries, JSON columns, Stored Procedures.
- **[PostgreSQL Guide](./postgresql.md)**: JSONB, Full Text Search, Array columns.
- **[MongoDB Guide](./mongodb.md)**: Aggregation, Geospatial, Atomic Updates.
