---
id: conflicts_with
version: 1.0
status: stable

type: relationship

category:
  - Conflict
---

# conflicts_with

## Purpose

Represents a semantic relationship where two ontology objects are
incompatible, contradictory, or mutually inconsistent.

Unlike **overrides**, a conflict does not determine which object controls.
It simply records that both cannot be fully satisfied at the same time.

---

# Definition

A conflicts_with relationship exists when the legal meaning,
requirements, rights, obligations, or procedures represented by two
ontology objects cannot simultaneously operate without contradiction.

Conflict detection is an important precursor to conflict resolution.

---

# Relationship Type

Conflict

---

# Direction

Source

↓

conflicts_with

↓

Target

The relationship is directional for consistency, although conflicts are
normally reciprocal.

---

# Valid Connections

Clause

↓

conflicts_with

↓

Clause

---

Obligation

↓

conflicts_with

↓

Obligation

---

Policy

↓

conflicts_with

↓

Policy

---

Agreement

↓

conflicts_with

↓

Agreement

---

Rule

↓

conflicts_with

↓

Rule

---

# Common Examples

Agreement

↓

conflicts_with

↓

Statement of Work

---

Payment Clause

↓

conflicts_with

↓

Pricing Schedule

---

Confidentiality Clause

↓

conflicts_with

↓

Disclosure Requirement

---

Retention Policy

↓

conflicts_with

↓

Deletion Requirement

---

Exclusive Jurisdiction

↓

conflicts_with

↓

Mandatory Arbitration

---

# Compiler Responsibilities

The compiler should

- detect conflicting objects
- preserve conflict edges
- distinguish conflicts from overrides
- identify unresolved conflicts
- support conflict reporting

---

# Runtime Usage

The runtime may use conflicts_with to

- identify inconsistent drafting
- surface review findings
- recommend human review
- evaluate precedence rules
- support deterministic reasoning

Conflicts alone should not determine which object prevails.

---

# Validation Rules

A conflict should

- identify valid ontology objects
- preserve direction
- avoid duplicate reciprocal conflicts
- distinguish conflict from exclusion

Possible findings

- CONFLICT_DETECTED
- DUPLICATE_CONFLICT
- INVALID_CONFLICT
- UNRESOLVED_CONFLICT

---

# Non-Examples

conflicts_with should not represent

- legal precedence
- dependency
- structural containment
- procedural requirements
- legal creation

Those belong to separate relationship types.

---

# Relationship Comparison

conflicts_with

Meaning

Two objects are incompatible.

---

overrides

Meaning

One object legally prevails.

---

excludes

Meaning

One object removes another from its scope.

---

modifies

Meaning

One object changes another.

---

depends_on

Meaning

One object requires another for interpretation.

---

# Knowledge Graph

Edge Type

Conflict

Direction

Source

↓

Target

---

# Typical Drafting Signals

Common drafting language

- inconsistent with
- conflicts with
- contrary to
- incompatible with
- cannot both apply
- mutually exclusive
- inconsistent obligations
- conflicting provisions

---

# Resolution

A detected conflict may later be resolved by

- overrides
- governs
- order of precedence
- amendment
- applicable law

The existence of a conflict does not imply automatic resolution.

---

# Future Extensions

Future versions may support

- conflict severity
- jurisdiction-specific conflict rules
- automatic conflict grouping
- conflict resolution strategies
- compiler-assisted remediation

---

# Guiding Principle

Use **conflicts_with** when two ontology objects cannot operate together
without contradiction.

Conflict identifies the problem.

Other relationships determine the solution.