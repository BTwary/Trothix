# Governance Policy

This document defines change management and release governance rules for Trothix.

---

## 1. Runtime Change Approval Process (ACR)

No modification to the frozen runtime (`/assets/js/engine/`) is permitted without an approved **Architecture Change Request (ACR)**.

An ACR must document:
1. **Context & Root Cause**: Why the knowledge layer is insufficient to express the required behavior.
2. **Impact Analysis**: Potential risk of regression across all active domains.
3. **Smallest Possible Patch**: Code diff minimizing changes.
4. **Approval**: Explicit sign-off from Platform Tech Lead.

---

## 2. Ontology & Rule Review Checklist

Before promoting any domain to production:
- [ ] No duplicate concepts are introduced.
- [ ] Sub-concepts use `related` fields to map hierarchy.
- [ ] Phrases are discrete legal terms, not concatenated query strings.
- [ ] Rules use logic-driven predicates, not duplicate blanket concept presence checks.
- [ ] High-severity rules are weighted correctly in evaluation.

---

## 3. Release Approval Workflow

Every release tag requires:
1. All regression, integration, and linter checks pass.
2. F1-score and Latency quality gates pass on the evaluation harness.
3. Release metrics are archived in `longitudinal_history.json`.
