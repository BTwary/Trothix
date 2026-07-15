---
id: incorporates
version: 1.0
status: stable

type: relationship

category:
  - Governance
---

# incorporates

## Purpose

Represents a legal relationship where one ontology object formally adopts
another document, clause, schedule, policy, or external resource as part of
its own legal framework.

Unlike a simple reference, incorporation gives the target legal effect
within the source object.

---

# Definition

An incorporates relationship exists when the source object expressly states
that another document or legal object forms part of the agreement through
incorporation by reference.

The incorporated object becomes legally operative within the scope defined
by the source.

---

# Relationship Type

Incorporation

---

# Direction

Source

↓

incorporates

↓

Target

The relationship is directional.

---

# Valid Connections

Agreement

↓

incorporates

↓

Schedule

---

Agreement

↓

incorporates

↓

Exhibit

---

Agreement

↓

incorporates

↓

Policy

---

StatementOfWork

↓

incorporates

↓

Technical Specification

---

OrderForm

↓

incorporates

↓

Master Agreement

---

Clause

↓

incorporates

↓

External Standard

---

# Common Examples

Master Agreement

↓

incorporates

↓

Statement of Work

---

Agreement

↓

incorporates

↓

Schedule A

---

Agreement

↓

incorporates

↓

Data Processing Addendum

---

Purchase Order

↓

incorporates

↓

Terms and Conditions

---

Privacy Policy

↓

incorporates

↓

Standard Contractual Clauses

---

# Compiler Responsibilities

The compiler should

- resolve incorporated objects
- validate incorporation targets
- preserve incorporation scope
- detect missing incorporated documents
- support multi-document reasoning

---

# Runtime Usage

The runtime may use incorporates to

- expand contract context
- evaluate incorporated obligations
- resolve cross-document meaning
- support deterministic analysis
- identify governing documents

---

# Validation Rules

An incorporates relationship should

- identify a valid incorporated object
- preserve direction
- distinguish incorporation from reference
- resolve incorporated content where available

Possible findings

- BROKEN_INCORPORATION
- UNKNOWN_INCORPORATED_OBJECT
- INVALID_INCORPORATION
- DUPLICATE_INCORPORATION

---

# Non-Examples

incorporates should not represent

- simple document references
- semantic dependency
- legal precedence
- procedural requirements
- document structure

Those belong to separate relationship types.

---

# Relationship Comparison

incorporates

Meaning

Makes another document legally operative.

---

references

Meaning

Points to another document.

---

contains

Meaning

Structurally includes another object.

---

governs

Meaning

Provides the controlling legal framework.

---

overrides

Meaning

Takes legal precedence.

---

# Knowledge Graph

Edge Type

Incorporation

Direction

Source

↓

Target

---

# Typical Drafting Signals

Common drafting language

- incorporated by reference
- forms part of this Agreement
- deemed incorporated
- attached and incorporated
- subject to the attached
- read together with
- forms an integral part of
- incorporated herein

---

# Legal Importance

Incorporation by reference is widely used to include schedules,
specifications, policies, technical standards, and external documents
without reproducing their full text.

Failure to recognize incorporation can result in incomplete legal analysis.

---

# Future Extensions

Future versions may support

- external document retrieval
- version-controlled incorporation
- conditional incorporation
- jurisdiction-specific incorporation rules
- recursive incorporation chains

---

# Guiding Principle

Use **incorporates** when one legal object expressly makes another document
or legal object part of its own operative terms.

Incorporation is stronger than a reference.

It gives the incorporated object legal effect within the source.