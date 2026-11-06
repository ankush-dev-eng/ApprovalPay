import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProposal, updateProposal } from "@/lib/store";
import { evaluate } from "@/lib/policy";
import { createOrder } from "@/lib/paypal";
import { allow } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const Body = z.object({ proposalId: z.string().uuid(), confirmed: z.boolean().default(false) });
const MAX_PROPOSAL_AGE_MS = 15 * 60 * 1000; // 15 minutes

export function isProposalExpired(createdAt: string, now: number = Date.now()): boolean {
  const ageMs = now - new Date(createdAt).getTime();
  return isNaN(ageMs) || ageMs > MAX_PROPOSAL_AGE_MS;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allow(`orders:${ip}`, 20)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const p = await getProposal(body.data.proposalId);
  if (!p) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  if (p.status !== "proposed") return NextResponse.json({ error: `Proposal is ${p.status}` }, { status: 409 });

  // Proposal expiry check (15 minutes)
  if (isProposalExpired(p.createdAt)) {
    return NextResponse.json({ error: "Proposal expired, ask the agent again" }, { status: 409 });
  }

  // Re-verify on the server. Never trust earlier state.
  const products = p.items.map((i) => i.product);
  const verdict = evaluate(products, p.policy);
  if (!verdict.allowed) {
    await updateProposal(p.id, { status: "blocked", verdict });
    return NextResponse.json({ error: "Blocked by policy", violations: verdict.violations }, { status: 403 });
  }
  if (verdict.needsApproval && !body.data.confirmed) {
    return NextResponse.json({ error: "Explicit approval required for this amount" }, { status: 400 });
  }

  try {
    const { orderId, approveUrl } = await createOrder(products, verdict.totalCents, p.id);
    await updateProposal(p.id, { status: "order_created", orderId, verdict });
    return NextResponse.json({ approveUrl });
  } catch (err) {
    console.error("order error:", err instanceof Error ? err.message : "unknown");
    await updateProposal(p.id, { status: "failed", note: "Could not create PayPal order" });
    return NextResponse.json({ error: "Could not create PayPal order" }, { status: 502 });
  }
}
