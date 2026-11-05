# ApprovalPay

> **An AI shopping agent that can't overspend.**  
> Built for the PayPal AI Hackathon.

ApprovalPay is an autonomous AI shopping agent with hard, code-enforced financial governance. It allows shoppers to search for gifts, office setups, or team supplies in plain natural language, curates products via **Channel3** and local catalogs, and checks every item against strict, user-defined spending policies before generating a **PayPal Sandbox** checkout order.

The core architectural guarantee of ApprovalPay is that **the AI never touches money**. Prices, budget enforcement, and approval verdicts are calculated deterministically in TypeScript, never by a generative language model.

---

## Why the AI Never Touches Money

Generative AI models are prone to hallucinations, arithmetic errors, and prompt injections that can bypass pricing constraints. ApprovalPay enforces an airtight boundary: the LLM is used exclusively for semantic comprehension and product selection by ID. All monetary math, policy checks, and payment requests are handled deterministically by server-side code.

### Architectural Flow Diagram

```text
Shopper Request (e.g. "3 gifts under $50 each for my team")
   │
   ▼
[ 1. Parse Intent (Gemini LLM) ]
   │  Extracts query keywords, quantity, and max price.
   │  Untrusted user prompt is isolated inside XML data tags.
   ▼
[ 2. Search Catalog (Channel3 API / Mock Catalog) ]
   │  Returns verified products with ground-truth prices from merchants.
   ▼
[ 3. Pick Candidates (Gemini LLM) ]
   │  Model selects products strictly by candidate ID.
   │  Model never invents, modifies, or calculates prices.
   ▼
[ 4. Deterministic Policy Engine (TypeScript) ]
   │  Enforces integer-cent rules:
   │  • Per-item cap ($)
   │  • Total cart budget ($)
   │  • Blocked category list (e.g., alcohol, gift cards)
   │  • Hard $500 system ceiling
   ▼
[ 5. Policy Verdict ]
   ├── Blocked ─────────► UI displays violation bullets; checkout disabled.
   ├── Needs Approval ──► UI requires explicit user sign-off checkbox.
   └── Within Policy ───► UI enables one-click checkout.
   │
   ▼
[ 6. Server-Side Policy Re-check (POST /api/orders) ]
   │  Client sends ONLY { proposalId, confirmed }.
   │  Server re-evaluates products and policies fresh before calling PayPal.
   ▼
[ 7. PayPal Sandbox Checkout (REST API v2) ]
   │  Order created in integer cents with idempotency key.
   │  User authorizes payment on PayPal Hermes checkout.
   │  Capture callback records order completion.
   ▼
[ 8. Immutable Audit Trail (Server Store) ]
      Logs timestamps, requests, curated items, policy verdicts, and PayPal Order IDs.
```

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React Server Components)
- **UI & Styling**: React 19, [Tailwind CSS v4](https://tailwindcss.com/)
- **AI Agent Engine**: [Google Gemini API](https://ai.google.dev/) (Intent parsing & candidate selection with multi-model fallback)
- **Product Discovery**: [Channel3 Product Search API](https://trychannel3.com/) (Live merchant catalog) with automatic mock catalog fallback
- **Payments**: [PayPal REST API v2](https://developer.paypal.com/docs/api/orders/v2/) (Checkout orders & payment capture)
- **Validation**: [Zod](https://zod.dev/) (Runtime schema validation on all inputs and API responses)
- **Testing**: [Vitest](https://vitest.dev/) (Unit test suite for policy logic, search adapters, and mapping)

---

## How PayPal and AI Are Used

### How AI is Used
- **Semantic Intent Parsing**: Converts unstructured shopper requests into structured search parameters (`query`, `quantity`, `maxPricePerItemUsd`).
- **Curated Selection by ID**: Given candidate products from the catalog, Gemini chooses items matching the shopper's context and outputs an ID-only JSON array with short justifications.
- **Strict Sandboxing**: The LLM never receives or returns financial amounts that affect billing. Prices are looked up from catalog data by ID after selection.

### How PayPal is Used
- **OAuth 2.0 Token Caching**: Requests client-credential access tokens from the PayPal Sandbox and caches them with expiration buffers.
- **Orders v2 API (`/v2/checkout/orders`)**: Generates checkout sessions with itemized breakdowns in USD integer cents, `intent: "CAPTURE"`, and `user_action: "PAY_NOW"`.
- **Payment Capture (`/v2/checkout/orders/{id}/capture`)**: Automatically triggered upon redirect from PayPal Hermes checkout.
- **Negative Testing Support**: Supports `PAYPAL_MOCK_ERROR` to simulate checkout declines (e.g., `INSTRUMENT_DECLINED`) for demos.

---

## Security Design

1. **Server-Side Secrets Only**:
   - Zero secrets use the `NEXT_PUBLIC_` prefix.
   - Secrets are loaded exclusively server-side via `src/lib/env.ts` with `import "server-only"`.
   - Client components communicate only via standard `fetch` to `/api/agent` and `/api/orders`.

2. **Server-Side Policy Re-evaluation**:
   - The browser never submits prices or totals to `/api/orders`.
   - The client submits only `{ proposalId, confirmed }`.
   - The server fetches the stored proposal and re-evaluates all policy rules before invoking PayPal.

3. **Integer Cents (Zero Float Roundoff)**:
   - All monetary values (`priceCents`, `totalCents`, `perItemCapCents`, `totalBudgetCents`, `approvalThresholdCents`) are stored and calculated strictly as integers.
   - Values are converted to decimal strings (`fmt()`) solely for display and PayPal payload formatting.

4. **Runtime Schema Validation (Zod)**:
   - Untrusted shopper input, client requests, Gemini LLM JSON outputs, and Channel3 API responses are validated with strict Zod schemas.
   - Products with missing, null, or non-positive prices are automatically discarded.

5. **Idempotency Keys**:
   - `PayPal-Request-Id` headers are attached to both order creation (`proposalId`) and capture (`capture-${orderId}`) to prevent duplicate transactions.

6. **Approval Host Verification**:
   - The PayPal approval redirect URL is validated to ensure its hostname ends with `paypal.com`, preventing open-redirect vulnerabilities.

7. **Rate Limiting**:
   - Sliding-window in-memory rate limiting protects public endpoints (`/api/agent`: 10 req/min, `/api/orders`: 20 req/min).

8. **Prompt Injection Hardening**:
   - Shopper prompts are enclosed within `<user_request>` tags with instructions treating input strictly as untrusted data.

9. **Zero Secret Logging**:
   - Request headers, bearer tokens, API keys, and raw upstream responses are never logged.

---

## PayPal Sandbox Notice

> **Important**: ApprovalPay runs in the **PayPal SANDBOX ONLY**.  
> The application verifies at startup that `PAYPAL_BASE` points to `https://api-m.sandbox.paypal.com` and will refuse to start if pointed to a live production environment. Real currency is never processed.

---

## Setup & Running Locally

### Prerequisites
- Node.js 20+ installed
- PayPal Developer Sandbox account (Client ID & Secret)
- Google AI Studio API Key (Gemini)
- (Optional) Channel3 API Key for live merchant product search

### 1. Clone & Install
```bash
git clone https://github.com/ankush-dev-eng/ApprovalPay.git
cd ApprovalPay/approvalpay
npm install
```

### 2. Configure Environment Variables
Copy the example environment template:
```bash
cp .env.example .env.local
```

Fill in your API credentials in `.env.local` using the documented variable names:

| Variable Name | Description | Example / Default |
| :--- | :--- | :--- |
| `PAYPAL_CLIENT_ID` | PayPal Sandbox Client ID | `your_sandbox_client_id` |
| `PAYPAL_CLIENT_SECRET` | PayPal Sandbox Secret | `your_sandbox_secret` |
| `PAYPAL_BASE` | PayPal Sandbox Host (*required*) | `https://api-m.sandbox.paypal.com` |
| `GEMINI_API_KEY` | Google Gemini API Key | `your_gemini_api_key` |
| `GEMINI_MODEL` | Gemini Model Name | `gemini-2.5-flash` |
| `APP_URL` | Local application base URL | `http://localhost:3000` |
| `CHANNEL3_API_KEY` | Channel3 Search API Key (*optional*) | `your_channel3_api_key` |
| `PAYPAL_MOCK_ERROR` | Mock error code for testing (*optional*) | `INSTRUMENT_DECLINED` |

*(Note: `.env.local` is ignored by Git and must never be committed).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Verification & Tests

ApprovalPay includes unit tests for the policy engine, search filtering, and Channel3 adapter, along with automated secret scanning.

### Unit Tests (Vitest)
```bash
npm test
```
Runs 13 unit tests covering:
- Policy ceiling enforcement (per-item cap, total budget, hard limit)
- Blocked category rejection (e.g. alcohol, gift cards)
- Human approval thresholds
- Empty basket safety
- Mock catalog keyword & price search
- Channel3 API response mapping & validation

### Secret Scan
```bash
npm run secret-scan
```
Scans all tracked Git files to guarantee that:
1. No `.env` files are tracked by Git (except `.env.example`).
2. No secret values from `.env.local` appear anywhere in tracked code.

### Production Build
```bash
npm run build
```
Compiles all pages and serverless API route segments with TypeScript strict mode.

---

## Limitations

- **Sandbox Scope**: Designed exclusively for PayPal Sandbox accounts; does not support multi-currency FX settlement outside USD.
- **Audit Persistence**: The demo audit log stores proposals in a serialized local file (`data/audit.json`). In high-concurrency production deployments, this would be backed by PostgreSQL or DynamoDB.
- **Rate Limiting**: Sliding-window rate limiter is currently in-memory per node; multi-instance cloud deployments should back this with Redis.
