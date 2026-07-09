# _needs_review/

Files here were found loose at the root of the uploaded zip, outside the
real project tree, with no counterpart anywhere inside it (unlike the other
stray copies found alongside them, which were confirmed byte-for-byte/
timestamp-confirmed duplicates and were discarded).

## diagnostics/
`IRFieldInventory.js`, `RuleClassifier.js`, `runRuleDiagnostics.mjs` — all
dated 2026-07-07 05:19, the same batch as other files that turned out to be
superseded by newer copies inside the real project. These three have no
newer counterpart to compare against, so I can't confirm whether they're
already superseded by `assets/js/engine/rules/RuleDiagnostics.js` or whether
they're a standalone tool that never got moved into the project tree.

Take a look and either delete this folder (if `RuleDiagnostics.js` already
covers this) or move `diagnostics/` into `assets/js/engine/` proper (if it's
still-needed, separate functionality).
