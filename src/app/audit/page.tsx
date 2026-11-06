import Link from "next/link";
import { Fragment } from "react";
import { listProposals } from "@/lib/store";
import { fmt } from "@/lib/money";
import type { Verdict, ProposalStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

interface AuditPageProps {
  searchParams: Promise<{ highlight?: string; error?: string }>;
}

function policyPill(verdict: Verdict) {
  if (!verdict.allowed) {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
        Blocked
      </span>
    );
  }
  if (verdict.needsApproval) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
        Needs approval
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
      Allowed
    </span>
  );
}

function statusPill(status: ProposalStatus) {
  switch (status) {
    case "captured":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
          captured
        </span>
      );
    case "order_created":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
          order_created
        </span>
      );
    case "proposed":
      return (
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
          proposed
        </span>
      );
    case "blocked":
      return (
        <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20">
          blocked
        </span>
      );
    case "declined":
      return (
        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800">
          declined
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800">
          failed
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
          cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {status}
        </span>
      );
  }
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams;
  const highlightId = params.highlight;
  const errorParam = params.error;
  const proposals = await listProposals();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
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
              Audit Trail
            </span>
          </div>

          <Link
            href="/"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 px-3.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <span aria-hidden="true">&larr;</span>
            <span>Back to shopping</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Error Banner */}
        {errorParam && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-800 flex items-start gap-3 shadow-sm">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-rose-200 text-rose-800 font-bold text-sm shrink-0 mt-0.5">
              !
            </span>
            <div>
              <h3 className="text-sm font-semibold text-rose-900">Callback Error</h3>
              <p className="text-xs text-rose-700 mt-0.5">
                {errorParam === "missing"
                  ? "No order token received from checkout callback."
                  : errorParam === "unknown"
                  ? "The specified order could not be identified in the store."
                  : `Payment error: ${errorParam}`}
              </p>
            </div>
          </div>
        )}

        {/* Highlight notification if redirected from checkout */}
        {highlightId && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900 flex items-start gap-3 shadow-sm">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-600 text-white font-bold text-sm shrink-0 mt-0.5">
              &check;
            </span>
            <div>
              <h3 className="text-sm font-bold">Transaction Recorded</h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Highlighted proposal <span className="font-mono font-semibold">{highlightId.slice(0, 8)}</span> has been updated and securely recorded below.
              </p>
            </div>
          </div>
        )}

        {/* Page Title & Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Audit Trail
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic log of AI shopping proposals, spending policy decisions, and PayPal order status.
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs self-start sm:self-auto">
            {proposals.length} proposal{proposals.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Table */}
        {proposals.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center bg-white">
            <h3 className="text-base font-semibold text-slate-800">No audit records found</h3>
            <p className="text-sm text-slate-500 mt-1">
              Ask the shopping agent on the home page to create proposals and test spending policies.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">Time</th>
                  <th scope="col" className="px-4 py-3">Request</th>
                  <th scope="col" className="px-4 py-3">Items</th>
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">Total ($)</th>
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">Policy result</th>
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">PayPal order id</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {proposals.map((p) => {
                  const isHighlighted = p.id === highlightId;
                  const itemTitles = p.items.map((i) => i.product.title).join(", ");
                  const truncatedOrderId = p.orderId
                    ? `${p.orderId.slice(0, 10)}…`
                    : "—";

                  return (
                    <Fragment key={p.id}>
                      <tr
                        className={`transition-colors ${
                          isHighlighted
                            ? "bg-emerald-50/80 font-medium"
                            : "hover:bg-slate-50/70"
                        }`}
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                          {formatTime(p.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-900 max-w-xs truncate" title={p.request}>
                          {p.request}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate" title={itemTitles || "No items"}>
                          {itemTitles || <span className="text-slate-400 italic">No items</span>}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-bold font-mono text-slate-900">
                          ${fmt(p.verdict.totalCents)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {policyPill(p.verdict)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {statusPill(p.status)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-600" title={p.orderId ?? undefined}>
                          {truncatedOrderId}
                        </td>
                      </tr>

                      {/* Expandable Row Details */}
                      <tr
                        className={`${
                          isHighlighted ? "bg-emerald-50/40" : "bg-slate-50/40"
                        }`}
                      >
                        <td colSpan={7} className="px-4 py-1.5">
                          <details
                            className="group py-1"
                            open={isHighlighted}
                          >
                            <summary className="cursor-pointer text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 select-none inline-flex items-center gap-1.5 focus:outline-none">
                              <span>Expand details</span>
                              <svg
                                className="w-3.5 h-3.5 group-open:rotate-180 transition-transform"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </summary>

                            <div className="mt-2.5 mb-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3.5">
                              {/* Parsed query & quantity */}
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 pb-2.5 border-b border-slate-100 text-xs">
                                <div>
                                  <span className="text-slate-500 font-medium">Parsed query:</span>{" "}
                                  <span className="text-slate-900 font-semibold">&ldquo;{p.parsed.query}&rdquo;</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-medium">Quantity:</span>{" "}
                                  <span className="text-slate-900 font-semibold">{p.parsed.quantity}</span>
                                </div>
                                {p.parsed.maxPricePerItemCents !== null && (
                                  <div>
                                    <span className="text-slate-500 font-medium">Max price/item:</span>{" "}
                                    <span className="text-slate-900 font-semibold font-mono">${fmt(p.parsed.maxPricePerItemCents)}</span>
                                  </div>
                                )}
                                <div className="text-slate-400 font-mono text-[11px] ml-auto">
                                  ID: {p.id}
                                </div>
                              </div>

                              {/* Items with agent's reason */}
                              <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                                  Curated items &amp; agent reasoning ({p.items.length})
                                </span>
                                {p.items.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic">No items selected</p>
                                ) : (
                                  <div className="space-y-2">
                                    {p.items.map(({ product, reason }, idx) => (
                                      <div
                                        key={idx}
                                        className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                                      >
                                        <div className="space-y-0.5">
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-900">{product.title}</span>
                                            <span className="text-[10px] text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded capitalize">
                                              {product.category}
                                            </span>
                                          </div>
                                          <p className="text-slate-600 italic text-xs">&ldquo;{reason}&rdquo;</p>
                                        </div>
                                        <span className="font-mono font-bold text-slate-900 shrink-0 sm:ml-4">
                                          ${fmt(product.priceCents)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Policy violations if any */}
                              {p.verdict.violations.length > 0 && (
                                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-rose-800 space-y-1">
                                  <span className="font-bold text-xs text-rose-900 block">Policy violations:</span>
                                  <ul className="space-y-1 text-xs">
                                    {p.verdict.violations.map((v, i) => (
                                      <li key={i} className="flex items-start gap-1.5">
                                        <span className="text-rose-500 font-bold">&bull;</span>
                                        <span>{v}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Rule Checklist if available */}
                              {p.verdict.checks && p.verdict.checks.length > 0 && (
                                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1.5">
                                  <span className="font-bold text-xs text-slate-800 block">Rule Checklist:</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    {p.verdict.checks.map((c) => (
                                      <div key={c.rule} className="flex items-start gap-1.5 bg-white p-2 rounded border border-slate-100">
                                        <span className={c.passed ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                                          {c.passed ? "✓" : "!"}
                                        </span>
                                        <div>
                                          <span className="font-semibold text-slate-800 capitalize">{c.rule}</span>
                                          <p className="text-[11px] text-slate-500">{c.detail}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Note field if present */}
                              {p.note && (
                                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                                  <span className="font-semibold text-slate-700">Note:</span> {p.note}
                                </div>
                              )}
                            </div>
                          </details>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
