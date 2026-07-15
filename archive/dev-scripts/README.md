# archive/dev-scripts/

One-off, ad-hoc verification scripts written during earlier development
sessions (confidence-scoring phases, definition-engine iterations, a
global-engine-retry check, a standalone pipeline smoke test, and an early
API smoke test). None of these are referenced by any `npm run` script in
`package.json`, by `npm run verify`, or by any other file in the
repository — confirmed by repository-wide reference search before moving
them here.

They are kept for historical reference rather than deleted outright, since
they document specific bugs/behaviors that were checked at the time. If
you're looking for the currently-active test suite, see `package.json`'s
`scripts` block (`test`, `test:unit`, `test:integration`, `test:regression`,
`test:phase1`, `lint`, `rule-diagnostics`) and the `tests/` directory.
