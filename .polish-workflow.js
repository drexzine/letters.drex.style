export const meta = {
  name: 'drex-blog-polish-loop',
  description: 'Focused vision-polish loop on the (now-rendering) Drex blog: color budget + whimsy + animation, no rebuild',
  phases: [
    { title: 'Render', detail: 'screenshot + opacity regression guard each round' },
    { title: 'Critique', detail: 'vision panel: 5 magic questions vs v6 + brand PDF' },
    { title: 'Fix', detail: 'apply ranked fixes per file; loop to the bar' },
  ],
}

const ROOT = '/home/tilde/Projects/Drex/drex-blog'
const B = '/home/tilde/.claude/skills/gstack/browse/dist/browse'
const URL_HOME = 'http://127.0.0.1:4111/'
const URL_POST = 'http://127.0.0.1:4111/2026/05/the-correspondence/'
const V6 = '/home/tilde/Projects/Drex/zine-maker-proof-of-concept/mockups/compose-v6.png'
const COMPOSE = '/home/tilde/Projects/Drex/zine-maker-proof-of-concept/mockups/compose-v6.html'
const REFS = '/home/tilde/Projects/Drex/zine-maker-proof-of-concept/REFS.md'
const BIBLE = '/home/tilde/Projects/Drex/zine-maker-proof-of-concept/MATERIAL-BIBLE.md'
const FEEL = '/home/tilde/Projects/Drex/zine-maker-proof-of-concept/FEEL.md'
const BRAND = '/home/tilde/Projects/Drex/drex-claude-skill/source-of-truth/branding/drex-brand.md'
const DESIGN = '/home/tilde/Projects/Drex/backend-gstack/DESIGN.md'
const LANDING = '/home/tilde/Projects/Drex/drex-landing/index.html'
const CARD = '/home/tilde/Projects/Drex/Back-ST.png'

const NORTH = `
DREX BLOG — FOCUSED POLISH LOOP. The blog already renders as a colored-scrap desk collage (the
material overhaul + a reveal-bug fix shipped). This loop PUSHES it from "good" to "indistinguishable
from real paper craft, fully on brand." Chielo's (CEO) blog of long visionary/canon/lore essays.
Bar = the v6 zine-maker desk: target image ${V6}, literal code ${COMPOSE}. Fun, unconventional,
whimsymaxx. NO webslop. Fully skeuomorphic. Long-form READING legibility stays SACRED.

SUPREME AUTHORITY = THE BRAND GUIDELINES PDF / mirror ${BRAND} (logo law, the 7-color palette +
25/25/20/10/10/5/5 budget, §4.3 combos, 4 type roles, golden-ratio scale). When craft and brand
conflict, brand wins. Then: v6 realism (${REFS} 33-claim rubric, ${BIBLE}, motion ${FEEL}); the
shipped landing ${LANDING}; the real card photo ${CARD}.

THE 5 MAGIC QUESTIONS — interrogate everything: WHERE'S THE MATERIAL / MAGIC / WHIMSY /
INTERACTIVITY / ANIMATION? Score against all five, every time.

THE #1 KNOWN ISSUE TO FIX THIS LOOP — COLOR BUDGET / CREAM BREATHING ROOM.
The home currently over-saturates: many full-bleed saturated colored clippings, too little Oats desk
showing. v6 BREATHES — look at ${V6}: a warm CREAM desk DOMINATES, with a FEW colored scraps on it
(one Grass banner, one Sambas note, one Colorado quote, one Lazuli slip, one kraft byline). Per the
brand PDF budget Oats(25)+Sambas(20)+Grass(25) are the grounds; Colorado/Lazuli are 10% supporting;
School Bus/Happy are 5% accents only. SO: increase the Oats desk showing between/around clippings,
reduce the count/size/saturation density of full-color scraps, let cream + ink dominate, keep colored
scraps as deliberate accents (not a quilt of saturated blocks). Same on the post page. This raises BOTH
brand-constitution AND the v6 resemblance.

ALSO push: deeper material realism (soft TINTED one-light layered shadows, two-zone torn fiber edges,
translucent multiply tape, patchy ink — REFS 1-33; PORT literal bakers/CSS from ${COMPOSE} where weak),
richer collage whimsy (unconventional, off-grid, alive, hand-arranged), and verify INTERACTIVITY +
ANIMATION actually fire (hover lift, tape peel, pin/stamp press, scroll-reveal paper physics; reduced-
motion honored). Logo law absolute (official SVG, one color, upright, no effect, §4.3 combo per bg).

🚨 REGRESSION GUARD — DO NOT REINTRODUCE THE OPACITY BUG (just fixed in _sass/_realism.scss):
- Scraps/clippings (.clip/.scrap/.slam/.reveal) MUST compute opacity:1 at rest once html.baked.
- Do NOT animate opacity inside @keyframes drex-slam (it does translate/scale only now).
- The reveal rules (.slam.in/.reveal.in) MUST keep the html.js-anim prefix so they out-specify the
  html.js-anim hide rule. Never make the hide rule more specific than the reveal rule.
- If you touch _realism.scss entrance/opacity logic, you must preserve computed opacity:1. The render
  agent verifies this every round and a regression is a CRITICAL fail.

CLASS/TOKEN CONTRACT is stable (do not rename): tokens _sass/_tokens.scss; engine _sass/_realism.scss
+ assets/js/bakery.js + assets/js/blog.js; furniture _includes/*.html + _sass/_post.scss; ground/chrome
_sass/_grounds.scss + _layouts/* + _includes/{masthead,footer}.html; responsive _sass/_mobile.scss.
RENDER/SERVE: served at ${URL_HOME} over ${ROOT}/_site; rebuild with \`cd ${ROOT} && bundle exec jekyll
build\`. Build must stay clean.
`

const LENS_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['dimension', 'score', 'magic_questions', 'summary', 'findings'],
  properties: {
    dimension: { type: 'string' }, score: { type: 'integer', minimum: 0, maximum: 10 },
    magic_questions: { type: 'object', additionalProperties: false, required: ['material', 'magic', 'whimsy', 'interactivity', 'animation'], properties: { material: { type: 'string' }, magic: { type: 'string' }, whimsy: { type: 'string' }, interactivity: { type: 'string' }, animation: { type: 'string' } } },
    summary: { type: 'string' },
    findings: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['severity', 'file', 'problem', 'fix'], properties: { severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }, file: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } } } },
  },
}
const SYNTH_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['shipReady', 'verdict', 'scores', 'fixes'],
  properties: {
    shipReady: { type: 'boolean' }, verdict: { type: 'string' },
    scores: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['dimension', 'score'], properties: { dimension: { type: 'string' }, score: { type: 'integer' } } } },
    fixes: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['rank', 'file', 'instruction'], properties: { rank: { type: 'integer' }, file: { type: 'string' }, instruction: { type: 'string' } } } },
  },
}

const lenses = [
  { key: 'brand-color-budget', read: [BRAND, V6], focus: `THE PRIORITY. Color budget 25/25/20/10/10/5/5 — is the cream Oats desk DOMINANT with colored scraps as accents (v6), or is it an over-saturated quilt? Logo law (official SVG, one color, upright, no effect, §4.3 combo). 7 exact hexes, no #000/#fff, School Bus/Happy <=5% dark-ink only. Flag every over-saturation + budget breach with file:line and the cream-restoring fix.` },
  { key: 'material-realism', read: [REFS, BIBLE, V6, CARD], focus: `33-claim rubric: one tinted light, layered contact+ambient shadows (no neutral black/no hard zero-blur/no glow), two-zone torn fiber edges, translucent multiply tape w/ overlap-darken + torn ends, patchy baked ink, never-square, density. Compare directly to ${V6}. Real paper or styled divs?` },
  { key: 'collage-whimsy', read: [V6, COMPOSE], focus: `Is the home an unconventional, alive, hand-arranged pinned/taped collage with cream breathing room like v6 — or a webby grid OR an over-packed quilt? Whimsy, surprise, magic. Off-grid but legible.` },
  { key: 'interactivity-animation', read: [FEEL, `${ROOT}/assets/js/blog.js`], focus: `READ blog.js + CSS @keyframes/:hover/:active. WHERE'S THE INTERACTIVITY (hover lift, tape peel, pin/stamp press) and ANIMATION (paper physics reveal/settle/slam per FEEL)? Is it alive? reduced-motion honored? Confirm scraps are NOT stranded invisible (regression).` },
  { key: 'typography-voice', read: [BRAND, LANDING], focus: `Display=Courier Prime ITALIC hero moments; DM Mono labels; Bitter body; Patrick Hand kickers sizeable. Golden-ratio scale. Drex voice (Inviting/Convicted/Specific/Alive; communion; "the room was already expecting you"). Hierarchy reads.` },
  { key: 'reading-mobile', read: [V6], focus: `SACRED: long essay genuinely pleasant — Bitter prose clean/upright, AA contrast, comfortable measure, scraps never bury text. MOBILE at 360/390/414: v6 realism survives, NO horizontal overflow, taps >=44px, accessible menu.` },
]

let shipReady = false, lastScores = null
const MAX_ROUNDS = 2
for (let r = 1; r <= MAX_ROUNDS && !shipReady; r++) {
  phase('Render')
  const dir = `/tmp/drex-polish/r${r}`
  await agent(`RENDER agent, round ${r}. Run via Bash EXACTLY, then report paths + the OPACITY GUARD result.
  mkdir -p ${dir}
  cd ${ROOT} && bundle exec jekyll build 2>&1 | tail -3
  ${B} viewport 1280x900 ; ${B} goto ${URL_HOME} ; ${B} wait --load ; sleep 2 ; ${B} screenshot ${dir}/home-desktop.png
  ${B} goto ${URL_POST} ; ${B} wait --load ; sleep 2 ; ${B} screenshot ${dir}/post-desktop.png
  ${B} viewport 390x844 ; ${B} goto ${URL_HOME} ; ${B} wait --load ; sleep 2 ; ${B} screenshot ${dir}/home-phone.png
  ${B} goto ${URL_POST} ; ${B} wait --load ; sleep 2 ; ${B} screenshot ${dir}/post-phone.png
  ${B} viewport 600x520 --scale 2 ; ${B} goto ${URL_POST} ; ${B} wait --load ; sleep 2 ; ${B} screenshot ${dir}/post-retina.png
OPACITY GUARD — also run on the home (1280) and report the JSON verbatim:
  ${B} viewport 1280x900 ; ${B} goto ${URL_HOME} ; ${B} wait --load ; sleep 2
  ${B} js "JSON.stringify([...document.querySelectorAll('.clip,.scrap')].slice(0,10).map(c=>getComputedStyle(c).opacity))"
If ANY value is not "1", report "OPACITY_REGRESSION" loudly. Confirm each png exists (ls -la ${dir}).`,
    { label: `render-r${r}`, phase: 'Render', agentType: 'general-purpose', effort: 'low' })

  phase('Critique')
  const reviews = await parallel(lenses.map(L => () =>
    agent(`${NORTH}

You are the **${L.key}** vision-critic, round ${r}. READ (actually LOOK at) these CURRENT screenshots:
  ${dir}/home-desktop.png, ${dir}/post-desktop.png, ${dir}/home-phone.png, ${dir}/post-phone.png, ${dir}/post-retina.png
Also read: ${L.read.join(', ')}.
Judge ADVERSARIALLY vs v6 (${V6}) + the brand PDF; assume tells remain and hunt them. You MAY NOT award
9-10 unless indistinguishable from real paper craft AND fully on brand. Focus: ${L.focus}
Answer all 5 MAGIC QUESTIONS explicitly. Score 0-10. Give concrete file-targeted fixes.`,
      { label: `${L.key}-r${r}`, phase: 'Critique', agentType: 'general-purpose', effort: 'high', schema: LENS_SCHEMA })))
  const valid = reviews.filter(Boolean)
  log(`Round ${r} scores:\n${valid.map(v => `  ${v.dimension}: ${v.score}/10 — ${v.summary}`).join('\n')}`)

  const synth = await agent(`${NORTH}

SYNTHESIS lead, round ${r}. ${valid.length} critic reports (JSON):
${JSON.stringify(valid)}
Dedupe + RANK into one ordered fix list, each entry targeting ONE file. PRIORITIZE the color-budget /
cream-breathing-room fix (the #1 known issue) and any regression. shipReady=true ONLY if every lens >=8
AND no critical (incl. no opacity regression, no budget breach, no brand-law violation). Honest verdict.`,
    { label: `synth-r${r}`, phase: 'Critique', agentType: 'general-purpose', effort: 'high', schema: SYNTH_SCHEMA })
  lastScores = synth.scores; shipReady = synth.shipReady
  log(`Round ${r} verdict (shipReady=${shipReady}): ${synth.verdict}`)
  if (shipReady) break

  phase('Fix')
  const byFile = {}
  for (const f of synth.fixes) { (byFile[f.file] ||= []).push(f) }
  const groups = Object.entries(byFile)
  log(`Round ${r}: applying ${synth.fixes.length} fixes across ${groups.length} files.`)
  await parallel(groups.map(([file, items]) => () =>
    agent(`${NORTH}

FIX agent, round ${r}, file "${file}" under ${ROOT}. Read it, apply each fix toward the v6 desk + the
brand PDF + the cream-breathing-room goal. RESPECT THE REGRESSION GUARD (never strand scraps invisible;
keep computed opacity:1; keep .slam.in/.reveal.in out-specifying the hide; no opacity in keyframes).
Keep the jekyll build clean and SCSS/Liquid/JS valid. Fixes (ranked):
${items.sort((a, b) => a.rank - b.rank).map(f => `- ${f.instruction}`).join('\n')}
Use Edit/Write. Report what you changed.`,
      { label: file.split('/').pop(), phase: 'Fix', agentType: 'general-purpose', effort: 'high' })))
}

return { shipReady, rounds: MAX_ROUNDS, finalScores: lastScores, note: 'main loop re-renders + eyeballs + guards opacity' }
