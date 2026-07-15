# Rule Authoring Guide

This document defines coding styles and guidelines for writing executable rule predicates.

---

## 1. Rule Schema Format
Rules must contain valid `when` and `then` blocks compiled by `RuleCompiler`:
```json
{
  "id": "RULE_NAME",
  "status": "production",
  "when": {
    "type": "conceptExists",
    "value": "CONCEPT_ID"
  },
  "then": {
    "trigger": "FindingName",
    "message": "Finding details..."
  }
}
```

## 2. Best Practices
* **Use Logic-Driven Predicates**: Combine conditions using `all` or `any` rather than checking mere presence.
* **Avoid Duplication**: Rules within the same domain must check distinct conditions to avoid redundant findings.
