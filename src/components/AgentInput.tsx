"use client";

interface AgentInputProps {
  request: string;
  setRequest: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const EXAMPLES = [
  "3 gifts under $50 each for my team",
  "a bottle of whiskey for the office party",
  "an office desk setup under $100 total",
  "kreo mouse pad",
];

export function AgentInput({ request, setRequest, onSubmit, isLoading }: AgentInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim() || isLoading) return;
    onSubmit();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="agent-prompt" className="block text-xs font-bold text-slate-900 mb-2">
            What would you like to buy?
          </label>
          <div className="relative">
            <input
              id="agent-prompt"
              type="text"
              maxLength={300}
              disabled={isLoading}
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="e.g. 3 gifts under $50 each for my team"
              className="w-full rounded-lg border border-slate-300 bg-slate-50/60 px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 disabled:opacity-60 text-sm transition-colors"
            />
            <div className="absolute right-3 bottom-2.5 text-[11px] font-mono text-slate-400 select-none">
              {request.length}/300
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 mr-1">Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                disabled={isLoading}
                onClick={() => setRequest(ex)}
                className="inline-flex items-center rounded-md bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 px-2 py-0.5 text-xs font-medium text-slate-700 transition-colors disabled:opacity-50 text-left"
              >
                &ldquo;{ex}&rdquo;
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || request.trim().length < 3}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all min-w-[110px]"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Searching...</span>
              </span>
            ) : (
              "Ask agent"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

