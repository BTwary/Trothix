# Knowledge Acquisition Phase

This document defines the overarching vision and methodology for expanding the legal intelligence of Trothix. The runtime architecture is frozen. The compiler architecture is frozen. All future intelligence is acquired through structured knowledge.

## The Objective
The objective is no longer writing code. The objective is teaching Trothix legal reasoning through structured knowledge.

## Core Directives
1. **The Runtime extracts facts.**
2. **The Knowledge Build System compiles knowledge.**
3. **The Decision System evaluates facts.**
4. **The Assessment Layer produces findings.**
5. **AI (optional) only explains deterministic results.**

No legal intelligence may exist inside executable JavaScript.

## Real Clause Acquisition Workflow: The 15-Stage Pipeline
We ingest real-world clauses and deconstruct them into canonical families.

1. **Clause Provenance:** Attach immutable metadata (`knowledgeFingerprint`, `SEC EDGAR`, etc).
2. **Clause Classification:** Determine Document Type, Clause Type, Primary/Secondary Concepts, and Legal Effect.
3. **Atomic Decomposition:** Extract deterministic atoms (Actors, Objects, Intents, Negations, Exceptions, Modals).
4. **Canonical Knowledge Mapping:** Map wording to canonical intent (e.g. `hold in strict confidence` -> `INTENT_KEEP_SECRET`).
5. **Template Families:** Group templates into reusable families (e.g. `CONFIDENTIALITY_OBLIGATION`).
6. **Semantic Normalization:** Normalize strings before matching (`shall` -> `MANDATORY`, `30 Days` -> `TIME_30_DAY`).
7. **Decision Mapping:** Reuse or create decision tables with explicit `legal_effect` and `decision_trace`.
8. **Rule Mapping:** Create or extend rules enforcing capability targets (`targetPrecision`, `targetRecall`).
9. **Regression Suite:** Generate Positive, Negative, Edge, Mutation, Inverse, and Real Clause tests.
10. **Knowledge Validation:** Execute the 8-stage Knowledge Build System.
11. **Runtime Verification:** Execute the REAL runtime engine using the compiled bundle to guarantee traceability. No mocked outputs.
12. **Knowledge Acquisition Report:** Generate `knowledge-acquisition-report.md`.
13. **Knowledge Delta:** Generate `knowledge_delta.json`.
14. **Knowledge Statistics:** Update historical statistics.
15. **Acquisition Review:** Verify if capability coverage measurably increased.

## Knowledge Quality Rules
Every concept and rule must adhere to strict schemas.

**Concepts Must Define:**
- purpose, legal meaning, dependencies, related concepts, conflicting concepts, required capabilities, supported jurisdictions, supported documents, maturity.

**Rules Must Define:**
- id, concept, category, severity, jurisdiction, documents, rationale, evidence, decision_trace, recommendation, confidence_target, introduced, reviewedBy, status, linkedTests, legal_effect, targetPrecision, targetRecall.

## Capability Driven Development
No feature may enter production unless it demonstrably improves at least one of the 6 core capabilities:
- **Recognition**
- **Extraction**
- **Reasoning**
- **Negotiation**
- **Scoring**
- **Narration**
