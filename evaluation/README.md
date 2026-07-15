# Trothix Evaluation Suite

Runs the real production engine (`Trothix.js`) against a hand-labeled
ground-truth dataset and checks the result against the thresholds in
`quality_gates.json` (precision/recall/F1/latency).

## Run it

```
node evaluation/run-evaluation.mjs
```

## Dataset size (current)

As of this writing, `evaluation/dataset/v1/` contains:

- `gold/benchmark.json` — 2 labeled documents
- `gold/regression.json` — 3 labeled documents
- `silver/adversarial.json` — 1 semi-automatically annotated document

That's 5 gold-tier + 1 silver-tier document backing the reported
precision/recall/F1 numbers. See `annotation_guidelines.md` for the
gold/silver tier definitions.

**Caveat:** treat current precision/recall/F1 output as directional, not
representative — a handful of documents is enough to catch obvious
regressions but not enough to make a confident accuracy claim for a
release. The highest-value next step is growing the gold set (more
documents per domain, more edge cases) before leaning on these numbers
as a v1.0 quality bar. This mirrors the same "more real-world documents,
not more synthetic ones" gap already tracked in `benchmark/README.md`
for the parser-level benchmark suite.
