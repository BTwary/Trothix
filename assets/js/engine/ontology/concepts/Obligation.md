---
id: Obligation
version: 1.0
status: stable

type: entity

category:
  - Legal Duty

aliases:
  - Duty
  - Contractual Obligation
  - Performance Obligation
---

# Obligation

## Purpose

Represents a legally enforceable duty imposed upon one or more parties by an
agreement.

Obligation is the primary executable object evaluated by the Trothix rule
engine.

---

# Definition

An Obligation is a legally binding requirement that requires a Party to
perform, refrain from performing, or permit a specific act.

---

# Entity Type

Legal Duty

---

# Obligation Types

Examples

- Payment
- Confidentiality
- Delivery
- Performance
- Notice
- Cooperation
- Compliance
- Insurance
- Record Retention

---

# Core Attributes

Typical attributes

- Subject Party
- Beneficiary
- Action
- Trigger
- Deadline
- Conditions
- Exceptions
- Status
- Survival

---

# Related Entities

- Party
- Agreement
- Clause
- DefinedTerm

---

# Related Concepts

- PAYMENT
- NOTICE
- BREACH
- TERMINATION
- LIABILITY
- CONFIDENTIAL_INFORMATION
- FORCE_MAJEURE

---

# Typical Relationships

Clause

↓

creates

↓

Obligation

---

Party

↓

owes

↓

Obligation

---

Obligation

↓

benefits

↓

Party

---

Obligation

↓

triggered_by

↓

Event

---

Obligation

↓

modified_by

↓

Clause

---

Obligation

↓

terminated_by

↓

Termination

---

Obligation

↓

survives

↓

Agreement Termination

---

# Lifecycle

Created

↓

Triggered

↓

Active

↓

Performed

↓

Satisfied

or

↓

Breached

↓

Remedied

or

↓

Terminated

---

# Semantic Signals

Common drafting language

- shall
- must
- agrees to
- is required to
- undertakes to

---

# Compiler Notes

Every mandatory provision should normalize to one or more Obligation
objects before deterministic rule evaluation.

The parser should distinguish

- obligation
- permission
- prohibition

before creating ontology objects.

---

# Validation Rules

An obligation should define

- who performs it
- what must be done
- when it applies
- triggering event
- completion criteria

Possible findings

- MISSING_SUBJECT
- MISSING_ACTION
- MISSING_TRIGGER
- MISSING_DEADLINE
- AMBIGUOUS_OBLIGATION

---

# Used By

All clause packs.

Knowledge Graph

Node Type

Entity

---

# Future Extensions

Future versions may support

- recurring obligations
- delegated obligations
- conditional obligations
- jurisdiction-specific duties
- obligation inheritance
