#!/usr/bin/env bash
# post-edit-verify.sh
# Fires after every Edit/Write/MultiEdit (PostToolUse).
# Runs the cheap, fast gates — typecheck + lint — and feeds any failure
# back to Claude so it fixes immediately instead of accumulating errors.
#
# PostToolUse cannot undo the edit, but an exit of 2 with stderr text is surfaced to
# Claude as feedback. We keep this FAST (typecheck+lint only); the full test/e2e/build
# suite runs at the Stop gate, not on every keystroke.
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
  echo "hook: could not resolve the project root; gates NOT run." >&2
  exit 2
fi

cd "$PROJECT_DIR" || {
  echo "hook: cannot cd to project root ($PROJECT_DIR)" >&2
  exit 2
}

# Only act in a real Node project (skip during early scaffolding when
# package.json may not exist yet — don't block the agent bootstrapping).
if [ ! -f package.json ]; then
  exit 0
fi

FAILED=0
OUT=""

# The gate list is read from package.json with node, so both must work. Fail CLOSED:
# if node is missing or package.json is unparseable, exit 2 rather than skipping. Why this
# matters: the previous `has_script` swallowed both errors with 2>/dev/null and returned
# "script not defined", so a broken package.json silently skipped every gate and reported
# success — the same invisible no-op that stop-gate.sh's jq dependency was fixed to remove,
# just with a different missing dependency.
if ! command -v node >/dev/null 2>&1; then
  echo "hook: node not found — gates could NOT run." >&2
  exit 2
fi

# stderr is deliberately NOT captured into $SCRIPTS: it flows straight to this hook's own
# stderr, which is what gets fed back to Claude. Merging it with 2>&1 would append any
# at-exit node warning onto the last script name, so that gate would stop being found —
# the exact silent-skip this guard exists to remove.
if ! SCRIPTS=$(node -e 'const s = require(process.cwd() + "/package.json").scripts || {}; process.stdout.write(Object.keys(s).join("\n"))'); then
  echo "hook: cannot read package.json scripts (node error above) — gates NOT run." >&2
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

if has_script typecheck; then
  if ! TC=$(npm run typecheck 2>&1); then
    FAILED=1
    OUT+=$'\n--- typecheck failed ---\n'"$TC"
  fi
fi

if has_script lint; then
  if ! LN=$(npm run lint 2>&1); then
    FAILED=1
    OUT+=$'\n--- lint failed ---\n'"$LN"
  fi
fi

if [ "$FAILED" -ne 0 ]; then
  # stderr is fed back to Claude; exit 2 marks a blocking-style failure
  echo "Post-edit verification failed. Fix before continuing:${OUT}" >&2
  exit 2
fi

exit 0
