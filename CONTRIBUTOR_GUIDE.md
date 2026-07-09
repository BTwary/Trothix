# Trothix Contributor Guide

This guide establishes the engineering conventions and workflows for contributors adding legal knowledge to the Trothix platform.

---

## 1. Domain Acquisition Playbooks

When authoring a new domain (such as `Warranty`, `ForceMajeure`, `Insurance`, `AuditRights`, or `ServiceLevel`), follow these steps sequentially:

### 1.1 Repository Preparation
*   `[Repository Evidence]` Create directory `knowledge/source/domains/<DomainName>/` and a nested `tests` folder.
*   `[Repository Evidence]` Create `knowledge.json` declaring the JSON configurations.
*   `[Knowledge Recommendation]` Create a `metadata.json` declaring dependencies (e.g., `["Core"]`).

### 1.2 Corpus Acquisition & Normalization
*   `[Knowledge Recommendation]` Extract at least 10 raw clauses matching the target capability from SEC EDGAR or public procurements.
*   `[Knowledge Recommendation]` Transcribe sentences into normalized token paths: `[SUBJECT] -> [MODAL] -> [ACTION] -> [OBJECT] -> [CONSTRAINT]`.

### 1.3 Ontology, Phrase, and Rule Authoring
*   `[Knowledge Recommendation]` Declare concepts in `concept.json` and verbs in `actions.json`.
*   `[Knowledge Recommendation]` Add phrase sequences in `templates.json` and semantic vectors in `intents.json`.
*   `[Knowledge Recommendation]` Author declarative checks inside `rules.json` matching target concept IDs.
*   `[Knowledge Recommendation]` Bind templates to rules inside `decision_tables.json`.

---

## 2. Knowledge Lifecycle Stages

Every rule, concept, and domain progresses through five lifecycle stages:

```
  Draft ➔ Validated ➔ Regression Passed ➔ Benchmark Passed ➔ Production
```

### 2.1 Draft
*   `[Repository Evidence]` Node files are created in local feature branches, with status set to `"draft"`.
*   *Verification*: Checked inside local files.

### 2.2 Validated
*   `[Repository Evidence]` Domain compiles with no syntax errors.
*   *Verification*: `KnowledgeLinter.js` reports 0 errors.

### 2.3 Regression Passed
*   `[Repository Evidence]` Integration and mutation tests pass successfully.
*   *Verification*: Executing tests inside `tests/integration/` returns PASS.

### 2.4 Benchmark Passed
*   `[Repository Evidence]` Extraction accuracy exceeds threshold.
*   *Verification*: `run-benchmark.mjs` returns 100% accuracy.

### 2.5 Production
*   `[Repository Evidence]` Merged to master and compiled into main assets.
*   *Verification*: Added to domains array in `assets/js/engine/knowledge/v1/manifest.json`.

---

## 3. Promotion Checklist

Before merging a domain branch into master, confirm:

- [ ] **Metadata Validated**: `metadata.json` lists accurate dependencies.
- [ ] **Ontology Completed**: Concepts, actions, and objects are declared.
- [ ] **Templates Checked**: Sequence matchers in `templates.json` use valid tokens.
- [ ] **Rules Compiled**: Rules in `rules.json` compile cleanly in `RuleRegistry.js`.
- [ ] **Decision Tables Verified**: Mapped table inputs resolve to existing rules.
- [ ] **Linter Passed**: Offline linter execution reports 0 warnings.
- [ ] **Regression Suite Green**: Native benchmark script runs with zero failures.
- [ ] **Coverage Updated**: `coverage.json` lists accurate counts.

---

## 4. Contributor Anti-patterns to Avoid

1.  **Hardcoded Rules in JavaScript (Engine Level)**
    *   *Evidence*: `universalRules.js` contains hardcoded checks like checking if payment terms exceed 60 days directly in code: `data.paymentTermsDays > 60` or notice check `data.terminationNoticeDays < 15`.
    *   *Resolution*: Move these checks into declarative rule structures (`rules.json`) and pass the thresholds dynamically.
2.  **Coupled Cross-Domain Concept References**
    *   *Evidence*: `Definitions/rules.json` references `"concept": "NOTICE"`, linking the Definitions rule to the Notice concept.
    *   *Resolution*: Declare a local concept representing defined terms and map the rule directly to it.
3.  **Inconsistent Domain Structures**
    *   *Evidence*: The `Definitions` source domain has custom dictionary files like `defined_terms.json` and `aliases.json` rather than the typical ontology structures (`concept.json`, `actions.json`).
    *   *Resolution*: Align files with the standard taxonomy, or declare them in `knowledge.json` mappings.
4.  **Mocked Verification traces**
    *   *Evidence*: Tests under `tests/integration/` (such as `definitions_runtime.test.js`) print mock logs and return hardcoded JSON trace outputs.
    *   *Resolution*: Do not modify this frozen test setup, but ensure new benchmarks use the engine execution paths.

---

## 5. Guide Recommendations

*   `[Knowledge Recommendation]` Run the linter locally before creating pull requests.
*   `[Future Tooling]` Create an offline CLI command to automate domain creation boilerplate setup.
*   `[Architecture Change Request]` None. Guide specifications remain entirely offline, keeping the runtime engine frozen.
