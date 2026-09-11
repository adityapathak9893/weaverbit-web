# weaverbit-template — the starter folder

> Copy this folder to start any new Weaverbit product. It already contains the rulebook, the folder map, the planning forms, and the safety checks, so every product begins the same correct way.

## What's inside

- **`docs/`** — the fill-in-the-blank planning forms you complete at the start of every product, before any code:
  - `PRODUCT_SPEC.md` — what it is and why (form)
  - `WORKFLOW_DATAFLOW.md` — how it behaves and how data moves (form)
  - `SYSTEM_DESIGN.md` — the technical plan (form)
  - `DESIGN_GUIDE.md` — how this product looks, extending the shared brand (form)
- **`CLAUDE.md`** — the agent's operating manual (the build loop, the rules). Copied in, ready.
- **`.claude/`** — the safety checks: hooks (auto typecheck/lint after edits, full test gate before finishing), the code-reviewer, and the slash commands. The hooks **fail closed**: if the toolchain is broken (no Node, unreadable `package.json`) they block and say why, rather than skipping every gate and reporting success — though an *absent* `package.json` is still fine, since a repo with no project yet is normal, not broken. `tests/harness.test.ts` guards that by running the hooks, alongside the two ways a hook can vanish without a word: a lost exec bit, and wiring that points at a missing script.
- **`.github/workflows/`** — the second safety net that re-runs the checks on GitHub.
- **`CODE_STANDARDS.md`** — the "boring, readable, handcrafted-quality" code rules. Inherited as-is; not filled in per product (note any product-specific addition at the bottom of the file).
- **`package.json` + the tooling spine** — TypeScript, ESLint, Prettier, Vitest and Playwright already wired, so the five gates (`typecheck`, `lint`, `test`, `e2e`, `build`) run from the first commit. Without this the hooks and CI pass while checking nothing. `tests/gates.test.ts` guards that: it goes red if `src/` has code while `dev`/`build` are still placeholders or the runners are still told to pass with no specs.
- The reference docs that govern everything: `PROCESS.md` (the rulebook) and `STRUCTURE.md` (the folder map) — canonical here, copied into each product at birth. `BRAND.md` is a **stub**: the brand is canonical in `weaverbit-core` and is *installed*, never copied.

## How to start a new product (plain steps)

1. **Copy this folder** into a new repository named after the product (e.g. `weaverbit-web`, `cite`).
2. **Install:** `npm install`, then add the brand — the shared look-and-feel package — from GitHub:

   ```bash
   npm install
   npm install github:adityapathak9893/weaverbit-core#v0.1.0
   ```

   See **First install on a new machine** below for the two things that bite once.
3. **Give the brief:** tell the agent, in plain words, what the product is.
4. **The agent fills the four forms** in `docs/` from your brief, and lists any open questions.
5. **You review and approve each form.** This is the gate. Nothing gets coded until you've approved. Correcting a plan here is cheap; correcting built code is expensive — that's the whole point.
6. **The agent builds, one slice at a time**, through the loop in `CLAUDE.md`: write → auto-checks → tests → self-review → open a request for you to merge.
7. **You review each slice and merge it.** You also look at it with your own eyes — no check can tell you if it *looks* right. Then you deploy.
8. **If the process missed something,** note it and improve the rulebook deliberately (PROCESS.md §8). The process gets better by being used.

## The five gates

Every task ends green on all five, locally and again in CI (`CLAUDE.md` §3):

```bash
npm run typecheck    # tsc --noEmit          — zero errors
npm run lint         # eslint + prettier --check — zero warnings
npm run test         # vitest run
npm run e2e          # playwright test
npm run build        # the product build
```

In a fresh copy of the template, `test` and `e2e` pass with **no specs** and `dev`/`build` are
loud placeholders that print a "replace me" line — there is no app here yet. **The first product
task replaces `dev` and `build` with the real commands** (e.g. `next dev` / `next build`) and
starts adding specs; the other three gates are real from the first commit.

## First install on a new machine

Three things that cost time the first time (the first two were hit while building
`weaverbit-core`; the third is what that install does on npm 11):

1. **Install scripts need approval on npm 11+.** npm no longer runs dependency install scripts
   silently, and `esbuild`/`fsevents` need theirs. This repo pre-approves them via the
   `allowScripts` field in `package.json`, so a plain `npm install` is quiet. (On npm 10 —
   which ships with Node 20 and 22 — the field is simply inert; scripts run as they always
   did.) If you add a dependency that needs one, npm prints a warning and you approve it
   deliberately:

   ```bash
   npm approve-scripts --allow-scripts-pending   # review what's pending
   npm approve-scripts <pkg>                     # allow one
   ```

2. **Playwright browsers are per-machine, not per-repo.** `npm install` does not download them.
   Once per machine:

   ```bash
   npx playwright install chromium
   ```

   CI does this itself (`.github/workflows/ci.yml`). Both Playwright projects — desktop and the
   mobile viewport — are Chromium, so that is the only browser needed.

3. **`weaverbit-core` is built by a `prepare` script, which npm 11 also gates.** The package
   ships only `dist/`, and `dist/` is produced on install. npm treats `prepare` as an install
   script for git dependencies, so on npm 11 it needs approval like any other — and the
   approval key must be the **git spec**, not the bare package name (npm matches git
   dependencies by spec; a bare name only ever matches a registry package). That key is
   already in `allowScripts` here. If you install the brand into a repo that lacks it, or from
   a different owner or fork, expect an unbuilt package — the symptom is
   `Cannot find module 'weaverbit-core'` or a missing `dist/`:

   ```bash
   npm approve-scripts --allow-scripts-pending    # shows it as pending
   ls node_modules/weaverbit-core/dist            # must exist after install
   ```

## The one rule to remember
Plan first, approve the plan, then build in small reviewed pieces. The forms and the checks exist so that what gets built is what you would have built — and so anything else gets caught before it ships.
