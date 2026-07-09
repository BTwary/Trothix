# Trothix Legal Intelligence: Knowledge Expansion Master Plan

This document establishes the master roadmap and canonical specification for the Knowledge Expansion phase of the Trothix platform. It outlines how to maximize deterministic legal capability using the existing frozen architecture.

---

## 1. Repository Capability Matrix

This matrix summarizes the declarative knowledge components across the domains in the `v1` knowledge directory, based strictly on repository file evidence:

| Legal Domain | Production Manifest Status | Concepts | Actions | Objects | Entities | Phrases (Intents/Templates) | Rules | Decision Tables | Benchmark Coverage | Regression Tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Assignment** | Present in repository but excluded from production manifest | None | 0 | 0 | 0 | 2 families (`ASSIGNMENT_PROHIBITED`, `CONSENT_REQUIRED`) | 2 (`RULE_ASSIGNMENT_ALLOWED`, `RULE_CONSENT_REQUIRED`) | 1 (`DT_ASSIGNMENT`) | None | `assignment_runtime.test.js` |
| **Confidentiality** | Included in production manifest | None | 0 | 2 (`CONFIDENTIAL_INFORMATION`, `WRITTEN_CONSENT`) | 0 | 2 (`INTENT_KEEP_SECRET`, `INTENT_DISCLOSE`) | 1 (`RULE_NON_DISCLOSURE`) | 1 (`DT_CONFIDENTIALITY`) | Covered (`nda_01` to `nda_05`) | `regression_tests.json` (Local) |
| **Core** | Helper domain | None | 0 | 0 | 0 | 0 | 0 | 0 | None | None |
| **Definitions** | Present in repository but excluded from production manifest | None | 0 | 2 (`ENTITY_CONFIDENTIAL_INFORMATION`, `DEFINITION`) | 0 | 2 (`INTENT_DEFINE`, `INTENT_ALIAS`) | 3 (`RULE_DEFINITIONS_PRESENT`, `RULE_ALIASES_RESOLVED`, `RULE_UNDEFINED_CAPITALIZED_TERM`) | 2 (`DT_DEFINED_TERM`, `DT_ALIAS`) | Covered (`nda_03` definitions) | `definitions_runtime.test.js` |
| **GoverningLaw** | Present in repository but excluded from production manifest | None | 0 | 0 | 0 | 0 | 2 (`RULE_EXPLICIT_GOVERNING_LAW`, `RULE_EXCLUSIVE_VENUE`) | 0 | Covered (`nda_01` to `nda_05`) | None |
| **Indemnification** | Included in production manifest | 1 (`CONCEPT_INDEMNIFICATION`) | 1 (`ACTION_INDEMNIFICATION`) | 0 | 1 (`ENTITY_INDEMNIFICATION_TERM`) | 1 (`PHRASE_INDEMNIFICATION_MARKER`) | 6 (`CONCEPT_INDEMNIFICATION_PRESENT`, etc.) | 0 | Placeholder (`coverage.json`) | None (Placeholder Arrays) |
| **IntellectualProperty** | Present in repository but excluded from production manifest | None | 0 | 0 | 0 | 0 | 2 (`RULE_IP_OWNERSHIP_CLEARLY_ASSIGNED`, `RULE_OWNERSHIP_UNDEFINED`) | 0 | None | None |
| **Liability** | Included in production manifest | 1 (`CONCEPT_LIABILITY`) | 1 (`ACTION_LIABILITY`) | 0 | 1 (`ENTITY_LIABILITY_TERM`) | 1 (`PHRASE_LIABILITY_MARKER`) | 6 (`CONCEPT_LIABILITY_PRESENT`, etc.) | 0 | Placeholder (`coverage.json`) | None (Placeholder Arrays) |
| **Lifecycle** | Present in repository but excluded from production manifest | None | 0 | 0 | 0 | 0 | 2 (`RULE_PROPER_NOTICE_TIMELINE`, `RULE_ILLEGAL_STATE_TRANSITION`) | 1 (`DT_LIFECYCLE`) | None | `lifecycle_runtime.test.js` |
| **Notice** | Included in production manifest | None | 0 | 2 (`NOTICE`, `COMMUNICATION`) | 0 | 2 (`INTENT_DEEMED_RECEIVED`, `INTENT_REQUIRE_WRITTEN`) | 2 (`RULE_EMAIL_NOTICE_ALLOWED`, `RULE_MISSING_NOTICE_ADDRESS`) | 2 (`DT_NOTICE_METHOD`, `DT_NOTICE_ADDRESS`) | Covered (`nda_01` to `nda_05`) | `notice_runtime.test.js` |
| **Payment** | Included in production manifest | 1 (`CONCEPT_PAYMENT`) | 1 (`ACTION_PAY`) | 0 | 0 | 0 | 1 (`RULE_PAYMENT_DEADLINE_LONG`) | 0 | None | None |
| **Termination** | Included in production manifest | None | 0 | 3 (`AGREEMENT`, `NOTICE`, `BREACH`) | 0 | 6 (`INTENT_END_CONTRACT`, `INTENT_CURE`, `INTENT_RENEW`, `TPL_...`) | 0 | 0 | Covered (`lease_01`, `lease_02`) | None |
| **Warranty** | Placeholder domain | None | 0 | 0 | 0 | 0 | 0 | 0 | None | None |
| **ForceMajeure** | Placeholder domain | None | 0 | 0 | 0 | 0 | 0 | 0 | None | None |
| **AuditRights** | Placeholder domain | None | 0 | 0 | 0 | 0 | 0 | 0 | None | None |
| **Insurance** | Placeholder domain | None | 0 | 0 | 0 | 0 | 0 | 0 | None | None |
| **ServiceLevel** | Placeholder domain | None | 0 | 0 | 0 | 0 | 0 | 0 | None | None |

> [!NOTE]
> **Repository Evidence**: Domains listed as *Present in repository but excluded from production manifest* contain active code and folder assets in the workspace under `knowledge/source/domains` but are excluded from the `domains` list of the production bundle initializer `manifest.json` located at `assets/js/engine/knowledge/v1/manifest.json`.

---

## 2. Knowledge Gap Analysis & Deterministic Capabilities Added

Before introducing new domains, target capabilities are mapped to existing ontology structures or marked as new placeholders.

### 2.1 Mapped to Existing Ontology

1.  **Change of Control** ➔ **Assignment Domain**
    *   *Deterministic Capabilities Added*: Extends the vocabulary list and maps extraction criteria to detect triggers representing acquisition or ownership transfer events. Evaluates rules checking for prior approval rights on corporate transactions.
2.  **Subcontracting Controls** ➔ **Assignment Domain**
    *   *Deterministic Capabilities Added*: Maps delegation intents and restriction tags. Evaluates rules checking if performance delegation requires counterparty consent or notification.
3.  **Acceptance Testing** ➔ **Lifecycle Domain**
    *   *Deterministic Capabilities Added*: Maps transitions to deliverable acceptance. Evaluates state triggers identifying whether non-objection within a specified duration constitutes automatic acceptance.
4.  **Bankruptcy / Insolvency Default** ➔ **Lifecycle Domain**
    *   *Deterministic Capabilities Added*: Defines transition pathways from active execution to termination. Evaluates default events triggered by corporate restructuring, liquidations, or insolvency.
5.  **Data Processing & Regulatory Notice** ➔ **Notice / Confidentiality Domains**
    *   *Deterministic Capabilities Added*: Associates notification deadlines and disclosures. Evaluates rules enforcing timelines for data breach notifications or statutory reporting events.
6.  **AI Clauses & Open Source Licensing** ➔ **IntellectualProperty Domain**
    *   *Deterministic Capabilities Added*: Maps license limits and proprietary restrictions. Evaluates whether third-party model terms or copyleft constraints apply to repository deliverables.

### 2.2 Recommending New Domains

New domains are recommended only if their core legal logic cannot map to the existing directories:

1.  **Warranty & Representations** (Proposed: `Warranty` domain)
    *   *Deterministic Capabilities Added*: Detects standard warranties, disclaimers, and remedies for defective deliverables.
2.  **Force Majeure** (Proposed: `ForceMajeure` domain)
    *   *Deterministic Capabilities Added*: Flags excuses for non-performance, excuses duration caps, and delays.
3.  **Audit Rights** (Proposed: `AuditRights` domain)
    *   *Deterministic Capabilities Added*: Validates access terms, review intervals, cost allocation rules, and record retention limits.
4.  **Insurance** (Proposed: `Insurance` domain)
    *   *Deterministic Capabilities Added*: Evaluates policies required, coverage limits, and certificate of insurance compliance.
5.  **Service Level Agreements (SLAs)** (Proposed: `ServiceLevel` domain)
    *   *Deterministic Capabilities Added*: Checks service performance parameters, credit triggers, and measurement methods.

---

## 3. Provisional Ontology Recommendation

The following mappings represent provisional ontology assignments. They are not architectural facts and require semantic validation against a representative contract corpus before becoming canonical.

### 3.1 Mapping: Change of Control ➔ Assignment Domain

*   **Repository Evidence**: The `Assignment` domain's playbook `domain_playbook.md` mentions "missing change-of-control triggers" as a primary drafting risk. The folder contains `corporate_events.json` declaring `CHANGE_OF_CONTROL`, `MERGER`, and `ACQUISITION`.
*   **Legal Semantics**: A Change of Control is legally a transfer of ownership or control of a contracting entity, which often triggers "deemed assignment" clauses to prevent transfer of interests to a competitor.
*   **Benefits**: Reuses the assignment predicate structure (`RULE_CONSENT_REQUIRED`, `DT_ASSIGNMENT`) without creating a separate domain.
*   **Potential Drawbacks**: Change of Control does not always constitute a transfer of contract obligations or rights; mapping them together may cause false positives on standard assignment rules.
*   **Recommendation**: Implement Change of Control as a potential sub-type or event exception within the `Assignment` domain dictionary.
*   **Future Expandability**: Can be factored out into a dedicated corporate restructuring domain if rules diverge.

### 3.2 Mapping: Data Processing & Regulatory Notice (GDPR/Breach) ➔ Notice / Confidentiality Domains

*   **Repository Evidence**: `Notice` domain defines rules for transmission modes (`RULE_EMAIL_NOTICE_ALLOWED`) and recipients. `Confidentiality` domain has rules for permitted disclosures (`RULE_NON_DISCLOSURE`, `INTENT_DISCLOSE`).
*   **Legal Semantics**: Regulatory breach notifications and data processing directions are notice covenants triggered by regulatory events, or disclosures allowed under confidentiality exceptions.
*   **Benefits**: Leverages existing notice receipt timelines and confidential info concepts.
*   **Potential Drawbacks**: Conflates operational notifications (e.g., address changes) with high-stakes compliance reporting deadlines, potentially diluting notice risk metrics.
*   **Recommendation**: Keep notice mechanisms in the `Notice` domain, but represent privacy/breach obligations as data protection agreements (DPAs) using a dedicated domain once the engine's core is extended.
*   **Future Expandability**: Requires formal mapping of breach timelines to notice window extractors.

### 3.3 Mapping: AI Clauses & Open Source Licensing ➔ IntellectualProperty Domain

*   **Repository Evidence**: The `IntellectualProperty` folder contains rules evaluating IP ownership allocations (`RULE_IP_OWNERSHIP_CLEARLY_ASSIGNED`, `RULE_OWNERSHIP_UNDEFINED`).
*   **Legal Semantics**: Licensing restrictions, model utilization rights, training data rights, and open-source compliance are legally sub-license conditions or ownership allocations.
*   **Benefits**: Unifies all IP allocations under a single evaluation flow.
*   **Potential Drawbacks**: Open-source license checking and generative AI usage restrictions require complex dependency checks that standard copyright rules do not model.
*   **Recommendation**: Model AI restrictions as potential phrase and rule additions in the `IntellectualProperty` domain.
*   **Future Expandability**: Can integrate external license scanner APIs if needed in future tool versions.

---

## 4. Flexible Domain Layout

> [!IMPORTANT]
> **Knowledge Recommendation**: There is no rigid architectural constraint requiring every domain folder to contain a fixed set of files. The knowledge provider retrieves files dynamically. A domain should only implement the specific declarative elements required to achieve its extraction and evaluation objectives.

Domain structures are flexible and may include:
*   **Potential ontology additions**: Declaring new entries in `concept.json`, `actions.json`, `objects.json`, `entities.json`, or `relations.json` to model domain vocabulary.
*   **Potential phrase additions**: Declaring templates in `templates.json` and semantic vectors in `intents.json`.
*   **Potential rule additions**: Adding declarative rules inside `rules.json` to be compiled by the predicate engine.
*   **Potential decision tables**: Creating evaluation logic inside `decision_tables.json` mapping templates to rule outputs.

---

## 5. Generic Parameters (Removing Hardcoded Defaults)

To ensure the roadmap and rule specifications remain declarative and flexible, all concrete legal defaults are replaced with generic, parameterized parameters:

*   **Payment Terms**: Evaluated against a *specified payment terms window* configured in the engine context, rather than hardcoded day counts.
*   **Performance Excuse / Delay Limits**: Excused delays are bounded by a *delay termination threshold*, rather than fixed day limits.
*   **Insurance Specifications**: Verified against *standard commercial policies* and *specified coverage levels* parameter objects, removing mentions of explicit insurance types or coverage caps.
*   **Jurisdiction Venue Checks**: Compared against *counterparty jurisdiction parameters* and *neutral jurisdiction lists*, removing specific state or national names.

---

## 6. Sprint Roadmap

The roadmap establishes outcome-oriented objectives rather than hardcoded counts.

### Sprint 1: Activating Existing Draft Domains
*   **Knowledge Objectives**: Settle core vocabulary definitions, notice addresses, and consent restrictions.
*   **Ontology Objectives**: Map actors, objects, and intents in the existing draft folders (`Assignment`, `Definitions`, `Notice`).
*   **Rule Objectives**: Compile predicate rules evaluating consent mandates, defined terms presence, and email notice permissions.
*   **Benchmark Objectives**: Establish baseline performance traces on definitions and notice benchmarks.
*   **Regression Objectives**: Validate integration test traces to confirm zero regression on local suites.

### Sprint 2: Activating Governing Law, IP, and Lifecycle
*   **Knowledge Objectives**: Target exclusive litigation venues, IP assignment parameters, and contract execution state transitions.
*   **Ontology Objectives**: Model courts and jurisdictions for Governing Law; owners and licenses for IP; states and events for Lifecycle.
*   **Rule Objectives**: Implement venue matches, ownership transfer allocations, and state transitions.
*   **Benchmark Objectives**: Execute verification tests on cross-border agreements and contributor licenses.
*   **Regression Objectives**: Extend local validation suite with mock-up execution checks.

### Sprint 3: Sourcing Warranties and Force Majeure
*   **Knowledge Objectives**: Analyze representations, warranties, performance disclaimers, and force majeure delays.
*   **Ontology Objectives**: Map excuse triggers, suspension parameters, warranty bodies, and disclaimers.
*   **Rule Objectives**: Detect disclaimer presence and delay excusal boundaries.
*   **Benchmark Objectives**: Target standard commercial warranties and disclaimers.
*   **Regression Objectives**: Implement positive/negative clause mutation tests.

### Sprint 4: Sourcing Audit Rights, SLAs, and Insurance
*   **Knowledge Objectives**: Establish audits, SLA credit triggers, and insurance requirements.
*   **Ontology Objectives**: Model audit intervals, uptime requirements, credit scales, and policy requirements.
*   **Rule Objectives**: Flag unbounded audits, low SLA thresholds, and missing insurance certificates.
*   **Benchmark Objectives**: Validate against SaaS SLA terms and vendor services agreements.
*   **Regression Objectives**: Add test parameters verifying correct logic routing.

---

## 7. Golden Corpus Recommendations

To acquire high-quality, real-world contract clause training sets, we recommend the following public corpuses:

1.  **SEC EDGAR Database (Exhibit 10 Material Contracts)**
    *   *Why valuable*: Real-world commercial contracts reviewed by corporate legal counsel.
    *   *Supported domains*: IntellectualProperty, Assignment, Liability, GoverningLaw.
    *   *Clause diversity*: Extremely high; reflects negotiated transaction terms.
    *   *Expected quality*: Premium legal drafting quality.
2.  **US Federal GSA Schedule Contracts**
    *   *Why valuable*: Publicly accessible procurement agreements representing standardized government-facing rules.
    *   *Supported domains*: AuditRights, Notice, Payment.
    *   *Clause diversity*: Moderate; highly consistent and structured.
    *   *Expected quality*: High compliance standards.
3.  **Public University Agreements**
    *   *Why valuable*: Public educational institution procurements containing structured IP, publication rights, and warranty clauses.
    *   *Supported domains*: IntellectualProperty, Warranty, GoverningLaw.
    *   *Clause diversity*: Medium; public policy-driven terms.
    *   *Expected quality*: Rigidly structured legal language.
4.  **Government Procurement Contracts**
    *   *Why valuable*: Public municipal and state purchasing files covering vendor requirements.
    *   *Supported domains*: Insurance, Termination, ServiceLevel.
    *   *Clause diversity*: High across service domains.
    *   *Expected quality*: Standard boilerplate forms.
5.  **Open-source Contributor Agreements (CLAs)**
    *   *Why valuable*: Standardized developer agreements governing contribution rights.
    *   *Supported domains*: IntellectualProperty, Assignment.
    *   *Clause diversity*: Low; highly focused licensing clauses.
    *   *Expected quality*: Clear, well-defined intellectual property vectors.
6.  **Public Data Processing Agreements (DPAs)**
    *   *Why valuable*: Standardized vendor processing terms reflecting international regulations.
    *   *Supported domains*: Notice, Confidentiality.
    *   *Clause diversity*: Moderate; structured regulatory requirements.
    *   *Expected quality*: Excellent for modeling statutory notifications.
7.  **Industry Standard Agreements & Standards Organizations**
    *   *Why valuable*: Consensus templates developed by trade groups (e.g., AIA for construction, ISDA for finance).
    *   *Supported domains*: ForceMajeure, Payment, Indemnification.
    *   *Clause diversity*: Low (standardized) but highly vetted.
    *   *Expected quality*: Canonical commercial benchmarks.
8.  **Model Commercial Contracts (e.g., ABA Model Contracts)**
    *   *Why valuable*: Vetted templates created by legal professional associations.
    *   *Supported domains*: Warranty, Liability, Termination.
    *   *Clause diversity*: Medium; represents fair negotiated baselines.
    *   *Expected quality*: Educational and semantic benchmark.

---

## 8. Contributor Playbook

Contributors adding legal knowledge must adhere to the following rules and principles:

### 8.1 Core Engineering Principle
> [!IMPORTANT]
> **Never encode legal intelligence inside JavaScript.**
> If a capability can be represented using ontology, phrases, templates, decision tables, rules, or benchmarks, implement it there instead of modifying runtime code.

### 8.2 Naming & ID Conventions
*   **Concepts**: `CONCEPT_` followed by uppercase snake_case (e.g., `CONCEPT_FORCE_MAJEURE`).
*   **Actions**: `ACTION_` followed by uppercase snake_case (e.g., `ACTION_WARRANT`).
*   **Entities**: `ENTITY_` followed by uppercase snake_case (e.g., `ENTITY_MONEY`).
*   **Rules**: `RULE_` followed by uppercase snake_case (e.g., `RULE_CONSENT_REQUIRED`).
*   **Decision Tables**: `DT_` followed by uppercase snake_case (e.g., `DT_ASSIGNMENT`).
*   **Templates/Intents**: `TPL_` or `INTENT_` respectively (e.g., `INTENT_PROHIBIT`, `TPL_AUTOMATIC_EXPIRATION`).

### 8.3 Repository-Specific Anti-patterns Discovered

1.  **Hardcoded Rules in JavaScript (Engine Level)**
    *   *Evidence*: The `universalRules.js` file contains hardcoded checks (e.g., checking if payment terms exceed 60 days directly in code: `data.paymentTermsDays > 60` or notice check `data.terminationNoticeDays < 15`).
    *   *Resolution*: Move these logical checks and thresholds into declarative rule structures (`rules.json`) and pass the thresholds dynamically.
2.  **Coupled Cross-Domain Concept References**
    *   *Evidence*: `Definitions/rules.json` references `"concept": "NOTICE"`, linking the Definitions rule to the Notice concept.
    *   *Resolution*: Declare a local concept representing defined terms and map the rule directly to it.
3.  **Inconsistent Domain Structures**
    *   *Evidence*: The `Definitions` source domain has custom dictionary files like `defined_terms.json` and `aliases.json` rather than the typical ontology structures (`concept.json`, `actions.json`).
    *   *Resolution*: Align files with the standard taxonomy, or declare them in `knowledge.json` mappings.
4.  **Mocked Verification traces**
    *   *Evidence*: Tests under `tests/integration/` (such as `definitions_runtime.test.js`) print mock logs and return hardcoded JSON trace outputs.
    *   *Resolution*: Do not modify this frozen test setup, but ensure new benchmarks use the engine execution paths.

---

## 9. Domain Expansion Priority

Proposed domains are sorted from highest ROI to lowest.

### 1. Warranty (Highest ROI)
*   **Why next**: High presence in commercial agreements; missing warranties present significant commercial risks.
*   **Dependencies**: None.
*   **Risk if postponed**: Platform fails to identify standard disclaimers, leaving customers open to "as-is" services without recourse.
*   **Enterprise value**: High; critical for software licensing and services contracts.
*   **Knowledge complexity**: Medium (focused vocabulary on representations and guarantees).
*   **Benchmark availability**: High (present in almost all public commercial contracts).
*   **Real-world contract availability**: High (SEC EDGAR MSAs/SaaS).

### 2. Force Majeure
*   **Why next**: Fundamental operational exit route during external disruption.
*   **Dependencies**: `Lifecycle`, `Termination`.
*   **Risk if postponed**: Inability to identify excusable performance delays or associated contract termination rights.
*   **Enterprise value**: Medium-High; critical for supply chain and procurement logistics.
*   **Knowledge complexity**: Low-Medium (standard list of excusable events).
*   **Benchmark availability**: High.
*   **Real-world contract availability**: High.

### 3. Audit Rights
*   **Why next**: Key compliance controls for service providers.
*   **Dependencies**: `Notice`, `Payment`.
*   **Risk if postponed**: Failure to detect overreaching cyber or financial audit covenants.
*   **Enterprise value**: Medium; governs administrative compliance constraints.
*   **Knowledge complexity**: Medium.
*   **Benchmark availability**: High (government schedules, vendor agreements).
*   **Real-world contract availability**: High.

### 4. Service Level Agreements (SLAs)
*   **Why next**: Core risk factor in SaaS contracts.
*   **Dependencies**: `Payment`, `Lifecycle`.
*   **Risk if postponed**: Inability to extract uptime commitments and credit reimbursement rights.
*   **Enterprise value**: High for SaaS buyers, but narrow scope (tech contracts).
*   **Knowledge complexity**: High (numerical thresholds and credit formulas).
*   **Benchmark availability**: Medium (SaaS product pages, public schedules).
*   **Real-world contract availability**: Medium.

### 5. Insurance (Lowest ROI)
*   **Why next**: Standard administrative exhibit in services agreements.
*   **Dependencies**: `Liability`, `Core`.
*   **Risk if postponed**: Operational failure to verify mandatory policy limits.
*   **Enterprise value**: Low-Medium (highly standard, rarely contested).
*   **Knowledge complexity**: Low (policy list and limits).
*   **Benchmark availability**: High.
*   **Real-world contract availability**: High.

---

## 10. Knowledge Acquisition Blueprint

For every proposed domain, the following blueprint establishes the acquisition pipeline:

```
  Knowledge Sources ➔ Phrase Extraction ➔ Rule & DT Authoring ➔ Regression & Benchmark Strategy ➔ Promotion Criteria
```

### 10.1 Normalization Strategy
All sourced clauses are normalized into linguistic tokens:
`[SUBJECT] -> [MODAL] -> [INTENT] -> [ACTION] -> [OBJECT] -> [CONSTRAINT]`

### 10.2 Domain Blueprints

#### 1. `Warranty` Domain
*   **Knowledge Sources**: SEC EDGAR Material contracts, public MSA templates.
*   **Ontology Additions**: `CONCEPT_WARRANTY`, `ACTION_WARRANT` (synonyms: "represent", "guarantee"), `objects.json` (software, services, deliverables).
*   **Phrase Extraction**: Match disclaimers ("as-is", "implied warranties of merchantability").
*   **Rule Authoring**: `RULE_WARRANTY_DISCLAIMER_PRESENT`, `RULE_IP_INFRINGEMENT_WARRANTY_MISSING`.
*   **Decision Tables**: `DT_WARRANTY_COMPLIANCE`.
*   **Benchmark Strategy**: Match warranty and disclaimer paragraphs across 10 sample MSAs.
*   **Regression Strategy**: Validate that adding warranties does not conflict with IP ownership rules.
*   **Promotion Criteria**: 98% extraction accuracy on warranty disclaimers.

#### 2. `ForceMajeure` Domain
*   **Knowledge Sources**: Public utility terms, supply agreements, standard NDA boilerplate.
*   **Ontology Additions**: `CONCEPT_FORCE_MAJEURE`, `ACTION_SUSPEND`, `objects.json` (obligations, performance).
*   **Phrase Extraction**: Capture excuse events ("acts of God", "war", "strikes", "epidemic").
*   **Rule Authoring**: `RULE_FORCE_MAJEURE_PRESENT`, `RULE_FORCE_MAJEURE_TERMINATION_CAP`.
*   **Decision Tables**: `DT_FORCE_MAJEURE`.
*   **Benchmark Strategy**: Match excusable delay caps across 10 vendor agreements.
*   **Regression Strategy**: Ensure zero overlaps with general lifecycle transition triggers.
*   **Promotion Criteria**: Correctly flags presence or absence of termination caps on excusable delay.

#### 3. `AuditRights` Domain
*   **Knowledge Sources**: Public software licensing agreements, consulting services agreements.
*   **Ontology Additions**: `CONCEPT_AUDIT`, `ACTION_INSPECT`, `objects.json` (records, accounts, systems, facilities).
*   **Phrase Extraction**: Match visit frequencies, audit notification timelines.
*   **Rule Authoring**: `RULE_AUDIT_RIGHTS_UNLIMITED`, `RULE_AUDIT_NOTICE_ADEQUATE`.
*   **Decision Tables**: `DT_AUDIT_RIGHTS`.
*   **Benchmark Strategy**: Extract notice timelines for inspection requests.
*   **Regression Strategy**: Validate notice rules do not trigger general notice alerts.
*   **Promotion Criteria**: Successfully detects audit notice limits.

#### 4. `ServiceLevel` Domain
*   **Knowledge Sources**: Cloud providers (AWS, Azure, GCP) SLAs, telecom agreements.
*   **Ontology Additions**: `CONCEPT_SERVICE_LEVEL`, `ACTION_MEASURE`, `objects.json` (uptime, availability, service credit).
*   **Phrase Extraction**: Match availability percentages, credit claims.
*   **Rule Authoring**: `RULE_SLA_CREDITS_UNLIMITED`, `RULE_SLA_UPTIME_THRESHOLD_LOW`.
*   **Decision Tables**: `DT_SERVICE_LEVEL_CREDITS`.
*   **Benchmark Strategy**: Extract SLA uptime percentages from SaaS policies.
*   **Regression Strategy**: Ensure credit calculations do not conflict with general payment rules.
*   **Promotion Criteria**: Accurate extraction of uptime targets.

#### 5. `Insurance` Domain
*   **Knowledge Sources**: Construction agreements, professional services contracts.
*   **Ontology Additions**: `CONCEPT_INSURANCE`, `objects.json` (policy, coverage, certificate, liability).
*   **Phrase Extraction**: Identify policy maintainers, coverage minimums.
*   **Rule Authoring**: `RULE_INSURANCE_REQUIREMENTS_MISSING`, `RULE_POLICY_TYPES_UNSPECIFIED`.
*   **Decision Tables**: `DT_INSURANCE_CHECK`.
*   **Benchmark Strategy**: Match policy limits on 10 construction service contracts.
*   **Regression Strategy**: Ensure zero false positives on liability exclusions.
*   **Promotion Criteria**: Verified identification of general liability policy checks.

---

## 11. Benchmark Expansion Plan

The benchmark expansion plan establishes the evaluation rules for verifying knowledge accuracy.

### 11.1 Benchmark Corpus Structure
For every new domain, the benchmark must include:
*   **Positive Cases**: Standard clauses representing standard terms (e.g., typical warranty disclaimers).
*   **Negative Cases**: Clauses missing elements entirely or explicitly stating exceptions.
*   **Edge Cases**: Clauses containing complex, conditional structures (e.g., "warranties apply unless third-party software is used").
*   **Malformed Contracts**: Badly parsed, truncated, or incomplete contract sections.
*   **Cross-domain interactions**: Paragraphs combining concepts (e.g., an audit clause triggering late payment penalties).

### 11.2 Regression Priorities
1.  **Definitions Integrity**: Adding vocabulary must not break capitalized term registration.
2.  **State Mismatch**: Lifecycle transitions must not conflict with Force Majeure suspension events.
3.  **Scope Creep**: IP licensing rules must not flag standard confidentiality exemptions.

---

## 12. Knowledge Quality Strategy

Without modifying the frozen runtime engine, the quality strategy introduces proposed offline tools to monitor knowledge health.

### 12.1 Metrics Definitions

*   **Ontology Completeness**:
    *   *Formula*: `(Mapped vocabulary nodes in graph) / (Total unique noun/verb tokens in corpus)`
*   **Phrase Coverage**:
    *   *Formula*: `(Successfully matched sentences) / (Total evaluation sentences)`
*   **Unused Rules**:
    *   *Formula*: Rules declared in `rules.json` that are never mapped by decision tables or triggered by templates.
*   **Dead Concepts**:
    *   *Formula*: Concepts declared in `concept.json` that have no rules, actions, or phrases referencing them.
*   **Broken References**:
    *   *Formula*: References to IDs that do not resolve to any node or rule.
*   **Circular References**:
    *   *Formula*: Relationships forming loops (`A -> relatesTo -> B -> relatesTo -> A`).
*   **Duplicate Phrases**:
    *   *Formula*: Multiple templates containing identical token lists.

### 12.2 Quality Tooling Classification

*   **Repository Evidence**: The current build system runs `validator.js` and `linter.js` during compilation, and outputs `reports/` logs.
*   **Knowledge Recommendation**: Ensure all domain rules link to active tests in `linkedTests`.
*   **Future Tooling (Offline Tools)**:
    1.  **Knowledge Dependency Linter**: A static analyzer checking that domains only import concepts listed in `metadata.json` dependencies.
    2.  **Orphan Concept Detector**: A script parsing compiled JSON bundle to report dead concepts and unused rule IDs.
    3.  **Cycle Validation Engine**: A DAG-based cycle checker checking relations graphs.
    4.  **Static Clause Parser**: An offline validator matching grammar templates against the benchmark corpus to compute statistical coverage.
    5.  **Quality Dashboard**: An offline generator producing summary HTML reports from the compilation metrics.
*   **Architecture Change Request**: None. All diagnostics and lint scripts are executed offline, outputting warnings to the build terminal without modifying the runtime evaluation engine.
