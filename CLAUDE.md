# Writing letters for the Drex blog — guide for Claude + a non-technical author

This is a Jekyll zine. **Authoring a letter = Markdown + a fixed kit of includes. Nothing else.**
You (Claude) write the post; you do **not** touch SCSS, JS, sprites, colors, shadows, or the
`bakery.js` / `_realism.scss` material layer. Those are the brand and they are governed (below).
If a post needs something the kit doesn't have, the answer is "rewrite it with the kit," not "add CSS."

## The golden rule
> A letter must read well and on-brand with **just Markdown + a few includes**. The handmade look
> is applied centrally — you never hand-write HTML/CSS for texture, never invent a color, never
> tune a shadow. Dense marginalia is **optional seasoning for hero posts**, not a per-post quota.

## New post: front matter
Create `_posts/YYYY-MM-DD-slug.md`:
```yaml
---
layout: post
title: "The title."           # short; a period at the end is the house style
eyebrow: "Lore"               # section flavor word (Lore / Vision / Canon …)
date: 2026-06-21
dek: "One or two sentences — the standfirst. Plain, not cryptic."
tags: [lore, lineage]         # lowercase; reused across posts
stock: cloth                  # optional paper stock: oats (default) | cloth | kraft
reading_time: auto
---
```

## The include kit (the ONLY furniture you may use)
Write normal Markdown prose, and drop these where they help. Don't exceed what the content earns.

| Include | What it is | Example |
|---|---|---|
| `stamp` | a rubber-ink stamp, short CAPS only | `{% include stamp.html text="LORE" %}` |
| `pullquote` | a torn-paper pull-quote scrap | `{% include pullquote.html text="…" attrib="…" %}` |
| `callout` | an index-card aside | `{% include callout.html kind="for-drex" title="For Drex" body="…" %}` |
| `definition` | a defined-term index card | `{% include definition.html term="Sashiko" body="…" %}` |
| `m-note` | a hand-marker margin note | `{% include m-note.html text="…" color="grass" side="right" %}` |
| `m-mark` | a margin doodle glyph | `{% include m-mark.html type="star" color="coral" side="left" %}` (types: star/arrow/check/caret/exclaim) |
| `figure` | a captioned image/polaroid | `{% include figure.html src="…" caption="…" %}` |
| `cite` / `cutline` | source line / photo cutline | `{% include cite.html … %}` |

Colors (for `m-*` and inline spans): `grass`, `coral`, `lazuli`, `bus`, `happy`, `ink`. **No others.**

## Inline emphasis (inside a paragraph)
`<span class="m-underline m-coral">marker underline</span>`, `m-hl m-happy` (highlighter),
`m-scribble`, `m-box`, `m-strike`. **Avoid `m-circle` inside running prose** — a ring around words
reads as a copy-edit "fix this" mark; use `m-underline` or `m-hl` for emphasis instead. (Rings are
fine in the margin via `m-mark`.)

## The lean baseline (do this by default)
- A strong letter = good prose + a `stamp` opener + maybe 1 `pullquote`, 1 `definition`, 1 `callout`,
  and **a handful** of `m-note`/`m-mark` (think 3–8, not 85). Restraint is the brand.
- Every letter should end with the subscribe card (the post layout adds it automatically — don't
  duplicate it).
- Keep the `dek` **plain and concrete** — it's often the only thing a skimmer reads.

## Don'ts
- ❌ Don't paste raw HTML/CSS for textures, borders, shadows, or colors.
- ❌ Don't invent new includes, classes, or colors.
- ❌ Don't put texture, colored scraps, or hand-circles **inside** the reading column's flow in a way
  that hurts legibility — emphasis only via the inline `m-*` spans above.
- ❌ Don't edit `_sass/`, `assets/js/`, or `_includes/*` material partials to make a post look right.

---

## Brand governance rule (for anyone editing CSS/JS — not for authoring)
One machine-checkable invariant keeps the look coherent and accessible:
> Interactive controls (buttons, tags, nav, form fields) **may** carry edge/rim/foil texture and
> **must** hit ≥4.5:1 text contrast + ≥44px targets. They **must not** use a `--bk-piece-*` raster
> **fill** as the control face, and **no** texture goes under the running-text (`.prose`) column.

The one grandfathered exception is the foil submit (`--bk-piece-kraft`, already AA at 48px). The
moat is the **voice + Oats palette + the "visible mend, made by humans together" lineage** — not the
torn-paper texture (which is commoditizing in 2026). Win on restraint. See `BRAND-AND-UX.md`.
