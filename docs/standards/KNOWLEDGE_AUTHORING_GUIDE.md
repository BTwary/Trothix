# Knowledge Authoring Guide

This guide details the procedure for defining and updating knowledge elements in Trothix.

---

## 1. Domain Layout
Every domain must contain:
* `concept.json`: Declares concepts and relationships.
* `actions.json`: Canonical actions and synonyms.
* `phrases.json`: Precise phrase matchers.
* `rules.json`: Executable when/then rules.

## 2. Phrase Authoring Guidelines
* Avoid concatenating unrelated terms into one query string.
* Keep phrases focused on standard commercial legal drafts.
* Add synonyms to actions rather than creating duplicate phrases.
