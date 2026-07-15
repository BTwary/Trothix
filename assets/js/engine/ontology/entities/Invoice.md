---
id: Invoice
version: 1.0
status: stable

type: entity

category:
  - Financial Document

aliases:
  - Invoice
  - Billing Statement
  - Tax Invoice
  - Commercial Invoice
---

# Invoice

## Purpose

Represents a commercial document requesting payment for goods, services,
licenses, subscriptions, or other contractual obligations performed under an
Agreement.

An Invoice records the financial claim arising from completed contractual
performance.

---

# Definition

An Invoice is a financial document issued by one Party to another requesting
payment for contractual performance.

An Invoice does not itself create payment obligations; it evidences and
quantifies them under the Agreement.

---

# Entity Type

Financial Document

---

# Common Examples

- Tax Invoice
- Subscription Invoice
- Milestone Invoice
- Progress Invoice
- Final Invoice
- Credit Invoice
- Recurring Invoice

---

# Core Attributes

Typical attributes

- Invoice Number
- Issue Date
- Due Date
- Currency
- Amount
- Tax
- Status
- Parent Agreement
- Customer
- Supplier

---

# Related Entities

- Agreement
- Party
- OrderForm
- StatementOfWork
- Deliverable
- Clause

---

# Related Concepts

- PAYMENT
- FEES
- TAX
- INTEREST
- LATE_PAYMENT
- BREACH

---

# Typical Relationships

Agreement

↓

governs

↓

Invoice

---

StatementOfWork

↓

generates

↓

Invoice

---

Deliverable

↓

results_in

↓

Invoice

---

Invoice

↓

requests

↓

Payment

---

Invoice

↓

issued_by

↓

Party

---

Invoice

↓

received_by

↓

Party

---

Invoice

↓

may_trigger

↓

Late Payment

---

# Lifecycle

Draft

↓

Issued

↓

Delivered

↓

Due

↓

Paid

or

↓

Overdue

↓

Disputed

↓

Resolved

↓

Archived

---

# Semantic Signals

Common drafting language

- Invoice
- Billing
- Invoice Number
- Amount Due
- Due Date
- Payment Request
- Tax Invoice

---

# Compiler Notes

Invoices should be treated as financial documents that reference
commercial obligations already created elsewhere in the Agreement.

Invoices should not independently create contractual obligations.

---

# Validation Rules

An Invoice should define

- issuing party
- receiving party
- amount
- currency
- due date
- parent agreement

Possible findings

- MISSING_AMOUNT
- MISSING_DUE_DATE
- MISSING_CURRENCY
- MISSING_PARENT_AGREEMENT
- INVALID_INVOICE_REFERENCE

---

# Used By

Clause Packs

- payment.md
- pricing.md
- taxes.md
- late-payment.md

Knowledge Graph

Node Type

Entity

---

# Future Extensions

Future versions may support

- electronic invoicing
- recurring billing
- usage-based billing
- multi-currency invoices
- credit notes
- debit notes
- payment reconciliation