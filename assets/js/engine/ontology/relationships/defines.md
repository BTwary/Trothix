---
id: defines
version: 1.0
status: stable

type: relationship

category:
  - Definition
---

# defines

## Purpose

Represents a semantic relationship where one ontology object establishes
the meaning, interpretation, scope, or identity of another ontology object.

The defines relationship is the primary bridge between contractual language
and canonical ontology concepts.

---

# Definition

A defines relationship exists when a source object explicitly specifies the
meaning or interpretation of a target object.

The target object subsequently inherits that definition whenever referenced
within its applicable scope.

---

# Relationship Type

Definition

---

# Direction

Source

↓

defines

↓

Target

The relationship is directional.

---

# Valid Connections

DefinedTerm

↓

defines

↓

Concept

---

Agreement

↓

defines

↓

DefinedTerm

---

Clause

↓

defines

↓

Term

---

Schedule

↓

defines

↓

Technical Requirement

---

Glossary

↓

defines

↓

Concept

---

# Common Examples

Defined Term

↓

defines

↓

CONFIDENTIAL_INFORMATION

---

Definitions Clause

↓

defines

↓

Affiliate

---

Agreement

↓

defines

↓

Business Day

---

Technical Schedule

↓

defines

↓

Service Level

---

# Compiler Responsibilities

The compiler should

- resolve defined terms
- normalize aliases
- bind concepts
- validate duplicate definitions
- detect conflicting definitions

---

# Runtime Usage

The runtime may use defines to

- resolve terminology
- normalize language
- expand definitions
- interpret clauses
- reduce false positives

---

# Validation Rules

A defines relationship should

- identify one canonical meaning
- preserve scope
- avoid conflicting definitions
- reference valid ontology objects

Possible findings

- DUPLICATE_DEFINITION
- CONFLICTING_DEFINITION
- UNDEFINED_TERM
- INVALID_DEFINITION
- BROKEN_DEFINITION_REFERENCE

---

# Non-Examples

defines should not represent

- dependency
- precedence
- modification
- reference
- containment

Those belong to separate relationship types.

---

# Relationship Comparison

defines

Meaning

Establishes legal meaning.

---

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

Produces a legal object.

---

# Knowledge Graph

Edge Type

Definition

Direction

Definition Source

↓

Defined Object

---

# Typical Drafting Signals

Common drafting language

- means
- shall mean
- is defined as
- refers to
- includes
- includes only
- has the meaning given in
- for the purposes of this Agreement

---

# Scope

Definitions may apply at different levels

- Agreement
- Schedule
- Exhibit
- Statement of Work
- Individual Clause

The compiler should preserve definition scope when resolving terms.

---

# Future Extensions

Future versions may support

- inherited definitions
- overridden definitions
- multilingual definitions
- ontology-backed definitions
- cross-document definition resolution

---

# Guiding Principle

Use **defines** whenever one ontology object establishes the legal meaning
or interpretation of another.

A definition determines **what something means**, not **how it behaves**.