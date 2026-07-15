---
id: survives
version: 1.0
status: stable

type: relationship

category:
  - Lifecycle
---

# survives

## Purpose

Represents a lifecycle relationship where a legal object continues to remain
effective after another legal object has expired, terminated, or otherwise
ceased to operate.

A survival relationship preserves legal effect beyond the normal lifecycle
of an agreement or obligation.

---

# Definition

A survives relationship exists when the legal force of a source object
continues after the occurrence of a terminating event affecting the target
object.

The target usually represents the legal object whose end would otherwise
terminate the source.

---

# Relationship Type

Lifecycle

---

# Direction

Source

↓

survives

↓

Target

The relationship is directional.

---

# Valid Connections

Clause

↓

survives

↓

Agreement

---

Obligation

↓

survives

↓

Termination

---

Right

↓

survives

↓

Agreement Expiration

---

Indemnity

↓

survives

↓

Termination

---

Confidentiality

↓

survives

↓

Agreement

---

# Common Examples

Confidentiality Clause

↓

survives

↓

Termination

---

Payment Obligations

↓

survives

↓

Agreement

---

Dispute Resolution

↓

survives

↓

Agreement

---

Indemnity

↓

survives

↓

Termination

---

Audit Rights

↓

survives

↓

Expiration

---

# Compiler Responsibilities

The compiler should

- preserve survival relationships
- validate lifecycle targets
- build post-termination graphs
- identify surviving obligations
- support lifecycle reasoning

---

# Runtime Usage

The runtime may use survives to

- determine post-termination obligations
- identify continuing rights
- evaluate surviving clauses
- support lifecycle analysis
- explain continuing legal effects

---

# Validation Rules

A survival relationship should

- identify a valid lifecycle target
- preserve direction
- distinguish survival from dependency
- avoid invalid lifecycle references

Possible findings

- INVALID_SURVIVAL_TARGET
- UNKNOWN_SURVIVAL_REFERENCE
- DUPLICATE_SURVIVAL
- BROKEN_SURVIVAL_CHAIN

---

# Non-Examples

survives should not represent

- dependency
- legal precedence
- document structure
- definition
- procedural requirement

Those belong to separate relationship types.

---

# Relationship Comparison

survives

Meaning

Continues beyond another object's lifecycle.

---

triggers

Meaning

Activates another object.

---

requires

Meaning

Needs another object beforehand.

---

overrides

Meaning

Takes legal priority.

---

creates

Meaning

Brings a legal object into existence.

---

# Knowledge Graph

Edge Type

Lifecycle

Direction

Source

↓

Target

---

# Typical Drafting Signals

Common drafting language

- shall survive
- survives termination
- survives expiration
- continues after termination
- remains in effect
- remains binding
- continues notwithstanding termination

---

# Future Extensions

Future versions may support

- time-limited survival
- conditional survival
- jurisdiction-specific survival rules
- automatic survival inference
- survival duration tracking

---

# Guiding Principle

Use **survives** when a legal object remains effective after another legal
object has ended.

Survival models **continuity across lifecycle boundaries**, not legal
precedence or dependency.