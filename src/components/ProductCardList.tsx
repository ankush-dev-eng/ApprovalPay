import type { Proposal } from "@/lib/types";
import { fmt } from "@/lib/money";

interface ProductCardListProps {
  proposal: Proposal | null;
  isLoading: boolean;
}

export function ProductCardList({ proposal, isLoading }: ProductCardListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 animate-pulse">
              <div className="flex justify-between">
                <div className="h-5 w-40 bg-slate-200 rounded" />
                <div className="h-5 w-16 bg-slate-200 rounded" />
              </div>
              <div className="h-4 w-24 bg-slate-100 rounded" />
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
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

  if (proposal.items.length === 0) {
    const noMatchViolation = proposal.verdict.violations.find((v) =>
      v.toLowerCase().includes("no close match")
    );

    if (noMatchViolation) {
      const reason = noMatchViolation.replace(/^no close match:?\s*/i, "").trim();
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-xs">
          <div className="mx-auto h-12 w-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-800">No close match found</h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            {reason || "No catalog candidate matches the requested product or brand specifications."}
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

          return (
            <div
              key={`${product.id}-${idx}`}
              className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {product.url ? (
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-slate-900 text-base leading-snug hover:text-indigo-600 inline-flex items-center gap-1.5 transition-colors"
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
                      <h4 className="font-semibold text-slate-900 text-base leading-snug">
                        {product.title}
                      </h4>
                    )}

                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 capitalize">
                      {product.category}
                    </span>

                    {isChannel3 && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        Live Merchant
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 italic">
                    &ldquo;{reason}&rdquo;
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    ${fmt(product.priceCents)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
