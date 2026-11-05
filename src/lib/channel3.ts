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

export function extractPrice(raw: z.infer<typeof Channel3ProductSchema>): number | null {
  // Check offers[0].price first (per Channel3 official documentation)
  const firstOffer = raw.offers?.[0];
  if (firstOffer?.price !== undefined && firstOffer?.price !== null) {
    if (typeof firstOffer.price === "number") return firstOffer.price;
    if (typeof firstOffer.price.price === "number") return firstOffer.price.price;
  }

  // Fallback to top-level price if present
  if (raw.price !== undefined && raw.price !== null) {
    if (typeof raw.price === "number") return raw.price;
    if (typeof raw.price.price === "number") return raw.price.price;
  }

  return null;
}

export function mapChannel3Product(rawItem: unknown): Product | null {
  const parsed = Channel3ProductSchema.safeParse(rawItem);
  if (!parsed.success) return null;

  const item = parsed.data;
  const priceUsd = extractPrice(item);
  if (priceUsd === null || isNaN(priceUsd) || priceUsd <= 0) {
    return null;
  }

  const priceCents = Math.round(priceUsd * 100);
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

  const offerUrl = item.offers?.[0]?.url;
  const directUrl = item.url;
  const url = offerUrl ?? directUrl ?? undefined;

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

