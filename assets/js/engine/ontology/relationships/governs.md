---
id: governs
version: 1.0
status: stable

type: relationship

category:
  - Governance
---

# governs

## Purpose

Represents a legal authority relationship where one ontology object
establishes the rules, interpretation, or legal framework that controls
another ontology object.

Unlike **overrides**, which resolves conflicts, **governs** defines the
normal controlling authority.

---

# Definition

A governs relationship exists when a source object establishes the legal,
procedural, or contractual framework within which a target object operates.

The governed object derives its authority or interpretation from the
governing object.

---

# Relationship Type

Governance

---

# Direction

Source

↓

governs

↓

Target

The relationship is directional.

---

# Valid Connections

Agreement

↓

governs

↓

StatementOfWork

---

Agreement

↓

governs

↓

OrderForm

---

Governing Law Clause

↓

governs

↓

Agreement

---

Master Agreement

↓

governs

↓

Schedule

---

Policy

↓

governs

↓

Procedure

---

# Common Examples

Master Agreement

↓

governs

↓

Statement of Work

---

Master Agreement

↓

governs

↓

Order Form

---

Governing Law Clause

↓

governs

↓

Contract Interpretation

---

Data Processing Agreement

↓

governs

↓

Processing Activities

---

Security Policy

↓

governs

↓

Security Procedures

---

# Compiler Responsibilities

The compiler should

- resolve governing authorities
- validate governance chains
- preserve governance hierarchy
- detect conflicting governing objects
- support authority resolution

---

# Runtime Usage

The runtime may use governs to

- determine controlling agreements
- identify governing law
- resolve procedural authority
- organize document hierarchies
- support legal interpretation

---

# Validation Rules

A governance relationship should

- identify a valid governing object
- identify a valid governed object
- preserve direction
- avoid circular governance

Possible findings

- INVALID_GOVERNANCE
- UNKNOWN_GOVERNING_OBJECT
- CIRCULAR_GOVERNANCE
- MULTIPLE_GOVERNING_AUTHORITIES

---

# Non-Examples

governs should not represent

- legal precedence during conflict
- semantic dependency
- document structure
- procedural prerequisites
- legal creation

Those belong to separate relationship types.

---

# Relationship Comparison

governs

Meaning

Provides the controlling legal framework.

---

overrides

Meaning

Wins when two provisions conflict.

---

depends_on

Meaning

Requires another object for interpretation.

---

contains

Meaning

Represents document hierarchy.

---

implements

Meaning

Carries out a legal function.

---

# Knowledge Graph

Edge Type

Governance

Direction

Source

↓

Target

---

# Typical Drafting Signals

Common drafting language

- governed by
- shall be governed by
- subject to
- under this Agreement
- pursuant to
- in accordance with
- controlled by
- interpreted under

---

# Future Extensions

Future versions may support

- jurisdiction-specific governance
- delegated governance
- governance inheritance
- multi-layer governance
- cross-document governance

---

# Guiding Principle

Use **governs** when one ontology object provides the legal or procedural
framework within which another object operates.

Governance establishes authority.

It does not resolve conflicts between competing authorities.