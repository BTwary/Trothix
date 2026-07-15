---
id: insurance
version: 1.0
status: stable
priority: critical

category:
  - Risk Management
  - Financial Protection

aliases:
  - Insurance
  - Insurance Requirements
  - Coverage
  - Insurance Obligations
  - Liability Insurance

jurisdictions:
  - US
  - UK
  - India
  - Australia
  - EU

industries:
  - Commercial
  - SaaS
  - Technology
  - Procurement
  - Construction
  - Healthcare
  - Finance

related_clauses:
  - Indemnity
  - Limitation of Liability
  - Data Protection
  - Intellectual Property
  - Warranties
  - Termination
  - Audit Rights
---

# Insurance Clause

## Purpose

Require one or both parties to maintain specified insurance coverage to support
their contractual obligations and financial liabilities.

Insurance reduces financial risk by ensuring resources are available to satisfy
covered claims.

---

# Primary Legal Functions

- Financial Protection
- Risk Transfer
- Contract Security
- Loss Recovery
- Regulatory Compliance
- Commercial Assurance

---

# Core Components

## Insured Party

Possible values

- Vendor
- Customer
- Supplier
- Contractor
- Consultant
- Both Parties

---

## Required Coverage

Common policies

- Commercial General Liability
- Professional Liability
- Errors and Omissions
- Cyber Liability
- Product Liability
- Workers' Compensation
- Employers' Liability
- Automobile Liability
- Property Insurance
- Directors and Officers Liability

---

## Coverage Amount

Possible values

- Fixed Amount
- Per Occurrence
- Aggregate Limit
- Unlimited
- Industry Standard

Examples

- USD 1,000,000 per occurrence
- USD 5,000,000 aggregate

---

## Policy Type

Possible values

- Claims Made
- Occurrence Based

---

## Coverage Period

Possible values

- Contract Term
- Fixed Years
- Survival Period
- Tail Coverage

---

## Additional Insured

Possible values

- Required
- Optional
- Not Required

---

## Certificate of Insurance

Possible values

- Required Before Work
- Upon Request
- Annual Renewal
- Not Required

---

## Waiver of Subrogation

Possible values

- Required
- Optional
- Silent

---

## Primary / Excess Coverage

Possible values

- Primary
- Excess
- Primary and Non-Contributory
- Silent

---

## Deductible / SIR

Possible values

- Allowed
- Maximum Limit
- Approval Required

---

## Insurer Rating

Possible values

- AM Best A-
- Investment Grade
- Licensed Insurer
- Financially Stable

---

## Cancellation Notice

Possible values

- 30 Days
- 60 Days
- Immediate
- Prior Written Notice

---

# Standard Exceptions

Common exceptions

- Intentional Misconduct
- Criminal Acts
- Fraud
- War
- Nuclear Risks
- Certain Cyber Events
- Contractually Excluded Risks

---

# Common Drafting Variations

## General Commercial

General liability only.

---

## SaaS

Cyber liability

Technology E&O

Privacy liability

---

## Construction

General liability

Workers' compensation

Builder's risk

Automobile liability

---

## Healthcare

Medical malpractice

Cyber liability

Professional liability

---

## Financial Services

Professional liability

Cyber

Crime insurance

---

# Linguistic Variations

Common wording

- maintain insurance
- procure insurance
- keep in force
- additional insured
- certificate of insurance
- commercially reasonable insurance
- primary and non-contributory
- waiver of subrogation
- claims-made
- occurrence

---

# Semantic Signals

Core concepts

- INSURANCE
- COVERAGE
- POLICY
- ADDITIONAL_INSURED
- CERTIFICATE_OF_INSURANCE
- SUBROGATION
- CLAIMS_MADE
- OCCURRENCE
- DEDUCTIBLE
- COVERAGE_LIMIT
- CANCELLATION_NOTICE

---

# Mandatory Components

Essential elements

- Required Coverage
- Coverage Limits
- Coverage Period
- Certificate Requirement
- Cancellation Notice

---

# Missing Component Risks

Missing Coverage Type

Risk

Insurance obligation unclear.

Recommendation

Specify required policies.

---

Missing Coverage Amount

Risk

Insufficient protection.

Recommendation

Define minimum limits.

---

Missing Additional Insured

Risk

Counterparty may lack direct protection.

Recommendation

Specify whether additional insured status is required.

---

Missing Certificate Requirement

Risk

Coverage cannot be verified.

Recommendation

Require proof before work begins.

---

Missing Cancellation Notice

Risk

Coverage may lapse without warning.

Recommendation

Require advance notice of cancellation.

---

# Positive Signals

- Clearly defined policy types
- Adequate limits
- Additional insured
- Certificate of insurance
- Waiver of subrogation
- Tail coverage
- Financially strong insurer

---

# Risk Signals

- No insurance requirement
- Coverage limits omitted
- Cyber insurance absent for SaaS
- Professional liability absent
- No cancellation notice
- No proof of insurance
- Self-insurance without safeguards
- Claims-made policy with no tail coverage

---

# Dependency Graph

Depends On

- Indemnity
- Limitation of Liability
- Definitions

Modifies

- Financial Recovery
- Risk Allocation
- Third-Party Claims

Supports

- Indemnity
- Litigation Defense
- Business Continuity

Conflicts With

- Uninsured indemnity obligations

Overrides

- None

---

# Jurisdiction Notes

## US

Additional insured and waiver of subrogation are common commercial requirements.

---

## UK

Professional indemnity insurance frequently required in services agreements.

---

## India

Coverage requirements vary significantly by industry and regulation.

---

## Australia

Commercial contracts often specify minimum policy limits.

---

## EU

Insurance obligations may interact with mandatory regulatory requirements.

---

# Industry Notes

## SaaS

Typical policies

- Cyber
- Technology E&O
- General Liability

---

## Construction

Typical policies

- CGL
- Builder's Risk
- Workers' Compensation
- Auto Liability

---

## Healthcare

Typical policies

- Medical Malpractice
- Cyber
- Professional Liability

---

## Finance

Typical policies

- Crime
- Cyber
- Professional Liability

---

# Findings Template

Finding

Cyber liability insurance required with USD 5 million coverage.

Risk

Low

Reason

Appropriate protection for technology services.

Recommendation

None.

---

Finding

Professional liability insurance omitted.

Risk

High

Reason

Professional negligence may be uninsured.

Recommendation

Require professional liability coverage.

---

Finding

Claims-made policy with no tail coverage.

Risk

Medium

Reason

Claims after policy expiration may be uncovered.

Recommendation

Require extended reporting period.

---

# Rule Ideas

IF

Indemnity exists

AND

Insurance absent

THEN

High Risk

---

IF

Cyber services

AND

Cyber insurance absent

THEN

High Risk

---

IF

Claims-made policy

AND

No tail coverage

THEN

Medium Risk

---

IF

Certificate of insurance not required

THEN

Medium Risk

---

IF

Coverage limits undefined

THEN

High Risk

---

# Test Scenarios

Scenario

Vendor maintains CGL and Cyber insurance.

Expected Finding

Balanced commercial coverage.

Expected Risk

Low

---

Scenario

Unlimited indemnity with no insurance.

Expected Finding

Financial exposure unsupported.

Expected Risk

High

---

Scenario

Claims-made policy without tail.

Expected Finding

Coverage gap.

Expected Risk

Medium

---

Scenario

Additional insured required.

Expected Finding

Enhanced customer protection.

Expected Risk

Low

---

# Cross-Clause Relationships

## Indemnity

Insurance provides the financial backing for indemnity obligations.

---

## Limitation of Liability

Insurance limits should align with liability caps.

---

## Data Protection

Cyber insurance supports privacy and breach obligations.

---

## Intellectual Property

Technology E&O may respond to IP-related claims.

---

## Warranties

Insurance may cover certain warranty-related losses depending on the policy.

---

## Termination

Insurance obligations may survive termination for a defined period.

---

# Research Sources

- Commercial insurance drafting guides
- Construction contract insurance standards
- SaaS Master Service Agreements
- Professional services agreements
- Law firm practice notes
- Comparative commercial insurance guidance