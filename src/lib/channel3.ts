import "server-only";
import { z } from "zod";
import { env } from "./env";
import type { Product } from "./types";

export const Channel3OfferPriceSchema = z.union([
  z.number(),
  z.object({
    price: z.number().optional().nullable(),
    currency: z.string().optional().nullable(),
    compare_at_price: z.number().optional().nullable(),
  }),
]);

export const Channel3OfferSchema = z.object({
  url: z.string().optional().nullable(),
  domain: z.string().optional().nullable(),
  price: Channel3OfferPriceSchema.optional().nullable(),
  currency: z.string().optional().nullable(),
  availability: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
});

export const Channel3ProductSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z
    .union([
      z.string(),
      z.object({
        slug: z.string().optional().nullable(),
        title: z.string().optional().nullable(),
      }),
    ])
    .optional()
    .nullable(),
  url: z.string().optional().nullable(),
  offers: z.array(Channel3OfferSchema).optional().nullable(),
  price: Channel3OfferPriceSchema.optional().nullable(),
});

export const Channel3ResponseSchema = z.object({
  products: z.array(z.unknown()).optional().default([]),
});

export function getOfferCurrency(offer: z.infer<typeof Channel3OfferSchema>): string | null {
  if (offer.currency && typeof offer.currency === "string") {
    return offer.currency.trim().toUpperCase();
  }
  if (offer.price && typeof offer.price === "object" && offer.price.currency) {
    return offer.price.currency.trim().toUpperCase();
  }
  return null;
}

export function getProductCurrency(raw: z.infer<typeof Channel3ProductSchema>): string | null {
  if (raw.price && typeof raw.price === "object" && raw.price.currency) {
    return raw.price.currency.trim().toUpperCase();
  }
  return null;
}

export function extractPriceAndOffer(
  raw: z.infer<typeof Channel3ProductSchema>
): { priceUsd: number; url?: string } | null {
  // 1. If offers exist, ONLY accept offers whose currency is USD; drop non-USD offers.
  if (raw.offers && raw.offers.length > 0) {
    const usdOffer = raw.offers.find((o) => getOfferCurrency(o) === "USD");
    if (!usdOffer) {
      // Offers exist, but none are USD. Drop everything else.
      return null;
    }

    let price: number | null = null;
    if (typeof usdOffer.price === "number") {
      price = usdOffer.price;
    } else if (usdOffer.price && typeof usdOffer.price.price === "number") {
      price = usdOffer.price.price;
    }

    if (price === null || isNaN(price) || price <= 0) return null;
    return { priceUsd: price, url: usdOffer.url ?? undefined };
  }

  // 2. Fallback to top-level price if present
  if (raw.price !== undefined && raw.price !== null) {
    const topCurrency = getProductCurrency(raw);
    if (topCurrency !== null && topCurrency !== "USD") {
      return null;
    }

    let price: number | null = null;
    if (typeof raw.price === "number") {
      price = raw.price;
    } else if (typeof raw.price.price === "number") {
      price = raw.price.price;
    }

    if (price === null || isNaN(price) || price <= 0) return null;
    return { priceUsd: price, url: raw.url ?? undefined };
  }

  return null;
}

export function extractPrice(raw: z.infer<typeof Channel3ProductSchema>): number | null {
  return extractPriceAndOffer(raw)?.priceUsd ?? null;
}

export function mapChannel3Product(rawItem: unknown): Product | null {
  const parsed = Channel3ProductSchema.safeParse(rawItem);
  if (!parsed.success) return null;

  const item = parsed.data;
  const priceInfo = extractPriceAndOffer(item);
  if (!priceInfo || priceInfo.priceUsd <= 0) {
    return null;
  }

  const priceCents = Math.round(priceInfo.priceUsd * 100);
  if (priceCents <= 0) return null;

  let category = "general";
  if (typeof item.category === "string" && item.category.trim()) {
    category = item.category.trim().toLowerCase();
  } else if (item.category && typeof item.category === "object") {
    const catStr = item.category.slug || item.category.title;
    if (catStr && catStr.trim()) {
      category = catStr.trim().toLowerCase();
    }
  }

  const url = priceInfo.url ?? item.url ?? undefined;

  return {
    id: `c3_${item.id}`,
    title: item.title.trim(),
    priceCents,
    category,
    ...(url ? { url } : {}),
  };
}

export async function searchChannel3(
  query: string,
  maxPriceCents: number | null = null
): Promise<Product[]> {
  const e = env();
  if (!e.CHANNEL3_API_KEY) return [];

  try {
    const res = await fetch("https://api.trychannel3.com/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": e.CHANNEL3_API_KEY,
      },
      body: JSON.stringify({
        query,
        limit: 20,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Channel3 search failed (HTTP ${res.status})`);
      return [];
    }

    const json: unknown = await res.json();
    const parsedResp = Channel3ResponseSchema.safeParse(json);
    if (!parsedResp.success) {
      console.error("Channel3 response failed schema validation");
      return [];
    }

    const products: Product[] = [];
    for (const raw of parsedResp.data.products) {
      const mapped = mapChannel3Product(raw);
      if (mapped) {
        if (maxPriceCents === null || mapped.priceCents <= maxPriceCents) {
          products.push(mapped);
        }
      }
    }

    return products;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("Channel3 adapter error:", msg);
    return [];
  }
}
