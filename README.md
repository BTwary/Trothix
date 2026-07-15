# Trothix

**Version 1.0** — Deterministic legal-intelligence contract, lease, and Terms-of-Service analyzer. The frontend is a single static `index.html`; document analysis is proxied through `/api/analyze.js`, which runs the deterministic engine (`Trothix.js`/`EngineRegistry`) server-side so API keys and analysis logic never touch the browser.

---

## What's New in v1.0

- **Deterministic analysis engine** — `api/analyze.js` runs documents through `Trothix.js`, a rule-based Legal IR / Engine-Registry pipeline (parser → plugin engines → rule evaluator → assessment layer). No LLM is called in this path; it's a rule-based pass over the parsed document. The client-side Web Worker ("Hybrid Website Intelligence Engine") that shipped in earlier versions has been retired — `index.html` no longer references a Worker of any kind.
- **Optional AI fallback/augmentation** — `/api/ai-augment.js` is a separate, clearly-labeled-in-the-UI ("AI-generated — not part of Trothix's deterministic analysis") server-side proxy to a multi-provider chain: Gemini → Groq → Mistral → OpenRouter/DeepSeek. It is not part of the deterministic analysis path.
- **PDF upload with chunked analysis** — Drag-and-drop a PDF; the app extracts text client-side via PDF.js + OCR, splits it into sections, analyzes each independently, then synthesizes a single unified report. Handles large documents without hitting per-request token limits.
- **Robust JSON parsing** — `<think>` block stripping, markdown code-fence unwrapping, and `jsonrepair` as a last-resort recovery step before failing (used by the AI-augment path).
- **Consent UI** — A checkbox notice before analysis confirming the user understands their document text will be sent to the server for processing.
- **Job-aware rate limiting** — A multi-chunk document counts as one "job" against the per-IP rate limit, not one request per chunk.
- **Supabase analytics backend** — `/stats.html` dashboard backed by Supabase Postgres (Redis and in-memory fallbacks included).
- **Full SEO pass** — Canonical tags, Open Graph / Twitter Card meta, JSON-LD schema (SoftwareApplication on index, FAQPage on faq), sitemap.xml, robots.txt.

---

## Pages Included

- `index.html` — Main analyzer (paste or upload PDF)
- `privacy.html` — Privacy Policy (linked from footer)
- `faq.html` — FAQ answering questions people ask before trusting a tool like this with a real document
- `waitlist.html` — "Join the Waitlist" page (linked from nav CTA, hero, footer)
- `contact.html` — Contact page (name, email, subject, message)
- `feedback.html` — Feedback page with type dropdown and 1–5 star rating
- `terms.html` — Starter Terms of Service (plain-language template; have a lawyer review before commercial use — section 11 governing law has a placeholder)
- `demo.html` — Interactive demo with sample documents
- `stats.html` — Private usage dashboard (not linked publicly; visit directly at `/stats.html`)

**Backend for `waitlist.html`, `contact.html`, and `feedback.html`:** each posts to its own [Formspree](https://formspree.io) endpoint. To wire up:
1. Create a free Formspree account (free tier: 50 submissions/month per form).
2. Create a separate form for each page, copy each endpoint URL.
3. Replace the `FORMSPREE_ENDPOINT` placeholder in each HTML file (`YOUR_WAITLIST_FORM_ID`, `YOUR_CONTACT_FORM_ID`, `YOUR_FEEDBACK_FORM_ID`).

---

## Environment Variables

| Variable | Required | Provider |
|---|---|---|
| `GEMINI_API_KEY` | Recommended | Google AI Studio |
| `GROQ_API_KEY` | Optional (AI-augment fallback) | Groq |
| `MISTRAL_API_KEY` | Optional (AI-augment fallback) | Mistral |
| `OPENROUTER_API_KEY` | Optional (AI-augment fallback) | OpenRouter |
| `SUPABASE_URL` | Optional (stats) | Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional (stats) | Supabase |

The deterministic engine (`/api/analyze.js`) needs no API key. The optional `/api/ai-augment.js` path skips any provider whose key is absent; at least one of the four provider keys must be set for that path to work at all.

---

## 1. Get API Keys (all free tiers available)

### Gemini (primary — recommended)
1. Go to https://aistudio.google.com/apikey
2. Create an API key (no credit card required)
3. Free-tier limits as of mid-2026: ~20 RPD for Gemini 3.5 Flash and 2.5 Flash. Check https://ai.google.dev/gemini-api/docs/rate-limits — Google adjusts these often.

**Free-tier tradeoff:** requests may be used by Google to improve their models. Since users will paste real contracts, disclose this in your privacy copy, or upgrade to a paid/Vertex project once you have real users.

---

## 2. Push to GitHub

```bash
git init
git add .
git commit -m "Trothix"
git branch -M main
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```

---

## 3. Deploy on Vercel

1. Go to https://vercel.com/new and import the GitHub repo.
2. Before deploying (or right after, then redeploy): go to **Project Settings → Environment Variables** and add at minimum `GEMINI_API_KEY`.
3. Deploy. Vercel auto-detects `index.html` as static and `api/analyze.js` as a serverless function — no build config needed.

---

## 4. Set Up Stats Dashboard (optional but recommended)

`/stats.html` needs a shared database because each `/api/*` file runs as an isolated serverless function on Vercel and cannot share in-memory state.

**Using your existing Supabase project:**
1. In Supabase → SQL Editor → New query, run the SQL block at the top of `api/_stats.js` (creates two tables and three helper functions).
2. In Supabase → Project Settings → API, copy the **Project URL** and **`service_role`** secret key.
3. In Vercel → Settings → Environment Variables, add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
4. Redeploy. The dashboard will show "Backed by Supabase."

**Using Redis instead:** set `KV_REST_API_URL` / `KV_REST_API_TOKEN` (Vercel KV) or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (Upstash). `api/_stats.js` checks Supabase first, then Redis, then falls back to in-memory.

---

## 5. Test It

Open your deployed `*.vercel.app` URL, click one of the sample-document chips, and hit Analyze. If you see a missing API key error, check the environment variable was added and redeploy (env var changes require a redeploy).

---

## Local Development

```bash
npm i -g vercel
vercel dev
```

Reads API keys from a `.env` file locally — create one with your keys (don't commit it; `.gitignore` already covers it).

---

## Architecture Notes

### Deterministic analysis engine
`api/analyze.js` runs incoming documents through `Trothix.js` (a cached `EngineRegistry`-based pipeline: parser → plugin engines → rule evaluator → assessment layer), not an AI model. A global rate limiter caps requests at 300/min per serverless instance.

### Optional AI-augment fallback
`api/ai-augment.js` is a separate, clearly-labeled ("AI-generated — not part of Trothix's deterministic analysis") endpoint that walks a `MODEL_CHAIN` in order, skipping any provider whose key isn't set: **Gemini 3.5 Flash → Gemini 2.5 Flash → Gemini 2.0 Flash → Groq (Llama 3.3 70B) → Mistral (Open Mistral Nemo) → OpenRouter (DeepSeek R1, free tier)**. On a 429 or 5xx it moves to the next provider; on a non-quota 4xx it returns immediately (the same error would repeat on every model).

### PDF chunked analysis
The client (`assets/js/pdfProcessor.js`) extracts text from the PDF, splits it into ~14,000-character sections, sends each as a `mode: "chunk"` request, merges the per-section findings, then sends one final `mode: "synthesize"` request that combines everything into the same report shape a single-document analysis produces. This keeps per-call token cost bounded regardless of document size.

### Rate limiting
`api/ai-augment.js` uses two layers: per-IP job-aware limiting (6 documents/minute, 60 raw sub-requests/minute) and a global soft-throttle (30 requests/minute across all visitors). A chunked document counts as one "job" regardless of how many chunk requests it generates. `api/analyze.js` (the deterministic path) uses a separate global limiter capped at 300/min per serverless instance.

### JSON parsing robustness
Response text from the AI-augment path goes through: (1) `<think>` block removal for reasoning models, (2) markdown code-fence extraction, (3) `JSON.parse`, (4) `jsonrepair` fallback if strict parse fails.
