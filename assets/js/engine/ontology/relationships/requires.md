---
id: requires
version: 1.0
status: stable

type: relationship

category:
  - Prerequisite
---

# requires

## Purpose

Represents a prerequisite relationship where one ontology object cannot be
performed, satisfied, exercised, or completed unless another ontology
object exists or occurs first.

Unlike **depends_on**, requires describes an operational prerequisite rather
than a semantic dependency.

---

# Definition

A requires relationship exists when successful execution of a source object
is contingent upon the prior existence, completion, or satisfaction of a
target object.

---

# Relationship Type

Prerequisite

---

# Direction

Source

↓

requires

↓

Target

The relationship is directional.

---

# Valid Connections

Clause

↓

requires

↓

Notice

---

Payment

↓

requires

↓

Invoice

---

Termination

↓

requires

↓

Notice

---

Acceptance

↓

requires

↓

Deliverable

---

Rule

↓

requires

↓

Condition

---

# Common Examples

Payment Obligation

↓

requires

↓

Invoice

---

Termination Right

↓

requires

↓

Notice

---

Warranty Claim

↓

requires

↓

Defect Notice

---

Assignment

↓

requires

↓

Written Consent

---

Change Request

↓

requires

↓

Approval

---

# Compiler Responsibilities

The compiler should

- validate required objects
- detect missing prerequisites
- build prerequisite graphs
- preserve execution order
- identify unsatisfied requirements

---

# Runtime Usage

The runtime may use requires to

- determine execution order
- validate contractual procedures
- identify missing prerequisites
- explain unmet conditions
- support deterministic workflows

---

# Validation Rules

A requires relationship should

- identify a valid prerequisite
- preserve direction
- avoid circular prerequisite chains
- distinguish operational requirements from semantic dependencies

Possible findings

- MISSING_REQUIRED_OBJECT
- INVALID_REQUIREMENT
- CIRCULAR_REQUIREMENT
- UNKNOWN_REQUIREMENT

---

# Non-Examples

requires should not represent

- semantic interpretation
- legal precedence
- structural containment
- terminology
- document reference

Those belong to separate relationship types.

---

# Relationship Comparison

requires

Meaning

Needs another object before execution.

---

depends_on

Meaning

Needs another object for interpretation.

---

creates

Meaning

Produces another legal object.

---

implements

Meaning

Realizes a legal function.

---

references

Meaning

Points to another object.

---

# Knowledge Graph

Edge Type

Prerequisite

Direction

Source

↓

Target

---

# Typical Drafting Signals

Common drafting language

- provided that
- subject to
- only if
- after
- upon receipt of
- following
- contingent upon
- conditioned upon
- requires
- must first

---

# Future Extensions

Future versions may support

- conditional prerequisites
- alternative prerequisites
- multiple prerequisite paths
- jurisdiction-specific procedural requirements
- execution dependency graphs

---

# Guiding Principle

Use **requires** when one object cannot be validly performed or exercised
until another object has first been satisfied, completed, or provided.

The relationship models **procedural necessity**, not legal meaning.