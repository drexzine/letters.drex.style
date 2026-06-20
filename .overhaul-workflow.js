export const meta = {
  name: 'drex-blog-skeuo-overhaul',
  description: 'Material overhaul of the Drex blog to v6 desk-realism, then a vision-driven whimsymaxx iteration loop',
  phases: [
    { title: 'Overhaul', detail: 'rebuild the material + motion + collage system toward the v6 desk standard' },
    { title: 'Render', detail: 'screenshot home + post at desktop/phone/retina each round' },
    { title: 'Critique', detail: 'vision panel asks the 5 magic questions vs the v6 target + brand PDF' },
    { title: 'Fix', detail: 'apply ranked fixes per file; loop until the bar is met' },
  ],
}

const ROOT = '/home/tilde/Projects/Drex/drex-blog'
const B = '/home/tilde/.claude/skills/gstack/browse/dist/browse'
const URL_HOME = 'http://127.0.0.1:4111/'
const URL_POST = 'http://127.0.0.1:4111/2026/05/the-correspondence/'
// references
const V6 = '/home/tilde/Projects/Drex/zine-maker-proof-of-concept/mockups/compose-v6.png'
const V6B = '/home/tilde/Projects/Drex/zine-maker-proof-of-concept/mockups/compose-LOVED-v5.png'
const COMPOSE = '/home/tilde/Projects/Drex/zine-maker-proof-of-concept/mockups/compose-v6.html' // the literal V6KIT to PORT
const REFS = '/home/tilde/Projects/Drex/zine-maker-proof-of-concept/REFS.md'
const BIBLE = '/home/tilde/Projects/Drex/zine-maker-proof-of-concept/MATERIAL-BIBLE.md'
const FEEL = '/home/tilde/Projects/Drex/zine-maker-proof-of-concept/FEEL.md'
const DLANG = '/home/tilde/Projects/Drex/zine-maker-proof-of-concept/DESIGN-LANGUAGE.md'
const BRAND = '/home/tilde/Projects/Drex/drex-claude-skill/source-of-truth/branding/drex-brand.md'
const BRANDDIR = '/home/tilde/Projects/Drex/drex-claude-skill/source-of-truth/branding'
const DESIGN = '/home/tilde/Projects/Drex/backend-gstack/DESIGN.md'
const LANDING = '/home/tilde/Projects/Drex/drex-landing/index.html'
const CARD = '/home/tilde/Projects/Drex/Back-ST.png'

const NORTH = `
DREX BLOG — MATERIAL OVERHAUL toward the v6 zine-maker desk standard. This is Chielo's (CEO)
blog of long visionary/canon/lore essays. The current build reads as a pale, flat, CSS-filtered
"scrapbook-themed website." That is a FAILURE. The bar is the v6 zine-maker demo: COLORED torn-paper
scraps pinned/taped to a warm continuous desk under ONE soft tinted light — every object a craft
thing you could pick up. Fun, unconventional, whimsymaxx. NO webslop, NO webcrud, fully skeuomorphic.

THE #1 RULE — PORT, DON'T PARAPHRASE. The documented cause of every prior failure was
"approximated instead of ported." v6 is WORKING CODE at ${COMPOSE} (1361 lines): it contains the
literal V6KIT bakers (bakeDesk, bakeSceneLight, bakePiece, bakeShadow, bakeTape, bakePin, bakeChip,
bakeKraft, bakeSticker, bakeCardstock, bakeAvatar) and the component CSS (.chrome, .b-headline,
.b-answer, .b-photo, .cap, .b-quote, .b-credit, .dock, .tool, .pin, .tape) and the icon SVGs. COPY THIS
LITERAL CODE into the blog engine and adapt only what Jekyll's structure forces. Reproduce = reuse, NOT
redraw. Do not invent a new bakery when v6's bakers already exist — port them.

SUPREME AUTHORITY ORDER (when these conflict, higher wins):
  1. THE BRAND GUIDELINES PDF / its mirror ${BRAND}  ← MOST CRUCIAL DESIGN DOCUMENT.
     The constitution: logo law, the 7-color palette + 25/25/20/10/10/5/5 budget, §4.3 recommended
     color combinations per background, the 4 type roles, the golden-ratio (÷1.618) type scale,
     the values/personality/voice. NEVER violate it for the sake of the craft.
  2. The v6 DESK REALISM standard: target image ${V6} (and ${V6B}); the 33-claim realism rubric
     ${REFS}; the object census ${BIBLE}; the motion/sound vocabulary ${FEEL}; ${DLANG}.
  3. The shipped web expression: ${DESIGN} (Craft Bible) + the landing ${LANDING} (real torn/tape/
     shadow CSS) + the real brand card photo ${CARD} (the REAL tape/stars/torn look).

THE 5 MAGIC QUESTIONS — interrogate EVERYTHING you build or judge against all five, every time:
  1. WHERE'S THE MATERIAL?   Is it a believable physical object (paper tooth, torn fiber edge,
     tinted contact shadow), or a styled div?
  2. WHERE'S THE MAGIC?      Does it delight / surprise / feel alive — or is it generic?
  3. WHERE'S THE WHIMSY?     Unconventional, playful, hand-made, off-grid — or safe and templated?
  4. WHERE'S THE INTERACTIVITY?  Does it respond to the reader (hover lifts, tape peel, pin/stamp
     press, drag, page physics) — or is it inert?
  5. WHERE'S THE ANIMATION?  Does it move with paper physics (settle, lift, peel, slam, reveal) —
     or is it static? (All gated by prefers-reduced-motion; legibility stays sacred.)

THE v6 LANGUAGE (study ${V6} closely):
  - Warm CONTINUOUS desk (Oats grain + tooth), NO dark chrome band — the mast is a near-invisible
    light fade; the green "drex." logo sits flat on the desk; controls are small paper objects.
  - CONTENT IS COLORED PAPER SCRAPS, not pale boxes: a Grass torn banner (big white Pitch-italic
    headline + yellow Birdie kicker + a red PIN), a Sambas dark torn answer-note (serif body, Grass
    italic emphasis), a Colorado quote scrap (big quote mark), a polaroid photo (chin shadow, Birdie
    caption), a Lazuli washi-taped receipt slip, a kraft/School-Bus byline strip with a green stamp.
  - ONE soft TINTED light from top-left: layered contact+ambient shadows (REFS 1-8), never neutral
    black, never a hard zero-blur offset everywhere, never an outer glow.
  - TWO-ZONE torn edges (colored surface + 1-4px white fiber core), irregular, no two alike (REFS 9-14).
  - TRANSLUCENT tape (15-40% show-through, multiply, overlap-darken, hand-torn ends) (REFS 15-19).
  - PATCHY baked ink stamps, bleed gain, xerox specks (REFS 20-24); NEVER-SQUARE (0.5-4 deg, seeded),
    NO clones, density: every 100x100 crop holds >=3 physical cues (REFS 29-33).
  - Material surfaces are BAKED RASTER sprites (canvas at boot -> data-URI -> CSS vars), CSS light
    layered on; live feTurbulence is accent-only. THIS is how realism is achieved (REFS 33).

BRAND LAW (from the PDF — non-negotiable):
  - Logo: use the official SVGs in ${BRANDDIR} (drex-logo-og-b.svg icon, drex-logotype-b.svg wordmark);
    recolor the black fill to an approved hex only. Icon stacked over/left of wordmark. On the Oats
    desk use Grass icon + Grass wordmark (or Colorado icon + School Bus wordmark). UPRIGHT, ONE solid
    color, NO rotate/outline/shadow/effect/warp/recolor-outside-approved/recombine; 1 x-unit exclusion.
  - 7 colors EXACT: Grass #1CAB5B, Oats #FEF6E4, Sambas #414D57, Colorado #F75458, Lazuli #2496C9,
    School Bus #ECAF21, Happy #F1DD01. Budget 25/25/20/10/10/5/5 (Grass+Oats dominate; School Bus/Happy
    5% accents, dark-ink text only). Use §4.3 combos. NO pure #000 / #fff (ink=Sambas, light=Oats).
  - 4 type roles, golden-ratio scale (48/32/24/16, clamp for fluid): Display = Courier Prime ITALIC
    (Pitch); Headings/labels = DM Mono (Pitch Sans); Body = Bitter (long-form legible); Accent/eyebrow/
    caption = Patrick Hand (Birdie), sizeable. Voice: Inviting, Convicted, Specific, Alive; "the room
    was already expecting you"; communion; warm.

SACRED (never sacrificed): long-form READING legibility (Bitter prose stays clean & upright, AA
contrast, comfortable measure), nav legibility, :focus-visible Lazuli rings, >=44px taps,
prefers-reduced-motion kills motion, NO horizontal overflow at 360-414px, the logo law.

UNCONVENTIONAL + WHIMSYMAXX: reject safe, centered, templated, tidy-grid blog layouts. The home is a
BULLETIN BOARD / DESK of pinned & taped colored clippings, off-grid, overlapping, alive. A post is a
COLLAGE masthead over a real paper reading sheet with colored-scrap furniture interspersed. Break the
grid on purpose (still legible, still on brand).

CSS class/token contract (keep names stable across files): tokens in _sass/_tokens.scss (--grass,
--oats,--sambas,--colorado,--lazuli,--schoolbus,--happy,--ink,--paper; --f-slab/-mono/-body/-hand;
--t-hero/-sub/-lede; soft tinted shadow tokens --sh-contact/--sh-ambient/--sh-lift). Material engine in
_sass/_realism.scss + assets/js/bakery.js (baked sprites -> CSS vars like --bk-grain,--bk-tooth,
--bk-fiber-*,--bk-stamp-*,--bk-tape-*). Interactions/animation in assets/js/blog.js. Furniture =
colored scraps: .scrap (+ --grass/--coral/--lazuli/--ink/--kraft variants), .pin, .tape, .stamp,
.polaroid, .pullquote, .callout, .definition, .patterns, .cutline, .eyebrow(Patrick Hand kicker),
.prose (the sacred reading column). Page ground & chrome in _sass/_grounds.scss; furniture styles in
_sass/_post.scss; responsive in _sass/_mobile.scss; main.scss @imports tokens,realism,grounds,whimsy,
post,mobile.

RENDER/SERVE: site is served at ${URL_HOME} by a static server over ${ROOT}/_site. To see changes,
run \`cd ${ROOT} && bundle exec jekyll build\` (regenerates _site in place). Build must stay clean.
`

// ───────────────────────── PHASE 1: OVERHAUL ─────────────────────────
phase('Overhaul')
const overhaul = [
  {
    label: 'engine',
    files: '_sass/_tokens.scss, _sass/_realism.scss, _sass/_whimsy.scss, assets/css/main.scss, assets/js/bakery.js, assets/js/blog.js',
    job: `You build the MATERIAL + MOTION ENGINE. FIRST read the literal v6 code ${COMPOSE} and PORT its
bakers + scene-light wholesale. Also read ${REFS}, ${BIBLE}, ${FEEL}, the v6 target ${V6}, the landing
${LANDING}, and current source under ${ROOT}.
DELIVER:
- assets/js/bakery.js: PORT v6's literal canvas bakers from ${COMPOSE} — bakeDesk, bakeSceneLight,
  bakePiece (the torn colored-paper scrap with two-zone fiber edge), bakeShadow (soft tinted contact+
  ambient), bakeTape (translucent fiber tape with torn ends), bakePin, bakeChip, bakeKraft,
  bakeSticker, bakeCardstock, bakeAvatar. Run them at boot, inject results as :root CSS vars (data-URI)
  like --bk-desk, --bk-grain, --bk-tooth, --bk-piece-grass/-sambas/-coral/-kraft, --bk-fiber-*,
  --bk-tape-*, --bk-pin, --bk-stamp-*. Keep v6's seeded PRNG so it's deterministic. Adapt only what the
  blog's structure forces (sizes/colors per the brand budget). Do NOT redraw from scratch. Fast (<150ms).
- _sass/_tokens.scss: the 7 exact brand colors, the 4 font vars, the golden-ratio --t-* scale (clamp
  for mobile-first), AND soft TINTED layered shadow tokens (--sh-contact 1-3px/1-2px-blur/25-40%%,
  --sh-ambient 2-3 stacked <=10%% layers, --sh-lift for raised objects) — shadows take the surface hue,
  never neutral black, never a hard zero-blur offset, never an outer glow. NO #000/#fff.
- _sass/_realism.scss: the material primitives drawn with the baked sprites + CSS light — two-zone
  torn edges, paper tooth surfaces, translucent multiply tape with overlap-darken + hand-torn ends,
  occlusion/crease darkening in seams, never-square seeded tilts, density. The @keyframes motion
  library (settle, lift, peel, slam, reveal, pin-press, stamp-thunk) per ${FEEL} numbers.
- assets/js/blog.js: INTERACTIVITY + ANIMATION — IntersectionObserver scroll-reveal with paper
  physics (slam/settle), hover lifts (shadow grows), tape PEEL on hover, pin/stamp press on :active,
  optional light drag-tilt on scraps; a hard prefers-reduced-motion gate that stills everything.
  Vanilla JS, no deps. Wire the bakery to run first.
- _sass/_whimsy.scss + assets/css/main.scss: keep .hl/.ul/.btn/.eyebrow utilities (rebuilt to the new
  shadow language); main.scss must @import tokens,realism,grounds,whimsy,post,mobile (with front-matter).
Answer all 5 MAGIC QUESTIONS in what you build. Write files with Write/Edit. Report what you made.`,
  },
  {
    label: 'collage-furniture',
    files: '_includes/{eyebrow,pullquote,callout,definition,patterns,figure,cite,cutline,stamp,scrap,pin}.html, _sass/_post.scss',
    job: `You rebuild the FURNITURE as COLORED PAPER SCRAPS matching v6 (${V6}) — and the post reading
stage. FIRST read the literal v6 code ${COMPOSE} and PORT its component CSS: .b-headline (the Grass
torn banner + kicker + pin), .b-answer (the Sambas dark torn note), .b-photo + .cap (polaroid +
caption), .b-quote (the Colorado quote scrap), .b-credit (kraft byline). Reuse those literal rules,
re-skinned to the blog's furniture. Also read ${BIBLE}, ${BRAND} (§4.3 color combos), current _includes
+ _sass/_post.scss, the ported essay _posts/2026-05-12-the-correspondence.md.
DELIVER (use the engine's classes/sprites — .scrap variants, .pin, .tape, .stamp, soft shadow tokens):
- Each furniture include becomes a believable colored craft object, NOT a pale box:
  pullquote = a Colorado torn quote-scrap with a big quote mark + Pitch-italic text (like v6's coral);
  callout kind="for-drex" = a kraft/School-Bus taped slip or a Sambas dark torn note (v6 answer-note),
  Patrick-Hand label; definition = an index-card / ruled note; patterns = numbered torn scraps pinned
  in a row (never-square); cite = a clipping with the source as a stamped credit; eyebrow = a Patrick-
  Hand kicker in color; figure = a real polaroid (white frame, chin shadow, tape/pin, Birdie caption);
  stamp = a patchy rubber stamp; cutline = a torn/scissor seam; pin/scrap = primitives.
- _sass/_post.scss: .post-stage = a warm desk; the long-form .prose = a REAL cream paper SHEET (tooth +
  torn deckle + soft tinted shadow) — but the running Bitter text stays clean, upright, comfortable
  measure, AA contrast (SACRED). Headings inside prose get marker/Pitch treatment; scraps interleave
  the prose like clippings (some pulled into the margin, off-grid, tilted) without breaking reading.
Answer the 5 MAGIC QUESTIONS. Write files. Report.`,
  },
  {
    label: 'desk-and-home',
    files: '_sass/_grounds.scss, _layouts/{default,home,post,page}.html, _includes/{masthead,footer,head}.html, index.html',
    job: `You build the DESK GROUND + UNCONVENTIONAL HOME + light chrome. Read ${V6}, ${BRAND} (logo law,
official SVGs in ${BRANDDIR}), the landing ${LANDING}, current layouts/includes.
DELIVER:
- _sass/_grounds.scss: a warm CONTINUOUS desk — Oats grain + paper tooth (baked sprites), faint vignette
  at edges so scraps read as ON the desk. NO dark full-width chrome band. The mast is a near-invisible
  light Oats fade.
- _includes/masthead.html: the official Drex logo (icon over/left of wordmark) recolored Grass, UPRIGHT,
  one color, NO filter/shadow/tilt, 1 x-unit exclusion — sitting FLAT on the desk; nav as small paper
  objects (tab/stamp), legible; accessible mobile menu.
- _layouts/home.html: an UNCONVENTIONAL BULLETIN-BOARD / DESK — post clippings as COLORED scraps
  (alternating Grass banner / Sambas note / Colorado quote / kraft byline / polaroid), PINNED & TAPED,
  off-grid, overlapping slightly, tilted (seeded, never-square), scattered like v6 — NOT a tidy card
  grid. Each clipping: eyebrow kicker, Pitch-italic title, dek, date, tag, a pin or tape, hover-lift.
  It must feel alive and hand-arranged. Keep it navigable + legible + keyboard-accessible.
- _layouts/post.html: a COLLAGE MASTHEAD (eyebrow kicker on a scrap, big Pitch-italic title on a Grass
  torn banner with a pin, dek, DM-Mono date stamp) over the reading sheet; subscribe CTA as a stamped
  key; prev/next as paper tabs.
- footer.html: a torn Grass band / colophon sheet, official logo recolored for Sambas/Grass per §4.3.
- default.html keeps body data-motion + the filters include + scripts (bakery before blog.js).
Answer the 5 MAGIC QUESTIONS. Uphold the brand PDF. Write files. Report.`,
  },
  {
    label: 'mobile-realism',
    files: '_sass/_mobile.scss',
    job: `You own _sass/_mobile.scss — responsive realism. Mobile is first-class; the essays are LONG.
Read ${V6} (it's a PHONE mockup — the desk realism MUST survive on mobile), the other overhaul files
near the end. DELIVER: at 360-414px the desk reads as v6 (colored scraps, real shadows, pins/tape,
density preserved — do NOT flatten the craft into plain boxes), BUT: no horizontal overflow (clip
decorative overhangs), tap targets >=44px, fluid clamp type, the long .prose sheet comfortable & legible
full-width, compact light mast + accessible menu, heavy baked effects/animation throttled for perf,
prefers-reduced-motion fully honored. Verify mentally at 360/390/414/768/1280.
Answer the 5 MAGIC QUESTIONS. Write the file. Report breakpoints + guards.`,
  },
]
const overhauled = await parallel(overhaul.map(o => () =>
  agent(`${NORTH}\nYOUR FILES (write ONLY these): ${o.files}\n\nYOUR JOB:\n${o.job}`,
    { label: o.label, phase: 'Overhaul', agentType: 'general-purpose', effort: 'high' })))
log(`Overhaul: ${overhauled.filter(Boolean).length}/${overhaul.length} systems built.`)

// ───────────── helper schemas ─────────────
const LENS_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['dimension', 'score', 'magic_questions', 'summary', 'findings'],
  properties: {
    dimension: { type: 'string' },
    score: { type: 'integer', minimum: 0, maximum: 10 },
    magic_questions: {
      type: 'object', additionalProperties: false,
      required: ['material', 'magic', 'whimsy', 'interactivity', 'animation'],
      properties: {
        material: { type: 'string' }, magic: { type: 'string' }, whimsy: { type: 'string' },
        interactivity: { type: 'string' }, animation: { type: 'string' },
      },
    },
    summary: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['severity', 'file', 'problem', 'fix'],
        properties: {
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          file: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' },
        },
      },
    },
  },
}
const SYNTH_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['shipReady', 'verdict', 'scores', 'fixes'],
  properties: {
    shipReady: { type: 'boolean', description: 'true only if every lens >=8 and zero critical webslop' },
    verdict: { type: 'string' },
    scores: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['dimension', 'score'], properties: { dimension: { type: 'string' }, score: { type: 'integer' } } } },
    fixes: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['rank', 'file', 'instruction'],
        properties: { rank: { type: 'integer' }, file: { type: 'string' }, instruction: { type: 'string' } },
      },
    },
  },
}

const lenses = [
  { key: 'material-realism', read: [REFS, BIBLE, V6, CARD], focus: `The 33-claim realism rubric: one tinted light, layered contact+ambient shadows (no neutral black/no hard zero-blur-offset/no glow), two-zone torn fiber edges, translucent multiply tape with overlap-darken & torn ends, patchy baked ink, never-square, density (every 100x100 crop >=3 cues), baked-raster surfaces. Compare the screenshots directly to ${V6}. Is it real paper objects or flat CSS boxes?` },
  { key: 'collage-whimsy', read: [V6, V6B, BRAND, CARD], focus: `Is the home an UNCONVENTIONAL pinned/taped colored-scrap bulletin board (like v6) or a tidy webby card grid? Are content blocks COLORED brand-paper scraps (Grass/Sambas/Colorado/kraft) per §4.3 combos, or pale boxes? Whimsy, surprise, hand-made off-grid energy, density. Score how close to the v6 collage feel.` },
  { key: 'interactivity-animation', read: [FEEL, `${ROOT}/assets/js/blog.js`, `${ROOT}/assets/js/bakery.js`], focus: `READ blog.js + bakery.js + CSS @keyframes/:hover/:active. WHERE'S THE INTERACTIVITY (hover lift, tape peel, pin/stamp press, drag, reveal) and ANIMATION (paper physics: settle/lift/peel/slam/reveal per FEEL numbers)? Is it inert or alive? Is prefers-reduced-motion fully honored? Is the bakery actually producing baked sprites?` },
  { key: 'brand-constitution', read: [BRAND, DESIGN], focus: `THE BRAND PDF IS SUPREME. Logo law (official SVG, one approved color, upright, no effect, exclusion zone, §4.3 color-on-bg combo). 7 colors exact + 25/25/20/10/10/5/5 budget (School Bus/Happy <=5%, dark-ink text only; no rogue saturated dominance; no #000/#fff). 4 type roles + golden-ratio scale. Flag EVERY violation with file:line.` },
  { key: 'typography-voice', read: [BRAND, LANDING], focus: `Display = Courier Prime ITALIC as the hero moments (big, tilted, on banners); DM Mono labels; Bitter body; Patrick Hand kickers sizeable. Golden-ratio scale held. Hierarchy reads. Copy carries Drex voice (Inviting/Convicted/Specific/Alive; communion; "the room was already expecting you"). Type-collage at hero moments, calm in the reading body.` },
  { key: 'reading-mobile', read: [V6], focus: `SACRED: the long essay must stay genuinely pleasant to read — Bitter prose clean/upright, AA contrast, comfortable measure, scraps never bury the text. MOBILE (compare to v6 phone): at 360/390/414 the desk realism survives (not flattened to boxes) AND there is no horizontal overflow, taps >=44px, fluid type, accessible menu. Judge both reading joy and mobile fidelity.` },
]

let shipReady = false
let lastScores = null
const MAX_ROUNDS = 3
for (let r = 1; r <= MAX_ROUNDS && !shipReady; r++) {
  // ---- RENDER (single agent owns browse; serial) ----
  phase('Render')
  const dir = `/tmp/drex-iter/r${r}`
  await agent(`You are the RENDER agent for round ${r}. Run EXACTLY this, then report the saved paths.
Use the Bash tool:
  mkdir -p ${dir}
  cd ${ROOT} && bundle exec jekyll build 2>&1 | tail -3
  ${B} viewport 1280x900 ; ${B} goto ${URL_HOME} ; ${B} wait --load ; sleep 1 ; ${B} screenshot ${dir}/home-desktop.png
  ${B} goto ${URL_POST} ; ${B} wait --load ; sleep 1 ; ${B} screenshot ${dir}/post-desktop.png
  ${B} viewport 390x844 ; ${B} goto ${URL_HOME} ; ${B} wait --load ; sleep 1 ; ${B} screenshot ${dir}/home-phone.png
  ${B} goto ${URL_POST} ; ${B} wait --load ; sleep 1 ; ${B} screenshot ${dir}/post-phone.png
  ${B} viewport 600x520 --scale 2 ; ${B} goto ${URL_POST} ; ${B} wait --load ; sleep 1 ; ${B} screenshot ${dir}/post-retina-crop.png
Confirm each file exists (ls -la ${dir}). Report any build error verbatim. Output the 5 file paths.`,
    { label: `render-r${r}`, phase: 'Render', agentType: 'general-purpose', effort: 'low' })

  // ---- CRITIQUE (vision panel; read screenshots + refs) ----
  phase('Critique')
  const reviews = await parallel(lenses.map(L => () =>
    agent(`${NORTH}

You are the **${L.key}** vision-critic, round ${r}. READ these screenshots of the CURRENT blog (use
the Read tool — actually LOOK):
  ${dir}/home-desktop.png, ${dir}/post-desktop.png, ${dir}/home-phone.png, ${dir}/post-phone.png,
  ${dir}/post-retina-crop.png
Also read references: ${L.read.join(', ')}.

Judge ADVERSARIALLY: ASSUME it still reads webby/flat and hunt every "website-tell" (uniform pill
radii, flat fills, hard zero-blur or neutral-black shadows, outer glows, metronome-regular spacing,
clone siblings, system glyphs, perfectly straight long edges, pale boxes instead of colored scraps).
You MAY NOT award 9-10 unless it is genuinely indistinguishable from a real paper-craft desk like ${V6}
AND fully obeys the brand PDF. Your focus: ${L.focus}

You MUST explicitly answer all 5 MAGIC QUESTIONS for what you see (material/magic/whimsy/interactivity/
animation). Score 0-10 (9-10 = indistinguishable-from-real craft + fully on brand; 7-8 = clearly
material but with tells; <=6 = still reads webby/flat). List the website-tells you found in the summary.
Give concrete, file-targeted fixes (name the .scss/.html/.js file and the exact change).`,
      { label: `${L.key}-r${r}`, phase: 'Critique', agentType: 'general-purpose', effort: 'high', schema: LENS_SCHEMA })))
  const valid = reviews.filter(Boolean)
  log(`Round ${r} scores:\n${valid.map(v => `  ${v.dimension}: ${v.score}/10 — ${v.summary}`).join('\n')}`)

  // ---- SYNTH ----
  const synth = await agent(`${NORTH}

You are the SYNTHESIS lead, round ${r}. Here are the ${valid.length} vision-critic reports (JSON):
${JSON.stringify(valid)}

Dedupe and RANK their findings into one ordered fix list (highest visual/brand impact first), grouped
so each entry targets ONE file. Decide shipReady = true ONLY if every lens scored >=8 AND there are no
remaining critical webslop/brand-law issues. Be honest — this is round ${r} of ${MAX_ROUNDS}; if it
still reads webby or flat, it is NOT ready. Return scores, a one-paragraph verdict, and the fixes.`,
    { label: `synth-r${r}`, phase: 'Critique', agentType: 'general-purpose', effort: 'high', schema: SYNTH_SCHEMA })
  lastScores = synth.scores
  shipReady = synth.shipReady
  log(`Round ${r} verdict (shipReady=${shipReady}): ${synth.verdict}`)
  if (shipReady) break

  // ---- FIX (per file, parallel, no collisions) ----
  phase('Fix')
  const byFile = {}
  for (const f of synth.fixes) { (byFile[f.file] ||= []).push(f) }
  const groups = Object.entries(byFile)
  log(`Round ${r}: applying ${synth.fixes.length} fixes across ${groups.length} files.`)
  await parallel(groups.map(([file, items]) => () =>
    agent(`${NORTH}

You are a FIX agent, round ${r}, for the file "${file}" under ${ROOT}. Read it, apply each fix
faithfully toward the v6 desk standard, and UPHOLD the brand PDF (logo law, color budget, type roles,
golden ratio) and the SACRED list (reading legibility, no mobile overflow, reduced-motion). Keep the
jekyll build clean and the SCSS/Liquid/JS valid. Answer the 5 MAGIC QUESTIONS in your change. Fixes
(ranked):\n${items.sort((a, b) => a.rank - b.rank).map(f => `- ${f.instruction}`).join('\n')}
Use Edit/Write. Report exactly what you changed.`,
      { label: file.split('/').pop(), phase: 'Fix', agentType: 'general-purpose', effort: 'high' })))
}

return { shipReady, rounds: MAX_ROUNDS, finalScores: lastScores, note: 'main loop will re-render + eyeball' }
