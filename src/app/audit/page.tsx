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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200 selection:text-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-white font-mono font-bold text-sm tracking-wider shadow-2xs group-hover:bg-slate-800 transition-colors">
                AP
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors">
                ApprovalPay
              </span>
            </Link>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
              Audit Trail
            </span>
          </div>

          <Link
            href="/"
            className="text-xs font-semibold text-slate-800 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
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
