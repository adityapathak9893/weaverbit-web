---
description: Scaffold a new blog post as an MDX file with correct frontmatter.
argument-hint: "<post title>"
---

> Content-site products only. This command writes `content/blog/<slug>.mdx`; a product with
> no blog deletes this file rather than repointing it (`weaverbit-core` did).

Create a new blog post MDX file for the title: $ARGUMENTS

Steps:
1. Slugify the title (lowercase, hyphenated, strip punctuation) → `<slug>`.
2. Create `content/blog/<slug>.mdx` with this frontmatter, filled in:
   ```
   ---
   title: "$ARGUMENTS"
   description: ""        # 1-2 sentence summary for SEO + listing + OG. ASK me if unclear.
   date: "<today's date, YYYY-MM-DD>"
   tags: []               # propose 2-4 relevant tags, confirm with me
   ogImage: ""            # leave blank; the OG-image generator fills this
   published: false       # stays false until I say publish
   ---
   ```
3. Below the frontmatter, add a skeleton: an intro paragraph placeholder, 2-3 `##` section headings appropriate to the topic, and a closing.
4. Do NOT invent technical claims or fabricate details — leave clearly-marked `TODO:` placeholders for anything that needs my real experience/data.
5. Confirm the file path and remind me it's `published: false` so it won't go live until I flip it.

Keep `published: false` until I explicitly approve. Never publish on your own.
