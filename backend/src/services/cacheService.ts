import NodeCache from 'node-cache';

class CacheService {
  private cache: NodeCache;

  constructor(ttlSeconds: number = 30) {
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: Math.max(10, Math.floor(ttlSeconds * 0.2)),
      useClones: false
    });
  }

  public get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  public set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public del(key: string): number {
    return this.cache.del(key);
  }

  public flush(): void {
    this.cache.flushAll();
  }
}

export const marketCache = new CacheService(30); // 30s TTL for market quotes
export const newsCache = new CacheService(300);  // 5 min TTL for news
export const chartCache = new CacheService(60);  // 60s TTL for historical charts
