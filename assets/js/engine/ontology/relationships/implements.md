---
id: implements
version: 1.0
status: stable

type: relationship

category:
  - Behavioral
---

# implements

## Purpose

Represents a relationship where one ontology object realizes, fulfills,
or operationalizes the purpose of another ontology object.

An implementation gives practical effect to an abstract legal function.

---

# Definition

An implements relationship exists when a source object performs the legal
purpose represented by a target object.

The target describes *why*.

The source describes *how*.

---

# Relationship Type

Behavioral

---

# Direction

Source

↓

implements

↓

Target

The relationship is directional.

---

# Valid Connections

Clause

↓

implements

↓

Legal Function

---

Agreement

↓

implements

↓

Commercial Framework

---

Rule

↓

implements

↓

Legal Function

---

Process

↓

implements

↓

Requirement

---

# Common Examples

Confidentiality Clause

↓

implements

↓

DISCLOSURE_CONTROL

---

Payment Clause

↓

implements

↓

PAYMENT_OBLIGATION

---

Termination Clause

↓

implements

↓

CONTRACT_EXIT

---

Indemnity Clause

↓

implements

↓

RISK_ALLOCATION

---

Notice Clause

↓

implements

↓

COMMUNICATION_REQUIREMENT

---

Warranty Clause

↓

implements

↓

QUALITY_ASSURANCE

---

# Compiler Responsibilities

The compiler should

- connect clauses to legal functions
- validate function identifiers
- detect duplicate implementations
- support function-based rule generation

---

# Runtime Usage

The runtime may use implements to

- classify clauses
- organize findings
- execute function-specific rules
- explain legal purpose
- improve semantic navigation

---

# Validation Rules

An implementation should

- reference a valid legal function
- preserve direction
- avoid ambiguous mappings
- identify exactly one primary function

A clause may implement multiple legal functions.

Possible findings

- UNKNOWN_FUNCTION
- INVALID_IMPLEMENTATION
- DUPLICATE_IMPLEMENTATION
- MISSING_FUNCTION

---

# Non-Examples

implements should not represent

- dependency
- modification
- legal precedence
- document structure
- terminology

Those belong to separate relationship types.

---

# Relationship Comparison

implements

Meaning

Realizes a legal purpose.

---

creates

Meaning

Produces a legal object.

---

defines

Meaning

Establishes meaning.

---

contains

Meaning

Represents document structure.

---

depends_on

Meaning

Requires another object.

---

# Knowledge Graph

Edge Type

Implementation

Direction

Source

↓

Target

---

# Typical Drafting Signals

Implementation is usually inferred rather than stated.

Examples

- shall maintain confidentiality
- shall pay
- may terminate
- must notify
- shall indemnify

These expressions implement higher-level legal functions.

---

# Future Extensions

Future versions may support

- implementation confidence
- multiple implementation paths
- inferred implementations
- jurisdiction-specific implementations
- implementation inheritance

---

# Guiding Principle

Use **implements** when an ontology object gives operational effect to an
abstract legal purpose.

Functions answer **why**.

Implementations answer **how**.