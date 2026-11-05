import Link from "next/link";
import { listProposals } from "@/lib/store";
import { fmt } from "@/lib/money";

export const dynamic = "force-dynamic";

interface AuditPageProps {
  searchParams: Promise<{ highlight?: string; error?: string }>;
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams;
  const highlightId = params.highlight;
  const errorParam = params.error;
  const proposals = (await listProposals()).slice().reverse(); // Show most recent first

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-indigo-200 group-hover:bg-indigo-500 transition-colors">
                AP
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                ApprovalPay
              </span>
            </Link>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              Audit Viewer
            </span>
          </div>

          <Link
            href="/"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 px-3.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <span aria-hidden="true">&larr;</span>
            <span>Back to Shopping Agent</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* Banner notification if redirected after checkout */}
        {highlightId && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900 flex items-center gap-3 shadow-sm">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-emerald-600 text-white shrink-0">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <h3 className="text-sm font-bold">PayPal Payment Successful &amp; Captured</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                The transaction was completed in PayPal Sandbox and securely logged below with full policy attribution.
              </p>
            </div>
          </div>
        )}

        {errorParam && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-900 flex items-center gap-3 shadow-sm">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-rose-600 text-white shrink-0 font-bold">
              !
            </span>
            <div>
              <h3 className="text-sm font-bold">PayPal Callback Notice</h3>
              <p className="text-xs text-rose-700 mt-0.5">
                Reason: {errorParam === "missing" ? "No order token received." : "Order could not be identified."}
              </p>
            </div>
          </div>
        )}

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Governance Audit Trail
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Immutable server-side record of shopping proposals, policy verdicts, and PayPal capture IDs.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm self-start sm:self-auto">
            {proposals.length} total event{proposals.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Proposals List */}
        {proposals.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center bg-white">
            <h3 className="text-base font-semibold text-slate-800">No audit records yet</h3>
            <p className="text-sm text-slate-500 mt-1">
              Use the shopping agent on the home page to create proposals and test spending policies.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((p) => {
              const isHighlighted = p.id === highlightId;
              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border bg-white p-6 shadow-sm transition-all ${
                    isHighlighted
                      ? "ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Status Badges */}
                      {p.status === "captured" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold">
                          <span className="h-2 w-2 rounded-full bg-emerald-600" />
                          Captured &amp; Paid
                        </span>
                      )}
                      {p.status === "order_created" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-bold">
                          <span className="h-2 w-2 rounded-full bg-amber-600" />
                          Order Created
                        </span>
                      )}
                      {p.status === "proposed" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 text-indigo-800 px-3 py-1 text-xs font-bold">
                          <span className="h-2 w-2 rounded-full bg-indigo-600" />
                          Proposed
                        </span>
                      )}
                      {p.status === "blocked" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-800 px-3 py-1 text-xs font-bold">
                          <span className="h-2 w-2 rounded-full bg-rose-600" />
                          Blocked by Policy
                        </span>
                      )}
                      {p.status === "cancelled" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-bold">
                          <span className="h-2 w-2 rounded-full bg-slate-500" />
                          Cancelled
                        </span>
                      )}
                      {(p.status === "declined" || p.status === "failed") && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-800 px-3 py-1 text-xs font-bold">
                          <span className="h-2 w-2 rounded-full bg-rose-600" />
                          {p.status.toUpperCase()}
                        </span>
                      )}

                      <span className="text-xs font-mono text-slate-400">ID: {p.id}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{new Date(p.createdAt).toLocaleString()}</span>
                      {p.orderId && (
                        <span className="inline-flex items-center gap-1 font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          PayPal Order: {p.orderId}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* User Prompt & Items */}
                    <div className="lg:col-span-7 space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Shopper Request
                        </span>
                        <p className="text-sm font-medium text-slate-900 mt-0.5">
                          &ldquo;{p.request}&rdquo;
                        </p>
                      </div>

                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Curated Items ({p.items.length})
                        </span>
                        <div className="mt-1.5 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 space-y-1.5">
                          {p.items.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-1">No items selected</p>
                          ) : (
                            p.items.map(({ product, reason }, idx) => (
                              <div key={idx} className="flex items-center justify-between py-1 text-xs">
                                <div>
                                  <span className="font-semibold text-slate-800">{product.title}</span>
                                  <span className="text-slate-400 ml-1.5 capitalize">({product.category})</span>
                                </div>
                                <span className="font-mono font-bold text-slate-900">
                                  ${fmt(product.priceCents)}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Spend & Policy Verdict */}
                    <div className="lg:col-span-5 space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Total Amount
                        </span>
                        <span className="text-xl font-black text-slate-900 font-mono">
                          ${fmt(p.verdict.totalCents)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Item Cap:</span>
                          <span className="font-mono font-semibold">${fmt(p.policy.perItemCapCents)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total Budget:</span>
                          <span className="font-mono font-semibold">${fmt(p.policy.totalBudgetCents)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Approval Threshold:</span>
                          <span className="font-mono font-semibold">${fmt(p.policy.approvalThresholdCents)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Blocked Categories:</span>
                          <span className="text-slate-700">{p.policy.blockedCategories.join(", ") || "none"}</span>
                        </div>
                      </div>

                      {p.verdict.violations.length > 0 && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-xs font-bold text-rose-700">Violations:</span>
                          <ul className="mt-1 space-y-0.5 text-xs text-rose-600">
                            {p.verdict.violations.map((v, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span>&bull;</span>
                                <span>{v}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {p.note && (
                        <div className="pt-2 border-t border-slate-200 text-xs text-slate-500 italic">
                          Note: {p.note}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
