# Clause Knowledge Pack Style Guide

Version: 1.0

---

# Purpose

This document defines the canonical structure for every Clause Knowledge Pack (CKP).

Every clause pack MUST follow this guide.

The goal is consistency across the entire Trothix Knowledge Base.

---

# File Naming

Use lowercase.

Use kebab-case.

Examples

confidentiality.md

force-majeure.md

limitation-of-liability.md

termination.md

data-processing.md

intellectual-property.md

Never use spaces.

Never use underscores.

---

# Metadata

Every clause begins with YAML.

Required fields

id

version

status

priority

category

aliases

jurisdictions

industries

related_clauses

---

# Required Sections

Every clause MUST contain the following sections.

1. Purpose

2. Primary Legal Functions

3. Core Components

4. Standard Exceptions

5. Drafting Variations

6. Linguistic Variations

7. Semantic Signals

8. Mandatory Components

9. Missing Component Risks

10. Positive Signals

11. Risk Signals

12. Dependency Graph

13. Jurisdiction Notes

14. Industry Notes

15. Findings Template

16. Rule Ideas

17. Test Scenarios

18. Cross-Clause Relationships

19. Research Sources

---

# Heading Rules

Use

#

for title.

Use

##

for major sections.

Use

###

only when necessary.

Avoid deeper nesting.

---

# Lists

Use unordered lists for concepts.

Good

- Notice
- Survival
- Mitigation

Avoid numbered lists unless order matters.

---

# Terminology

Always use legal concepts.

Good

Disclosure Restriction

Receiving Party

Covered Loss

Notice

Avoid parser terminology.

Bad

Regex

Pattern

Token

Lexer

AST

---

# Language Style

Describe meaning.

Never describe implementation.

Good

"Protects confidential information."

Bad

"Parser should detect..."

---

# Canonical Vocabulary

Always use consistent wording.

Use

Receiving Party

Never

Recipient

Receiver

Target Party

Use

Disclosing Party

Never

Sender

Owner

Originator

Use

Notice

Never

Notification

Communication

Alert

Use

Termination

Never

Cancellation

Ending

Closure

---

# Jurisdiction Format

Always use

US

UK

India

Australia

EU

Never

United States

England

Britain

European Union

---

# Industry Format

Use

SaaS

Employment

Procurement

Commercial

Construction

Healthcare

Finance

Technology

Government

---

# Risk Statements

Every risk should contain

Risk

Reason

Recommendation

Example

Risk

High

Reason

No survival clause.

Recommendation

Add an explicit survival obligation.

---

# Rule Format

Always use

IF

AND

OR

THEN

Example

IF

No notice obligation

AND

No mitigation obligation

THEN

Medium Risk

Never write implementation logic.

---

# Test Scenario Format

Each scenario contains

Scenario

Expected Finding

Expected Risk

Example

Scenario

Mutual NDA

Expected Finding

Balanced confidentiality obligations.

Expected Risk

Low

---

# Cross-Clause Relationships

Always identify

Depends On

Modifies

Supports

Conflicts With

Overrides

Never leave relationships implicit.

---

# Research Sources

List only authoritative knowledge sources.

Examples

Statutes

Case law

Government guidance

Law firm publications

Industry practice

Open commercial contracts

Avoid blogs unless they provide unique drafting practice.

---

# Future Compatibility

Clause packs are intended to generate

Ontology

Rule Packs

Knowledge Compiler

Dependency Graph

Risk Models

Finding Templates

Jurisdiction Packs

Industry Packs

Test Corpus

Every section should therefore describe legal knowledge, not software behavior.