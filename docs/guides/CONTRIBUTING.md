# Contributor Guide

Welcome to the Trothix project!

---

## 1. Onboarding Checklist
1. Review [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) to understand the parser execution flow.
2. Read the [GOVERNANCE.md](../standards/GOVERNANCE.md) to understand change management constraints.
3. Run `npm install` and verify the setup with `npm run verify`.

## 2. Adding a New Legal Domain
1. Create a subfolder under `assets/js/engine/knowledge/v1/domains/`.
2. Define the JSON files following the [KNOWLEDGE_AUTHORING_GUIDE.md](../standards/KNOWLEDGE_AUTHORING_GUIDE.md).
3. Register regression tests in `tests/regression/corpus.json`.
4. Run validation check gates via `npm run verify`.
