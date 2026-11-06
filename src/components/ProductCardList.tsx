"use client";

import { useState } from "react";
import type { Product, Proposal } from "@/lib/types";
import { fmt } from "@/lib/money";

interface ProductCardListProps {
  proposal: Proposal | null;
  isLoading: boolean;
}

function ProductThumbnail({ src, alt }: { src?: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0"
        aria-hidden="true"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
      loading="lazy"
    />
  );
}

function getBrandOrMerchant(product: Product): string {
  if (product.brand) return product.brand;
  if (product.merchant) return product.merchant;
  if (product.url) {
    try {
      const host = new URL(product.url).hostname.replace(/^www\./i, "");
      if (host && !host.includes("example.com")) {
        const domainParts = host.split(".");
        const brandName = domainParts[0];
        return brandName.charAt(0).toUpperCase() + brandName.slice(1);
      }
    } catch {
      // ignore invalid URL
    }
  }
  // Try first word of title if capitalized brand
  const firstWord = product.title.trim().split(/\s+/)[0];
  if (firstWord && firstWord.length > 2 && /^[A-Z][a-zA-Z0-9]+$/.test(firstWord)) {
    return firstWord;
  }
  return product.category;
}

export function ProductCardList({ proposal, isLoading }: ProductCardListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading recommendations">
        <div className="flex items-center justify-between">
          <div className="h-4 w-44 bg-slate-200 rounded animate-pulse" />
          <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse"
            >
              <div className="flex items-start gap-3.5">
                {/* 64px image thumbnail skeleton */}
                <div className="w-16 h-16 rounded-xl bg-slate-200 shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-5 w-2/3 bg-slate-200 rounded" />
                    <div className="h-5 w-16 bg-slate-200 rounded shrink-0" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-16 bg-slate-100 rounded-md" />
                    <div className="h-4 w-20 bg-slate-100 rounded-md" />
                  </div>
                  <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center bg-white/50">
        <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-800">No items selected yet</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Type a request above or click one of the suggested example prompts to let the AI agent curate products within your spending policy.
        </p>
      </div>
    );
  }

  if (proposal.status === "no_match" || proposal.items.length === 0) {
    const noMatchViolation = proposal.verdict.violations.find((v) =>
      v.toLowerCase().includes("no close match")
    );

    if (proposal.status === "no_match" || noMatchViolation) {
      const reason = (
        noMatchViolation
          ? noMatchViolation.replace(/^no close match:?\s*/i, "").trim()
          : proposal.verdict.violations[0]?.replace(/^no close match:?\s*/i, "").trim()
      ) || "No catalog candidate matches the requested product or brand specifications.";

      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-xs">
          <div className="mx-auto h-12 w-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-800">No close match found</h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            {reason}
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto h-12 w-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-800">No matching products found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Try adjusting your search keywords or increasing the per-item budget cap in the spending policy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Agent recommendations ({proposal.items.length})
        </h3>
        <span className="text-xs text-slate-400">
          Parsed: &ldquo;{proposal.parsed.query}&rdquo;
        </span>
      </div>

      <div className="grid gap-3">
        {proposal.items.map(({ product, reason }, idx) => {
          const isChannel3 = product.id.startsWith("c3_");
          const brandOrMerchant = getBrandOrMerchant(product);

          return (
            <div
              key={`${product.id}-${idx}`}
              className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3.5">
                {/* 64px image thumbnail */}
                <ProductThumbnail src={product.imageUrl} alt={product.title} />

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {product.url ? (
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-slate-900 text-base leading-snug hover:text-indigo-600 inline-flex items-center gap-1.5 transition-colors line-clamp-1"
                        >
                          <span>{product.title}</span>
                          <svg
                            className="h-3.5 w-3.5 text-slate-400 hover:text-indigo-600 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      ) : (
                        <h4 className="font-semibold text-slate-900 text-base leading-snug line-clamp-1">
                          {product.title}
                        </h4>
                      )}

                      {/* Brand or Merchant Name + Category */}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {brandOrMerchant}
                        </span>

                        <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500 capitalize border border-slate-100">
                          {product.category}
                        </span>

                        {isChannel3 && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            Live Merchant
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price in tabular numerals */}
                    <div className="text-right shrink-0">
                      <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                        ${fmt(product.priceCents)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-slate-600 italic">
                    &ldquo;{reason}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
