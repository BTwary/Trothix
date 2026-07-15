---
id: excludes
version: 1.0
status: stable

type: relationship

category:
  - Conflict
---

# excludes

## Purpose

Represents a relationship where one ontology object explicitly removes
another object from its scope, application, legal effect, or interpretation.

An exclusion narrows the application of a rule without invalidating the
excluded object itself.

---

# Definition

An excludes relationship exists when the source object expressly states
that the target object is outside its legal scope or application.

The excluded object continues to exist independently.

It simply does not fall within the source object's operation.

---

# Relationship Type

Scope Exclusion

---

# Direction

Source

↓

excludes

↓

Target

The relationship is directional.

---

# Valid Connections

Definition

↓

excludes

↓

Concept

---

Clause

↓

excludes

↓

Situation

---

Policy

↓

excludes

↓

Activity

---

Warranty

↓

excludes

↓

Misuse

---

Liability Cap

↓

excludes

↓

Fraud

---

# Common Examples

Confidential Information

↓

excludes

↓

Public Information

---

Indemnity

↓

excludes

↓

Sole Negligence

---

Force Majeure

↓

excludes

↓

Payment Obligations

---

Warranty

↓

excludes

↓

Unauthorized Modification

---

Liability Limitation

↓

excludes

↓

Willful Misconduct

---

# Compiler Responsibilities

The compiler should

- preserve exclusion relationships
- distinguish exclusions from overrides
- validate exclusion targets
- resolve nested exclusions
- support carve-out analysis

---

# Runtime Usage

The runtime may use excludes to

- narrow clause scope
- reduce false positives
- evaluate carve-outs
- determine applicable obligations
- explain legal exceptions

---

# Validation Rules

An exclusion should

- identify a valid excluded object
- preserve direction
- avoid contradictory exclusions
- distinguish exclusions from conflicts

Possible findings

- INVALID_EXCLUSION
- UNKNOWN_EXCLUSION_TARGET
- DUPLICATE_EXCLUSION
- CONTRADICTORY_EXCLUSION

---

# Non-Examples

excludes should not represent

- legal precedence
- semantic dependency
- document structure
- procedural requirements
- legal creation

Those belong to separate relationship types.

---

# Relationship Comparison

excludes

Meaning

Removes something from scope.

---

overrides

Meaning

Takes precedence over another object.

---

modifies

Meaning

Changes another object's meaning.

---

conflicts_with

Meaning

Represents incompatible objects.

---

defines

Meaning

Establishes legal meaning.

---

# Knowledge Graph

Edge Type

Scope Exclusion

Direction

Source

↓

Target

---

# Typical Drafting Signals

Common drafting language

- excludes
- excluding
- except
- except for
- other than
- does not include
- shall not apply to
- excluding but not limited to
- does not extend to

---

# Legal Importance

Exclusions are fundamental to commercial contracts because they define
the boundaries of legal obligations, rights, liabilities, and remedies.

Many legal disputes arise from disagreement over whether a particular
situation falls inside or outside an exclusion.

---

# Future Extensions

Future versions may support

- conditional exclusions
- jurisdiction-specific exclusions
- nested carve-outs
- exclusion precedence
- temporal exclusions

---

# Guiding Principle

Use **excludes** whenever one legal object expressly removes another object
from its scope or application.

An exclusion narrows the rule.

It does not eliminate the excluded object itself.