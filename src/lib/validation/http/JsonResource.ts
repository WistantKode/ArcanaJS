import type {
  CollectionOptions,
  PaginatedResource,
  ResourceOptions,
} from "../types";

/**
 * Professional JsonResource with helpers for wrapping, meta, and conditional fields.
 */
export class JsonResource<TResource = any> {
  public resource: TResource;
  protected additional: Record<string, any> = {};
  protected withData: string[] = [];
  protected withoutData: string[] = [];
  protected wrapKey: string | null = null;

  constructor(resource: TResource, options: ResourceOptions = {}) {
    this.resource = resource;
    this.withData = options.with ?? [];
    this.withoutData = options.without ?? [];
    this.wrapKey = options.wrap ?? null;
  }

  static make(resource: any, options: ResourceOptions = {}): JsonResource {
    return new this(resource, options);
  }

  static collection(
    resource: any[],
    options: CollectionOptions = {}
  ): AnonymousResourceCollection {
    return new AnonymousResourceCollection(resource, this, options);
  }

  /** Add extra data */
  with(data: Record<string, any>): this {
    this.additional = { ...this.additional, ...data };
    return this;
  }

  /** Define wrap key */
  wrap(key: string | null): this {
    this.wrapKey = key;
    return this;
  }

  resolve(request?: any): any {
    if (this.resource === null) {
      return null;
    }

    const body = this.buildArray(this.resource as any, request);
    const payload = this.mergeAdditional(body);

    if (this.wrapKey) {
      return { [this.wrapKey]: payload };
    }

    return payload;
  }

  protected buildArray(resource: any, request?: any): any {
    if (Array.isArray(resource)) {
      return resource.map((item) => this.transform(item, request));
    }
    return this.transform(resource, request);
  }

  protected transform(resource: any, request?: any): any {
    if (resource && typeof resource.toJSON === "function") {
      return resource.toJSON();
    }
    return this.toArray(request);
  }

  /** Override in child resources */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toArray(_request?: any): any {
    return this.resource as any;
  }

  protected mergeAdditional(payload: any): any {
    if (Object.keys(this.additional).length === 0) return payload;
    if (Array.isArray(payload)) {
      return { data: payload, ...this.additional };
    }
    return { ...payload, ...this.additional };
  }

  // ---------------------------------------------------------------------------
  // Conditional helpers
  // ---------------------------------------------------------------------------
  when<T>(
    condition: boolean | (() => boolean),
    value: T,
    defaultValue?: T
  ): T | undefined {
    const result = typeof condition === "function" ? condition() : condition;
    return result ? value : defaultValue;
  }

  whenLoaded<T>(
    relationship: string,
    value: T,
    defaultValue?: T
  ): T | undefined {
    const rel = (this.resource as any)?.[relationship];
    if (rel !== undefined && rel !== null) {
      return typeof value === "function" ? (value as any)(rel) : value;
    }
    return defaultValue;
  }
}

export class AnonymousResourceCollection extends JsonResource<any[]> {
  public collects: any;
  public options: CollectionOptions;

  constructor(resource: any[], collects: any, options: CollectionOptions = {}) {
    super(resource, options);
    this.collects = collects;
    this.options = options;
  }

  resolve(request?: any): any {
    const data = this.resource.map((item: any) => {
      const instance = new this.collects(item, this.options);
      return instance.resolve(request);
    });

    if (this.options.pagination) {
      const payload: PaginatedResource = {
        data,
        meta: this.options.pagination,
        links: {
          first: this.options.pagination.firstPageUrl,
          last: this.options.pagination.lastPageUrl,
          prev: this.options.pagination.prevPageUrl,
          next: this.options.pagination.nextPageUrl,
        },
      };
      return this.mergeAdditional(payload);
    }

    return this.mergeAdditional(data);
  }
}
