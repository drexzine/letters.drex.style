export const meta = {
  name: 'drex-blog-visual-qa',
  description: 'Render the blog across pages/viewports and hunt visual bugs, glitches, and ugliness with a vision panel',
  phases: [
    { title: 'Render', detail: 'screenshot every page at desktop + phone + retina crops' },
    { title: 'Hunt', detail: 'parallel vision lenses hunt bugs/glitches/ugliness' },
    { title: 'Triage', detail: 'dedupe + rank into one bug list with file-targeted fixes' },
  ],
}

const ROOT = '/home/tilde/Projects/Drex/drex-blog'
const B = '/home/tilde/.claude/skills/gstack/browse/dist/browse'
const BRAND = '/home/tilde/Projects/Drex/drex-claude-skill/source-of-truth/branding/drex-brand.md'
const V6 = '/home/tilde/Projects/Drex/zine-maker-proof-of-concept/mockups/compose-v6.png'
const QA = '/tmp/drex-qa'
const pages = [
  { slug: 'home',    url: 'http://127.0.0.1:4111/' },
  { slug: 'corr',    url: 'http://127.0.0.1:4111/2026/05/the-correspondence/' },
  { slug: 'room',    url: 'http://127.0.0.1:4111/2026/06/the-room-is-the-product/' },
  { slug: 'stitch',  url: 'http://127.0.0.1:4111/2026/06/where-the-stitches-show/' },
  { slug: 'about',   url: 'http://127.0.0.1:4111/about/' },
]

// ---- RENDER (single agent owns the browse daemon; serial) ----
phase('Render')
let cmds = `mkdir -p ${QA}\ncd ${ROOT} && bundle exec jekyll build 2>&1 | tail -2\n`
for (const p of pages) {
  cmds += `${B} viewport 1366x1000 ; ${B} goto ${p.url} ; ${B} wait --load ; sleep 2 ; ${B} screenshot ${QA}/${p.slug}-desktop.png\n`
  cmds += `${B} js "window.scrollTo(0, Math.round(document.body.scrollHeight*0.45))" ; sleep 1 ; ${B} screenshot --viewport ${QA}/${p.slug}-mid.png\n`
  cmds += `${B} viewport 390x844 ; ${B} goto ${p.url} ; ${B} wait --load ; sleep 2 ; ${B} screenshot ${QA}/${p.slug}-phone.png\n`
}
await agent(`You are the RENDER agent. Run EXACTLY this via the Bash tool, in order, then \`ls -la ${QA}\`
and report which PNGs exist + any build error verbatim:\n${cmds}\nAlso report any console errors:
${B} goto http://127.0.0.1:4111/ ; ${B} console --errors`,
  { label: 'render', phase: 'Render', agentType: 'general-purpose', effort: 'low' })

// ---- HUNT (parallel vision lenses) ----
phase('Hunt')
const BUG_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['lens', 'overall', 'bugs'],
  properties: {
    lens: { type: 'string' },
    overall: { type: 'string', description: 'one-line read of how clean it looks' },
    bugs: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['severity', 'page', 'where', 'problem', 'fix', 'file'],
        properties: {
          severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'nit'] },
          page: { type: 'string', description: 'home/corr/room/stitch/about + desktop|phone|mid' },
          where: { type: 'string', description: 'which element/region' },
          problem: { type: 'string' },
          fix: { type: 'string' },
          file: { type: 'string', description: 'best-guess source file to edit' },
        },
      },
    },
  },
}
const shots = pages.flatMap(p => [`${QA}/${p.slug}-desktop.png`, `${QA}/${p.slug}-mid.png`, `${QA}/${p.slug}-phone.png`])
const lenses = [
  { key: 'layout-overlap', focus: `LAYOUT BREAKAGE: elements overlapping so they hide content, text clipped/cut off by a container or torn edge, items escaping their box, broken z-index (a pin/tape/stitch behind what it should pin, or a frame over text), collisions between scraps, content under the sticky nav, empty gaps where something failed to render, the draggable polaroid sitting over prose.` },
  { key: 'contrast-legibility', focus: `CONTRAST & LEGIBILITY: any text that's hard to read — light-on-light (Oats on cream), dark-on-dark, low-contrast color text, text over a busy texture/stitch/grid, the airmail dashed border crossing the title, ledger red margin through text, title ink wrong on its banner. Body must stay comfortable. Flag AA failures.` },
  { key: 'mobile', focus: `MOBILE (390px shots): horizontal overflow / sideways scroll, scraps clipped at screen edge, tap targets under 44px, cramped or overlapping clippings, nav/burger broken, text too wide or too tight, the post headers (airmail/ledger/cloth) breaking, furniture burying the column.` },
  { key: 'material-glitch', focus: `MATERIAL/TEXTURE GLITCHES: any return of the tiled "weird pattern"/checkerboard on a face, a visible repeating seam on the desk grain or a sheet, torn edges that look smeared/stretched/wrong, the sashiko stitch misaligned or covering text, the airmail par-avion frame broken/incomplete/mis-masked, ledger rules not aligning, a scrap with no face (transparent) or a missing baked sprite, a hard 0-blur or neutral-black shadow, an outer glow.` },
  { key: 'color-brand', focus: `COLOR & BRAND UGLINESS: 7-palette only (no off-brand hues, no #000/#fff), the 25/25/20/10/10/5/5 budget (School Bus/Happy <=5%, dark-ink only; no garish yellow field), logo clean/upright/one-color, no clashing adjacent saturated blocks, nothing garish or cheap-looking. Compare the desk feel to ${V6}.` },
  { key: 'polish-ugliness', focus: `SPACING / ALIGNMENT / GENERAL UGLINESS: awkward gaps or cramping, misaligned baselines, ugly text wraps/orphans/widows in headlines, a lone scrap stranded in dead space, inconsistent tilts that read as a mistake (not charm), oversized/undersized elements, the footer/colophon, the subscribe CTA, prev/next tabs — anything that just looks unpolished or unintentional.` },
]
const reports = await parallel(lenses.map(L => () =>
  agent(`You are the **${L.key}** visual-QA inspector for Chielo's Drex blog (a whimsymaxx zine/
scrapbook aesthetic — torn colored-paper scraps, sashiko cloth, airmail/ledger stocks, pins/tape/
stamps on a warm textured desk; long-form essays must stay readable). Intentional charm (tilts,
torn edges, overlap of DECOR, hand-made imperfection) is GOOD — do not flag it as a bug. Flag only
genuine BUGS / GLITCHES / UGLINESS that a sharp-eyed designer would call broken or unpolished.

LOOK AT (use the Read tool on each — actually inspect them) these screenshots:
${shots.map(s => '  ' + s).join('\n')}
Reference the brand law ${BRAND} and the v6 desk ${V6}.

YOUR FOCUS: ${L.focus}

Return every real issue with severity (blocker=hides/breaks content · major=clearly ugly or wrong ·
minor=small polish · nit=trivial), the page+viewport, where it is, the problem, a concrete fix, and
the best-guess source file (_sass/_grounds.scss, _sass/_post.scss, _sass/_realism.scss,
_sass/_mobile.scss, _layouts/*.html, _includes/*.html). If a category is clean, say so in 'overall'
and return few/no bugs. Be precise and honest — no invented issues, no flagging intentional charm.`,
    { label: L.key, phase: 'Hunt', agentType: 'general-purpose', effort: 'high', schema: BUG_SCHEMA })))
const valid = reports.filter(Boolean)
log(`Hunt complete:\n${valid.map(r => `  ${r.lens}: ${r.overall} (${r.bugs.length} issues)`).join('\n')}`)

// ---- TRIAGE ----
phase('Triage')
const triage = await agent(`You are the QA lead. Here are ${valid.length} visual-QA reports (JSON) for
the Drex blog:\n${JSON.stringify(valid)}\n
Dedupe issues that describe the same thing, drop anything that is actually intentional zine charm
(tilts, torn edges, decorative overlap, hand-made imperfection), and produce ONE ranked bug list
worst-first (blocker → major → minor → nit). Each entry: severity, page, where, problem, a concrete
fix, and the single best source file to edit. Group by file where possible. Give a one-paragraph
verdict on overall visual health.`,
  {
    label: 'triage', phase: 'Triage', agentType: 'general-purpose', effort: 'high',
    schema: {
      type: 'object', additionalProperties: false,
      required: ['verdict', 'bugs'],
      properties: {
        verdict: { type: 'string' },
        bugs: {
          type: 'array',
          items: {
            type: 'object', additionalProperties: false,
            required: ['severity', 'page', 'where', 'problem', 'fix', 'file'],
            properties: {
              severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'nit'] },
              page: { type: 'string' }, where: { type: 'string' }, problem: { type: 'string' },
              fix: { type: 'string' }, file: { type: 'string' },
            },
          },
        },
      },
    },
  })
return { verdict: triage.verdict, bugCount: triage.bugs.length, bugs: triage.bugs }
