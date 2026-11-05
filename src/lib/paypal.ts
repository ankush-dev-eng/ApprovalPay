import "server-only";
import { env } from "./env";
import { fmt } from "./money";
import type { Product } from "./types";

let cached: { token: string; exp: number } | null = null;

async function getToken(): Promise<string> {
  if (cached && Date.now() < cached.exp) return cached.token;
  const e = env();
  const clientId = e.PAYPAL_CLIENT_ID.trim();
  const secret = e.PAYPAL_CLIENT_SECRET.trim();
  const basic = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const r = await fetch(`${e.PAYPAL_BASE.trim()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!r.ok) {
    let desc = "";
    try {
      const err = (await r.json()) as { error?: string; error_description?: string; message?: string };
      desc = err.error_description ?? err.error ?? err.message ?? "";
    } catch {}
    throw new Error(`PayPal auth failed (HTTP ${r.status}${desc ? `: ${desc}` : ""})`);
  }
  const j = (await r.json()) as { access_token: string; expires_in: number };
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 };
  return cached.token;
}

type PayPalErrorBody = { details?: { issue?: string }[]; debug_id?: string; message?: string };

export async function createOrder(items: Product[], totalCents: number, proposalId: string) {
  const e = env();
  const total = fmt(totalCents);
  const res = await fetch(`${e.PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getToken()}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": proposalId,
    },
    cache: "no-store",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: proposalId,
          amount: {
            currency_code: "USD",
            value: total,
            breakdown: { item_total: { currency_code: "USD", value: total } },
          },
          items: items.map((p) => ({
            name: p.title.slice(0, 127),
            quantity: "1",
            unit_amount: { currency_code: "USD", value: fmt(p.priceCents) },
            category: "PHYSICAL_GOODS",
          })),
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: `${e.APP_URL}/api/paypal/return`,
            cancel_url: `${e.APP_URL}/api/paypal/cancel`,
          },
        },
      },
    }),
  });
  const body = (await res.json()) as PayPalErrorBody & { id?: string; links?: { rel: string; href: string }[] };
  if (!res.ok) {
    throw new Error(`PayPal create order failed: ${body.details?.[0]?.issue ?? res.status} (debug ${body.debug_id ?? "n/a"})`);
  }
  const approveUrl = body.links?.find((l) => l.rel === "payer-action" || l.rel === "approve")?.href;
  if (!body.id || !approveUrl) throw new Error("PayPal did not return an order id and approval link");
  if (!new URL(approveUrl).hostname.endsWith("paypal.com")) throw new Error("Unexpected approval host");
  return { orderId: body.id, approveUrl };
}

export async function captureOrder(orderId: string) {
  const e = env();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${await getToken()}`,
    "Content-Type": "application/json",
    "PayPal-Request-Id": `capture-${orderId}`,
  };
  // Negative testing (sandbox only, enforced by env.ts): force a decline for the demo.
  if (e.PAYPAL_MOCK_ERROR) {
    headers["PayPal-Mock-Response"] = JSON.stringify({ mock_application_codes: e.PAYPAL_MOCK_ERROR });
  }
  const res = await fetch(`${e.PAYPAL_BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers,
    cache: "no-store",
  });
  const body = (await res.json()) as PayPalErrorBody & { status?: string };
  if (res.ok && body.status === "COMPLETED") return { ok: true as const };
  return { ok: false as const, issue: body.details?.[0]?.issue ?? `HTTP_${res.status}`, debugId: body.debug_id };
}

