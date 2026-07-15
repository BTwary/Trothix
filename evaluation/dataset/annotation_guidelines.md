# Trothix Annotation Guidelines — Ground Truth Production

This document defines the rules and guidelines for producing consistent legal ground truth annotations for the Trothix evaluation dataset.

---

## 1. Quality Tiers

* **Gold Tier**: Verified and audited by a human legal engineer. All offset boundaries, expected rules, and concept links have been audited and signed off.
* **Silver Tier**: Semi-automatically annotated or parsed. Contains correct mappings in principle but text spans may contain minor variations.

---

## 2. Concept Annotation Guidelines

* **Main Concept Linkage**: Annotate the parent concept node (`CONCEPT_NOTICE`, `CONCEPT_LIABILITY`, etc.) only if the clause addresses the domain directly.
* **Sub-concept Specificity**:
  - `CONCEPT_LIABILITY_CAP`: Annotate only if a specific limit or maximum amount of liability is defined.
  - `CONCEPT_LIABILITY_EXCLUSION`: Annotate only if indirect, consequential, special, or punitive damages are waived.
  - `CONCEPT_LIABILITY_CARVEOUT`: Annotate if exceptions to cap limits are listed (e.g. gross negligence, willful misconduct).
  - `CONCEPT_INDEMNIFY_BROAD`: Annotate if the indemnity obligation uses unrestricted qualifiers ("any and all claims", "all liability").
  - `CONCEPT_INDEMNIFY_RECIPROCAL`: Annotate if the indemnity applies mutually/reciprocally to both parties.
  - `CONCEPT_INDEMNIFY_DEFEND`: Annotate if the word "defend" or "duty to defend" is explicitly present in the clause.

---

## 3. Evidence & Offset Annotation

* **Matched Text**: The expected evidence text must be the minimal contiguous text span that demonstrates the presence of the concept. Do not include leading or trailing whitespace.
* **Offset Boundaries**: Spans must align with word boundaries.

---

## 4. Rule Ground Truth Mappings

* For any clause:
  - If a concept is present, map its corresponding `PRESENT` rule.
  - If a cap is missing in a liability clause, map `CONCEPT_LIABILITY_RISK`.
  - If a notice block is missing in a notice clause, map `RULE_MISSING_NOTICE_ADDRESS`.
