export const meta = {
  name: 'drex-blog-marginalia',
  description: 'Build a marker/crayon marginalia kit (brand colors) and richly annotate every post',
  phases: [
    { title: 'Kit', detail: 'build the hand-drawn marker/crayon marginalia system + includes' },
    { title: 'Annotate', detail: 'a LOT of meaningful marginalia per post, varied brand colors' },
    { title: 'Verify', detail: 'build + screenshot + report' },
  ],
}

const ROOT = '/home/tilde/Projects/Drex/drex-blog'
const B = '/home/tilde/.claude/skills/gstack/browse/dist/browse'
const LANDING = '/home/tilde/Projects/Drex/drex-landing/index.html'
const BRAND = '/home/tilde/Projects/Drex/drex-claude-skill/source-of-truth/branding/drex-brand.md'

const CONTRACT = `
DREX BLOG — MARGINALIA. The user wants "a SHIT TON more marginalia" in a hand-drawn MARKER /
CRAYON style ("squiggle vision crayon type shit"), in DREX-BRANDED COLORS. Think: Chielo read his
own essay with a fistful of markers and annotated it — circled key terms, squiggle-underlined the
punchy lines, scrawled margin notes in his own hand, drew arrows and stars at the best bits.

AESTHETIC (study the landing ${LANDING} — it has the .hl highlighter, .ul wobbly marker underline,
the #rough / #roughsm feTurbulence filters, and Patrick Hand .scrawl — reuse/extend that craft):
  - HAND-DRAWN, never clean vector: every stroke wobbles (run SVG strokes through a roughen filter
    like the landing's #rough, or hand-author wobbly SVG paths). Marker = slightly translucent,
    multiply blend, a little texture; crayon = grainier, waxy, broken coverage.
  - Patrick Hand for any TEXT marginalia (scrawled, sizeable, never tiny), rotated a few degrees.
  - BRAND COLORS ONLY as the marker inks: Grass #1CAB5B, Colorado #F75458, Lazuli #2496C9,
    School Bus #ECAF21, Happy #F1DD01, Sambas #414D57. VARY them (a page shouldn't be all one ink).
    Yellow/School-Bus only as HIGHLIGHTER swipes or marks, never as small text on light.
  - These are ACCENTS layered over the reading column — they must NOT hurt legibility: the running
    Bitter body stays clean and upright; marginalia sit in the MARGIN or as light inline marks.

BUILD THE KIT — a stable, Markdown-callable API (the annotate agents depend on these EXACT names):
  Inline marks (wrap a word/phrase, Markdown allows inline HTML):
    <span class="m-circle m-coral">word</span>      hand-drawn marker ELLIPSE around it
    <span class="m-underline m-grass">phrase</span>  wobbly marker UNDERLINE (crayon stroke)
    <span class="m-scribble m-lazuli">phrase</span>  loose double/triple squiggle underline
    <span class="m-strike m-ink">word</span>         hand struck-through
    <span class="m-box m-bus">phrase</span>          hand-drawn marker BOX/bracket around it
    <span class="m-hl m-happy">phrase</span>         translucent highlighter swipe (reuse .hl)
  Margin notes + marks (block-level includes, placed right AFTER the line they annotate):
    {% include m-note.html text="the key move →" color="coral" side="right" %}
        a Patrick-Hand scrawl pinned in the DESK MARGIN beside the column, tilted, with a thin
        hand-drawn LEADER line/arrow pointing back to the text. side=left|right.
    {% include m-mark.html type="star" color="bus" side="left" %}
        a small hand-drawn margin doodle: type = star | asterisk | arrow | check | exclaim | caret.
  Color classes: m-grass m-coral m-lazuli m-bus m-happy m-ink. Default = coral.

FILES: _sass/_marginalia.scss (all styles + @keyframes for an OPTIONAL subtle marker "boil");
  add the crayon/marker SVG filter defs into _includes/filters.html (already included site-wide via
  default.html) so the roughen is available; _includes/m-note.html + _includes/m-mark.html.
  Register _marginalia in assets/css/main.scss @import list. Keep the jekyll build clean.

SACRED / GUARDRAILS:
  - DESKTOP: margin notes position ABSOLUTELY into the bare desk margin beside .prose (the reading
    column is ~64ch centred in a wider stage — there IS room). They must NEVER overlap the body text.
  - MOBILE (<=900px): there is no gutter — margin notes/marks reflow to small inline scrawls between
    lines (or just under the paragraph), and NOTHING may cause horizontal overflow at 360-414px.
  - prefers-reduced-motion: kill any boil/wobble animation (static rough is fine).
  - a11y: decorative SVG marks are aria-hidden; m-note text stays readable (an <aside>/<span>, real
    text, AA on the desk). Inline marks must not break text selection of the underlying word.
  - Brand law holds: 7 colours only, no #000/#fff (ink=Sambas), budget-aware (vary; don't flood one).
RENDER/SERVE: served at http://127.0.0.1:4111/ over ${ROOT}/_site; rebuild: cd ${ROOT} && bundle exec jekyll build.
`

// ---- PHASE 1: BUILD KIT ----
phase('Kit')
const kit = await agent(`${CONTRACT}

YOU BUILD THE MARGINALIA KIT (one coherent system). Read the landing ${LANDING} (the .hl/.ul/#rough
craft to reuse), the current _includes/filters.html, assets/css/main.scss, and _sass for the token
names (--grass/--coral/--lazuli/--schoolbus/--happy/--ink, --f-hand Patrick Hand). Implement EVERY
item in "BUILD THE KIT" exactly (inline marks, m-note.html, m-mark.html, color classes), in the
hand-drawn marker/crayon aesthetic, brand colors, with the desktop-margin / mobile-inline / reduced-
motion / a11y behaviour specified. The hand-drawn circles/boxes/arrows should be SVG run through a
roughen filter (or wobbly hand-authored paths), marker = translucent multiply, crayon = grainy.
Write all files with Write/Edit; register the partial in main.scss. Build must stay clean.
Report the exact final API (every class + include signature) so the annotators use it verbatim.`,
  { label: 'build-kit', phase: 'Kit', agentType: 'general-purpose', effort: 'high' })
log(`Kit built. API:\n${(kit || '').slice(0, 1200)}`)

// ---- PHASE 2: ANNOTATE (parallel, one per post) ----
phase('Annotate')
const posts = [
  { file: '_posts/2026-05-12-the-correspondence.md', note: 'The long canon essay. ALSO thin its ~19 callouts: convert several "For Drex" asides into light MARGIN NOTES (m-note) instead of heavy dark slips, so the column breathes AND gains marginalia. Annotate generously across its whole length.' },
  { file: '_posts/2026-06-03-the-room-is-the-product.md', note: 'The vision memo. Annotate like a founder marking the manifesto he believes.' },
  { file: '_posts/2026-06-17-where-the-stitches-show.md', note: 'The lore/mending piece. Annotate warmly; the marginalia can echo the stitching theme.' },
]
const annotated = await parallel(posts.map(p => () =>
  agent(`${CONTRACT}

THE KIT IS BUILT. Its final API (use these EXACT classes/includes — do not invent new ones):
${kit}

YOU ANNOTATE this post: ${ROOT}/${p.file}
${p.note}

Read the post fully. Then add A LOT of MEANINGFUL marginalia (the user asked for "a shit ton") —
but every mark must EARN its place by pointing at something real:
  - CIRCLE the key terms/names a reader should catch (m-circle).
  - Squiggle-UNDERLINE or scribble the punchy, quotable lines (m-underline / m-scribble) — vary colour.
  - Scrawl MARGIN NOTES in Chielo's voice (m-note) beside the key moves — short, specific, warm,
    convicted ("→ this is the whole thesis", "the load-bearing word", "say this out loud"). Brand voice.
  - Drop margin STARS/ARROWS/CHECKS (m-mark) at the best beats.
  - Use m-box/m-hl sparingly for the single most important phrase in a section.
VARY the brand colours across the page (not all one ink). Do NOT mark every sentence — cluster around
the high points so it reads as a thoughtful hand, not graffiti. Keep the running Bitter prose clean
and selectable; inline marks wrap single words/short phrases only. Insert block includes on their OWN
line. Preserve all existing content + front-matter + existing includes. Use Edit/Write.
Report how many of each mark you added.`,
    { label: p.file.split('/').pop().replace('.md', ''), phase: 'Annotate', agentType: 'general-purpose', effort: 'high' })))
log(`Annotated ${annotated.filter(Boolean).length}/${posts.length} posts.`)

// ---- PHASE 3: VERIFY ----
phase('Verify')
const verify = await agent(`Verify the marginalia build. Via Bash:
  cd ${ROOT} && bundle exec jekyll build 2>&1 | tail -5
Report any build error verbatim. Then screenshot for review:
  ${B} viewport 1280x1000 ; ${B} goto http://127.0.0.1:4111/2026/05/the-correspondence/ ; ${B} wait --load ; sleep 2 ; ${B} screenshot /tmp/drex-marg/corr-desktop.png
  ${B} js "window.scrollTo(0, 2200)" ; sleep 1 ; ${B} screenshot --viewport /tmp/drex-marg/corr-mid.png
  ${B} viewport 390x844 ; ${B} goto http://127.0.0.1:4111/2026/05/the-correspondence/ ; ${B} wait --load ; sleep 2 ; ${B} js "window.scrollTo(0,1400)" ; sleep 1 ; ${B} screenshot --viewport /tmp/drex-marg/corr-phone.png
  ${B} js "(()=>{const o=document.documentElement;return JSON.stringify({overflow:o.scrollWidth>o.clientWidth+1, marks:document.querySelectorAll('.m-circle,.m-underline,.m-scribble,.m-note,.m-mark,.m-box,.m-strike').length})})()"
Report: build clean? horizontal overflow on phone? how many marginalia marks rendered? any console errors (${B} console --errors).`,
  { label: 'verify', phase: 'Verify', agentType: 'general-purpose', effort: 'low' })

return { kitBuilt: !!kit, postsAnnotated: annotated.filter(Boolean).length, verify: (verify || '').slice(0, 800) }
