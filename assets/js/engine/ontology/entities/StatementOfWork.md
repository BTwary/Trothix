---
id: StatementOfWork
version: 1.0
status: stable

type: entity

category:
  - Legal Document

aliases:
  - SOW
  - Statement of Work
  - Work Order
  - Project Scope
---

# StatementOfWork

## Purpose

Represents a project-specific document that defines the scope, deliverables,
milestones, timelines, responsibilities, and commercial details governing
work performed under an Agreement.

A Statement of Work supplements a parent Agreement and operationalizes the
services to be performed.

---

# Definition

A Statement of Work (SOW) is a contractual document incorporated into an
Agreement that specifies the work to be performed for a particular project,
engagement, or service.

---

# Entity Type

Operational Contract Document

---

# Common Examples

- Software Development SOW
- Consulting SOW
- Managed Services SOW
- Implementation SOW
- Migration SOW
- Support SOW
- Professional Services SOW

---

# Core Attributes

Typical attributes

- SOW Identifier
- Title
- Parent Agreement
- Scope
- Deliverables
- Milestones
- Acceptance Criteria
- Timeline
- Pricing
- Status

---

# Related Entities

- Agreement
- Party
- Clause
- Deliverable
- OrderForm
- Schedule
- Invoice

---

# Related Concepts

- PAYMENT
- ACCEPTANCE
- DELIVERY
- SERVICE_LEVELS
- CHANGE_CONTROL
- TERMINATION

---

# Typical Relationships

Agreement

↓

includes

↓

StatementOfWork

---

StatementOfWork

↓

defines

↓

Deliverable

---

StatementOfWork

↓

defines

↓

Acceptance Criteria

---

StatementOfWork

↓

defines

↓

Milestone

---

StatementOfWork

↓

references

↓

Schedule

---

StatementOfWork

↓

modified_by

↓

Amendment

---

StatementOfWork

↓

generates

↓

Invoice

---

# Lifecycle

Draft

↓

Negotiation

↓

Approval

↓

Execution

↓

Performance

↓

Completion

↓

Closure

---

# Semantic Signals

Common drafting language

- Statement of Work
- SOW
- Scope of Work
- Work Order
- Project Scope
- Engagement

---

# Compiler Notes

The compiler should treat the StatementOfWork as a child document of the
parent Agreement.

References from clauses to the SOW should be resolved before evaluating
project-specific obligations.

---

# Validation Rules

A StatementOfWork should define

- parent agreement
- scope
- deliverables
- milestones
- acceptance criteria
- pricing

Possible findings

- MISSING_SCOPE
- MISSING_DELIVERABLES
- MISSING_ACCEPTANCE_CRITERIA
- MISSING_PARENT_AGREEMENT
- BROKEN_SOW_REFERENCE

---

# Used By

Clause Packs

- scope.md
- payment.md
- service-levels.md
- acceptance.md
- change-control.md
- termination.md

Knowledge Graph

Node Type

Entity

---

# Future Extensions

Future versions may support

- nested SOWs
- agile work packages
- sprint-based delivery
- milestone dependency graphs
- multi-project agreements