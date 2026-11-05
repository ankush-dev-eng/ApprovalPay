// DEV ONLY: creates a $10 test order so you can verify the PayPal sandbox flow. Delete before submission.
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createOrder } from "@/lib/paypal";
import { evaluate, DEFAULT_POLICY } from "@/lib/policy";
import { saveProposal, updateProposal } from "@/lib/store";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") return new NextResponse("Not found", { status: 404 });
  const product: Product = { id: "dev-1", title: "Dev test item", priceCents: 1000, category: "test" };
  const id = randomUUID();
  await saveProposal({
    id, createdAt: new Date().toISOString(), request: "dev test",
    parsed: { query: "dev", quantity: 1, maxPricePerItemCents: null },
    items: [{ product, reason: "dev test" }],
    verdict: evaluate([product], DEFAULT_POLICY),
    policy: DEFAULT_POLICY, status: "proposed",
  });
  const { orderId, approveUrl } = await createOrder([product], 1000, id);
  await updateProposal(id, { status: "order_created", orderId });
  return NextResponse.redirect(approveUrl);
}
