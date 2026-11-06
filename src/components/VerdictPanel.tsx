"use client";

import { useState } from "react";
import type { Proposal } from "@/lib/types";
import { fmt } from "@/lib/money";

interface VerdictPanelProps {
  proposal: Proposal | null;
  isLoadingAgent: boolean;
}

function IdBadge({ id, label }: { id: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const shortId = id.slice(0, 8);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard fallback
    }
  };

  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-700 bg-slate-100 hover:bg-slate-200/80 px-2 py-0.5 rounded transition-colors select-all"
      title={`Full ${label ?? "ID"}: ${id}`}
    >
      <span>{shortId}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="text-slate-400 hover:text-slate-700 focus:outline-none p-0.5 rounded transition-colors cursor-pointer"
        title={copied ? "Copied!" : `Copy full ${label ?? "ID"}`}
        aria-label={`Copy ${label ?? "ID"}`}
      >
        {copied ? (
          <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </span>
  );
}

export function VerdictPanel({ proposal, isLoadingAgent }: VerdictPanelProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  if (!proposal) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 mb-2">Policy Verdict</h2>
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center bg-slate-50/50">
          <p className="text-sm text-slate-500">
            Submit a request to see the policy evaluation and proceed to checkout.
          </p>
        </div>
      </div>
    );
  }

  const { verdict } = proposal;
  const isCaptured = proposal.status === "captured";
  const isNoMatch = proposal.status === "no_match";
  const canProceed =
    !isNoMatch &&
    verdict.allowed &&
    (!verdict.needsApproval || confirmed) &&
    !isCheckingOut &&
    !isLoadingAgent &&
    !isCaptured;

  const handlePay = async () => {
    // Prevent double submits
    if (!canProceed || isCheckingOut) return;
    setIsCheckingOut(true);
    setOrderError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposal.id,
          confirmed: verdict.needsApproval ? true : false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Order creation failed");
      }

      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      } else {
        throw new Error("No approval URL received from PayPal");
      }
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Failed to initiate payment");
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">Policy Verdict</h2>
          <p className="text-xs text-slate-500">Deterministic spend validation</p>
        </div>
        <IdBadge id={proposal.id} label="Proposal ID" />
      </div>

      {/* Large Status Pill */}
      <div>
        {isCaptured ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-600 text-white shrink-0">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-base font-bold text-emerald-900">Payment Captured &amp; Completed</span>
            </div>
            <p className="text-xs text-emerald-800 mt-1.5 font-medium">
              Order {proposal.orderId ? `#${proposal.orderId}` : ""} has been successfully paid and recorded in the audit trail.
            </p>
          </div>
        ) : isNoMatch ? (
          <div className="rounded-xl bg-slate-100 border border-slate-200 p-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-400 text-white font-bold text-xs shrink-0">
                —
              </span>
              <span className="text-base font-bold text-slate-800">No purchase proposed</span>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 font-medium">
              {proposal.verdict.violations[0]?.replace(/^No close match:\s*/i, "") ||
                "No matching products found for your request."}
            </p>
          </div>
        ) : !verdict.allowed ? (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-rose-600 text-white shrink-0">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              <span className="text-base font-bold text-rose-900">Blocked by policy</span>
            </div>
            <p className="text-xs text-rose-700 mt-1 font-medium">
              This proposal violates one or more spending constraints:
            </p>
            <ul className="mt-2.5 space-y-1">
              {verdict.violations.map((violation, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-medium text-rose-800">
                  <span className="text-rose-500 font-bold">&bull;</span>
                  <span>{violation}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : verdict.needsApproval ? (
          <div className="rounded-xl bg-amber-50 border border-amber-300 p-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-500 text-white font-bold text-xs shrink-0">
                !
              </span>
              <span className="text-base font-bold text-amber-900">Needs your approval</span>
            </div>
            <p className="text-xs text-amber-800 mt-1 font-medium">
              Basket total exceeds the approval threshold (${fmt(proposal.policy.approvalThresholdCents)}). Human confirmation is required before payment.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-600 text-white shrink-0">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-base font-bold text-emerald-900">Within policy</span>
            </div>
            <p className="text-xs text-emerald-700 mt-1">
              All selected items and totals comply with spending limits. Ready for one-click checkout.
            </p>
          </div>
        )}
      </div>

      {/* Rules checked list (under the status pill, shown for allowed, approval, blocked, and no_match states) */}
      {verdict.checks && verdict.checks.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700">
              Rules checked
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold">
              {(() => {
                if (isNoMatch) return "Rules skipped";
                if (!verdict.allowed) {
                  const failedCount =
                    verdict.checks.filter((c) => !c.passed && c.rule !== "approval threshold").length ||
                    verdict.checks.filter((c) => !c.passed).length;
                  return `${failedCount} rule${failedCount === 1 ? "" : "s"} failed`;
                }
                if (verdict.needsApproval) return "Needs your approval";
                return "All rules passed";
              })()}
            </span>
          </div>
          <div className="space-y-1.5">
            {verdict.checks.map((c) => {
              const isThresholdReview = !isNoMatch && !c.passed && c.rule === "approval threshold";
              let badgeText = "PASS";
              let badgeStyle = "bg-emerald-50 text-emerald-700 border border-emerald-200";
              let icon = (
                <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 shrink-0 mt-0.5" title="Rule passed">
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              );

              if (isNoMatch) {
                badgeText = "SKIPPED";
                badgeStyle = "bg-slate-100 text-slate-500 border border-slate-200";
                icon = (
                  <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-slate-200 text-slate-500 shrink-0 mt-0.5 font-bold text-[10px]" title="Rule skipped">
                    —
                  </span>
                );
              } else if (isThresholdReview) {
                badgeText = "REVIEW";
                badgeStyle = "bg-amber-50 text-amber-700 border border-amber-200";
                icon = (
                  <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-amber-100 text-amber-700 shrink-0 mt-0.5 font-bold text-[10px]" title="Requires approval">
                    !
                  </span>
                );
              } else if (!c.passed) {
                badgeText = "FAIL";
                badgeStyle = "bg-rose-50 text-rose-700 border border-rose-200";
                icon = (
                  <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-rose-100 text-rose-700 shrink-0 mt-0.5" title="Rule violated">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                );
              }

              return (
                <div
                  key={c.rule}
                  className="flex items-start justify-between gap-2 p-2 rounded-lg bg-white border border-slate-100 text-xs shadow-2xs"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    {icon}
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-800 capitalize block truncate">{c.rule}</span>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        {isNoMatch ? "Skipped" : c.detail}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase ${badgeStyle}`}
                  >
                    {badgeText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cart Summary & Total */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-600">
            Item total (excl. shipping &amp; tax)
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            {proposal.items.length} item{proposal.items.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            ${fmt(verdict.totalCents)}
          </span>
          <span className="block text-[10px] text-slate-400 font-mono">USD</span>
        </div>
      </div>

      {/* Explicit approval checkbox if required */}
      {!isCaptured && verdict.allowed && verdict.needsApproval && (
        <label className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 cursor-pointer select-none hover:bg-amber-50 transition-colors">
          <input
            type="checkbox"
            checked={confirmed}
            disabled={isCheckingOut}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-amber-400 text-slate-900 focus:ring-slate-900 cursor-pointer"
          />
          <div className="text-xs">
            <span className="font-semibold text-amber-950 block">
              I approve spending ${fmt(verdict.totalCents)}
            </span>
            <span className="text-amber-800">
              I have reviewed the curated items and confirm payment authorization.
            </span>
          </div>
        </label>
      )}

      {/* Inline Order Error */}
      {orderError && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2 shadow-xs">
          <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-rose-200 text-rose-800 font-bold text-[10px] shrink-0 mt-0.5">
            !
          </span>
          <p className="font-medium">{orderError}</p>
        </div>
      )}

      {/* Action Button */}
      <div>
        {isCaptured ? (
          <div className="w-full text-center py-3 px-4 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-sm">
            &check; Paid &amp; Saved to Audit Trail
          </div>
        ) : isNoMatch ? (
          <button
            type="button"
            disabled
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-200 px-6 py-3.5 text-base font-bold text-slate-400 cursor-not-allowed"
          >
            Nothing to pay for
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePay}
            disabled={!canProceed || isCheckingOut}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#003087] px-5 py-3 text-sm font-bold text-white shadow-2xs hover:bg-[#002466] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003087] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
          >
            {isCheckingOut ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Redirecting to PayPal...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span>Approve &amp; pay with PayPal</span>
                <svg className="h-4 w-4 fill-current opacity-90" viewBox="0 0 24 24">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.641.641 0 0 1 .632-.54h7.106c3.275 0 5.673.743 6.643 2.052 1.01 1.364.887 3.392-.375 6.185-1.127 2.493-2.906 4.093-5.289 4.757-.597.166-1.303.252-2.102.257l-.396.002H9.06a.82.82 0 0 0-.81.692l-.768 4.212-.406 0zm10.158-13.88c-.68-.916-2.222-1.428-4.582-1.428H6.945L4.472 19.418h2.37l.768-4.212a2.742 2.742 0 0 1 2.706-2.314h2.003c2.42 0 4.31-.692 5.617-2.058 1.157-1.21 1.583-2.736 1.267-4.53-.16-.91-.564-1.602-1.169-2.147z" />
                </svg>
              </span>
            )}
          </button>
        )}

        {!isCaptured && !verdict.allowed && !isNoMatch && (
          <p className="text-center text-xs text-rose-600 mt-2 font-medium">
            Payment disabled: Basket exceeds spending policy limits.
          </p>
        )}
        {!isCaptured && verdict.allowed && verdict.needsApproval && !confirmed && (
          <p className="text-center text-xs text-amber-700 mt-2 font-medium">
            Please tick the approval box above to enable PayPal checkout.
          </p>
        )}
      </div>
    </div>
  );
}
