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
  approvalThresholdCents: 10_000,
  blockedCategories: ["alcohol", "gift-cards"],
};

export function evaluate(items: Product[], policy: Policy): Verdict {
  const totalCents = items.reduce((s, i) => s + i.priceCents, 0);
  const violations: string[] = [];

  if (items.length === 0) violations.push("No items selected");

  for (const i of items) {
    if (i.priceCents > policy.perItemCapCents)
      violations.push(`"${i.title}" ($${fmt(i.priceCents)}) exceeds the per-item cap of $${fmt(policy.perItemCapCents)}`);
    if (policy.blockedCategories.includes(i.category.toLowerCase()))
      violations.push(`"${i.title}" is in blocked category "${i.category}"`);
  }
  if (totalCents > policy.totalBudgetCents)
    violations.push(`Total $${fmt(totalCents)} exceeds the budget of $${fmt(policy.totalBudgetCents)}`);
  if (totalCents > HARD_MAX_TOTAL_CENTS)
    violations.push(`Total exceeds the hard system limit of $${fmt(HARD_MAX_TOTAL_CENTS)}`);

  return {
    totalCents,
    allowed: violations.length === 0,
    needsApproval: totalCents > policy.approvalThresholdCents,
    violations,
  };
}

