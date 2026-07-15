# Trothix Legal Ontology

## Purpose

The ontology is the canonical semantic model used by Trothix.

It defines legal concepts independently of:

- wording
- drafting style
- jurisdiction
- contract type

Unlike clause packs, the ontology does not describe contracts.

Unlike standards, the ontology does not describe compiler behavior.

It describes the legal world itself.

---

# Relationship to Other Knowledge

Clause Packs

↓

describe legal provisions

---

Standards

↓

describe normalization and interpretation

---

Ontology

↓

defines canonical legal concepts

---

Rule Packs

↓

operate on ontology concepts

---

Compiler

↓

builds executable knowledge bundles

---

# Ontology Structure

```
ontology/

README.md

concepts/

aliases/

relationships/

entities/

functions/
```

---

# Concepts

Concepts represent legal ideas.

Examples

- PAYMENT
- NOTICE
- BREACH
- CLAIM
- DAMAGES
- TERMINATION
- CONFIDENTIAL_INFORMATION

A concept has exactly one legal meaning.

---

# Entities

Entities are real-world objects participating in legal relationships.

Examples

- Party
- Supplier
- Customer
- Agreement
- Invoice
- Deliverable

---

# Aliases

Aliases normalize drafting language.

Example

Confidential Information

↓

Proprietary Information

↓

Sensitive Information

↓

CONFIDENTIAL_INFORMATION

---

# Relationships

Relationships connect ontology objects.

Examples

depends_on

requires

modifies

implements

references

overrides

conflicts_with

survives

---

# Functions

Functions describe why a clause exists.

Examples

RISK_ALLOCATION

DISCLOSURE_CONTROL

CONTRACT_EXIT

PAYMENT_OBLIGATION

---

# Compiler Flow

Raw Contract

↓

Parser

↓

Signals

↓

Aliases

↓

Ontology Concepts

↓

Relationships

↓

Rules

↓

Findings

↓

Recommendations

---

# Design Principles

One concept

↓

One meaning

---

Many aliases

↓

One concept

---

One rule

↓

Many contracts

---

No ontology object should depend on a particular contract.

The ontology must remain reusable across industries,
jurisdictions, and contract types.

---

# Future Growth

The ontology is expected to contain

- 500+ concepts
- 2,000+ aliases
- 10,000+ relationships
- 100+ entities
- industry extensions
- jurisdiction extensions

The ontology is the semantic foundation of Trothix.