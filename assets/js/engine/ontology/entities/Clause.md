---
id: Clause
version: 1.0
status: stable

type: entity

category:
  - Legal Structure

aliases:
  - Provision
  - Contract Clause
  - Section
  - Article
---

# Clause

## Purpose

Represents an individual contractual provision that establishes one or more
legal rules, obligations, permissions, prohibitions, rights, remedies, or
procedures.

Clause is the fundamental analysis unit within the Trothix reasoning engine.

---

# Definition

A Clause is a discrete contractual unit that expresses one or more legal
functions and forms part of a larger Agreement.

Clauses may be independent or may depend upon other clauses for their full
legal meaning.

---

# Entity Type

Contract Structure

---

# Common Examples

- Confidentiality Clause
- Payment Clause
- Termination Clause
- Warranty Clause
- Indemnity Clause
- Limitation of Liability Clause
- Governing Law Clause
- Force Majeure Clause
- Notice Clause
- Assignment Clause

---

# Core Attributes

Typical attributes include

- Clause Title
- Clause Number
- Clause Type
- Parent Section
- Effective Scope
- Status
- Source Document

---

# Related Entities

- Agreement
- Party
- Amendment
- Schedule
- Exhibit
- StatementOfWork

---

# Related Concepts

- OBLIGATION
- RIGHT
- PAYMENT
- BREACH
- NOTICE
- TERMINATION
- LIABILITY
- WARRANTY
- INDEMNITY
- FORCE_MAJEURE

---

# Typical Relationships

Agreement

↓

contains

↓

Clause

---

Clause

↓

references

↓

Clause

---

Clause

↓

depends_on

↓

Clause

---

Clause

↓

modifies

↓

Clause

---

Clause

↓

overrides

↓

Clause

---

Clause

↓

implements

↓

Legal Function

---

Clause

↓

creates

↓

Obligation

---

Clause

↓

creates

↓

Right

---

Clause

↓

creates

↓

Remedy

---

Clause

↓

contains

↓

Defined Terms

---

# Semantic Signals

Typical drafting indicators

- Section
- Clause
- Article
- Provision
- Paragraph
- Subsection

---

# Legal Functions

A Clause may perform one or more functions

- Create obligations
- Grant rights
- Restrict conduct
- Allocate risk
- Define procedures
- Create remedies
- Allocate liability
- Define interpretation rules

---

# Compiler Notes

The compiler should normalize every contractual provision into the canonical
Clause entity regardless of numbering or formatting.

Examples

Section 5

↓

Clause

---

Article IV

↓

Clause

---

Paragraph 8

↓

Clause

---

Provision 12

↓

Clause

---

# Used By

Every clause pack ultimately models one or more Clause entities.

The parser, compiler, rule engine, and knowledge graph all operate primarily
at the Clause level.

Knowledge Graph

Node Type

Entity

---

# Future Extensions

Future versions may include

- Nested clauses
- Clause hierarchy
- Clause inheritance
- Cross-document clauses
- Clause versioning
- Canonical clause identifiers