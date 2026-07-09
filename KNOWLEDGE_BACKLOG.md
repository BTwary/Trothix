# Trothix Legal Intelligence: Knowledge Backlog

This document serves as the master engineering backlog for the declarative knowledge layer of the Trothix platform. It catalogs all active, draft, helper, and proposed domains, detailing their implementation coverage and goals.

All items in this backlog are subject to the **Repository Evidence Constraint** and are strictly classified to prevent architecture drift.

---

## 1. Backlog Summary Table

| Domain Name | Status | Priority | Dependencies | Estimated Effort |
| --- | --- | --- | --- | --- |
| **Confidentiality** | Included in production manifest | Active | `Core` | None |
| **Notice** | Included in production manifest | Active | `Core` | None |
| **Termination** | Included in production manifest | Active | `Notice` | Low (Draft rules) |
| **Liability** | Included in production manifest | Active | `Core` | None (Legacy files) |
| **Indemnification** | Included in production manifest | Active | `Core` | None (Legacy files) |
| **Payment** | Included in production manifest | Active | `Core` | None (Legacy files) |
| **Assignment** | Excluded from manifest (Draft) | High | `Core` | Low |
| **Definitions** | Excluded from manifest (Draft) | High | `Notice` (Defect) | Medium |
| **GoverningLaw** | Excluded from manifest (Draft) | Medium | `Core` | Low |
| **Lifecycle** | Excluded from manifest (Draft) | Medium | `Notice` | Medium |
| **IntellectualProperty**| Excluded from manifest (Draft) | Medium | `Core` | Medium |
| **Core** | Helper domain | Active | None | None |
| **Warranty** | Implemented (Frozen) | High | `Core` | None |
| **ForceMajeure** | Implemented (Draft) | High | `Lifecycle`, `Termination`| None |
| **AuditRights** | Proposed (Placeholder) | Medium | `Notice`, `Payment` | Medium |
| **ServiceLevel** | Proposed (Placeholder) | Medium | `Payment`, `Lifecycle` | High |
| **Insurance** | Proposed (Placeholder) | Low | `Liability`, `Core` | Low |

---

## 2. Capability Records

---

### 2.1 Assignment Domain
*   **Capability Name**: Consent-Based Assignment Restrictions
*   **Repository Support**: Source folder `knowledge/source/domains/Assignment` exists. Contains 13 files including dictionaries, templates, rules, and decision tables.
*   **Ontology Coverage**:
    *   *Repository Evidence*: Types mapped in `assignment_types.json`, consent terms in `consent.json`, corporate transactions in `corporate_events.json`, delegation in `delegation.json`, and restrictions in `restrictions.json`.
*   **Phrase Coverage**:
    *   *Repository Evidence*: 2 templates families (`ASSIGNMENT_PROHIBITED`, `CONSENT_REQUIRED`) in `templates.json`.
*   **Rule Coverage**:
    *   *Repository Evidence*: 2 rules (`RULE_ASSIGNMENT_ALLOWED`, `RULE_CONSENT_REQUIRED`) in `rules.json`.
*   **Decision Tables**:
    *   *Repository Evidence*: 1 table (`DT_ASSIGNMENT`) mapping templates to rules.
*   **Benchmarks**:
    *   *Repository Evidence*: None.
    *   *Knowledge Recommendation*: Sourced sample assignment clauses from SEC EDGAR contracts should be added.
*   **Regression Tests**:
    *   *Repository Evidence*: Integration test `tests/integration/assignment_runtime.test.js` exists.
*   **Priority**: High (Activation of draft domains).
*   **Dependencies**: `Core`
*   **Estimated Knowledge Effort**: Low (Ready for verification and manifest activation).
*   **Expected Deterministic Capability**: Automatically detects if contract assignment or operational delegation requires counterparty consent or is unilaterally prohibited.
*   **Status**: Present in repository but excluded from production manifest.
*   **Evidence Classification**:
    *   *Repository Evidence*: Fully structured domain directory with matching JSON dictionaries.
    *   *Knowledge Recommendation*: Add domain folder to `manifest.json` under `domains` array. Settle benchmark text files.

---

### 2.2 Confidentiality Domain
*   **Capability Name**: Strict Mutual Non-Disclosure Covenants
*   **Repository Support**: Source folder `knowledge/source/domains/Confidentiality` and compiled assets folder both exist.
*   **Ontology Coverage**:
    *   *Repository Evidence*: Objects defined in `objects.json` (`CONFIDENTIAL_INFORMATION`, `WRITTEN_CONSENT`).
*   **Phrase Coverage**:
    *   *Repository Evidence*: 2 intents (`INTENT_KEEP_SECRET`, `INTENT_DISCLOSE`) in `intents.json`.
*   **Rule Coverage**:
    *   *Repository Evidence*: 1 rule (`RULE_NON_DISCLOSURE`) in `rules.json`.
*   **Decision Tables**:
    *   *Repository Evidence*: 1 table (`DT_CONFIDENTIALITY`) matching intents to rules.
*   **Benchmarks**:
    *   *Repository Evidence*: Verified against standard contracts `nda_01` to `nda_05` in `benchmark/nda`.
*   **Regression Tests**:
    *   *Repository Evidence*: Tested via local suite execution.
*   **Priority**: Active (Baseline production).
*   **Dependencies**: `Core`
*   **Estimated Knowledge Effort**: None.
*   **Expected Deterministic Capability**: Enforces obligation to protect disclosed information and flags unilateral disclosure gaps.
*   **Status**: Included in production manifest.
*   **Evidence Classification**:
    *   *Repository Evidence*: Production domain with full dictionary, benchmark trace, and manifest coverage.

---

### 2.3 Definitions Domain
*   **Capability Name**: Capitalized Term Resolution and Definition Gaps
*   **Repository Support**: Source folder `knowledge/source/domains/Definitions` exists.
*   **Ontology Coverage**:
    *   *Repository Evidence*: Defined terms mapped in `defined_terms.json`, aliases mapped in `aliases.json`.
*   **Phrase Coverage**:
    *   *Repository Evidence*: 2 intents (`INTENT_DEFINE`, `INTENT_ALIAS`) in `intents.json`.
*   **Rule Coverage**:
    *   *Repository Evidence*: 3 rules (`RULE_DEFINITIONS_PRESENT`, `RULE_ALIASES_RESOLVED`, `RULE_UNDEFINED_CAPITALIZED_TERM`) in `rules.json`.
*   **Decision Tables**:
    *   *Repository Evidence*: 2 tables (`DT_DEFINED_TERM`, `DT_ALIAS`).
*   **Benchmarks**:
    *   *Repository Evidence*: Covered by `nda_03` definitions.
*   **Regression Tests**:
    *   *Repository Evidence*: Test suite `tests/integration/definitions_runtime.test.js` verified.
*   **Priority**: High (Activation of draft domains).
*   **Dependencies**: `Notice` (Note: This is a cross-domain reference defect in rules).
*   **Estimated Knowledge Effort**: Medium (Needs ontological correction).
*   **Expected Deterministic Capability**: Extracts capitalized terms and maps them to canonical types, flagging any capitalized word used but not defined.
*   **Status**: Present in repository but excluded from production manifest.
*   **Evidence Classification**:
    *   *Repository Evidence*: JSON dictionaries and logic exist. Integration test utilizes trace assertions.
    *   *Knowledge Recommendation*: Resolve the anti-pattern inside `rules.json` where rules reference `concept: NOTICE`. Replace it with a local concept reference and map a definitions concept.

---

### 2.4 GoverningLaw Domain
*   **Capability Name**: Exclusive Venues and Jurisdictional Audits
*   **Repository Support**: Source folder `knowledge/source/domains/GoverningLaw` exists. Contains 5 files.
*   **Ontology Coverage**:
    *   *Repository Evidence*: Courts mapped in `courts.json`, jurisdictions in `jurisdictions.json`.
*   **Phrase Coverage**:
    *   *Repository Evidence*: None.
*   **Rule Coverage**:
    *   *Repository Evidence*: 2 rules (`RULE_EXPLICIT_GOVERNING_LAW`, `RULE_EXCLUSIVE_VENUE`) in `rules.json`.
*   **Decision Tables**:
    *   *Repository Evidence*: None.
*   **Benchmarks**:
    *   *Repository Evidence*: Covered by `nda_01` to `nda_05` jurisdiction properties.
*   **Regression Tests**:
    *   *Repository Evidence*: None.
*   **Priority**: Medium.
*   **Dependencies**: `Core`
*   **Estimated Knowledge Effort**: Low.
*   **Expected Deterministic Capability**: Extracts governing jurisdictions and flags dispute venues outside standard preferences.
*   **Status**: Present in repository but excluded from production manifest.
*   **Evidence Classification**:
    *   *Repository Evidence*: Basic rule logic and jurisdiction dicts exist.
    *   *Knowledge Recommendation*: Add phrases, templates, and decision tables to automate state/venue extraction.

---

### 2.5 Lifecycle Domain
*   **Capability Name**: Execution Milestones and Transition States
*   **Repository Support**: Source folder `knowledge/source/domains/Lifecycle` exists. Contains 11 files.
*   **Ontology Coverage**:
    *   *Repository Evidence*: Mapped in `states.json` (`STATE_DRAFT`, `STATE_ACTIVE`), `transitions.json`, `events.json`.
*   **Phrase Coverage**:
    *   *Repository Evidence*: None.
*   **Rule Coverage**:
    *   *Repository Evidence*: 2 rules (`RULE_PROPER_NOTICE_TIMELINE`, `RULE_ILLEGAL_STATE_TRANSITION`) in `rules.json`.
*   **Decision Tables**:
    *   *Repository Evidence*: 1 table (`DT_LIFECYCLE`).
*   **Benchmarks**:
    *   *Repository Evidence*: None.
    *   *Knowledge Recommendation*: Add benchmark leases and service agreements to test transition gates.
*   **Regression Tests**:
    *   *Repository Evidence*: Mock trace test `tests/integration/lifecycle_runtime.test.js` exists.
*   **Priority**: Medium.
*   **Dependencies**: `Notice`
*   **Estimated Knowledge Effort**: Medium.
*   **Expected Deterministic Capability**: Tracks the operational stages of agreements (e.g., draft to executed) and flags violations of chronological milestones.
*   **Status**: Present in repository but excluded from production manifest.
*   **Evidence Classification**:
    *   *Repository Evidence*: Core files exist in domain folder; rules utilize transition check functions.
    *   *Knowledge Recommendation*: Settle templates for automatic signature-driven state changes.

---

### 2.6 IntellectualProperty Domain
*   **Capability Name**: IP Ownership and Contributions
*   **Repository Support**: Source folder `knowledge/source/domains/IntellectualProperty` exists. Contains 5 files.
*   **Ontology Coverage**:
    *   *Repository Evidence*: Owners mapped in `owners.json`, licenses in `licenses.json`.
*   **Phrase Coverage**:
    *   *Repository Evidence*: None.
*   **Rule Coverage**:
    *   *Repository Evidence*: 2 rules (`RULE_IP_OWNERSHIP_CLEARLY_ASSIGNED`, `RULE_OWNERSHIP_UNDEFINED`) in `rules.json`.
*   **Decision Tables**:
    *   *Repository Evidence*: None.
*   **Benchmarks**:
    *   *Repository Evidence*: None.
    *   *Knowledge Recommendation*: Settle contributor licenses (CLAs) as test cases.
*   **Regression Tests**:
    *   *Repository Evidence*: None.
*   **Priority**: Medium.
*   **Dependencies**: `Core`
*   **Estimated Knowledge Effort**: Medium.
*   **Expected Deterministic Capability**: Evaluates whether work product ownership cleanly assigns to the purchaser or is retained by the creator.
*   **Status**: Present in repository but excluded from production manifest.
*   **Evidence Classification**:
    *   *Repository Evidence*: Basic rule constraints exist in source directory.
    *   *Knowledge Recommendation*: Expand rules to cover licenses and sub-license covenants.

---

### 2.7 Notice Domain
*   **Capability Name**: Formal Written Notice Requirements
*   **Repository Support**: Source folder `knowledge/source/domains/Notice` and compiled assets both exist.
*   **Ontology Coverage**:
    *   *Repository Evidence*: Notice definitions in `objects.json` (`NOTICE`, `COMMUNICATION`).
*   **Phrase Coverage**:
    *   *Repository Evidence*: 2 intents (`INTENT_DEEMED_RECEIVED`, `INTENT_REQUIRE_WRITTEN`) in `intents.json`.
*   **Rule Coverage**:
    *   *Repository Evidence*: 2 rules (`RULE_EMAIL_NOTICE_ALLOWED`, `RULE_MISSING_NOTICE_ADDRESS`) in `rules.json`.
*   **Decision Tables**:
    *   *Repository Evidence*: 2 tables (`DT_NOTICE_METHOD`, `DT_NOTICE_ADDRESS`).
*   **Benchmarks**:
    *   *Repository Evidence*: Covered by `nda_01` to `nda_05` notice properties.
*   **Regression Tests**:
    *   *Repository Evidence*: Integration test `tests/integration/notice_runtime.test.js` verified.
*   **Priority**: Active.
*   **Dependencies**: `Core`
*   **Estimated Knowledge Effort**: None.
*   **Expected Deterministic Capability**: Verifies that notices must be written and delivered to valid addresses, flagging email notification rules.
*   **Status**: Included in production manifest.
*   **Evidence Classification**:
    *   *Repository Evidence*: Production domain with integration tests.

---

### 2.8 Termination Domain
*   **Capability Name**: Exit Windows and Breach Cure Periods
*   **Repository Support**: Source folder `knowledge/source/domains/Termination` and compiled assets both exist. Contains 13 files.
*   **Ontology Coverage**:
    *   *Repository Evidence*: Verbs and states mapped in `states.json`, `events.json`, and `objects.json`.
*   **Phrase Coverage**:
    *   *Repository Evidence*: 6 templates families (`INTENT_END_CONTRACT`, `INTENT_CURE`, `INTENT_RENEW`, etc.) in `templates.json`.
*   **Rule Coverage**:
    *   *Repository Evidence*: None.
*   *Decision Tables*:
    *   *Repository Evidence*: None.
*   **Benchmarks**:
    *   *Repository Evidence*: Covered by `lease_01` and `lease_02` termination events.
*   **Regression Tests**:
    *   *Repository Evidence*: None.
*   **Priority**: Active.
*   **Dependencies**: `Notice`
*   **Estimated Knowledge Effort**: Low (Need to draft rules).
*   **Expected Deterministic Capability**: Identifies notice deadlines required to terminate or opt-out of renewal.
*   **Status**: Included in production manifest.
*   **Evidence Classification**:
    *   *Repository Evidence*: Compiled dictionaries and templates exist.
    *   *Knowledge Recommendation*: Write declarative rules checking for cure period durations and unilateral termination options.

---

### 2.9 Payment Domain
*   **Capability Name**: Fee Covenants and Late Penalties
*   **Repository Support**: Compiled assets directory `assets/js/engine/knowledge/v1/domains/Payment` exists.
*   **Ontology Coverage**:
    *   *Repository Evidence*: Mapped in compiled `concept.json` (`CONCEPT_PAYMENT`).
*   **Phrase Coverage**:
    *   *Repository Evidence*: None.
*   **Rule Coverage**:
    *   *Repository Evidence*: 1 rule (`RULE_PAYMENT_DEADLINE_LONG`) in compiled `rules.json`.
*   **Decision Tables**:
    *   *Repository Evidence*: None.
*   **Benchmarks**:
    *   *Repository Evidence*: None.
    *   *Knowledge Recommendation*: Settle lease payment late fees as benchmark files.
*   **Regression Tests**:
    *   *Repository Evidence*: None.
*   **Priority**: Active.
*   **Dependencies**: `Core`
*   **Estimated Knowledge Effort**: None.
*   **Expected Deterministic Capability**: Extracts billing intervals and flags unreasonable payment periods.
*   **Status**: Included in production manifest.
*   **Evidence Classification**:
    *   *Repository Evidence*: Compiled folder in assets has `actions.json`, `concept.json`, `rules.json`.
    *   *Knowledge Recommendation*: Create source folder mapping files in `knowledge/source/domains/Payment` to enable rebuild compilation.

---

### 2.10 Liability Domain
*   **Capability Name**: Risk Allocation and Liability Caps
*   **Repository Support**: Compiled assets directory `assets/js/engine/knowledge/v1/domains/Liability` exists. Contains 7 compiled files.
*   **Ontology Coverage**:
    *   *Repository Evidence*: Mapped in compiled `concept.json` (`CONCEPT_LIABILITY`).
*   **Phrase Coverage**:
    *   *Repository Evidence*: None.
*   **Rule Coverage**:
    *   *Repository Evidence*: 6 rules (`CONCEPT_LIABILITY_PRESENT`, etc.) in compiled `rules.json`.
*   **Decision Tables**:
    *   *Repository Evidence*: None.
*   **Benchmarks**:
    *   *Repository Evidence*: None.
    *   *Knowledge Recommendation*: Settle standard commercial cap agreements as benchmark targets.
*   **Regression Tests**:
    *   *Repository Evidence*: None.
*   **Priority**: Active.
*   **Dependencies**: `Core`
*   **Estimated Knowledge Effort**: None.
*   **Expected Deterministic Capability**: Flags unilateral liability structures and extracts cash caps.
*   **Status**: Included in production manifest.
*   **Evidence Classification**:
    *   *Repository Evidence*: Compiled assets folder exists with actions, concepts, and rules.
    *   *Knowledge Recommendation*: Create source folder mapping files in `knowledge/source/domains/Liability` to enable rebuild compilation.

---

### 2.11 Indemnification Domain
*   **Capability Name**: Legal Defense Allocations
*   **Repository Support**: Compiled assets directory `assets/js/engine/knowledge/v1/domains/Indemnification` exists.
*   **Ontology Coverage**:
    *   *Repository Evidence*: Mapped in compiled `concept.json` (`CONCEPT_INDEMNIFICATION`).
*   **Phrase Coverage**:
    *   *Repository Evidence*: None.
*   **Rule Coverage**:
    *   *Repository Evidence*: 6 rules in compiled `rules.json`.
*   **Decision Tables**:
    *   *Repository Evidence*: None.
*   **Benchmarks**:
    *   *Repository Evidence*: None.
    *   *Knowledge Recommendation*: Settle standard commercial indemnities as benchmark targets.
*   **Regression Tests**:
    *   *Repository Evidence*: None.
*   **Priority**: Active.
*   **Dependencies**: `Core`
*   **Estimated Knowledge Effort**: None.
*   **Expected Deterministic Capability**: Identifies which party defends lawsuits arising from third-party IP or breach claims.
*   **Status**: Included in production manifest.
*   **Evidence Classification**:
    *   *Repository Evidence*: Compiled assets folder exists.
    *   *Knowledge Recommendation*: Create source folder mapping files in `knowledge/source/domains/Indemnification` to enable rebuild compilation.

---

### 2.12 Core Domain
*   **Capability Name**: Grammatical Connectives and Actors
*   **Repository Support**: Compiled assets folder `assets/js/engine/knowledge/v1/domains/Core` exists. Contains 5 compiled files.
*   **Ontology Coverage**:
    *   *Repository Evidence*: Mapped connectives (`provided_that`) and variables (`money`, `duration`).
*   **Phrase Coverage**:
    *   *Repository Evidence*: Basic connectors mapped.
*   **Rule Coverage**:
    *   *Repository Evidence*: None.
*   **Decision Tables**:
    *   *Repository Evidence*: None.
*   **Benchmarks**:
    *   *Repository Evidence*: None.
*   **Regression Tests**:
    *   *Repository Evidence*: None.
*   **Priority**: Active.
*   **Dependencies**: None.
*   **Estimated Knowledge Effort**: None.
*   **Expected Deterministic Capability**: Helper ontology providing the foundation grammar connectives for all other domains.
*   **Status**: Helper domain.
*   **Evidence Classification**:
    *   *Repository Evidence*: Compiled assets folder exists.
    *   *Knowledge Recommendation*: Create source folder mapping files in `knowledge/source/domains/Core` to enable rebuild compilation.

---

### 2.13 Warranty Domain
*   **Capability Name**: Performance Warranties and Disclaimer Auditing
*   **Repository Support**: Source folder `knowledge/source/domains/Warranty` and compiled assets folder both exist.
*   **Ontology Coverage**:
    *   *Repository Evidence*: Concepts defined in `concept.json` (`CONCEPT_WARRANTY`), actions in `actions.json` (`ACTION_WARRANTY`).
*   **Phrase Coverage**:
    *   *Repository Evidence*: 3 phrases (`PHRASE_WARRANTY_DISCLAIMER`, `PHRASE_WARRANTY_PERIOD`, `PHRASE_WARRANTY_REMEDY`) in `phrases.json`.
*   **Rule Coverage**:
    *   *Repository Evidence*: 5 rules (`RULE_WARRANTY_PRESENT`, `RULE_WARRANTY_MISSING`, `RULE_WARRANTY_DISCLAIMER_PRESENT`, `RULE_WARRANTY_PERIOD_MISSING`, `RULE_WARRANTY_REMEDY_EXCLUSIVE`) in `rules.json`.
*   **Decision Tables**:
    *   *Repository Evidence*: None. Mapped directly as graph rules.
*   **Benchmarks**:
    *   *Repository Evidence*: Covered by `tos_01`, `tos_05`, and `tos_06` in `benchmark/tos`.
*   **Regression Tests**:
    *   *Repository Evidence*: Verified by benchmark tests run executions.
*   **Priority**: High (Completed domain).
*   **Dependencies**: `Core`
*   **Estimated Knowledge Effort**: None.
*   **Expected Deterministic Capability**: Extracts explicit product warranty periods and flags presence of warranty disclaimers.
*   **Status**: Present in repository, compiled, but excluded from production manifest.
*   **Evidence Classification**:
    *   *Repository Evidence*: Fully structured domain directory with matching JSON dictionaries.

---

### 2.14 ForceMajeure Domain
*   **Capability Name**: Performance Excuse and Delay Terminations
*   **Repository Support**: Source folder `knowledge/source/domains/ForceMajeure` and compiled assets folder both exist.
*   **Ontology Coverage**:
    *   *Repository Evidence*: Concepts defined in `concept.json` (`CONCEPT_FORCE_MAJEURE`), verbs in `actions.json` (`ACTION_SUSPEND`).
*   **Phrase Coverage**:
    *   *Repository Evidence*: 3 phrases (`PHRASE_FORCE_MAJEURE_INCIDENT`, `PHRASE_FORCE_MAJEURE_DELAY_LIMIT`, `PHRASE_FORCE_MAJEURE_NOTICE`) in `phrases.json`.
*   **Rule Coverage**:
    *   *Repository Evidence*: 4 rules (`RULE_FORCE_MAJEURE_PRESENT`, `RULE_FORCE_MAJEURE_MISSING`, `RULE_FORCE_MAJEURE_TERMINATION_CAP_EXCESSIVE`, `RULE_FORCE_MAJEURE_NOTICE_REQUIRED`) in `rules.json`.
*   **Decision Tables**:
    *   *Repository Evidence*: None. Mapped directly as graph rules.
*   **Benchmarks**:
    *   *Repository Evidence*: Verified against `tos_07.txt` and `tos_08.txt` in `benchmark/tos`.
*   **Regression Tests**:
    *   *Repository Evidence*: Verified by benchmark tests run executions.
*   **Priority**: High (Completed domain).
*   **Dependencies**: `Lifecycle`, `Termination`
*   **Estimated Knowledge Effort**: None.
*   **Expected Deterministic Capability**: Detects if a party can terminate if an excusable delay exceeds a configured threshold.
*   **Status**: Present in repository, compiled, but excluded from production manifest.
*   **Evidence Classification**:
    *   *Repository Evidence*: Fully structured domain directory with matching JSON dictionaries.

---

### 2.15 AuditRights Domain
*   **Capability Name**: Access Inspections and Records Verification
*   **Repository Support**: None.
*   **Ontology Coverage**:
    *   *Knowledge Recommendation*: Propose `CONCEPT_AUDIT`, `ACTION_INSPECT`, `objects.json` (records, accounts, systems).
*   **Phrase Coverage**:
    *   *Knowledge Recommendation*: Propose templates for visit frequencies and notification timelines.
*   **Rule Coverage**:
    *   *Knowledge Recommendation*: Propose `RULE_AUDIT_RIGHTS_UNLIMITED`, `RULE_AUDIT_NOTICE_ADEQUATE`.
*   **Decision Tables**:
    *   *Knowledge Recommendation*: Propose `DT_AUDIT_RIGHTS`.
*   **Benchmarks**:
    *   *Knowledge Recommendation*: Propose 5 software licenses.
*   **Regression Tests**:
    *   *Knowledge Recommendation*: Propose 5 validation rules.
*   **Priority**: Medium (Proposed/Future addition).
*   **Dependencies**: `Notice`, `Payment`
*   **Estimated Knowledge Effort**: Medium.
*   **Expected Deterministic Capability**: Flags unlimited audit frequencies and ensures audit notices comply with context expectations.
*   **Status**: Placeholder domain.
*   **Evidence Classification**:
    *   *Knowledge Recommendation*: Declare new domain directory and files.

---

### 2.16 ServiceLevel Domain
*   **Capability Name**: SaaS Service Commitments and Credit Claims
*   **Repository Support**: None.
*   **Ontology Coverage**:
    *   *Knowledge Recommendation*: Propose `CONCEPT_SERVICE_LEVEL`, `ACTION_MEASURE`, `objects.json` (uptime, availability, service credit).
*   **Phrase Coverage**:
    *   *Knowledge Recommendation*: Propose credit calculation patterns.
*   **Rule Coverage**:
    *   *Knowledge Recommendation*: Propose `RULE_SLA_CREDITS_UNLIMITED`, `RULE_SLA_UPTIME_THRESHOLD_LOW`.
*   **Decision Tables**:
    *   *Knowledge Recommendation*: Propose `DT_SERVICE_LEVEL_CREDITS`.
*   **Benchmarks**:
    *   *Knowledge Recommendation*: Propose 5 SaaS agreements.
*   **Regression Tests**:
    *   *Knowledge Recommendation*: Propose 5 validation checks.
*   **Priority**: Medium (Proposed/Future addition).
*   **Dependencies**: `Payment`, `Lifecycle`
*   **Estimated Knowledge Effort**: High.
*   **Expected Deterministic Capability**: Verifies availability guarantees and extracts service credit compensation rules.
*   **Status**: Placeholder domain.
*   **Evidence Classification**:
    *   *Knowledge Recommendation*: Declare new domain directory and files.

---

### 2.17 Insurance Domain
*   **Capability Name**: Commercial Coverage Obligations
*   **Repository Support**: None.
*   **Ontology Coverage**:
    *   *Knowledge Recommendation*: Propose `CONCEPT_INSURANCE`, `objects.json` (policy, coverage, certificate).
*   **Phrase Coverage**:
    *   *Knowledge Recommendation*: Propose templates identifying obligation to maintain coverages.
*   **Rule Coverage**:
    *   *Knowledge Recommendation*: Propose `RULE_INSURANCE_REQUIREMENTS_MISSING`.
*   **Decision Tables**:
    *   *Knowledge Recommendation*: Propose `DT_INSURANCE_CHECK`.
*   **Benchmarks**:
    *   *Knowledge Recommendation*: Propose 5 contractor agreements.
*   **Regression Tests**:
    *   *Knowledge Recommendation*: Propose 5 validation traces.
*   **Priority**: Low (Proposed/Future addition).
*   **Dependencies**: `Liability`, `Core`
*   **Estimated Knowledge Effort**: Low.
*   **Expected Deterministic Capability**: Verifies vendor requirements to maintain standard policy coverage levels.
*   **Status**: Placeholder domain.
*   **Evidence Classification**:
    *   *Knowledge Recommendation*: Declare new domain directory and files.
