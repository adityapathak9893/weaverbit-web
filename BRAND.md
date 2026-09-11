# BRAND.md — stub (the brand lives in `weaverbit-core`)

> **The canonical BRAND.md lives in `weaverbit-core`. It is installed, not copied.**
>
> This file is a pointer, deliberately. The brand is one thing shared by every product, and a
> copied document drifts the moment one product edits it — which is exactly the failure this
> template exists to prevent. Do not paste the brand doc in here.

## Where the brand actually is

| What you need | Where it is |
|---|---|
| The reasoning — the feeling, the fonts, the color intent, the display modes, the voice | `BRAND.md` in the [`weaverbit-core`](https://github.com/adityapathak9893/weaverbit-core) repo |
| The implementation — tokens, self-hosted fonts, modes, shared UI building blocks | the `weaverbit-core` package, installed as a dependency |
| This product's *extensions* to the brand | `docs/DESIGN_GUIDE.md` in this repo |

## The rules that still apply here

- **Install the brand; never restyle it.** A product does not redefine fonts, colors, spacing, or
  display modes locally. It imports them from `weaverbit-core`.
- **No raw hex, ever, outside `weaverbit-core`.** Color comes from tokens (`var(--wb-*)` or the
  Tailwind preset). This is enforced by the `code-reviewer` and by `CODE_STANDARDS.md`.
- **A product may extend the brand, never contradict it.** Extensions are written down in
  `docs/DESIGN_GUIDE.md` and approved like any other planning doc (`PROCESS.md` §3).
- If a product genuinely needs something the brand forbids, that is a change to the brand in
  `weaverbit-core` — proposed to Aditya, not worked around locally.

## Install

```bash
npm install github:adityapathak9893/weaverbit-core#v0.1.0
```

See this repo's `README.md` for the first-install notes (script approval, Playwright browsers).
