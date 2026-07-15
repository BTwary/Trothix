---
id: applies_to
version: 1.0
status: stable

type: relationship

category:
  - Scope
---

# applies_to

## Purpose

Represents a scope relationship where one ontology object is applicable to
another object under the Agreement.

Unlike **requires**, which expresses prerequisites, **applies_to**
determines whether a legal object is relevant to a particular subject.

---

# Definition

An applies_to relationship exists when the legal effect, obligation,
restriction, permission, right, or procedure represented by the source
object governs a particular target object.

Scope determines applicability.

---

# Relationship Type

Scope

---

# Direction

Source

↓

applies_to

↓

Target

The relationship is directional.

---

# Valid Connections

Clause

↓

applies_to

↓

Party

---

Clause

↓

applies_to

↓

Service

---

Clause

↓

applies_to

↓

Deliverable

---

Policy

↓

applies_to

↓

Data

---

Obligation

↓

applies_to

↓

Party

---

Rule

↓

applies_to

↓

Concept

---

# Common Examples

Confidentiality Clause

↓

applies_to

↓

Confidential Information

---

Payment Clause

↓

applies_to

↓

Invoice

---

Warranty

↓

applies_to

↓

Deliverable

---

Export Control Clause

↓

applies_to

↓

Products

---

Data Protection Clause

↓

applies_to

↓

Personal Data

---

Non-Compete

↓

applies_to

↓

Employee

---

Service Level Agreement

↓

applies_to

↓

Covered Services

---

# Compiler Responsibilities

The compiler should

- preserve scope relationships
- validate scope targets
- detect ambiguous applicability
- support scoped rule execution
- resolve inherited scope

---

# Runtime Usage

The runtime may use applies_to to

- determine whether a rule is relevant
- filter findings
- identify affected parties
- narrow legal analysis
- improve deterministic reasoning

---

# Validation Rules

An applies_to relationship should

- identify a valid scope target
- preserve direction
- avoid ambiguous scope
- distinguish applicability from dependency

Possible findings

- INVALID_SCOPE
- UNKNOWN_SCOPE_TARGET
- AMBIGUOUS_SCOPE
- DUPLICATE_SCOPE

---

# Non-Examples

applies_to should not represent

- legal precedence
- dependency
- procedural prerequisites
- document structure
- legal creation

Those belong to separate relationship types.

---

# Relationship Comparison

applies_to

Meaning

Defines the scope of applicability.

---

requires

Meaning

Needs another object before execution.

---

depends_on

Meaning

Needs another object for interpretation.

---

governs

Meaning

Provides the controlling legal framework.

---

implements

Meaning

Realizes a legal function.

---

# Knowledge Graph

Edge Type

Scope

Direction

Source

↓

Target

---

# Typical Drafting Signals

Common drafting language

- applies to
- shall apply to
- applies only to
- applies solely to
- with respect to
- in relation to
- for all
- regarding
- concerning

---

# Scope Dimensions

Applicability may be limited by

- Parties
- Products
- Services
- Deliverables
- Data
- Territory
- Time
- Jurisdiction
- Transaction Type

The compiler should preserve these dimensions where available.

---

# Future Extensions

Future versions may support

- conditional applicability
- territorial scope
- temporal scope
- jurisdiction-specific applicability
- inherited scope

---

# Guiding Principle

Use **applies_to** whenever a legal object defines **who**, **what**, or
**where** its legal effect extends.

Applicability determines whether a rule should be considered during
deterministic reasoning.