---
id: security
version: 1.0
status: stable
priority: critical

category:
  - Security
  - Operational Controls

aliases:
  - Information Security
  - Security Requirements
  - Cybersecurity
  - Security Controls
  - Information Assurance

jurisdictions:
  - US
  - UK
  - India
  - Australia
  - EU

industries:
  - SaaS
  - Technology
  - Healthcare
  - Finance
  - Government
  - Commercial

related_clauses:
  - Data Protection
  - Confidentiality
  - Audit Rights
  - Insurance
  - Service Levels
  - Termination
  - Change Control
---

# Security Clause

## Purpose

Define the technical, organizational, administrative, and operational security
measures required to protect systems, services, networks, and information.

Unlike Data Protection, security governs **how assets are protected**, not
whether personal information may legally be processed.

---

# Primary Legal Functions

- Information Security
- Cybersecurity
- Operational Protection
- Risk Reduction
- Regulatory Compliance
- Incident Management
- Business Continuity

---

# Core Components

## Security Program

Possible values

- Information Security Program
- Cybersecurity Framework
- Internal Security Policy

---

## Administrative Controls

Examples

- Security Training
- Background Checks
- Least Privilege
- Access Reviews
- Security Policies

---

## Technical Controls

Examples

- Encryption
- MFA
- IAM
- Network Segmentation
- IDS
- IPS
- Endpoint Protection
- Firewalls
- WAF

---

## Operational Controls

Examples

- Backup
- Disaster Recovery
- Patch Management
- Vulnerability Management
- Change Management
- Monitoring

---

## Authentication

Possible values

- MFA
- Password Policy
- SSO
- Hardware Keys

---

## Encryption

Possible values

- At Rest
- In Transit
- End-to-End
- Key Management

---

## Logging

Examples

- Audit Logs
- Security Logs
- Access Logs
- Retention Period

---

## Incident Response

Possible values

- 24 Hour Notification
- 48 Hour Notification
- 72 Hour Notification
- Immediate

---

## Business Continuity

Possible values

- BCP
- DR Plan
- RTO
- RPO

---

## Certifications

Examples

- ISO 27001
- SOC 2
- PCI DSS
- HIPAA
- NIST CSF

---

## Security Testing

Examples

- Penetration Testing
- Vulnerability Scanning
- Red Team
- Independent Assessment

---

## Subcontractor Security

Possible values

- Equivalent Controls
- Flow-down Obligations
- Annual Review

---

# Standard Exceptions

Common exceptions

- Force Majeure
- Zero-Day Vulnerabilities
- Customer Misconfiguration
- Third-Party Infrastructure Failures

---

# Common Drafting Variations

## Enterprise Security

Detailed technical controls.

---

## Cloud Security

Shared responsibility model.

---

## Financial Services

Enhanced operational resilience.

---

## Healthcare

Patient information security.

---

## Government

National security controls.

---

# Linguistic Variations

Common wording

- reasonable security
- appropriate technical measures
- organizational measures
- information security
- cybersecurity
- protect systems
- security controls
- encryption
- access controls
- incident response

---

# Semantic Signals

Core concepts

- SECURITY
- ENCRYPTION
- MFA
- IAM
- INCIDENT
- LOGGING
- BACKUP
- DR
- RTO
- RPO
- VULNERABILITY
- PATCHING
- CERTIFICATION

---

# Mandatory Components

Essential elements

- Security Controls
- Incident Response
- Encryption
- Authentication
- Monitoring
- Business Continuity

---

# Missing Component Risks

Missing Encryption

Risk

Sensitive information exposed.

Recommendation

Require encryption at rest and in transit.

---

Missing Incident Response

Risk

Delayed security handling.

Recommendation

Define incident response process.

---

Missing Authentication

Risk

Weak access controls.

Recommendation

Require MFA.

---

Missing Business Continuity

Risk

Extended outages.

Recommendation

Maintain disaster recovery capability.

---

# Positive Signals

- MFA
- Encryption
- ISO 27001
- SOC 2
- Logging
- Monitoring
- Annual penetration testing
- Vulnerability management

---

# Risk Signals

- No MFA
- Weak passwords
- No encryption
- No logging
- No security testing
- No incident response
- Shared accounts
- No backup

---

# Dependency Graph

Depends On

- Data Protection
- Audit Rights
- Insurance
- Service Levels

Modifies

- Operational Risk
- Privacy
- Incident Handling
- Compliance

Supports

- Confidentiality
- Business Continuity
- Cyber Resilience

---

# Cross-Clause Relationships

## Data Protection

Security implements privacy obligations.

---

## Audit Rights

Security controls are commonly audited.

---

## Insurance

Cyber insurance depends on security posture.

---

## Service Levels

Security incidents may affect SLA calculations.

---

## Termination

Material security failures may justify termination.

---

## Change Control

Infrastructure changes must preserve security controls.

---

# Rule Ideas

IF

No MFA

THEN

High Risk

---

IF

No Encryption

THEN

Critical Risk

---

IF

No Incident Response

THEN

High Risk

---

IF

No Backup

THEN

Medium Risk

---

IF

Security Clause

AND

No Audit Rights

THEN

Medium Risk