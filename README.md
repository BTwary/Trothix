# ClearClause

Plain-language contract/lease/ToS analyzer. Frontend is a single static
`index.html`; the AI call is proxied through `/api/analyze.js` so your API
key never touches the browser.

Also included:
- `privacy.html` — a Privacy Policy page (linked from the footer)
- `faq.html` — an FAQ page answering the questions people ask before
  trusting a tool like this with a real document (linked from the footer)
- `waitlist.html` — "Join the Waitlist" page, linked from the nav bar CTA,
  the homepage hero, the "Help Shape the Future" section, and the footer.
- `contact.html` — "Contact Us" page (name, email, subject, message),
  linked from the nav bar and footer.
- `feedback.html` — "Give Feedback" page with a feedback-type dropdown and
  a 1–5 star rating widget, linked from the nav bar and footer.
- `terms.html` — a starter Terms of Service page (linked from the footer).
  It's a reasonable plain-language early-stage template, not a substitute
  for review by an actual lawyer before you rely on it commercially —
  section 11 (governing law) in particular has a placeholder to fill in.

  **Backend for `waitlist.html`, `contact.html`, and `feedback.html`:**
  each posts to its own [Formspree](https://formspree.io) endpoint — the
  simplest free option for a static site since it needs no backend or
  database. To wire each one up:
  1. Create a free Formspree account (free tier covers 50
     submissions/month per form).
  2. Create a separate form for each page (waitlist, contact, feedback) so
     submissions land in separate inboxes, and copy each form's endpoint,
     e.g. `https://formspree.io/f/abcdwxyz`.
  3. Open each HTML file and replace its `FORMSPREE_ENDPOINT` placeholder
     (`YOUR_WAITLIST_FORM_ID`, `YOUR_CONTACT_FORM_ID`,
     `YOUR_FEEDBACK_FORM_ID`) with the matching URL.

  Until a given endpoint is set, that page still validates and renders
  correctly, but submission shows a friendly "not connected yet" message
  instead of silently failing.
- `stats.html` + `/api/stats` — a lightweight, privacy-respecting usage
  dashboard (total analyses, successful analyses, top document types,
  average document length, error/rate-limit rates, completion rate, and
  yes/no feedback counts from the "Was this helpful?" buttons). It's
  intentionally not linked from the public nav — visit it directly at
  `/stats.html` once deployed.

  **This needs a real database to actually work in production.**
  `/api/analyze`, `/api/feedback`, and `/api/stats` each run as separate,
  isolated serverless functions on Vercel — they don't share in-memory
  state with each other, even though they live in the same `/api` folder.
  Without a shared store, a count recorded by `/api/analyze` is invisible
  to `/api/stats`, which is why you'll see all-zero numbers on the
  dashboard if you skip this step.

  **If you already have a Supabase project** (recommended — no need to go
  through Vercel's marketplace or set up separate billing):
  1. In Supabase → your project → **SQL Editor** → New query, and run the
     SQL block at the top of `api/_stats.js` (creates two small tables and
     three helper functions).
  2. In Supabase → **Project Settings → API**, copy the **Project URL**
     and the **`service_role`** secret key (not the anon/public key).
  3. In Vercel → your project → **Settings → Environment Variables**, add:
     - `SUPABASE_URL` = your Project URL
     - `SUPABASE_SERVICE_ROLE_KEY` = your service_role key
  4. Redeploy. `/stats.html` will show "Backed by Supabase" once it picks
     it up.

  **If you'd rather use Redis instead** (Vercel Storage → Create Database
  → KV, or connect an Upstash database), just set `KV_REST_API_URL` /
  `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`)
  instead — `api/_stats.js` checks for Supabase first, then Redis, so
  either works without touching code.

  Until one of those is set up, the app still works fine end-to-end
  (analysis, feedback buttons, etc.) — it just falls back to in-memory
  counters on `/stats.html`, which reset on cold start and won't stay in
  sync across requests. The dashboard tells you which mode it's in.

## 1. Get a free Gemini API key

1. Go to https://aistudio.google.com/apikey
2. Create an API key (no credit card required for the free tier)
3. Copy it — you'll paste it into Vercel in step 3 below

**Note:** as of June 2026, Google switched new keys from the old
`AIzaSy...` format to a new `AQ.Ab...` "auth key" format. Either works with
this app — the backend authenticates via the `x-goog-api-key` header, which
supports both.

**Know the free-tier tradeoffs before you launch:**
- Free-tier requests may be used by Google to improve their models. Since
  people will paste real leases and contracts here, put this in your privacy
  copy, or upgrade to a billed project (Gemini's terms treat paid/Vertex
  traffic differently on data use) once you have real users.
- Free tier is rate-limited (roughly 10–15 requests/minute and a few hundred
  to ~1,000 requests/day depending on the model, as of mid-2026 — Google
  changes this fairly often, so check https://ai.google.dev/gemini-api/docs/rate-limits
  before you rely on a number here).
- If you outgrow it, Gemini 2.5 Flash is inexpensive on the paid tier
  (roughly $0.15 / $0.60 per million input/output tokens as of mid-2026).

## 2. Push this folder to GitHub

```bash
git init
git add .
git commit -m "ClearClause v1"
git branch -M main
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```

## 3. Deploy on Vercel

1. Go to https://vercel.com/new and import the GitHub repo
2. Before the first deploy (or right after, then redeploy), go to
   **Project Settings → Environment Variables** and add:
   - Key: `GEMINI_API_KEY`
   - Value: the key you copied in step 1
3. Deploy. Vercel auto-detects `index.html` as a static file and
   `api/analyze.js` as a serverless function — no build config needed.

## 4. Test it

Open your deployed `*.vercel.app` URL, click one of the sample-document
chips, and hit Analyze. If you see "The server is missing GEMINI_API_KEY",
double check the environment variable was added and redeploy (env var
changes require a redeploy to take effect).

## Local development (optional)

```bash
npm i -g vercel
vercel dev
```

This runs the frontend and the `/api/analyze` function locally, reading
`GEMINI_API_KEY` from a `.env` file (create one with
`GEMINI_API_KEY=your_key_here` — don't commit it, it's already covered by
the `.gitignore`).
