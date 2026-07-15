---
id: legal-drafting-patterns
version: 1.0
status: stable
priority: critical

category:
  - Knowledge Standard
  - Semantic Patterns

applies_to:
  - All Clause Packs

compiler:
  exported: true
---

# Legal Drafting Patterns

## Purpose

Define canonical drafting patterns used in commercial contracts.

Different wording often expresses the same legal function.
The compiler should normalize drafting variations into common semantic concepts
rather than treating them as distinct rules.

---

# Pattern Categories

## Obligation

### OBLIGATION_STRONG

Purpose

Creates a mandatory legal obligation.

Common Expressions

- shall
- must
- is required to
- agrees to
- undertakes to
- will

Semantic Meaning

MANDATORY_OBLIGATION

---

### OBLIGATION_SOFT

Purpose

Creates a weaker expectation.

Examples

- should
- is expected to
- normally
- ordinarily

Semantic Meaning

RECOMMENDATION

---

## Permission

### PERMISSION

Examples

- may
- may elect to
- is permitted to
- has the right to
- is entitled to
- can

Semantic Meaning

PERMISSION

---

## Prohibition

### PROHIBITION

Examples

- shall not
- must not
- may not
- is prohibited from
- will not
- shall never

Semantic Meaning

PROHIBITION

---

## Condition

### CONDITION

Examples

- if
- provided that
- subject to
- unless
- upon
- in the event that

Semantic Meaning

CONDITION

---

## Exception

### EXCEPTION

Examples

- except
- except that
- save as
- excluding
- other than
- with the exception of

Semantic Meaning

EXCEPTION

---

## Carve-Out

### CARVE_OUT

Examples

- notwithstanding
- except for
- provided however
- shall not apply to
- does not include
- excluding

Semantic Meaning

CARVE_OUT

---

## Limitation

### LIMITATION

Examples

- limited to
- only
- solely
- exclusively
- to the extent
- capped at

Semantic Meaning

LIMITATION

---

## Expansion

### INCLUSION

Examples

- includes
- including
- without limitation
- including but not limited to

Semantic Meaning

EXPANSION

---

## Obligation Trigger

### TRIGGER

Examples

- upon receipt
- following
- after
- immediately upon
- once
- when

Semantic Meaning

EVENT_TRIGGER

---

## Time

### TIME_REFERENCE

Examples

- immediately
- promptly
- within
- no later than
- business days
- calendar days

Semantic Meaning

TIME_CONSTRAINT

---

## Priority

### PRIORITY

Examples

- notwithstanding
- prevails
- supersedes
- controls
- overrides
- takes precedence

Semantic Meaning

PRIORITY_RULE

---

## Reference

### CROSS_REFERENCE

Examples

- Section
- Clause
- Schedule
- Exhibit
- Annex
- Appendix
- Attachment

Semantic Meaning

DOCUMENT_REFERENCE

---

## Definition

### DEFINITION

Examples

- means
- refers to
- shall mean
- is defined as
- means and includes

Semantic Meaning

DEFINED_TERM

---

## Discretion

### DISCRETION

Examples

- in its sole discretion
- absolute discretion
- reasonably determines
- may decide

Semantic Meaning

DISCRETION

---

## Standard of Conduct

### STANDARD_OF_CARE

Examples

- reasonable care
- commercially reasonable
- best efforts
- reasonable efforts
- reasonable endeavours
- best endeavours

Semantic Meaning

STANDARD_OF_CARE

---

## Survival

### SURVIVAL

Examples

- survives termination
- shall survive
- continues after termination
- remains effective

Semantic Meaning

POST_TERMINATION_EFFECT

---

## Remedy

### REMEDY

Examples

- damages
- injunction
- specific performance
- equitable relief
- service credits

Semantic Meaning

REMEDY

---

## Waiver

### WAIVER

Examples

- waives
- waiver
- relinquishes
- gives up
- failure to enforce

Semantic Meaning

WAIVER

---

## Amendment

### AMENDMENT

Examples

- amended
- modified
- revised
- supplemented
- replaced

Semantic Meaning

CONTRACT_MODIFICATION

---

## Entire Agreement

### ENTIRE_AGREEMENT

Examples

- entire agreement
- complete agreement
- supersedes prior agreements
- whole agreement

Semantic Meaning

MERGER_CLAUSE

---

# Ambiguous Drafting Patterns

The following expressions should never be interpreted alone.

Examples

- reasonable
- material
- significant
- prompt
- substantial
- appropriate
- practical
- adequate

Compiler Action

Require contextual interpretation.

---

# Nested Drafting

The compiler should preserve hierarchy.

Example

Party shall not disclose Confidential Information
except to legal advisers
provided they are bound by confidentiality obligations.

Hierarchy

PROHIBITION

↓

EXCEPTION

↓

CONDITION

---

# Pattern Priority

Interpret patterns in the following order

1. Definitions
2. Negation
3. Conditions
4. Exceptions
5. Carve-outs
6. Obligations
7. Permissions
8. Time
9. Remedies

---

# Compiler Rules

Normalize equivalent wording.

Example

shall

↓

OBLIGATION_STRONG

---

must

↓

OBLIGATION_STRONG

---

undertakes to

↓

OBLIGATION_STRONG

---

The parser should normalize language before rule evaluation.

---

# Future Extensions

Future versions may include

- jurisdiction-specific drafting
- industry drafting conventions
- historical drafting styles
- machine-learning confidence scores
- phrase frequency analysis