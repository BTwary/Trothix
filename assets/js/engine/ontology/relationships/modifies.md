---
id: modifies
version: 1.0
status: stable

type: relationship

category:
  - Modification
---

# modifies

## Purpose

Represents a semantic relationship where one ontology object changes,
limits, extends, supplements, or alters the meaning, interpretation, or
effect of another object.

The target object continues to exist.

Only its behavior or meaning changes.

---

# Definition

A modifies relationship exists when a source object changes one or more
characteristics of a target object without replacing or invalidating it.

Modification may affect

- scope
- obligations
- rights
- timing
- liability
- procedures
- interpretation

---

# Relationship Type

Modification

---

# Direction

Source

↓

modifies

↓

Target

The relationship is directional.

---

# Valid Connections

Amendment

↓

modifies

↓

Agreement

---

Clause

↓

modifies

↓

Clause

---

Schedule

↓

modifies

↓

Commercial Terms

---

Concept

↓

modifies

↓

Concept

---

Rule

↓

modifies

↓

Rule

---

# Common Examples

Force Majeure Clause

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

Change Control

↓

modifies

↓

Scope of Work

---

Amendment

↓

modifies

↓

Agreement

---

Schedule

↓

modifies

↓

Pricing Terms

---

# Compiler Responsibilities

The compiler should

- preserve modification chains
- resolve modified targets
- validate source and target
- detect conflicting modifications
- establish evaluation order

---

# Runtime Usage

The runtime may use modifications to

- adjust rule evaluation
- alter semantic interpretation
- calculate effective obligations
- determine applicable contract terms

---

# Validation Rules

A modification should

- reference an existing target
- preserve direction
- avoid circular modification chains
- identify the modified object

Possible findings

- BROKEN_MODIFICATION
- INVALID_MODIFICATION
- CIRCULAR_MODIFICATION
- UNKNOWN_MODIFICATION_TARGET

---

# Non-Examples

modifies should not represent

- replacement
- dependency
- structural inclusion
- document reference
- legal precedence

Those belong to separate relationship types.

---

# Relationship Comparison

modifies

Meaning

Changes the behavior or meaning of another object.

---

overrides

Meaning

Takes legal priority over another object.

---

references

Meaning

Points to another object.

---

depends_on

Meaning

Requires another object for interpretation.

---

contains

Meaning

Represents structural inclusion.

---

# Knowledge Graph

Edge Type

Modification

Direction

Source

↓

Target

---

# Future Extensions

Future versions may support

- conditional modifications
- partial modifications
- temporal modifications
- jurisdiction-specific modifications
- version-aware modification chains

---

# Guiding Principle

If both objects continue to exist but one changes how the other operates,
use **modifies**.

If the target is completely displaced by the source, **overrides** is usually
the more appropriate relationship.