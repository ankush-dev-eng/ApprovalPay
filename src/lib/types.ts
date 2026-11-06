export type Product = {
  id: string;
  title: string;
  priceCents: number;
  category: string;
  tags?: string[];
  url?: string;
};

export type Policy = {
  perItemCapCents: number;
  totalBudgetCents: number;
  approvalThresholdCents: number;
  blockedCategories: string[];
};

export type VerdictCheck = {
  rule: string;
  passed: boolean;
  detail: string;
};

export type Verdict = {
  totalCents: number;
  allowed: boolean;
  needsApproval: boolean;
  violations: string[];
  checks: VerdictCheck[];
};

export type ProposalStatus =
  | "proposed" | "blocked" | "order_created" | "captured" | "declined" | "failed" | "cancelled";

export type Proposal = {
  id: string;
  createdAt: string;
  request: string;
  parsed: { query: string; quantity: number; maxPricePerItemCents: number | null };
  items: { product: Product; reason: string }[];
  verdict: Verdict;
  policy: Policy;
  status: ProposalStatus;
  orderId?: string;
  note?: string;
};

