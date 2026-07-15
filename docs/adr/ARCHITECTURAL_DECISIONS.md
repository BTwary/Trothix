# Architectural Decisions Log

This document records the major architectural decisions for the Trothix platform.

---

## ADR-001: Engine Freeze Policy

### Context
Frequent architectural changes to parser, lexer, compiler, and evaluator engines during development introduced regressions in pre-existing legal domains.

### Decision
Freeze all core engine files under `/assets/js/engine/` (Parser, Lexer, RuleCompiler, RuleEvaluator, KnowledgeProvider). All future legal domain additions and updates must be executed solely within the knowledge layer (concept, action, phrase, and rule JSON files).

### Rationale
Ensures 100% deterministic stability for existing domains while allowing rapid expansion of legal knowledge without risk of code side-effects.

---

## ADR-002: Knowledge-First Architecture

### Context
Standard legal AI models are non-deterministic. A rule engine needs structured, deterministic concept mappings.

### Decision
Extract and compile legal concepts and actions from the document text using a semantic graph ontology (`concept.json`, `actions.json`, `phrases.json`) prior to rule evaluation.

### Rationale
Provides explainable, deterministic results with exact evidence text spans instead of black-box heuristics.

---

## ADR-003: Public Knowledge API Boundary

### Context
The `RuleCompiler` previously queried internal graph storage (`.graph.nodes`), creating tight coupling.

### Decision
Expose a public, stable API boundary on `KnowledgeProvider` (`hasConcept`, `getPhrasesForConcept`, etc.) and refactor the compiler to consume only these methods.

### Rationale
Protects graph traversal logic and allows future storage optimization without changing compiler internals.
