# Domain Playbook: Definitions

## Purpose
The Definitions domain serves as a centralized lookup system resolving custom terms (like 'Confidential Information') into canonical entities so subsequent domains do not repeat literal matching.

## Common Drafting Styles
- "[Term] means [Definition Body]"
- "[Term] shall mean [Definition Body]"
- "[Term] includes [Definition Body]"
- "[Term] refers to [Definition Body]"

## Alias Strategies
Map abbreviations (e.g. "Recipient", "Discloser") back to their canonical base actors (`PARTY_RECEIVER`, `PARTY_SENDER`).

## Cross References & Nested Definitions
Verify when a definition refers back to another capitalized term. Ensure references exist and are valid.

## Common Legal Mistakes
- Capitalizing terms in the agreement without including them in the Definitions list.
- Circular definitions.

## Current Knowledge Debt
- Missing phrase patterns: 'Collectively referred to as' aliases.
- Future priorities: Verify nested cross references in MSAs and SaaS agreements.
