# WORKFLOW_DATAFLOW.md — [PRODUCT NAME]

> **What this is:** the second planning document. It describes *how the product behaves* — the steps a user takes, and how information moves through the system. Filled from the brief + PRODUCT_SPEC, approved by Aditya before code. (See `PROCESS.md` §3.)
>
> Replace every `[ ... ]`. Keep it plain; diagrams in words are fine.
>
> **Status:** ☐ Draft  ☐ Approved by Aditya on ______

---

## 1. The main user journeys
> Walk through what a person actually does, step by step, for each important path. One short list per journey.

### Journey A: [name, e.g. "A visitor discovers a product"]
1. [ ... ]
2. [ ... ]
3. [ ... ]

### Journey B: [name]
1. [ ... ]
2. [ ... ]

*(Add more journeys as needed. Cover the unhappy paths too — what happens when something is empty, fails, or the user makes a mistake.)*

## 2. The screens / pages involved
> List the screens or pages these journeys pass through, and one line on what each is for.

- [ ... ] — [ ... ]
- [ ... ] — [ ... ]

## 3. How data moves
> For each piece of information the product handles: where does it come from, where does it go, where is it stored (if at all)? Plain words.

| Information | Comes from | Goes to / stored where | Notes |
|---|---|---|---|
| [ ... ] | [ ... ] | [ ... ] | [ ... ] |

## 4. States and transitions
> If something has states (e.g. a product is "live" or "upcoming"; a submission is "new" then "read"), list them and what moves between them.

- [ ... ]

## 5. What needs a backend vs. what doesn't
> Be explicit: which parts are just static pages, and which parts genuinely need a server / database / external service? (Keeps us from building backend we don't need.)

- Static (no server): [ ... ]
- Needs a server/db/service: [ ... ]

## 6. External services this depends on
> Anything outside our own code: a database, an email service, an AI API, analytics, etc. Note which are Aditya's to set up.

- [ ... ]

## 7. Privacy / data note
> Does any of this handle personal information? If so, what's the minimal amount we can collect, and how do we stay respectful (and compliant)? (See the product's SYSTEM_DESIGN for the full posture.)

[ ... ]

## 8. Open questions for Aditya
- [ ... ]

---
*Approval gate: Aditya approves before code. (PROCESS.md §3)*
