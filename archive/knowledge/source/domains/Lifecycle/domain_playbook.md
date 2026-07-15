# Domain Playbook: Lifecycle

## Purpose
The Lifecycle domain governs the dynamic states of a contract, tracking obligations, rights, and transition triggers. It enforces logical state flow and blocks impossible transitions.

## State Transition Matrix
- **STATE_DRAFT** ➞ `EVENT_SIGNED` ➞ **STATE_ACTIVE**
- **STATE_ACTIVE** ➞ `EVENT_NOTICE_SENT` ➞ **STATE_NOTICE_PENDING**
- **STATE_NOTICE_PENDING** ➞ `EVENT_NOTICE_RECEIVED` ➞ **STATE_CURE_PERIOD**
- **STATE_CURE_PERIOD** ➞ `EVENT_CURE_FAILED` ➞ **STATE_TERMINATED**

## Transition Preconditions
Preconditions must be satisfied before a transition occurs:
- Notice cannot be received before it is sent.
- Cure period cannot start before notice.
- Expiration cannot occur before execution.

## Transition Effects
Actions executed during state transition:
- `ACTIVATE_CONTRACT` ➞ Starts obligations timeline.
- `ACTIVATE_NOTICE_DEADLINE` ➞ Activates temporal counting.
- `TRIGGER_SURVIVAL` ➞ Transfers obligations to survival lifecycle phase.

## Common Legal Risks
- Impossible state transitions (e.g. `TERMINATED` ➞ `ACTIVE`).
- Missing cure periods in breach events.
- Deadline conflicts.
- Termination without serving notice.

## Current Knowledge Debt
- Missing state paths: `STATE_SUSPENDED` pathways.
- Future priorities: Aligning with SaaS-specific termination states.
