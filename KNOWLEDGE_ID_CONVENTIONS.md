# Trothix Knowledge ID Conventions

This document establishes the canonical naming conventions and ID prefixes for all elements of the declarative knowledge base. Adhering to these prefixes prevents name collisions during bundle linking.

---

## 1. ID Prefix Specifications

### 1.1 `RULE_`
*   `[Repository Evidence]` Identifies logic nodes processed by the predicate rule engine.
*   *Ownership*: Domain namespace (e.g. `RULE_CONSENT_REQUIRED`).
*   *Uniqueness*: Globally unique across the entire compiled bundle. Checked by linter.
*   *Lifecycle*: Created in `rules.json`, progresses from Draft to Production.
*   *Compiler Expectations*: Stored inside `RuleRegistry` and compiled into executable predicates.
*   *Cross References*: Mapped as outcomes in `decision_tables.json` files.

### 1.2 `ACTION_`
*   `[Repository Evidence]` Represents semantic verbs in the domain vocabulary.
*   *Ownership*: Shared core vocabulary or domain local.
*   *Uniqueness*: Globally unique to prevent synonym collisions in resolver maps.
*   *Lifecycle*: Defined in `actions.json`.
*   *Compiler Expectations*: Loaded into the `nodes` Map and parsed for lexical matches by `resolveActionSynonym`.
*   *Cross References*: Referenced by concept nodes (`concept.json`) and sequence templates.

### 1.3 `ENTITY_`
*   `[Repository Evidence]` Identifies variables extracted from text.
*   *Ownership*: Core or domain namespace.
*   *Uniqueness*: Globally unique to prevent mapping collisions.
*   *Lifecycle*: Defined in `entities.json`.
*   *Compiler Expectations*: Registered as variables in the resolution graph.
*   *Cross References*: Mapped in templates and rules.

### 1.4 `STATE_`
*   `[Repository Evidence]` Defines a stage within a contract lifecycle.
*   *Ownership*: `Lifecycle` domain.
*   *Uniqueness*: Unique to the lifecycle state machine.
*   *Lifecycle*: Declared in `states.json` within Lifecycle.
*   *Compiler Expectations*: Checked in transition preconditions.
*   *Cross References*: Transitions map `from` and `to` states.

### 1.5 `EVENT_`
*   `[Repository Evidence]` Triggers representing action execution.
*   *Ownership*: Core or Lifecycle domains.
*   *Uniqueness*: Globally unique.
*   *Lifecycle*: Declared in `events.json`.
*   *Compiler Expectations*: Used as trigger keys in state transition tables.
*   *Cross References*: Associated with rules or templates.

### 1.6 `CONCEPT_`
*   `[Repository Evidence]` Represents high-level legal ideas.
*   *Ownership*: Domain namespace (e.g. `CONCEPT_LIABILITY`).
*   *Uniqueness*: Globally unique. Identifies ontology categories.
*   *Lifecycle*: Created in `concept.json`.
*   *Compiler Expectations*: Mapped as primary keys in the provider graph nodes registry.
*   *Cross References*: Concept rules and tables link directly to these IDs.

### 1.7 `REL_`
*   `[Repository Evidence]` Establishes directional relationships.
*   *Ownership*: Domain namespace (e.g. `REL_PARTY_RESTRICTION`).
*   *Uniqueness*: Globally unique edge identifiers.
*   *Lifecycle*: Defined in `relations.json`.
*   *Compiler Expectations*: Compiled as directed edges in the ontology graph.
*   *Cross References*: Connects two existing node IDs.

### 1.8 `PHRASE_`
*   `[Repository Evidence]` Identifies specific linguistic match keys.
*   *Ownership*: Domain namespace.
*   *Uniqueness*: Globally unique.
*   *Lifecycle*: Defined in `phrases.json` (e.g. `PHRASE_LIABILITY_MARKER`).
*   *Compiler Expectations*: Used by matcher lists.
*   *Cross References*: Mapped inside concepts.

### 1.9 `TPL_` or `TEMPLATE_`
*   `[Repository Evidence]` Defines structural sentence grammar sequences.
*   *Ownership*: Domain namespace.
*   *Uniqueness*: Unique within domain `templates.json`.
*   *Lifecycle*: Defined in templates array.
*   *Compiler Expectations*: Used to match parsed tokens.
*   *Cross References*: Matches map to decision table inputs.

### 1.10 `INTENT_`
*   `[Repository Evidence]` Semantic target direction of statements.
*   *Ownership*: Domain or Core namespace.
*   *Uniqueness*: Globally unique intent categories.
*   *Lifecycle*: Created in `intents.json`.
*   *Compiler Expectations*: Maps synonyms list to intent vectors.
*   *Cross References*: Referenced by templates.

### 1.11 `DOC_`
*   `[Repository Evidence]` Identifies contract types.
*   *Ownership*: Core domain.
*   *Uniqueness*: Globally unique document categories (e.g. `DOC_NDA`, `DOC_LEASE`).
*   *Lifecycle*: Created in `doc_*.json` under Core.
*   *Compiler Expectations*: Determines which rulesets run.
*   *Cross References*: Manifest supported contract list.

### 1.12 `DT_`
*   `[Repository Evidence]` Logical decision tables.
*   *Ownership*: Domain namespace.
*   *Uniqueness*: Globally unique logic arrays.
*   *Lifecycle*: Defined in `decision_tables.json`.
*   *Compiler Expectations*: Registered as execution matrices.
*   *Cross References*: Mapped templates to rules.

---

## 2. Naming Guidelines

*   `[Knowledge Recommendation]` Use ALL_CAPS snake_case for all ID declarations to match compiler regex expectations.
*   `[Future Tooling]` Create a lint script checking that all IDs in the domain match their respective prefix specifications.
*   `[Architecture Change Request]` None. These conventions match the current parser and compiler loading logic, keeping the engine code frozen.
