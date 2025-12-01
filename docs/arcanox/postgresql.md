# 🐘 Advanced PostgreSQL Usage in Arcanox

PostgreSQL is a powerful object-relational database system. Arcanox allows you to leverage its advanced features like JSONB, Full Text Search, and more.

## 1. Raw SQL Queries

Execute raw SQL when you need complex joins, window functions, or CTEs.

```typescript
import { User } from "app/Models/User";

// Complex query with CTE
const result = await User.adapter.raw(
  `
  WITH regional_sales AS (
    SELECT region, SUM(amount) as total_sales
    FROM orders
    GROUP BY region
  )
  SELECT * FROM regional_sales WHERE total_sales > ?
`,
  [10000]
);
```

## 2. Transactions

PostgreSQL transactions work identically to MySQL in Arcanox.

```typescript
const adapter = User.adapter;

try {
  await adapter.beginTransaction();
  // ... operations
  await adapter.commit();
} catch (e) {
  await adapter.rollback();
}
```

## 3. JSONB Support

PostgreSQL's `JSONB` is faster and more powerful than standard JSON.

**Model Definition:**

```typescript
class Product extends Model {
  protected casts = {
    attributes: "json", // Maps to JSONB in Postgres adapter if configured
  };
}
```

**Querying JSONB:**
You can use the `@>` operator for containment queries via raw clauses.

```typescript
// Find products with specific attributes
await Product.query()
  .whereRaw("attributes @> ?", [JSON.stringify({ color: "red" })])
  .get();
```

## 4. Full Text Search

PostgreSQL has built-in full text search. You can add a macro to support it easily.

```typescript
import { QueryBuilder } from "arcanajs/arcanox";

QueryBuilder.macro("search", function (query) {
  return this.whereRaw(
    "to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', ?)",
    [query]
  );
});

// Usage
await Post.query().search("arcanajs framework").get();
```

## 5. Array Columns

PostgreSQL supports array columns (e.g., `text[]`).

**Model Definition:**

```typescript
class Post extends Model {
  protected casts = {
    tags: "array", // Custom cast needed or handle as raw
  };
}
```

**Querying Arrays:**

```typescript
// Find posts containing a specific tag
await Post.query().whereRaw("? = ANY(tags)", ["javascript"]).get();
```

## 6. Joins with Table Aliases

Arcanox's Query Builder fully supports SQL joins with table aliases in PostgreSQL, enabling complex multi-table queries.

### Basic Join with Alias

```typescript
import { Post } from "app/Models/Post";

// Join users table with alias 'u'
const posts = await Post.query()
  .join("users as u", "posts.author_id", "=", "u.id")
  .select("posts.*", "u.name as authorName", "u.email as authorEmail")
  .get();

console.log(posts[0].authorName); // Access aliased column
```

### Finding a Specific Post with Author

```typescript
// Exactly matching the user's requested syntax
const post = await Post.query()
  .where("posts.id", postId)
  .join("users as u", "posts.author_id", "=", "u.id")
  .select("posts.*", "u.name as authorName")
  .first();

console.log(post.authorName); // Author's name from joined table
```

### Multiple Joins with Aliases

```typescript
const posts = await Post.query()
  .join("users as author", "posts.author_id", "=", "author.id")
  .join("categories as cat", "posts.category_id", "=", "cat.id")
  .select("posts.*", "author.name as authorName", "cat.name as categoryName")
  .get();
```

### Left Join with Alias

```typescript
// Include posts even if they don't have an author
const posts = await Post.query()
  .leftJoin("users as u", "posts.author_id", "=", "u.id")
  .select("posts.*", "u.name as authorName")
  .get();
```

### Complex Join Conditions

```typescript
const posts = await Post.query()
  .join("users as u", "posts.author_id", "=", "u.id")
  .where("posts.status", "published")
  .where("u.role", "admin")
  .select("posts.*", "u.name as authorName")
  .orderBy("posts.created_at", "DESC")
  .get();
```

### PostgreSQL-Specific: JSONB Column Joins

```typescript
// Join on JSONB field using raw SQL for the join condition
const posts = await Post.query()
  .join("users as u", "posts.metadata->>'author_id'", "=", "u.id")
  .select("posts.*", "u.name as authorName")
  .get();

// For more complex JSONB joins, use raw queries
const result = await Post.adapter.raw(
  `
  SELECT posts.*, u.name as author_name
  FROM posts
  JOIN users u ON (posts.metadata->>'author_id')::int = u.id
  WHERE posts.status = $1
`,
  ["published"]
);
```
