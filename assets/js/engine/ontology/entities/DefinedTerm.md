---
id: DefinedTerm
version: 1.0
status: stable

type: entity

category:
  - Legal Structure

aliases:
  - Definition
  - Defined Expression
  - Capitalized Term
---

# DefinedTerm

## Purpose

Represents a contractually defined word or phrase whose meaning is explicitly
specified within an agreement.

Defined terms override ordinary language meaning and provide the canonical
interpretation used throughout the contract.

---

# Definition

A DefinedTerm is a contractual entity that assigns a specific legal meaning
to a word or phrase.

Once defined, every subsequent reference to the term should resolve to the
same semantic meaning unless expressly modified.

---

# Entity Type

Legal Definition

---

# Common Examples

- Confidential Information
- Services
- Deliverables
- Effective Date
- Affiliate
- Losses
- Customer Data
- Business Day
- Force Majeure Event
- Intellectual Property Rights

---

# Core Attributes

Typical attributes

- Term
- Definition Text
- Scope
- Source Clause
- Parent Agreement
- Jurisdiction
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

- CONFIDENTIAL_INFORMATION
- PAYMENT
- LIABILITY
- BREACH
- NOTICE
- TERMINATION

---

# Typical Relationships

Agreement

↓

defines

↓

DefinedTerm

---

Clause

↓

uses

↓

DefinedTerm

---

DefinedTerm

↓

maps_to

↓

Concept

---

DefinedTerm

↓

referenced_by

↓

Clause

---

DefinedTerm

↓

may_override

↓

Plain Language

---

# Semantic Signals

Typical drafting language

- means
- shall mean
- refers to
- is defined as
- has the meaning given in
- includes
- includes without limitation

---

# Compiler Notes

The compiler should resolve every use of a defined term to its canonical
definition before evaluating rules, risks, or relationships.

Plain-language interpretation must not override an explicit contractual
definition.

---

# Validation Rules

A valid defined term should

- have one canonical definition
- resolve consistently
- avoid ambiguity
- support cross-references
- remain stable within the agreement

Compiler findings may include

- UNDEFINED_TERM
- DUPLICATE_DEFINITION
- CONFLICTING_DEFINITION
- UNUSED_DEFINED_TERM
- BROKEN_DEFINITION_REFERENCE

---

# Used By

Every clause pack.

Definitions influence

- confidentiality
- payment
- liability
- indemnity
- warranties
- privacy
- force majeure
- notices
- governing law

Knowledge Graph

Node Type

Entity

---

# Future Extensions

Future versions may support

- inherited definitions
- cross-document definitions
- multilingual definitions
- ontology binding
- version-aware definitions