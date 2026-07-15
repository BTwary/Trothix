---
id: Agreement
version: 1.0
status: stable

type: entity

category:
  - Legal Document

aliases:
  - Contract
  - Agreement
  - Master Agreement
  - Commercial Agreement
---

# Agreement

## Purpose

Represents a legally enforceable arrangement between two or more parties
that establishes rights, obligations, remedies, and legal relationships.

Agreement is the central document entity in the Trothix ontology.

---

# Definition

An Agreement is a legally recognized document containing mutually accepted
terms governing the relationship between one or more parties.

---

# Entity Type

Legal Document

---

# Common Examples

- Master Service Agreement
- Non-Disclosure Agreement
- Purchase Agreement
- Software License Agreement
- Employment Agreement
- Subscription Agreement
- Data Processing Agreement
- Statement of Work
- Order Form

---

# Core Attributes

Typical attributes

- Agreement Name
- Effective Date
- Execution Date
- Expiration Date
- Governing Law
- Jurisdiction
- Parties
- Version
- Status

---

# Related Entities

- Party
- Amendment
- Notice
- Schedule
- Exhibit
- StatementOfWork
- OrderForm
- Invoice

---

# Related Concepts

- PAYMENT
- TERMINATION
- NOTICE
- BREACH
- CONFIDENTIAL_INFORMATION
- LIABILITY
- WARRANTY
- INDEMNITY
- FORCE_MAJEURE
- DISPUTE

---

# Typical Relationships

Agreement

↓

has_party

↓

Party

---

Agreement

↓

contains

↓

Clause

---

Agreement

↓

references

↓

Schedule

---

Agreement

↓

references

↓

Exhibit

---

Agreement

↓

includes

↓

StatementOfWork

---

Agreement

↓

modified_by

↓

Amendment

---

Agreement

↓

governed_by

↓

GOVERNING_LAW

---

Agreement

↓

creates

↓

Rights

---

Agreement

↓

creates

↓

Obligations

---

Agreement

↓

may_be_terminated_by

↓

Party

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

Performance

↓

Amendment

↓

Termination

↓

Survival

↓

Archive

---

# Semantic Signals

Common drafting language

- Agreement
- Contract
- This Agreement
- Master Agreement
- MSA
- Contract Document
- Instrument

---

# Exclusions

Agreement does not represent

- Individual clauses
- Legal concepts
- Legal rules
- Events

These are modeled separately within the ontology.

---

# Compiler Notes

Normalize all contract document variants to the canonical
Agreement entity while preserving document subtype metadata.

Examples

Master Service Agreement

↓

Agreement

Subtype = MSA

---

Non-Disclosure Agreement

↓

Agreement

Subtype = NDA

---

Purchase Agreement

↓

Agreement

Subtype = Purchase Agreement

---

# Used By

Nearly every clause pack references Agreement directly or indirectly.

Knowledge Graph

Node Type

Entity

---

# Future Extensions

Future versions may include

- Agreement hierarchy
- Linked agreements
- Parent-child agreements
- Version history
- Digital execution metadata
- Multi-document contract sets