# Phase 2 — Testing Restoration

**Scope:** Replace fake testing (mocked integration tests, a benchmark aimed at the wrong engine) with real signal against the pipeline that actually ships (`assets/js/engine/Trothix.js`, called from `api/analyze.js`).

Every number below was produced by actually running the referenced command in this checkout, not estimated.

---

## 1. The 5 fabricated `tests/integration/*.test.js` files

**Before:** each file defined a local `evaluateClause()` (or `simulateTransitions()`) function that returned a hardcoded literal object and printed fixed `console.log` narration lines regardless of input. The `if (result.finding === "...")` check at the bottom compared the literal against itself, so these tests could never fail. None of them imported the lexer, IR builder, rule compiler, or `Trothix` class.

**After:** all 5 now import and call the real engine (`assets/js/engine/Trothix.js`) via a shared helper (`tests/integration/_lib.mjs`). Each asserts the engine's **actual current behavior**, established by running it, not by assuming what it should do:

| File | Domain | What it now actually verifies |
|---|---|---|
| `assignment_runtime.test.js` | Assignment | `RULE_CONSENT_REQUIRED` does **not** fire (domain is concept-only, no `when`/`then` — confirmed via `test_ruleDiagnostics.mjs`) |
| `notice_runtime.test.js` | Notice | `RULE_EMAIL_NOTICE_ALLOWED` / `RULE_MISSING_NOTICE_ADDRESS` do **not** fire (same reason) |
| `real_clause.test.js` | Confidentiality | `RULE_NON_DISCLOSURE` does **not** fire (same reason) |
| `definitions_runtime.test.js` | Definitions | `RULE_DEFINITIONS_PRESENT` / `RULE_ALIASES_RESOLVED` do **not** fire, but `DEFINITION_WITHOUT_USE` — a real, separately-authored, currently-active rule — **does** fire correctly, including a positive control (reused term → no false flag) |
| `lifecycle_runtime.test.js` | Lifecycle | Queries `KnowledgeProvider` directly, since no lifecycle state-machine runtime exists to call. Confirms Lifecycle's own `states.json`/etc. contribute zero nodes (every entry lacks `id`), and that any Lifecycle-labeled IDs that *do* resolve (e.g. `STATE_ACTIVE`) actually trace back to the **Termination** domain, not Lifecycle — a coincidental overlap, not a working feature |

The Definitions and Lifecycle files surfaced things the old fabricated versions never could have: a real working rule (`DEFINITION_WITHOUT_USE`) that nothing was testing, and a precise, provenance-traced explanation of why Lifecycle contributes nothing today (not just "it's a placeholder," but *which specific loader behavior* causes that).

Every one of these files is written to **fail on purpose** the moment its domain becomes compiled-active — that's the intended signal to update the assertions, not a defect.

```
$ npm run test:integration
✅ 2/2 (assignment) · 3/3 (notice) · 2/2 (confidentiality) · 4/4 (definitions) · 4/4 (lifecycle)
```

---

## 2. Regression corpus (`tests/regression/`)

New: `corpus.json` (12 entries) + `run-regression.mjs`, which runs every entry through the real engine and enforces `mustInclude` / `mustExclude` finding lists.

- 6 entries cover the domains Phase 1 reactivated (Payment, Indemnification, Liability, ForceMajeure ×2, Definitions' `DEFINITION_WITHOUT_USE`) — these guard against Phase 1's fixes silently regressing.
- 5 entries cover still-pending domains (Assignment, Notice, Confidentiality, GoverningLaw, IntellectualProperty) with `mustExclude` assertions — these guard against **fabricated** capability creeping back in, and are designed to flip to `mustInclude` (with a corresponding integration-test update) the moment each domain is actually authored.

One entry (`REGR-FORCEMAJEURE-001`) was corrected mid-build: an initial draft assumed `RULE_FORCE_MAJEURE_NOTICE_REQUIRED` would co-fire with the 90-day termination-cap clause. Running it against the real engine showed it doesn't — only the exact clause pattern from the Phase 1 test does. The corpus entry was split in two rather than "fixed" by loosening the assertion, so it asserts only what's actually verified.

```
$ npm run test:regression
SUMMARY: 12/12 entries passed
By status: {"active":6,"partial":1,"pending":5}
```

---

## 3. Benchmark retargeted at `Trothix.js` (`benchmark/run-benchmark-pipelineB.mjs`)

The existing `benchmark/run-benchmark.mjs` benchmarked `core/router.js` (Pipeline C) — a well-built harness measuring a pipeline nothing else in the app calls. At the time of this restoration it was kept in place (as `npm run benchmark:legacy`, clearly labeled) while `npm run benchmark` was repointed at the new script. It has since been moved to `archive/benchmark/run-benchmark.mjs` and the `benchmark:legacy` npm script has been removed, since `core/router.js` no longer exists in the repository and the script cannot run.

The old harness's per-field accuracy model (`result.extractedData[field]`) doesn't apply to Pipeline B — `Trothix.analyze()` returns a findings-based report, not extracted fields — so this isn't a drop-in retarget, it's a new scoring model:

- Runs all 15 existing benchmark documents (`benchmark/{nda,lease,tos}/*.txt`) through the real engine.
- Compares the sorted finding-id list per document against a checked-in snapshot baseline (`benchmark/pipeline-b-baseline.json`), generated by actually running the engine (`--update-baseline`).
- Flags documents producing zero findings as a coverage signal (currently 0/15 — every document produces at least one finding, though several fire nothing beyond `RULE_FORCE_MAJEURE_MISSING`, consistent with current rule coverage).
- A baseline diff is a deliberate stop-and-look signal, not an auto-fail-forever: intentional changes (a domain going live, a bug fix) get re-baselined and committed alongside the change that caused them.

```
$ npm run benchmark
Documents benchmarked:     15
Documents w/ 0 findings:   0
Matches baseline:          15/15
```

---

## 4. `npm run verify`

```json
"verify": "npm run lint && npm run rule-diagnostics && npm run test:phase1 && npm run test:integration && npm run test:regression && npm run benchmark"
```

Chains every real signal in the repo into one command: knowledge linter → rule diagnostics → Phase 1 restoration regression → the 5 rewritten integration tests → the new regression corpus → the Pipeline B benchmark. Confirmed to run clean end-to-end.

**Known limitation, stated plainly:** `test_linter.js` and `test_ruleDiagnostics.mjs` both print real errors/warnings to stdout but exit `0` even when they find problems (confirmed by running them directly — the linter currently reports 5 unresolved references, diagnostics currently reports 16 compiled-inert + 14 failed rules, and the process still exits clean). `npm run verify` will not fail CI on those specific findings today; it will fail on integration/regression/benchmark failures. Making the linter and diagnostics tools exit non-zero on findings is a small, separate change (not bundled into this Phase 2 pass since it changes those tools' own behavior, not just what tests them) worth doing before wiring `verify` into CI as a hard gate.

---

## What Phase 2 did *not* do

- Did not author real `when`/`then` logic for any pending domain (Assignment, Notice, Confidentiality, GoverningLaw, IntellectualProperty, Lifecycle) — that's Phase 3+ knowledge-engineering work per the original roadmap, and the regression corpus is specifically built to make that work visible when it happens.
- Did not add CI config — no `.github/workflows` existed before and none was added; `npm run verify` is ready to be wired into one.
- Did not touch `tests/benchmarks/commercial_nda/*.json` — those are placeholder stub fixtures (empty `expected` blocks, no real document text) unrelated to the fabricated-pipeline problem this phase targeted.
- Did not change `test_linter.js` / `test_ruleDiagnostics.mjs` exit-code behavior — flagged above as a known gap rather than silently fixed as a side effect.
