---

# Trothix Repository Engineering Rules

## Repository State

The repository has already undergone a complete architecture audit.

Do NOT repeat repository analysis.

Do NOT rediscover repository structure.

Do NOT summarize architecture unless explicitly requested.

Assume:

- Architecture Handbook
- Engineering State
- Previous architecture audit

are authoritative.

---

# Architecture Status

The following systems are frozen:

- Runtime Engine
- Knowledge Build System
- Parser
- Legal IR
- Engine Registry
- Plugin Pipeline
- Rule Engine

Unless explicitly instructed, these systems must not be modified.

---

# Development Workflow

Before writing code:

1. Identify affected files.
2. Explain why each file changes.
3. Explain risks.
4. Wait for approval.

After approval:

- Modify only required files.
- Preserve backward compatibility.
- Reuse existing abstractions.
- Never duplicate logic.
- Never introduce new execution paths.

---

# Evidence First

Never invent:

- files
- methods
- execution paths
- runtime behaviour

If repository evidence is insufficient:

STOP.

Request the exact file.

Do not guess.

---

# Engineering Philosophy

Prefer:

- small deterministic improvements
- incremental refactoring

Avoid:

- architecture redesign
- framework replacement
- rewriting working systems

---

# Current Sprint

Unless instructed otherwise, work ONLY on the currently active sprint described in ENGINEERING_STATE.md.

Never modify unrelated systems.

---

# Testing

Every implementation must include:

- regression analysis
- validation steps
- backward compatibility analysis
- files modified
- risk assessment

---

# Communication

Keep responses concise.

Avoid repeating repository analysis.

Focus on implementation.

---

## Documentation Freeze

The core engineering documentation is considered stable.

Routine domain additions (e.g. Warranty, Force Majeure, Insurance, SLA) MUST extend the existing documentation instead of creating new governance documents.

A new documentation artifact may be introduced only if one of the following occurs:

- A new repository subsystem is added.
- A new knowledge format is introduced.
- A new compiler or build capability is implemented.
- A new benchmark framework is introduced.
- A user explicitly approves a new canonical document.

When a new document is proposed, explain why the existing documentation cannot reasonably be extended.

---

## Repository Evidence Rule

Repository code is the primary source of truth.

Architecture documents, plans, and recommendations must not contradict executable repository behavior.

When documentation and implementation differ, implementation takes precedence unless the user explicitly approves a repository change.