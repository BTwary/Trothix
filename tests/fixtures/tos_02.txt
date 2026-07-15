# Trothix Parser Benchmark

Regression suite for the local heuristics parser engine. Run it after any
change to a parser, rule file, or `definitions.js` -- it should be part of
the normal workflow, not a one-off check.

## Run it

```
npm run benchmark
```

or directly:

```
node benchmark/run-benchmark.mjs
```

## Structure

```
benchmark/
  nda/
    nda_01.txt ... nda_05.txt
    expected.json
  lease/
    lease_01.txt ... lease_04.txt
    expected.json
  tos/
    tos_01.txt ... tos_04.txt
    expected.json
  run-benchmark.mjs
```

Each `expected.json` maps a filename to:
- `id` -- a stable identifier (e.g. `LEASE-003`), assigned once and never
  reused. Reference these in commits and discussion ("Fixes LEASE-003")
  instead of describing the file ("fixes the weird lease test") -- it stays
  correct even if the purpose text or filename later changes.
- `purpose` -- why this document exists / what it's specifically testing.
  Always fill this in. Six months from now you want to know immediately
  why an odd test case is there instead of wondering if it's safe to delete.
- `origin` -- where the document came from. One of:
  - `synthetic` -- written by hand (or by Claude) to exercise a specific
    case. This is everything in the suite today.
  - `anonymized_real` -- a real contract with identifying details removed.
  - `community_submission` -- contributed by someone hitting a real bug.

  This field is load-bearing, not decorative: the benchmark runner reports
  accuracy broken out by origin, specifically so a 100% pass rate on a
  synthetic set (documents written to already pass, or to document a known
  gap) can't get blended with a much thinner, harder real-document set and
  read as one misleadingly clean number.
- `difficulty` -- `basic`, `intermediate`, or `edge`. Rough signal for how
  hard the case is, not a weighted score -- see "What we're not doing yet"
  below.
- `status` -- `passing` or `known_limitation`. Sets whether the runner
  tags the case as documented debt in its output.
- `introduced` -- date the case was added, so questions like "how long has
  this limitation existed" or "did accuracy improve after parser v2.4"
  don't require digging through git history.
- `docType` -- what `identifyType()` should classify this as.
- `expected` -- the fields `extractedData` should contain. Only list fields
  you actually want checked; anything omitted is not verified.
- `requiresAIFallback` (optional) -- set this when the document SHOULD fail
  local parsing (e.g. a genuinely missing required field), so the benchmark
  confirms the fallback trigger works, not just the happy path.

## Adding a new test case

1. Drop a `.txt` file in the right category folder.
2. Add an entry to that folder's `expected.json` with a real `purpose`,
   the next `id` in that category's sequence (e.g. after `NDA-005` comes
   `NDA-006`), and `origin` / `difficulty` / `status` / `introduced` filled
   in honestly.
3. Run the benchmark. If it fails, you've either found a real parser bug
   (fix the parser) or the expected value was wrong (fix the JSON).

## Documenting known gaps on purpose

Not every field needs to pass today. If a document is designed to expose a
known, not-yet-fixed weakness (see `LEASE-003` / `lease_03.txt` -- late fee
stated as a flat dollar amount, which the current regex doesn't handle),
set the `expected` value to whatever the parser *currently* (incorrectly)
returns, set `status` to `known_limitation`, and say so plainly in
`purpose`. That way the benchmark stays green while still serving as a
checklist of debt (the runner tags these `[KNOWN LIMITATION]` and counts
them separately in the summary) -- and the day someone fixes that regex,
this test will need its `expected.json` entry updated too (including
flipping `status` back to `passing`), which is a good forcing function to
remember it happened.

## What we're not doing yet

No weighting -- no "edge cases count double," no numeric difficulty score.
Those look sophisticated but are arbitrary without a well-defined
evaluation methodology behind them. `difficulty` is there for humans
scanning the suite, not for the runner to score against. Keep it to
stable IDs, clear purpose, explicit origin, documented status, and
reproducible expected output -- those are objective and cheap to maintain.

## What this does and doesn't prove

Every document in this initial set was written specifically to exercise a
known past bug or a phrasing variant we already thought of. A 100% pass
rate here means the fixes made so far hold and haven't regressed -- it does
**not** mean the parser will handle arbitrary real-world contracts at the
same accuracy. The next highest-value step is feeding in real (anonymized,
or synthetic-but-realistic) documents nobody on the team specifically wrote
to pass, since those are the ones that will actually surface the next
regex gap.

## Current status

13 documents, 87/87 fields passing (100%) as of the last run -- all
`origin: synthetic` (no anonymized-real or community documents yet, so
those sections of the runner's "By Origin" breakdown currently read N/A).
See `purpose` fields for what's covered and `LEASE-003` for the one
documented known limitation (flat-dollar late fees aren't extracted yet).

The next highest-value addition to this suite isn't another synthetic
case -- it's the first `anonymized_real` document, once one is available.
Real contracts surface things nobody thinks to invent on purpose (odd
numbering, inconsistent capitalization, OCR artifacts, boilerplate copied
from different firms), and the origin breakdown exists specifically so
that when those start coming in, their accuracy is visible on its own
instead of getting averaged into the synthetic number.
