import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { findByOrderId, updateProposal } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const base = env().APP_URL;
  const orderId = req.nextUrl.searchParams.get("token");
  const p = orderId ? await findByOrderId(orderId) : null;
  if (p && p.status === "order_created") await updateProposal(p.id, { status: "cancelled" });
  return NextResponse.redirect(new URL(p ? `/audit?highlight=${p.id}` : "/audit", base));
}
