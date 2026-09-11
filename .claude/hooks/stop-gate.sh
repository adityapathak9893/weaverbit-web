#!/usr/bin/env bash
# stop-gate.sh
# Fires when Claude is about to finish responding (Stop event).
# Enforces the Definition of Done (CLAUDE.md §3): the session may not end
# until typecheck, lint, test, e2e, and build all pass.
#
# CRITICAL: Stop hooks fire on EVERY stop. Returning exit 2 forces Claude to
# keep working — without the stop_hook_active guard this creates an infinite
# loop. We read stdin JSON and bail to exit 0 if we're already inside a
# hook-triggered continuation.
#
# EXIT-CODE CONTRACT (how a hook talks to Claude Code) — why this file is so careful:
#   exit 0    -> success; the agent proceeds.
#   exit 2    -> blocking; stderr is fed back to Claude. On Stop it forces the agent to keep
#                working; on PostToolUse it flags the problem for immediate fix.
#   any other -> NON-blocking warning, swallowed. It never reaches the agent at all.
# So every failure path here must end in 2. An exit of 1 (unbound variable), 126 (lost exec
# bit), or a silent 0 is indistinguishable from "all gates green" — which is exactly how this
# gate went missing in weaverbit-core without anyone noticing (its PR #2).
#
# FAIL CLOSED: the gate list is read out of package.json with node. If node is absent or the
# manifest will not parse, exit 2 rather than concluding "no gates are defined" — suppressing
# those two errors is what silently skipped every gate while reporting success. An *absent*
# package.json is a different case and exits 0: early scaffolding is not an error.
# tests/harness.test.ts drives this script through those cases for real, and checks that no
# literal `exit` here uses a status other than 0 or 2. It cannot see a status bash itself
# produces — an unbound variable (1) or a lost exec bit (126) — which is why those two are
# guarded by construction above and by the exec-bit assertion in that same file.

# The block below is duplicated verbatim in the sibling hook rather than sourced from a shared
# lib. Deliberate: a `source` that cannot find its lib is itself a silent-skip path, and these
# two files are the last thing that should depend on another file being present to work.
set -uo pipefail

INPUT=$(cat)

# Prevent an infinite loop: if this stop was itself triggered by a prior block, allow it.
#
# This guard MUST survive a missing node. The fail-closed check further down exits 2 when
# node is absent, and a Stop hook that exits 2 re-triggers itself — so if the guard needed
# node to decide, "node is missing" would become an unbreakable loop rather than a gate.
# Hence two tiers: node parses the JSON exactly when it is available, and a raw string
# match is the fallback for the one case where it is not.
#
# Why not jq for either tier: it is not guaranteed to be installed, and the old code
# exited 0 when it was missing — Stop treats exit 0 as "all good", so the whole
# Definition-of-Done gate vanished with only a stderr line nobody reads.
ACTIVE=""
if command -v node >/dev/null 2>&1; then
  ACTIVE=$(printf '%s' "$INPUT" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{let v=false;try{v=JSON.parse(s).stop_hook_active===true}catch{}process.stdout.write(String(v))})" 2>/dev/null)
fi

# Empty means node is gone, or it failed to parse. Strip whitespace so the match survives
# the spacing JSON permits ("stop_hook_active" : true) and compare against the literal.
if [ -z "$ACTIVE" ]; then
  case "$(printf '%s' "$INPUT" | tr -d ' \t\n\r')" in
    *'"stop_hook_active":true'*) ACTIVE="true" ;;
  esac
fi

if [ "$ACTIVE" = "true" ]; then
  exit 0
fi

# Prefer CLAUDE_PROJECT_DIR; fall back to a path derived from this script's own location
# when it is unset or empty. Why the fallback: under `set -u` a bare $CLAUDE_PROJECT_DIR
# aborts the script with "unbound variable" and exit 1 — a NON-blocking code, so the gate
# would disappear silently and the agent would never be told. A hook that quietly does
# nothing is worse than no hook. BASH_SOURCE also covers the git-bash-on-Windows case
# where the env var was the thing that went missing.
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

# `cd ""` succeeds and stays put, so an empty value would silently gate whatever the cwd
# happens to be. Check before trusting it.
if [ -z "$PROJECT_DIR" ]; then
  echo "stop-gate: could not resolve the project root; gates NOT run." >&2
  exit 2
fi

cd "$PROJECT_DIR" || {
  echo "stop-gate: cannot cd to project root ($PROJECT_DIR); gates NOT run." >&2
  exit 2
}

# Nothing to gate before the project exists.
if [ ! -f package.json ]; then
  exit 0
fi

# The gate list is read from package.json with node, so both must work. Fail CLOSED:
# if node is missing or package.json is unparseable, exit 2 rather than skipping. Why this
# matters: the previous `has_script` swallowed both errors with 2>/dev/null and returned
# "script not defined", so a broken package.json silently skipped every gate and reported
# success — the same invisible no-op that the jq path was fixed to remove, just with a
# different missing dependency.
if ! command -v node >/dev/null 2>&1; then
  echo "stop-gate: node not found — gates could NOT run." >&2
  exit 2
fi

# stderr is deliberately NOT captured into $SCRIPTS: it flows straight to this hook's own
# stderr, which is what gets fed back to Claude. Merging it with 2>&1 would append any
# at-exit node warning onto the last script name, so that gate would stop being found —
# the exact silent-skip this guard exists to remove.
if ! SCRIPTS=$(node -e 'const s = require(process.cwd() + "/package.json").scripts || {}; process.stdout.write(Object.keys(s).join("\n"))'); then
  echo "stop-gate: cannot read package.json scripts (node error above) — gates NOT run." >&2
  exit 2
fi

# Exact line match against the captured list, using only builtins. Why not `npm pkg get`:
# correct, but it spawns npm once per gate for a value already read here. Why not a pipe to
# grep: it forks a process per lookup for a string this small, and `grep -q` closing the
# pipe early is a pipefail hazard not worth inviting into a script that must not fail open.
has_script () {
  case $'\n'"$SCRIPTS"$'\n' in
    *$'\n'"$1"$'\n'*) return 0 ;;
    *) return 1 ;;
  esac
}

run_gate () {
  local script="$1"
  local OUT
  # Skip gracefully if the script isn't defined yet.
  if ! has_script "$script"; then
    return 0
  fi
  if ! OUT=$(npm run "$script" 2>&1); then
    echo "--- ${script} failed ---" >&2
    echo "$OUT" >&2
    return 1
  fi
  return 0
}

FAIL=0
for g in typecheck lint test e2e build; do
  if ! run_gate "$g"; then
    FAIL=1
  fi
done

if [ "$FAIL" -ne 0 ]; then
  echo "Definition of Done not met — gates above are red. Keep working; do not stop until all pass." >&2
  exit 2
fi

exit 0
