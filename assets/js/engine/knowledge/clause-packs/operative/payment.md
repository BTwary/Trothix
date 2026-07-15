---
id: payment
version: 1.0
status: stable
priority: critical

category:
  - Financial Obligations
  - Commercial Terms

aliases:
  - Payment
  - Fees
  - Charges
  - Compensation
  - Payment Terms
  - Pricing
  - Financial Terms

jurisdictions:
  - US
  - UK
  - India
  - Australia
  - EU

industries:
  - SaaS
  - Procurement
  - Commercial
  - Technology
  - Construction
  - Healthcare
  - Finance
  - Employment

related_clauses:
  - Definitions
  - Taxes
  - Invoicing
  - Acceptance
  - Suspension
  - Termination
  - Limitation of Liability
  - Force Majeure
  - Audit Rights
  - Change Control
---

# Payment Clause

## Purpose

Define the financial obligations of the parties, including pricing,
invoicing, payment timing, taxes, currency, late payment consequences,
and remedies for non-payment.

The payment clause determines **how, when, where, and under what
conditions money changes hands.**

---

# Primary Legal Functions

- Payment Obligation
- Pricing
- Financial Allocation
- Revenue Collection
- Tax Allocation
- Cash Flow Management
- Commercial Certainty
- Default Management

---

# Core Components

## Paying Party

Possible values

- Customer
- Buyer
- Client
- Employer
- Licensee
- Subscriber

---

## Receiving Party

Possible values

- Vendor
- Supplier
- Service Provider
- Contractor
- Consultant
- Licensor

---

## Pricing Model

Possible values

- Fixed Price
- Time and Materials
- Milestone Based
- Subscription
- Usage Based
- Transaction Based
- Unit Pricing
- Cost Plus
- Retainer
- Success Fee

---

## Payment Amount

Possible values

- Fixed Amount
- Variable Amount
- Formula Based
- Tiered Pricing
- Volume Discount
- Custom Pricing

---

## Currency

Examples

- USD
- EUR
- GBP
- INR
- AUD

---

## Payment Frequency

Possible values

- One-Time
- Monthly
- Quarterly
- Annual
- Milestone
- Weekly
- Upon Delivery
- Upon Acceptance

---

## Invoice Requirement

Possible values

- Invoice Required
- Pro Forma Invoice
- Electronic Invoice
- Tax Invoice
- Self-Billing
- No Invoice Required

---

## Payment Due Date

Possible values

- Upon Receipt
- Net 7
- Net 15
- Net 30
- Net 45
- Net 60
- Fixed Calendar Date
- Milestone Completion
- Acceptance Date

---

## Accepted Payment Methods

Examples

- Bank Transfer
- ACH
- Wire Transfer
- Credit Card
- Debit Card
- Check
- UPI
- Direct Debit

---

## Taxes

Possible values

- Inclusive
- Exclusive
- VAT
- GST
- Sales Tax
- Withholding Tax
- Gross-Up
- Customer Responsible
- Vendor Responsible

---

## Price Adjustment

Possible values

- Fixed Price
- CPI Adjustment
- Inflation Adjustment
- Annual Increase
- Mutual Agreement
- Foreign Exchange Adjustment

---

## Late Payment

Possible values

- Interest
- Late Fee
- Daily Interest
- Monthly Interest
- Statutory Interest
- Collection Costs

---

## Suspension Rights

Possible values

- Suspend Services
- Suspend Deliverables
- Suspend License
- Suspend Support
- No Suspension

---

## Refund Rights

Possible values

- No Refund
- Pro-Rata Refund
- Full Refund
- Partial Refund
- Service Credit

---

## Credit Rights

Possible values

- Service Credits
- Promotional Credits
- Future Invoice Credit
- Credit Note

---

## Audit Rights

Possible values

- Vendor Audit
- Customer Audit
- Third-Party Audit
- No Audit

---

# Standard Exceptions

Common exceptions

- Billing Error
- Invoice Dispute
- Force Majeure
- Tax Adjustment
- Fraud
- Duplicate Invoice
- Unauthorized Charges
- Bank Error
- Government Levy
- Currency Restriction

---

# Common Drafting Variations

## Fixed Price

Single agreed amount.

---

## Subscription

Recurring payment.

---

## Usage-Based

Payment depends on consumption.

---

## Milestone

Payment after project milestones.

---

## Time and Materials

Payment based on hours worked.

---

## Success Fee

Payment only after achieving agreed outcomes.

---

## Retainer

Advance recurring payment.

---

## Hybrid Pricing

Combination of multiple pricing models.

---

# Linguistic Variations

Common wording

- shall pay
- agrees to pay
- will pay
- payment shall be due
- fees shall be payable
- invoice shall be issued
- payable within
- net thirty
- without deduction
- exclusive of taxes
- inclusive of taxes
- subject to applicable taxes
- overdue amounts
- interest shall accrue
- suspend services
- payment obligation

---

# Semantic Signals

Normalize concepts instead of wording.

Core concepts

- PAYMENT_OBLIGATION
- PRICE
- CURRENCY
- PAYMENT_DATE
- INVOICE
- TAX
- LATE_PAYMENT
- INTEREST
- PRICE_ADJUSTMENT
- REFUND
- CREDIT
- SUSPENSION
- AUDIT
- DISPUTED_INVOICE
- WITHHOLDING_TAX
- GROSS_UP

---

# Mandatory Components

Essential elements

- Paying Party
- Receiving Party
- Payment Amount
- Pricing Model
- Currency
- Payment Due Date
- Invoice Requirement
- Tax Allocation

---

# Missing Component Risks

Missing Price

Risk

Payment amount uncertain.

Recommendation

Specify pricing or calculation formula.

---

Missing Due Date

Risk

Unclear payment timing.

Recommendation

Define payment deadline.

---

Missing Currency

Risk

Exchange disputes.

Recommendation

Specify payment currency.

---

Missing Tax Allocation

Risk

Unexpected tax liability.

Recommendation

Clarify responsibility for taxes.

---

Missing Late Payment Terms

Risk

Weak enforcement.

Recommendation

Specify interest and penalties.

---

Missing Suspension Rights

Risk

Limited remedy for non-payment.

Recommendation

Allow suspension after payment default.

---

# Positive Signals

- Clear pricing
- Defined payment schedule
- Fixed currency
- Net payment terms
- Defined taxes
- Invoice procedure
- Reasonable late-payment interest
- Payment dispute process
- Audit procedure

---

# Risk Signals

- Undefined pricing
- Unlimited price adjustment
- Vendor unilateral price changes
- No due date
- No invoice requirement
- No tax allocation
- Unlimited late fees
- Immediate suspension
- No payment dispute mechanism
- Currency undefined
- Automatic renewal with automatic price increase

---

# Dependency Graph

Depends On

- Definitions
- Scope of Services
- Acceptance
- Change Control
- Taxes
- Statement of Work

Modifies

- Suspension
- Termination
- Service Delivery
- License Rights

Supports

- Cash Flow
- Commercial Performance
- Financial Compliance

Conflicts With

- Force Majeure
- Acceptance
- Refund Rights

Overrides

- Informal payment arrangements

---

# Jurisdiction Notes

## US

Net payment terms are common.

Interest clauses generally enforceable if reasonable.

---

## UK

VAT treatment is usually explicit.

Late Payment legislation may apply in commercial transactions.

---

## India

GST allocation is critical.

TDS (Tax Deducted at Source) provisions are frequently included.

---

## Australia

GST commonly addressed separately.

Prompt payment legislation may affect some industries.

---

## EU

VAT rules vary by member state.

Cross-border invoicing requirements may apply.

---

# Industry Notes

## SaaS

Typical model

- Subscription
- Annual billing
- Usage overages
- Auto-renewal
- Service credits

---

## Procurement

Typical model

- Purchase Orders
- Milestone payments
- Acceptance-based invoices
- Retention amounts

---

## Construction

Typical model

- Progress payments
- Retention
- Certified invoices
- Change orders

---

## Healthcare

Typical model

- Claims reimbursement
- Regulatory billing
- Insurance payments

---

## Finance

Typical model

- Transaction fees
- Settlement periods
- Clearing obligations

---

# Findings Template

Finding

Payment due within 30 days of invoice.

Risk

Low

Reason

Industry-standard payment terms.

Recommendation

None.

---

Finding

Vendor may increase prices unilaterally.

Risk

High

Reason

Customer has no approval or termination right.

Recommendation

Require notice and termination option before price increases.

---

Finding

No payment dispute process.

Risk

Medium

Reason

Good-faith billing disagreements may become defaults.

Recommendation

Add a formal invoice dispute mechanism.

---

# Rule Ideas

IF

Payment amount undefined

THEN

Critical Risk

---

IF

No payment due date

THEN

High Risk

---

IF

Vendor may change pricing unilaterally

AND

Customer has no termination right

THEN

High Risk

---

IF

Late-payment interest exceeds statutory limits

THEN

Medium Risk

---

IF

No tax allocation

THEN

Medium Risk

---

IF

Services suspended immediately after one missed payment

THEN

Medium Risk

---

IF

Payment depends on acceptance

AND

Acceptance procedure missing

THEN

High Risk

---

# Test Scenarios

Scenario

Annual SaaS subscription billed in advance.

Expected Finding

Standard subscription model.

Expected Risk

Low

---

Scenario

Undefined payment amount.

Expected Finding

Financial obligation unclear.

Expected Risk

Critical

---

Scenario

Vendor may increase fees at any time.

Expected Finding

One-sided pricing mechanism.

Expected Risk

High

---

Scenario

Milestone payments with acceptance criteria.

Expected Finding

Balanced project payment structure.

Expected Risk

Low

---

Scenario

No invoice dispute process.

Expected Finding

Potential billing conflict.

Expected Risk

Medium

---

# Cross-Clause Relationships

## Definitions

Defines Fees, Charges, Taxes, Business Day, Invoice, and Payment Date.

---

## Acceptance

Acceptance often triggers invoicing and payment obligations.

---

## Change Control

Approved changes may modify pricing and payment schedules.

---

## Taxes

Determines responsibility for GST, VAT, withholding tax, and gross-up obligations.

---

## Suspension

Non-payment frequently allows suspension of services or licenses.

---

## Termination

Outstanding payment obligations generally survive termination.

---

## Force Majeure

Payment obligations are often expressly excluded from force majeure relief.

---

## Limitation of Liability

Payment obligations are commonly carved out from liability limitations.

---

## Audit Rights

Audit rights verify usage-based fees, royalties, and financial compliance.

---

# Research Sources

- Commercial contract drafting guides
- SaaS Master Service Agreements
- Software licensing agreements
- Procurement contracts
- Construction contracts
- Government procurement templates
- International commercial contracting guidance
- Law firm practice notes
- Comparative contract law resources