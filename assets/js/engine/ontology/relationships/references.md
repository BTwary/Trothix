---
id: references
version: 1.0
status: stable

type: relationship

category:
  - Reference
---

# references

## Purpose

Represents a structural or semantic pointer from one ontology object to
another.

A reference indicates that the source object mentions, cites, or links to
the target object without necessarily depending upon or modifying it.

---

# Definition

A references relationship exists when one ontology object explicitly points
to another object for context, clarification, identification, or navigation.

The referenced object may provide additional information but is not always
required to understand the source.

---

# Relationship Type

Reference

---

# Direction

Source

↓

references

↓

Target

The relationship is directional.

---

# Valid Connections

Agreement

↓

references

↓

Schedule

---

Clause

↓

references

↓

Clause

---

Clause

↓

references

↓

DefinedTerm

---

Clause

↓

references

↓

Exhibit

---

StatementOfWork

↓

references

↓

Schedule

---

Notice

↓

references

↓

Agreement

---

# Common Examples

"This Agreement is subject to Schedule A."

↓

Agreement

references

Schedule

---

"Except as provided in Clause 8."

↓

Clause

references

Clause

---

"As defined in Section 1."

↓

Clause

references

DefinedTerm

---

"See Exhibit B."

↓

Clause

references

Exhibit

---

# Compiler Responsibilities

The compiler should

- resolve reference targets
- validate identifiers
- detect broken references
- preserve reference links
- distinguish references from dependencies

---

# Runtime Usage

The runtime may use references to

- navigate related documents
- expand user context
- resolve cross-rereferences
- assist deterministic reasoning

References alone should not trigger rule execution.

---

# Validation Rules

A reference should

- resolve to an existing ontology object
- preserve direction
- avoid ambiguous targets

Possible findings

- BROKEN_REFERENCE
- UNKNOWN_REFERENCE
- AMBIGUOUS_REFERENCE
- INVALID_REFERENCE_TARGET

---

# Non-Examples

references should not represent

- dependency
- modification
- precedence
- ownership
- containment

Those belong to separate relationship types.

---

# Relationship Comparison

references

Meaning

Points to another object.

---

depends_on

Meaning

Requires another object for interpretation.

---

modifies

Meaning

Changes another object's meaning.

---

overrides

Meaning

Takes legal precedence.

---

contains

Meaning

Structurally includes another object.

---

# Knowledge Graph

Edge Type

Reference

Direction

Source

↓

Target

---

# Future Extensions

Future versions may support

- external document references
- multi-document references
- version-aware references
- bidirectional navigation
- reference confidence

---

# Guiding Principle

If the source merely points to another object without requiring or changing
its meaning, use **references**.

If the source cannot be understood without the target, use
**depends_on** instead.