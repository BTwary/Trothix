# Engineering Principles

This document outlines the core coding and design tenets of the Trothix platform.

---

## 1. Engine Freeze & Determinism
Core engine performance must remain 100% deterministic. No random seeds, non-deterministic loops, or state leaks are permitted in compiler or evaluator modules.

## 2. Knowledge-First Implementation
Always prefer solving a problem by expanding the ontology graph, writing discrete phrases, or tailoring rules rather than modifying parser rules or lexer tokens.

## 3. Measurable Quality
Every change to the knowledge base must be evaluated against the validation datasets. F1 scores and execution latency serve as standard gates.
