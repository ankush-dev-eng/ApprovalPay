import { describe, it, expect } from "vitest";
import { z } from "zod";

const PicksSchema = z.object({
  picks: z.array(z.object({ id: z.string(), reason: z.string().max(240) })).min(0).max(10),
  noGoodMatch: z.boolean().default(false),
  noMatchReason: z.string().max(200).default(""),
});

describe("Agent selection relevance guard schema", () => {
  it("validates successful picks", () => {
    const valid = {
      picks: [{ id: "c3_123", reason: "Exact match for office mouse pad" }],
      noGoodMatch: false,
      noMatchReason: "",
    };
    const parsed = PicksSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.picks.length).toBe(1);
      expect(parsed.data.noGoodMatch).toBe(false);
    }
  });

  it("validates noGoodMatch with empty picks array", () => {
    const noMatch = {
      picks: [],
      noGoodMatch: true,
      noMatchReason: "No phantom blade zero merchandise found in catalog",
    };
    const parsed = PicksSchema.safeParse(noMatch);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.picks.length).toBe(0);
      expect(parsed.data.noGoodMatch).toBe(true);
      expect(parsed.data.noMatchReason).toContain("phantom blade zero");
    }
  });

  it("defaults noGoodMatch and noMatchReason when omitted", () => {
    const minimal = {
      picks: [],
    };
    const parsed = PicksSchema.safeParse(minimal);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.noGoodMatch).toBe(false);
      expect(parsed.data.noMatchReason).toBe("");
    }
  });
});

