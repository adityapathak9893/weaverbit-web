# CODE_STANDARDS.md — how Weaverbit code is written

> **Canonical copy lives in `weaverbit-template`; products copy at birth.** Inherited as-is and
> not filled in per product — a product-specific addition goes at the bottom, under §8.
>
> Lives at the repo root beside `PROCESS.md` and `STRUCTURE.md`, not in `docs/`: it is a
> governing doc products inherit, and `docs/` holds the four fill-in forms only.

---

## 1. The standard in one line

**Boring, readable, handcrafted.** The next reader is Aditya six months from now with no context.
Optimize for their comprehension, not for your cleverness or your line count.

## 2. TypeScript — strict, no escape hatches

Enforced by `tsconfig.json`; the `typecheck` gate must be zero-error (`CLAUDE.md` §3).

- `strict: true`, plus `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`,
  `noImplicitReturns`, `noFallthroughCasesInSwitch`. These stay on. Turning one off to unblock
  yourself is not a fix.
- **No `any`, no `@ts-ignore`, no `as` used to silence a real problem** (`CLAUDE.md` §7). If the
  type is genuinely unknowable, `unknown` + a narrowing check — not `any`.
- `verbatimModuleSyntax` + `isolatedModules`: type-only imports are written `import type`.
- Types are honest. A function that can return `undefined` says so in its signature.

## 3. Lint — nothing yellow lands

Enforced by `eslint.config.js`, run as `eslint . --max-warnings 0` (the `lint` gate, which
then also runs `prettier --check .` — see §4).

- **A warning is an error.** There is no "we'll clean it up later" state.
- Unused variables and arguments are removed. Only a deliberate placeholder may stay, prefixed
  `_` (`argsIgnorePattern: '^_'`).
- `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` are **errors**, not warnings —
  a lying dependency array is a real bug, not a style opinion.
- `jsx-a11y` recommended rules are on from the first component: accessibility is a floor, not a
  later pass.

## 4. Formatting — decided once, by Prettier

Configured in `.prettierrc.json`: single quotes, semicolons, 100-column width, trailing commas.

**Enforced by the `lint` gate**, which runs `eslint` and then `prettier --check .`. Folding it
into `lint` rather than adding a sixth gate means it runs everywhere the existing gate already
does — the post-edit hook, the Stop gate, and CI — with nothing new to remember.

- Formatting is never a review topic. Run `npm run format:write`; the tool decides.
- **Markdown is exempt** (`.prettierignore`): the governing docs are hand-authored and
  auto-reflowing their tables and prose creates noise diffs.

## 5. Structure & naming

Owned by `STRUCTURE.md`, restated here because they are code rules in practice:

- **Feature-first.** Product code lives in `src/features/<feature>/`, and a feature is imported
  only through its `index.ts` (`STRUCTURE.md` §3).
- **The graduation rule — HARD RULE** (`STRUCTURE.md` §1.1): code starts inside the feature that
  needs it and moves to `lib/` or `components/ui/` **only when a second feature actually imports
  it**. Not when it might be shared. Premature sharing is a defect and is flagged in review; so
  is the same logic sitting duplicated in two features once a second consumer exists.
- **`lib/` holds no business logic** — cross-cutting utilities and external-service clients only.
- Naming per `STRUCTURE.md` §5: `kebab-case` folders, `PascalCase` components, `useThing.ts`
  hooks, one component per file.

## 6. Color and style — no raw hex

Enforced inside the `weaverbit-core` repo by its `tests/no-raw-hex.test.ts`, and by review everywhere else.

- **No hex literal (`#rrggbb`, `#rgb`, `#rrggbbaa`) may appear in product code or product CSS.**
  Color comes from the `weaverbit-core` tokens: `var(--wb-*)` or the Tailwind preset.
- The token definitions in `weaverbit-core` are the *only* place raw hex is legal. That is what
  makes the five display modes and the WCAG AA floor hold — a hardcoded color silently opts one
  element out of every mode at once.
- The same applies to spacing, radius, and type: use the scales, not magic numbers.
- A product extends the brand in `docs/DESIGN_GUIDE.md`; it never contradicts it (`BRAND.md`).

## 7. Comments and tests

- **Comments:** follow the commenting standard in `CLAUDE.md` §0 — explain *why*, never restate
  the line; file/module headers; JSDoc on exported APIs; delete dead code; update the comment in
  the same edit as the code. A stale comment is worse than no comment.
- **Tests:** business logic gets `vitest` tests that assert *behavior*, not implementation; UI
  gets a Playwright spec covering happy path, empty state, error state, mobile viewport, and
  keyboard focus (`CLAUDE.md` §4). **Weakening or skipping a test to pass a gate is a BLOCKER**
  (`CLAUDE.md` §7).
- **Dependencies:** prefer the platform and the standard library; every new package is justified
  in the PR body (`CLAUDE.md` §7). There is no mechanical check for this one: enforcement is the
  `code-reviewer` reading the PR body for that justification and flagging a new dependency that
  arrives without one.

## 8. Product-specific additions

*(None. A product appends its own rules here — language/framework specifics its stack requires —
and never edits §§1–7, which are inherited.)*
