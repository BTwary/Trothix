---
id: Notice
version: 1.0
status: stable

type: entity

category:
  - Legal Document

aliases:
  - Written Notice
  - Formal Notice
  - Contract Notice
---

# Notice

## Purpose

Represents a formal communication delivered between parties under the terms
of an agreement.

A Notice is an operational document used to trigger contractual procedures,
exercise rights, satisfy obligations, or communicate legally significant
events.

---

# Definition

A Notice is a document or communication delivered in accordance with the
notice provisions of an agreement.

Its legal effect depends upon compliance with the contractual notice
requirements.

---

# Entity Type

Legal Communication

---

# Common Examples

- Termination Notice
- Breach Notice
- Change Request Notice
- Renewal Notice
- Default Notice
- Force Majeure Notice
- Payment Demand
- Claim Notice

---

# Core Attributes

Typical attributes

- Sender
- Recipient
- Delivery Method
- Delivery Date
- Effective Date
- Subject
- Content
- Reference Clause

---

# Related Entities

- Party
- Agreement
- Clause
- Amendment

---

# Related Concepts

- NOTICE
- TERMINATION
- BREACH
- CLAIM
- PAYMENT
- FORCE_MAJEURE

---

# Typical Relationships

Party

↓

sends

↓

Notice

---

Party

↓

receives

↓

Notice

---

Notice

↓

references

↓

Clause

---

Notice

↓

triggers

↓

Event

---

Notice

↓

required_by

↓

Agreement

---

Notice

↓

documents

↓

Breach

---

# Lifecycle

Created

↓

Delivered

↓

Received

↓

Effective

↓

Archived

---

# Semantic Signals

Common drafting expressions

- written notice
- notify
- notification
- give notice
- deliver notice
- provide notice

---

# Compiler Notes

The compiler should normalize all notice-related drafting to the canonical
Notice entity while preserving notice subtype metadata.

Examples

Termination Notice

↓

Notice

Subtype = Termination

---

Default Notice

↓

Notice

Subtype = Default

---

# Validation Rules

A notice should define

- sender
- recipient
- delivery method
- timing
- legal purpose

Possible findings

- MISSING_NOTICE_METHOD
- MISSING_RECIPIENT
- MISSING_NOTICE_PERIOD
- INVALID_NOTICE_TRIGGER

---

# Used By

Clause Packs

- notices.md
- termination.md
- breach.md
- force-majeure.md
- payment.md
- dispute-resolution.md

Knowledge Graph

Node Type

Entity

---

# Future Extensions

Future versions may support

- electronic notices
- registered mail
- courier delivery
- blockchain delivery proofs
- jurisdiction-specific notice rules