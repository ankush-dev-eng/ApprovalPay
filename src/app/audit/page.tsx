import Link from "next/link";
import { listProposals } from "@/lib/store";
import { AuditView } from "@/components/AuditView";

export const dynamic = "force-dynamic";

interface AuditPageProps {
  searchParams: Promise<{ highlight?: string; error?: string }>;
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AuditView
          proposals={proposals}
          highlightId={highlightId}
          errorParam={errorParam}
        />
      </main>
    </div>
  );
}
