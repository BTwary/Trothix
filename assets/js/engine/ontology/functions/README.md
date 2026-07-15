---
id: ontology-functions
version: 1.0
status: stable

type: ontology

category:
  - Functions
---

# Ontology Functions

## Purpose

Functions represent the canonical legal purposes performed by contractual
provisions.

A function answers the question:

**"What legal objective does this clause achieve?"**

Unlike clauses, functions are independent of drafting style, jurisdiction,
or wording.

They provide a stable semantic layer for deterministic reasoning.

---

# Design Goals

Functions should

- represent one legal purpose
- remain jurisdiction-neutral
- be reusable across domains
- be independent of wording
- support deterministic rule execution

---

# Why Functions Exist

Different contracts often express the same legal purpose using different
language.

Examples

Supplier shall keep all Confidential Information secret.

↓

implements

↓

DISCLOSURE_CONTROL

---

Recipient must not disclose Proprietary Information.

↓

implements

↓

DISCLOSURE_CONTROL

---

Both clauses perform the same legal function despite different wording.

---

# Function Model

Clause

↓

implements

↓

Function

↓

creates

↓

Legal Effects

↓

evaluated by

↓

Rules

---

# Function Categories

Typical categories include

- Confidentiality
- Payment
- Liability
- Risk Allocation
- Performance
- Termination
- Governance
- Compliance
- Communication
- Dispute Resolution

---

# Relationship to Concepts

Concepts define legal meaning.

Functions define legal purpose.

Example

Concept

PAYMENT

↓

Function

PAYMENT_OBLIGATION

↓

Clause

Payment Clause

---

# Relationship to Rules

Rules should evaluate functions rather than raw clause types.

Example

Instead of

IF clause == Payment

Use

IF function == PAYMENT_OBLIGATION

This allows multiple drafting styles to produce identical reasoning.

---

# Compiler Responsibilities

The compiler should

- resolve implemented functions
- validate identifiers
- detect duplicate functions
- normalize aliases
- connect rules to functions

---

# Runtime Usage

The runtime may use functions to

- classify clauses
- execute rules
- generate findings
- explain reasoning
- support semantic search

---

# Guiding Principle

Entities describe what exists.

Concepts describe meaning.

Relationships describe connections.

Functions describe purpose.

Rules evaluate functions.

This separation enables deterministic legal reasoning independent of
contract wording.