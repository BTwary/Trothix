---
id: ontology-relationships
version: 1.0
status: stable

type: ontology

category:
  - Relationships
---

# Ontology Relationships

## Purpose

Relationships define the semantic connections between ontology objects.

They describe how entities, concepts, functions, clauses, and agreements
interact within the Trothix knowledge model.

Relationships are the edges of the knowledge graph.

Objects are nodes.

---

# Design Goals

Relationships should

- represent one semantic meaning
- be deterministic
- be directional
- be reusable
- remain independent of drafting language
- support compiler validation

---

# What Relationships Connect

Relationships may connect

- Entity → Entity
- Entity → Concept
- Concept → Concept
- Clause → Clause
- Clause → Concept
- Clause → Function
- Agreement → Entity
- Agreement → Clause

Examples

Agreement

↓

contains

↓

Clause

---

Clause

↓

creates

↓

Obligation

---

Party

↓

receives

↓

Notice

---

Confidentiality

↓

depends_on

↓

Definitions

---

# Direction

Relationships are directional.

Example

Agreement

↓

contains

↓

Clause

is NOT equivalent to

Clause

↓

contains

↓

Agreement

The direction conveys legal meaning.

---

# Canonical Relationship Types

Relationships should represent legal semantics rather than drafting wording.

Examples include

- depends_on
- modifies
- overrides
- references
- implements
- requires
- creates
- grants
- restricts
- triggers
- survives
- incorporates
- governs
- defines
- contains
- applies_to
- excludes
- conflicts_with

Each relationship has its own specification document.

---

# Relationship Properties

Every relationship should define

- identifier
- source
- target
- direction
- semantic meaning
- valid source types
- valid target types

Optional properties may include

- priority
- confidence
- jurisdiction
- conditions

---

# Relationship Rules

A relationship should

- connect valid ontology objects
- avoid ambiguity
- express exactly one semantic meaning
- avoid duplication
- remain stable across versions

---

# Relationship Validation

The compiler should detect

- broken references
- circular dependencies
- duplicate relationships
- invalid source types
- invalid target types
- conflicting semantics
- unreachable nodes

---

# Runtime Usage

The runtime should use relationships to

- resolve dependencies
- evaluate rule execution order
- navigate the knowledge graph
- identify affected clauses
- support deterministic reasoning

---

# Compiler Responsibilities

The compiler should

- validate relationships
- resolve identifiers
- detect cycles
- build graph edges
- normalize aliases
- preserve stable identifiers

The compiler should not infer new relationships automatically.

---

# Future Extensions

Future versions may support

- weighted relationships
- temporal relationships
- jurisdiction-specific relationships
- conditional relationships
- probabilistic metadata
- graph optimization

---

# Guiding Principle

Entities describe what exists.

Concepts describe legal meaning.

Functions describe legal purpose.

Relationships describe how everything is connected.

The quality of deterministic reasoning depends on the correctness of these
relationships.