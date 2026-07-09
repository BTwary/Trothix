#!/usr/bin/env bash
# Trothix consolidation — Step 1: remove the orphaned root API-duplicate layer.
#
# Every file below was confirmed, individually, to be:
#   - not globbed by vercel.json (only api/**/*.js is deployed)
#   - not referenced by any .html file or any other .js file's imports
#   - already diverged (via `diff`) from its api/ counterpart, where one exists
#
# NOTE: root telemetry.js is deliberately EXCLUDED from this list — it looked
# identical to these nine during the initial audit pass, but core/router.js
# (part of the pipeline benchmark/run-benchmark.mjs still executes) imports
# it directly. Deleting it broke the benchmark suite immediately; this was
# caught by re-running the benchmark as a post-deletion check and the file
# was restored. Do not add it to this list.
#
# Run from the repository root:
#   bash cleanup-step1-remove-orphaned-api-duplicates.sh

set -euo pipefail

FILES=(
  "analyze.js"
  "contact.js"
  "feedback.js"
  "stats.js"
  "track.js"
  "visit.js"
  "waitlist.js"
  "_stats.js"
  "_supabase.js"
)

for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    rm -v "$f"
  else
    echo "skip (already absent): $f"
  fi
done

echo ""
echo "Done. Recommended verification before committing:"
echo "  npm test                 # benchmark suite (pipeline C) should still pass"
echo "  node test_api.js         # pipeline B (production server path) should still run"
echo "  grep -rl \"analyze\\.js\\|contact\\.js\\|feedback\\.js\\|stats\\.js\\|track\\.js\\|visit\\.js\\|waitlist\\.js\\|_stats\\.js\\|_supabase\\.js\" --include=\"*.js\" --include=\"*.html\" . | grep -v node_modules"
echo "  (that grep should return nothing outside the api/ and assets/ directories)"
