"use client";

import { useState } from "react";
import type { Policy } from "@/lib/types";
import { DEFAULT_POLICY } from "@/lib/policy";

interface PolicyPanelProps {
  policy: Policy;
  onChange: (policy: Policy) => void;
  disabled?: boolean;
}

export function PolicyPanel({ policy, onChange, disabled }: PolicyPanelProps) {
  const [newCategory, setNewCategory] = useState("");

  const updateField = (field: keyof Policy, value: number) => {
    onChange({
      ...policy,
      [field]: value,
    });
  };

  const handleCapChange = (valStr: string) => {
    const val = Number(valStr);
    if (isNaN(val)) return;
    const clamped = Math.max(1, Math.min(500, Math.round(val)));
    updateField("perItemCapCents", clamped * 100);
  };

  const handleBudgetChange = (valStr: string) => {
    const val = Number(valStr);
    if (isNaN(val)) return;
    const clamped = Math.max(1, Math.min(500, Math.round(val)));
    updateField("totalBudgetCents", clamped * 100);
  };

  const handleThresholdChange = (valStr: string) => {
    const val = Number(valStr);
    if (isNaN(val)) return;
    const clamped = Math.max(0, Math.min(500, Math.round(val)));
    updateField("approvalThresholdCents", clamped * 100);
  };

  const handleAddCategory = () => {
    const cleaned = newCategory.trim().toLowerCase();
    if (!cleaned) return;
    if (!policy.blockedCategories.includes(cleaned)) {
      onChange({
        ...policy,
        blockedCategories: [...policy.blockedCategories, cleaned],
      });
    }
    setNewCategory("");
  };

  const handleRemoveCategory = (cat: string) => {
    onChange({
      ...policy,
      blockedCategories: policy.blockedCategories.filter((c) => c !== cat),
    });
  };

  const handleReset = () => {
    onChange(DEFAULT_POLICY);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">Spending Policy</h2>
          <p className="text-xs text-slate-500">Spending rules the AI can&apos;t override</p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={disabled}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 disabled:opacity-50 transition-colors"
          title="Reset to default policy"
        >
          Reset defaults
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Per-item cap */}
        <div className="space-y-1">
          <label htmlFor="per-item-cap" className="block text-xs font-semibold text-slate-700">
            Per-item cap
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-slate-500 text-sm">$</span>
            </div>
            <input
              id="per-item-cap"
              type="number"
              min={1}
              max={500}
              disabled={disabled}
              value={Math.round(policy.perItemCapCents / 100)}
              onChange={(e) => handleCapChange(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 py-1.5 pl-7 pr-3 text-sm text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 disabled:bg-slate-50 disabled:opacity-60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <p className="text-[10px] text-slate-400">Max item ($1-$500)</p>
        </div>

        {/* Total budget */}
        <div className="space-y-1">
          <label htmlFor="total-budget" className="block text-xs font-semibold text-slate-700">
            Total budget
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-slate-500 text-sm">$</span>
            </div>
            <input
              id="total-budget"
              type="number"
              min={1}
              max={500}
              disabled={disabled}
              value={Math.round(policy.totalBudgetCents / 100)}
              onChange={(e) => handleBudgetChange(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 py-1.5 pl-7 pr-3 text-sm text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 disabled:bg-slate-50 disabled:opacity-60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <p className="text-[10px] text-slate-400">Max cart ($1-$500)</p>
        </div>

        {/* Approval threshold */}
        <div className="space-y-1">
          <label htmlFor="approval-threshold" className="block text-xs font-semibold text-slate-700">
            Approval threshold
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-slate-500 text-sm">$</span>
            </div>
            <input
              id="approval-threshold"
              type="number"
              min={0}
              max={500}
              disabled={disabled}
              value={Math.round(policy.approvalThresholdCents / 100)}
              onChange={(e) => handleThresholdChange(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 py-1.5 pl-7 pr-3 text-sm text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 disabled:bg-slate-50 disabled:opacity-60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <p className="text-[10px] text-slate-400">Sign-off above ($0-$500)</p>
        </div>
      </div>

      {/* Blocked categories */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="block text-xs font-semibold text-slate-700">
          Blocked categories
        </label>
        <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
          {policy.blockedCategories.length === 0 ? (
            <span className="text-xs text-slate-400 italic">No categories blocked</span>
          ) : (
            policy.blockedCategories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-800"
              >
                <span>{cat}</span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleRemoveCategory(cat)}
                  className="text-rose-400 hover:text-rose-700 focus:outline-none flex items-center justify-center h-3.5 w-3.5 rounded"
                  aria-label={`Remove ${cat}`}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            disabled={disabled}
            placeholder="e.g. alcohol, games"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCategory();
              }
            }}
            className="flex-1 rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 disabled:bg-slate-50 disabled:opacity-60"
          />
          <button
            type="button"
            disabled={disabled || !newCategory.trim()}
            onClick={handleAddCategory}
            className="rounded-lg bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50 transition-colors"
          >
            Block
          </button>
        </div>
      </div>
    </div>
  );
}
