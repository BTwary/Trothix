---
id: Exhibit
version: 1.0
status: stable

type: entity

category:
  - Legal Document

aliases:
  - Contract Exhibit
  - Annex
  - Attachment
  - Appendix
---

# Exhibit

## Purpose

Represents a document attached to an Agreement that provides supporting
information, evidence, technical material, forms, specifications, or other
supplementary content referenced by contractual provisions.

Exhibits supplement the Agreement but do not normally contain the primary
commercial obligations unless expressly incorporated.

---

# Definition

An Exhibit is a referenced attachment that forms part of an Agreement and
provides additional contractual information supporting one or more clauses.

---

# Entity Type

Supporting Document

---

# Common Examples

- Technical Specification
- Security Controls
- Pricing Matrix
- Product Description
- Compliance Certificate
- Insurance Certificate
- Service Description
- Data Dictionary

---

# Core Attributes

Typical attributes

- Exhibit Identifier
- Title
- Parent Agreement
- Version
- Effective Date
- Status

---

# Related Entities

- Agreement
- Clause
- Schedule
- StatementOfWork
- Amendment
- Deliverable

---

# Related Concepts

- CONFIDENTIAL_INFORMATION
- SECURITY
- DATA_PROTECTION
- PAYMENT
- WARRANTY
- SERVICE_LEVELS

---

# Typical Relationships

Agreement

↓

includes

↓

Exhibit

---

Clause

↓

references

↓

Exhibit

---

Exhibit

↓

supports

↓

Clause

---

Exhibit

↓

supplements

↓

Agreement

---

Exhibit

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

- Exhibit A
- Exhibit B
- Annex
- Appendix
- Attachment
- Attached Exhibit

---

# Compiler Notes

The compiler should resolve exhibit references before evaluating dependent
clauses.

Referenced exhibits should become first-class nodes in the knowledge graph.

---

# Validation Rules

An exhibit should define

- parent agreement
- exhibit identifier
- referenced clauses
- version

Possible findings

- MISSING_PARENT_AGREEMENT
- BROKEN_EXHIBIT_REFERENCE
- DUPLICATE_EXHIBIT
- UNUSED_EXHIBIT

---

# Used By

Clause Packs

- confidentiality.md
- payment.md
- security.md
- service-levels.md
- data-protection.md
- warranties.md

Knowledge Graph

Node Type

Entity

---

# Future Extensions

Future versions may support

- embedded media
- structured technical specifications
- machine-readable attachments
- version comparison
- cross-document exhibits