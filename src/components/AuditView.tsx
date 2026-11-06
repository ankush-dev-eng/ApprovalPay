"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { fmt } from "@/lib/money";
import type { Proposal, ProposalStatus, Verdict } from "@/lib/types";

interface AuditViewProps {
  proposals: Proposal[];
  highlightId?: string;
  errorParam?: string;
}

type FilterTab = "all" | "captured" | "blocked" | "no_match" | "declined_failed";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

function getEffectiveStatus(p: Proposal): ProposalStatus | "expired" {
  if (p.status === "proposed") {
    const ageMs = Date.now() - new Date(p.createdAt).getTime();
    if (!isNaN(ageMs) && ageMs > FIFTEEN_MINUTES_MS) {
      return "expired";
    }
  }
  return p.status;
}

function formatClientTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

function policyPill(verdict: Verdict, status?: ProposalStatus | "expired") {
  if (status === "no_match") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
        <span>No match</span>
      </span>
    );
  }
  if (!verdict.allowed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
        <svg className="h-3 w-3 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span>Blocked</span>
      </span>
    );
  }
  if (verdict.needsApproval) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
        <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <span>Needs approval</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
      <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span>Allowed</span>
    </span>
  );
}

function statusPill(status: ProposalStatus | "expired") {
  switch (status) {
    case "captured":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>captured</span>
        </span>
      );
    case "order_created":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>order_created</span>
        </span>
      );
    case "proposed":
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
          proposed
        </span>
      );
    case "expired":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
          <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>expired</span>
        </span>
      );
    case "blocked":
      return (
        <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20">
          blocked
        </span>
      );
    case "no_match":
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 border border-slate-200">
          no_match
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
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
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
      className="inline-flex items-center gap-1 font-mono text-xs text-slate-700 bg-slate-100 hover:bg-slate-200/80 px-2 py-0.5 rounded transition-colors select-all"
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

export function AuditView({ proposals, highlightId, errorParam }: AuditViewProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Summary Strip Calculations
  const capturedList = proposals.filter((p) => p.status === "captured");
  const capturedCount = capturedList.length;
  const capturedTotalCents = capturedList.reduce((sum, p) => sum + p.verdict.totalCents, 0);

  // "Blocked by policy" counts only status "blocked"; "Spend prevented" sums only blocked totals; no_match is excluded from both.
  const blockedList = proposals.filter((p) => p.status === "blocked");
  const blockedCount = blockedList.length;
  const spendPreventedCents = blockedList.reduce((sum, p) => sum + p.verdict.totalCents, 0);

  const noMatchList = proposals.filter((p) => p.status === "no_match");
  const noMatchCount = noMatchList.length;

  const declinedList = proposals.filter(
    (p) => p.status === "declined" || p.status === "failed"
  );
  const declinedCount = declinedList.length;

  // Filtered proposals
  const filteredProposals = proposals.filter((p) => {
    const effective = getEffectiveStatus(p);
    if (activeTab === "captured") return effective === "captured";
    if (activeTab === "blocked") return effective === "blocked";
    if (activeTab === "no_match") return effective === "no_match";
    if (activeTab === "declined_failed")
      return effective === "declined" || effective === "failed" || effective === "cancelled";
    return true;
  });

  // Highlighted proposal details
  const highlightedProposal = highlightId
    ? proposals.find((p) => p.id === highlightId)
    : undefined;
  const highlightStatus = highlightedProposal
    ? getEffectiveStatus(highlightedProposal)
    : "captured";

  return (
    <div className="space-y-6">
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

      {/* Highlight Banner depending on status (No "securely recorded", inline SVG icons) */}
      {highlightId && (
        <>
          {highlightStatus === "captured" && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900 flex items-start gap-3 shadow-sm">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-600 text-white shrink-0 mt-0.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">Payment captured</h3>
                <p className="text-xs text-emerald-800 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>Highlighted proposal</span>
                  <IdBadge id={highlightId} label="Proposal ID" />
                  <span>has been updated below.</span>
                </p>
              </div>
            </div>
          )}

          {highlightStatus === "declined" && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-900 flex items-start gap-3 shadow-sm">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-rose-600 text-white shrink-0 mt-0.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              <div>
                <h3 className="text-sm font-bold text-rose-950">Payment declined by PayPal</h3>
                <p className="text-xs text-rose-800 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>Proposal</span>
                  <IdBadge id={highlightId} label="Proposal ID" />
                  <span>was declined by the payment provider.</span>
                </p>
              </div>
            </div>
          )}

          {highlightStatus === "cancelled" && (
            <div className="rounded-2xl bg-slate-100 border border-slate-300 p-4 text-slate-900 flex items-start gap-3 shadow-sm">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-500 text-white shrink-0 mt-0.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Checkout cancelled</h3>
                <p className="text-xs text-slate-700 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>The PayPal checkout session for proposal</span>
                  <IdBadge id={highlightId} label="Proposal ID" />
                  <span>was cancelled by user.</span>
                </p>
              </div>
            </div>
          )}

          {highlightStatus === "failed" && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-900 flex items-start gap-3 shadow-sm">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-500 text-white shrink-0 mt-0.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </span>
              <div>
                <h3 className="text-sm font-bold text-amber-950">Something went wrong</h3>
                <p className="text-xs text-amber-800 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>Proposal</span>
                  <IdBadge id={highlightId} label="Proposal ID" />
                  <span>encountered an issue during processing.</span>
                </p>
              </div>
            </div>
          )}

          {highlightStatus === "order_created" && (
            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-blue-900 flex items-start gap-3 shadow-sm">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 text-white shrink-0 mt-0.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <h3 className="text-sm font-bold text-blue-950">Awaiting payment</h3>
                <p className="text-xs text-blue-800 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>PayPal order created for proposal</span>
                  <IdBadge id={highlightId} label="Proposal ID" />
                  <span>Awaiting buyer confirmation.</span>
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Summary Strip (4 Numbers: Payments captured count + $, Blocked count, Spend prevented $, Declined count) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Payments captured */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Payments captured
            </span>
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono tabular-nums">
              {capturedCount}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-emerald-600 font-mono tabular-nums">
              (${fmt(capturedTotalCents)})
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Paid on PayPal Sandbox</p>
        </div>

        {/* Metric 2: Blocked by policy */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Blocked by policy
            </span>
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-rose-50 text-rose-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono tabular-nums">
              {blockedCount}
            </span>
            <span className="text-xs font-medium text-slate-400">proposals</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Halted before checkout</p>
        </div>

        {/* Metric 3: Spend prevented */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Spend prevented
            </span>
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-slate-100 text-slate-700">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono tabular-nums">
              ${fmt(spendPreventedCents)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Policy limits saved</p>
        </div>

        {/* Metric 4: Declined */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Declined orders
            </span>
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-amber-50 text-amber-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono tabular-nums">
              {declinedCount}
            </span>
            <span className="text-xs font-medium text-slate-400">orders</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Declined or failed</p>
        </div>
      </div>

      {/* Filter Tabs & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic record of proposals, spending rule checks, and PayPal checkout orders.
          </p>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="inline-flex items-center rounded-xl bg-slate-200/70 p-1 text-xs font-medium self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-white text-slate-900 font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All <span className="ml-1 text-[10px] text-slate-400 font-normal">({proposals.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("captured")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "captured"
                ? "bg-white text-emerald-800 font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Captured <span className="ml-1 text-[10px] text-emerald-600 font-normal">({capturedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("blocked")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "blocked"
                ? "bg-white text-rose-800 font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Blocked <span className="ml-1 text-[10px] text-rose-600 font-normal">({blockedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("no_match")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "no_match"
                ? "bg-white text-slate-800 font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            No match <span className="ml-1 text-[10px] text-slate-500 font-normal">({noMatchCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("declined_failed")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "declined_failed"
                ? "bg-white text-amber-900 font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Declined/Failed <span className="ml-1 text-[10px] text-amber-700 font-normal">({declinedCount})</span>
          </button>
        </div>
      </div>

      {/* Proposals Table */}
      {filteredProposals.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto h-12 w-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-800">No proposals in this view</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === "all"
              ? "No shopping proposals have been evaluated yet. Try making a purchase on the main page."
              : `No proposals match the "${activeTab}" filter.`}
          </p>
        </div>
      ) : (
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[980px] text-left border-collapse table-auto">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">Time</th>
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">Proposal ID</th>
                  <th scope="col" className="px-4 py-3">Request</th>
                  <th scope="col" className="px-4 py-3">Items</th>
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">Total ($)</th>
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">Policy result</th>
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th scope="col" className="px-4 py-3 whitespace-nowrap min-w-[150px]">PayPal Order ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredProposals.map((p) => {
                  const effectiveStatus = getEffectiveStatus(p);
                  const isHighlighted = p.id === highlightId;
                  const itemTitles = p.items.map((i) => i.product.title).join(", ");

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
                          {formatClientTime(p.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <IdBadge id={p.id} label="Proposal ID" />
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-900 max-w-xs truncate" title={p.request}>
                          {p.request}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate" title={itemTitles || "No items"}>
                          {itemTitles || <span className="text-slate-400 italic">No items</span>}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-bold font-mono text-slate-900 tabular-nums">
                          ${fmt(p.verdict.totalCents)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {policyPill(p.verdict, effectiveStatus)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {statusPill(effectiveStatus)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap min-w-[150px]">
                          {p.orderId ? (
                            <IdBadge id={p.orderId} label="PayPal Order ID" />
                          ) : (
                            <span className="text-slate-400 font-mono">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Row Details */}
                      <tr
                        className={`${
                          isHighlighted ? "bg-emerald-50/40" : "bg-slate-50/40"
                        }`}
                      >
                        <td colSpan={8} className="px-4 py-1.5 max-w-full">
                          <details
                            className="group py-1"
                            open={isHighlighted}
                          >
                            <summary className="cursor-pointer text-[11px] font-semibold text-slate-700 hover:text-slate-950 select-none inline-flex items-center gap-1.5 focus:outline-none">
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

                            <div className="mt-2.5 mb-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3.5 max-w-full overflow-hidden">
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
                                    <span className="text-slate-900 font-semibold font-mono tabular-nums">
                                      ${fmt(p.parsed.maxPricePerItemCents)}
                                    </span>
                                  </div>
                                )}
                                <div className="text-[11px] text-slate-500 font-mono ml-auto flex items-center gap-1.5">
                                  <span>Proposal ID:</span>
                                  <IdBadge id={p.id} label="Proposal ID" />
                                </div>
                              </div>

                              {/* Curated Items & Reasoning */}
                              <div>
                                <span className="font-bold text-xs text-slate-700 block mb-2">
                                  Curated items &amp; agent reasoning ({p.items.length})
                                </span>
                                {p.items.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic">No items were selected for this proposal.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {p.items.map(({ product, reason }, idx) => (
                                      <div
                                        key={idx}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                                      >
                                        <div className="space-y-0.5">
                                          <div className="flex items-center gap-2">
                                            {product.url ? (
                                              <a
                                                href={product.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-semibold text-slate-900 hover:text-slate-950 inline-flex items-center gap-1 transition-colors"
                                              >
                                                <span>{product.title}</span>
                                                <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                              </a>
                                            ) : (
                                              <span className="font-semibold text-slate-900">{product.title}</span>
                                            )}
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

                              {/* Rule Checklist if available */}
                              {p.verdict.checks && p.verdict.checks.length > 0 && (
                                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1.5">
                                  <span className="font-bold text-xs text-slate-800 block">Rules checked:</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    {p.verdict.checks.map((c) => (
                                      <div key={c.rule} className="flex items-start gap-1.5 bg-white p-2 rounded border border-slate-100">
                                        <span className={c.passed ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                                          {c.passed ? "✓" : "✗"}
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

                              {/* Policy violations or reason if no_match */}
                              {p.verdict.violations.length > 0 && p.status !== "no_match" && (
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
                              {p.status === "no_match" && p.verdict.violations.length > 0 && (
                                <div className="rounded-lg bg-slate-100 border border-slate-200 p-3 text-slate-700 space-y-1">
                                  <span className="font-bold text-xs text-slate-800 block">Reason:</span>
                                  <p className="text-xs text-slate-600">
                                    {p.verdict.violations[0].replace(/^No close match:\s*/i, "")}
                                  </p>
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
        </div>
      )}
    </div>
  );
}
