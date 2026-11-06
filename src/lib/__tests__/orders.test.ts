import { describe, it, expect } from "vitest";
import { isProposalExpired } from "@/app/api/orders/route";

describe("Proposal expiry guard", () => {
  it("allows proposals newer than 15 minutes", () => {
    const now = 1_700_000_000_000;
    // 5 minutes old
    const fiveMinAgo = new Date(now - 5 * 60 * 1000).toISOString();
    expect(isProposalExpired(fiveMinAgo, now)).toBe(false);

    // 14 minutes 59 seconds old
    const almostExpired = new Date(now - (14 * 60 * 1000 + 59 * 1000)).toISOString();
    expect(isProposalExpired(almostExpired, now)).toBe(false);
  });

  it("rejects proposals older than 15 minutes", () => {
    const now = 1_700_000_000_000;
    // 15 minutes 1 second old
    const expired = new Date(now - (15 * 60 * 1000 + 1000)).toISOString();
    expect(isProposalExpired(expired, now)).toBe(true);

    // 1 hour old
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    expect(isProposalExpired(oneHourAgo, now)).toBe(true);
  });

  it("rejects invalid date strings", () => {
    expect(isProposalExpired("invalid-date-string")).toBe(true);
  });
});

