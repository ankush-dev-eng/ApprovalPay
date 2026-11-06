import { describe, it, expect } from "vitest";
import { mapChannel3Product } from "../channel3";

describe("Channel3 product mapping", () => {
  it("maps a valid Channel3 product object with nested offer price and category", () => {
    const sample = {
      id: "prod_nike_zoom_123",
      title: "Nike Air Zoom Pegasus 40",
      description: "A springy ride for every run.",
      category: {
        slug: "running-shoes",
        title: "Running Shoes",
      },
      offers: [
        {
          url: "https://example.com/products/nike-air-zoom-pegasus-40",
          price: {
            price: 129.99,
            currency: "USD",
          },
          availability: "InStock",
        },
      ],
    };

    const mapped = mapChannel3Product(sample);
    expect(mapped).not.toBeNull();
    expect(mapped?.id).toBe("c3_prod_nike_zoom_123");
    expect(mapped?.title).toBe("Nike Air Zoom Pegasus 40");
    expect(mapped?.priceCents).toBe(12999);
    expect(mapped?.category).toBe("running-shoes");
    expect(mapped?.url).toBe("https://example.com/products/nike-air-zoom-pegasus-40");
  });

  it("handles string category and direct price fallback", () => {
    const sample = {
      id: "prod_mug_456",
      title: "Handmade Ceramic Mug",
      category: "Home & Kitchen",
      price: 19.5,
      url: "https://example.com/mug",
    };

    const mapped = mapChannel3Product(sample);
    expect(mapped).not.toBeNull();
    expect(mapped?.id).toBe("c3_prod_mug_456");
    expect(mapped?.priceCents).toBe(1950);
    expect(mapped?.category).toBe("home & kitchen");
    expect(mapped?.url).toBe("https://example.com/mug");
  });

  it("drops products with missing or non-positive price", () => {
    // Zero price
    expect(
      mapChannel3Product({
        id: "p1",
        title: "Free Sample",
        offers: [{ price: { price: 0, currency: "USD" } }],
      })
    ).toBeNull();

    // Negative price
    expect(
      mapChannel3Product({
        id: "p2",
        title: "Invalid Item",
        price: -5,
      })
    ).toBeNull();

    // Missing price
    expect(
      mapChannel3Product({
        id: "p3",
        title: "Price On Request",
      })
    ).toBeNull();
  });

  it("defaults missing category to general", () => {
    const sample = {
      id: "p4",
      title: "Unknown Item",
      price: 10,
    };

    const mapped = mapChannel3Product(sample);
    expect(mapped?.category).toBe("general");
  });

  describe("currency filtering", () => {
    it("drops offers with non-USD currency (EUR, GBP, CAD)", () => {
      // Offer with EUR
      expect(
        mapChannel3Product({
          id: "p_eur",
          title: "European Product",
          offers: [
            {
              url: "https://example.de/item",
              price: { price: 89.99, currency: "EUR" },
            },
          ],
        })
      ).toBeNull();

      // Offer with GBP
      expect(
        mapChannel3Product({
          id: "p_gbp",
          title: "British Product",
          offers: [
            {
              url: "https://example.co.uk/item",
              currency: "GBP",
              price: 50.0,
            },
          ],
        })
      ).toBeNull();

      // Top-level price with CAD
      expect(
        mapChannel3Product({
          id: "p_cad",
          title: "Canadian Product",
          price: { price: 75.0, currency: "CAD" },
        })
      ).toBeNull();
    });

    it("accepts USD offer when multiple offers exist (drops EUR, keeps USD)", () => {
      const sample = {
        id: "p_multi",
        title: "Global Gadget",
        offers: [
          {
            url: "https://euro.example.com/gadget",
            price: { price: 90, currency: "EUR" },
          },
          {
            url: "https://us.example.com/gadget",
            price: { price: 99.95, currency: "USD" },
          },
        ],
      };

      const mapped = mapChannel3Product(sample);
      expect(mapped).not.toBeNull();
      expect(mapped?.priceCents).toBe(9995);
      expect(mapped?.url).toBe("https://us.example.com/gadget");
    });
  });

  describe("image URL extraction", () => {
    it("maps valid https image URL, preferring cleaned_url over url", () => {
      const sample = {
        id: "p_img1",
        title: "Sneakers",
        price: 80,
        images: [
          {
            url: "https://example.com/raw.jpg",
            cleaned_url: "https://example.com/clean.jpg",
            is_main_image: true,
          },
        ],
      };

      const mapped = mapChannel3Product(sample);
      expect(mapped?.imageUrl).toBe("https://example.com/clean.jpg");
    });

    it("falls back to standard url if cleaned_url is absent", () => {
      const sample = {
        id: "p_img2",
        title: "Sneakers",
        price: 80,
        images: [
          {
            url: "https://example.com/hero.jpg",
            is_main_image: true,
          },
        ],
      };

      const mapped = mapChannel3Product(sample);
      expect(mapped?.imageUrl).toBe("https://example.com/hero.jpg");
    });

    it("rejects non-https URLs (drops http:// images)", () => {
      const sample = {
        id: "p_img3",
        title: "Insecure Image Product",
        price: 40,
        images: [
          {
            url: "http://insecure.example.com/pic.jpg",
            cleaned_url: "http://insecure.example.com/clean.jpg",
          },
        ],
      };

      const mapped = mapChannel3Product(sample);
      expect(mapped?.imageUrl).toBeUndefined();
    });
  });
});
