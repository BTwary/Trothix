---
id: OrderForm
version: 1.0
status: stable

type: entity

category:
  - Legal Document

aliases:
  - Order Form
  - Purchase Order
  - Subscription Order
  - Sales Order
---

# OrderForm

## Purpose

Represents a commercial ordering document that specifies the products,
services, pricing, quantities, subscription terms, or commercial selections
purchased under an existing Agreement.

An OrderForm activates commercial obligations defined by the parent
Agreement.

---

# Definition

An OrderForm is a contractual document incorporated into an Agreement that
records a specific commercial transaction between the contracting parties.

---

# Entity Type

Commercial Contract Document

---

# Common Examples

- Purchase Order
- Subscription Order Form
- Software Order Form
- Service Order
- Product Order
- Renewal Order

---

# Core Attributes

Typical attributes

- Order Number
- Parent Agreement
- Customer
- Supplier
- Products
- Services
- Quantity
- Unit Price
- Total Price
- Currency
- Effective Date
- Expiration Date
- Status

---

# Related Entities

- Agreement
- Party
- StatementOfWork
- Deliverable
- Invoice
- Schedule

---

# Related Concepts

- PAYMENT
- DELIVERY
- ACCEPTANCE
- PRICE
- TERMINATION

---

# Typical Relationships

Agreement

↓

includes

↓

OrderForm

---

OrderForm

↓

references

↓

StatementOfWork

---

OrderForm

↓

orders

↓

Deliverable

---

OrderForm

↓

defines

↓

Commercial Terms

---

OrderForm

↓

generates

↓

Invoice

---

OrderForm

↓

fulfilled_by

↓

Deliverable

---

# Lifecycle

Draft

↓

Issued

↓

Accepted

↓

Effective

↓

Fulfilled

↓

Closed

---

# Semantic Signals

Common drafting language

- Order Form
- Purchase Order
- Sales Order
- Subscription Order
- Order Number
- Commercial Order

---

# Compiler Notes

The compiler should treat the OrderForm as a commercial child document of
the Agreement.

Commercial obligations created by an OrderForm should inherit applicable
terms from the parent Agreement unless expressly modified.

---

# Validation Rules

An OrderForm should define

- parent agreement
- customer
- supplier
- ordered items
- pricing
- effective date

Possible findings

- MISSING_PARENT_AGREEMENT
- MISSING_ORDER_ITEMS
- MISSING_PRICE
- MISSING_CUSTOMER
- INVALID_ORDER_REFERENCE

---

# Used By

Clause Packs

- payment.md
- pricing.md
- delivery.md
- acceptance.md
- termination.md

Knowledge Graph

Node Type

Entity

---

# Future Extensions

Future versions may support

- recurring subscriptions
- usage-based pricing
- tiered pricing
- multi-currency orders
- automatic renewals
- bundled products