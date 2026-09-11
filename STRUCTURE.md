# STRUCTURE.md — Folder Structure Standard

> **Canonical copy lives in `weaverbit-template`; products copy at birth.**
>
> Part of the Weaverbit process (see `PROCESS.md`). Defines the folder structure **every** product follows. Authored and owned by Aditya. Agents do not deviate; if a product genuinely needs a structure this doc doesn't cover, the agent STOPS and asks rather than inventing one.
>
> **Model:** a shared **spine** (identical in every product) + per-archetype **extensions** (the parts that legitimately differ between a content site, an app, and a service).
> **Version:** 0.1

---

## 1. Organizing principle (the one rule that governs everything)

**Hybrid, feature-first.** Code is grouped by the *feature* it belongs to, not by its technical *kind*. A feature owns its components, hooks, logic, and types, colocated in one folder. Generic, cross-feature code lives in a small shared layer.

**Why feature-first:** to understand or change a feature, you open one folder and it's all there. Adding or removing a feature is adding or removing a folder. This survives growth and keeps PR diffs coherent (one feature = one folder = a reviewable unit), which is what makes line-by-line human review practical.

### 1.1 The graduation rule — HARD RULE

> Code starts inside the feature that needs it. It **graduates** to a shared location (`lib/`, `components/ui/`) **only when a second feature actually imports it** — not when it *might* be shared, not preemptively.

- Premature sharing is a defect (it couples features through speculative abstractions). So is leaving genuinely-shared code duplicated across features once a second consumer exists.
- **Enforcement:** the `code-reviewer` flags (a) anything placed in `lib/` or `components/ui/` that has only one consumer (should live in that feature), and (b) the same logic duplicated in two features (should now graduate). This is not guidance; it is checked on every PR.

---

## 2. The spine — identical in EVERY product

These exist in every Weaverbit repo, in these exact locations, regardless of app type:

```
<product>/
├── docs/                      # the four planning docs (PROCESS.md §3) — always in docs/
│   ├── PRODUCT_SPEC.md
│   ├── WORKFLOW_DATAFLOW.md
│   ├── SYSTEM_DESIGN.md
│   └── DESIGN_GUIDE.md
├── CODE_STANDARDS.md          # inherited near-verbatim, not filled in per product
├── PROCESS.md                 # the rulebook — copied from weaverbit-template at birth
├── STRUCTURE.md               # this doc — copied from weaverbit-template at birth
├── BRAND.md                   # stub pointing at weaverbit-core (the brand is installed, not copied);
│                              #   weaverbit-core itself holds the canonical copy
├── CLAUDE.md                  # harness — identical across products but for its [SITE] stubs
├── .claude/                   # hooks, agents, commands
├── .github/workflows/         # CI (verification only)
├── .env.example               # ONLY if the product has env vars; documents them, never real secrets
├── .gitignore
├── README.md                  # what this product is, how to run, pointers to docs
├── package.json               # the five gate scripts (CLAUDE.md §2) — never absent
├── tsconfig.json + tooling    # baseline config, same conventions everywhere
├── tests/                     # unit + integration (vitest)
├── e2e/                       # end-to-end (Playwright)
├── public/                    # static assets
└── src/
    ├── features/              # ← feature-first: the bulk of product code
    ├── components/ui/          # generic, feature-agnostic primitives (thin — most come from weaverbit-core)
    ├── lib/                   # shared utilities & clients (db, analytics wrapper, helpers) — NO business logic
    ├── styles/                # global styles / token wiring
    └── types/                 # ONLY truly global types; feature-specific types live in their feature
```

**Spine rules (all products):**
- **Brand always comes from `weaverbit-core`** (fonts, design tokens, mono-voice, shared primitives). Never redefined locally. A product may *extend* the brand in `docs/DESIGN_GUIDE.md`, never contradict it.
- **`lib/` holds no business logic** — only cross-cutting utilities and external-service clients. Business logic belongs to a feature.
- **`types/` is for global types only.** A type used by one feature lives in that feature.
- **Planning docs in `docs/`**, always findable in the same place. The governing docs copied from the template (`PROCESS.md`, `STRUCTURE.md`, `CODE_STANDARDS.md`, `BRAND.md`) and the harness (`CLAUDE.md`, `README.md`) sit at the root.
- **`.env.example` only if the product actually has env vars.** A product with none does not ship an empty one; the moment the first variable is introduced, the file is added in the same PR.
- **`package.json` always defines all five gate scripts** (`typecheck`, `lint`, `test`, `e2e`, `build` — `CLAUDE.md` §3; `lint` covers formatting too). Without it the hooks and CI silently pass while checking nothing.
- **Tests mirror the code** they cover; `tests/` for unit/integration, `e2e/` for Playwright.

---

## 3. Anatomy of a feature

Every folder under `src/features/<feature>/` is self-contained:

```
src/features/<feature>/
├── components/        # UI specific to this feature
├── hooks/             # React hooks specific to this feature (if any)
├── lib/               # logic/helpers specific to this feature
├── types.ts           # this feature's types
├── index.ts           # the feature's PUBLIC API — what other code may import
└── README.md          # only if the feature has a non-obvious convention (PROCESS.md / CLAUDE.md §11)
```

**Feature rules:**
- **Import across features goes through `index.ts` only.** A feature's internal files are private; other code imports from `features/x` (the barrel), never deep-reaching into `features/x/lib/internal-thing`. This keeps features swappable and the public surface explicit.
- **Features should not import each other circularly.** If two features need each other, the shared piece probably graduates to `lib/` (see §1.1).
- A feature is a *cohesive slice of product capability* (e.g. `blog`, `portfolio`, `feedback`, `document-upload`, `qa-chat`) — not a single component and not the whole app.

---

## 4. Per-archetype extensions

The spine is fixed; the parts below differ by app type. The archetype is declared in the product's `docs/SYSTEM_DESIGN.md`.

### 4.1 Content site (e.g. weaverbit.com) — Next.js App Router
```
src/
├── app/                       # ROUTES ONLY — thin; pages import from features and wire them
│   ├── (marketing)/           # route groups for related pages
│   ├── blog/
│   └── api/<endpoint>/route.ts
├── features/                  # portfolio, blog, feedback, …
content/                       # MDX content (e.g. content/blog/*.mdx) at root, not in src
```
- `app/` is wiring only: a route file composes feature components and fetches data; it contains no business logic.
- Content (MDX) lives in a top-level `content/` directory, version-controlled.

### 4.2 Interactive app (e.g. Cite) — Next.js or Vite
```
src/
├── app/ or routes/            # routes/pages — thin
├── features/                  # the product's capabilities, feature-first
├── lib/                       # api client, auth client, etc.
```
- Same spine, same feature-first rule. The difference is more interactive features and client-side state; state management (if any) lives inside the feature that owns it, graduating to `lib/` only if cross-feature.

### 4.3 Service / API (future) — Node/Express or similar
```
src/
├── routes/ or handlers/       # HTTP layer — thin, validates input, calls features
├── features/                  # domain logic grouped by capability
├── lib/                       # db client, shared infra
```
- Same principle: HTTP handlers are thin; domain logic is feature-grouped; `lib/` is infra/clients only.

### 4.4 Shared package (e.g. weaverbit-core) — an installable library, not an app
This is different from the others: it is **not a website or a service that runs on its own**. It is a box of shared parts (design tokens, fonts, common UI pieces) that *other* Weaverbit products install and use. Nobody visits it.
```
src/
├── tokens/                    # the design tokens (colors per mode, spacing, type) — the single source of truth
├── styles/                    # the CSS that wires tokens up, plus the mode-switching setup
├── fonts/                     # the self-hosted font files
├── components/                # the shared UI pieces (Nav, Footer, StatusTag, etc.) — feature-first if any grow large
└── index.ts                   # the public list of what other products are allowed to import
```
- Because it is a package, it has **no `app/`, no routes, no pages** — there is nothing to visit.
- Its job is to be installed by other products (from GitHub) and to hand them the brand with zero local restyling.
- The same spirit still holds: keep a clear public entry point (`index.ts`), keep things lean, and ship only shared pieces — never product-specific logic.
- A product installs this package and is then *not allowed* to redefine fonts, colors, or modes locally; it uses what this package provides (see `BRAND.md`).

**The invariant across all archetypes:** routing/entry layer is thin → features hold the capability → `lib/` holds shared infra → brand comes from `weaverbit-core` (except in `weaverbit-core` itself, which *is* the brand). If a new archetype appears, it extends this spine; it does not replace it. Adding an archetype is a deliberate revision to this doc (PROCESS.md §8).

---

## 5. Naming conventions (all products)

- **Folders:** `kebab-case` (`document-upload`, not `documentUpload`).
- **React components:** `PascalCase` files (`ProductCard.tsx`), one component per file as default.
- **Hooks:** `useThing.ts`, camelCase.
- **Utilities/lib:** `kebab-case.ts` or `camelCase.ts` — pick one per repo and stay consistent (template sets the default).
- **Types:** `PascalCase` type names; feature types in the feature's `types.ts`.
- **Barrels:** every feature has an `index.ts` public API; avoid barrel files elsewhere (they hurt tree-shaking and hide dependencies).
- **Tests:** `<name>.test.ts(x)` colocated under `tests/` mirroring source path; e2e specs in `e2e/` named by flow.

---

## 6. Enforcement summary (what the code-reviewer checks)

- Feature-first respected: product code lives in `features/`, not scattered by type. (flag violations)
- Graduation rule (§1.1): nothing in `lib/`/`components/ui/` with a single consumer; no duplicated logic across features that should graduate. (flag)
- `lib/` contains no business logic. (flag)
- Cross-feature imports go through the feature's `index.ts`, no deep imports. (flag)
- Brand imported from `weaverbit-core`, not redefined locally. (flag)
- Naming conventions (§5) followed. (flag)
- Spine present and in the right places (§2). (flag)

Green gates are necessary, not sufficient — Aditya's review is the final structural judgment (PROCESS.md §5).

---

## Changelog
- **0.2 — 2026-09-09** — Drift fixes found by the first product (`weaverbit-core`): planning docs live in `docs/`, not at the root (§2); `.env.example` is required only when the product has env vars, and `package.json` with all five gate scripts is mandatory (§2); added the shared-package archetype (§4.4).
- **0.1 — <date>** — First pass. Hybrid feature-first, graduation rule (hard), shared spine + per-archetype extensions, naming, reviewer enforcement. To be revised as real products (starting with the weaverbit.com rebuild) exercise it.
