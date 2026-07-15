---
id: Deliverable
version: 1.0
status: stable

type: entity

category:
  - Contract Performance

aliases:
  - Work Product
  - Deliverable
  - Output
  - Deliverable Item
---

# Deliverable

## Purpose

Represents a product, service, document, software component, report,
milestone output, or other agreed result that must be provided under an
Agreement or Statement of Work.

Deliverables are the primary objects against which performance,
acceptance, and payment are evaluated.

---

# Definition

A Deliverable is any contractual output that one Party is obligated to
provide to another under the terms of an Agreement.

A Deliverable may be physical, digital, intellectual, or service-based.

---

# Entity Type

Contract Performance Object

---

# Common Examples

- Software
- Source Code
- Report
- Technical Documentation
- Design
- API
- Prototype
- Training Material
- Consulting Report
- Hardware
- Database
- Configuration

---

# Core Attributes

Typical attributes

- Deliverable Identifier
- Name
- Description
- Type
- Parent Agreement
- Parent StatementOfWork
- Owner
- Responsible Party
- Due Date
- Acceptance Criteria
- Version
- Status

---

# Related Entities

- Agreement
- Party
- StatementOfWork
- OrderForm
- Invoice
- Clause

---

# Related Concepts

- DELIVERY
- ACCEPTANCE
- PAYMENT
- BREACH
- WARRANTY
- SERVICE_LEVELS

---

# Typical Relationships

StatementOfWork

↓

defines

↓

Deliverable

---

OrderForm

↓

orders

↓

Deliverable

---

Party

↓

creates

↓

Deliverable

---

Party

↓

receives

↓

Deliverable

---

Deliverable

↓

subject_to

↓

Acceptance

---

Deliverable

↓

may_generate

↓

Invoice

---

Deliverable

↓

covered_by

↓

Warranty

---

Deliverable

↓

may_result_in

↓

Payment

---

# Lifecycle

Planned

↓

Assigned

↓

Created

↓

Delivered

↓

Reviewed

↓

Accepted

or

↓

Rejected

↓

Reworked

↓

Accepted

↓

Archived

---

# Semantic Signals

Common drafting language

- Deliverable
- Work Product
- Output
- Deliver
- Completion
- Submission
- Acceptance
- Milestone
- Final Report

---

# Compiler Notes

The compiler should normalize all contractual outputs to the canonical
Deliverable entity.

Deliverables should link to the StatementOfWork, OrderForm, Acceptance,
and Payment concepts where applicable.

---

# Validation Rules

A Deliverable should define

- responsible party
- acceptance criteria
- delivery deadline
- related agreement
- related scope of work

Possible findings

- MISSING_ACCEPTANCE_CRITERIA
- MISSING_DELIVERY_DATE
- MISSING_RESPONSIBLE_PARTY
- MISSING_SCOPE_REFERENCE
- AMBIGUOUS_DELIVERABLE

---

# Used By

Clause Packs

- scope.md
- acceptance.md
- payment.md
- warranties.md
- service-levels.md
- change-control.md

Knowledge Graph

Node Type

Entity

---

# Future Extensions

Future versions may support

- deliverable hierarchies
- milestone graphs
- digital signatures
- quality metrics
- dependency graphs
- acceptance workflows