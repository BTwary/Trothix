---
id: confidentiality
version: 1.0
status: stable
priority: critical

category:
  - Information Protection
  - Risk Allocation

aliases:
  - Non-Disclosure
  - NDA
  - Confidentiality
  - Confidential Information
  - Proprietary Information
  - Trade Secrets

jurisdictions:
  - US
  - UK
  - India
  - Australia
  - EU

industries:
  - SaaS
  - Procurement
  - Employment
  - Consulting
  - Technology
  - Healthcare
  - Finance

related_clauses:
  - Data Protection
  - Intellectual Property
  - Survival
  - Injunctive Relief
  - Assignment
  - Return of Materials

---

# Confidentiality Clause

## Purpose

Protect confidential information from unauthorized use, disclosure, copying,
distribution, or retention while allowing necessary business use.

Unlike Data Protection, confidentiality applies to **all confidential
information**, not only personal data.

---

# Primary Legal Functions

- Protect confidential information
- Preserve trade secrets
- Restrict disclosure
- Restrict use
- Define permitted recipients
- Require safeguarding
- Provide remedies
- Survive termination

---

# Core Components

## Protected Information

Possible values

- Confidential Information
- Proprietary Information
- Trade Secrets
- Technical Information
- Business Information
- Financial Information
- Commercial Information
- Customer Information
- Product Information
- Source Code
- Documentation

---

## Definition Type

Possible meanings

- Broad
- Narrow
- Enumerated
- Catch-all
- Hybrid

---

## Receiving Party

Examples

- Customer
- Vendor
- Employee
- Consultant
- Affiliate
- Contractor

---

## Disclosing Party

Examples

- Customer
- Vendor
- Employer
- Client

---

## Permitted Use

Common meanings

- Perform Agreement
- Evaluate Transaction
- Internal Business Purpose
- Regulatory Compliance
- Legal Advice

---

## Permitted Recipients

Examples

- Employees
- Officers
- Directors
- Affiliates
- Professional Advisers
- Auditors
- Regulators
- Courts

---

## Protection Obligations

Typical duties

- Keep confidential
- Prevent disclosure
- Prevent copying
- Prevent misuse
- Maintain safeguards
- Restrict access
- Apply reasonable security

---

## Return or Destruction

Typical options

- Return documents
- Destroy documents
- Delete electronic copies
- Certify destruction
- Retain archival copy

---

## Survival

Possible values

- Fixed period
- Trade Secret survives indefinitely
- Survives termination
- No survival

---

# Standard Exceptions

Common carve-outs

- Public information
- Already known
- Independently developed
- Third-party lawful disclosure
- Court order
- Regulatory disclosure
- Written consent
- Required by law

---

# Common Drafting Variations

## Mutual

Both parties disclose information.

---

## One-Way

Only one party discloses.

---

## Employment

Focus

- Trade secrets
- Customer lists
- Internal processes

---

## SaaS

Focus

- Customer Data
- Source Code
- Security
- Product Roadmap

---

## Procurement

Focus

- Pricing
- Manufacturing
- Specifications
- Vendor Information

---

## M&A

Focus

- Due diligence
- Financial records
- Customer pipeline
- Acquisition strategy

---

# Linguistic Variations

Common wording

- shall keep confidential
- agrees to keep confidential
- must not disclose
- shall not disclose
- may disclose only
- except as permitted
- subject to applicable law
- without prior written consent
- strictly confidential
- confidential in nature

---

# Semantic Signals

Trothix should normalize concepts rather than phrases.

Core concepts

- CONFIDENTIAL_INFORMATION
- RECEIVING_PARTY
- DISCLOSING_PARTY
- PERMITTED_USE
- PERMITTED_DISCLOSURE
- REQUIRED_DISCLOSURE
- EXCEPTION
- RETURN_OBLIGATION
- DESTRUCTION_OBLIGATION
- SURVIVAL
- INJUNCTIVE_RELIEF

---

# Mandatory Components

Essential elements

- Definition
- Protected information
- Receiving party
- Disclosure restriction
- Use restriction
- Exceptions
- Permitted recipients
- Return/Destruction
- Survival

---

# Missing Component Risks

Missing Definition

Risk

Ambiguous scope

---

Missing Exceptions

Risk

Overly broad restriction

---

Missing Survival

Risk

Protection ends with agreement

---

Missing Return Clause

Risk

Information retained indefinitely

---

Missing Permitted Disclosure

Risk

Cannot legally disclose to advisers or regulators

---

# Positive Signals

- Mutual confidentiality
- Narrow definition
- Clear exceptions
- Written notice
- Return obligation
- Destruction obligation
- Trade secret survival
- Reasonable security standard

---

# Risk Signals

- Unlimited confidentiality period
- No exceptions
- No return obligation
- No destruction obligation
- Extremely broad definition
- Includes all information
- No permitted disclosure
- No regulatory carve-out
- Oral information automatically confidential
- Retroactive confidentiality

---

# Dependency Graph

Depends On

- Definitions
- Data Protection
- Intellectual Property
- Governing Law

Modifies

- Assignment
- Data Sharing
- Disclosure Rights
- Return of Materials

Supports

- Trade Secret Protection
- Privacy Compliance
- Security Obligations

---

# Jurisdiction Notes

US

Trade secret heavy.

Often includes injunctive relief.

---

UK

Generally narrower drafting.

Often references equitable remedies.

---

India

Frequently references applicable law and statutory obligations.

---

Australia

Modern plain-English drafting.

Strong emphasis on reasonable protection.

---

EU

Frequently overlaps with GDPR obligations.

---

# Industry Notes

SaaS

Customer data, APIs, source code.

---

Employment

Employee know-how, trade secrets.

---

Healthcare

PHI overlap.

---

Finance

Customer financial information.

---

Procurement

Manufacturing processes.

---

# Findings Template

Finding

No confidentiality exception for legal disclosure.

Risk

Medium

Reason

Receiving party may be unable to comply with legal obligations.

Recommendation

Add a required-by-law disclosure exception.

---

# Rule Ideas

IF

No confidentiality definition

THEN

High Risk

---

IF

No exceptions

THEN

Medium Risk

---

IF

No return clause

AND

No destruction clause

THEN

Medium Risk

---

IF

Trade secrets included

AND

No survival

THEN

High Risk

---

# Test Scenarios

Balanced NDA

Expected

Low Risk

---

Broad definition with no exceptions

Expected

High Risk

---

Missing survival

Expected

Medium Risk

---

No permitted disclosure

Expected

Medium Risk

---

Mutual confidentiality with standard carve-outs

Expected

Low Risk

---

# Cross-Clause Relationships

Data Protection

Personal data obligations are stricter than confidentiality.

---

Intellectual Property

Confidential information does not transfer ownership.

---

Termination

Confidentiality usually survives termination.

---

Injunctive Relief

Confidentiality breaches frequently allow equitable remedies.

---

Return of Materials

Often activated immediately after termination.

---

# Research Sources

- Common-law commercial practice
- NDAs
- SaaS agreements
- Employment agreements
- Procurement contracts
- Government contract templates
- Legal drafting guides