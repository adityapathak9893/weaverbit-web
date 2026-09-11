---
description: Run a fresh-context critical review of the current diff before opening a PR.
---

Invoke the `code-reviewer` subagent on the current changes.

Steps:
1. Show me `git status` and `git diff main...HEAD` (or staged changes if not on a branch) so I can see the scope.
2. Hand the diff to the `code-reviewer` subagent for a full critique against CLAUDE.md, CODE_STANDARDS.md, STRUCTURE.md, docs/SYSTEM_DESIGN.md, and docs/DESIGN_GUIDE.md.
3. Summarize the findings by severity (BLOCKER / MAJOR / MINOR / NIT).
4. For each BLOCKER and MAJOR, propose the concrete fix. Do NOT auto-apply — list them and wait for my go, unless I tell you to fix-and-continue.

Do not open the PR until the review is done and blockers are resolved.
