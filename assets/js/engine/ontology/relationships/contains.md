---
id: contains
version: 1.0
status: stable

type: relationship

category:
  - Structural
---

# contains

## Purpose

Represents a structural relationship where one ontology object directly
includes one or more subordinate objects.

Unlike semantic relationships, contains expresses document or object
composition rather than legal meaning.

---

# Definition

A contains relationship exists when a source object structurally encloses
another ontology object as part of its composition.

Containment does not imply dependency, modification, or legal precedence.

---

# Relationship Type

Structural

---

# Direction

Source

↓

contains

↓

Target

The relationship is directional.

---

# Valid Connections

Agreement

↓

contains

↓

Clause

---

Agreement

↓

contains

↓

Schedule

---

Agreement

↓

contains

↓

Exhibit

---

StatementOfWork

↓

contains

↓

Deliverable

---

Clause

↓

contains

↓

DefinedTerm

---

Schedule

↓

contains

↓

Clause

---

# Common Examples

Agreement

↓

contains

↓

Payment Clause

---

Agreement

↓

contains

↓

Confidentiality Clause

---

Agreement

↓

contains

↓

Termination Clause

---

StatementOfWork

↓

contains

↓

Milestones

---

Schedule

↓

contains

↓

Pricing Table

---

# Compiler Responsibilities

The compiler should

- preserve structural hierarchy
- maintain parent-child relationships
- support tree traversal
- validate containment targets
- detect invalid containment

---

# Runtime Usage

The runtime may use contains to

- navigate documents
- build document trees
- scope searches
- resolve hierarchical context
- organize findings

---

# Validation Rules

A contains relationship should

- have one parent
- identify a valid child
- avoid structural cycles
- preserve hierarchy

Possible findings

- INVALID_CONTAINMENT
- CIRCULAR_CONTAINMENT
- DUPLICATE_CHILD
- UNKNOWN_CHILD

---

# Non-Examples

contains should not represent

- dependency
- reference
- modification
- precedence
- legal effect

Those belong to separate relationship types.

---

# Relationship Comparison

contains

Meaning

Structurally includes another object.

---

references

Meaning

Points to another object.

---

depends_on

Meaning

Requires another object.

---

creates

Meaning

Produces another legal object.

---

modifies

Meaning

Changes another object's meaning.

---

# Knowledge Graph

Edge Type

Structural

Direction

Parent

↓

Child

---

# Typical Drafting Signals

Common drafting language

- includes
- contains
- consists of
- comprises
- attached
- incorporated
- forms part of

---

# Future Extensions

Future versions may support

- nested containment
- document fragments
- logical sections
- virtual containers
- cross-document containment

---

# Guiding Principle

Use **contains** when one object forms part of the physical or logical
structure of another object.

The relationship describes organization, not legal meaning.