# Evaluation Guide

This guide explains how to use and extend the Trothix evaluation framework.

---

## 1. Running Evaluations
Execute the harness:
```bash
node evaluation/run-evaluation.mjs
```
The script evaluates all samples in the validation datasets and checks outcomes against configurable gates.

## 2. Extending the Corpus
To add a validation sample, append it to `evaluation/dataset/v1/gold/benchmark.json` or `silver/adversarial.json` following the schema rules defined in [annotation_guidelines.md](../dataset/annotation_guidelines.md).
