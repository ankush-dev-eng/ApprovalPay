import { describe, it, expect } from "vitest";
import { evaluate, DEFAULT_POLICY } from "../policy";
import type { Product } from "../types";

const item = (over: Partial<Product> = {}): Product => ({
  id: "x", title: "Thing", priceCents: 2000, category: "home", ...over,
});

describe("policy", () => {
  it("allows a normal basket", () => {
    const v = evaluate([item(), item({ id: "y" })], DEFAULT_POLICY);
    expect(v.allowed).toBe(true);
    expect(v.totalCents).toBe(4000);
    expect(v.needsApproval).toBe(false);
  });
  it("blocks an item above the per-item cap", () => {
    const v = evaluate([item({ priceCents: 6000 })], DEFAULT_POLICY);
    expect(v.allowed).toBe(false);
  });
  it("blocks a blocked category", () => {
    const v = evaluate([item({ category: "alcohol" })], DEFAULT_POLICY);
    expect(v.allowed).toBe(false);
  });
  it("blocks when total exceeds budget", () => {
    const items = Array.from({ length: 5 }, (_, n) => item({ id: String(n), priceCents: 5000 }));
    expect(evaluate(items, DEFAULT_POLICY).allowed).toBe(false);
  });
  it("requires approval above the threshold", () => {
    const items = Array.from({ length: 3 }, (_, n) => item({ id: String(n), priceCents: 4000 }));
    expect(evaluate(items, DEFAULT_POLICY).needsApproval).toBe(true);
  });
  it("blocks an empty basket", () => {
    expect(evaluate([], DEFAULT_POLICY).allowed).toBe(false);
  });
});

