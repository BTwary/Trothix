# Trothix System Architecture

This document describes key architectural concepts, manifest files, and compiler systems in the Trothix platform.

## 1. Compiler Systems

To avoid confusion between components with similar names:

*   **Knowledge Compiler** (`archive/knowledge/compiler/compiler.js`, formerly `knowledge/build/compiler/compiler.js`):
    *   **Role**: Offline build-time tool for a separate, orphaned knowledge-authoring pipeline (Pipeline E) — its output was never wired into `KnowledgeProvider`, which reads `assets/js/engine/knowledge/v1/domains/*` directly. The whole `knowledge/` tree has since been moved under `archive/knowledge/`; see `docs/trothix-architecture-audit.md` section 1.5.
    *   **Responsibility**: Takes raw/normalized atomic domain vocabulary files (actors, templates, states, events, etc.) and compiles them into decision tables, state transitions, and mutation tests for the bundled knowledge asset.
    *   **Execution**: Not runnable as documented — the entry point (`knowledge/build/build.js`) no longer exists at that path; the tree is preserved at `archive/knowledge/build/build.js` for historical reference only.
*   **Rule Compiler** (`assets/js/engine/rules/RuleCompiler.js`):
    *   **Role**: Runtime evaluation engine.
    *   **Responsibility**: Takes declarative rule definitions (the `when` and `then` blocks) and compiles them in-memory into executable JavaScript predicate functions at engine runtime.
    *   **Execution**: Called dynamically by `KnowledgeProvider` and `RuleRegistry` during the initialization of the runtime engine.

## 2. Manifest Responsibilities

The Trothix system maintains three distinct manifests, each serving a specific lifecycle stage. Only the Runtime Manifest is part of the live production path; the other two belong to the orphaned knowledge-authoring pipeline (Pipeline E, now under `archive/knowledge/` — see section 1 above).

1.  **Source Manifest** (`archive/knowledge/manifest.json`, formerly `knowledge/manifest.json`):
    *   **Responsibility**: Defines the source configuration metadata.
    *   **Contents**: Mapped list of active source domains under development, source version, and compilation targets.
2.  **Compiled Manifest** (`archive/knowledge/compiled/manifest.json`, formerly `knowledge/compiled/manifest.json`):
    *   **Responsibility**: Captures the output of the offline build pipeline.
    *   **Contents**: Compilation timestamp, target knowledge version, total compiled domains, and build verification metrics.
3.  **Runtime Manifest** (`assets/js/engine/knowledge/v1/manifest.json`) — **live, part of the production path**:
    *   **Responsibility**: Governs runtime behavior for the engine.
    *   **Contents**: Active engine-supported domains, version constraints, ontology schema levels, and supported document types (NDA, Lease, MSA, SaaS).
