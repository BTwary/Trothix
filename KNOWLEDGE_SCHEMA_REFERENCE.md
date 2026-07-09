# Trothix Knowledge Schema Reference

This document serves as the canonical schema specification for all declarative JSON files used within Trothix knowledge domains.

---

## 1. Schema Specifications

### 1.1 `actions.json`
*   `[Repository Evidence]` Defines semantic verbs and actions.
*   *Purpose*: Maps verb synonyms to canonical actions.
*   *Required Fields*: `id`, `name`, `synonyms`.
*   *Optional Fields*: `grammar` (specifying subject, object, constraints).
*   *Cross References*: Concept nodes (`concept.json`) list action IDs in their `actions` arrays.
*   *Compiler Usage*: Used by `resolveActionSynonym` during trace evaluations.
*   *Example*:
    ```json
    [
      {
        "id": "ACTION_ASSIGN",
        "name": "Assign",
        "synonyms": ["assign", "transfer", "delegate"]
      }
    ]
    ```

---

### 1.2 `concept.json`
*   `[Repository Evidence]` Declares core domain concepts.
*   *Purpose*: Forms the nodes of the ontology graph.
*   *Required Fields*: `id`, `name`, `description`, `category`.
*   *Optional Fields*: `status`, `maturity`, `actions`, `phrases`, `entities`, `rules`.
*   *Cross References*: Rules in `rules.json` specify target concept IDs in their `concept` field.
*   *Compiler Usage*: Registered as in-memory nodes inside `KnowledgeProvider.js`'s graph maps.
*   *Example*:
    ```json
    {
      "id": "CONCEPT_ASSIGNMENT",
      "name": "Assignment",
      "description": "Core assignment transfer concepts.",
      "category": "Contract Clause"
    }
    ```

---

### 1.3 `metadata.json`
*   `[Repository Evidence]` Domain registry configuration.
*   *Purpose*: Lists ownership, version, and dependencies.
*   *Required Fields*: `source`, `documentType`, `jurisdiction`, `industry`, `clauseType`, `language`, `reviewStatus`.
*   *Optional Fields*: `dependencies`, `version`.
*   *Cross References*: Used by compiler dependencies manager.
*   *Compiler Usage*: Loaded during bundle creation.
*   *Example*:
    ```json
    {
      "source": "SEC EDGAR",
      "documentType": "Mutual NDA",
      "jurisdiction": "US",
      "industry": "Technology",
      "clauseType": "Assignment"
    }
    ```

---

### 1.4 `rules.json`
*   `[Repository Evidence]` Predicate logic constraints.
*   *Purpose*: Emits risk findings.
*   *Required Fields*: `id`, `concept`, `category`, `severity`, `rationale`, `recommendation`, `legal_effect`, `status`.
*   *Optional Fields*: `linkedTests`, `targetPrecision`, `targetRecall`.
*   *Cross References*: Maps to a target `concept` node.
*   *Compiler Usage*: Evaluated by `RuleRegistry.js` and `RuleCompiler.js`.
*   *Example*:
    ```json
    [
      {
        "id": "RULE_CONSENT_REQUIRED",
        "concept": "CONCEPT_ASSIGNMENT",
        "category": "Risk",
        "severity": "Medium",
        "rationale": "Protects relationship boundaries.",
        "recommendation": "Require prior written consent.",
        "legal_effect": "RESTRICTION",
        "status": "Verified",
        "linkedTests": []
      }
    ]
    ```

---

### 1.5 `templates.json`
*   `[Repository Evidence]` Grammar match sequences.
*   *Purpose*: Maps token sequences to matched categories.
*   *Required Fields*: `family`, `templates`.
*   *Optional Fields*: None.
*   *Cross References*: Mapped as inputs in `decision_tables.json`.
*   *Compiler Usage*: Used by normalizer and compiler.
*   *Example*:
    ```json
    [
      {
        "family": "ASSIGNMENT_PROHIBITED",
        "templates": [
          ["PARTY", "MODAL", "INTENT_PROHIBIT", "ASSIGNMENT"]
        ]
      }
    ]
    ```

---

### 1.6 `decision_tables.json`
*   `[Repository Evidence]` Logical evaluation tables.
*   *Purpose*: Resolves combination matches to rule findings.
*   *Required Fields*: `id`, `purpose`, `inputs`, `conditions`, `outputs`.
*   *Optional Fields*: None.
*   *Cross References*: Rules matching output findings must exist.
*   *Compiler Usage*: Maps matching outcomes.
*   *Example*:
    ```json
    [
      {
        "id": "DT_ASSIGNMENT",
        "purpose": "Consent validation.",
        "inputs": ["ASSIGNMENT_PROHIBITED", "CONSENT_REQUIRED"],
        "conditions": [{ "match": "CONSENT_REQUIRED" }],
        "outputs": [{ "finding": "RULE_CONSENT_REQUIRED", "legal_effect": "RESTRICTION" }]
      }
    ]
    ```

---

### 1.7 `relations.json`
*   `[Repository Evidence]` Directional graph edges.
*   *Purpose*: Establishes relations between nodes in the workspace graph.
*   *Required Fields*: `id`, `source`, `relationType`, `target`.
*   *Optional Fields*: None.
*   *Cross References*: Source and target IDs must exist.
*   *Compiler Usage*: Loaded as edges inside the KnowledgeProvider graph.
*   *Example*:
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

---

### 1.8 `coverage.json`
*   `[Repository Evidence]` Coverage metrics declaration.
*   *Purpose*: Identifies supported documents and targeted coverage levels.
*   *Required Fields*: `domain`, `supportedDocuments`, `jurisdictions`.
*   *Optional Fields*: `ruleCount`, `phraseCount`, `testCount`, `coverageScore`.
*   *Cross References*: Maps supported document types.
*   *Compiler Usage*: Compiled by coverage analyzer tools.
*   *Example*:
    ```json
    {
      "domain": "Assignment",
      "supportedDocuments": ["NDA", "MSA"],
      "jurisdictions": ["US", "Global"]
    }
    ```

---

### 1.9 `entities.json`
*   `[Repository Evidence]` Variable extraction definitions.
*   *Purpose*: Maps extraction triggers.
*   *Required Fields*: `id`, `name`, `extractor`, `normalizer`.
*   *Optional Fields*: None.
*   *Cross References*: Mapped as inputs.
*   *Compiler Usage*: Mapped to parser.
*   *Example*:
    ```json
    [
      {
        "id": "ENTITY_MONEY",
        "name": "Money amount",
        "extractor": "regexMoney",
        "normalizer": "parseUSD"
      }
    ]
    ```

---

## 2. Maintenance Recommendations

*   `[Knowledge Recommendation]` Audit schema files during CI builds to ensure format correctness.
*   `[Future Tooling]` Create JSON Schema files (e.g. `rule.schema.json`) to enable IDE autocomplete and offline validations.
*   `[Architecture Change Request]` None. Document schemas guide formatting only, leaving the compiler engine frozen.
