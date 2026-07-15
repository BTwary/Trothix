# Trothix Architecture Audit

> **Status update (current session):** this document is a historical audit
> record. Re-verified against the repository as it exists today:
> - **Pipeline D** (orphaned root API-duplicate layer — root `analyze.js`,
>   `contact.js`, `feedback.js`, `stats.js`, `track.js`, `visit.js`,
>   `waitlist.js`, `_stats.js`, `_supabase.js`, root `telemetry.js`) — **no
>   longer present**. None of these files exist at repo root anymore.
> - **Pipeline E** (orphaned knowledge-authoring pipeline — root
>   `knowledge/source`, `knowledge/build`, `knowledge/compiled`, plus
>   `tools/knowledge-compiler/` and `tools/ontology-builder/`) — **no
>   longer present**. Only `tools/knowledge-generator/` remains.
> - **Pipeline C** (root `core/router.js` + `parsers/*` + `rules/*`,
>   exercised by `benchmark/run-benchmark.mjs`) — root `core/router.js`,
>   `parsers/`, and `rules/` **no longer exist**. As a direct consequence,
>   `benchmark/run-benchmark.mjs` (the `benchmark:legacy` npm script) is
>   now broken (`ERR_MODULE_NOT_FOUND`) — see the status banner at the top
>   of that file and `benchmark/README.md`. It was left in place rather
>   than deleted since multiple other docs still reference it by name;
>   consolidating those references is a separate follow-up, not done here.
> - **Pipeline A** (client-side Web Worker pipeline — `worker.js` →
>   `core/legacy/router.js` → `pipeline.js`/`rules/fairness.js`/
>   `rules/riskEngine.js`, described below as **LIVE**) — **no longer
>   live**. `index.html` currently contains zero references to a `Worker`
>   or `worker.js` of any kind — verified by direct grep. The only
>   `worker.js` remaining in the repository is `archive/core/worker.js`,
>   which itself imports a path (`./core/legacy/router.js` relative to
>   `archive/core/`) that does not exist, so it was already unreachable
>   independent of anything below. `core/legacy/pipeline.js`,
>   `rules/fairness.js`, and `rules/riskEngine.js` (the only files that
>   imported them) have since been removed as confirmed dead code.
> - **Pipeline B** (`api/analyze.js` → `Trothix.js` → `EngineRegistry`) is
>   still the live, current production path; no change to that finding.
>
> The section below is preserved as-written for historical context (it
> documents real work that was done); treat any claim of something being
> "LIVE" or "current" in the body text below as describing the repository
> state *at the time this audit was written*, not today's state.

Scope: every parsing pipeline, execution path, shared component, duplicated logic, and dead code in the repository. Verified by tracing imports from each real entry point, not by reading file names or folder structure.

---

## 1. Repository Analysis

**Method:** started from the only things that can actually be invoked — `index.html`, `vercel.json`'s function glob, `package.json`'s scripts, and the standalone `test_*.js` files — and traced every `import` transitively from there. Anything never reached this way was treated as unverified until proven otherwise by grep, then confirmed dead by checking it's referenced nowhere (no HTML, no `vercel.json` route, no import).

**Finding: there are five parsing/execution pipelines in this repository, not one, and not the two I'd previously assumed.**

| # | Pipeline | Entry point | Status | Size |
|---|---|---|---|---|
| A | Legacy browser pipeline | `index.html` → `worker.js` → `core/legacy/router.js` | **Live — powers the in-browser instant preview** | 833 LOC |
| B | IR/Engine-Registry pipeline | `vercel.json` (`api/**/*.js`) → `api/analyze.js` → `Trothix.js` → `EngineRegistry` | **Live — powers the production server analysis** | 2,269 LOC |
| C | Root legacy pipeline | `package.json` `"test"`/`"benchmark"` → `benchmark/run-benchmark.mjs` → `core/router.js` → `parsers/*Parser.js` + `rules/*Rules.js` | **Alive only as a test harness — not reachable from production or the browser** | 600 LOC |
| D | Orphaned API-duplicate layer | none — no route, no import, no HTML reference | **Fully dead, and misleadingly labeled** (see 1.3) | 1,484 LOC (9 files) |
| E | Orphaned knowledge-authoring pipeline | none — `KnowledgeProvider` never reads its output | **Fully dead at runtime** | not measured in LOC (2 knowledge trees + 3 tool subprojects) |

### 1.1 — Pipeline A: Legacy browser pipeline (LIVE, client-side)
`worker.js` (a module Web Worker) imports `core/legacy/router.js`, which drives: `segmenter.js` (the numbering-scheme parser we rebuilt earlier this thread), `classifier.js`, `extractor.js`, `definitions.js`, `checklist.js`, `confidence.js`, `pipeline.js`, `reportGenerator.js`, plus `rules/fairness.js` + `rules/riskEngine.js`, plus the document-type plugins under `plugins/{nda,employment,loan,service,universal}/`. This is what runs **the instant, client-side, no-network analysis** the moment someone clicks "Analyze" in the browser, before anything is sent to the server.

### 1.2 — Pipeline B: IR/Engine-Registry pipeline (LIVE, server-side)
`api/analyze.js` imports `Trothix.js`, which builds a `LegalIRBuilder` document (via `core/parser/tokenizer.js`), then runs it through `EngineRegistry` across the plugin set: `partyResolver`, `definitionEngine` (the one we upgraded), `clauseClassifier`, `legalGrammarEngine`, `actionBuilder`, `entityEngine`, `constraintEngine`, `actionNormalizer`, `referenceResolver`, `deadlineNormalizer`, `findingEngine` — then through the `assessment/*` layer (`RiskAssessment`, `FairnessAssessment`, `CompletenessAssessment`, `PositiveAssessment`, `ExecutiveSummary`, `ScoringEngine`, `VerdictEngine`, `ReportAssembler`), consulting `KnowledgeProvider` (loading `assets/js/engine/knowledge/v1/domains/*` — **confirmed via the actual `basePath` construction in the constructor**, not assumed) and `RuleRegistry`/`RuleCompiler`/`RuleEvaluator`/`RuleContext`.

**This is what actually runs when the frontend's `aiFallbackPayload` is sent to `/api/analyze`.** Important naming correction: nothing in this path calls an LLM. It's a second, more thorough deterministic pass — the frontend's "AI fallback" label is a holdover from an earlier design and is actively misleading about what the server does today.

### 1.3 — Pipeline C: Root legacy pipeline (test-only, disconnected from production)
`benchmark/run-benchmark.mjs` — the thing `npm test` and `npm run benchmark` both execute — imports `core/router.js` (root-level, **not** `assets/js/engine/core/legacy/router.js`), which drives `parsers/{ndaParser,leaseParser,universalParser,baseParser}.js` and `rules/{ndaRules,leaseRules,universalRules}.js`. This is a **third, independent implementation** of clause parsing and risk rules, older in style than both A and B, and it is **not reachable from `index.html`, `vercel.json`, or any other live path.**

Consequence: **your 87/87-passing benchmark suite validates a pipeline that ships to nobody.** It exercises neither what the browser runs (A) nor what the production server runs (B). A green benchmark run currently tells you nothing about production correctness.

### 1.4 — Pipeline D: Orphaned API-duplicate layer (dead, and mislabeled)
At the repository root, alongside `api/`, there's a second complete copy of the serverless-function layer: `analyze.js`, `contact.js`, `feedback.js`, `stats.js`, `track.js`, `visit.js`, `waitlist.js`, `_stats.js`, `_supabase.js`. Verified facts:
- `vercel.json` only globs `api/**/*.js` — these root files are **never deployed as functions**.
- No HTML page and no other script references any of them by path.
- Where a root file shares a name with an `api/` file, **`diff` shows they've already diverged** — these aren't safe backups, they're stale forks.
- **The mislabeling is real, not just staleness**: root `contact.js`'s actual content is a server-side proxy to Gemini/Groq/Mistral/OpenRouter (its own header comment says so) — i.e. it's an old copy of what `analyze.js` used to do, sitting under the filename `contact.js`. Root `analyze.js`, in turn, actually contains feedback-submission logic (what's now `api/feedback-submit.js`). The names and contents were shuffled at some point during a reorganization and the stale copies were never deleted.
- Minor corroborating trace: `api/_stats.js` (the live one) still enumerates `"gemini_5xx"` as a tracked error code, even though the live `api/analyze.js` no longer calls Gemini at all — a vestigial metric left over from when the AI-provider chain was the real analyze path.

**Correction caught during execution, not planning:** root `telemetry.js` looked identical to these nine at audit time, but it is *not* orphaned — `core/router.js` (pipeline C, still executed by `benchmark/run-benchmark.mjs`) imports it directly. Deleting it alongside the other nine broke the benchmark suite immediately (`ERR_MODULE_NOT_FOUND`); caught by re-running the benchmark as a post-deletion check, fixed by restoring the file from the original upload, and reverified. This is exactly why Section 12 ("every bug becomes a permanent regression test") matters even for a deletion-only change — it's now been executed and re-verified below, but it's a concrete reminder that "looks orphaned" still needs a per-file reference check, not a batch assumption.

**Risk this creates:** anyone (including a future me, in a session without this thread's context) who opens root `contact.js` looking for the contact-form handler, or root `analyze.js` looking for the analyze endpoint, will read completely wrong code and could waste real time "fixing" something with zero production effect.

### 1.5 — Pipeline E: Orphaned knowledge-authoring pipeline
Two entirely separate knowledge trees exist:
- `assets/js/engine/knowledge/v1/domains/*` — **confirmed live**, this is what `KnowledgeProvider.basePath` actually points to.
- `knowledge/source/domains/*` (root) → compiled by `knowledge/build/{compiler,linter,normalizer,optimizer,validator,linker,diagnostics,coverage}.js` → into `knowledge/compiled/{knowledge.bundle.json, manifest.json, coverage.json, dependency-graph.json, fingerprints.json}` — **confirmed dead**: nothing outside `knowledge/build/` itself reads from `knowledge/source` or `knowledge/compiled` at runtime.

Alongside this sits `tools/knowledge-compiler/`, `tools/knowledge-generator/`, and `tools/ontology-builder/` (the last one a full separate Vite frontend + Node backend sub-application). All three appear to target the orphaned `knowledge/source` tree, not the live `assets/js/engine/knowledge/v1` tree. This looks like a genuine, more ambitious second attempt at a knowledge-compilation system that was never connected back to the pipeline that actually ships.

### 1.6 — `vision/*.json`
A set of schema-stub files (`architecture.json`, `roadmap.json`, `maturity.json`, `engine_registry.json`, `legal_ir.json`, etc.) that read like an intended governance/spec layer, plus `vision-linter.js` and `vision-diff.js`. Checked: every file I opened has empty `"dependencies"`, `"forbidden"`, `"future"`, and `"references"` arrays — these are scaffolds, not populated specifications. Neither linter script appears in `package.json` or any CI config, so nothing currently enforces them. Not dead code exactly, but not yet doing any governance work either.

---

## 2. Handbook Alignment

Checking the confirmed findings above against the Handbook's non-negotiable rules:

| Handbook rule | Status |
|---|---|
| "Never introduce... Parallel duplicate architectures" | **Currently violated** — pipelines A, B, and C are three parallel implementations of the same job (parse a contract, classify clauses, score risk). This audit doesn't argue anyone violated the rule going forward; it establishes the debt already exists and needs a consolidation decision. |
| "Never redesign: Parser, Legal IR, Rule Engine, Ontology, unless explicitly requested" | Respected in this audit — no redesign proposed below, only a consolidation path using what exists. |
| "Repository truth overrides assumptions... Inspect first" | This is the operating method used throughout: every claim above is backed by a `diff`, `grep`, or direct read, not inferred from naming. |
| "Never fabricate capability" | Directly relevant to the mislabeled `analyze.js`/`contact.js` finding — those files fabricate an appearance of capability (a contact handler, a working AI-analyze endpoint) that isn't real. |
| Rule Diagnostics Policy (compiled-active / compiled-inert / failed) | Not yet evaluated in this audit — that policy applies to `RuleCompiler`'s output in pipeline B, which is a separate, narrower investigation from this repo-wide pass. Flagging as a natural follow-up, not addressing here. |

---

## 3. Architecture Impact

- **Confidence signal is broken**: the benchmark suite (pipeline C) cannot tell you anything about pipeline A or B's correctness. Every "87/87 passing" result is validating dead code.
- **Two knowledge bases can silently diverge**: if anyone edits `knowledge/source/domains/*` believing they're updating the rule set, `KnowledgeProvider` will never see the change — it reads `assets/js/engine/knowledge/v1/domains/*` only.
- **Reading the codebase for orientation is actively unreliable** in the affected root files — file names do not describe file contents in at least two confirmed cases (`analyze.js`, `contact.js`).
- **Maintenance cost compounds**: every new document-type or risk-rule idea (like the definitions-extraction work earlier this thread) has to be evaluated against "which of 3 pipelines does this apply to," which is exactly the friction that produced the wrong-target proposal you asked me to review last time.

---

## 4. Consolidation Strategy (no rewrites)

Ordered by ratio of risk removed to effort spent.

**Step 1 — Delete, don't migrate, pipeline D.** It's unreachable, already diverged, and actively misleading. Nothing consumes it. This is a pure deletion, zero behavior change, since `vercel.json` never routed to it in the first place. Lowest-risk, highest-clarity change available.

**Step 2 — Repoint `benchmark/run-benchmark.mjs` at pipeline B, or explicitly retire pipeline C.** Two honest options, not a redesign either way:
 - (a) Rewrite the benchmark harness's *imports only* (`core/router.js` → `Trothix.js`/`EngineRegistry`) so the existing fixture-comparison logic starts validating the pipeline that's actually live in production. This reuses the harness's scoring/reporting code as-is.
 - (b) If (a) turns out to be nontrivial because B's output shape differs from what the harness expects, rename `benchmark/` to make its scope explicit (e.g. a comment banner: "validates the retired root pipeline, not production") until (a) can be done, so nobody mistakes a green run for a production signal again.
 Either way, `parsers/*`/`rules/*`/root `core/router.js` should be explicitly marked retired (a top-of-file comment is enough — no code change) rather than silently coexisting.

**Step 3 — Decide, explicitly, whether pipelines A and B should both keep existing.** This is a real architectural choice, not a bug: A gives an instant, offline, client-side result; B gives a deeper, server-side result. That split can be a legitimate product decision (fast preview vs. thorough report) rather than drift — **but only if it's decided on purpose**, and only if both pipelines are kept deliberately in sync on shared concepts (e.g. the numbering-scheme parser fix from earlier this thread currently only exists in A's `segmenter.js`; B's `tokenizer.js` is still a cruder paragraph-splitter). If the intent is "A is a lightweight preview of B," the highest-leverage single move is porting the numbering-aware structural parser into B's `core/parser/tokenizer.js` so both pipelines share one parsing quality bar — without merging the two pipelines themselves.

**Step 4 — Connect or retire pipeline E.** Either wire `KnowledgeProvider` to read the *compiled* output of `knowledge/build/*` (which looks like the more rigorous, validated path — it has a linter, a coverage report, a dependency graph) instead of the hand-maintained `assets/js/engine/knowledge/v1/domains/*`, or explicitly mark `knowledge/source`/`knowledge/build`/the three `tools/*` subprojects as an experimental track not yet adopted. Don't leave it ambiguous — that ambiguity is exactly what let it drift this far unnoticed.

**Step 5 — Populate or remove `vision/*.json`.** As stub schemas with empty arrays, they currently cost more (implying a governance process that isn't happening) than they deliver. Either fill in real content per file (starting with `maturity.json` and `architecture.json`, which map directly onto this audit) and wire `vision-linter.js` into `npm test`, or remove them until there's bandwidth to do that properly.

None of these steps require rewriting the parser, the IR, the rule engine, or the ontology — they're deletions, a re-pointed import, an explicit product decision, and two "wire up or remove" calls.

---

## 5. Risks

- **Step 1 (delete pipeline D) risk: near zero.** Confirmed unreachable by three independent checks (vercel.json glob, HTML grep, import grep). The only residual risk is if a human (not code) has a personal habit of opening these files for reference — worth a quick heads-up before deleting, not a reason to keep them.
- **Step 2 risk: medium.** Repointing the benchmark harness could reveal that pipeline B's output shape doesn't match the fixture format at all, which would require harness changes (not pipeline changes) to fix — scope that honestly before committing to option (a).
- **Step 3 risk: low, but only if the decision is made explicitly.** The risk isn't consolidating — it's *not deciding*, which is the current state.
- **Step 4 risk: medium.** If `knowledge/build`'s compiled output has a materially different schema than the hand-maintained `v1/domains` tree, switching `KnowledgeProvider` over could change every rule's behavior at once. This needs a side-by-side diff before switching, not a blind repoint.
- **Step 5 risk: none functionally** — these files aren't read by any runtime code, so any change here is inert to production either way.

---

## 6. Code Changes

None in this response — this was scoped as an audit, per the request. Every fix above is described precisely enough to execute as its own separately-scoped task (matching the Handbook's "wait if clarification is required" step), rather than bundled in here.

---

## 7. Validation

Every claim in Section 1 was checked directly against the repository, not inferred:
- Live/dead status: `vercel.json`'s function glob, `grep` for references across all `.html` and `.js` files, and `diff` between suspected duplicates.
- `KnowledgeProvider`'s actual base path: read directly from its constructor (`path.join(projectRoot, 'assets', 'js', 'engine', 'knowledge', this.version)`), not assumed from folder naming.
- The `analyze.js`/`contact.js` mislabeling: confirmed by reading both files' actual header comments and content, not just their filenames.
- Pipeline sizes: `wc -l` across each subsystem's real file set.
- `npm test`/`npm run benchmark` target: read directly from `package.json`'s `"scripts"` block.

---

## 8. Remaining Technical Debt (not addressed by this audit)

- Rule diagnostics classification (`compiled-active`/`compiled-inert`/`failed`) for pipeline B's `RuleCompiler` output — not evaluated here, worth its own pass.
- Pipeline A's and B's document-type coverage haven't been compared clause-by-clause — it's possible they support different document types today, which affects how Step 3 above should be decided.
- No `.git` history was available in this workspace, so the *timeline* of how these five pipelines came to coexist (which came first, when the fork happened) couldn't be reconstructed — only their current end-state.

---

## 9. Why This Matches Trothix Philosophy

This audit adds no machine learning, no probabilistic behavior, and no new architecture — it only maps what already exists and proposes deletions, an import repoint, and explicit decisions where ambiguity currently stands in for a decision. Every claim is backed by a direct repository check rather than an assumption, in line with "repository truth overrides assumptions." The consolidation strategy explicitly avoids touching the parser, Legal IR, rule engine, or ontology, per the non-negotiable rules — it addresses *which existing, working system is canonical*, not how any of them work internally.
