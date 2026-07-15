---
id: ontology-guide
version: 1.0
status: stable
priority: critical

category:
  - Knowledge Standard
  - Ontology

applies_to:
  - Entire Knowledge System

compiler:
  exported: true
---

# Ontology Guide

## Purpose

Define the canonical semantic model used throughout the Trothix knowledge
system.

The ontology provides a common vocabulary for representing legal knowledge
independently of drafting style, jurisdiction, or contract type.

Clause packs, standards, rule packs, compiler passes, and future knowledge
graphs should all conform to this guide.

---

# Design Principles

## Single Meaning

Each concept represents one legal meaning.

Do not create duplicate concepts for different wording.

Example

shall

must

is required to

↓

MANDATORY_OBLIGATION

---

## Canonical First

Always normalize language into canonical concepts before rule evaluation.

Never execute rules directly against raw drafting language.

---

## Stable IDs

Ontology identifiers are permanent.

Human-readable wording may change.

Concept identifiers should not.

---

## Separation of Concerns

Clause Packs

↓

Describe legal knowledge.

Ontology

↓

Defines semantic meaning.

Rule Packs

↓

Describe executable logic.

Compiler

↓

Transforms knowledge into runtime artifacts.

---

# Ontology Objects

## Concept

Definition

A canonical legal idea.

Examples

PAYMENT

NOTICE

BREACH

CLAIM

LOSS

CONFIDENTIAL_INFORMATION

OBLIGATION

---

Properties

- id
- name
- aliases
- description
- category

---

## Entity

Definition

A participant or object referenced by legal concepts.

Examples

Party

Customer

Supplier

Employee

Invoice

Deliverable

Agreement

Schedule

---

Properties

- id
- type
- attributes

---

## Relationship

Definition

A semantic connection between ontology objects.

Relationship types include

depends_on

requires

modifies

overrides

implements

references

specializes

conflicts_with

incorporates

survives

triggers

excludes

---

## Alias

Definition

Alternative wording representing the same concept.

Example

Confidential Information

↓

Proprietary Information

↓

Sensitive Information

↓

CONFIDENTIAL_INFORMATION

---

## Legal Function

Definition

The legal purpose performed by a clause.

Examples

RISK_ALLOCATION

DISCLOSURE_CONTROL

PAYMENT_OBLIGATION

CONTRACT_EXIT

DISPUTE_MANAGEMENT

---

## Signal

Definition

Observable drafting language indicating a concept.

Examples

shall

must

except

subject to

including

provided that

---

Signals are evidence.

They are not concepts.

---

## Event

Definition

A legally significant occurrence.

Examples

Payment Due

Material Breach

Termination

Delivery

Acceptance

Force Majeure Event

---

## Risk

Definition

A reusable legal concern.

Examples

UNLIMITED_LIABILITY

NO_NOTICE

BROKEN_REFERENCE

AMBIGUOUS_LANGUAGE

---

## Finding

Definition

A conclusion produced by deterministic analysis.

Examples

Missing governing law.

Unlimited indemnity.

Broken cross-reference.

---

## Recommendation

Definition

Suggested remediation for a finding.

Recommendations are generated from findings.

---

# Ontology Layers

Layer 1

Signals

↓

Layer 2

Concepts

↓

Layer 3

Relationships

↓

Layer 4

Rules

↓

Layer 5

Findings

↓

Layer 6

Recommendations

---

# Normalization Pipeline

Drafting Language

↓

Signals

↓

Aliases

↓

Canonical Concepts

↓

Relationships

↓

Rules

↓

Findings

---

# Naming Rules

Concept IDs

UPPER_SNAKE_CASE

Examples

PAYMENT

CONFIDENTIAL_INFORMATION

FORCE_MAJEURE

---

Entity IDs

PascalCase

Examples

Supplier

Customer

Agreement

---

Relationship IDs

lower_snake_case

Examples

depends_on

modifies

overrides

implements

---

Rule IDs

RULE_

Example

RULE_PAYMENT_001

---

Risk IDs

UPPER_SNAKE_CASE

Examples

UNLIMITED_LIABILITY

BROKEN_REFERENCE

NO_NOTICE

---

# Compiler Responsibilities

The compiler shall

- resolve aliases
- normalize concepts
- validate identifiers
- validate relationships
- detect duplicates
- preserve stable IDs

The compiler shall not

- infer legal advice
- invent ontology concepts
- change canonical identifiers

---

# Relationship Rules

Relationships are

- directional
- typed
- deterministic

Every relationship must define

source

relationship

target

---

# Versioning

Ontology concepts should evolve through versioning.

Identifiers remain stable.

Deprecated concepts should remain resolvable.

---

# Future Extensions

The ontology may later support

- jurisdiction metadata
- industry metadata
- confidence scores
- multilingual aliases
- temporal reasoning
- probabilistic relationships
- graph optimization

---

# Guiding Principle

The ontology represents legal meaning, not legal wording.

Many expressions may map to one concept.

One concept should never represent multiple unrelated legal meanings.