---
id: Party
version: 1.0
status: stable

type: entity

category:
  - Participant

aliases:
  - Contracting Party
  - Legal Party
  - Agreement Party
---

# Party

## Purpose

Represents a legal person or organization capable of entering into,
performing, enforcing, or terminating contractual obligations.

The Party entity is the primary participant in commercial contracts and
serves as the anchor for most legal relationships.

---

# Definition

A Party is any legal person or legally recognized organization that
possesses contractual rights, obligations, powers, liabilities, or remedies
under an agreement.

---

# Entity Type

Legal Participant

---

# Typical Examples

Natural Person

- Consultant
- Employee
- Individual

---

Organization

- Company
- Corporation
- Partnership
- Government Agency
- Nonprofit
- University

---

# Common Roles

Examples

- Customer
- Supplier
- Vendor
- Buyer
- Seller
- Licensor
- Licensee
- Contractor
- Subcontractor
- Distributor
- Service Provider
- Client

Roles are contextual.

A Party may perform multiple roles within the same agreement.

---

# Core Attributes

Typical attributes include

- Legal Name
- Address
- Jurisdiction
- Registration Number
- Authorized Representative
- Contact Information
- Role
- Signature Authority

---

# Rights

A Party may

- receive payment
- receive confidential information
- enforce obligations
- terminate agreements
- initiate disputes
- approve changes
- receive notices
- own intellectual property

---

# Obligations

A Party may

- pay fees
- maintain confidentiality
- perform services
- deliver goods
- comply with laws
- indemnify another party
- maintain insurance
- provide notices
- protect data

---

# Related Concepts

- PAYMENT
- NOTICE
- BREACH
- TERMINATION
- CONFIDENTIAL_INFORMATION
- LIABILITY
- INDEMNITY
- WARRANTY
- DISPUTE
- CLAIM

---

# Related Entities

- Agreement
- Invoice
- Deliverable
- Notice
- Amendment
- StatementOfWork
- Schedule

---

# Typical Relationships

Party

↓

signs

↓

Agreement

---

Party

↓

pays

↓

Payment

---

Party

↓

receives

↓

Invoice

---

Party

↓

owns

↓

Intellectual Property

---

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

Party

↓

performs

↓

Obligation

---

Party

↓

asserts

↓

Claim

---

Party

↓

terminates

↓

Agreement

---

Party

↓

indemnifies

↓

Party

---

Party

↓

discloses

↓

Confidential Information

---

Party

↓

receives

↓

Confidential Information

---

# Lifecycle

Party

↓

Executes Agreement

↓

Performs Obligations

↓

Exercises Rights

↓

May Breach

↓

May Cure

↓

May Terminate

↓

Post-Termination Obligations

---

# Semantic Signals

Common drafting expressions

- Party
- Parties
- Customer
- Client
- Supplier
- Vendor
- Buyer
- Seller
- Contractor
- Employee
- Affiliate
- Service Provider
- Receiving Party
- Disclosing Party

---

# Exclusions

Party does not represent

- Individual contractual clauses
- Legal concepts
- Documents
- Events
- Rules

Those belong elsewhere in the ontology.

---

# Compiler Notes

Normalize contextual role names to the canonical **Party** entity while
preserving the original role as metadata.

Example

Supplier

↓

Party

Role = Supplier

Customer

↓

Party

Role = Customer

Licensor

↓

Party

Role = Licensor

---

# Used By

Clause Packs

- confidentiality.md
- payment.md
- indemnity.md
- limitation-of-liability.md
- notices.md
- warranties.md
- termination.md
- governing-law.md
- dispute-resolution.md

---

Knowledge Graph

Node Type

Entity

---

# Future Extensions

Future versions may include

- Party hierarchies
- Parent/Subsidiary relationships
- Corporate groups
- Government entities
- Trusts
- Joint ventures
- Multi-party agreements
- Digital identities