---
id: risk-patterns
version: 1.0
status: stable
priority: critical

category:
  - Knowledge Standard
  - Risk Taxonomy

applies_to:
  - All Clause Packs

compiler:
  exported: true
---

#  Risk Patterns

## Purpose

Define a canonical library of legal and commercial risk patterns that may be
referenced by any clause pack.

Clause packs should reference these risk identifiers instead of creating
new, clause-specific wording whenever possible.

---

# Risk Categories

## Missing Information

### MISSING_DEFINITION

Description

Required defined term is absent.

Typical Impact

- Ambiguity
- Interpretation disputes

Severity

Medium

---

### MISSING_PARTY

Description

Responsible party is not identified.

Severity

High

---

### MISSING_SCOPE

Description

Obligation does not define its scope.

Severity

High

---

### MISSING_DURATION

Description

Time period or survival period omitted.

Severity

Medium

---

### MISSING_TRIGGER

Description

Event activating an obligation is undefined.

Severity

High

---

### MISSING_REMEDY

Description

Clause provides obligation but no consequence.

Severity

Medium

---

### MISSING_EXCEPTION

Description

No exceptions or carve-outs defined.

Severity

Medium

---

### MISSING_APPROVAL_PROCESS

Description

Required approvals are undefined.

Severity

Medium

---

### MISSING_NOTICE_REQUIREMENT

Description

Notice procedure absent.

Severity

Medium

---

## Ambiguity

### AMBIGUOUS_LANGUAGE

Description

Language allows multiple reasonable interpretations.

Severity

Medium

---

### UNDEFINED_STANDARD

Examples

- reasonable
- prompt
- material
- substantial
- commercially reasonable

Severity

Medium

---

### INCONSISTENT_TERMINOLOGY

Description

Multiple terms appear to describe the same concept.

Severity

Medium

---

### CONFLICTING_DEFINITIONS

Description

Defined terms contradict each other.

Severity

High

---

## Financial Risk

### UNLIMITED_LIABILITY

Description

Liability appears uncapped.

Severity

Critical

---

### UNCLEAR_PAYMENT_TRIGGER

Description

Payment obligation lacks objective trigger.

Severity

High

---

### UNDEFINED_PRICING

Description

Pricing methodology omitted.

Severity

Medium

---

### UNCAPPED_INDEMNITY

Description

Indemnity not clearly limited.

Severity

High

---

## Procedural Risk

### NO_CURE_PERIOD

Description

No opportunity to remedy breach.

Severity

Medium

---

### NO_ACCEPTANCE_PROCESS

Description

Acceptance mechanism absent.

Severity

Medium

---

### NO_CHANGE_CONTROL

Description

Contract modifications lack governance.

Severity

Medium

---

### NO_AUDIT_MECHANISM

Description

Compliance cannot be verified.

Severity

Medium

---

## Governance Risk

### NO_GOVERNING_LAW

Description

Applicable law omitted.

Severity

High

---

### NO_DISPUTE_MECHANISM

Description

Dispute resolution undefined.

Severity

High

---

### NO_ORDER_OF_PRECEDENCE

Description

Conflicting documents cannot be reconciled.

Severity

High

---

### NO_INTERPRETATION_RULES

Description

Contract construction principles absent.

Severity

Medium

---

## Security Risk

### NO_SECURITY_REQUIREMENTS

Description

Security obligations omitted.

Severity

High

---

### NO_ENCRYPTION

Description

Encryption requirements absent.

Severity

High

---

### NO_INCIDENT_RESPONSE

Description

Security incident handling undefined.

Severity

High

---

### NO_BACKUP_REQUIREMENTS

Description

Business continuity controls absent.

Severity

Medium

---

## Privacy Risk

### NO_DATA_PROTECTION

Description

Personal data obligations omitted.

Severity

High

---

### NO_RETENTION_POLICY

Description

Retention period undefined.

Severity

Medium

---

### NO_DELETION_PROCESS

Description

Deletion obligations absent.

Severity

Medium

---

## Operational Risk

### UNDEFINED_SERVICE_LEVELS

Description

Performance cannot be objectively measured.

Severity

Medium

---

### NO_PERFORMANCE_METRICS

Description

Operational commitments are subjective.

Severity

Medium

---

### NO_REPORTING_REQUIREMENTS

Description

Performance visibility absent.

Severity

Low

---

## Structural Risk

### BROKEN_CROSS_REFERENCE

Description

Referenced clause cannot be resolved.

Severity

High

---

### CIRCULAR_REFERENCE

Description

Clause references create a dependency loop.

Severity

High

---

### ORPHAN_CLAUSE

Description

Clause depends on missing provisions.

Severity

Medium

---

### DUPLICATE_OBLIGATIONS

Description

Same obligation repeated inconsistently.

Severity

Medium

---

### CONFLICTING_OBLIGATIONS

Description

Two obligations cannot both be satisfied.

Severity

Critical

---

## Legal Risk

### NON_COMPLIANT_WITH_MANDATORY_LAW

Description

Clause appears inconsistent with mandatory law.

Severity

Critical

---

### UNENFORCEABLE_PROVISION

Description

Provision may be unenforceable.

Severity

High

---

### EXCESSIVE_DISCRETION

Description

One party receives unrestricted decision-making authority.

Severity

Medium

---

### IMBALANCED_RISK_ALLOCATION

Description

Risk allocation appears commercially one-sided.

Severity

Medium

---

# Severity Scale

Critical

- High probability of unenforceability
- Major commercial exposure
- Significant litigation risk

---

High

- Material legal or commercial uncertainty

---

Medium

- Requires legal review
- May cause disputes

---

Low

- Drafting quality issue
- Minor operational concern

---

# Compiler Rules

Clause packs should reference risk identifiers.

Example

risks:

- UNLIMITED_LIABILITY
- NO_GOVERNING_LAW
- BROKEN_CROSS_REFERENCE

Avoid creating duplicate risk descriptions where a canonical identifier exists.

---

# Future Extensions

Risk identifiers may later include

- jurisdiction modifiers
- industry modifiers
- probability scores
- confidence scores
- remediation templates