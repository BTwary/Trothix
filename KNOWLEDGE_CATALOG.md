# Trothix Knowledge Catalog & Status Report

This document serves as the master status report and registry of legal capabilities for the Trothix platform. It describes domain statuses, platform maturity, roadmaps, and technical risks.

---

## 1. Capability Registry

An overview of active, draft, helper, and proposed domains:

| Domain | Status | Maturity | Priority | Dependencies | Expected Deterministic Capability |
| --- | --- | --- | --- | --- | --- |
| **Confidentiality** | Included in production manifest | Production | Active | `Core` | Enforces non-disclosure obligations. |
| **Notice** | Included in production manifest | Production | Active | `Core` | Verifies acceptable notice methods and addresses. |
| **Payment** | Included in production manifest | Legacy | Active | `Core` | Identifies payment cycles and late fee limits. |
| **Termination** | Included in production manifest | Production | Active | `Notice` | Identifies notice timelines to exit or renew agreements. |
| **Liability** | Included in production manifest | Legacy | Active | `Core` | Extracts cash caps and flags unilateral liability. |
| **Indemnification** | Included in production manifest | Legacy | Active | `Core` | Resolves legal defense allocations for breaches. |
| **Assignment** | Excluded from manifest (Draft) | Draft | High | `Core` | Checks prior consent requirements for obligations transfers. |
| **Definitions** | Excluded from manifest (Draft) | Draft | High | `Notice` (Defect)| Audits capitalized terms presence and definitions. |
| **GoverningLaw** | Excluded from manifest (Draft) | Draft | Medium | `Core` | Extracts jurisdictions and exclusive venues. |
| **Lifecycle** | Excluded from manifest (Draft) | Draft | Medium | `Notice` | Tracks contract stages and transition legality. |
| **IntellectualProperty**| Excluded from manifest (Draft) | Draft | Medium | `Core` | Asserts work product ownership and transfer terms. |
| **Core** | Helper domain | Production | Active | None | Base grammar connectives and variables. |
| **Warranty** | Excluded from manifest (Draft) | Draft | High | `Core` | Extracts product warranties and flags disclaimers. |
| **ForceMajeure** | Excluded from manifest (Draft) | Draft | High | `Lifecycle`, `Termination`| Excuses performance delays and delay termination caps. |
| **AuditRights** | Proposed (Placeholder) | Proposed | Medium | `Notice`, `Payment` | Flags unlimited audit frequencies. |
| **ServiceLevel** | Proposed (Placeholder) | Proposed | Medium | `Payment`, `Lifecycle` | Verifies uptime SLAs and credit claims. |
| **Insurance** | Proposed (Placeholder) | Proposed | Low | `Liability`, `Core` | Verifies vendor commercial policy requirements. |

---

## 2. Platform Maturity Audit

### 2.1 Strengths
*   `[Repository Evidence]` **Deterministic Execution**: Knowledge execution routes entirely via compiled JSON rules, preventing runtime AI hallucinations.
*   `[Repository Evidence]` **Graph Traversal**: The KnowledgeProvider maps concepts and relationships as an in-memory directed graph, allowing fast $O(1)$ node lookups.
*   `[Repository Evidence]` **Comprehensive Benchmark Suite**: Native benchmark script (`run-benchmark.mjs`) tests 13 multi-domain files with 100% accuracy.

### 2.2 Weaknesses & Gaps
*   `[Repository Evidence]` **Hardcoded Values inside JavaScript Rules**: `universalRules.js` contains hardcoded checks (e.g., checking if payment terms exceed 60 days directly in code: `data.paymentTermsDays > 60` or notice check `data.terminationNoticeDays < 15`).
*   `[Repository Evidence]` **Cross-Domain Reference Defect**: `Definitions/rules.json` references `"concept": "NOTICE"`, violating domain isolation boundaries.
*   `[Repository Evidence]` **Mocked Testing Traces**: Integration tests print mock console outputs and return hardcoded JSON trace objects.

---

## 3. Engineering Roadmaps

### 3.1 Immediate Priority (Next Sprint)
*   `[Knowledge Recommendation]` Resolve the `Definitions` cross-domain concept defect by declaring `CONCEPT_DEFINITIONS` locally.
*   `[Knowledge Recommendation]` Activate draft domains (`Assignment`, `Definitions`, `Notice`) inside the production bundle manifest.

### 3.2 Medium-Term Roadmap
*   `[Knowledge Recommendation]` Migrate hardcoded logic from `universalRules.js` and `leaseRules.js` to declarative rule parameters.

### 3.3 Long-Term Roadmap
*   `[Future Tooling]` Create offline linter tools to perform dead-rule detection, circular reference cycle validations, and metrics reporting before compilation.
*   `[Future Tooling]` Create a validation dashboard checking compiled bundle stats dynamically.

---

## 4. Technical Risks

*   **Engineering Risks**:
    *   *Maintanance overhead*: Bypassing declarative rules to write custom logic in JavaScript files introduces regression risks and dilutes parser determinism.
*   **Knowledge Risks**:
    *   *Coupled graphs*: Orphan nodes or circular relations in domain files can cause check failures during manifest load checks.

---

## 5. Maintenance Recommendations

*   `[Knowledge Recommendation]` Audit domain support statuses weekly to track capability changes.
*   `[Future Tooling]` Automate the generation of this catalog from active manifest and concept data.
*   `[Architecture Change Request]` None. Catalog reviews represent metadata documentation and keep the core compiler frozen.
