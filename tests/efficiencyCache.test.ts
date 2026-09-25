import { describe, it, expect, beforeEach } from "vitest";
import { ClarifyCache } from "../src/services/cacheService";

describe("ClarifyCache - High-Performance LRU Caching Engine", () => {
  let cache: ClarifyCache;

  beforeEach(() => {
    cache = new ClarifyCache(5, 500); // Max 5 items, 500ms TTL
  });

  it("generates deterministic SHA-256 keys for identical payloads regardless of extra whitespace", () => {
    const key1 = cache.generateKey("analyze", "This is   a test lease   agreement.");
    const key2 = cache.generateKey("analyze", "This is a test lease agreement.");
    expect(key1).toBe(key2);
    expect(key1.startsWith("analyze:")).toBe(true);
  });

  it("stores and retrieves cached items with latency savings estimate", () => {
    const key = cache.generateKey("analyze", "sample contract payload");
    const payload = { documentTitle: "Residential Lease", riskScore: 45 };

    cache.set(key, payload);
    const result = cache.get<typeof payload>(key);

    expect(result).not.toBeNull();
    expect(result?.isHit).toBe(true);
    expect(result?.data.documentTitle).toBe("Residential Lease");
    expect(result?.savedMs).toBeGreaterThan(0);
  });

  it("accurately reports cache hits, misses, and hitRatio in stats", () => {
    const key = cache.generateKey("test", "payload-1");
    cache.set(key, { data: "sample" });

    // 1 Hit
    cache.get(key);
    // 2 Misses
    cache.get("non-existent-1");
    cache.get("non-existent-2");

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(2);
    expect(stats.hitRatio).toBeCloseTo(0.333, 2);
    expect(stats.size).toBe(1);
  });

  it("evicts oldest items when max capacity is reached (LRU policy)", () => {
    for (let i = 1; i <= 5; i++) {
      cache.set(`key-${i}`, { value: i });
    }
    expect(cache.getStats().size).toBe(5);

    // Adding 6th item should evict key-1
    cache.set("key-6", { value: 6 });
    expect(cache.getStats().size).toBe(5);
    expect(cache.get("key-1")).toBeNull();
    expect(cache.get<{ value: number }>("key-6")?.data.value).toBe(6);
  });

  it("expires entries after TTL elapsed", async () => {
    const shortTtlCache = new ClarifyCache(10, 50); // 50ms TTL
    shortTtlCache.set("temp-key", { text: "temporary" });

    expect(shortTtlCache.get("temp-key")?.isHit).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(shortTtlCache.get("temp-key")).toBeNull();
  });
});
