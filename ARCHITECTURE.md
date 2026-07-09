# Trothix System Architecture

This document describes key architectural concepts, manifest files, and compiler systems in the Trothix platform.

## 1. Compiler Systems

To avoid confusion between components with similar names:

*   **Knowledge Compiler** (`knowledge/build/compiler/compiler.js`):
    *   **Role**: Offline build-time tool.
    *   **Responsibility**: Takes raw/normalized atomic domain vocabulary files (actors, templates, states, events, etc.) and compiles them into decision tables, state transitions, and mutation tests for the bundled knowledge asset.
    *   **Execution**: Triggered via `node knowledge/build/build.js` as part of the offline compilation pipeline.
*   **Rule Compiler** (`assets/js/engine/rules/RuleCompiler.js`):
    *   **Role**: Runtime evaluation engine.
    *   **Responsibility**: Takes declarative rule definitions (the `when` and `then` blocks) and compiles them in-memory into executable JavaScript predicate functions at engine runtime.
    *   **Execution**: Called dynamically by `KnowledgeProvider` and `RuleRegistry` during the initialization of the runtime engine.

## 2. Manifest Responsibilities

The Trothix system maintains three distinct manifests, each serving a specific lifecycle stage:

1.  **Source Manifest** (`knowledge/manifest.json`):
    *   **Responsibility**: Defines the source configuration metadata.
    *   **Contents**: Mapped list of active source domains under development, source version, and compilation targets.
2.  **Compiled Manifest** (`knowledge/compiled/manifest.json`):
    *   **Responsibility**: Captures the output of the offline build pipeline.
    *   **Contents**: Compilation timestamp, target knowledge version, total compiled domains, and build verification metrics.
3.  **Runtime Manifest** (`assets/js/engine/knowledge/v1/manifest.json`):
    *   **Responsibility**: Governs runtime behavior for the engine.
    *   **Contents**: Active engine-supported domains, version constraints, ontology schema levels, and supported document types (NDA, Lease, MSA, SaaS).
