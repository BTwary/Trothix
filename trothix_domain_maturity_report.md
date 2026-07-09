# Trothix Knowledge Base — Domain Maturity Report & Implementation Roadmap

**Scope of this review:** every domain folder under `assets/js/engine/knowledge/v1/domains/*`, cross-checked against the 15 schema types actually registered in `assets/js/engine/knowledge/schemas/index.js`, and against how `KnowledgeProvider._loadDomains()` actually consumes those files at runtime. Findings are evidence-based (read from the repository), not inferred from file names.

---

## 0. A scope correction that changes what "the knowledge base" means

Before scoring domains, one fact has to be on the table: **there are two separate knowledge trees in this repository, and only one of them is live.**

| Tree | Path | Status |
|---|---|---|
| Runtime tree | `assets/js/engine/knowledge/v1/domains/*` | **Live.** `KnowledgeProvider.basePath` defaults here, `vercel.json` bundles it (`includeFiles: assets/js/engine/**`), and this is what actually answers requests in production. |
| Authoring tree | `knowledge/source/domains/*`, compiled by `knowledge/build/*` into `knowledge/compiled/*` | **Not live.** Nothing outside `knowledge/build/` and `tools/knowledge-compiler/` reads from it. It never reaches `KnowledgeProvider`. |

This matters for a maturity report for one concrete reason: **the two trees have already silently diverged.** `ForceMajeure/metadata.json` exists in the runtime tree but not in the source tree — proof that edits are landing in one tree without a mechanism to keep the other in sync. Everything below scores the **runtime tree**, because that's the one that affects real output. Any roadmap item that only touched the source tree would improve a report that ships to nobody.

**Recommendation carried into the roadmap:** either retire the source/build tree explicitly (documented dead-end) or make it the single authoring point with a real sync step into runtime — but *deciding that* is an architecture question, and per your constraint I'm not proposing it as an engine change here, only flagging it so the roadmap below doesn't accidentally spend effort in the wrong tree.

---

## 1. Domain × Schema Matrix

15 canonical schema types are registered in `SchemaRegistry`. This matrix shows which of those 15 files exist per domain in the **live** tree. `Y` = present, blank = missing.

| Domain | concept | rules | relations | knowledge | metadata | coverage | actions | entities | phrases | actors | objects | templates | decision_tables | enums | states |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Assignment | | Y | | Y | Y | | | | | | | Y | Y | | |
| Confidentiality | | Y | | Y | Y | | | | | Y | Y | Y | Y | | |
| Core | | | | | | | | | | | | | | | |
| Definitions | | Y | | Y | Y | | | | | Y | Y | Y | Y | Y | |
| ForceMajeure | Y | Y | Y | | Y | Y | Y | | Y | | | | | | |
| GoverningLaw | | Y | | Y | Y | | | | | | | | | | |
| Indemnification | Y | Y | Y | | | Y | Y | Y | Y | | | | | | |
| IntellectualProperty | | Y | | Y | Y | | | | | | | | | | |
| Liability | Y | Y | Y | | | Y | Y | Y | Y | | | | | | |
| Lifecycle | Y | Y | | Y | Y | | | | | | | | Y | | Y |
| Notice | | Y | | Y | Y | | | | | Y | Y | Y | Y | Y | |
| Payment | Y | Y | | | | | Y | | | | | | | | |
| Termination | Y | **—** | | Y | | | | | | Y | Y | Y | | | Y |
| Warranty | | | | | | | | | | | | | | | |

**Read this table with one caveat in mind:** file presence is necessary but not sufficient. Section 2 shows that several "Y" cells above are cosmetically present but functionally inert at runtime. Section 3 shows several "rules present" cells contain zero executable logic. The matrix alone overstates maturity for at least six domains.

### Immediate anomalies visible in the matrix alone

- **`Termination` has no `rules.json`.** This is one of the six domains in `knowledge/manifest.json`'s production list (alongside Confidentiality, Payment, Liability, Indemnification, Notice) and is marked "Production / Active" in `KNOWLEDGE_CATALOG.md`. A domain the catalog calls production-active cannot generate a single finding — it has a `concept.json` (so it can recognize the clause exists) but no rule file to reason about it. This is the single highest-severity gap in the whole base.
- **`Warranty` and `Core` have zero domain-content files.** `Warranty` is listed in `KNOWLEDGE_BACKLOG.md` as *"Implemented (Frozen)"* — that status is not supported by the repository; the directory is empty. `Core` is intentionally different (it's the helper/grammar domain, not a clause domain), so its blank row is expected and not a defect — flagging the distinction so it isn't miscounted as 14 broken domains instead of 12.
- **Two competing schemas are in simultaneous production use.** Confidentiality/Notice/Definitions/GoverningLaw/IntellectualProperty/Lifecycle/Assignment/Termination use a *legacy vocabulary model* (`knowledge.json` + `metadata.json` + ad-hoc files like `actors.json`, `intents.json`, `modals.json`, `courts.json`, `licenses.json`, `deadlines.json` — none of which are part of the registered concept-hub graph). ForceMajeure/Indemnification/Liability/Payment use the *concept-hub model* (`concept.json` as the graph node, with `actions/entities/phrases/relations/coverage` hanging off it — the shape `tools/knowledge-generator/index.js` scaffolds for new domains). These are not two maturity levels of the same design — they are two different designs coexisting, which is why no single "missing files" list applies uniformly across domains. The roadmap below treats migrating legacy domains onto the concept-hub model as the main line of work, not just filling blanks in the old shape.

---

## 2. Runtime inertness: files that exist but do nothing

`KnowledgeProvider._loadDomains()` walks every `.json` file in a domain and does exactly one structural check before using an entry: `if (!entry.id) continue;`. A file that is a plain keyed object (e.g. `{"Discloser": ..., "Recipient": ...}`) or a list of items without an `id` field is **read, parsed, and silently discarded** — no warning, no error. Separately, `TemplatesSchema.validate()` (and equivalents) only checks "is this an array" — it never checks for `id` — so the linter reports these files as structurally valid while the loader throws them away. That's a genuine blind spot between the linter and the loader, not a hypothetical one.

Files confirmed to be silently dropped at runtime (excluding `metadata.json`/`knowledge.json`/`coverage.json`, which are *designed* to be non-graph config and are fine):

| Domain | File | Why it's dropped |
|---|---|---|
| Assignment | `templates.json`, `assignment_types.json`, `corporate_events.json`, `successors.json` | Every entry lacks `id` |
| Definitions | `aliases.json`, `defined_terms.json`, `enumerations.json`, `enums.json`, `references.json` | Keyed objects with no top-level `id` |
| Definitions | `definition_patterns.json`, `templates.json` | List entries lack `id` |
| Notice | `templates.json`, `enums.json` | Same pattern |
| Confidentiality | `templates.json` | Same pattern |
| **Lifecycle** | `states.json`, `events.json`, `transitions.json`, `illegal_transitions.json`, `timeline.json`, `deadlines.json` | **Every single file specific to what "Lifecycle" is supposed to model is inert.** The domain's entire reason for existing — tracking contract states and legal/illegal transitions — currently contributes zero nodes and zero edges to the runtime graph. |

**This is the most consequential finding in the review.** Lifecycle looks, by file count, like one of the more built-out domains (10 files). By function, it is currently indistinguishable from an empty domain, because none of its data can enter the graph in its current shape. A maturity report based on file presence alone would have rated Lifecycle far higher than Payment (3 files) — the opposite of the truth.

---

## 3. Rule executability audit

File presence of `rules.json` was checked further: does each rule entry actually have both a `when` and a `then` clause (the only thing `RuleCompiler`/`isExecutableRule` requires to treat it as executable), and if so, is the `when` clause built from a shape `RuleCompiler._compileCondition()` recognizes (a logical combinator or a `field` comparison) — or a shape (like a bare `{"type": "conceptExists", ...}`) that compiles successfully but silently evaluates to `false` forever?

| Domain | Rule entries | Executable (`when`+`then` present, recognized shape) |
|---|---|---|
| ForceMajeure | 4 | **4 / 4** |
| Indemnification | 6 | **6 / 6** |
| Liability | 6 | **6 / 6** |
| Payment | 1 | **1 / 1** |
| Assignment | 2 | 0 / 2 — metadata-only stubs, no `when`/`then` |
| Confidentiality | 1 | 0 / 1 |
| Definitions | 3 | 0 / 3 |
| GoverningLaw | 2 | 0 / 2 |
| IntellectualProperty | 2 | 0 / 2 |
| Lifecycle | 2 | 0 / 2 |
| Notice | 2 | 0 / 2 |
| Termination | 0 | — (no rules file at all) |

**Only 4 of 13 populated domains produce a single automated finding today.** Every domain built on the legacy vocabulary model has `rules.json` entries that are pure descriptive metadata (`id`, `name`, `severity`, `rationale` — no `when`/`then`), which is exactly the pattern your earlier finding about `RULE_PAYMENT_DEADLINE_LONG` being "the only fully active rule" was pointing at — the same gap generalizes across every legacy-style domain, not just Payment's neighbors.

---

## 4. Documentation-vs-repository mismatches

Both `KNOWLEDGE_CATALOG.md` and `KNOWLEDGE_BACKLOG.md` are useful and mostly accurate, but two claims don't match what's on disk and should be corrected as part of this work (not just left for the next person to trip over):

- `KNOWLEDGE_BACKLOG.md` lists **Warranty** as *"Implemented (Frozen)"* with priority *High*. The directory contains zero files. It is not implemented, frozen, or draft — it doesn't exist yet.
- `KNOWLEDGE_CATALOG.md` marks **Termination** as *Production, Active*. Per Section 1/3, it has no rule file and produces no findings. "Production" should mean "produces findings," not "has a concept file and templates."

---

## 5. Prioritized Implementation Roadmap

Everything below is content work — new/edited `.json` files inside existing domain folders under `assets/js/engine/knowledge/v1/domains/`. Nothing here requires touching `RuleCompiler`, `KnowledgeProvider`, `SchemaRegistry`, or any other engine code, per your constraint. The one exception explicitly flagged as **not** in scope for content-only work is Section 0's tree-divergence question, which is a decision, not a file edit.

### P0 — Correctness gaps in domains already marked "production" (do first, small surface area)
1. **Termination: write `rules.json`.** This is the single highest-leverage fix in the base — a manifest-active, catalog-labeled-production domain currently ships zero findings. Use the concept-hub shape (see P1) rather than the legacy stub shape, so it doesn't need to be redone in P1.
2. **Lifecycle: reshape `states.json`, `events.json`, `transitions.json`, `illegal_transitions.json` so each entry carries an `id`.** No new legal content is needed — the domain's data already exists, it just can't enter the graph in its current shape. This is the cheapest, highest-impact fix in the entire report (pure reshaping, zero new authoring).
3. **Assignment / Confidentiality / Definitions / Notice: add `id` to every `templates.json` entry.** Same class of fix — reshape, don't rewrite.
4. Correct the two documentation mismatches in Section 4 (Warranty status, Termination "production" claim) so the catalog stops asserting capabilities that don't exist — a fast, low-risk trust-repair item.

### P1 — Bring legacy-model domains onto the concept-hub schema
This is the main body of work, and it's the same shape for every domain in this bucket: **Assignment, Confidentiality, Definitions, GoverningLaw, IntellectualProperty, Notice.** For each:
1. Add `concept.json` (the graph hub — `id`, `name`, `description`, `category`, plus `actions`/`phrases`/`entities`/`related`/`rules` arrays per `ConceptSchema`).
2. Add `relations.json` linking the new concept to related concepts (e.g. `Notice` ↔ `Termination`, already an implied dependency per the catalog's own dependency column).
3. Rewrite `rules.json` entries to the executable shape proven out in ForceMajeure/Indemnification/Liability (a `when` combinator + a `then.findingType`), replacing the current metadata-only stubs. Keep the existing `id`s stable so nothing downstream that references them by name breaks.
4. Add `coverage.json` (domain, supported documents, jurisdictions, rule/phrase counts) — currently only the 4 concept-hub domains have this, so today there's no consistent way to compare coverage across domains at all.
5. Add `entities.json` where the domain has extractable data points (e.g. `GoverningLaw`'s jurisdiction/court names, `IntellectualProperty`'s license terms) — right now that data sits in unregistered files (`courts.json`, `licenses.json`) that the schema system doesn't recognize as any of the 15 canonical types.
6. Leave the existing legacy vocabulary files (`actors.json`, `objects.json`, `intents.json`, etc.) in place rather than deleting them — they're still valid `ActorsSchema`/`ObjectsSchema` files and some are correctly shaped (unlike the inert ones flagged in Section 2). Retire only the ones proven inert in Section 2 once their content has been migrated into the new `entities.json`/`concept.json`.

Suggested order within P1, by production-manifest priority and dependency chain already documented in the catalog: **Notice → Confidentiality → Assignment → Definitions → GoverningLaw → IntellectualProperty.**

### P2 — Close the remaining gaps in the concept-hub domains themselves
Even the four domains built "correctly" aren't complete against the 15-type registry:
1. **Indemnification, Liability: add `metadata.json`.** Both are missing it — the one file type ForceMajeure/Payment/legacy domains all have some version of.
2. **Payment: the thinnest domain in the base (3 files) despite being production-active.** Add `relations.json`, `coverage.json`, `entities.json`, `phrases.json` to bring it to parity with ForceMajeure/Indemnification/Liability. Its single rule is executable, which is good — it just has almost nothing else.
3. **ForceMajeure: add `entities.json`** (the one canonical file missing here) — this domain is otherwise the most complete in the base.

### P3 — Net-new domains and cleanup
1. **Warranty:** either build it from scratch using `tools/knowledge-generator/index.js` (it already scaffolds the exact concept-hub shape this roadmap standardizes on) or formally retire the "Frozen" claim in the backlog until it is. Given `KNOWLEDGE_BACKLOG.md` marks it High priority, treat this as a real backlog item, not paperwork.
2. **Proposed domains** (`AuditRights`, `ServiceLevel`, `Insurance`) should be scaffolded with the generator tool directly in the concept-hub shape once P1 is done — building them on the legacy pattern now would just create three more domains needing the P1 migration later.
3. Resolve the Section 0 tree-divergence question (retire or actively sync `knowledge/source`) before it causes a second silent drift like ForceMajeure's `metadata.json`.

---

## 6. What "done" looks like

A consistent enterprise-grade model, without any engine change, means: every populated domain has `concept.json`, `rules.json` (with real `when`/`then` logic), `relations.json`, `actions.json`, `entities.json`, `phrases.json`, `coverage.json`, and `metadata.json` — the eight files `knowledge-generator` already scaffolds for new domains — and every array-shaped file in every domain has an `id` on each entry, so nothing is invisibly dropped by the loader the way Lifecycle's core files are today. That's a concrete, checkable bar: at that point, this same matrix re-run should show a full row of `Y`s for every domain except `Core` and `Warranty` (until P3 lands), and Section 3's executable-rule count should read 13/13 instead of 4/13.
