# Trothix

**Version 2.0** — Plain-language contract, lease, and Terms-of-Service analyzer. The frontend is a single static `index.html`; the AI call is proxied through `/api/analyze.js` so your API keys never touch the browser.

---

## What's New in v2.0

- **Hybrid Website Intelligence Engine** — Fast, privacy-first local Regex engine runs in a Web Worker in the browser. Instantly parses standard NDAs and Leases locally without sending data to the server.
- **Multi-model AI Fallback Chain** — If a document is too complex for the local engine, it seamlessly routes to a robust AI chain: Gemini 3.5 Flash → Gemini 2.5 Flash → Gemini 2.0 Flash.
- **PDF upload with chunked analysis** — Drag-and-drop a PDF; the app extracts text client-side via PDF.js + Tesseract.js OCR, splits it into sections, analyzes each independently, then synthesizes a single unified report. Handles large documents without hitting per-request token limits.
- **Robust JSON parsing** — `<think>` block stripping, markdown code-fence unwrapping, and `jsonrepair` as a last-resort recovery step before failing.
- **Privacy consent UI** — Transparent disclosure that free-tier Gemini requests may be used by Google for model training, with a user-facing notice before analysis.
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
| `SUPABASE_URL` | Optional (stats) | Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional (stats) | Supabase |

At least one AI key must be set. The chain skips any provider whose key is absent.

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
git commit -m "Trothix v2"
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

### AI fallback chain
`api/analyze.js` walks `MODEL_CHAIN` in order, skipping any provider whose key isn't set. On a 429 or 5xx it moves to the next provider. On a non-quota 4xx it returns immediately (the same error would repeat on every model). The chain is: **Gemini 3.5 Flash → Gemini 2.5 Flash → Gemini 2.0 Flash**.

### PDF chunked analysis
The client (`assets/js/pdfProcessor.js`) extracts text from the PDF, splits it into ~14,000-character sections, sends each as a `mode: "chunk"` request, merges the per-section findings, then sends one final `mode: "synthesize"` request that combines everything into the same report shape a single-document analysis produces. This keeps per-call token cost bounded regardless of document size.

### Rate limiting
Two layers: per-IP job-aware limiting (6 documents/minute, 60 raw sub-requests/minute) and a global soft-throttle (30 requests/minute across all visitors). A chunked document counts as one "job" regardless of how many chunk requests it generates.

### JSON parsing robustness
Response text goes through: (1) `<think>` block removal for reasoning models, (2) markdown code-fence extraction, (3) `JSON.parse`, (4) `jsonrepair` fallback if strict parse fails.
