import { QueryBuilder } from "../QueryBuilder";

/**
 * MongoDB-specific extensions for QueryBuilder
 * These extensions provide Mongoose-style functionality for MongoDB
 */

export interface PopulateOptions {
  from?: string;
  localField?: string;
  foreignField?: string;
  as?: string;
  select?: string[];
}

/**
 * Populate (Mongoose-style relationships)
 * Uses MongoDB's $lookup aggregation to join collections
 */
QueryBuilder.macro(
  "populate",
  async function (
    this: QueryBuilder<any>,
    field: string,
    options?: PopulateOptions
  ) {
    // Get the native DB instance
    const db = await this.adapter.raw("db");
    const collection = db.collection(this.tableName);

    // Determine the related collection name
    // By convention: 'author' field -> 'authors' collection
    const relatedCollection = options?.from || `${field}s`;
    const localField = options?.localField || `${field}_id`;
    const foreignField = options?.foreignField || "_id";
    const as = options?.as || field;

    // Build the aggregation pipeline
    const pipeline: any[] = [];

    // Add existing where clauses as $match
    if ((this as any).whereClauses && (this as any).whereClauses.length > 0) {
      const filter =
        this.adapter.buildFilter?.((this as any).whereClauses) || {};
      if (Object.keys(filter).length > 0) {
        pipeline.push({ $match: filter });
      }
    }

    // Build $lookup with optional projection
    if (options?.select && options.select.length > 0) {
      // Use pipeline-based $lookup for field selection
      const projection: any = {};
      options.select.forEach((field) => {
        projection[field] = 1;
      });

      pipeline.push({
        $lookup: {
          from: relatedCollection,
          let: { localId: `$${localField}` },
          pipeline: [
            { $match: { $expr: { $eq: [`$${foreignField}`, "$$localId"] } } },
            { $project: projection },
          ],
          as: as,
        },
      });
    } else {
      // Standard $lookup
      pipeline.push({
        $lookup: {
          from: relatedCollection,
          localField: localField,
          foreignField: foreignField,
          as: as,
        },
      });
    }

    // Unwind to convert array to object (if you want single object instead of array)
    pipeline.push({
      $unwind: {
        path: `$${as}`,
        preserveNullAndEmptyArrays: true, // Keep documents even if no match
      },
    });

    // Add limit if specified
    if ((this as any).limitValue) {
      pipeline.push({ $limit: (this as any).limitValue });
    }

    // Execute aggregation
    const results = await collection.aggregate(pipeline).toArray();

    // Map _id to id
    return results.map((doc: any) => {
      const { _id, ...rest } = doc;
      return { id: _id, _id, ...rest };
    });
  }
);

/**
 * Execute query (alias for get())
 * Provides Mongoose-style exec() method
 */
QueryBuilder.macro("exec", async function (this: QueryBuilder<any>) {
  return await this.get();
});

/**
 * Direct aggregation pipeline access
 * Allows running custom MongoDB aggregation pipelines
 */
QueryBuilder.macro(
  "aggregate",
  async function (this: QueryBuilder<any>, pipeline: any[]) {
    // Get the native DB instance
    const db = await this.adapter.raw("db");
    const collection = db.collection(this.tableName);

    // Execute aggregation
    const results = await collection.aggregate(pipeline).toArray();

    // Map _id to id for consistency
    return results.map((doc: any) => {
      if (doc._id) {
        const { _id, ...rest } = doc;
        return { id: _id, _id, ...rest };
      }
      return doc;
    });
  }
);

/**
 * TypeScript type augmentation for better IDE support
 */
declare module "../QueryBuilder" {
  interface QueryBuilder<T> {
    /**
     * Populate a relationship using MongoDB's $lookup
     * @param field - The field name to populate
     * @param options - Population options
     */
    populate(field: string, options?: PopulateOptions): Promise<T[]>;

    /**
     * Execute the query (alias for get())
     */
    exec(): Promise<T[]>;

    /**
     * Execute a MongoDB aggregation pipeline
     * @param pipeline - MongoDB aggregation pipeline stages
     */
    aggregate(pipeline: any[]): Promise<any[]>;
  }
}
