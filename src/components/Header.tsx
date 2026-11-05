import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-sm shadow-indigo-200">
            AP
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">ApprovalPay</h1>
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
                Sandbox mode - no real money
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">An AI shopping agent that can&apos;t overspend</p>
          </div>
        </div>
        <div className="flex items-center">
          <Link
            href="/audit"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 px-3.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <span>View audit trail</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

