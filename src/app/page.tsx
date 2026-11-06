"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { AgentInput } from "@/components/AgentInput";
import { ProductCardList } from "@/components/ProductCardList";
import { PolicyPanel } from "@/components/PolicyPanel";
import { VerdictPanel } from "@/components/VerdictPanel";
import type { Policy, Proposal } from "@/lib/types";
import { DEFAULT_POLICY } from "@/lib/policy";

const POLICY_STORAGE_KEY = "approvalpay.policy.v2";

export default function Home() {
  const [request, setRequest] = useState("");
  const [policy, setPolicy] = useState<Policy>(DEFAULT_POLICY);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load saved spending policy from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(POLICY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          typeof parsed.perItemCapCents === "number" &&
          typeof parsed.totalBudgetCents === "number" &&
          typeof parsed.approvalThresholdCents === "number" &&
          Array.isArray(parsed.blockedCategories)
        ) {
          setPolicy(parsed);
        }
      }
    } catch {
      // Fallback to DEFAULT_POLICY on parsing error
    }
  }, []);

  const handlePolicyChange = (newPolicy: Policy) => {
    setPolicy(newPolicy);
    try {
      localStorage.setItem(POLICY_STORAGE_KEY, JSON.stringify(newPolicy));
    } catch {
      // LocalStorage error handling
    }
  };

  const handleAskAgent = async () => {
    if (!request.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: request.trim(),
          policy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const detail = data.detail ? `: ${data.detail}` : "";
        throw new Error(`${data.error || "The agent could not fulfill this request."}${detail}`);
      }

      setProposal(data.proposal);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong while consulting the agent."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-200 selection:text-slate-900 overflow-x-hidden relative">
      {/* GetLayers subtle ambient canvas light */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(148,163,184,0.12),transparent_70%)]"
        aria-hidden="true"
      />
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden relative z-10">
        {/* Error banner */}
        {errorMessage && (
          <div className="mb-6 rounded-xl bg-rose-50/90 border border-rose-200 p-4 text-rose-800 flex items-start justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-rose-200 text-rose-900 font-bold text-xs shrink-0 mt-0.5">
                !
              </span>
              <div>
                <h3 className="text-xs font-bold text-rose-950">Agent Notice</h3>
                <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-700 text-base font-bold focus:outline-none cursor-pointer"
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}

        {/* Two-column layout on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Input & Curated Products */}
          <div className="lg:col-span-7 space-y-6 min-w-0">
            <AgentInput
              request={request}
              setRequest={setRequest}
              onSubmit={handleAskAgent}
              isLoading={isLoading}
            />

            <ProductCardList proposal={proposal} isLoading={isLoading} />
          </div>

          {/* RIGHT COLUMN: Spending Policy & Verdict */}
          <div className="lg:col-span-5 space-y-6 min-w-0">
            <PolicyPanel
              policy={policy}
              onChange={handlePolicyChange}
              disabled={isLoading}
            />

            <VerdictPanel
              proposal={proposal}
              isLoadingAgent={isLoading}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2 text-xs text-slate-500 text-center sm:text-left">
          <p className="font-semibold text-slate-700 text-sm">
            ApprovalPay &middot; PayPal AI Hackathon
          </p>
          <p className="text-[11px] text-slate-400">
            Sandbox payments only. Real merchant products are shown for demonstration; checkout pays the sandbox store.
          </p>
        </div>
      </footer>
    </div>
  );
}
