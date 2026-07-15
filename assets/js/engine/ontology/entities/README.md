# Ontology Entities

## Purpose

Entities represent real-world legal participants, objects, documents,
assets, and resources that appear in contracts.

Unlike concepts, entities are things.

Unlike functions, entities do not describe legal purpose.

Unlike relationships, entities do not describe connections.

Entities are the nouns of the ontology.

---

# Entity Model

Every entity should define

- Identifier
- Category
- Description
- Attributes
- Related Concepts
- Related Entities
- Typical Relationships
- Aliases

---

# Entity Categories

Common categories include

## Parties

Examples

- Party
- Customer
- Supplier
- Vendor
- Buyer
- Seller
- Contractor
- Employee
- Affiliate

---

## Documents

Examples

- Agreement
- Statement of Work
- Purchase Order
- Invoice
- Notice
- Amendment
- Schedule
- Exhibit

---

## Assets

Examples

- Deliverable
- Software
- Source Code
- Documentation
- Intellectual Property
- Data
- Equipment

---

## Financial Objects

Examples

- Payment
- Invoice
- Fee
- Credit
- Refund
- Tax

---

## Events

Examples

- Acceptance
- Delivery
- Breach
- Termination
- Renewal

(Some events may also exist as concepts.)

---

# Entity Rules

Entities should

- represent one real-world object
- remain jurisdiction independent
- avoid clause-specific wording
- avoid procedural logic

---

# Relationships

Entities may participate in

- owns
- receives
- delivers
- pays
- invoices
- signs
- references
- controls
- creates
- modifies

Example

Customer

↓

receives

↓

Invoice

↓

requires

↓

Payment

---

# Concepts vs Entities

Concept

PAYMENT

Meaning

A legal obligation.

---

Entity

Invoice

Meaning

A document requesting payment.

---

Concept

BREACH

Meaning

A legal condition.

---

Entity

Agreement

Meaning

A legal document.

---

# Naming

Entity identifiers

PascalCase

Examples

Party

Agreement

Invoice

Customer

Supplier

Deliverable

---

One file

↓

One entity

Example

Party.md

Agreement.md

Invoice.md

---

# Future Growth

The ontology may later include

- organizational entities
- government entities
- regulatory authorities
- digital assets
- AI systems
- blockchain assets
- jurisdiction-specific entities

---

# Design Principle

Entities describe what exists.

Concepts describe legal meaning.

Rules describe behavior.

Relationships describe connections.