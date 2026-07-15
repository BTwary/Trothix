# Versioning Policy

This document defines the release versioning standards for the Trothix platform.

---

## 1. Engine vs Knowledge Packs
* **Engine Core**: Follows strict semver (`MAJOR.MINOR.PATCH`).
  - `MAJOR`: Breaking compiler/parser changes.
  - `MINOR`: New core concept definitions or grammar capabilities.
* **Knowledge Packs**: Versioned independently.
  - `MAJOR`: Breaking concept model changes (removing concepts/actions).
  - `MINOR`: Adding new rules or domain concept overrides.
  - `PATCH`: Modifying synonyms or phrase strings.
