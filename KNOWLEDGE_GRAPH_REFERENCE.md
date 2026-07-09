# Trothix Knowledge Graph Reference

This document describes how the Trothix platform structures, loads, and resolves its internal in-memory ontology graph.

---

## 1. Graph Elements

### 1.1 Node
*   `[Repository Evidence]` A node is any singular declarative unit representing a concept, action, entity, or document.
*   *Implementation*: Nodes are loaded dynamically from domain JSON files and stored in the `this.graph.nodes` `Map` within `KnowledgeProvider.js`.
*   *Resolution*: Retrieved in $O(1)$ time complexity using `getNode(id)`.

### 1.2 Edge
*   `[Repository Evidence]` An edge represents a directional semantic relationship connecting two nodes in the graph.
*   *Implementation*: Edges are declared as relation dictionaries (ID prefix `REL_`) and stored in the `this.graph.edges` array.
*   *Resolution*: Queried by traversal scripts searching source and target matching parameters.

### 1.3 Related
*   `[Repository Evidence]` Mapped in `concept.json` inside the `related` array.
*   *Implementation*: Establishes associations between sibling concepts (e.g. `CONCEPT_PAYMENT` is related to `CONCEPT_LIABILITY`).
*   *Resolution*: Retrieved by the `getRelatedConcepts(id)` API method in `KnowledgeProvider.js`.

### 1.4 Actions
*   `[Repository Evidence]` Actions map vocabulary verbs (synonyms) to active concepts.
*   *Implementation*: Listed inside the `actions` array of a concept node.
*   *Resolution*: Validated in `_validateAndResolveGraph()` ensuring each action ID exists.

### 1.5 Rules
*   `[Repository Evidence]` Logic predicate nodes linked to active concepts.
*   *Implementation*: Listed in the `rules` array of a concept node.
*   *Resolution*: Checked during initialize to ensure every listed rule is registered in the RuleRegistry.

### 1.6 Phrases
*   `[Repository Evidence]` Mappings of templates or intents associated with a node.
*   *Implementation*: Declared in the `phrases` array of a node.
*   *Resolution*: Resolved dynamically at runtime using `getPhrases(nodeId)`.

### 1.7 Entities
*   `[Repository Evidence]` Variable extractors linked to a concept.
*   *Implementation*: Stored in the `entities` array of a concept node.
*   *Resolution*: Resolved during text processing to determine normalizer and extractor paths.

### 1.8 Documents
*   `[Repository Evidence]` Node representing a contract category (e.g. `DOC_NDA`).
*   *Implementation*: Declared in Core and mapped to expectations.
*   *Resolution*: Evaluated to determine active rulesets using `getExpectedRules(documentId)`.

### 1.9 Decision Tables
*   `[Repository Evidence]` Matrices mapping matches to rule targets.
*   *Implementation*: Loaded as nodes but compiled as logic execution blocks.
*   *Resolution*: Checked against active match outputs at trace evaluation time.

---

## 2. Dependency Graph Resolution

*   `[Repository Evidence]` When `initialize()` runs, `KnowledgeProvider.js` validates that no edges point to non-existent nodes, throwing a `Broken Reference` exception if checking fails.
*   `[Repository Evidence]` A topological dependency map (`this.graph.dependencyMap`) is built using a `Map` of `Sets` to register downstream node impacts.
*   `[Knowledge Recommendation]` Ensure all new domains declare their structural relations in `relations.json` to keep graph resolutions clean.
*   `[Future Tooling]` Create an offline cycle checker executing DFS on `dependencyMap` to block compilation of circular graphs.
*   `[Architecture Change Request]` None. The graph resolution relies entirely on the frozen KnowledgeProvider API methods.
