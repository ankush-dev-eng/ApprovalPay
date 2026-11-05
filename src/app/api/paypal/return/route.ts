import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { captureOrder } from "@/lib/paypal";
import { findByOrderId, updateProposal } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const base = env().APP_URL;
  const orderId = req.nextUrl.searchParams.get("token");
  if (!orderId) return NextResponse.redirect(new URL("/audit?error=missing", base));

  const p = await findByOrderId(orderId);
  if (!p) return NextResponse.redirect(new URL("/audit?error=unknown", base));
  const to = new URL(`/audit?highlight=${p.id}`, base);

  // Only capture orders this app created and has not captured yet.
  if (p.status !== "order_created") return NextResponse.redirect(to);

  try {
    const r = await captureOrder(orderId);
    if (r.ok) {
      await updateProposal(p.id, { status: "captured", note: undefined });
    } else {
      await updateProposal(p.id, {
        status: r.issue === "INSTRUMENT_DECLINED" ? "declined" : "failed",
        note: `${r.issue} (debug ${r.debugId ?? "n/a"})`,
      });
    }
  } catch (err) {
    console.error("capture error:", err instanceof Error ? err.message : "unknown");
    await updateProposal(p.id, { status: "failed", note: "Capture error" });
  }
  return NextResponse.redirect(to);
}
