---
id: clause-relationships
version: 1.0
status: stable
priority: critical

category:
  - Knowledge Standard
  - Knowledge Graph

applies_to:
  - All Clause Packs

compiler:
  exported: true
---

# Clause Relationships

## Purpose

Define the canonical relationships that may exist between clauses,
documents, legal concepts, and contractual obligations.

Clause packs should describe relationships using these identifiers instead of
free-text descriptions.

The compiler uses these relationships to construct the contract knowledge graph.

---

# Relationship Principles

Relationships are directional.

A

↓

depends_on

↓

B

is different from

B

↓

depends_on

↓

A

---

Multiple relationships may exist simultaneously.

Example

Indemnity

↓

depends_on

↓

Definitions

AND

↓

modified_by

↓

Limitation of Liability

---

# Core Relationships

## depends_on

Meaning

Requires another clause to determine meaning.

Examples

Payment

↓

depends_on

↓

Acceptance

---

Confidentiality

↓

depends_on

↓

Definitions

---

## requires

Meaning

Cannot operate unless another clause exists.

Examples

Termination

↓

requires

↓

Notices

---

Data Protection

↓

requires

↓

Security

---

## modifies

Meaning

Changes the operation of another clause without replacing it.

Examples

Force Majeure

↓

modifies

↓

Performance Obligations

---

Limitation of Liability

↓

modifies

↓

Indemnity

---

## overrides

Meaning

Replaces another provision for a defined scope.

Examples

Amendment

↓

overrides

↓

Master Agreement

---

DPA

↓

overrides

↓

Privacy provisions

---

## supplements

Meaning

Adds obligations without replacing existing ones.

Examples

Security Addendum

↓

supplements

↓

MSA

---

Insurance Schedule

↓

supplements

↓

Insurance Clause

---

## implements

Meaning

Provides the operational mechanism for another clause.

Examples

Audit Rights

↓

implements

↓

Compliance

---

Security

↓

implements

↓

Data Protection

---

## conflicts_with

Meaning

Both clauses cannot simultaneously operate.

Examples

Unlimited Liability

↓

conflicts_with

↓

Liability Cap

---

Automatic Renewal

↓

conflicts_with

↓

Fixed Expiration

---

## specializes

Meaning

Creates a narrower version of a broader rule.

Examples

SaaS SLA

↓

specializes

↓

Service Levels

---

Healthcare Privacy

↓

specializes

↓

Data Protection

---

## references

Meaning

Explicit textual reference.

Examples

Clause 8

↓

references

↓

Clause 12

---

## incorporates

Meaning

Imports another document into the agreement.

Examples

MSA

↓

incorporates

↓

DPA

---

MSA

↓

incorporates

↓

SOW

---

## survives

Meaning

Continues after termination.

Examples

Termination

↓

survives

↓

Confidentiality

---

Termination

↓

survives

↓

Payment

---

## triggers

Meaning

One event activates another clause.

Examples

Material Breach

↓

triggers

↓

Termination

---

Late Payment

↓

triggers

↓

Interest

---

## excludes

Meaning

Explicitly removes something from scope.

Examples

Confidential Information

↓

excludes

↓

Public Information

---

Force Majeure

↓

excludes

↓

Payment Obligations

---

# Relationship Priority

Highest

overrides

↓

modifies

↓

implements

↓

depends_on

↓

references

---

# Graph Rules

Relationships must

- have one source
- have one target
- have one relationship type
- be directional

---

Cycles are permitted only when explicitly defined.

Otherwise

Compiler Finding

CIRCULAR_RELATIONSHIP

---

# Compiler Representation

Example

source

Payment

relationship

depends_on

target

Acceptance

confidence

1.0

---

# Cross-Clause Examples

Payment

↓

depends_on

↓

Acceptance

↓

depends_on

↓

Scope

↓

depends_on

↓

Definitions

---

Indemnity

↓

modified_by

↓

Limitation of Liability

↓

modified_by

↓

Order of Precedence

---

Confidentiality

↓

implemented_by

↓

Security

↓

verified_by

↓

Audit Rights

---

# Validation Rules

Reject

- unknown relationship
- missing source
- missing target
- self-reference without justification

Warn

- duplicate relationships
- conflicting relationship types

---

# Compiler Rules

The compiler shall

- normalize relationship identifiers
- build a directed graph
- detect cycles
- detect orphan clauses
- compute dependency chains
- expose graph queries

---

# Future Extensions

Future versions may support

- weighted relationships
- jurisdiction-specific relationships
- temporal relationships
- conditional relationships
- probabilistic relationships