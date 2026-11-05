import type { Product } from "./types";

const p = (id: string, title: string, price: number, category: string, tags: string[] = []): Product => ({
  id, title, priceCents: Math.round(price * 100), category, tags,
});

export const MOCK_PRODUCTS: Product[] = [
  p("m01", "Ceramic Coffee Mug Set", 24.99, "home", ["gift", "mug", "coffee"]),
  p("m02", "Scented Soy Candle", 18.5, "home", ["gift", "candle"]),
  p("m03", "Desk Succulent Planter", 15, "home", ["gift", "plant", "desk"]),
  p("m04", "Wireless Charging Pad", 29.99, "electronics", ["gift", "charger", "tech"]),
  p("m05", "Bluetooth Mini Speaker", 39.99, "electronics", ["gift", "speaker", "tech"]),
  p("m06", "Noise-Isolating Earbuds", 49, "electronics", ["gift", "earbuds", "tech"]),
  p("m07", "Leather Notebook Journal", 22, "stationery", ["gift", "notebook"]),
  p("m08", "Premium Pen Set", 27.5, "stationery", ["gift", "pen"]),
  p("m09", "Insulated Water Bottle", 26, "outdoors", ["gift", "bottle"]),
  p("m10", "Gourmet Chocolate Box", 32, "food", ["gift", "chocolate"]),
  p("m11", "Artisan Tea Sampler", 21, "food", ["gift", "tea"]),
  p("m12", "Savory Snack Hamper", 44.99, "food", ["gift", "snack"]),
  p("m13", "Yoga Mat", 35, "fitness", ["yoga"]),
  p("m14", "Resistance Band Set", 19.99, "fitness", ["gym"]),
  p("m15", "Portable Phone Stand", 12.99, "electronics", ["desk", "phone"]),
  p("m16", "Mechanical Keyboard", 89, "electronics", ["tech", "keyboard"]),
  p("m17", "Noise-Cancelling Headphones", 129, "electronics", ["tech", "headphones"]),
  p("m18", "Single Malt Whiskey", 64, "alcohol", ["gift", "whiskey"]),
  p("m19", "Red Wine Gift Set", 55, "alcohol", ["gift", "wine"]),
  p("m20", "Gift Card $50", 50, "gift-cards", ["gift", "card"]),
  p("m21", "Strategy Board Game", 38, "games", ["gift", "game"]),
  p("m22", "1000-Piece Jigsaw Puzzle", 17.99, "games", ["gift", "puzzle"]),
  p("m23", "Desk Organizer Set", 23.5, "stationery", ["desk", "office"]),
  p("m24", "LED Desk Lamp", 33, "home", ["desk", "office", "lamp"]),
  p("m25", "Everyday Backpack", 59, "accessories", ["bag", "backpack"]),
  p("m26", "Travel Neck Pillow", 16.5, "accessories", ["travel"]),
];

const stem = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/s$/, "");

function searchMock(query: string, maxPriceCents: number | null): Product[] {
  const words = query.split(/\s+/).map(stem).filter((w) => w.length > 1);
  return MOCK_PRODUCTS
    .filter((x) => maxPriceCents === null || x.priceCents <= maxPriceCents)
    .map((x) => {
      const hay = [x.title, x.category, ...(x.tags ?? [])].map((s) => s.toLowerCase());
      const score = words.reduce((s, w) => s + (hay.some((h) => h.includes(w)) ? 1 : 0), 0);
      return { x, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.x.priceCents - b.x.priceCents)
    .slice(0, 12)
    .map((r) => r.x);
}

export async function searchProducts(query: string, maxPriceCents: number | null): Promise<Product[]> {
  return searchMock(query, maxPriceCents);
}

