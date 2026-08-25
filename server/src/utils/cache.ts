interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  loading?: Promise<T>;
}

interface CacheOptions {
  ttlMs?: number;
}

/**
 * A minimal in-process cache with TTL and single-flight loading.
 *
 * LIMIT: This cache is in-process and per-node. In a multi-server deployment,
 * each node will have its own cache and cache invalidation will not propagate.
 * The upgrade path is Redis or a shared memory store.
 */
export class InProcessCache {
  private store = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly options: CacheOptions = {}) {}

  async get<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const ttl = this.options.ttlMs ?? 5 * 60 * 1000;
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (entry && entry.expiresAt > now && !entry.loading) {
      return entry.value;
    }

    if (entry?.loading) {
      return entry.loading as Promise<T>;
    }

    const loading = factory().then((value) => {
      this.store.set(key, { value, expiresAt: Date.now() + ttl });
      return value;
    });

    this.store.set(key, { value: undefined as T, expiresAt: 0, loading });
    return loading;
  }

  invalidate(key?: string): void {
    if (key) {
      this.store.delete(key);
    } else {
      this.store.clear();
    }
  }
}

export const referenceDataCache = new InProcessCache({ ttlMs: 5 * 60 * 1000 });
