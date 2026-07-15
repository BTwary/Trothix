---
id: depends_on
version: 1.0
status: stable

type: relationship

category:
  - Dependency
---

# depends_on

## Purpose

Represents a semantic dependency where the meaning, interpretation,
execution, or validity of one ontology object relies upon another.

A dependency does not imply ownership or hierarchy.

It expresses that one object cannot be fully understood or evaluated
without another.

---

# Definition

A depends_on relationship exists when a source object requires information
or interpretation from a target object before deterministic reasoning can
be completed.

---

# Relationship Type

Dependency

---

# Direction

Source

↓

depends_on

↓

Target

The relationship is directional.

Changing the direction changes the legal meaning.

---

# Valid Connections

Entity

↓

depends_on

↓

Entity

---

Concept

↓

depends_on

↓

Concept

---

Clause

↓

depends_on

↓

Clause

---

Clause

↓

depends_on

↓

Concept

---

Function

↓

depends_on

↓

Concept

---

# Common Examples

Confidentiality Clause

↓

depends_on

↓

Definitions

---

Payment Clause

↓

depends_on

↓

Invoice

---

Indemnity

↓

depends_on

↓

Limitation of Liability

---

Service Levels

↓

depends_on

↓

Statement of Work

---

Acceptance

↓

depends_on

↓

Deliverable

---

Termination

↓

depends_on

↓

Notice

---

# Compiler Responsibilities

The compiler should

- resolve dependency chains
- validate dependency targets
- detect missing dependencies
- detect circular dependencies
- establish evaluation order

---

# Runtime Usage

The runtime may use dependencies to

- determine rule execution order
- resolve clause meaning
- expand context
- navigate related concepts
- identify affected findings

---

# Validation Rules

A dependency should

- reference an existing ontology object
- avoid self-dependency
- avoid cycles unless explicitly supported
- represent a genuine semantic dependency

Possible findings

- BROKEN_DEPENDENCY
- CIRCULAR_DEPENDENCY
- INVALID_DEPENDENCY
- UNKNOWN_DEPENDENCY_TARGET

---

# Non-Examples

depends_on should not represent

- ownership
- document hierarchy
- reference only
- legal precedence
- modification

Those belong to separate relationship types.

---

# Relationship Comparison

depends_on

Meaning

Requires another object for interpretation.

---

references

Meaning

Points to another object without requiring it.

---

modifies

Meaning

Changes the meaning of another object.

---

overrides

Meaning

Takes precedence over another object.

---

contains

Meaning

Represents structural inclusion.

---

# Knowledge Graph

Edge Type

Dependency

Direction

Source

↓

Target

---

# Future Extensions

Future versions may support

- conditional dependencies
- temporal dependencies
- jurisdiction-specific dependencies
- weighted dependency strength
- dependency inheritance

---

# Guiding Principle

If removing the target changes the interpretation of the source,
the source probably depends_on the target.

If removing the target merely removes supporting information,
another relationship type is likely more appropriate.