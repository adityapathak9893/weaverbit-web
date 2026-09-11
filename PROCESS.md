# PROCESS.md — The Weaverbit Product Development Process

> **Canonical copy lives in `weaverbit-template`; products copy at birth.**
>
> **This is the bible.** It governs how every product at Weaverbit is planned, built, reviewed, and shipped. It is authored and owned by Aditya. Agents do not modify this document. Every product repo references it; no product deviates from it without Aditya changing it here first.
>
> **Version:** 0.2
> **Status:** Living document. Changes are deliberate, dated, and made by Aditya.

---

## 0. Why this exists

Weaverbit builds AI-native products as a portfolio that serves two goals: (a) generate product revenue, and (b) function as the engineering artifact that lands Aditya elite global remote work. Both goals require the same thing from the codebase: **work of a consistent, high, defensible standard, produced reliably, that reads as handcrafted by one builder.**

Agents (Claude Code and successors) do most of the typing. This process exists so that what they produce is **what Aditya would have produced** — and so that anything that isn't gets caught before it ships. The process is the mechanism by which autonomy is *earned and bounded*, not assumed.

---

## 1. First principles (read before everything else)

These are not negotiable. Every other rule in this document descends from them.

1. **Verification over instruction.** An instruction in a doc is a wish; a failing gate is a wall. We rely on deterministic enforcement (types, lint, tests, CI, review) to catch deviation — not on the hope that the agent followed orders. When in doubt, add a gate, not a paragraph.

2. **The human gate is sacred.** Nothing reaches `main` without Aditya reading and approving it. Automation makes review *fast*; it never *replaces* it. "Handcrafted by me" means "reviewed and approved by me against a standard I set" — not authored keystroke-by-keystroke.

3. **Plan before code, always.** No product is built before its planning documents exist and are approved (§3). The agent that starts coding without an approved plan has already failed, regardless of output quality.

4. **Boring is a feature.** Conventional, readable, predictable code beats clever code every time. Cleverness is a defect here. If a competent mid-level engineer would have to pause to understand a line, it is too clever.

5. **Specify intent, enforce behavior, review the result.** Three layers, three different jobs: specs say what we want, gates enforce how code must behave, Aditya confirms the result is right. None substitutes for another.

6. **Lean where the agent reads, detailed where humans govern.** Documents loaded into an agent's working context during a build (e.g. `CLAUDE.md`) stay tight — bloat degrades agent performance. Governing and reference documents (this file, planning docs) may be detailed. Know which kind you're writing.

7. **The process is proven by products shipped, not by its own elegance.** A process improved by use beats a process perfected in the abstract. Timebox process work; apply it; revise from evidence.

---

## 2. The portfolio architecture

**Three repository types. Separate repos. No monorepo.**

| Repo | Role | Notes |
|---|---|---|
| `weaverbit-template` | Cloned to start any new product. Contains the harness + empty planning-doc templates. | The starting point for every product. |
| `weaverbit-core` | Shared brand: design tokens, fonts, the mono-voice, shared UI primitives. Installed by products **from GitHub** (no npm publish). | Versioned by git tag. Products opt in to upgrades deliberately. |
| `<product>` (e.g. `weaverbit-web`, `cite`) | One product each. Own repo, own deploy target, own CI, own history. | Clones the template, installs core. |

**Why separate repos:** products are independent (different subdomains, independent manual deploys, isolated histories). They share a *look*, not a runtime. Shared look → shared package. Independent lifecycles → separate repos. This keeps each product's diffs clean enough for line-by-line human review.

**Shared brand rule:** all products visibly belong to the Weaverbit family — same fonts, tokens, titling, voice — by importing `weaverbit-core`. A product may extend the brand for its own needs but must not contradict it.

---

## 3. The planning gate — no code until this is done

Every product, before a single line of application code, produces these documents (templates live in `weaverbit-template`). Each must be **filled by the agent from Aditya's brief, then reviewed and explicitly approved by Aditya.** Code does not begin until Aditya says "approved."

| # | Document | Answers | Approval |
|---|---|---|---|
| 1 | `docs/PRODUCT_SPEC.md` | What is it? Who is it for? Why does it exist? What does success look like (concrete, measurable)? What is explicitly out of scope? | **Aditya, mandatory** |
| 2 | `docs/WORKFLOW_DATAFLOW.md` | What are the user flows? How does data move through the system? What are the states and transitions? | **Aditya, mandatory** |
| 3 | `docs/SYSTEM_DESIGN.md` | Architecture, stack, rendering strategy, repo & folder structure, data stores, security/compliance, scalability. | **Aditya, mandatory** |
| 4 | `docs/DESIGN_GUIDE.md` | Product-specific design that **extends** `weaverbit-core`. Layouts, components, the one signature element, motion, a11y floor. | **Aditya, mandatory** |
| 5 | `CODE_STANDARDS.md` (repo root, with the governing docs — `docs/` holds the four forms above) | Language/framework conventions, the "boring code" rules, commenting standard, naming, testing expectations. (Usually inherited near-verbatim from the template; product-specific additions noted.) | Review (often inherited) |

**The gate is strict (Aditya's standing decision):** every document above is reviewed and approved by Aditya before code. No exceptions for the first products. This may loosen only by an explicit future revision to this document — not by drift.

**Rule for the agent:** if asked to write product code while any required planning doc is missing or unapproved, STOP and say so. Producing code is not permitted to outrun the plan.

---

## 4. The build loop (how code gets written once planning is approved)

Inherited from the harness in `weaverbit-template`. Every task follows it:

```
plan the task → implement → self-verify (typecheck, lint, test, e2e)
  → self-review (code-reviewer subagent, fresh context)
  → branch + conventional commits → open PR → CI re-verifies
  → ADITYA REVIEWS & MERGES
```

- **Autonomy level:** long-leash. The agent loops through many steps unattended, but **the PR is the human gate**. The agent never merges. (See harness `CLAUDE.md` §8.)
- **Definition of Done** is enforced by gates, not goodwill: typecheck, lint, test, e2e, build all green; self-review findings resolved; planning-doc acceptance criteria met; no secrets/PII. (See harness `CLAUDE.md` §3.)
- **When the agent is uncertain or hits an ambiguous decision the planning docs don't cover, it STOPS and asks.** Silent assumptions are the primary failure mode. Surfacing a question is always correct; guessing is a defect.

---

## 5. Quality standard — what "handcrafted" means here

This section defines the bar the `code-reviewer` and Aditya enforce. "Handcrafted by Aditya" is operationalized as:

- **Readable by a competent stranger** without explanation. Clear names, small functions, conventional structure.
- **No cleverness.** No surprising one-liners, no premature abstraction, no flexibility nobody asked for. Minimum code that solves the actual problem. (Note: deliberate, justified shared infrastructure in `weaverbit-core` is not "speculative" — it is amortized across products and is allowed. The "minimum code" rule targets gold-plating a single task, not building agreed foundations.)
- **Commented for *why*, never *what*.** File headers, exported-API docs, and the reasoning behind non-obvious choices — with pointers to the planning docs. No comments that restate code. Stale comments are a MAJOR defect. (See harness commenting standard.)
- **Self-documenting structure.** Folders that need explanation get a README; obvious ones don't. Documented folders' READMEs are updated in the same PR as the change.
- **Tested where it matters.** New logic carries tests that assert behavior. A weakened or skipped test to make a gate pass is a BLOCKER.
- **Secure & compliant by default.** Inputs validated server-side, secrets in env only, GDPR posture respected (cookieless analytics, minimal data capture). (See per-product `docs/SYSTEM_DESIGN.md`.)

If Aditya reading a diff would think "I wouldn't have written it this way," the standard is not met — regardless of whether the gates are green. Green gates are necessary, not sufficient. Aditya's judgment is the final gate.

---

## 6. Roles

- **Aditya** — owner. Sets the brief, approves every planning doc, reviews and merges every PR, owns this process, owns all deployment and infrastructure, makes all product and brand decisions.
- **The agent (Claude Code / "Jarvis")** — executor. Fills planning docs from the brief, builds through the loop, self-verifies and self-reviews, opens PRs, surfaces uncertainty. Never merges, never deploys, never invents product/brand decisions, never modifies this process.
- **The harness** (hooks, reviewer subagent, CI) — enforcement. Catches deviation deterministically and forces correction before the human gate.

---

## 7. Starting a new product (the checklist)

1. Clone `weaverbit-template` → new repo `<product>`.
2. Install `weaverbit-core` from GitHub.
3. Aditya gives the brief. Agent fills planning docs (§3) from it.
4. **Aditya reviews & approves every planning doc.** (Strict gate.)
5. Only now: agent builds through the loop (§4), one PR per slice.
6. Aditya reviews & merges each PR. Aditya deploys.
7. Anything the process didn't anticipate → note it; revise this document deliberately (§8).

---

## 8. Changing this process

- This document is versioned. Changes are made by Aditya, dated, with a one-line rationale in a changelog at the bottom.
- The process improves from *evidence* — something a real product build revealed — not from speculative polishing.
- Agents may *propose* improvements (in a PR comment or when asked) but never edit this file themselves.

---

## Changelog
- **0.2 — 2026-09-09** — Drift fixes after the first product (`weaverbit-core` v0.1.0) was built through this process. Planning-doc paths corrected to `docs/` (§3), where they have always actually lived; `CODE_STANDARDS.md` placed at the repo root as a governing doc rather than a per-product form (§3); canonical-home header added. Applied by agent on Aditya's explicit instruction and ruling — see PR #1 in `weaverbit-template`.
- **0.1 — <date>** — First pass. Architecture (separate repos + core), strict planning gate, build loop, quality standard. Authored before the weaverbit.com rebuild, which will be the first product built through this process and the first source of revisions.
