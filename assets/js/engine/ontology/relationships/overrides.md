---
id: overrides
version: 1.0
status: stable

type: relationship

category:
  - Precedence
---

# overrides

## Purpose

Represents a legal precedence relationship where one ontology object takes
priority over another when both apply to the same situation.

The overridden object is not removed from the agreement.

It simply becomes subordinate whenever the overriding object applies.

---

# Definition

An overrides relationship exists when the legal effect of one object
prevails over another in cases of inconsistency, conflict, or competing
application.

---

# Relationship Type

Precedence

---

# Direction

Source

↓

overrides

↓

Target

The relationship is directional.

---

# Valid Connections

Clause

↓

overrides

↓

Clause

---

Amendment

↓

overrides

↓

Agreement

---

Schedule

↓

overrides

↓

Clause

---

Order of Precedence

↓

overrides

↓

Document Hierarchy

---

# Common Examples

Amendment

↓

overrides

↓

Original Agreement

---

Order of Precedence Clause

↓

overrides

↓

Conflicting Schedule

---

"Notwithstanding anything to the contrary..."

↓

Current Clause

↓

overrides

↓

Referenced Clause

---

Special Terms

↓

overrides

↓

General Terms

---

# Compiler Responsibilities

The compiler should

- detect override chains
- preserve precedence order
- resolve conflicts deterministically
- validate override targets
- detect conflicting override graphs

---

# Runtime Usage

The runtime may use overrides to

- resolve conflicting obligations
- determine effective contractual meaning
- establish rule priority
- suppress lower-priority findings

---

# Validation Rules

An override should

- identify the overridden object
- preserve direction
- avoid circular precedence
- resolve deterministically

Possible findings

- BROKEN_OVERRIDE
- UNKNOWN_OVERRIDE_TARGET
- CIRCULAR_OVERRIDE
- CONFLICTING_PRECEDENCE

---

# Non-Examples

overrides should not represent

- modification
- dependency
- reference
- structural inclusion
- ownership

Those belong to separate relationship types.

---

# Relationship Comparison

overrides

Meaning

Takes legal priority.

---

modifies

Meaning

Changes another object's meaning.

---

depends_on

Meaning

Requires another object.

---

references

Meaning

Points to another object.

---

contains

Meaning

Structurally includes another object.

---

# Knowledge Graph

Edge Type

Precedence

Direction

Source

↓

Target

---

# Typical Drafting Signals

Common drafting language

- notwithstanding
- shall prevail
- supersedes
- controls
- takes precedence
- prevails over
- in the event of conflict
- except as otherwise provided

---

# Future Extensions

Future versions may support

- conditional overrides
- jurisdiction-specific precedence
- document hierarchy resolution
- precedence scoring
- version-aware override chains

---

# Guiding Principle

Use **overrides** when two provisions cannot both govern the same situation
and one must legally prevail.

The overridden object remains part of the agreement but yields whenever the
overriding object applies.