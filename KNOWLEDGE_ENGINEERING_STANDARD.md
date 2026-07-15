# Trothix Legal Intelligence: Knowledge Engineering Standard

This document establishes the canonical **Knowledge Engineering Standard** for the Trothix platform. It defines the authoring lifecycle, directory structures, schema specifications, cross-file validation rules, quality metrics, and promotion workflows that every legal domain (e.g., Force Majeure, Warranties, SLAs, Audit Rights, Insurance) must follow.

---

## 1. Domain Lifecycle

Every legal domain added to Trothix progresses through a standardized twelve-stage lifecycle to guarantee structural integrity, precision, and regression safety:

```
  Knowledge Source ➔ Human Review ➔ Normalization ➔ Ontology Authoring ➔
  Phrase Authoring ➔ Rule Authoring ➔ Decision Tables ➔ Coverage Mapping ➔
  Compiler Validation ➔ Regression Tests ➔ Benchmark Validation ➔ Production
```

### Stages:
1.  **Knowledge Source**: Sourcing real-world contract clauses (e.g., from SEC EDGAR filings, vendor MSA documents) to capture true legal phrasing instead of synthetic permutations.
2.  **Human Review**: Reviewing sourced clauses with legal experts to identify core rights, obligations, restrictions, and exceptions.
3.  **Normalization**: Mapping clauses to standardized grammatical structures, separating verbs (actions), nouns (objects), variables (entities), and constraints.
4.  **Ontology Authoring**: Declaring the core taxonomy (concepts, actions, objects, entities, and relations) for the domain.
5.  **Phrase Authoring**: Writing the intent definitions and grammar templates that map linguistic variations to the ontology.
6.  **Rule Authoring**: Writing declarative DSL logic checking for the presence, absence, risk level, and fairness of concepts.
7.  **Decision Tables**: Defining the decision matrices that map combinations of matched templates/intents to specific legal findings.
8.  **Coverage Mapping**: Declaring document and jurisdiction support profiles and listing targeted metrics.
9.  **Compiler Validation**: Running the Knowledge Compiler to assemble the domain, resolve dependency graphs, and detect syntax or reference issues.
10. **Regression Tests**: Running mutation and integration tests to ensure that changes do not degrade existing parser performance.
11. **Benchmark Validation**: Running the benchmark runner on standard test sets to evaluate field-level extraction accuracy.
12. **Production**: Approving, merging, and compiling the domain into the production bundle (`knowledge.bundle.json`) for runtime execution.

---

## 2. Canonical Domain Structure

Every domain directory under `knowledge/source/domains/<DomainName>/` must strictly contain the following files:

### 2.1 `metadata.json`
*   **Purpose**: Declares the domain's administrative registry details and dependencies.
*   **Required Fields**: `id`, `name`, `description`, `version`, `status`, `introduced`, `dependencies`.
*   **Validation Rules**: `dependencies` must list existing domain names.
*   **Schema**:
    ```json
    {
      "id": "DOMAIN_ASSIGNMENT",
      "name": "Assignment",
      "description": "Governs the transfer of contract rights and duties.",
      "version": "1.0.0",
      "status": "production",
      "introduced": "1.0.0",
      "dependencies": ["Core"]
    }
    ```

### 2.2 `coverage.json`
*   **Purpose**: Mapped checklist of contract types and jurisdictions supported by the domain.
*   **Required Fields**: `domain`, `supportedDocuments`, `jurisdictions`, `ruleCount`, `phraseCount`, `testCount`, `coverageScore`.
*   **Validation Rules**: `ruleCount` and `phraseCount` must match the actual file counts.
*   **Schema**:
    ```json
    {
      "domain": "Assignment",
      "supportedDocuments": ["NDA", "MSA", "Lease", "SaaS"],
      "jurisdictions": ["US", "UK", "Global"],
      "ruleCount": 2,
      "phraseCount": 2,
      "testCount": 10,
      "coverageScore": 0.85
    }
    ```

### 2.3 `concept.json`
*   **Purpose**: Declares the canonical legal concepts represented by the domain.
*   **Required Fields**: `id`, `name`, `description`, `category`, `status`, `maturity`, `actions`, `phrases`, `entities`, `rules`.
*   **Validation Rules**: All IDs listed in `actions`, `phrases`, `entities`, and `rules` must exist in their respective files.
*   **Schema**:
    ```json
    {
      "id": "CONCEPT_ASSIGNMENT",
      "name": "Assignment",
      "description": "Core assignment concept.",
      "category": "Contract Clause",
      "status": "production",
      "maturity": "Verified",
      "actions": ["ACTION_ASSIGN"],
      "phrases": ["INTENT_PROHIBIT", "CONSENT_REQUIRED"],
      "entities": ["ENTITY_ASSIGNMENT_TYPE"],
      "rules": ["RULE_ASSIGNMENT_ALLOWED", "RULE_CONSENT_REQUIRED"]
    }
    ```

### 2.4 `actions.json`
*   **Purpose**: Defines the semantic verbs associated with the domain's legal operations.
*   **Required Fields**: `id`, `name`, `synonyms`, `grammar`.
*   **Validation Rules**: `grammar.constraints` must reference valid entities or concepts.
*   **Schema**:
    ```json
    [
      {
        "id": "ACTION_ASSIGN",
        "name": "Assign",
        "synonyms": ["assign", "transfer", "delegate", "convey"],
        "grammar": {
          "subject": "Party",
          "object": "Rights",
          "recipient": "Party",
          "constraints": ["ENTITY_ASSIGNMENT_TYPE"]
        }
      }
    ]
    ```

### 2.5 `objects.json`
*   **Purpose**: Declares the nouns and legal targets subject to actions.
*   **Required Fields**: `id`, `terms`.
*   **Schema**:
    ```json
    [
      {
        "id": "RIGHTS",
        "terms": ["rights", "obligations", "duties", "Agreement"]
      }
    ]
    ```

### 2.6 `entities.json`
*   **Purpose**: Specifies typed variables extracted from clauses by regex or local helpers.
*   **Required Fields**: `id`, `name`, `extractor`, `normalizer`.
*   **Schema**:
    ```json
    [
      {
        "id": "ENTITY_ASSIGNMENT_TYPE",
        "name": "Assignment Type",
        "extractor": "assignmentTypeExtractor",
        "normalizer": "assignmentTypeNormalizer"
      }
    ]
    ```

### 2.7 `intents.json`
*   **Purpose**: Defines the semantic goal or legal vector of the clause sentences.
*   **Required Fields**: `id`, `direction`, `terms`.
*   **Schema**:
    ```json
    [
      {
        "id": "INTENT_PROHIBIT",
        "direction": "negative",
        "terms": ["shall not", "may not", "cannot", "is prohibited"]
      }
    ]
    ```

### 2.8 `templates.json`
*   **Purpose**: Specifies the grammatical sequence rules matching normalization tokens.
*   **Required Fields**: `family`, `templates`.
*   **Schema**:
    ```json
    [
      {
        "family": "ASSIGNMENT_PROHIBITED",
        "templates": [
          ["PARTY", "MODAL", "INTENT_PROHIBIT", "ACTION_ASSIGN"]
        ]
      }
    ]
    ```

### 2.9 `relations.json`
*   **Purpose**: Maps directional structural relationships between actors, concepts, and objects.
*   **Required Fields**: `id`, `source`, `relationType`, `target`.
*   **Schema**:
    ```json
    [
      {
        "id": "REL_PARTY_RESTRICTION",
        "source": "PARTY",
        "relationType": "SUBJECT_TO",
        "target": "CONCEPT_ASSIGNMENT"
      }
    ]
    ```

### 2.10 `decision_tables.json`
*   **Purpose**: Evaluates boolean logical inputs to output target findings.
*   **Required Fields**: `id`, `purpose`, `inputs`, `conditions`, `outputs`.
*   **Schema**:
    ```json
    [
      {
        "id": "DT_ASSIGNMENT",
        "purpose": "Determines if consent is required for assignment.",
        "inputs": ["ASSIGNMENT_PROHIBITED", "CONSENT_REQUIRED"],
        "conditions": [
          { "match": "CONSENT_REQUIRED" }
        ],
        "outputs": [
          { "finding": "RULE_CONSENT_REQUIRED", "legal_effect": "RESTRICTION" }
        ]
      }
    ]
    ```

### 2.11 `rules.json`
*   **Purpose**: Defines declarative evaluation checks executed by the predicate engine.
*   **Required Fields**: `id`, `concept`, `name`, `category`, `severity`, `rationale`, `recommendation`, `legal_effect`, `when`, `then`.
*   **Schema**:
    ```json
    [
      {
        "id": "RULE_CONSENT_REQUIRED",
        "concept": "CONCEPT_ASSIGNMENT",
        "name": "Consent Required",
        "category": "Risk",
        "severity": "Medium",
        "rationale": "Protects counterparty from unauthorized assignee relationships.",
        "recommendation": "Request written consent prior to assignment.",
        "legal_effect": "RESTRICTION",
        "when": {
          "all": [
            { "type": "conceptExists", "value": "CONCEPT_ASSIGNMENT" }
          ]
        },
        "then": {
          "type": "createFinding",
          "findingType": "AssignmentConsentRequired"
        }
      }
    ]
    ```

### 2.12 `tests/regression_tests.json` & `tests/mutation_tests.json`
*   **Purpose**: Declares verification test cases and grammar mutations to validate the domain logic.
*   **Required Fields**: `id`, `text` (or `mutation`), `type`, `expects`.
*   **Schema**:
    ```json
    [
      {
        "id": "TEST_ASSIGNMENT_01",
        "text": "Neither party may assign this Agreement without consent.",
        "type": "Positive",
        "expects": "RULE_CONSENT_REQUIRED"
      }
    ]
    ```

---

## 3. Cross-file Validation Rules

The compiler and linter must enforce the following deterministic cross-file constraints:

1.  **No Orphan Concepts**: Every concept ID in `concept.json` must be referenced in at least one item in `rules.json` or `decision_tables.json`.
2.  **No Orphan Phrases**: Every template family in `templates.json` and intent in `intents.json` must be mapped in `decision_tables.json` inputs or `rules.json` logic.
3.  **Concept Reference Validity**: Every rule inside `rules.json` must specify a `concept` that is declared in `concept.json`.
4.  **Linguistic Verb Integrity**: Any verb reference in `templates.json` or rule conditions must match an action defined in `actions.json`.
5.  **Global ID Uniqueness**: No two files across the entire repository may share the same `id`.
6.  **Acyclic Ontology Check**: Relationships declared in `relations.json` must not form circular references (e.g., `A ➔ relatesTo ➔ B ➔ relatesTo ➔ A`).
7.  **Referential Integrity**: Any target ID listed in `relations.json` or `concept.json` lists must exist in the workspace graph.
8.  **Test Coverage Completeness**: Every rule in `rules.json` must have at least one positive test case and one negative test case in the test files.

---

## 4. Domain Completion Checklist

Before merging any legal domain branch into master, the author must verify that:

- [ ] **Metadata Validated**: `metadata.json` is populated and lists correct dependencies.
- [ ] **Ontology Completed**: Concepts, actions, objects, and entities are declared.
- [ ] **Templates Checked**: Sentence templates in `templates.json` use valid token sequences.
- [ ] **Rules Complied**: `rules.json` parses cleanly with `RuleCompiler` and registers in `RuleRegistry`.
- [ ] **Decision Tables Verified**: Inputs and output findings map cleanly, with no unreachable conditions.
- [ ] **Linter Passed**: Running `KnowledgeLinter` reports `0 Errors` and `0 Warnings`.
- [ ] **Regression Suite Green**: Running `npm test` matches 100% of outputs against `expected.json`.
- [ ] **Benchmarks Validated**: Accuracy scores on domain benchmark documents meet target thresholds.
- [ ] **Coverage Updated**: `coverage.json` is updated with accurate counts and document profiles.

---

## 5. Knowledge Quality Metrics

The quality of the authored domain is measured by the following metrics:

### 5.1 Ontology Completeness
*   **Measurement**: `(Mapped Vocabulary Terms) / (Total Unique Terms in Domain Corpus)`
*   **Target**: `> 90%` of common verbs/nouns mapped to actors, actions, and objects.

### 5.2 Rule Completeness
*   **Measurement**: `(Implemented Rules) / (Common Industry Risks Identified in Domain Playbook)`
*   **Target**: `100%` of playbook risks must have corresponding rules.

### 5.3 Phrase Coverage
*   **Measurement**: `(Matched Sentences) / (Total Sourced Clauses for Domain)`
*   **Target**: `> 95%` matching rate on representative SEC EDGAR clauses.

### 5.4 Decision Table Coverage
*   **Measurement**: `(Uniquely Evaluated Input Permutations) / (Total Possible Input Permutations)`
*   **Target**: `100%` coverage of logical states.

### 5.5 Benchmark Accuracy
*   **Measurement**: `(Correct Field Extractions) / (Total Fields in expected.json)`
*   **Target**: `> 98%` field-level accuracy on benchmark documents.

### 5.6 False Positives / False Negatives
*   **Measurement**: Counted via the mutation test suite (`mutation_tests.json`) and benchmark logs.
*   **Target**: `0` false positives on negative control texts.

---

## 6. Promotion Workflow

Domains move through five progressive promotion levels:

```
  Draft ➔ Validated ➔ Regression Passed ➔ Benchmark Passed ➔ Production
```

| Promotion Stage | Entrance Criteria | Verification Step |
| --- | --- | --- |
| **Draft** | Initial files created; concept and metadata JSON templates defined. | Git commit to local feature branch. |
| **Validated** | 100% syntax compliance; no missing fields or schema errors. | `KnowledgeLinter` run returns 0 errors. |
| **Regression Passed** | Domain-level mutation tests and mock integration tests pass. | Test suite execution via local test command. |
| **Benchmark Passed** | Extraction accuracy exceeds threshold on benchmark files. | `npm run benchmark` (`run-benchmark-pipelineB.mjs`) passes against the checked-in baseline. |
| **Production** | Code review approved; compiled into main bundle asset. | Merge to master; `knowledge.bundle.json` compiled. |

---

## 7. Contributor Guide: Creating a Domain

Follow this standard operating procedure (SOP) to write a new legal domain from scratch (e.g., adding `Warranty`):

### Step 1: Initialize Domain Directory
Create a folder inside the knowledge source domains path:
```bash
mkdir -p knowledge/source/domains/Warranty/tests
```

### Step 2: Author Metadata & Concept
Write `metadata.json` and `concept.json`. Declare the primary concept ID (e.g., `CONCEPT_WARRANTY`) and specify dependencies (usually `Core`).

### Step 3: Populate Vocabulary Dictionaries
Write the semantic tokens:
1.  **actors.json**: Identify who warrants (e.g. `PARTY_SENDER`).
2.  **actions.json**: Add verbs (e.g., `ACTION_WARRANT` with synonyms "warrant", "represent", "guarantee").
3.  **objects.json**: Add targets (e.g., `SERVICES`, `GOODS`, `SOFTWARE`).

### Step 4: Map Phrases & Grammar
Define sentence patterns:
1.  **intents.json**: Declare semantic intents (e.g. `INTENT_WARRANTY_DISCLAIMER` with terms "as is", "disclaims all warranties").
2.  **templates.json**: Establish sequence matchers (e.g., `["PARTY", "INTENT_WARRANTY_DISCLAIMER", "OBJECT"]`).

### Step 5: Write Rules & Decision Tables
1.  **rules.json**: Implement logic checks (e.g. `RULE_WARRANTY_DISCLAIMER_PRESENT`, category `Risk`, severity `Medium`).
2.  **decision_tables.json**: Set up mappings from matching templates to rules.

### Step 6: Create Verification Tests
Add positive and negative text clauses to `tests/regression_tests.json`. Run the validation and linting commands:
```bash
node tools/knowledge-compiler/knowledge_compiler.js
npm test
```
Verify that the domain compiles cleanly and registers in the compiled knowledge bundle.
