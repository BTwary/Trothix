---
id: creates
version: 1.0
status: stable

type: relationship

category:
  - Legal Effect
---

# creates

## Purpose

Represents a relationship where one ontology object gives rise to a new
legal object, legal state, legal right, legal obligation, or legal effect.

The created object did not previously exist within the contractual context.

---

# Definition

A creates relationship exists when the legal operation of a source object
establishes a new legal consequence or legal construct.

Creation may occur

- immediately
- upon execution
- upon a triggering event
- upon satisfaction of conditions

---

# Relationship Type

Legal Effect

---

# Direction

Source

↓

creates

↓

Target

The relationship is directional.

---

# Valid Connections

Agreement

↓

creates

↓

Rights

---

Agreement

↓

creates

↓

Obligations

---

Clause

↓

creates

↓

Obligation

---

Clause

↓

creates

↓

Permission

---

Clause

↓

creates

↓

Restriction

---

Termination

↓

creates

↓

Survival Obligation

---

Amendment

↓

creates

↓

New Obligation

---

# Common Examples

Confidentiality Clause

↓

creates

↓

Confidentiality Obligation

---

Payment Clause

↓

creates

↓

Payment Obligation

---

Agreement

↓

creates

↓

Contractual Relationship

---

Notice Clause

↓

creates

↓

Notice Requirement

---

Warranty Clause

↓

creates

↓

Warranty Rights

---

# Compiler Responsibilities

The compiler should

- identify created legal objects
- preserve creation relationships
- validate source types
- validate target types
- establish downstream rule evaluation

---

# Runtime Usage

The runtime may use creates to

- construct obligation graphs
- construct rights graphs
- determine legal consequences
- identify generated duties
- support deterministic reasoning

---

# Validation Rules

A creates relationship should

- identify a valid creator
- identify a valid created object
- preserve direction
- avoid duplicate creation edges

Possible findings

- INVALID_CREATOR
- UNKNOWN_CREATED_OBJECT
- DUPLICATE_CREATION
- BROKEN_CREATION_REFERENCE

---

# Non-Examples

creates should not represent

- modification
- dependency
- legal precedence
- document reference
- structural inclusion

Those belong to separate relationship types.

---

# Relationship Comparison

creates

Meaning

Brings a legal object into existence.

---

defines

Meaning

Explains the meaning of an existing object.

---

contains

Meaning

Structurally includes another object.

---

requires

Meaning

Needs another object before execution.

---

implements

Meaning

Carries out a legal purpose.

---

# Knowledge Graph

Edge Type

Creation

Direction

Source

↓

Target

---

# Typical Drafting Signals

Common drafting language

- shall create
- establishes
- gives rise to
- entitles
- imposes
- grants
- confers
- results in
- creates
- forms

---

# Future Extensions

Future versions may support

- conditional creation
- delayed creation
- event-driven creation
- jurisdiction-specific legal effects
- creation chains

---

# Guiding Principle

Use **creates** when the legal operation of one object establishes another
legal object, legal relationship, right, obligation, or consequence that
did not previously exist.