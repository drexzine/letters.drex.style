# Drex Blog — Research Plan & Build Spec

> **Chielo's blog** — where the CEO posts visionary essays, explains Drex, and drops lore.
> Jekyll → GitHub Pages at **blog.drex.style**. Whimsymaxxed, ultra-brand-adherent,
> mobile-first. Built via the proven Drex design-loop (build → render → multi-lens
> critique → fix). Decisions locked 2026-06-20.

---

## 1. North Star

A blog that feels like **Chielo mailed you a hand-made zine of his thinking** — torn paper,
washi tape, marker, rubber stamps, the warm Oats desk — yet reads cleanly for 3,000-word
essays on a phone. The landing page (drex.style) and the app chrome are one world; the blog
is the **third surface** in that world: the correspondence made public and archived.

The content is real and demanding: long, deeply-researched canon/lore/strategy essays (see
`~/Downloads/2026-05-12_the_correspondence.html` — "How Drex holds the practice between
rooms"). The blog must carry that density with delight, not bury it.

## 2. The central design tension (and the resolution)

- **Brand = whimsymaxx** (zine/scrapbook): torn sheets, hard offset shadows, tape, tilts,
  highlighter, marker underlines, rubber-stamp buttons, paper-grain ground, Patrick Hand.
- **Content = long-form reading** that fatigues if every line is tilted and textured.
- The correspondence file itself quietly admits this — it dropped the brand whimsy for a
  sober serif reading skin.

**Decision: FULL WHIMSYMAXX throughout** (Chielo's call) — but governed by DESIGN.md's own
law: *maximalism in **texture**, not cognitive load; body-copy legibility is **sacred**.*
So the prose body sits on a torn-paper, taped, marker-annotated **stage**, but the running
text stays **Bitter on Oats at a comfortable measure**, upright, AA-contrast. Whimsy lives
in the furniture (mastheads, eyebrows, pull-quotes, callouts, figures, section seams,
margin scrawls, the index, nav, footer) and the *frame* of the reading column — never in a
way that makes a paragraph hard to read. Texture everywhere; legibility never sacrificed.

## 3. Locked decisions

| Fork | Decision |
|---|---|
| **Authoring** | Markdown + rich theme kit. Chielo writes plain `.md` with front-matter; the theme supplies all whimsy furniture as Jekyll includes + CSS. |
| **Reading skin** | Full whimsymaxx throughout (legibility sacred per DESIGN.md). |
| **Deploy** | `blog.drex.style` — new GitHub Pages repo (mirrors the `drexzine` landing setup), native Jekyll build, `CNAME`. |
| **Mobile** | First-class, emphasized twice. Mobile-first build + a dedicated critique lens. |

## 4. Source-of-truth references (the canon to build against)

- **Web/screen craft (authoritative for this):** `backend-gstack/DESIGN.md` — the
  "whimsymaxx" Craft Bible: 4 type roles + φ scale, 25/25/20/10/10/5/5 color budget, logo
  law, material primitives (torn sheet, scrap, tape, polaroid, hl/ul, rubber-stamp,
  cutline, flat-ink shadows), anti-design contract, a11y sacred list.
- **Reference implementation (copy verbatim):** `drex-landing/index.html` — shipped,
  approved. The `:root` tokens, the hidden `<svg>` filter `<defs>` (`#torn`, `#rough`,
  `#roughsm`, `#soft`, + boil seed variants), the three-layer body background (dots +
  notebook rules + grain), `.tape`/`.splay`/`.hl`/`.ul`/`.btn`/`.scrawl`, the clean inline
  logo SVG (one-color `fill`, upright, no filter), the reveal/slam/boil JS.
- **Brand constitution (print, but the law for logo/type/color):**
  `drex-comprehensive-brand-guidelines-v1-trim.pdf` / `drex-brand.md`.
- **Content model & voice:** `~/Downloads/2026-05-12_the_correspondence.html` — the
  furniture inventory the theme must reproduce (eyebrow, definition-block, pull-quote,
  blockquote, numbered patterns, example rows, anchors, companion banner) and Chielo's
  voice (canon, citations, "For Drex" asides).
- **Brand-adherence guardrails:** memory `drex-brand-adherence` (logo = ONE solid approved
  color, upright, no effects; palette only, no pure black/white; brand faces only).

## 5. Brand guardrails (non-negotiable — the audit grades these)

- **Logo law:** clean inline SVG, one solid approved color (Grass default), upright, **no**
  filter/shadow/tilt/recolor/outline; keep exclusion zone.
- **Type roles (4, distinct):** Courier Prime *italic* 700 = display; DM Mono 500 =
  subheads/labels/buttons (uppercase+tracking); Bitter 300/400 = body; Patrick Hand =
  eyebrows/captions/scrawl (sizeable, never tiny). φ scale via `--t-*` tokens.
- **Color budget:** Grass 25 / Oats 25 / Sambas 20 / Colorado 10 / Lazuli 10 / School Bus 5
  / Happy 5. Cream + ink dominate. Grass-green carries weight; accents are 5% only.
- **Shadows:** flat solid ink offsets only. **No blur, no gradients, anywhere.**
- **Sacred a11y (never traded for the look):** nav legibility, body legibility, AA
  contrast, `:focus-visible` Lazuli rings, ≥44px tap targets, `prefers-reduced-motion`
  kills tilts/boil/confetti, no content-hiding overlap, no horizontal overflow on mobile.

## 6. Architecture (Jekyll, GitHub-Pages-native)

```
drex-blog/
  _config.yml          # site meta, collections, plugins (jekyll-feed, jekyll-seo-tag,
                        #   jekyll-sitemap — all Pages-whitelisted), permalinks
  Gemfile              # github-pages gem (pinned to the Pages build)
  CNAME                # blog.drex.style
  .gitignore           # _site, .jekyll-cache, vendor
  index.html           # home — the zine "newsstand": splayed post cards
  about.md             # what the blog is / who Chielo is
  feed.xml             # via jekyll-feed (RSS — correspondence is a list-first practice)
  _layouts/
    default.html       # masthead + nav + grounds + footer + filter defs include
    home.html          # post index (splay of torn-paper post cards)
    post.html          # the reading stage (whimsy frame + legible Bitter column)
    page.html          # static pages (about)
  _includes/
    head.html          # fonts, meta, seo, viewport
    filters.html       # the hidden <svg> filter <defs> (verbatim from landing)
    masthead.html      # broadsheet banner, clean logo, nav (mobile burger)
    footer.html        # torn grass band
    # --- the furniture kit (Markdown-callable) ---
    eyebrow.html  pullquote.html  callout.html  definition.html
    patterns.html  figure.html  cite.html  cutline.html  stamp.html
  _sass/ (or assets/css/)
    _tokens.scss       # :root palette, fonts, φ type scale, spacing, shadows
    _grounds.scss      # body bg (dots+rules+grain), torn-sheet base, masthead, footer
    _whimsy.scss       # tape, splay, hl, ul, btn, scrawl, polaroid, scrap, stamp, cutline
    _post.scss         # the reading stage + furniture component styles
    _mobile.scss       # responsive layer (mobile-first; tilts off, fluid type, measure)
    main.scss          # @imports, front-matter `---` so Jekyll compiles it
  assets/
    js/blog.js         # reveal/slam/boil observers, burger, reduced-motion gate
    fonts/             # (v1 = Google Fonts CDN; self-host later if needed)
    img/               # logo source, og image, post images
  _posts/
    2026-05-12-the-correspondence.md   # the correspondence, ported to Markdown + furniture
    2026-0X-XX-*.md                    # 2–3 sample lore/vision posts to prove the kit
```

**Front-matter schema (what Chielo fills in):**
```yaml
layout: post
title: "How Drex holds the practice between rooms."
eyebrow: "Canon"            # Patrick-Hand scrawl chip above the title
date: 2026-05-12
dek: "Email, Instagram, and one quieter third surface..."  # the lede/standfirst
tags: [canon, strategy, lore]
hero: torn                  # masthead treatment
reading_time: auto
og_image: /assets/img/og/correspondence.png
```

**Furniture as Markdown-callable includes**, e.g.:
```liquid
{% include pullquote.html attrib="Lave & Wenger" text="Most learning does not take place with the master." %}
{% include definition.html term="Hub correspondent" body="The one who routes..." %}
{% include callout.html kind="for-drex" body="Sign your name. Use 'you,' singular." %}
{% include patterns.html items="One-to-one in form|Hub, not author|Occasional, not scheduled" %}
```

## 7. Mobile-first (emphasized — first-class requirement)

- Build mobile-first; layer desktop on top. Fluid `clamp()` type tied to the φ scale.
- **Tilts/splay → 0°** below ~480px (landing already does this); tape/overlap must never
  cause horizontal scroll — `overflow-x` clipped, decorative absolute elements constrained.
- Reading measure: full-bleed padded column on phone; ~62–66ch cap on desktop.
- Tap targets ≥44px; sticky compact masthead with a string-pull burger nav.
- **Perf:** SVG `feDisplacementMap` filters are GPU-cheap as static but expensive animated —
  cap boil to a few hero elements, disable boil on mobile + reduced-motion; lazy-load post
  images; no layout-thrash on scroll (IntersectionObserver reveals only).
- Verify at 390px (phone), 768px (tablet), 1280px (desktop) + retina crops.

## 8. Build methodology — the ultracode design-loop

Multi-agent workflow, three movements:
1. **Build** (parallel specialists, each owning distinct files against a shared contract):
   foundation/whimsy CSS engine (ported verbatim from the landing) · Jekyll skeleton +
   layouts + deploy · furniture include kit + post styles · mobile/responsive layer ·
   port the correspondence + write sample posts.
2. **Critique** (adversarial multi-lens panel, read-only, scores against this spec +
   DESIGN.md + brand law): brand-constitution · whimsy-craft consistency · mobile/responsive
   · a11y sacred-list · Jekyll/Pages build-correctness · editorial reading & IA · voice.
3. **Fix** (synthesis ranks deduped findings; apply highest-impact; re-verify).
Then **I render with the `browse` daemon** (sandbox: copy `_site` to `/tmp`) at the three
widths and loop the panel until no dimension scores < 9.

## 9. Deployment

- New repo under the `drexzine` GitHub org (e.g. `drexzine/blog`), pushed as
  `Sue Paige <hi@sue.do>` to match the landing/business-card pattern.
- GitHub Pages, default branch `main`, **Jekyll build on** (no `.nojekyll`), `CNAME =
  blog.drex.style`. Add the `blog` CNAME DNS record; enable Enforce HTTPS once the cert
  provisions.
- To publish: drop a `.md` in `_posts/`, commit, push. Pages rebuilds.

## 10. Open items for Chielo / Sue (don't block v1)

- Real nav targets (link back to drex.style, Instagram handle, Substack Notes, the Kit
  signup) — currently the landing's are still dummies.
- A subscribe CTA (Kit embed) — the correspondence's whole thesis is "the list is the home";
  the blog should funnel to it. Confirm the Kit form/URL.
- OG/social images per post (generate on-brand cards).
- Which 1–2 existing essays to seed alongside the correspondence.
```
