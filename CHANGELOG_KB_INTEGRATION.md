# Trothix Knowledge Integration — Change Log

## Summary

`npm run verify` is green before and after this change (identical precision
100.0% / recall 91.7% / F1 95.7%, identical set of 10 known-incomplete rules).
Nothing existing was removed or altered in behavior — everything below is
additive.

## Correction to the original brief

The requested 16-topic / 11-file-per-topic (`ontology.json`, `phrase-library.json`,
`rule-pack.json`, `recommendations.json`, `sources.json`, `test-corpus.json`,
`jurisdictions.json`...) schema does **not** exist in this repo. The real
structure is 14 domains under `assets/js/engine/knowledge/v1/domains/`, each
with its own file set (`concept.json`, `phrases.json`, `rules.json`,
`exceptions.json`, `metadata.json`, plus domain-specific extras), and
`KnowledgeProvider.js`, `RuleCompiler.js`, `RuleEvaluator.js`,
`EvidenceResolver.js`, and `ReportAssembler.js` all already existed. This
delivery works against the real schema, not the originally-described one.

## What changed

**`assets/js/engine/knowledge/KnowledgeProvider.js`** — added 8 new accessor
methods (additive only, no changes to existing methods, the loader, or the
graph validator):
- `getPhraseGroup(conceptId)`
- `getRecommendation(ruleId)` — reads `then.recommendation`/`then.rationale`
  on compiled rules, and falls back to the raw node's top-level
  `recommendation`/`rationale` for the 10 non-executable "knowledge-concept"
  entries (e.g. `RULE_NON_DISCLOSURE`) that were deliberately never compiled.
- `getSources(conceptId)`, `getJurisdictionNotes(conceptId)`,
  `getExamples(conceptId, polarity?)`, `getExceptions(conceptId, domain?)`,
  `getAliases(conceptId)`, `getMatchedSurfaceForms(conceptId, text)`

All of them are defensive: unauthored concepts return `[]`/`null`, never throw.

**New per-domain data files** (`sources.json`, `jurisdiction-notes.json`,
`examples.json`) for the 9 domains that have a real, working `concept.json`
model: Assignment, Confidentiality, ForceMajeure, Indemnification, Liability,
Lifecycle, Notice, Payment, Termination. Real citations (Restatements, UCC,
CISG, DTSA/UTSA, FAR, 11 U.S.C. § 365(e), state anti-indemnity statutes,
UCTA 1977, etc.), not placeholders.

Note on naming: jurisdiction notes use the `JNOTE_*` id prefix, not
`JURISDICTION_*` — that prefix is already used by
`GoverningLaw/jurisdictions.json` for an unrelated venue-name lexicon.
Reusing it for a differently-shaped node would defeat the loader's
prefix-based routing.

**`Confidentiality/concept.json`** (new file) — defines `CONCEPT_NON_DISCLOSURE`,
which was referenced by `rules.json` but never defined as a node. This is a
plain ontology node (name/description only) — it does **not** touch
`RULE_NON_DISCLOSURE`'s missing `when`/`then`, so that rule is still,
correctly, in the 10-failed-rules list.

**Backfilled fields (existing files, additive keys only):**
- `rules.json` in Assignment, ForceMajeure, Indemnification, Liability,
  Notice, Termination — added `then.recommendation` / `then.rationale` to
  the 25 rules that were missing them, and a top-level `concept` field
  (matching each rule's `when.value` / dominant concept) so findings can
  resolve back to a concept id. No `when` predicate was changed.
- `Assignment/exceptions.json`, `Termination/exceptions.json` — added a
  `concept` field to each entry so `getExceptions()` can find them.

**`assets/js/engine/Trothix.js`** — the per-finding narrative loop now also
attaches `evidence`, `conceptRecord`, `recommendationDetail`, `sources`,
`jurisdictionNotes`, `exceptions`, `examples`, and `matchedAliases` to each
finding, sourced from the new KnowledgeProvider accessors keyed by
`finding.concept`. Existing fields (`concept`, `ontologyNode`, and everything
ReportAssembler already produced) are untouched.

**New tests** (auto-discovered by the existing runners, no runner changes
needed):
- `tests/unit/KnowledgeProvider.enterprise.test.js` — 8 checks against the
  new accessors directly, including a check that the new `JNOTE_*` prefix
  does not collide with GoverningLaw's existing `JURISDICTION_*` lexicon.
- `tests/integration/knowledge_enrichment.test.js` — runs a real clause
  through the full engine and asserts the emitted finding actually carries
  concept/sources/jurisdictionNotes/exceptions/examples/evidence — 12 checks.

## What was deliberately NOT done

- `RuleContext.js`, `RuleEvaluator.js`, `RuleCompiler.js`'s predicate logic —
  left untouched, consistent with this codebase's own "frozen this sprint"
  convention documented in their headers.
- Confidentiality, Definitions, GoverningLaw, IntellectualProperty, and
  Warranty were **not** given a full sources/jurisdiction-notes/examples
  pass (Confidentiality got its concept node fixed, but not the other four).
  Definitions, GoverningLaw, and IntellectualProperty reference concept ids
  (`NOTICE`, `GOVERNING_LAW`, `VENUE`, `OWNERSHIP`) that were never defined
  as real nodes — that's the same class of intentionally-incomplete gap
  `test_ruleDiagnostics.mjs` already tracks for those rules. Warranty has no
  files at all. Building a concept model for these would mean authoring
  legal categorization that wasn't there before, which is a bigger, separate
  decision — flagging it rather than inventing it silently.
- No changes to `RuleCompiler.js`'s `CONCEPT_DETECTION_TABLE` workaround for
  Indemnification/Liability — out of scope for this pass.

## Suggested next step

Author `concept.json` + `when`/`then` logic for Definitions, GoverningLaw,
and IntellectualProperty (closing 6 of the 10 known-failed rules for real,
not just adding descriptive metadata), then repeat this same
sources/jurisdiction-notes/examples pass for those three plus Warranty.

---

## Knowledge Expansion sprint (this delivery)

`npm run verify` is green before and after (evaluation corpus: identical
precision 100.0% / recall 91.7% / F1 95.7%; the 10 previously-known-failed
rules are now 0 — closed for real, not just annotated). Nothing existing
was removed or altered in behavior; the benchmark's checked-in snapshot
(`benchmark/pipeline-b-baseline.json`) was regenerated via
`--update-baseline` to include the new rules' correct findings on the
existing corpus (11/15 documents now surface at least one newly-active
rule; every diff was additive, none removed or changed an existing
finding).

### What changed

Closed the exact 10 rules `test_ruleDiagnostics.mjs` tracked as
concept-only across 5 domains, following the suggested next step above.
All changes are declarative (`concept.json`/`phrases.json`/`rules.json`/
`sources.json`/`jurisdiction-notes.json`/`examples.json`); no changes to
`RuleCompiler.js`, `RuleContext.js`, `RuleEvaluator.js`,
`KnowledgeProvider.js`'s loader, scoring, verdict engine, `manifest.json`'s
production domain list, or any other frozen file. Every new/changed
condition uses only the already-supported `conceptExists` /
`conceptMissing` (some combined via `all`) predicate types — no new
predicate type was introduced.

- **Confidentiality** — `RULE_NON_DISCLOSURE` was the one remaining
  concept-only rule (its four siblings already worked). Added
  `phrases.json` for the existing `CONCEPT_NON_DISCLOSURE` node and
  authored real `when`/`then`.
- **Lifecycle** — `rules.json` previously pointed both rules at a bare
  `"LIFECYCLE"` string that resolved to nothing (`CONCEPT_LIFECYCLE`
  existed but was never actually referenced correctly). Split into two
  real, narrower concepts — `CONCEPT_NOTICE_TIMELINE` and
  `CONCEPT_ILLEGAL_STATE_TRANSITION` — each with its own phrases, sources,
  jurisdiction notes, examples, and `when`/`then`. The pre-existing gap
  where `states.json`/`events.json`/`transitions.json` entries lack `id`
  fields (so they never load) is untouched and out of scope — this sprint
  did phrase-based concept detection, not a state-machine.
- **Definitions** — had no `concept.json` at all; its 3 rules referenced a
  bare `"NOTICE"` string (borrowed from an unrelated domain, defined
  nowhere). Authored `CONCEPT_DEFINED_TERM`, `CONCEPT_ALIAS_RESOLUTION`,
  and `CONCEPT_DEFINED_TERM_REFERENCE` (the last representing reliance on
  a term as though defined, e.g. "as defined herein"), each with real
  phrases. `RULE_UNDEFINED_CAPITALIZED_TERM` uses `all: [conceptExists
  CONCEPT_DEFINED_TERM_REFERENCE, conceptMissing CONCEPT_DEFINED_TERM]` —
  fires only when a defined-term reference appears with no matching
  definitional pattern anywhere in the analyzed text; verified it does
  NOT fire once both are present.
- **GoverningLaw** — had no `concept.json` at all; its 2 rules referenced
  bare `"GOVERNING_LAW"` / `"VENUE"` strings, defined nowhere. Authored
  `CONCEPT_GOVERNING_LAW` and `CONCEPT_EXCLUSIVE_VENUE` with real phrases
  (`M/S Bremen v. Zapata Off-Shore Co.` for forum-selection enforceability,
  Restatement (Second) of Conflict of Laws § 187 for party autonomy),
  jurisdiction notes for Rome I Article 6 (EU consumer protection) and
  California Labor Code § 925 (employee choice-of-law/venue
  restrictions).
- **IntellectualProperty** — had no `concept.json` at all; its 2 rules
  referenced a bare `"OWNERSHIP"` string, defined nowhere. Authored
  `CONCEPT_IP_OWNERSHIP` (express assignment language) and
  `CONCEPT_IP_OWNERSHIP_GAP` (IP-generating language — work product,
  deliverables, inventions — with no assignment). `RULE_OWNERSHIP_UNDEFINED`
  uses the same `all: [conceptExists ..._GAP, conceptMissing
  CONCEPT_IP_OWNERSHIP]` pattern; verified it does NOT fire once an
  assignment clause covers the same IP-generating language. Sources include
  17 U.S.C. § 201(b) (work-for-hire) and Stanford v. Roche, 563 U.S. 776
  (2011) (inventorship vests in the individual absent express assignment).

### Concept relationships

Each new concept's `related` array links it to its logical sibling
(`CONCEPT_NOTICE_TIMELINE` ↔ `CONCEPT_LIFECYCLE`, `CONCEPT_IP_OWNERSHIP` ↔
`CONCEPT_IP_OWNERSHIP_GAP`, `CONCEPT_DEFINED_TERM` ↔
`CONCEPT_ALIAS_RESOLUTION`/`CONCEPT_DEFINED_TERM_REFERENCE`,
`CONCEPT_GOVERNING_LAW` ↔ `CONCEPT_EXCLUSIVE_VENUE`), validated by
`KnowledgeProvider`'s existing broken-reference check (every `related` id
must resolve to a real node, or the loader throws).

### Tests

- Updated `test_ruleDiagnostics.mjs`'s hardcoded expectations (37→47
  compiled-active, 10→0 failed) — these were this file's own ground-truth
  assertions about the pre-sprint state, and needed to flip along with it.
- Updated `tests/integration/definitions_runtime.test.js`,
  `lifecycle_runtime.test.js`, and `real_clause.test.js` (Confidentiality) —
  each had asserted the *old, broken* behavior as a deliberate regression
  signal (their own comments said as much), and now assert the new, real,
  verified behavior instead, including negative controls (the "both present"
  case correctly not firing the risk rule).
- Added `tests/integration/confidentiality_runtime.test.js`,
  `governinglaw_runtime.test.js`, `intellectualproperty_runtime.test.js` —
  new domains, no prior rule-level test coverage.
- Updated `tests/regression/corpus.json`: 3 entries
  (`REGR-CONFIDENTIALITY-001`, `REGR-GOVERNINGLAW-001`,
  `REGR-INTELLECTUALPROPERTY-001`) and 1 entry (`REGR-DEFINITIONS-001`) had
  encoded the old "must NOT fire" expectation with a `"Concept-only, no
  when/then authored"` note — flipped to the real, verified behavior. Added
  `REGR-LIFECYCLE-001`/`002`, since Lifecycle had no regression coverage at
  all before this sprint.
- Regenerated `benchmark/pipeline-b-baseline.json` via `--update-baseline`
  after confirming by hand that every diff was a newly-active rule firing
  correctly (no removed or changed findings).

### A real gap caught by empirical verification (not assumed away)

The first phrase list authored for `CONCEPT_DEFINED_TERM` only covered
"shall mean" / "is defined as" style patterns; running the actual
`definitions_runtime.test.js` clause (`"Term" means ...`, no "shall")
through the real engine showed `RULE_DEFINITIONS_PRESENT` did not fire.
Added "means all/any/the/each" phrases and re-verified. Likewise, the
regression corpus's `REGR-INTELLECTUALPROPERTY-001` text ("shall be owned
exclusively by") didn't match any authored `CONCEPT_IP_OWNERSHIP` phrase
until "owned exclusively by" was added — caught the same way, by running
the real corpus text through the real engine rather than assuming the
phrase list was complete.

### What was deliberately NOT done

- `manifest.json`'s `domains` list was not touched. `KnowledgeProvider`
  loads every domain under `assets/js/engine/knowledge/v1/domains/`
  unconditionally regardless of that list (confirmed by reading
  `_loadKnowledge()`) — it was already the case that Lifecycle,
  Definitions, GoverningLaw, and IntellectualProperty ran in production
  before this sprint touched them, manifest or no. So this sprint doesn't
  change *what's live*; it only closes the pre-existing "declared to have
  rules but the rules didn't work" gap in code paths that were already
  running.
- Note for visibility: `tools/knowledge-audit/loader.js`'s
  `listKnowledgeFiles()` scopes its schema/quality checks to
  `manifest.json`'s declared domains only (a pre-existing, documented
  design, not something introduced here). That means the new content in
  Definitions/GoverningLaw/IntellectualProperty/Lifecycle runs in
  production and is covered by rule-diagnostics, the integration suite,
  and the regression corpus, but bypasses `npm run knowledge-audit`'s
  schema audit specifically, same as it did before this sprint for these
  domains' pre-existing files. Not fixed here since it would mean editing
  `manifest.json`, which was explicitly out of scope for this sprint.
- Warranty domain — still has no files at all; out of scope (not one of
  the 10 tracked failed rules).

## Knowledge Quality & Coverage sprint — Phase 1 (audit tool root-cause fix)

**Question:** was the knowledge-audit tool's 0% "end-to-end traceability"
(`coverage.json`'s `score`, feeding `quality.json`'s `score.coverage`) a
tracing defect or missing knowledge metadata?

**Root cause: confirmed audit-tool defect**, isolated to
`tools/knowledge-audit/knowledge-graph.js`'s `findRules(conceptId)`. It
filtered incoming edges for `relation === 'depends_on' || 'belongs_to'` —
labels that no code path in this tool ever produces. Every rule→concept
edge is derived implicitly from a rule's own `concept` field (see
`schema-registry.js`'s rule `referenceExtractor`), and
`extractReferencedIds()` never sets a custom `.relation`, so
`graph-builder.js` always falls back to `relation: 'references'`. Filtering
on `depends_on`/`belongs_to` therefore made `findRules()` return `[]`
unconditionally, for every concept, in every domain — silently zeroing
`coverage.js`'s traceability trace (its "standalone rule" fallback path)
and `quality.js`'s `rulesWithoutSources` check.

**Fix (tool-only, `tools/knowledge-audit/knowledge-graph.js`):** changed
the filter to `relation === 'references'`, matching what the rest of the
tool's own code (e.g. `templatesByReferencedNode` in `coverage.js`) already
treats as the real label for this reference. No production file touched.

**Result:** `coverage.json` score 0 → 33 (13/40 concepts now trace
end-to-end); `quality.json` `score.coverage` 0 → 33, `score.overall` 37 →
49; `rulesWithoutSources` went from silently-always-empty to correctly
populated (6 rules). `npm run test:knowledge-audit`, `rule-diagnostics`,
`lint`, all integration/regression suites, and `npm run verify`
(Precision 100.0% / Recall 91.7% / F1 95.7%, ALL CI QUALITY GATES PASSED)
all still pass — this was a pure tracing-logic fix with no knowledge-base
changes.

**Second, narrower issue found — flagged, not fixed:** the 27 remaining
`INACTIVE` concepts (`CONCEPT_LIABILITY`, `CONCEPT_INDEMNIFICATION`, and
their sub-concepts) are inactive for a different reason: Liability's and
Indemnification's rule ids are themselves named like concepts (e.g. the
*rule* `CONCEPT_LIABILITY_PRESENT` lives in `Liability/rules.json` with
real `when`/`then`, and its `concept` field correctly points at
`CONCEPT_LIABILITY`). But `tools/knowledge-audit/parser.js`'s `detectType()`
classifies every entry by its `id`'s prefix *before* falling back to the
file it lives in, so an entry named `CONCEPT_LIABILITY_PRESENT` gets typed
`concept` even though it's sitting in `rules.json` and is a real rule.
`findRules()`'s `sourceType === 'rule'` check then excludes it. This is a
pre-existing ID-naming inconsistency in the knowledge base (rules should
be `RULE_*` per `KNOWLEDGE_ID_CONVENTIONS.md`) surfacing as a parser
misclassification, not a gap this tool-only fix should paper over —
renaming those ids touches identifiers that `RuleCompiler.js`'s
`CONCEPT_DETECTION_TABLE` and other frozen code may depend on, so it's
left for an explicit decision rather than done silently here.

**Stopping per instructions** to report before starting phrase-coverage /
false-negative / doctrine-enrichment work.

## Knowledge Quality & Coverage sprint — Phase 2 (phrase coverage)

**Scope:** authored knowledge only (`phrases.json`, `concept.json`,
`examples.json`, `sources.json`), across the six manifest-declared domains
(`Confidentiality`, `Payment`, `Termination`, `Liability`, `Indemnification`,
`Notice`). No `manifest.json`, `RuleCompiler.js`, or other production/runtime
file touched, and no `CONCEPT_*`-named rule ids renamed, per instructions —
the ID-misclassification issue from Phase 1 remains a flagged, un-fixed
tooling limitation.

**What "phrase coverage" meant here:** `coverage.js`'s reachability trace
(fixed in Phase 1) tells you whether a rule is *wired* to a concept, not
whether that concept can ever be *detected* in a real document. Detection
depends entirely on `phrases.json` entries. Cross-referencing
`coverage.json`'s per-concept `phrases` array turned up seven concepts in
manifest-scoped domains that were structurally reachable (`PASS`/wired) but
had **zero authored phrases** — meaning the relevant rule could never fire
against real contract text, regardless of what the document said:

- `CONCEPT_PAYMENT`, `CONCEPT_LATE_INTEREST`, `CONCEPT_DISPUTED_INVOICE`
  (Payment — this domain had **no `phrases.json` file at all**)
- `CONCEPT_TRADE_SECRET`, `CONCEPT_RESIDUAL_KNOWLEDGE`,
  `CONCEPT_COMPELLED_DISCLOSURE`, `CONCEPT_RETURN_DESTROY`
  (Confidentiality)

**Fix:** created `Payment/phrases.json` (9 phrases across the domain's 3
concepts) and added 10 phrases to `Confidentiality/phrases.json` for the
four uncovered sub-concepts, drawn from the wording already present in each
concept's own `examples.json` positive/negative fixtures so phrases track
real clause language rather than invented terms.

**Evidence gaps found along the way (fixed within the same authorized
files):** while cross-referencing `quality.json`'s `rulesWithoutSources`
and `conceptsWithoutExamples`, found that `RULE_LATE_INTEREST_PENALTY`,
`RULE_DISPUTED_INVOICE_WITHHOLDING`, `RULE_COMPELLED_DISCLOSURE_NOTICE`,
and `RULE_RETURN_DESTROY_CERTIFICATION` had no cited source, and
`CONCEPT_NOTICE`, `CONCEPT_NOTICE_WRITTEN`, `CONCEPT_LATE_INTEREST`, and
`CONCEPT_DISPUTED_INVOICE` had no worked example. Note
`RULE_MISSING_NOTICE_ADDRESS` was *also* on the `rulesWithoutSources` list
even though its own concept (`CONCEPT_NOTICE_ADDRESS`) already had a
source — its `when.all` condition also references the general
`CONCEPT_NOTICE`, which had none, so `quality.js`'s per-concept sweep
correctly flagged it a second time. Added one source each to `Payment`
(`CONCEPT_LATE_INTEREST`, `CONCEPT_DISPUTED_INVOICE`), `Confidentiality`
(`CONCEPT_COMPELLED_DISCLOSURE`, `CONCEPT_RETURN_DESTROY`), and `Notice`
(`CONCEPT_NOTICE`, `CONCEPT_NOTICE_WRITTEN`), plus matching worked examples
in `Payment/examples.json` and `Notice/examples.json`.

**Result:**
- `quality.json` `score.overall`: 49 → **52**
  (`evidence` 40 → 55, `connectivity` 74 → 76; `coverage`/`consistency`
  unchanged since no rule/template wiring was touched)
- `phrasesPerConcept`: 1.325 → 1.85
- `rulesWithoutSources`: 6 → **0**
- `npm run benchmark` initially showed 2/15 fixture diffs
  (`nda_01.txt`, `nda_04.txt`), both `RULE_TRADE_SECRETS_PROTECTED` now
  firing where it previously silently couldn't. Verified both fixtures
  contain literal "trade secret" language in their Confidential
  Information / Term clauses — a correct new detection, not a false
  positive — so the baseline was regenerated
  (`npm run benchmark:update-baseline`) and re-verified clean (15/15).
- `npm run test:regression`: 17/17 pass (unchanged)
- Full `npm run verify`: still green — Precision 100.0% / Recall 91.7% /
  F1 95.7%, ALL CI QUALITY GATES PASSED, all integration (11/11) and unit
  (21/21) suites pass.

**Deliberately not touched:**
- `CONCEPT_CONFIDENTIALITY`, `CONCEPT_ASSIGNMENT`, `CONCEPT_SERVICES`,
  `CONCEPT_RETURN_OF_INFORMATION`, `CONCEPT_CONSENT`, `CONCEPT_BREACH` —
  none is defined in any manifest-scoped domain's `concept.json`; they
  only appear as core-level stub nodes or, for `CONCEPT_ASSIGNMENT` /
  `CONCEPT_CONSENT`, as real concepts in the `Assignment` domain, which
  isn't in `manifest.json`'s `domains` list and so is outside this audit
  tool's (and this sprint's) scope. Adding phrases/examples there
  wouldn't move any of this tool's scores and risks work the manifest
  gap will silently discard.
- The 18 remaining `conceptsWithoutExamples` entries are all the Phase-1
  `CONCEPT_LIABILITY_*` / `CONCEPT_INDEMNIFICATION_*` misclassified-rule
  nodes — out of scope per the standing instruction not to touch
  `CONCEPT_*` rule ids.
- No new `description`/`summary` fields were added to the new phrase,
  source, or example entries. `completeness` (21 → 19) dipped slightly
  because new nodes were added without one, but no existing phrase/
  example/source entry in this knowledge base carries that field either —
  adding it only to the new entries would be an inconsistent, invented
  schema convention rather than a real fix.

Let me know how you'd like to handle the out-of-manifest `Assignment`
domain and the flagged rule-id misclassification, and I'll proceed to
false-negative / doctrine-enrichment work once you've reviewed.
