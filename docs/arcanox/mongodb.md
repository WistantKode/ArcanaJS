# 🍃 Advanced MongoDB Usage in Arcanox

Arcanox provides a powerful abstraction over MongoDB with built-in extensions that give you Mongoose-style functionality. This guide explains how to leverage MongoDB-specific features including Population (relationships), Aggregation Pipelines, Geospatial Queries, and Atomic Updates.

## Built-in MongoDB Extensions

Arcanox automatically provides MongoDB-specific methods when you import from `arcanajs/arcanox`. These extensions are registered automatically and include:

- **`populate()`** - Mongoose-style relationships using `$lookup`
- **`exec()`** - Alias for `get()` to match Mongoose syntax
- **`aggregate()`** - Direct access to MongoDB aggregation pipelines

Simply import Arcanox and start using these methods:

```typescript
import { Model, QueryBuilder } from "arcanajs/arcanox";

// The MongoDB extensions are automatically available!
const posts = await Post.query()
  .where("status", "published")
  .populate("author")
  .exec();
```

## 1. Accessing the Raw Database Instance

You can bypass the Query Builder and access the native MongoDB `Db` instance directly using the `raw` method.

```typescript
import { Model } from "arcanajs/arcanox";

// Get the native MongoDB Db instance
const db = await User.adapter.raw("db");

// Now you can use any MongoDB driver method
const collection = db.collection("users");
const stats = await collection.stats();
```

## 2. Population (Mongoose-style Relationships)

MongoDB doesn't have SQL-style joins, but Arcanox provides a built-in `populate()` method that uses aggregation pipelines with `$lookup` to achieve similar functionality.

### Basic Population

```typescript
// Populate author field (assumes author_id -> authors collection)
const post = await Post.query().where("id", postId).populate("author").exec();

console.log(post[0].author.name); // Access populated author data
```

### How It Works

The `populate()` method uses smart defaults:

- **Collection name**: `${field}s` (e.g., 'author' → 'authors')
- **Local field**: `${field}_id` (e.g., 'author_id')
- **Foreign field**: `_id`
- **Result field**: Same as the field name

### Custom Population Options

You can customize the population behavior:

```typescript
const post = await Post.query()
  .where("id", postId)
  .populate("author", {
    from: "users", // Collection to join with
    localField: "author_id", // Field in posts
    foreignField: "_id", // Field in users
    as: "author", // Name of populated field
  })
  .exec();
```

### Population with Field Selection

Select only specific fields from the populated document:

```typescript
const post = await Post.query()
  .where("id", postId)
  .populate("author", {
    select: ["name", "email"], // Only include name and email from author
  })
  .exec();
```

### Multiple Populations

Chain multiple `populate()` calls to populate multiple relationships:

```typescript
const post = await Post.query()
  .where("id", postId)
  .populate("author")
  .populate("category")
  .populate("tags")
  .exec();
```

### TypeScript Support

The `populate()` method is fully typed:

```typescript
interface PopulateOptions {
  from?: string; // Collection to join with
  localField?: string; // Field in current collection
  foreignField?: string; // Field in related collection
  as?: string; // Name for populated field
  select?: string[]; // Fields to include from populated document
}
```

## 3. Aggregation Pipeline

Arcanox provides a built-in `aggregate()` method for direct access to MongoDB's powerful aggregation framework.

### Basic Aggregation

```typescript
const report = await User.query().aggregate([
  { $match: { status: "active" } },
  { $group: { _id: "$role", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);

console.log(report);
// [
//   { id: "admin", _id: "admin", count: 5 },
//   { id: "user", _id: "user", count: 42 }
// ]
```

### Complex Aggregations

```typescript
const analytics = await Order.query().aggregate([
  {
    $match: {
      createdAt: { $gte: new Date("2024-01-01") },
    },
  },
  {
    $group: {
      _id: {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      },
      totalRevenue: { $sum: "$amount" },
      orderCount: { $sum: 1 },
      avgOrderValue: { $avg: "$amount" },
    },
  },
  {
    $sort: { "_id.year": 1, "_id.month": 1 },
  },
]);
```

### Aggregation with Lookups

You can manually build complex aggregation pipelines:

```typescript
const postsWithAuthors = await Post.query().aggregate([
  { $match: { status: "published" } },
  {
    $lookup: {
      from: "users",
      localField: "author_id",
      foreignField: "_id",
      as: "author",
    },
  },
  { $unwind: "$author" },
  {
    $project: {
      title: 1,
      content: 1,
      "author.name": 1,
      "author.email": 1,
    },
  },
]);
```

## 4. Geospatial Queries

MongoDB is famous for its geospatial capabilities. You can add custom geospatial methods using macros.

### Defining a Geospatial Macro

Add this to your application boot process (e.g., in a Service Provider or `src/server/index.ts`):

```typescript
import { QueryBuilder } from "arcanajs/arcanox";

QueryBuilder.macro(
  "near",
  function (longitude: number, latitude: number, maxDistance: number = 1000) {
    return this.where("location", {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    });
  }
);
```

### Usage

```typescript
const nearbyUsers = await User.query()
  .near(-73.9667, 40.78, 5000) // 5km radius
  .get();
```

### Creating Geospatial Indexes

```typescript
const db = await User.adapter.raw("db");
const collection = db.collection("users");

await collection.createIndex({ location: "2dsphere" });
```

## 5. Atomic Updates

Arcanox's `update` method replaces fields, but sometimes you want to use atomic operators like `$inc`, `$push`, or `$pull`.

### Defining Atomic Update Macros

Add this to your application boot process:

```typescript
import { Model } from "arcanajs/arcanox";

Model.macro("increment", async function (column: string, amount: number = 1) {
  const db = await this.constructor.adapter.raw("db");
  const collection = db.collection(this.constructor.getTable());

  await collection.updateOne(
    { _id: this.attributes._id },
    { $inc: { [column]: amount } }
  );

  // Update local attribute
  this.attributes[column] = (this.attributes[column] || 0) + amount;
  return this;
});

Model.macro("push", async function (column: string, value: any) {
  const db = await this.constructor.adapter.raw("db");
  const collection = db.collection(this.constructor.getTable());

  await collection.updateOne(
    { _id: this.attributes._id },
    { $push: { [column]: value } }
  );

  // Update local attribute
  if (!Array.isArray(this.attributes[column])) {
    this.attributes[column] = [];
  }
  this.attributes[column].push(value);
  return this;
});
```

### Usage

```typescript
const post = await Post.find(1);

// Increment views counter
await post.increment("views");

// Add a tag
await post.push("tags", "featured");
```

## 6. Using Native MongoDB Operators in Where Clauses

The `MongoAdapter` already supports passing raw MongoDB operator objects as values in `where` clauses.

```typescript
// Find users with age > 25
await User.where("age", ">", 25).get();

// Find users with specific tag in array
await User.where("tags", "IN", ["developer"]).get();

// Complex raw filter (passing object as value)
await User.where("metadata", "=", { $exists: true }).get();

// Text search
await Post.where("content", "=", { $regex: /mongodb/i }).get();

// Array operations
await User.where("roles", "=", { $all: ["admin", "moderator"] }).get();
```

## 7. Working with ObjectIds

MongoDB uses ObjectIds for document identifiers. Arcanox handles this automatically:

```typescript
import { ObjectId } from "mongodb";

// Arcanox automatically converts string IDs to ObjectIds
const user = await User.find("507f1f77bcf86cd799439011");

// You can also use ObjectId directly
const userId = new ObjectId("507f1f77bcf86cd799439011");
const user = await User.find(userId);

// Results always include both id and _id
console.log(user.id); // ObjectId instance
console.log(user._id); // ObjectId instance (same as id)
```

## 8. Custom Aggregation Helpers

You can create reusable aggregation helpers using macros:

```typescript
import { QueryBuilder } from "arcanajs/arcanox";

// Add a faceted search macro
QueryBuilder.macro(
  "facetedSearch",
  async function (searchTerm: string, facets: Record<string, any>) {
    const pipeline = [
      {
        $match: {
          $text: { $search: searchTerm },
        },
      },
      {
        $facet: facets,
      },
    ];

    return await this.aggregate(pipeline);
  }
);
```

### Usage

```typescript
const results = await Product.query().facetedSearch("laptop", {
  byCategory: [{ $group: { _id: "$category", count: { $sum: 1 } } }],
  byPrice: [
    {
      $bucket: {
        groupBy: "$price",
        boundaries: [0, 500, 1000, 2000, 5000],
        default: "Other",
      },
    },
  ],
  topProducts: [{ $sort: { rating: -1 } }, { $limit: 10 }],
});
```

## Summary

Arcanox provides **built-in MongoDB extensions** that give you:

✅ **Mongoose-style population** with `populate()` - no manual configuration needed  
✅ **Direct aggregation access** with `aggregate()` - full MongoDB power  
✅ **Familiar syntax** with `exec()` - works just like Mongoose  
✅ **Raw database access** when you need it - via `adapter.raw("db")`  
✅ **Extensibility** via macros - add your own custom methods

By combining these built-in features with the Macroable pattern, you can use 100% of MongoDB's capabilities while keeping the clean, expressive syntax of Arcanox for standard operations.
