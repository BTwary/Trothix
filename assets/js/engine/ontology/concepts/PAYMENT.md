---
id: PAYMENT
version: 1.0
status: stable

type: concept

category:
  - Financial

aliases:
  - Payment
  - Payment Obligation
  - Payment of Fees
  - Consideration

functions:
  - PAYMENT_OBLIGATION
  - FINANCIAL_OBLIGATION

related_concepts:
  - INVOICE
  - FEES
  - CONSIDERATION
  - ACCEPTANCE
  - DELIVERY
  - BREACH
  - TERMINATION
  - INTEREST
---

# PAYMENT

## Definition

A legal obligation requiring one party to transfer money or other agreed
consideration to another party under the terms of an agreement.

---

# Core Meaning

PAYMENT represents the legal concept of satisfying a financial obligation.

The concept is independent of

- currency
- jurisdiction
- payment method
- contract type

---

# Ontology Type

Financial Obligation

---

# Participants

Obligor

Examples

- Customer
- Buyer
- Client
- Licensee

---

Obligee

Examples

- Supplier
- Seller
- Vendor
- Service Provider

---

# Typical Events

Invoice Issued

↓

Payment Due

↓

Payment Received

↓

Late Payment

↓

Default

---

# Related Concepts

Depends On

- CONSIDERATION
- ACCEPTANCE
- DELIVERY

---

Triggers

- LATE_PAYMENT
- INTEREST
- DEFAULT

---

Modified By

- TERMINATION
- FORCE_MAJEURE

---

Referenced By

- PAYMENT_CLAUSE
- SERVICE_LEVELS
- WARRANTIES

---

# Common Aliases

Payment

Fees

Charges

Amounts Due

Compensation

Remuneration

Price

Purchase Price

Subscription Fee

License Fee

---

# Semantic Signals

Examples

pay

paid

payable

invoice

fees

charges

amount due

payment

remit

consideration

---

# Non-Examples

PAYMENT does not include

- Damages
- Penalties
- Fines
- Taxes (unless expressly defined)
- Security Deposits (unless contractually treated as payment)

---

# Typical Relationships

PAYMENT

↓

depends_on

↓

ACCEPTANCE

---

PAYMENT

↓

depends_on

↓

INVOICE

---

PAYMENT

↓

modified_by

↓

CHANGE_CONTROL

---

PAYMENT

↓

modified_by

↓

TERMINATION

---

PAYMENT

↓

conflicts_with

↓

FORCE_MAJEURE

(in some agreements)

---

# Typical Risks

- UNCLEAR_PAYMENT_TRIGGER
- UNDEFINED_PRICING
- NO_PAYMENT_DEADLINE
- NO_LATE_PAYMENT_RULE
- AMBIGUOUS_PAYMENT_TERMS

---

# Used By

Clause Packs

- payment.md
- service-levels.md
- termination.md
- change-control.md

---

Rule Packs

- payment
- cross-clause

---

Knowledge Graph

Node Type

Concept

---

# Future Extensions

Future versions may include

- payment methods
- installment schedules
- milestone payments
- escrow
- cryptocurrency
- recurring subscriptions
- taxation metadata