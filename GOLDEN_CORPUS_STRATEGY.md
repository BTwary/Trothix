# Trothix Golden Corpus Sourcing Strategy

This document establishes the acquisition and curation strategy for the Trothix Golden Corpus. It lists targeted public and commercial source categories to drive deterministic legal grammar expansion.

---

## 1. Corpus Sourcing Categories

### 1.1 Commercial Contracts (SEC EDGAR Exhibit 10)
*   `[Repository Evidence]` The repository currently uses SEC EDGAR filings as the baseline source for NDA and Lease dictionary vocabulary.
*   *Expected Clause Quality*: High (Negotiated by corporate legal teams).
*   *Expected Legal Diversity*: Extremely High (Varies across industry verticals).
*   *Expected Deterministic Value*: High (Ideal for mapping standard templates and intent synonyms).
*   *Licensing Concerns*: Public domain (public SEC disclosures).
*   *Recommended Priority*: Priority 1.

### 1.2 Government Contracts (GSA / Federal Procurement)
*   `[Repository Evidence]` Standardized clauses mapped in GSA schedules.
*   *Expected Clause Quality*: High (Rigidly drafted, highly consistent).
*   *Expected Legal Diversity*: Low (Highly standardized federal boilerplates).
*   *Expected Deterministic Value*: High (Excellent for auditing strict, non-negotiable clauses like audit limits or payment timelines).
*   *Licensing Concerns*: Public domain (US Government works).
*   *Recommended Priority*: Priority 1.

### 1.3 University Contracts (Higher Education Procurement)
*   `[Repository Evidence]` Procurement files published by state/public universities.
*   *Expected Clause Quality*: Medium-High (Presents specific academic and liability carve-outs).
*   *Expected Legal Diversity*: Medium (Standard state education forms).
*   *Expected Deterministic Value*: High (Provides unique structures for IP ownership and publication permissions).
*   *Licensing Concerns*: Subject to public records laws.
*   *Recommended Priority*: Priority 2.

### 1.4 Cloud Providers (SaaS/IaaS SLAs)
*   `[Repository Evidence]` Standard public SLA sheets published by cloud infrastructure firms.
*   *Expected Clause Quality*: High (Commercially protective).
*   *Expected Legal Diversity*: Low (Highly standard uptime credits formulas).
*   *Expected Deterministic Value*: Extremely High (Ideal for mapping ServiceLevel domain templates).
*   *Licensing Concerns*: Public commercial documentation (fair use limits apply for offline training/linting).
*   *Recommended Priority*: Priority 1 (for SLAs).

### 1.5 OSS Licenses (Open Source Initiative Registry)
*   `[Repository Evidence]` Canonical registries of standardized OSS terms (MIT, Apache, GPL).
*   *Expected Clause Quality*: High (Vetted by legal scholars).
*   *Expected Legal Diversity*: Low (Static text templates).
*   *Expected Deterministic Value*: High (Allows exact matching without complex synonyms).
*   *Licensing Concerns*: Open source (requires attribution lists).
*   *Recommended Priority*: Priority 2.

### 1.6 Contributor Agreements (Developer CLAs)
*   `[Repository Evidence]` Standard corporate developer contribution agreements (e.g. Google CLA).
*   *Expected Clause Quality*: High.
*   *Expected Legal Diversity*: Low (Focused entirely on IP transfers and patent licenses).
*   *Expected Deterministic Value*: High (Excellent for validation of clear IP assignments).
*   *Licensing Concerns*: Public corporate policies.
*   *Recommended Priority*: Priority 2.

### 1.7 Procurement Agreements (Standard MSA/Purchase Order Terms)
*   `[Repository Evidence]` Corporate vendor terms and purchasing templates.
*   *Expected Clause Quality*: Medium-High (Commercial-focused).
*   *Expected Legal Diversity*: High (Covers payment cycles, delivery, and inspection rules).
*   *Expected Deterministic Value*: High (Maps payment and audit rights rules).
*   *Licensing Concerns*: Proprietary vendor terms (requires anonymization before incorporation).
*   *Recommended Priority*: Priority 1.

### 1.8 Healthcare Contracts (Business Associate Agreements / BAAs)
*   `[Repository Evidence]` HIPAA compliance templates and hospital service terms.
*   *Expected Clause Quality*: High (HIPAA compliance-driven).
*   *Expected Legal Diversity*: Low (Dictated by regulatory requirements).
*   *Expected Deterministic Value*: Medium-High (Focuses on breach notifications and data boundaries).
*   *Licensing Concerns*: Subject to privacy regulations (strict anonymization required).
*   *Recommended Priority*: Priority 3.

### 1.9 Construction Contracts (AIA Standard Forms)
*   `[Repository Evidence]` Consensus industry agreements (e.g., AIA A201 General Conditions).
*   *Expected Clause Quality*: Very High (Vetted by multi-party trade groups).
*   *Expected Legal Diversity*: Low-Medium (highly standard formats).
*   *Expected Deterministic Value*: High (Maps payment, force majeure delays, and insurance covenants).
*   *Licensing Concerns*: Proprietary copyright formats (AIA forms require license or mock recreation).
*   *Recommended Priority*: Priority 3.

### 1.10 Finance Agreements (ISDA Master Agreements)
*   `[Repository Evidence]` Standard transactional and derivative master forms.
*   *Expected Clause Quality*: High (Sophisticated institutional drafting).
*   *Expected Legal Diversity*: Low (AIA/ISDA boilerplate).
*   *Expected Deterministic Value*: High (Excellent for defaults and state transitions).
*   *Licensing Concerns*: Proprietary formats.
*   *Recommended Priority*: Priority 3.

### 1.11 Employment Agreements (Executive/Consulting Offers)
*   `[Repository Evidence]` Publicly filed executive compensation and consulting contracts.
*   *Expected Clause Quality*: Medium-High.
*   *Expected Legal Diversity*: High (Includes non-competes, IP assignments, and termination cure rules).
*   *Expected Deterministic Value*: High (Maps definitions and IP boundaries).
*   *Licensing Concerns*: Public record when filed in SEC Exhibit 10.
*   *Recommended Priority*: Priority 2.

### 1.12 International Agreements (Model DPAs/SCCs)
*   `[Repository Evidence]` Canonical templates like EU Standard Contractual Clauses (SCCs).
*   *Expected Clause Quality*: High (Regulatory compliance standard).
*   *Expected Legal Diversity*: Low (Fixed regulatory templates).
*   *Expected Deterministic Value*: Extremely High (Ideal for notices and cross-border data transfer checks).
*   *Licensing Concerns*: Public regulatory text.
*   *Recommended Priority*: Priority 2.

---

## 2. Strategic Recommendations

*   `[Knowledge Recommendation]` Prioritize SEC EDGAR and GSA procurement contracts first as they provide high diversity with zero licensing concerns.
*   `[Future Tooling]` Create an offline parser to scan text files for AIA or ISDA standard headers to flag proprietary templates during ingest.
*   `[Architecture Change Request]` None. Sourcing text files is an offline data curation process that does not change the parser or engine runtime.
