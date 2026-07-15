# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Removed
- Removed the obsolete `benchmark:legacy` npm script; the legacy Pipeline C benchmark harness it invoked (`run-benchmark.mjs`) threw `ERR_MODULE_NOT_FOUND` since `core/router.js` no longer exists. The script itself is preserved at `archive/benchmark/run-benchmark.mjs` for historical reference.
- Moved 12 unreferenced, ad-hoc dev/verification scripts (`test_confidence_*.mjs`, `test_definitionEngine_v2*.mjs`, `test_globalEngineRetry.mjs`, `test_pipeline.js`, `test_api.js`, `test_phase1.js`) from the repository root to `archive/dev-scripts/`. None were wired into `package.json` or referenced elsewhere.
- Moved the seven confirmed-dead Pipeline A modules (`assets/js/engine/core/legacy/{classifier,confidence,extractor,checklist,segmenter,definitions,reportGenerator}.js`) to `archive/core/legacy/`. Nothing imports them; this also shrinks the serverless function bundle, since `vercel.json` globs `assets/js/engine/**`.
- Deleted `_needs_review/diagnostics/` (`IRFieldInventory.js`, `RuleClassifier.js`, `runRuleDiagnostics.mjs`) — its own README flagged these as needing a decision; confirmed superseded by the already-live `assets/js/engine/rules/RuleDiagnostics.js` (wired into `npm run rule-diagnostics`), so the folder was removed rather than merged.
- Deleted two mislabeled orphan files at the repository root: `expected.json` (not valid JSON — it was a near-duplicate of `assets/js/pdfProcessor.js` under the wrong filename) and `download` (a near-duplicate of `assets/js/engine/core/legacy/definitions.js` under a generic filename). Neither was referenced anywhere.

### Fixed
- Corrected stale documentation across `README.md`, `benchmark/README.md`, `walkthrough.md`, `PHASE2_TESTING_RESTORATION.md`, `CONTRIBUTOR_GUIDE.md`, `KNOWLEDGE_ENGINEERING_STANDARD.md`, `KNOWLEDGE_ENGINEERING_GUIDE.md`, `KNOWLEDGE_CATALOG.md`, and several `docs/enterprise/` pages — replacing references to the retired benchmark script and dead pipelines with the current, live equivalents, and updating the root `README.md`'s architecture description (it still described a retired client-side Web Worker engine and an outdated single-provider AI chain) to match the current deterministic v1.0 engine and the actual `api/ai-augment.js` provider chain.

`npm run verify` remains 100% green after this pass (Precision 100.0%, Recall 91.7%, F1 95.7% — unchanged from before), and no runtime code paths, public APIs, or engine logic were modified.

---

### Added
- Promoted **Termination**, **Assignment**, and **Notice** domains to production status.
- Introduced dynamic concept-driven rule compilation and public Knowledge API boundaries.
- Created robust, repeatable evaluation quality measurement harness (`run-evaluation.mjs`).
- Formulated the platform architecture decision logs and governance documentation under `/docs/`.

### Changed
- Refactored `Liability` and `Indemnification` domains from blanket presence checks to targeted, distinct legal rules.
- Normalized Force Majeure phrases into discrete dictionary entries.

### Removed
- Cleaned up root workspace by removing transient contract segment text files and duplicate expected JSON files.
