/**
 * Simple in-memory cache with TTL for Firebase data
 * Reduces database reads and improves performance during high traffic
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

class TimedCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  set(key: string, value: T, ttl: number = 60000): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get size for debugging
  size(): number {
    return this.cache.size;
  }
}

// Cache instances for different data types
export const menuCache = new TimedCache<unknown>();
export const userCache = new TimedCache<unknown>();
export const configCache = new TimedCache<unknown>();

// Clean up caches periodically
setInterval(() => {
  menuCache.cleanup();
  userCache.cleanup();
  configCache.cleanup();
}, 60000); // Every minute

// React hook for cached state
import { useState, useEffect, useCallback } from "react";

export function useCachedState<T>(
  key: string,
  cache: TimedCache<T>,
  fetcher: () => Promise<T>,
  ttl: number = 60000
): [T | undefined, boolean, () => Promise<void>, (value: T) => void] {
  const [data, setData] = useState<T | undefined>(() => cache.get(key));
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      cache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Fetch failed"));
    }
    setLoading(false);
  }, [key, cache, fetcher, ttl]);

  useEffect(() => {
    if (!data) {
      refresh();
    }
  }, [data, refresh]);

  const update = useCallback((value: T) => {
    cache.set(key, value, ttl);
    setData(value);
  }, [key, cache, ttl]);

  return [data, loading, refresh, update];
}