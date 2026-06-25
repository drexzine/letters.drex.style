# The correspondence — how to publish a letter

This is the Drex blog: a Jekyll zine. **Writing a letter = a Markdown file + a small kit
of includes. Nothing else.** You never touch SCSS, JS, colors, or shadows — the handmade
look is applied centrally. If a post seems to need something the kit doesn't have, the
answer is "rewrite it with the kit," not "add CSS." See `CLAUDE.md` for the full house
rules. For brand and design inspiration, draw on the live **drex.style** site (the
`drexzine.github.io` repo) and the Drex brand spec in the sibling `drex-claude-skill`
repo: `source-of-truth/branding/drex-brand.md` plus the brand-guidelines PDF
`drex-comprehensive-brand-guidelines-v1-trim.pdf` (same folder).

## How to publish a letter

1. Create a file in `_posts/` named `YYYY-MM-DD-slug.md` (the date and slug become the URL,
   e.g. `/2026/06/the-room-is-the-product/`).

2. Start it with this front matter:

   ```yaml
   ---
   layout: post
   title: "The title."        # short; a period at the end is the house style
   eyebrow: "Canon"           # the insider word: Canon | Vision | Lore
   kicker: "Manifesto"        # the plain, scannable label: Manifesto | Vision | Lineage
   author: chielo             # a key from _data/authors.yml
   date: 2026-06-21
   dek: "One or two plain, concrete sentences — the standfirst a skimmer reads."
   tags: [vision, manifesto]  # lowercase; reuse existing tags where you can
   stock: oats                # paper stock: oats (default) | cloth | kraft
   reading_time: auto
   ---
   ```

3. Write normal Markdown prose. Drop in furniture includes where they genuinely help — do
   not exceed what the content earns. The lean baseline for one letter is:
   **a `stamp` opener + at most 1 `pullquote` + 1 `definition` + 1 `callout` + 3–8 margin
   marks** (`m-note` / `m-mark`). Restraint is the brand.

### The include kit

| Include | What it is |
|---|---|
| `{% raw %}{% include stamp.html text="CANON" %}{% endraw %}` | a rubber-ink stamp, short CAPS only |
| `{% raw %}{% include pullquote.html text="…" attrib="…" %}{% endraw %}` | a torn-paper pull-quote scrap |
| `{% raw %}{% include callout.html kind="for-drex" title="For Drex" body="…" %}{% endraw %}` | an index-card aside |
| `{% raw %}{% include definition.html term="…" body="…" %}{% endraw %}` | a defined-term index card |
| `{% raw %}{% include m-note.html text="…" color="grass" side="right" %}{% endraw %}` | a hand-marker margin note |
| `{% raw %}{% include m-mark.html type="star" color="coral" side="left" %}{% endraw %}` | a margin doodle (types: star/arrow/check/caret/exclaim) |
| `{% raw %}{% include figure.html src="…" caption="…" %}{% endraw %}` | a captioned image / polaroid |

**Colors** (for `m-*` and inline spans): `grass`, `coral`, `lazuli`, `bus`, `happy`, `ink`.
No others.

**Inline emphasis** inside a paragraph: `<span class="m-underline m-coral">…</span>` (marker
underline) or `<span class="m-hl m-happy">…</span>` (highlighter). Don't ring words inside
running prose — a ring reads as a copy-edit "fix this" mark.

The subscribe card is added automatically at the end of every post — don't add it yourself.

## How to add a guest author

1. Add an entry to `_data/authors.yml` (copy the shape of the `chielo` entry):

   ```yaml
   ada:
     name: "Ada Example"
     role: "Guest contributor"
     accent: lazuli            # chip accent: grass | coral | lazuli | bus | happy | ink
     photo: /assets/img/team/ada.jpg   # square headshot, ~600x600
     bio: "One or two sentences on who they are and why they're writing."
   ```

2. Set `author: ada` in that post's front matter. The byline will render their chip and
   link to their author page.

3. Drop a square headshot at the `photo:` path you used.

That's it. The same Markdown + include kit applies — a guest letter looks like any other.
