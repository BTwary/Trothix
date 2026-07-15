# Trothix Rule Engine — Walkthrough

Factual status of the deterministic rule pipeline as of Enterprise Hardening Sprint 1. This documents the repository routing mechanics, validated via offline diagnostics.

---

## 1. Rule Routing & Compilation Pipeline

1.  `KnowledgeProvider` recursively scans every JSON domain file under `assets/js/engine/knowledge/v1/domains/**`.
2.  **Structural Capability Routing**: Each loaded entry with an `id` is routed based on its structure via `isExecutableRule()` (`RuleCapability.js`).
    *   If an entry has both `when` and `then` blocks, it is routed to `RuleRegistry.compileRule()`.
    *   If it does not have both properties, it is treated as declarative ontology data: `REL_`-prefixed entries are loaded as graph edges, and all other entries are stored as generic ontology nodes in the graph.
    *   *Repository Evidence*: This structure-driven routing resolves the prefix naming bug (issue #4) where fully-formed rules that used a `CONCEPT_` id were previously excluded from rule compilation.
3.  `RuleCompiler.compileRule()` translates the `when`/`then` shape into executable predicates. The compiler handles logical operators (`and`, `or`, `not`, `all`, `any`) and field-based leaves. Unrecognized leaf condition shapes compile into predicates that never evaluate true (without throwing).
4.  **Encapsulated State Consumption**: RuleDiagnostics consumes repository state through the public `getRawEntries()` accessor (intended for read-only diagnostics consumption). The production runtime owns the repository state, diagnostics consume it, and diagnostics never extend or modify runtime state.

---

## 2. Rule Diagnostics Live Status

> [!NOTE]
> **Static Snapshot Notification**: The rule counts and classifications listed below represent a validated snapshot of the repository state as of **July 8, 2026**. Adding or modifying domain files will change these numbers. To generate the live, authoritative statistics for the current repository state, run the diagnostics tool directly:
> 
> ```bash
> node test_ruleDiagnostics.mjs
> ```

### Historical Snapshot (July 8, 2026)
*   **Total Rules Considered**: 31
*   **Compiled Active**: 1
    *   `RULE_PAYMENT_DEADLINE_LONG` (Payment domain) — compiles successfully, and all referenced fields are populated in the Legal IR pipeline.
*   **Compiled Inert**: 16
    *   12 Indemnification/Liability CONCEPT_-prefixed rules: These rules are successfully routed to the compiler now, but contain unrecognized condition shapes (such as `{type: "conceptExists"}`) that compile into predicates that never evaluate true (issue #5).
    *   4 Force Majeure rules: These rules compile successfully but reference unverified fields (such as `extractedData.hasForceMajeure`) that are not present in the IR field registry.
*   **Failed**: 14
    *   14 rules across Assignment, Confidentiality, Definitions, GoverningLaw, IntellectualProperty, Lifecycle, and Notice are declarative knowledge-concept entries (they have concept rationale/recommendations but no condition logic). These are correctly identified as missing compilation prerequisites.

---

## 3. Remaining Limitations & Recommendations

*   **Unrecognized Condition Shapes**: Resolving the 12 inert Indemnification/Liability rules requires either extending `RuleCompiler` to support `conceptExists` and `documentRequiresConcept` condition types, or rewriting the rules to match the existing field/operator syntax.
*   **Unverified/Inert Fields**: The 4 Force Majeure rules require the Legal IR pipeline to be updated to populate their referenced fields, or the rule conditions to be aligned with existing active fields.
*   **Ontology Duplication**: Seven ontology ids (such as `PARTY_SENDER`) are declared in multiple files. This is resolved by last-in-wins map assignment, but load order is not contractually guaranteed. It is recommended to centralize shared ontology nodes.

---

## 4. Benchmark Live Accuracy

> [!NOTE]
> **Static Snapshot Notification**: The benchmark metrics listed below represent a validated snapshot of the repository state as of **July 8, 2026**, taken with the since-retired Pipeline C harness (`archive/benchmark/run-benchmark.mjs`, formerly `benchmark/run-benchmark.mjs`). Future modifications or addition of new files will change these results, and the live benchmark now uses a different scoring model — see `benchmark/README.md`. To run the current benchmark suite and obtain up-to-date metrics:
> 
> ```bash
> npm run benchmark
> ```

### Historical Snapshot (July 8, 2026)
*   **Documents Tested**: 15 (NDA, Lease, and TOS domains)
*   **Field-Level Accuracy**: 93/93 checks passed (100.0%)
*   **Regressions**: 0

