---
id: jurisdictional-variations
version: 1.0
status: stable
priority: critical

category:
  - Knowledge Standard
  - Jurisdiction Mapping

applies_to:
  - All Clause Packs

compiler:
  exported: true
---

# Jurisdictional Variations

## Purpose

Define jurisdiction-specific drafting conventions, terminology,
interpretation preferences, and legal concepts while preserving a common
canonical ontology.

The compiler should normalize equivalent legal concepts regardless of
jurisdiction unless jurisdiction-specific behavior is explicitly required.

---

# Supported Jurisdictions

- United States
- United Kingdom
- India
- Australia
- European Union

---

# Normalization Principle

Different wording

↓

Same Legal Function

↓

Same Ontology Concept

Example

US

shall

↓

Australia

must

↓

Compiler

MANDATORY_OBLIGATION

---

# Obligation Language

## Canonical

MANDATORY_OBLIGATION

---

United States

- shall
- agrees to
- will

---

United Kingdom

- shall

---

India

- shall
- shall be

---

Australia

- must
- must not

---

Compiler Output

MANDATORY_OBLIGATION

---

# Permission Language

Canonical

PERMISSION

---

US

- may

---

UK

- may
- entitled to

---

Australia

- may

---

India

- may

---

Compiler Output

PERMISSION

---

# Prohibition

Canonical

PROHIBITION

---

Common Expressions

US

- shall not

UK

- shall not

Australia

- must not

India

- shall not

Compiler Output

PROHIBITION

---

# Standard of Care

Canonical

STANDARD_OF_CARE

---

US

- reasonable efforts
- commercially reasonable efforts

---

UK

- reasonable endeavours
- best endeavours

---

Australia

- reasonable endeavours

---

India

- reasonable efforts

---

Compiler Output

STANDARD_OF_CARE

Subtype

- REASONABLE
- BEST
- COMMERCIAL

---

# Governing Law

Canonical

GOVERNING_LAW

Jurisdiction metadata only.

No semantic normalization required.

---

# Limitation of Liability

Canonical

LIABILITY_LIMIT

Observe

- enforceability differs
- drafting differs
- ontology identical

---

# Indemnity

Canonical

INDEMNITY

Metadata

- first-party practice
- third-party practice
- statutory limitations

Compiler stores metadata only.

---

# Confidentiality

Canonical

CONFIDENTIALITY

Equivalent expressions

- Confidential Information
- Proprietary Information
- Restricted Information

Compiler

CONFIDENTIAL_INFORMATION

---

# Force Majeure

Canonical

FORCE_MAJEURE

Observe

Recognition differs across jurisdictions.

Concept remains identical.

---

# Interpretation Preferences

Record metadata.

Examples

US

- detailed drafting

UK

- formal drafting

Australia

- plain English preference

India

- statutory references common

No rule changes.

---

# Jurisdiction Metadata

Each jurisdiction may define

Drafting Style

Preferred Terminology

Mandatory Law Flags

Industry Variations

Consumer Protection Flags

Employment Protection Flags

Privacy Rules

Competition Rules

---

# Compiler Rules

Normalize wording.

Preserve jurisdiction metadata.

Never change ontology because of wording alone.

Only jurisdiction-specific rule packs may alter behavior.

---

# Rule Example

Input

Australia

Party must maintain insurance.

↓

Output

MANDATORY_OBLIGATION

INSURANCE

Jurisdiction

Australia

---

Input

UK

Party shall use reasonable endeavours.

↓

Output

STANDARD_OF_CARE

Subtype

REASONABLE_ENDEAVOURS

Jurisdiction

UK

---

# Future Extensions

Future versions may include

- Canada
- Singapore
- New Zealand
- UAE
- Civil law jurisdictions
- Sector-specific drafting conventions

---

# Design Principles

Normalize

- wording
- terminology
- drafting style

Do Not Normalize

- statutory requirements
- enforceability
- mandatory law
- public policy
- jurisdiction-specific legal restrictions