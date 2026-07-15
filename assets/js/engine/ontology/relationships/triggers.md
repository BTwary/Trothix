---
id: triggers
version: 1.0
status: stable

type: relationship

category:
  - Operational
---

# triggers

## Purpose

Represents a causal relationship where the occurrence of one ontology object
causes another legal event, obligation, right, procedure, or consequence to
become active.

Unlike **creates**, a trigger activates an existing legal mechanism rather
than establishing a new one.

---

# Definition

A triggers relationship exists when the occurrence or satisfaction of a
source object causes a target object to become applicable or enforceable.

---

# Relationship Type

Activation

---

# Direction

Source

↓

triggers

↓

Target

The relationship is directional.

---

# Valid Connections

Event

↓

triggers

↓

Obligation

---

Clause

↓

triggers

↓

Procedure

---

Notice

↓

triggers

↓

Cure Period

---

Payment Default

↓

triggers

↓

Interest

---

Termination Notice

↓

triggers

↓

Termination

---

# Common Examples

Late Payment

↓

triggers

↓

Interest

---

Breach

↓

triggers

↓

Termination Right

---

Delivery

↓

triggers

↓

Acceptance Review

---

Notice

↓

triggers

↓

Cure Period

---

Force Majeure Event

↓

triggers

↓

Performance Suspension

---

Claim

↓

triggers

↓

Defense Obligation

---

# Compiler Responsibilities

The compiler should

- build trigger chains
- validate trigger targets
- detect unreachable triggers
- preserve activation order
- support event-based reasoning

---

# Runtime Usage

The runtime may use triggers to

- activate rules
- begin workflows
- start contractual deadlines
- enable rights
- activate obligations
- determine legal consequences

---

# Validation Rules

A trigger should

- identify a valid source event
- identify a valid activation target
- preserve direction
- avoid circular trigger chains

Possible findings

- UNKNOWN_TRIGGER
- INVALID_TRIGGER
- CIRCULAR_TRIGGER
- BROKEN_TRIGGER_CHAIN

---

# Non-Examples

triggers should not represent

- semantic dependency
- document reference
- legal precedence
- structural containment
- definition

Those belong to separate relationship types.

---

# Relationship Comparison

triggers

Meaning

Activates an existing legal effect.

---

creates

Meaning

Brings a new legal object into existence.

---

requires

Meaning

Must exist beforehand.

---

implements

Meaning

Realizes a legal function.

---

depends_on

Meaning

Requires another object for interpretation.

---

# Knowledge Graph

Edge Type

Activation

Direction

Source

↓

Target

---

# Typical Drafting Signals

Common drafting language

- upon
- when
- once
- if
- following
- after
- immediately upon
- automatically upon
- shall trigger
- results in

---

# Future Extensions

Future versions may support

- delayed triggers
- recurring triggers
- conditional triggers
- multi-stage trigger chains
- jurisdiction-specific trigger rules

---

# Guiding Principle

Use **triggers** when the occurrence of one legal object activates another
existing legal object, procedure, right, or obligation.

The trigger starts something that was already defined elsewhere in the
agreement.