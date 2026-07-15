---
id: Amendment
version: 1.0
status: stable

type: entity

category:
  - Legal Document

aliases:
  - Contract Amendment
  - Amendment Agreement
  - Addendum
  - Modification
---

# Amendment

## Purpose

Represents a document that modifies, supplements, replaces, or clarifies one
or more provisions of an existing agreement.

An Amendment changes the legal effect of an agreement while preserving the
agreement's overall identity unless expressly stated otherwise.

---

# Definition

An Amendment is a legally binding document executed by the parties to alter
specific terms of an existing agreement.

Unless otherwise specified, all unaffected provisions of the original
agreement remain in force.

---

# Entity Type

Legal Document

---

# Common Examples

- First Amendment
- Second Amendment
- Addendum
- Change Agreement
- Contract Modification
- Pricing Amendment
- Renewal Amendment

---

# Core Attributes

Typical attributes

- Amendment Number
- Effective Date
- Execution Date
- Modified Agreement
- Modified Clauses
- Parties
- Version
- Status

---

# Related Entities

- Agreement
- Clause
- Party
- Schedule
- Exhibit

---

# Related Concepts

- MODIFICATION
- TERMINATION
- NOTICE
- OBLIGATION
- PAYMENT

---

# Typical Relationships

Amendment

↓

modifies

↓

Agreement

---

Amendment

↓

replaces

↓

Clause

---

Amendment

↓

references

↓

Clause

---

Agreement

↓

modified_by

↓

Amendment

---

Party

↓

executes

↓

Amendment

---

# Lifecycle

Draft

↓

Negotiation

↓

Execution

↓

Effective

↓

Superseded

↓

Archived

---

# Semantic Signals

Common drafting expressions

- Amendment
- Addendum
- Modification
- Amended
- Revised
- Supplemented
- Replaced

---

# Compiler Notes

The compiler should resolve amendments before evaluating contractual meaning.

Where conflicts exist, valid amendments should take precedence over the
original provisions according to the applicable order of precedence.

---

# Validation Rules

An amendment should define

- affected agreement
- modified provisions
- effective date
- executing parties

Possible findings

- MISSING_PARENT_AGREEMENT
- MISSING_EFFECTIVE_DATE
- INVALID_REFERENCE
- CONFLICTING_AMENDMENTS

---

# Used By

Clause Packs

- change-control.md
- order-of-precedence.md
- termination.md
- payment.md

Knowledge Graph

Node Type

Entity

---

# Future Extensions

Future versions may support

- amendment chains
- version history
- redline tracking
- automatic conflict detection
- consolidated agreement generation