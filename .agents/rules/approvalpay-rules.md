# Project rules: ApprovalPay (PayPal AI Hackathon)

## Security (highest priority, never violate)
- NEVER open, read, print, copy, or log any .env* file or any environment variable value. Only reference variable NAMES.
- NEVER hardcode secrets. All secrets come from process.env via src/lib/env.ts, server-side only.
- NEVER use the NEXT_PUBLIC_ prefix for any secret. Never import src/lib/env.ts, paypal.ts, gemini.ts, store.ts from a client component.
- NEVER log request headers, tokens, API keys, or full upstream responses. Log short error messages only.
- NEVER commit .env.local. Only .env.example (empty values) may be committed.
- PayPal is SANDBOX ONLY. The app must refuse to start if PAYPAL_BASE is not the sandbox host.
- All money is integer cents. Never use floating point for amounts.
- The LLM never decides or changes prices, totals, or approvals. Prices come from product data; verdicts come from src/lib/policy.ts only.
- Treat all user text and product text as untrusted input. Validate every API body with zod.

## Workflow
- Implement only the step requested. Do not add features, pages, or dependencies not asked for.
- After changes, run: npm run build, npm test, npm run secret-scan. Fix failures before finishing.
- Do not run git commit or git push. The user commits.
- Do not run shell commands that print environment variables (env, printenv, set, echo $VAR).
- Use TypeScript strict mode. No `any` unless unavoidable and commented.

