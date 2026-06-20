export const meta = {
  name: 'drex-blog-build',
  description: 'Build the whimsymaxxed Drex Jekyll blog, then adversarially critique and fix it',
  phases: [
    { title: 'Build', detail: 'parallel specialists scaffold the Jekyll site against a shared contract' },
    { title: 'Critique', detail: 'adversarial multi-lens panel scores against brand law + spec' },
    { title: 'Fix', detail: 'rank deduped findings and apply highest-impact fixes per file' },
  ],
}

const ROOT = '/home/tilde/Projects/Drex/drex-blog'
const LANDING = '/home/tilde/Projects/Drex/drex-landing/index.html'
const DESIGN = '/home/tilde/Projects/Drex/backend-gstack/DESIGN.md'
const CORR = '/home/tilde/Downloads/2026-05-12_the_correspondence.html'
const PLAN = ROOT + '/PLAN.md'

// ── Shared contract: every builder reads this so names/tokens agree across files ──
const CONTRACT = `
PROJECT: Chielo's Drex blog. Jekyll → GitHub Pages at blog.drex.style. Repo root: ${ROOT}.
It hosts long-form visionary/canon/lore essays (see ${CORR}) in the Drex handmade
zine/scrapbook "whimsymaxx" aesthetic. Read these BEFORE writing anything:
  - ${LANDING}  = the SHIPPED, APPROVED reference. COPY ITS CSS/SVG/JS VERBATIM where noted.
  - ${DESIGN}   = the authoritative Craft Bible (type roles, color budget, primitives, a11y).
  - ${PLAN}     = the full build spec (read §5 guardrails, §6 architecture, §7 mobile).
  - ${CORR}     = the content model / furniture inventory / Chielo's voice.

NON-NEGOTIABLE BRAND LAW (the critique grades these — do not violate):
  - Logo: clean inline SVG, ONE solid approved color (Grass #1CAB5B default), UPRIGHT, NO
    filter/shadow/tilt/recolor/outline. Copy the exact logo SVG markup from the landing.
  - Four type roles, kept distinct: Courier Prime ITALIC 700 = display/headlines;
    DM Mono 500 (uppercase+tracking) = subheads/labels/buttons/eyebrows-mono; Bitter 300/400
    = body; Patrick Hand = scrawl eyebrows/captions (sizeable, never tiny). φ scale via --t-* tokens.
  - Color budget Grass25/Oats25/Sambas20/Colorado10/Lazuli10/SchoolBus5/Happy5. Cream+ink
    dominate. NO pure black/#000, NO pure white/#fff — "ink"=Sambas #414D57, "light"=Oats #FEF6E4.
  - Shadows are FLAT SOLID INK OFFSETS only. NO blur, NO gradients, anywhere.
  - SACRED a11y: nav+body legibility, AA contrast, :focus-visible Lazuli rings, ≥44px tap
    targets, prefers-reduced-motion kills tilts/boil, no content-hiding overlap,
    NO horizontal overflow on mobile.

CANONICAL TOKEN NAMES (define in _sass/_tokens.scss :root, reuse everywhere — match the landing):
  --grass #1CAB5B  --oats #FEF6E4  --sambas #414D57  --colorado #F75458  --lazuli #2496C9
  --schoolbus #ECAF21  --happy #F1DD01  --grass-deep #0C6E39  --ink #414D57  --paper #FEF6E4
  Fonts: --f-slab ("Courier Prime",...monospace)  --f-mono ("DM Mono",...)  --f-body ("Bitter",Georgia,serif)
         --f-hand ("Patrick Hand",cursive)
  φ type scale tokens: --t-hero --t-sub --t-lede (use clamp() for fluid/mobile-first), body 16px.

CANONICAL CSS CLASS NAMES (all builders use these exact names):
  Grounds/frame: body bg = three layers (dot grid + blue notebook rules + grain) per landing.
  Surfaces: .sheet (torn-paper base via filter:url(#torn) + 8px 8px 0 0 var(--ink) offset shadow).
  Whimsy utils: .tape (+.b lazuli +.c colorado), .splay (+ :nth-child tilts), .hl (+.g grass),
    .ul, .btn (+.ink), .scrawl, .polaroid, .scrap, .stamp, .cutline.
  Reading: .post-stage (the whimsy frame), .prose (the legible Bitter reading column),
    .eyebrow, .dek (lede/standfirst).
  Motion hooks (JS toggles .in): .reveal, .slam. Body carries data-motion="full".

CANONICAL SVG FILTER IDS (copy the hidden <svg><defs> block VERBATIM from the landing into
  _includes/filters.html): #torn #torn2 #torn3 #tornbig #tornbig2 #rough #rough2 #rough3
  #roughsm #roughsm2 #roughsm3 #soft #soft2 #soft3.

FURNITURE INCLUDE API (Markdown-callable; furniture builder implements, content builder calls):
  {% include eyebrow.html text="Canon" %}
  {% include pullquote.html text="..." attrib="Lave & Wenger" %}
  {% include callout.html kind="for-drex" title="For Drex" body="..." %}
  {% include definition.html term="Hub correspondent" body="..." %}
  {% include patterns.html items="A|B|C" %}        (numbered torn-scrap list)
  {% include figure.html src="..." caption="..." %}  (polaroid/taped)
  {% include cite.html author="Seth Godin" work="Permission Marketing" text="..." %}
  {% include cutline.html %}                        (scissors "cut here" section seam)
  {% include stamp.html text="CANON" %}             (rubber stamp)

FRONT-MATTER SCHEMA (posts):
  layout: post | title | eyebrow | date | dek | tags: [] | reading_time: auto | og_image

FILE OWNERSHIP — each agent writes ONLY its files (prevents conflicts):
  engine:    _sass/_tokens.scss, _sass/_grounds.scss, _sass/_whimsy.scss, _includes/filters.html
  skeleton:  _config.yml, Gemfile, _layouts/{default,home,post,page}.html,
             _includes/{head,masthead,footer}.html, index.html, about.md,
             assets/css/main.scss (front-matter + @imports all _sass partials), assets/js/blog.js
  furniture: _includes/{eyebrow,pullquote,callout,definition,patterns,figure,cite,cutline,stamp}.html,
             _sass/_post.scss (.post-stage, .prose, all furniture component styles — mobile-first base)
  mobile:    _sass/_mobile.scss (the responsive override layer: flatten .splay tilts & guard
             overflow below 600px, fluid clamp type, ≥44px targets, compact sticky nav/burger,
             cap boil + disable heavy filters on small screens; this file is @imported LAST)
  content:   _posts/2026-05-12-the-correspondence.md (port the correspondence to Markdown using
             the furniture API + brand voice) and 2 short sample lore/vision posts.

main.scss @import order (skeleton writes this): tokens, grounds, whimsy, post, mobile.
MOBILE-FIRST + the essays are LONG: prose must stay Bitter-on-Oats, upright, ~62-66ch on
desktop, comfortable padded full-width on phone, AA contrast, no fatigue. Whimsy is the
FRAME and FURNITURE, never the running text.
`

phase('Build')
const builders = [
  {
    label: 'engine',
    prompt: `You are the FOUNDATION/WHIMSY-ENGINE builder for the Drex blog.\n${CONTRACT}\n
YOUR JOB: write _sass/_tokens.scss, _sass/_grounds.scss, _sass/_whimsy.scss, and
_includes/filters.html.
- _includes/filters.html: copy the hidden <svg width=0 height=0 ...><defs>...</defs></svg>
  filter block VERBATIM from the landing (all #torn/#rough/#roughsm/#soft + seed variants).
- _tokens.scss: the :root with EXACT palette hexes + font vars + φ type scale (--t-hero/-sub/
  -lede with clamp() for mobile-first) + spacing scale + the flat offset shadow tokens. NO #000/#fff.
- _grounds.scss: the body three-layer background (dot grid + blue notebook rules + grain SVG,
  copy values from the landing), the .sheet torn-paper base (filter:url(#torn) + 8px 8px 0 0
  var(--ink) hard offset, square-ish radius), the masthead broadsheet band + torn footer band styles.
- _whimsy.scss: .tape(+.b/.c), .splay(+:nth-child tilts, straighten+lift on hover, bigger shadow),
  .hl(+.g)/.ul (with the boil keyframe swapping filter seeds), .btn(+.ink, rubber-stamp:
  rotate at rest, press INTO shadow on :active, Lazuli :focus-visible), .scrawl, .polaroid, .scrap,
  .stamp, .cutline. Copy the landing's actual CSS values verbatim wherever the class exists there.
These are SCSS partials (leading underscore) — no front-matter. Write the files with the Write tool.
Report what you wrote and any class you added beyond the contract.`,
  },
  {
    label: 'skeleton',
    prompt: `You are the JEKYLL-SKELETON builder for the Drex blog.\n${CONTRACT}\n
YOUR JOB: write the Jekyll plumbing + layouts + chrome + entry assets.
- _config.yml: title "drex." / tagline, url https://blog.drex.style, baseurl "", a description,
  permalink /:year/:month/:slug/, collections defaults (layout: post for _posts), and plugins
  jekyll-feed, jekyll-seo-tag, jekyll-sitemap. Use ONLY github-pages-whitelisted plugins.
- Gemfile: source rubygems; gem "github-pages", group :jekyll_plugins; gem "jekyll-feed" etc.
- _includes/head.html: <head> with charset, viewport (width=device-width,initial-scale=1),
  the EXACT Google Fonts <link> (Bitter, Courier Prime ital, DM Mono, Patrick Hand) used by the
  landing, {% seo %}, feed_meta, and {{ '/assets/css/main.css' | relative_url }}.
- _includes/masthead.html: torn broadsheet banner + the CLEAN inline logo SVG (copy EXACT markup
  from the landing — one-color fill, upright, NO filter) + nav with a mobile string-pull burger.
- _includes/footer.html: torn grass band + links (drex.style, Instagram, Notes, RSS) + made-with line.
- _layouts/default.html: <html><head>{% include head %}</head><body data-motion="full">
  {% include filters.html %}{% include masthead.html %}{{content}}{% include footer.html %}
  <script src=.../blog.js></script></body>. Honor prefers-reduced-motion by gating .
- _layouts/home.html: the "newsstand" — a .splay of torn-paper post cards (loop site.posts:
  eyebrow chip, title in Courier-Prime-italic, dek, date in DM Mono, tags), .reveal/.slam hooks.
- _layouts/post.html: the reading stage — masthead-style post header (eyebrow scrawl, big italic
  title, dek/lede, DM-Mono date + reading time), then the .post-stage wrapping a .prose column for
  {{content}}, then prev/next + a subscribe CTA stub + tags. (Furniture styles come from furniture builder.)
- _layouts/page.html: simple .post-stage/.prose for static pages.
- index.html: front-matter layout: home (the home page).
- about.md: layout: page — a short on-brand "what this is / who Chielo is" page in Drex voice.
- assets/css/main.scss: starts with empty front-matter (--- \\n --- ) then @import "tokens",
  "grounds", "whimsy", "post", "mobile"; (Jekyll compiles to main.css). Set @charset.
- assets/js/blog.js: IntersectionObserver adding .in to .reveal/.slam; the burger toggle;
  a prefers-reduced-motion check that strips motion; NO heavy work on scroll. Vanilla JS, no deps.
Write all files with the Write tool. Report the file tree you created.`,
  },
  {
    label: 'furniture',
    prompt: `You are the FURNITURE-KIT builder for the Drex blog (the Markdown-callable components +
their styles).\n${CONTRACT}\n
Study how the correspondence (${CORR}) uses eyebrows, definition blocks, pull-quotes,
blockquotes/citations, numbered patterns, example rows, anchors, and section seams — reproduce
that inventory as the brand whimsy.
YOUR JOB: write each _includes/*.html furniture include implementing the FURNITURE INCLUDE API
exactly (eyebrow, pullquote, callout, definition, patterns, figure, cite, cutline, stamp), and
_sass/_post.scss with: .post-stage (the whimsy frame — torn-paper/taped stage the prose sits on),
.prose (the SACRED legible reading column: Bitter body, generous line-height, ~62-66ch measure on
desktop, comfortable on phone, styles for h2/h3 as marker-underlined/scrawl headings, links,
lists, images-as-polaroids, .dek lede with optional dropcap), and every furniture component's
style (each a believable paper object: torn scrap, washi tape, rubber stamp, polaroid, highlighter
pull-quote, "cut here" cutline). Use ONLY the contract class names + tokens + filter ids. Mobile-first
base styles (the mobile builder adds the responsive override). Flat ink offset shadows only.
The callout kind="for-drex" should read like a margin note / taped slip. Write all files with Write.
Report the include API you implemented and any deviation.`,
  },
  {
    label: 'mobile',
    prompt: `You are the MOBILE/RESPONSIVE builder for the Drex blog. Mobile is a FIRST-CLASS
requirement (the user emphasized it twice) and the essays are LONG.\n${CONTRACT}\n
YOUR JOB: write ONLY _sass/_mobile.scss — the responsive override layer @imported LAST. It must:
  - Below ~600px: flatten ALL .splay/.card/.tape/heading tilts to 0deg and GUARD against horizontal
    overflow (clip decorative absolute elements, max-width:100%, overflow-x:hidden on wrappers that
    hold tilted/taped objects). No element may cause a horizontal scrollbar at 360-414px.
  - Fluid type: ensure the φ scale clamps so the hero is huge on desktop but legible on phone; body
    stays ~17-19px; prose measure is comfortable full-width with adequate side padding on phone.
  - Tap targets ≥44px (nav links, buttons, the burger); compact sticky masthead; the string-pull
    burger menu opens an accessible mobile nav.
  - Performance: cap the .ul/.hl boil animation to a couple of hero elements and DISABLE animated
    filters on small screens; ensure prefers-reduced-motion kills tilts + boil + reveal/slam.
  - Verify mentally at 360 / 390 / 414 (phone), 768 (tablet), 1280 (desktop).
You may Read the other builders' files (they write in parallel — re-Read near the end) to target the
real class names, but only WRITE _sass/_mobile.scss. Report the breakpoints + guards you added.`,
  },
  {
    label: 'content',
    prompt: `You are the CONTENT builder for the Drex blog.\n${CONTRACT}\n
YOUR JOB: write _posts/2026-05-12-the-correspondence.md — PORT the correspondence (${CORR})
into a Jekyll Markdown post using the FURNITURE INCLUDE API and the front-matter schema. Preserve
Chielo's voice and the full argument (the deeper canon: Republic of Letters / Pauline epistles /
Quaker epistles; the three structural patterns; the platform set; the nine email-canon voices with
their {% include cite %} pull-quotes and "For Drex" {% include callout kind=for-drex %} asides).
Use {% include eyebrow %} for the "Canon" chip, {% include definition %} for the definition blocks,
{% include pullquote %} for the big pull, {% include patterns %} for the numbered patterns,
{% include cutline %} between major sections. Keep paragraphs in clean Markdown (legibility sacred).
Then write 2 SHORT (~400-600 word) sample posts that fit a CEO's blog — e.g. a vision/manifesto note
and a piece of Drex lore — in Chielo's voice, exercising eyebrow + pullquote + callout + stamp so the
kit is proven. Use realistic dates (2026). Write files with Write. Report the posts created.`,
  },
]
const built = await parallel(builders.map(b => () =>
  agent(b.prompt, { label: b.label, phase: 'Build', agentType: 'general-purpose', effort: 'high' })))
log(`Build done: ${built.filter(Boolean).length}/${builders.length} specialists reported.`)

// ── Critique: adversarial multi-lens panel, read-only, scores against the spec ──
phase('Critique')
const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['dimension', 'score', 'summary', 'findings'],
  properties: {
    dimension: { type: 'string' },
    score: { type: 'integer', minimum: 0, maximum: 10, description: '0-10; 9+ = ship' },
    summary: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['severity', 'file', 'problem', 'fix'],
        properties: {
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          file: { type: 'string', description: 'repo-relative path the fix should edit' },
          problem: { type: 'string' },
          fix: { type: 'string', description: 'concrete, actionable correction' },
        },
      },
    },
  },
}
const lenses = [
  { key: 'brand-constitution', read: [DESIGN, PLAN], focus: `Logo law (one solid color, upright, NO filter/shadow/tilt/recolor), the 4 distinct type roles + φ scale, the 25/25/20/10/10/5/5 color budget, NO pure black/white, flat ink offset shadows only (no blur/gradient anywhere). Flag every violation with file:line.` },
  { key: 'whimsy-craft', read: [DESIGN, LANDING], focus: `Material-primitive consistency vs the landing: is every surface a believable paper object (torn sheet, tape, polaroid, rubber-stamp, highlighter, cutline)? Any flat rounded-rect "SaaS panel" holdouts? Are tilts varied-but-systematic? Does it match the shipped landing's hand?` },
  { key: 'mobile-responsive', read: [PLAN], focus: `MOBILE IS PARAMOUNT. At 360/390/414px: any horizontal overflow from tilts/tape? Are .splay tilts flattened? Tap targets ≥44px? Is the long-form prose comfortable and legible on a phone (measure, size, padding)? Burger nav accessible? Fluid clamp type working? Perf: animated filters/boil capped on small screens?` },
  { key: 'a11y', read: [DESIGN], focus: `The SACRED list: AA contrast (Grass-on-Oats for small text is borderline — flag body misuse), :focus-visible Lazuli rings on all interactives, prefers-reduced-motion kills tilts/boil/reveal, no content-hiding overlap, alt text, semantic landmarks/headings, keyboard nav.` },
  { key: 'jekyll-build', read: [PLAN], focus: `Will this BUILD on GitHub Pages? Check _config.yml (only whitelisted plugins), Gemfile, front-matter on every layout/post/main.scss, valid Liquid in includes + the furniture API (matching params), permalinks, feed/seo/sitemap wiring, asset paths via relative_url. If "bundle" + "jekyll" are installed, RUN "cd ${ROOT} && bundle install --quiet 2>&1 | tail -5 && bundle exec jekyll build 2>&1 | tail -25" and report real errors; otherwise statically verify and say so.` },
  { key: 'editorial-reading', read: [CORR, PLAN], focus: `As a reader of a 3000-word essay: is the reading column actually pleasant? Hierarchy (eyebrow→title→dek→body→subheads), pull-quote rhythm, the furniture serving the argument not decorating it, IA of the home "newsstand", reading time, prev/next, RSS. Does it carry Chielo's voice with delight without fatigue?` },
  { key: 'voice-content', read: [CORR], focus: `Did the correspondence port preserve the full argument + citations + "For Drex" asides + Chielo's voice (canon, reverent, specific)? Are the sample posts on-brand and CEO-appropriate? Any furniture API misused?` },
]
const reviews = await parallel(lenses.map(L => () =>
  agent(`You are the ${L.key} critic for the Drex blog. Read the built site under ${ROOT}
(the layouts, includes, _sass, _posts, _config.yml) plus: ${L.read.join(', ')}.
GRADE THIS DIMENSION ADVERSARIALLY — assume there are problems and find them. Focus:
${L.focus}
Score 0-10 (9+ = ship). Return concrete file-targeted findings with actionable fixes.`,
    { label: L.key, phase: 'Critique', agentType: 'Explore', effort: 'high', schema: FINDINGS_SCHEMA })))
const valid = reviews.filter(Boolean)
const scoreboard = valid.map(r => `  ${r.dimension}: ${r.score}/10 — ${r.summary}`).join('\n')
log(`Critique scores:\n${scoreboard}`)

// ── Fix: dedupe + rank, then apply per-file so parallel fixers never collide ──
phase('Fix')
const rank = { critical: 0, high: 1, medium: 2, low: 3 }
const allFindings = valid.flatMap(r => r.findings.map(f => ({ ...f, dimension: r.dimension })))
  .filter(f => f.severity === 'critical' || f.severity === 'high' || f.severity === 'medium')
  .sort((a, b) => rank[a.severity] - rank[b.severity])
// group by target file
const byFile = {}
for (const f of allFindings) { (byFile[f.file] ||= []).push(f) }
const fileGroups = Object.entries(byFile)
log(`Applying ${allFindings.length} ranked findings across ${fileGroups.length} files.`)

const fixed = await parallel(fileGroups.map(([file, items]) => () =>
  agent(`You are a FIX agent for the Drex blog. Apply these reviewer findings to the file
"${file}" (under ${ROOT}). Read the file, apply each fix faithfully, and KEEP the brand law
(logo untouched/upright/one-color, 4 type roles + φ scale, color budget, flat ink offset shadows
only — no blur/gradient, no #000/#fff, sacred a11y, no mobile horizontal overflow). Don't break
Liquid/SCSS syntax or the furniture API. Use Edit/Write. Findings:\n${
    items.map((f, i) => `${i + 1}. [${f.severity}] (${f.dimension}) ${f.problem}\n   FIX: ${f.fix}`).join('\n')
  }\nReport exactly what you changed.`,
    { label: file.split('/').pop(), phase: 'Fix', agentType: 'general-purpose', effort: 'high' })))
log(`Fix pass complete: ${fixed.filter(Boolean).length}/${fileGroups.length} files updated.`)

return {
  built: built.filter(Boolean).length,
  scores: valid.map(r => ({ dimension: r.dimension, score: r.score })),
  findingsApplied: allFindings.length,
  filesFixed: fileGroups.length,
  needsReRender: true,
}
