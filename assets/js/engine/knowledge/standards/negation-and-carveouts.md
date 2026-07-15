---
id: negation-and-carveouts
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

# Negation and Carve-Outs

## Purpose

Define how negation, exceptions, carve-outs, limitations, and qualifying
language alter the legal meaning of contractual provisions.

The compiler must interpret these constructs before evaluating legal rules,
risk patterns, or obligations.

---

# Interpretation Order

The compiler should evaluate semantic modifiers in this order:

1. Defined Terms
2. Negation
3. Conditions
4. Exceptions
5. Carve-Outs
6. Limitations
7. Obligations
8. Permissions
9. Remedies

---

# Negation

## Purpose

Reverse or deny the legal effect of an obligation, permission, right, or fact.

---

## Common Expressions

- not
- no
- never
- neither
- nor
- without
- shall not
- must not
- may not
- is not
- does not
- cannot
- will not

---

## Semantic Effect

Original

OBLIGATION

↓

Negated

PROHIBITION

---

Example

Supplier shall disclose information.

↓

OBLIGATION

---

Supplier shall not disclose information.

↓

PROHIBITION

---

# Double Negation

Examples

- not uncommon
- not prohibited
- not unreasonable

Compiler Action

Resolve to the final semantic meaning rather than treating both negations independently.

---

# Exception

## Purpose

Exclude specific situations from a broader rule.

---

## Common Expressions

- except
- except that
- excluding
- other than
- save as
- with the exception of

---

Example

Recipient shall not disclose Confidential Information
except to legal advisers.

Hierarchy

PROHIBITION

↓

EXCEPTION

---

# Carve-Out

## Purpose

Create a narrowly defined exclusion that overrides part of a broader rule.

---

## Common Expressions

- notwithstanding
- provided however
- does not apply to
- shall not apply
- except for
- irrespective of

---

Example

Liability shall be capped at $1,000,000.

This limitation shall not apply to fraud.

Hierarchy

LIMITATION

↓

CARVE_OUT

↓

FRAUD

---

# Limitation

## Purpose

Reduce the scope of an obligation.

---

## Common Expressions

- only
- solely
- exclusively
- limited to
- to the extent
- capped at

---

Example

Supplier may disclose information
only to employees.

Hierarchy

PERMISSION

↓

LIMITATION

---

# Qualification

## Purpose

Restrict the certainty of a statement.

---

## Common Expressions

- to the extent
- where applicable
- if applicable
- where required
- subject to

---

Compiler Action

Qualification narrows scope rather than replacing the rule.

---

# Condition

## Purpose

Specify an event that activates a rule.

---

## Common Expressions

- if
- provided that
- upon
- once
- when
- in the event that

---

Example

Customer may terminate
if Supplier materially breaches.

Hierarchy

CONDITION

↓

RIGHT

---

# Nested Interpretation

Example

Supplier shall not disclose Confidential Information
except to auditors
provided that they are bound by confidentiality obligations.

Hierarchy

PROHIBITION

↓

EXCEPTION

↓

CONDITION

---

Example

Liability shall not exceed $5 million
except for fraud
or willful misconduct.

Hierarchy

LIMITATION

↓

CARVE_OUT

↓

FRAUD

↓

WILLFUL_MISCONDUCT

---

# Priority Rules

The compiler should apply:

Definitions

↓

Negation

↓

Exception

↓

Carve-Out

↓

Main Rule

---

Definitions always resolve first.

Exceptions attach to the immediately preceding rule unless explicit wording indicates otherwise.

Carve-outs override only the portion of the rule they expressly modify.

---

# False Positive Patterns

## Pattern

Keyword present inside exception.

Example

Recipient shall not disclose
except to auditors.

Incorrect

Disclosure risk.

Correct

Disclosure prohibited with a limited exception.

---

## Pattern

Keyword inside carve-out.

Example

Liability cap shall not apply to fraud.

Incorrect

Unlimited liability.

Correct

Unlimited liability only for fraud.

---

## Pattern

Keyword inside qualification.

Example

Customer may disclose
only where required by law.

Incorrect

Broad disclosure permission.

Correct

Very narrow disclosure right.

---

## Pattern

Cross-reference inside exception.

Example

Except as provided in Section 12.

Compiler Action

Resolve Section 12 before assigning risk.

---

# Semantic Tree

The compiler should preserve semantic hierarchy.

Example

Rule

↓

Negation

↓

Exception

↓

Condition

↓

Limitation

↓

Remedy

Flattening this hierarchy is prohibited.

---

# Compiler Rules

Always resolve semantic modifiers before evaluating:

- Risk
- Compliance
- Obligation
- Dependency
- Recommendations

Keyword matching alone is insufficient.

---

# Future Extensions

Future versions may support:

- Multi-level nested carve-outs
- Parenthetical exceptions
- Jurisdiction-specific drafting
- AI-assisted ambiguity detection
- Confidence scoring