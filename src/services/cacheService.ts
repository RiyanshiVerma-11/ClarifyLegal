import crypto from "crypto";

export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  ttlMs: number;
  hits: number;
  estimatedTokens: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRatio: number;
  savedTokensEstimate: number;
  savedLatencyMsEstimate: number;
}

/**
 * High-performance in-memory LRU cache with SHA-256 fingerprinting
 * Designed to eliminate redundant Gemini API calls and reduce latency to <5ms on repeat requests.
 */
export class ClarifyCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number;
  private defaultTtlMs: number;
  private hits: number = 0;
  private misses: number = 0;
  private savedTokens: number = 0;
  private savedLatencyMs: number = 0;

  constructor(maxSize: number = 200, defaultTtlMs: number = 1000 * 60 * 30) {
    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * Generates a stable cryptographic SHA-256 fingerprint for arbitrary inputs
   */
  public generateKey(prefix: string, payload: any): string {
    const normalized = typeof payload === "string" 
      ? payload.trim().replace(/\s+/g, " ") 
      : JSON.stringify(payload);
    const hash = crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 24);
    return `${prefix}:${hash}`;
  }

  /**
   * Retrieves a cached item if present and not expired
   */
  public get<T>(key: string): { data: T; isHit: boolean; savedMs?: number } | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Refresh LRU position by re-inserting
    this.cache.delete(key);
    entry.hits++;
    this.cache.set(key, entry);

    this.hits++;
    const estimatedSavedTime = 1200; // Average GenAI round-trip savings ~1.2s
    this.savedLatencyMs += estimatedSavedTime;
    this.savedTokens += entry.estimatedTokens;

    return {
      data: entry.data as T,
      isHit: true,
      savedMs: estimatedSavedTime,
    };
  }

  /**
   * Stores an item with LRU eviction when capacity is reached
   */
  public set<T>(key: string, data: T, ttlMs?: number, estimatedTokens: number = 800): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest item (first key in map)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      key,
      data,
      timestamp: Date.now(),
      ttlMs: ttlMs || this.defaultTtlMs,
      hits: 0,
      estimatedTokens,
    });
  }

  /**
   * Returns operational efficiency and telemetry statistics
   */
  public getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRatio = total > 0 ? parseFloat((this.hits / total).toFixed(3)) : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRatio,
      savedTokensEstimate: this.savedTokens,
      savedLatencyMsEstimate: this.savedLatencyMs,
    };
  }

  /**
   * Clears expired keys from memory
   */
  public purgeExpired(): number {
    const now = Date.now();
    let purged = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttlMs) {
        this.cache.delete(key);
        purged++;
      }
    }
    return purged;
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.savedTokens = 0;
    this.savedLatencyMs = 0;
  }
}

// Global server-side singleton cache instance
export const globalCache = new ClarifyCache();
