// NOTE: must NOT import server-only modules (it is unit-tested and used server-side only by convention).
import { z } from "zod";
import { fmt } from "./money";
import type { Policy, Product, Verdict } from "./types";

export const HARD_MAX_TOTAL_CENTS = 50_000; // $500 absolute ceiling, whatever the user sets

export const PolicySchema = z.object({
  perItemCapCents: z.number().int().min(100).max(HARD_MAX_TOTAL_CENTS),
  totalBudgetCents: z.number().int().min(100).max(HARD_MAX_TOTAL_CENTS),
  approvalThresholdCents: z.number().int().min(0).max(HARD_MAX_TOTAL_CENTS),
  blockedCategories: z.array(z.string().trim().toLowerCase().max(40)).max(20),
});

export const DEFAULT_POLICY: Policy = {
  perItemCapCents: 5_000,
  totalBudgetCents: 20_000,
  approvalThresholdCents: 2_500,
  blockedCategories: ["alcohol", "gift-cards"],
};

const EXPANSIONS: Record<string, string[]> = {
  alcohol: [
    "alcohol",
    "whiskey",
    "whisky",
    "bourbon",
    "vodka",
    "wine",
    "beer",
    "liquor",
    "spirits",
    "rum",
    "gin",
    "tequila",
    "champagne",
    "brandy",
  ],
  "gift-cards": ["gift card", "gift cards", "giftcard", "voucher", "e-gift"],
  "gift cards": ["gift card", "gift cards", "giftcard", "voucher", "e-gift"],
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function matchBlocked(p: Product, term: string): string | null {
  const hay = ` ${norm([p.title, p.category, ...(p.tags ?? [])].join(" "))} `;
  const t = norm(term);
  const words = EXPANSIONS[t] ?? EXPANSIONS[term] ?? [t.replace(/s$/, "")];
  for (const w of words.map(norm).filter(Boolean)) {
    if (new RegExp(`\\b${esc(w)}s?\\b`).test(hay)) return w;
  }
  return null;
}

export function evaluate(items: Product[], policy: Policy): Verdict {
  const totalCents = items.reduce((s, i) => s + i.priceCents, 0);
  const violations: string[] = [];

  if (items.length === 0) violations.push("No items selected");

  let itemCapPassed = items.length > 0;
  let blockedPassed = true;
  const blockedDetails: string[] = [];

  for (const i of items) {
    if (i.priceCents > policy.perItemCapCents) {
      itemCapPassed = false;
      violations.push(
        `"${i.title}" ($${fmt(i.priceCents)}) exceeds the per-item cap of $${fmt(policy.perItemCapCents)}`
      );
    }
    for (const term of policy.blockedCategories) {
      const word = matchBlocked(i, term);
      if (word) {
        blockedPassed = false;
        const msg = `"${i.title}" matches blocked term "${word}" (blocked: ${term})`;
        violations.push(msg);
        blockedDetails.push(msg);
      }
    }
  }

  const budgetPassed =
    items.length > 0 &&
    totalCents <= policy.totalBudgetCents &&
    totalCents <= HARD_MAX_TOTAL_CENTS;

  if (totalCents > policy.totalBudgetCents) {
    violations.push(`Total $${fmt(totalCents)} exceeds the budget of $${fmt(policy.totalBudgetCents)}`);
  }
  if (totalCents > HARD_MAX_TOTAL_CENTS) {
    violations.push(`Total exceeds the hard system limit of $${fmt(HARD_MAX_TOTAL_CENTS)}`);
  }

  const thresholdPassed = totalCents <= policy.approvalThresholdCents;
  const maxItemPrice = items.length > 0 ? Math.max(...items.map((i) => i.priceCents)) : 0;

  const checks = [
    {
      rule: "per-item cap",
      passed: itemCapPassed,
      detail:
        items.length === 0
          ? "No items selected"
          : itemCapPassed
          ? `Per-item cap $${fmt(policy.perItemCapCents)}: highest item $${fmt(maxItemPrice)}`
          : `Per-item cap $${fmt(policy.perItemCapCents)}: highest item $${fmt(maxItemPrice)} exceeds cap`,
    },
    {
      rule: "total budget",
      passed: budgetPassed,
      detail:
        items.length === 0
          ? "No items selected"
          : budgetPassed
          ? `Total budget $${fmt(policy.totalBudgetCents)}: cart total $${fmt(totalCents)}`
          : `Total budget $${fmt(policy.totalBudgetCents)}: cart total $${fmt(totalCents)} exceeds budget`,
    },
    {
      rule: "blocked categories",
      passed: blockedPassed,
      detail: blockedPassed
        ? `Blocked categories (${policy.blockedCategories.join(", ") || "none"}): clean`
        : `Blocked categories: ${blockedDetails.join("; ")}`,
    },
    {
      rule: "approval threshold",
      passed: thresholdPassed,
      detail: thresholdPassed
        ? `Approval threshold $${fmt(policy.approvalThresholdCents)}: total $${fmt(totalCents)} (auto-approved)`
        : `Approval threshold $${fmt(policy.approvalThresholdCents)}: total $${fmt(totalCents)} (sign-off required)`,
    },
  ];

  return {
    totalCents,
    allowed: violations.length === 0,
    needsApproval: totalCents > policy.approvalThresholdCents,
    violations,
    checks,
  };
}
