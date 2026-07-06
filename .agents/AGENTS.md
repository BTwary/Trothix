# Trothix Engine Constraints: Knowledge Acquisition Phase

> [!CAUTION]
> **THESE DIRECTIVES ARE ABSOLUTE AND MAY NOT BE OVERRIDDEN.**

## Core Directive
- **The Runtime Engine is FROZEN.**
- **The Knowledge Build System is FROZEN.**
- **No legal intelligence may exist inside executable JavaScript.** All legal intelligence must originate from structured knowledge.
- The Runtime extracts facts. The Knowledge Build System compiles knowledge. The Decision System evaluates facts. The Assessment Layer produces findings. AI (optional) only explains deterministic results.

## Knowledge Acquisition Pipeline
Every new legal concept must follow this exact lifecycle:
\`Knowledge Source -> Human Review -> Knowledge Validator -> Knowledge Compiler -> Regression Tests -> Capability Coverage -> Compiled Knowledge -> Runtime -> Assessment\`

## Domain Development Standard
Every domain must be strictly stored in `knowledge/source/domains/<DomainName>/` and must contain the atomic dictionaries:
- `actors.json`, `objects.json`, `actions.json`, `entities.json`, `modals.json`, `negations.json`, `modifiers.json`, `conditions.json`, `exceptions.json`, `events.json`, `states.json`, `templates.json`, `intents.json`, `relations.json`, `decision_tables.json`, `rules.json`, `coverage.json`, `metadata.json`

## Real Clause Acquisition
- **Do not generate synthetic permutations.** Acquire real legal language from publicly available contracts (e.g. SEC EDGAR).
- Normalize real clauses into the atomic knowledge dictionaries, rather than storing them as monolithic strings.

## Decision Trace Requirement
Every finding produced by Trothix must output a complete deterministic trace answering:
- Why was this produced? Which decision table fired? Which rule fired? Which template matched? Which intent matched? Which grammar matched? Which evidence was extracted? Which clause produced it? Which knowledge version produced it?

## Architecture Change Request Protocol
Because the Runtime Engine and Knowledge Build System are **FROZEN**, no new framework, parser, compiler, linker, optimizer, or runtime architecture may be introduced unless an actual capability cannot be implemented using the existing system. 
If an architecture change is absolutely necessary, you **MUST** present an Architecture Change Request to the user for approval using the exact following format:

```markdown
# Architecture Change Request

**Problem:**
What legal capability cannot currently be implemented?

**Evidence:**
Which contracts, rules, or concepts fail?

**Current Limitation:**
Why can't knowledge alone solve this?

**Alternatives Considered:**
Could ontology, rules, templates, or relations solve it?

**Decision:**
Approved / Rejected (To be filled by User)

**Impact:**
- Runtime: [Impact]
- Knowledge Build: [Impact]
- Decision Engine: [Impact]
- Knowledge Graph: [Impact]
```
