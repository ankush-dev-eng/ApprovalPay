import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-slate-200/80 bg-white sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-white font-mono font-bold text-sm tracking-wider shadow-2xs">
            AP
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">ApprovalPay</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-900 border border-amber-200/80">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Sandbox mode &middot; test store
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Spending rules the AI can&apos;t override</p>
          </div>
        </div>
        <div className="flex items-center">
          <Link
            href="/audit"
            className="text-xs font-semibold text-slate-800 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <span>View audit trail</span>
            <span aria-hidden="true" className="text-slate-400 font-mono text-[11px]">&rarr;</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

