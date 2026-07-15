---
id: force-majeure
version: 1.0
status: stable
priority: critical

category:
  - Performance
  - Risk Allocation

aliases:
  - Force Majeure
  - Superior Force
  - Excused Performance
  - Act of God

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
  - Construction
  - Technology
  - Healthcare
  - Finance
  - Employment

related_clauses:
  - Definitions
  - Payment
  - Termination
  - Service Levels
  - Change Control
  - Notices
  - Limitation of Liability
---

# Force Majeure Clause

## Purpose

Allocate the risk of extraordinary events beyond the reasonable control of the
parties by temporarily excusing, delaying, suspending, or terminating
contractual obligations.

Force Majeure protects parties from liability when qualifying external events
prevent or materially impair contractual performance.

---

# Primary Legal Functions

- Performance Excuse
- Risk Allocation
- Delay Management
- Contract Suspension
- Termination Trigger
- Business Continuity
- Disaster Recovery

---

# Core Components

## Trigger Standard

Possible values

- Beyond Reasonable Control
- External Event
- Unforeseeable Event
- Unavoidable Event
- Extraordinary Circumstance
- Government Action

---

## Performance Threshold

Possible values

- Prevented
- Impossible
- Materially Hindered
- Materially Delayed
- Impracticable
- Substantially Impaired

---

## Covered Events

Natural Events

- Earthquake
- Flood
- Fire
- Storm
- Hurricane
- Tsunami

Public Events

- War
- Terrorism
- Riot
- Civil Unrest
- Insurrection

Government Actions

- Embargo
- Sanctions
- Lockdown
- Regulation
- Government Order
- Export Restriction

Commercial Events

- Supply Chain Failure
- Transport Disruption
- Utility Failure
- Telecommunications Failure

Health Events

- Epidemic
- Pandemic
- Public Health Emergency

Technology Events

- Cloud Outage
- Internet Failure
- Cyberattack
- Data Center Failure

---

## Relief Type

Possible values

- Suspension
- Extension of Time
- Excused Performance
- Partial Relief
- Termination Right

---

## Duration

Possible values

- Fixed Days
- Until Event Ends
- Maximum Duration
- Unlimited
- Silent

---

## Notice

Possible values

- Immediate
- Prompt
- Written
- Fixed Number of Days
- Ongoing Updates

---

## Mitigation

Possible values

- Reasonable Efforts
- Commercially Reasonable Efforts
- Best Efforts
- No Duty

---

## Evidence

Possible values

- Documentary Proof
- Government Notice
- Independent Evidence
- Reasonable Evidence
- No Proof Requirement

---

## Payment Treatment

Possible values

- Payment Continues
- Payment Suspended
- Payment Excluded From Relief

---

## Termination Threshold

Possible values

- 30 Days
- 60 Days
- 90 Days
- Mutual Agreement
- Permanent Impossibility

---

# Standard Exceptions

Common exclusions

- Financial Hardship
- Increased Costs
- Market Conditions
- Internal Failures
- Lack of Personnel
- Poor Planning
- Equipment Maintenance
- Supplier Failure
- Self-Caused Events
- Failure to Mitigate

---

# Common Drafting Variations

## Classical Force Majeure

Natural disasters and war only.

---

## Commercial Force Majeure

Broad business interruption coverage.

---

## SaaS Force Majeure

Cloud providers

Internet outages

Infrastructure failures

---

## Procurement Force Majeure

Supply shortages

Logistics disruptions

Government import/export restrictions

---

## Employment Force Majeure

Government shutdowns

Workplace closure

Remote work fallback

---

## Pandemic-Aware

Explicit inclusion of epidemics and pandemics.

---

# Linguistic Variations

Common wording

- force majeure
- beyond reasonable control
- prevented from performing
- materially hindered
- materially delayed
- unable to perform
- acts of God
- government action
- commercially reasonable efforts
- promptly notify
- affected party

---

# Semantic Signals

Normalize concepts instead of wording.

Core concepts

- FM_EVENT
- FM_TRIGGER
- FM_THRESHOLD
- FM_NOTICE
- FM_MITIGATION
- FM_RELIEF
- FM_DURATION
- FM_TERMINATION
- FM_PAYMENT
- FM_EVIDENCE
- FM_EXCEPTION

---

# Mandatory Components

Essential elements

- Qualifying Event
- Performance Threshold
- Relief
- Notice
- Mitigation
- Duration
- Termination Rights

---

# Missing Component Risks

Missing Trigger

Risk

Events qualifying for relief are unclear.

Recommendation

Define objective qualifying events.

---

Missing Mitigation

Risk

Party may rely on Force Majeure without reducing impact.

Recommendation

Require reasonable mitigation.

---

Missing Notice

Risk

Delayed communication.

Recommendation

Specify notice timing.

---

Missing Duration

Risk

Indefinite suspension.

Recommendation

Set maximum suspension period.

---

Missing Payment Rule

Risk

Uncertainty regarding payment obligations.

Recommendation

Clarify whether payment obligations continue.

---

# Positive Signals

- Objective trigger
- Defined notice period
- Mitigation duty
- Payment carve-out
- Termination threshold
- Evidence requirement

---

# Risk Signals

- Economic hardship included
- No mitigation duty
- No notice requirement
- Unlimited suspension
- Payment automatically excused
- Broad catch-all wording
- Supplier failure automatically covered
- No termination right

---

# Dependency Graph

Depends On

- Definitions
- Notices
- Payment
- Termination

Modifies

- Performance Obligations
- Service Levels
- Delivery Dates
- Acceptance Deadlines

Supports

- Business Continuity
- Disaster Recovery

Conflicts With

- Immediate Delivery Obligations
- Strict SLA Requirements

Overrides

- Delay-based breach provisions

---

# Jurisdiction Notes

## US

Frequently uses detailed event lists and broad commercial drafting.

---

## UK

Generally interpreted more narrowly.

Courts examine causation carefully.

---

## India

Commonly linked with statutory interpretation and explicit event lists.

---

## Australia

Plain-English drafting.

Focus on reasonable mitigation.

---

## EU

Mandatory legal obligations may limit contractual relief.

---

# Industry Notes

## SaaS

Typical events

- Cloud outage
- Data center failure
- Internet disruption

---

## Procurement

Typical events

- Supply chain disruption
- Port closure
- Export restrictions

---

## Construction

Typical events

- Weather
- Site shutdown
- Material shortages

---

## Employment

Typical events

- Government closure
- Pandemic
- Workplace evacuation

---

# Findings Template

Finding

Payment obligations expressly excluded from Force Majeure relief.

Risk

Low

Reason

Commercial certainty preserved.

Recommendation

None.

---

Finding

Economic hardship qualifies as Force Majeure.

Risk

High

Reason

Commercial pricing risk shifted unexpectedly.

Recommendation

Exclude financial hardship.

---

Finding

No mitigation obligation.

Risk

Medium

Reason

Affected party has no duty to reduce disruption.

Recommendation

Add reasonable mitigation requirement.

---

# Rule Ideas

IF

Economic hardship included

THEN

High Risk

---

IF

No notice

AND

No mitigation

THEN

High Risk

---

IF

Payment suspended

AND

No express wording

THEN

Medium Risk

---

IF

No termination threshold

THEN

Medium Risk

---

IF

Supplier failure covered

AND

No qualifying event required

THEN

Medium Risk

---

# Test Scenarios

Scenario

Pandemic with notice and mitigation.

Expected Finding

Balanced Force Majeure.

Expected Risk

Low

---

Scenario

Economic hardship treated as Force Majeure.

Expected Finding

Overly broad clause.

Expected Risk

High

---

Scenario

No notice requirement.

Expected Finding

Weak procedural safeguards.

Expected Risk

Medium

---

Scenario

Unlimited suspension period.

Expected Finding

Potential indefinite performance delay.

Expected Risk

High

---

# Cross-Clause Relationships

## Payment

Payment obligations are commonly excluded from Force Majeure relief.

---

## Termination

Extended Force Majeure often creates termination rights.

---

## Service Levels

SLA credits are frequently suspended during qualifying events.

---

## Limitation of Liability

Force Majeure excuses performance rather than limiting damages.

---

## Notices

Notice is generally required before invoking Force Majeure.

---

## Change Control

Project schedules may be adjusted after Force Majeure events.

---

# Research Sources

- Commercial contract drafting manuals
- International commercial contract guidance
- Open SaaS agreements
- Procurement agreements
- Construction contracts
- Government templates
- Comparative contract law resources
- Law firm drafting guidance