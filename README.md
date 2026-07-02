# ClearClause

Plain-language contract/lease/ToS analyzer. Frontend is a single static
`index.html`; the AI call is proxied through `/api/analyze.js` so your API
key never touches the browser.

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
