---
id: data-protection
version: 1.0
status: stable
priority: critical

category:
  - Privacy
  - Regulatory Compliance

aliases:
  - Data Protection
  - Privacy
  - Personal Data
  - Data Privacy
  - Data Security
  - Data Processing

jurisdictions:
  - US
  - UK
  - EU
  - India
  - Australia

industries:
  - SaaS
  - Healthcare
  - Finance
  - Technology
  - Commercial
  - Procurement
  - Government

related_clauses:
  - Definitions
  - Confidentiality
  - Intellectual Property
  - Security
  - Audit Rights
  - Indemnity
  - Limitation of Liability
  - Termination
  - Notices

---

# Data Protection Clause

## Purpose

Define how personal data is collected, processed, stored, transferred,
protected, retained, and deleted while complying with applicable privacy laws.

Unlike confidentiality, data protection governs regulated personal information
and statutory obligations rather than merely confidential business information.

---

# Primary Legal Functions

- Privacy Protection
- Regulatory Compliance
- Security Governance
- Data Processing
- Data Lifecycle Management
- Cross-Border Transfer
- Incident Management
- Accountability

---

# Core Components

## Data Categories

Possible values

- Personal Data
- Sensitive Personal Data
- Customer Data
- Employee Data
- Financial Data
- Health Data
- Biometric Data
- Government Identifiers
- Anonymous Data
- Aggregated Data
- Metadata

---

## Processing Role

Possible values

- Controller
- Processor
- Joint Controller
- Subprocessor

---

## Processing Activities

Examples

- Collection
- Storage
- Access
- Use
- Analysis
- Sharing
- Transfer
- Deletion
- Backup
- Archiving

---

## Processing Purpose

Examples

- Service Delivery
- Billing
- Compliance
- Security
- Analytics
- Customer Support
- Legal Obligation

---

## Lawful Basis

Possible values

- Consent
- Contract
- Legal Obligation
- Legitimate Interest
- Vital Interest
- Public Interest

---

## Security Measures

Examples

- Encryption
- Access Control
- MFA
- Logging
- Monitoring
- Firewalls
- Backup
- Disaster Recovery
- Vulnerability Management

---

## Cross-Border Transfers

Possible values

- Allowed
- Restricted
- Adequacy Decision
- SCC
- BCR
- Customer Approval Required

---

## Data Retention

Possible values

- Fixed Period
- Legal Requirement
- Until Termination
- Customer Controlled

---

## Data Deletion

Possible values

- Immediate
- Upon Request
- Scheduled
- Certified Destruction
- Archive Exception

---

## Data Breach

Possible values

- Immediate Notice
- 24 Hours
- 48 Hours
- 72 Hours
- Without Undue Delay

---

## Audit Rights

Possible values

- Customer Audit
- Third-Party Audit
- SOC 2
- ISO 27001
- Independent Assessment

---

## Subprocessors

Possible values

- Allowed
- Approval Required
- Notice Required
- Restricted
- Prohibited

---

# Standard Exceptions

Common exceptions

- Anonymous Data
- Aggregated Data
- Public Information
- Legal Obligation
- Court Orders
- Regulatory Requests
- Fraud Investigation
- Security Monitoring

---

# Common Drafting Variations

## GDPR Style

Strong controller/processor separation.

---

## US Commercial

Security-focused.

---

## Healthcare

Patient information protections.

---

## Financial Services

Regulatory reporting and financial record protection.

---

## Government

Data residency and sovereign storage.

---

## AI / ML

Training restrictions.

Model improvement restrictions.

Prompt retention.

Inference data.

---

# Linguistic Variations

Common wording

- process personal data
- customer data
- controller
- processor
- subprocessors
- security measures
- technical and organizational measures
- privacy laws
- delete
- retain
- anonymize
- pseudonymize
- cross-border transfer
- security incident
- personal information

---

# Semantic Signals

Core concepts

- PERSONAL_DATA
- CONTROLLER
- PROCESSOR
- SUBPROCESSOR
- PROCESSING
- CONSENT
- SECURITY
- ENCRYPTION
- RETENTION
- DELETION
- BREACH
- CROSS_BORDER_TRANSFER
- AUDIT
- DATA_SUBJECT
- ANONYMIZATION

---

# Mandatory Components

Essential elements

- Data Definition
- Processing Role
- Processing Purpose
- Security Measures
- Breach Notification
- Retention
- Deletion
- Audit Rights

---

# Missing Component Risks

Missing Processing Role

Risk

Responsibilities unclear.

Recommendation

Define controller and processor.

---

Missing Security Measures

Risk

Weak protection.

Recommendation

Specify technical safeguards.

---

Missing Breach Notification

Risk

Delayed incident response.

Recommendation

Define reporting timelines.

---

Missing Retention Policy

Risk

Indefinite storage.

Recommendation

Specify retention period.

---

Missing Cross-Border Rules

Risk

Regulatory exposure.

Recommendation

Define transfer mechanism.

---

# Positive Signals

- Encryption
- MFA
- Audit rights
- Data minimization
- Defined retention
- Secure deletion
- Processor obligations
- Customer approval for subprocessors
- Breach notification

---

# Risk Signals

- Unlimited retention
- No deletion
- Unlimited AI training rights
- Broad customer data license
- Unlimited subprocessor use
- No encryption
- No breach notice
- No audit rights
- No transfer controls
- Data ownership unclear

---

# Dependency Graph

Depends On

- Definitions
- Confidentiality
- Security
- Notices
- Termination

Modifies

- Audit Rights
- Indemnity
- Liability
- Customer Rights
- Data Handling

Supports

- Regulatory Compliance
- Privacy
- Security

Overrides

- General confidentiality obligations where privacy law requires stricter protection.

---

# Jurisdiction Notes

## EU

GDPR concepts dominate.

Controller/Processor distinction is critical.

---

## UK

UK GDPR mirrors many EU concepts.

---

## US

State privacy laws vary.

Security obligations often emphasized.

---

## India

Digital Personal Data Protection Act influences commercial drafting.

---

## Australia

Privacy Act requirements commonly reflected.

---

# Industry Notes

## SaaS

Customer data

Cloud storage

Subprocessors

AI processing

---

## Healthcare

PHI

Medical records

Patient privacy

---

## Finance

Financial records

Transaction history

AML-related data

---

## Government

Data residency

Citizen records

Security clearances

---

# Findings Template

Finding

Customer approval required before adding subprocessors.

Risk

Low

Reason

Strong governance.

Recommendation

None.

---

Finding

Unlimited right to use customer data for AI training.

Risk

Critical

Reason

Exceeds ordinary commercial expectations.

Recommendation

Limit AI training to anonymized or expressly approved data.

---

Finding

No breach notification timeline.

Risk

High

Reason

Delayed incident response.

Recommendation

Specify notification period.

---

# Rule Ideas

IF

No breach notification

THEN

High Risk

---

IF

Unlimited retention

THEN

High Risk

---

IF

Customer data may be used for AI training

AND

No express consent

THEN

Critical Risk

---

IF

Subprocessors unrestricted

AND

No notice

THEN

Medium Risk

---

IF

No deletion obligation

THEN

Medium Risk

---

# Test Scenarios

Scenario

GDPR-compliant processor clause.

Expected Finding

Strong privacy controls.

Expected Risk

Low

---

Scenario

Unlimited AI training rights.

Expected Finding

Overbroad data usage.

Expected Risk

Critical

---

Scenario

No deletion policy.

Expected Finding

Retention ambiguity.

Expected Risk

High

---

Scenario

No encryption.

Expected Finding

Weak security controls.

Expected Risk

Medium

---

# Cross-Clause Relationships

## Confidentiality

Privacy obligations are generally stricter than confidentiality obligations.

---

## Intellectual Property

Ownership of software differs from ownership of customer data.

---

## Indemnity

Privacy breaches often trigger dedicated indemnities.

---

## Limitation of Liability

Privacy obligations are commonly carved out or subject to higher liability caps.

---

## Termination

Triggers deletion, return, or retention obligations.

---

## Notices

Breach notifications depend on notice procedures.

---

## Audit Rights

Privacy compliance often grants audit rights.

---

## Security

Security measures implement privacy obligations.

---

# Research Sources

- GDPR
- UK GDPR
- Indian Digital Personal Data Protection Act
- Australian Privacy Act
- US state privacy laws
- Data Processing Agreements
- SaaS Master Service Agreements
- Healthcare agreements
- Financial services agreements
- Commercial privacy practice guides