# 🐬 Advanced MySQL Usage in Arcanox

Arcanox provides a seamless experience for MySQL, but for performance optimization or specific features, you might need to go deeper. This guide covers MySQL-specific functionalities.

## 1. Raw SQL Queries

Sometimes the Query Builder isn't enough. You can execute raw SQL directly.

```typescript
import { User } from "app/Models/User";

// Select with raw query
const users = await User.adapter.raw(
  "SELECT * FROM users WHERE created_at > ?",
  ["2023-01-01"]
);

// Update with raw query
await User.adapter.raw(
  "UPDATE users SET status = 'active' WHERE last_login > DATE_SUB(NOW(), INTERVAL 30 DAY)"
);
```

## 2. Transactions

Ensure data integrity with ACID transactions.

```typescript
import { User } from "app/Models/User";

const adapter = User.adapter;

try {
  await adapter.beginTransaction();

  const user = await User.create({ name: "John", email: "john@example.com" });
  await Profile.create({ user_id: user.id, bio: "Hello" });

  await adapter.commit();
} catch (error) {
  await adapter.rollback();
  throw error;
}
```

## 3. JSON Columns

MySQL 5.7+ supports JSON columns. Arcanox handles JSON serialization automatically if you cast the column.

**Model Definition:**

```typescript
class User extends Model {
  protected casts = {
    settings: "json",
  };
}
```

**Querying JSON (via Raw Where):**

```typescript
// Find users where settings.theme is 'dark'
// Note: Standard where() doesn't support -> syntax yet, so use raw where or a macro
await User.query().whereRaw("settings->'$.theme' = ?", ["dark"]).get();
```

## 4. Stored Procedures

You can call stored procedures using `raw`.

```typescript
const result = await User.adapter.raw("CALL GetUserStats(?)", [userId]);
```

## 5. Joins with Table Aliases

Arcanox's Query Builder fully supports SQL joins with table aliases, making it easy to work with complex queries involving multiple tables.

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

## 6. Macros for MySQL Specifics

You can extend the Query Builder to add MySQL-specific helpers.

```typescript
import { QueryBuilder } from "arcanajs/arcanox";

// Add a 'whereJson' macro
QueryBuilder.macro("whereJson", function (column, key, value) {
  return this.whereRaw(`${column}->'$.${key}' = ?`, [value]);
});

// Usage
await User.query().whereJson("settings", "theme", "dark").get();
```
