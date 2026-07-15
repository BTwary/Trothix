---
id: reference-resolution
version: 1.0
status: stable
priority: critical

category:
  - Knowledge Standard
  - Semantic Interpretation

applies_to:
  - All Clause Packs

compiler:
  exported: true
---

# Reference Resolution

## Purpose

Define how the compiler discovers, resolves, validates, and evaluates
references between clauses, schedules, exhibits, amendments, and related
contract documents.

The compiler must resolve references before evaluating legal meaning.

---

# Resolution Pipeline

The compiler shall process references in the following order:

1. Internal Clause
2. Internal Section
3. Definitions
4. Schedule
5. Annex
6. Exhibit
7. Statement of Work
8. Order Form
9. Amendment
10. External Agreement

---

# Reference Types

## Internal Clause

Examples

- Section 5
- Clause 12
- Article IV

Semantic Meaning

INTERNAL_REFERENCE

---

## Definition Reference

Examples

- as defined herein
- defined above
- Defined Term

Semantic Meaning

DEFINITION_REFERENCE

---

## Schedule Reference

Examples

- Schedule A
- Schedule 3
- Pricing Schedule

Semantic Meaning

SCHEDULE_REFERENCE

---

## Annex Reference

Examples

- Annex I
- Annex II

Semantic Meaning

ANNEX_REFERENCE

---

## Exhibit Reference

Examples

- Exhibit A
- Exhibit B

Semantic Meaning

EXHIBIT_REFERENCE

---

## Statement of Work

Examples

- SOW
- Statement of Work

Semantic Meaning

SOW_REFERENCE

---

## Order Form

Examples

- Order Form
- Purchase Order

Semantic Meaning

ORDER_FORM_REFERENCE

---

## Amendment

Examples

- Amendment No. 1
- First Amendment
- Addendum

Semantic Meaning

AMENDMENT_REFERENCE

---

## External Agreement

Examples

- DPA
- NDA
- License Agreement
- Framework Agreement

Semantic Meaning

EXTERNAL_REFERENCE

---

# Resolution Rules

## Rule 1

Definitions resolve before all other references.

---

## Rule 2

Signed amendments override earlier provisions according to the Order of
Precedence.

---

## Rule 3

Specific references override general references.

---

## Rule 4

Broken references generate findings before legal analysis continues.

---

## Rule 5

Reference chains must terminate.

Circular references are prohibited.

---

# Reference Relationships

Possible relationships

- references
- modifies
- overrides
- supplements
- incorporates
- depends_on

---

# Broken References

Compiler Finding

BROKEN_REFERENCE

Examples

- Section does not exist
- Missing Schedule
- Missing Exhibit
- Deleted Clause
- Invalid Number

Severity

High

---

# Circular References

Compiler Finding

CIRCULAR_REFERENCE

Example

Section 5 references Section 8

↓

Section 8 references Section 5

Compiler Action

Stop traversal.

Generate finding.

---

# Priority Rules

When multiple referenced documents conflict:

1. Mandatory Law
2. Signed Amendment
3. Order of Precedence
4. Specific Provision
5. General Provision

---

# Reference Resolution Tree

Document

↓

Clause

↓

Referenced Clause

↓

Referenced Definition

↓

Referenced Schedule

↓

Referenced Amendment

↓

Resolved Meaning

---

# Compiler Rules

Always resolve references before:

- Risk Analysis
- Rule Evaluation
- Dependency Analysis
- Recommendation Generation

Reference traversal must be deterministic.

---

# Validation Rules

A reference is valid only if:

- Target exists.
- Target is uniquely identifiable.
- Target is accessible.
- Target is not circular.
- Target belongs to the current document set.

---

# Cross-Document Resolution

Supported document types

- Master Service Agreement
- Statement of Work
- Purchase Order
- Data Processing Agreement
- SLA
- Security Addendum
- Amendment
- Annex
- Schedule

---

# Common Failure Patterns

Pattern

Reference to deleted clause.

Finding

BROKEN_REFERENCE

---

Pattern

Reference to wrong section number.

Finding

INVALID_REFERENCE

---

Pattern

Reference chain exceeds compiler limit.

Finding

REFERENCE_DEPTH_EXCEEDED

---

Pattern

Reference overridden by amendment.

Finding

SUPERSEDED_REFERENCE

---

# Compiler Outputs

Reference object

- source
- target
- relationship
- confidence
- resolved
- overridden
- broken

---

# Future Extensions

Future versions may support:

- Multi-document dependency graphs
- Version-aware reference resolution
- Hyperlink preservation
- Jurisdiction-specific document hierarchies
- Cross-contract reasoning