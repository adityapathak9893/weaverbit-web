# SYSTEM_DESIGN.md — [PRODUCT NAME]

> **What this is:** the third planning document — the technical plan. Architecture, the tools used, where files go, data stores, security, and how it holds up under load. Filled from the brief + the two docs above, approved by Aditya before code. (See `PROCESS.md` §3 and `STRUCTURE.md`.)
>
> Replace every `[ ... ]`.
>
> **Status:** ☐ Draft  ☐ Approved by Aditya on ______

---

## 1. Archetype
> Which kind of app is this (per STRUCTURE.md §4): content site, interactive app, or service/API? This decides the per-archetype folder extensions.

[ ... ]

## 2. The stack (tools we'll use, and why)
> List the main technologies and a one-line reason for each. Prefer boring, conventional choices. Justify anything unusual.

| Layer | Choice | Why |
|---|---|---|
| Framework | [ ... ] | [ ... ] |
| Language | [ ... ] | [ ... ] |
| Styling | [ ... ] (uses weaverbit-core) | [ ... ] |
| Data store | [ ... ] | [ ... ] |
| Other | [ ... ] | [ ... ] |

## 3. How pages are built (rendering)
> Static (built ahead of time), server-rendered, or client-side? For each main area. Static is preferred unless there's a real reason.

[ ... ]

## 4. Folder structure
> Confirm the shared spine (STRUCTURE.md §2) and list this product's `features/`. Note any per-archetype extension.

- Features planned: [ ... ]
- Anything beyond the standard spine: [ ... ]

## 5. Data stores and shapes
> If there's a database: what tables/collections, and what's in each (plain description, not full SQL yet).

[ ... ]

## 6. The brand
> Confirm: this product installs `weaverbit-core` and uses it for all fonts/colors/modes. List any product-specific design extension (which also goes in DESIGN_GUIDE.md).

- Installs weaverbit-core: ☐ yes
- Extensions: [ ... ]

## 7. Security & privacy
> Inputs validated where? Secrets kept where? Personal data — collected minimally and handled how? Which display-respecting / privacy choices apply (e.g. cookieless analytics)?

[ ... ]

## 8. Holding up under load / scale
> Realistically, what load is expected, and what makes this not fall over? (For most static sites: "served from the edge, effectively unlimited reads." Be honest about the one dynamic part if there is one.)

[ ... ]

## 9. What Aditya sets up (infra)
> The things only Aditya does: repos, deploy targets, databases, secrets, domains. List them so nothing's assumed.

- [ ... ]

## 10. Acceptance criteria (architecture)
> The checkable technical conditions for "done." The build is measured against these.

- [ ... ]
- [ ... ]

## 11. Open questions for Aditya
- [ ... ]

---
*Approval gate: Aditya approves before code. (PROCESS.md §3)*
