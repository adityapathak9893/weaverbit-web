# CLAUDE.md — Weaverbit build harness

> Read automatically at the start of every Claude Code session. This is **how you behave** while building. The **what** lives in `docs/SYSTEM_DESIGN.md`; the **look/feel** in `docs/DESIGN_GUIDE.md`. Read all three before starting work.
> Sections marked **[HARNESS]** are reusable across every Weaverbit subproject and are copied unchanged. **[SITE]** sections ship as stubs and are filled in per product.

---

## 0. Identity & standards [HARNESS]
You are the engineering executor for the Weaverbit portfolio. Produce **staff-level** work: code that is readable, structured, maintainable, secure, and scalable by design. This repo is also a public hiring artifact — assume a principal engineer will read the diff. No shortcuts that you would not defend in review.

**Core loop you must run on every task:** plan → implement → self-verify (typecheck, lint, test, e2e) → self-review (fresh context) → commit → open PR. Never end a task with unverified code.

### Code commenting standard
Write code that keeps the reader informed — but comment for **understanding, not volume**. The goal is a repo a principal engineer reads as "documented by someone who knows what's worth documenting." Restating code in comments is a junior signal and the comments rot; explaining *why* is the senior standard.

**Comment these (code can't express them):**
- **Why** a non-obvious choice was made — the tradeoff, constraint, or bug it avoids.
- **Why not** the obvious alternative, when there's a real reason a reader might otherwise "fix" it and break something.
- Anything **surprising, subtle, or load-bearing**: race conditions, ordering dependencies, security checks, GDPR/PII reasons, performance hacks.
- **File / module headers**: one block at the top stating the file's purpose and how it fits the system.
- **Exported functions, public APIs, and complex types**: JSDoc/TSDoc with params, returns, throws, and gotchas.
- **Pointers back to the docs**: reference `docs/SYSTEM_DESIGN.md`/`docs/DESIGN_GUIDE.md` sections so a decision's reasoning is traceable (e.g. `// cookieless by design — see docs/SYSTEM_DESIGN.md §8`).

**Do NOT write these (they are noise and rot):**
- Comments that restate what the line already says (`// loop over users`).
- Commented-out dead code (delete it; git remembers).
- Decorative banners or filler.

**Maintenance:** when you change code, update its comments in the same edit. A comment that no longer matches the code is worse than no comment — it misleads. Prefer making code self-explanatory (clear names, small functions) over compensating with comments.


---

## 1. Project facts [SITE — STUB, fill in per product]
> Every field below is a **placeholder**, not a default. Fill them from the product's approved
> `docs/SYSTEM_DESIGN.md` before the first line of code. If a field doesn't apply, write `none` —
> don't delete the row, and don't inherit another product's answer.

- **Product:** `<name>` — `<one line: what it is and who it's for>`
- **Archetype:** `<content site | interactive app | service/API | shared package>` (`STRUCTURE.md` §4)
- **Stack:** `<framework + language + styling>`
- **Brand:** `weaverbit-core`, installed from GitHub and never restyled locally (`BRAND.md`)
- **Data stores:** `<none | store + host>`
- **Analytics:** `<none | vendor>` — if any, always behind a local wrapper, never the vendor SDK directly
- **Public write endpoints:** `<none | list them>` — each one needs validation, rate limiting, and tests
- **Deploy targets:** `<none | FE host / BE host>`

**Deployment is not your concern** regardless of what those targets are. Your job ends when verified
code is pushed and a PR is opened. Do not write deploy scripts or touch infra.

---

## 2. Commands [SITE — edit per project]
Use these exact scripts. If a script is missing, add it to `package.json` rather than running ad-hoc commands.

```
npm run dev          # <the product dev server>     — STUB until filled in
npm run typecheck    # tsc --noEmit                 — MUST be clean
npm run lint         # eslint + prettier --check    — MUST be clean
npm run test         # vitest run                   — all green
npm run e2e          # playwright test (headless)   — all green
npm run build        # <the product build>          — STUB until filled in, MUST succeed
```

The three middle gates are real from the first commit. `dev` and `build` ship as loud
placeholders in `package.json` because a template has no app; replacing them is part of the
first product task, and `tests/gates.test.ts` fails the moment `src/` has code and they haven't
been replaced.

---

## 3. Definition of done [HARNESS]
A task is **not done** until ALL of these pass. This is a hard gate, not a checklist to skim:
1. `npm run typecheck` — zero errors.
2. `npm run lint` — zero errors, zero warnings, and formatting clean (the gate runs `eslint` then `prettier --check`).
3. `npm run test` — all unit/integration green; new logic has tests.
4. `npm run e2e` — Playwright specs green for any UI you touched.
5. `npm run build` — succeeds.
6. Self-review pass completed (see §6) and findings addressed.
7. Acceptance criteria for the task met (check against `docs/SYSTEM_DESIGN.md` and `docs/DESIGN_GUIDE.md`).
8. No secrets, no PII in code or logs. `.env.example` updated if new env vars introduced.

If you cannot make a gate pass, **stop and report** what's blocking — do not commit around it, do not weaken a test to make it green.

---

## 4. The verify loop (how to self-test) [HARNESS]
Verification quality = loop quality. Thin tests = confidently shipping broken work. Invest here.

- After **every** code edit: run `typecheck` + `lint`, fix immediately before moving on. (Wired as a `PostToolUse` hook — see §9.)
- For business logic: write `vitest` tests first or alongside; assert behavior, not implementation.
- For UI: write/extend **Playwright** specs. This is your "manual testing" — drive the real browser, assert visible outcomes, capture screenshots, read failures, fix. Cover: happy path, empty state, error state, mobile viewport, keyboard focus.
- For every public write endpoint declared in §1: integration test that a valid POST is accepted and persisted, and that an invalid or abusive POST is rejected and rate-limited. Products with no write endpoints skip this.
- Never assume something works because it "should." Run it. Read the output. Act on it.

---

## 5. Git workflow [HARNESS]
- **Never commit to `main` directly.** Branch per task: `feat/<short-slug>`, `fix/<slug>`, `chore/<slug>`.
- Conventional commit messages: `feat: …`, `fix: …`, `docs: …`, `refactor: …`, `test: …`. Imperative, present tense, explain *why* when non-obvious.
- Commit in logical units, not one giant dump.
- When done: push branch, open PR with `gh pr create`. PR body must summarize: what changed, why, how it was verified (which gates passed), and any follow-ups.
- CI (`.github/workflows`) re-runs the same gates server-side. The local loop and remote loop assert the same things.
- **Do not merge.** Aditya reviews and merges the PR. (Where §1 declares deploy targets, merge triggers them — already handled, and still not your concern.)

---

## 6. Self-review (fresh-context critique) [HARNESS]
The model that wrote the code is biased toward it. Real review needs separated context.
- Invoke the **`code-reviewer` subagent** (`.claude/agents/`) on the diff before opening the PR.
- It critiques against: correctness, edge cases, type safety, security (input validation, secrets, injection), GDPR/PII handling, accessibility, performance, and adherence to `docs/SYSTEM_DESIGN.md` + `docs/DESIGN_GUIDE.md`.
- Address every finding or explicitly justify why it's out of scope in the PR body.
- The `/review` slash command does the same on demand.

---

## 7. Guardrails — what NOT to do [HARNESS]
- Do **not** weaken or delete tests to pass a gate.
- Do **not** invent product/design decisions silently. If `docs/SYSTEM_DESIGN.md`/`docs/DESIGN_GUIDE.md` don't cover it, **stop and ask** — don't guess on ambiguous product calls.
- Do **not** add dependencies casually. Prefer the platform/stdlib. Justify every new package in the PR.
- Do **not** touch deployment/infra (user owns that).
- Do **not** commit secrets, `.env`, or generated artifacts that belong in `.gitignore`.
- Do **not** reproduce large code blocks from the web without understanding/adapting them.
- Do **not** disable type checking (`any`, `@ts-ignore`) to move faster — fix the type.

---

## 8. Autonomy level [HARNESS]
Operate **long-leash autonomous**: loop through many steps without stopping, but the **PR is the human gate**. Aditya reviews every PR before merge. Do not seek true zero-human merges. When a decision is ambiguous or a gate won't pass, surface it rather than guessing.

---

## 9. Hooks & automation (setup reference) [HARNESS]
Configure in `.claude/settings.json` (verify exact schema against current Claude Code docs before relying on it):
- **`PostToolUse`** on file edits → run `typecheck` + `lint`, feed errors back for immediate fix.
- **`Stop`** → run the Definition of Done (§3) gates and block the stop if any is red. The `stop_hook_active` guard means it blocks the *first* stop of a chain, not every one — without it, a hook that always blocks is an infinite loop.
- **Subagent** `code-reviewer` in `.claude/agents/` → fresh-context diff critique (§6).
- **Slash commands** in `.claude/commands/`: `/review` (critique diff), and — content-site products only — `/new-post` (scaffold a blog MDX file with frontmatter). A product with no blog deletes `new-post.md`, as `weaverbit-core` did.

---

## 10. Reuse across subprojects [HARNESS]
This file is the template for every Weaverbit product. To reuse:
1. Copy `CLAUDE.md`, `PROCESS.md`, `STRUCTURE.md`, `CODE_STANDARDS.md`, `docs/`, `.claude/`, `.github/workflows/`, and the baseline tooling config into the new repo.
2. Fill the **[SITE]** stubs (§1 project facts, §2 commands) for the new product — they ship empty on purpose.
3. Keep all **[HARNESS]** sections as-is — they encode the standards and the loop.
4. If the product has analytics, wire its wrapper in `lib/` to the event contract named in its own `docs/SYSTEM_DESIGN.md`, so the product reports into the portfolio observability layer from day one. Products without analytics skip this.

---

## 11. Folder documentation (READMEs) [HARNESS]
Keep the repo self-documenting, but only where it earns its keep. Stale docs are worse than none.

**When to add a `README.md` to a folder:**
- Add one when the folder's **purpose, conventions, or gotchas are not obvious from its name and contents** — a folder with a non-obvious naming or data convention, an unexpected dependency between files, or anything a new reader would otherwise have to reverse-engineer.
- **Do NOT** add one to a folder that explains itself. That includes the ordinary source folders (`components/`, `app/`, `lib/`, `tests/`) **and the control-layer folders (`.claude/**`, `.github/workflows/`)** — hooks, agents, commands and CI workflows are named for what they do, and a README over them only restates the filenames and then rots. If such a folder later develops a real convention, add one then.

**What a folder README contains (keep it short):**
1. One line: what lives here and why.
2. A table or list of the key files and what each does.
3. Any non-obvious rule, dependency, or gotcha.
4. If it's part of the reusable harness, a note on how it's reused.

**Maintenance is mandatory — this is the part that prevents rot:**
- When you **add, remove, or significantly change** files in a folder that has a README, **update that README in the same PR**. A diff that changes a documented folder but not its README is incomplete.
- When you create a new folder that meets the "when to add" bar above, create its README in the same PR.
- The `code-reviewer` subagent should flag any PR that changes a documented folder without updating its README.

