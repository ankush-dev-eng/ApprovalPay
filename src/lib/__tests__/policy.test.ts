import { describe, it, expect } from "vitest";
import { evaluate, matchBlocked, DEFAULT_POLICY } from "../policy";
import type { Product } from "../types";

const item = (over: Partial<Product> = {}): Product => ({
  id: "x",
  title: "Thing",
  priceCents: 1000,
  category: "home",
  ...over,
});

describe("policy", () => {
  it("allows a normal basket", () => {
    const v = evaluate([item(), item({ id: "y" })], DEFAULT_POLICY);
    expect(v.allowed).toBe(true);
    expect(v.totalCents).toBe(2000);
    expect(v.needsApproval).toBe(false);
    expect(v.checks.length).toBe(4);
    expect(v.checks.every((c) => c.passed)).toBe(true);
  });

  it("blocks an item above the per-item cap", () => {
    const v = evaluate([item({ priceCents: 6000 })], DEFAULT_POLICY);
    expect(v.allowed).toBe(false);
    const capCheck = v.checks.find((c) => c.rule === "per-item cap");
    expect(capCheck?.passed).toBe(false);
  });

  it("blocks a blocked category via exact or expanded match", () => {
    const v = evaluate([item({ category: "alcohol" })], DEFAULT_POLICY);
    expect(v.allowed).toBe(false);
    const blockedCheck = v.checks.find((c) => c.rule === "blocked categories");
    expect(blockedCheck?.passed).toBe(false);
  });

  it("blocks when total exceeds budget", () => {
    const items = Array.from({ length: 5 }, (_, n) => item({ id: String(n), priceCents: 5000 }));
    const v = evaluate(items, DEFAULT_POLICY);
    expect(v.allowed).toBe(false);
    const budgetCheck = v.checks.find((c) => c.rule === "total budget");
    expect(budgetCheck?.passed).toBe(false);
  });

  it("requires approval above the threshold", () => {
    // DEFAULT_POLICY approvalThresholdCents is 2500
    const items = [item({ priceCents: 3000 })];
    const v = evaluate(items, DEFAULT_POLICY);
    expect(v.allowed).toBe(true);
    expect(v.needsApproval).toBe(true);
    const thresholdCheck = v.checks.find((c) => c.rule === "approval threshold");
    expect(thresholdCheck?.passed).toBe(false);
  });

  it("blocks an empty basket", () => {
    const v = evaluate([], DEFAULT_POLICY);
    expect(v.allowed).toBe(false);
  });

  describe("word-level blocked category matching (matchBlocked)", () => {
    it("blocks product titled 'Bourbon and Whiskey' with category 'Barware' by 'alcohol'", () => {
      const p: Product = {
        id: "p1",
        title: "Bourbon and Whiskey",
        category: "Barware",
        priceCents: 2000,
      };
      const match = matchBlocked(p, "alcohol");
      expect(match).toBeTruthy();

      const v = evaluate([p], { ...DEFAULT_POLICY, blockedCategories: ["alcohol"] });
      expect(v.allowed).toBe(false);
      expect(v.violations.some((msg) => msg.includes("matches blocked term"))).toBe(true);
    });

    it("blocks category 'Handheld-Game-Consoles' by 'game' and by 'games'", () => {
      const p: Product = {
        id: "p2",
        title: "Console Device",
        category: "Handheld-Game-Consoles",
        priceCents: 2000,
      };
      expect(matchBlocked(p, "game")).toBe("game");
      expect(matchBlocked(p, "games")).toBe("game");

      const vGame = evaluate([p], { ...DEFAULT_POLICY, blockedCategories: ["game"] });
      expect(vGame.allowed).toBe(false);

      const vGames = evaluate([p], { ...DEFAULT_POLICY, blockedCategories: ["games"] });
      expect(vGames.allowed).toBe(false);
    });

    it("blocks 'Gift Card $50' by 'gift-cards'", () => {
      const p: Product = {
        id: "p3",
        title: "Gift Card $50",
        category: "Vouchers",
        priceCents: 5000,
      };
      expect(matchBlocked(p, "gift-cards")).toBeTruthy();

      const v = evaluate([p], { ...DEFAULT_POLICY, blockedCategories: ["gift-cards"] });
      expect(v.allowed).toBe(false);
    });

    it("does NOT block 'Keychron Mouse Pad' by 'alcohol' or 'game'", () => {
      const p: Product = {
        id: "p4",
        title: "Keychron Mouse Pad",
        category: "Mouse-Pads",
        priceCents: 1299,
      };
      expect(matchBlocked(p, "alcohol")).toBeNull();
      expect(matchBlocked(p, "game")).toBeNull();

      const v = evaluate([p], { ...DEFAULT_POLICY, blockedCategories: ["alcohol", "game"] });
      expect(v.allowed).toBe(true);
    });
  });

  describe("verdict rule checklist", () => {
    it("returns all four rules in checks", () => {
      const v = evaluate([item({ priceCents: 2000 })], DEFAULT_POLICY);
      const ruleNames = v.checks.map((c) => c.rule);
      expect(ruleNames).toEqual([
        "per-item cap",
        "total budget",
        "blocked categories",
        "approval threshold",
      ]);
      expect(v.checks.every((c) => typeof c.passed === "boolean")).toBe(true);
      expect(v.checks.every((c) => typeof c.detail === "string" && c.detail.length > 0)).toBe(true);
    });
  });
});
