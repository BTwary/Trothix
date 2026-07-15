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
*   `[Repository Evidence]` **Comprehensive Benchmark Suite**: Live benchmark script (`benchmark/run-benchmark-pipelineB.mjs`, via `npm run benchmark`) validates 15 multi-domain files against a checked-in finding-id baseline.

### 2.2 Weaknesses & Gaps
*   `[Repository Evidence]` **Hardcoded Values inside JavaScript Rules**: `universalRules.js` contains hardcoded checks (e.g., checking if payment terms exceed 60 days directly in code: `data.paymentTermsDays > 60` or notice check `data.terminationNoticeDays < 15`).
*   `[Repository Evidence]` **Cross-Domain Reference Defect**: `Definitions/rules.json` references `"concept": "NOTICE"`, violating domain isolation boundaries.
*   `[Repository Evidence]` **Mocked Testing Traces**: Integration tests print mock console outputs and return hardcoded JSON trace objects.
*   `[Repository Evidence]` **Known Duplicate Knowledge IDs**: `npm run lint` reports duplicate IDs across core/domain files (e.g. `CONCEPT_LIABILITY`, `CONCEPT_PAYMENT`, `CONCEPT_TERMINATION`, `CONCEPT_INDEMNIFICATION`, `ACTION_PAY`, `ACTION_TERMINATE`, `ACTION_NOTIFY`, `EVENT_BREACH`) and, separately, cross-domain collisions between `Termination` and `Notice` (`PARTY_RECEIVER`, `PARTY_SENDER`, `NOTICE`). These are currently resolved silently at load time by `KnowledgeProvider`'s `DOMAIN_WINS` duplicate policy (core-vs-domain) or "keep first loaded" (domain-vs-domain), which is why the engine still passes all tests today. This is tracked as a real risk, not a bug: adding a new domain that reuses one of these IDs, or changing directory walk order, would silently change which definition wins with only a `console.warn` — no CI failure. Recommend an explicit dedup/rename pass (e.g. centralizing `PARTY_SENDER`/`PARTY_RECEIVER`/`NOTICE` in `Core` instead of duplicating them per-domain) as a follow-up; not done here to avoid changing knowledge-base data or load-order-dependent runtime behavior.

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
