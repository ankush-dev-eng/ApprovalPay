import { describe, it, expect } from "vitest";
import { searchProducts } from "../products";

describe("searchProducts", () => {
  it("'gift' returns results", async () => {
    const results = await searchProducts("gift", null);
    expect(results.length).toBeGreaterThan(0);
  });

  it("a maxPrice of 2000 cents returns nothing over 2000", async () => {
    const results = await searchProducts("gift", 2000);
    expect(results.length).toBeGreaterThan(0);
    for (const item of results) {
      expect(item.priceCents).toBeLessThanOrEqual(2000);
    }
  });

  it("'whiskey' returns the whiskey product", async () => {
    const results = await searchProducts("whiskey", null);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p) => p.title.toLowerCase().includes("whiskey"))).toBe(true);
  });
});

