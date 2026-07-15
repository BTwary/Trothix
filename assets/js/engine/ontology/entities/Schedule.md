---
id: Schedule
version: 1.0
status: stable

type: entity

category:
  - Legal Document

aliases:
  - Contract Schedule
  - Attachment
  - Schedule A
  - Schedule B
---

# Schedule

## Purpose

Represents a document attached to an Agreement that contains detailed
commercial, technical, operational, or legal information supporting the main
contract.

Schedules supplement the Agreement without replacing it.

---

# Definition

A Schedule is an attached document incorporated into an Agreement that
provides additional detail for one or more contractual provisions.

Schedules are interpreted together with the Agreement.

---

# Entity Type

Contract Attachment

---

# Common Examples

- Pricing Schedule
- Service Schedule
- Security Schedule
- Support Schedule
- Data Processing Schedule
- Technical Specifications
- Maintenance Schedule

---

# Core Attributes

Typical attributes

- Schedule Number
- Title
- Parent Agreement
- Effective Date
- Version
- Status

---

# Related Entities

- Agreement
- Clause
- Exhibit
- StatementOfWork
- OrderForm
- Amendment

---

# Related Concepts

- PAYMENT
- SERVICE_LEVELS
- SECURITY
- DATA_PROTECTION
- CONFIDENTIAL_INFORMATION
- WARRANTY

---

# Typical Relationships

Agreement

↓

includes

↓

Schedule

---

Clause

↓

references

↓

Schedule

---

Schedule

↓

supplements

↓

Agreement

---

Schedule

↓

defines

↓

Technical Requirements

---

Schedule

↓

defines

↓

Commercial Terms

---

Schedule

↓

modified_by

↓

Amendment

---

# Lifecycle

Draft

↓

Approved

↓

Attached

↓

Effective

↓

Modified

↓

Archived

---

# Semantic Signals

Common drafting language

- Schedule A
- Schedule B
- Schedule 1
- Schedule 2
- Attached Schedule
- Pricing Schedule
- Technical Schedule

---

# Compiler Notes

Schedules should be resolved before evaluating clauses that reference them.

The compiler should maintain links between referencing clauses and the
associated schedule.

---

# Validation Rules

A schedule should define

- parent agreement
- schedule identifier
- referenced clauses
- effective version

Possible findings

- MISSING_PARENT_AGREEMENT
- BROKEN_SCHEDULE_REFERENCE
- DUPLICATE_SCHEDULE
- UNUSED_SCHEDULE

---

# Used By

Clause Packs

- payment.md
- service-levels.md
- security.md
- data-protection.md
- warranties.md
- change-control.md

Knowledge Graph

Node Type

Entity

---

# Future Extensions

Future versions may support

- nested schedules
- version comparison
- automatic schedule merging
- structured schedule parsing