# Trothix Knowledge Engineering Guide

This guide establishes the comprehensive standard for managing, auditing, and scaling the declarative knowledge base of the Trothix platform. It unifies the authoring pipeline, the offline toolchain design, the health metrics, and the validation workflows.

---

## 1. Authoring Pipeline

The authoring pipeline moves knowledge through fifteen progressive stages from raw legal clauses to active compiled code in the production manifest:

### 1.1 Corpus Acquisition
*   `[Repository Evidence]` Text files are sourced from public or commercial agreements (e.g. `nda_01.txt`, `lease_01.txt`).
*   *Input*: SEC EDGAR, public university, government procurement, or SaaS contracts.
*   *Output*: Clean raw text agreements.
*   *Human Involvement*: Curation, tagging, and category assignments.
*   *Automation Potential*: Crawlers scanning material agreement disclosure endpoints.
*   *Repository Evidence*: Raw files stored in `benchmark/nda/` and `benchmark/lease/`.

### 1.2 Clause Normalization
*   `[Repository Evidence]` Fluff is removed to isolate grammatical predicate chains.
*   *Input*: Raw contract texts.
*   *Output*: Normalized token structures: `[SUBJECT] -> [MODAL] -> [ACTION] -> [OBJECT] -> [CONSTRAINT]`.
*   *Human Involvement*: Verification of token segment boundaries.
*   *Automation Potential*: Parser heuristic scripts mapping sentence fragments.
*   *Repository Evidence*: `tests/integration/real_clause.test.js` validating token structure runs.

### 1.3 Ontology Extraction
*   `[Repository Evidence]` Identifies target actions, concepts, objects, and entities.
*   *Input*: Normalized sentences.
*   *Output*: Mapped concept and dictionary JSON files.
*   *Human Involvement*: Assigning relations and category labels.
*   *Automation Potential*: POS taggers identifying candidate terms.
*   *Repository Evidence*: Dictionary folders in `knowledge/source/domains/`.

### 1.4 Phrase Extraction
*   `[Repository Evidence]` Declares the target vocabulary dictionary.
*   *Input*: Normalized sentences.
*   *Output*: Vocabulary mappings.
*   *Human Involvement*: Curation of lexical variants.
*   *Automation Potential*: Keyword similarity tools.
*   *Repository Evidence*: Dictionaries like `defined_terms.json` in Definitions.

### 1.5 Intent Extraction
*   `[Repository Evidence]` Sets semantic direction categories.
*   *Input*: Verbs and clauses.
*   *Output*: Semantic directions in `intents.json`.
*   *Human Involvement*: Auditing intent directions.
*   *Automation Potential*: Machine classifiers.
*   *Repository Evidence*: `intents.json` files mapping matching keywords.

### 1.6 Template Extraction
*   `[Repository Evidence]` Matches token patterns.
*   *Input*: Mapped intent vectors.
*   *Output*: Grammatical sequence arrays in `templates.json`.
*   *Human Involvement*: Configuration of sequence patterns.
*   *Automation Potential*: Sequence matchers.
*   *Repository Evidence*: `templates.json` in `Assignment` domain.

### 1.7 Rule Candidate Generation
*   `[Repository Evidence]` Formulates predicate checks.
*   *Input*: Domain playbook checklists.
*   *Output*: Declarative rules in `rules.json`.
*   *Human Involvement*: Rationale, recommendation, and severity mapping.
*   *Automation Potential*: JSON template generators.
*   *Repository Evidence*: `rules.json` in GoverningLaw.

### 1.8 Decision Table Candidate Generation
*   `[Repository Evidence]` Binds templates to rule outcomes.
*   *Input*: Matches and rules list.
*   *Output*: logical execution matrices in `decision_tables.json`.
*   *Human Involvement*: Logical rows mapping.
*   *Automation Potential*: Matrix generators.
*   *Repository Evidence*: `decision_tables.json` in Lifecycle.

### 1.9 Benchmark Candidate Generation
*   `[Repository Evidence]` Prepares validation test cases.
*   *Input*: Verified clauses.
*   *Output*: Expected targets in `expected.json`.
*   *Human Involvement*: Verification of expected properties.
*   *Automation Potential*: Auto-generation of benchmark dictionaries.
*   *Repository Evidence*: `expected.json` files in benchmark directories.

### 1.10 Human Review
*   `[Repository Evidence]` Subject-matter expert validation.
*   *Input*: Drafted domain folder.
*   *Output*: Approved domain directory.
*   *Human Involvement*: 100% manual validation by a knowledge engineer.
*   *Automation Potential*: None.
*   *Repository Evidence*: Playbooks mapping review checks.

### 1.11 Compilation
*   `[Repository Evidence]` Merges domain folders into bundle files.
*   *Input*: Source domain directory.
*   *Output*: Compiled `knowledge.bundle.json`.
*   *Human Involvement*: Execution of the build script.
*   *Automation Potential*: 100% automated by compiler.
*   *Repository Evidence*: `knowledge/build/build.js`.

### 1.12 Validation
*   `[Repository Evidence]` Syntactic and schema validation checks.
*   *Input*: Compiled bundle file.
*   *Output*: Linter report logs.
*   *Human Involvement*: Resolving compile warnings.
*   *Automation Potential*: 100% automated lint checks.
*   *Repository Evidence*: `KnowledgeLinter.js` compiled code.

### 1.13 Promotion
*   `[Repository Evidence]` Manifest updating and master branch merges.
*   *Input*: Validated domain directory.
*   *Output*: Pull request approvals.
*   *Human Involvement*: PR review and merge confirmation.
*   *Automation Potential*: Automated promotion triggers.
*   *Repository Evidence*: Compiled manifest updates.

### 1.14 Regression
*   `[Repository Evidence]` Executing test suites to check for performance decays.
*   *Input*: Integration test execution.
*   *Output*: Verification logs.
*   *Human Involvement*: Resolving trace errors.
*   *Automation Potential*: Automated test runs.
*   *Repository Evidence*: `npm run benchmark` (`node benchmark/run-benchmark-pipelineB.mjs`).

### 1.15 Capability Activation
*   `[Repository Evidence]` Enforces runtime analysis coverage.
*   *Input*: manifest array modifications.
*   *Output*: Active scanning support for target contract types.
*   *Human Involvement*: Adding the domain folder to the manifest array.
*   *Automation Potential*: Manual configuration gate.
*   *Repository Evidence*: `manifest.json` domains mapping.

---

## 2. Offline Toolchain Spec

Candidate tools designed to evaluate knowledge quality in pre-compilation:

### 2.1 Knowledge Dependency Analyzer
*   `[Repository Evidence]` Evaluates cross-domain node references.
*   *Purpose*: Catches undeclared cross-domain imports that bypass dependency registries.
*   *Repository Inputs*: `metadata.json` lists, `rules.json` concept fields.
*   *Repository Outputs*: Dependency violation logs.
*   *Potential Future Tool*: CLI checker `node tools/linter/dependency-analyzer.js` running in CI.
*   *Current Repository Support*: `dependency-graph.json` generated during build.

### 2.2 Ontology Coverage Analyzer
*   `[Repository Evidence]` Scans vocabulary mapping coverage.
*   *Purpose*: Reports unmapped terminology percentages.
*   *Repository Inputs*: Domain playbook terms, `concept.json`.
*   *Repository Outputs*: Mapped vs unmapped coverage metrics.
*   *Potential Future Tool*: Text scanner matching playbook words to node names.
*   *Current Repository Support*: `runCoverageAnalyzer` inside `coverage.js` producing `coverage.json`.

### 2.3 Duplicate Phrase Detector
*   `[Repository Evidence]` Scans templates for redundancy.
*   *Purpose*: Detects overlapping or identical token sequences.
*   *Repository Inputs*: `templates.json`, `intents.json`.
*   *Repository Outputs*: Duplicated pattern notifications.
*   *Potential Future Tool*: Sequency comparison script.
*   *Current Repository Support*: Base linter structure in `linter.js`.

### 2.4 Dead Rule Detector
*   `[Repository Evidence]` Scans compiled registries for unused rules.
*   *Purpose*: Flags rules in `rules.json` that are never executed by tables or expectations.
*   *Repository Inputs*: `rules.json`, `decision_tables.json`.
*   *Repository Outputs*: List of unreachable rule IDs.
*   *Potential Future Tool*: Dead-code path checker.
*   *Current Repository Support*: None.

### 2.5 Broken Reference Detector
*   `[Repository Evidence]` Asserts referencing ID validity.
*   *Purpose*: Flags references to non-existent nodes.
*   *Repository Inputs*: Compiled JSON bundles.
*   *Repository Outputs*: Compilation errors with file and line identifiers.
*   *Potential Future Tool*: Build-time validator step.
*   *Current Repository Support*: `KnowledgeProvider.js` throwing `Broken Reference` exceptions.

---

## 3. Health Metrics Specification

Health metrics taxonomy of platform scale and quality checks:

### 3.1 Graph Size
*   `[Repository Evidence]` *Taxonomy*: `Already measurable`.
*   *Definition*: Nodes Map size + Edges list length + compiled Rules count.
*   *How calculated*: Counts keys registered in graph maps after initialize.
*   *Current repository support*: Tracked during initialize.
*   *Future automation*: Log size automatically in compilation output.

### 3.2 Benchmark Accuracy
*   `[Repository Evidence]` *Taxonomy*: `Already measurable`.
*   *Definition*: Whether a document's finding-id list matches the checked-in snapshot baseline, plus a zero-findings coverage check.
*   *How calculated*: `run-benchmark-pipelineB.mjs` diffs each document's sorted finding-id list against `benchmark/pipeline-b-baseline.json`.
*   *Current repository support*: Emitted by `run-benchmark-pipelineB.mjs` (`npm run benchmark`) final totals. (The older `run-benchmark.mjs` per-field extraction-percentage model is retired — see `archive/benchmark/run-benchmark.mjs`.)
*   *Future automation*: Integrate into CI pipeline to block failing PRs.

### 3.3 Rule density
*   `[Repository Evidence]` *Taxonomy*: `Partially measurable`.
*   *Definition*: Average rules mapped to a concept.
*   *How calculated*: `(Total rules in domain) / (Total concepts in domain)`.
*   *Current repository support*: Loaded in compiler.
*   *Future automation*: Expose in build report summaries.

### 3.4 Rule Utilization
*   `[Repository Evidence]` *Taxonomy*: `Future measurable`.
*   *Definition*: Percentage of compiled rules triggered by benchmark contracts.
*   *How calculated*: `(Rules triggered in test suite) / (Total compiled rules)`.
*   *Current repository support*: Traced by engine trace logs but not aggregated.
*   *Future automation*: Write trace aggregator reporting rule utilization post-test.

### 3.5 Broken Reference Count
*   `[Repository Evidence]` *Taxonomy*: `Already measurable`.
*   *Definition*: Count of broken node references in the graph.
*   *How calculated*: Evaluated during initialize traversal loops.
*   *Current repository support*: Checked by `_validateAndResolveGraph()`.
*   *Future automation*: Run automatically in git hooks.

---

## 4. Validation Workflow

*   `[Repository Evidence]` Every compilation run triggers the offline build manager `knowledge/build/build.js`.
*   `[Repository Evidence]` Domains are validated sequentially using `runValidator(domainPath)`, checking file existence, structure, and schema correctness.
*   `[Repository Evidence]` Pre-compile linting is handled by `runLinter(domainPath)`, outputting warnings on invalid rule lifecycle statuses.
*   `[Repository Evidence]` In-memory graph resolution checks for broken references during instantiation and throws a fatal error if resolving fails.
*   `[Knowledge Recommendation]` Ensure all new offline validation steps output warnings in standard compiler formats rather than raising runtime errors.
*   `[Future Tooling]` Integrate the offline linter as a pre-push check in the repository pipeline to enforce strict quality validations.
*   `[Architecture Change Request]` None. Guide specifications remain entirely offline, keeping the runtime engine frozen.

---

## 5. Deterministic Rule Diagnostics Specification

To audit and harden the platform's deterministic rules without modifying the frozen runtime, the offline toolchain introduces a rule diagnostics subsystem.

Rule Diagnostics is an offline verification tool. It does not participate in production document analysis, rule execution, parser execution, scoring, or findings generation.

### 5.1 Classification Taxonomy
Every knowledge-base entry in a domain is analyzed and categorized into exactly one of three states:
1.  **compiled-active**: The entry compiles successfully, and all Legal IR fields it references are actively populated by the current pipeline.
2.  **compiled-inert**: The entry compiles successfully, but references at least one field that has no working deterministic IR hook today, or its condition shape contains logical/field patterns unrecognized by the compiler (which default to `() => false`).
3.  **failed**: The entry cannot be normalized (e.g. legacy declarative schema lacking condition logic), or compilation throws an error.

### 5.2 Architectural Decisions & Code Duplication
*   **Encapsulated Runtime Ownership**: `KnowledgeProvider` is responsible solely for loading and validating production runtime data. The production runtime must never evolve into a diagnostics framework.
*   **Rule Loader Reuse**: Rather than maintaining a parallel implementation of directory scanning and JSON loading, diagnostics consume repository state through the public `getRawEntries()` accessor (intended for read-only diagnostics consumption). Diagnostics are strictly read-only consumers and never extend or pollute the runtime state.
*   **Temporary Repository Observation Registry**: `RuleFieldRegistry.js` is documented strictly as a temporary repository observation registry, not a runtime schema. It logs static observations of which fields are populated by deterministic engines to detect inert rules without runtime modifications.
*   **Future Auto-Generation Recommendation**: Once engine components (e.g. `ActionBuilder`, `ConstraintEngine`) are updated to export runtime schema metadata of properties they write (e.g. via a static `writesFields` array), `RuleFieldRegistry.js` should be automatically generated during the build.

