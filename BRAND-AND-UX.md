# Drex — Brand direction + UX verdict (June 2026)

Two background research passes (a 2026-grounded brand study with an adversarial red-team, and a
5-persona vision UX evaluation) plus a maintainability audit of the repo. Bottom lines first.

---

## 1. The skeuomorphism question — the answer reframes your question

**You asked:** realistic-textured skeuomorphism (this blog) vs cartoony-whimsical (the drex.style
landing) — which one, or a context-split hybrid (realistic for content, cartoony for UI)?

**The call: keep ONE warm-analog textured world everywhere — the realistic register — but *govern*
it with a single rule. Don't split into two systems.** Confidence: high.

The important correction: **the real axis isn't "realistic vs cartoony" — it's "atmosphere vs
affordance."** The 2026 expert consensus (Codexical, Superdesign, the Liquid-Glass post-mortems)
is to use physical metaphor *only where it does cognitive work*: texture carries **brand + reading
atmosphere**; dimensional depth carries **affordance on controls**; everything defaults to less.
Your hybrid instinct was right about the *rule* and wrong about the *frame* — and wrong that "the
two registers already exist." They don't: the chrome you just shipped (die-cut sticker tags, the
foil-key submit, hand-filled reply cards) is **already textured**, and it's the most ownable thing
on the site. The hybrid would *rip that out* to make controls blander — toward the exact generic
skeuo-revival that's commoditizing in 2026. So we keep it, and we put a fence around it.

**The one machine-checkable rule** (an AI and a script can both obey it):
> Interactive controls **may** carry edge / rim / foil texture and **must** hit ≥4.5:1 text
> contrast and ≥44px targets. They **must not** use a `--bk-piece-*` raster *fill* as the control
> face, and **no** texture of any kind goes under the running-text column.

Three of the failure modes the "go flat" camp fears are **already solved** in your code, which is
why one governed register beats two: `.prose` is already texture-free and AA ("legibility is
sacred" — `_post.scss:33`); tap targets already pass (tags 44px, fields 46px, submit 48px); and
`_tokens.scss` already carries AA-safe deeps (`--grass-deep`, `--lazuli-deep` ~5.2:1) under one
light source. The Liquid-Glass backlash kills *ungoverned* realism on controls (photoreal face +
bad contrast + tiny targets) — not a *governed* textured control.

### Why realistic, not cartoony
- **It's your moat against big tech.** 2026 has *two* skeuomorphism revivals: Apple's Liquid Glass
  (cold, corporate, glass/depth) and the craft/anti-AI revival (paper, riso, tape, collage —
  Landor literally named it "Anti-AI Crafting"; exemplars: Studio Frith's Jolene Bakery, Nike &
  Spotify torn-paper). You're squarely in the warm-analog camp. Going cartoony surrenders that
  contrast; going Liquid-Glass would betray the whole "made by humans, together" claim.
- **It reads premium, not kitsch** — *because* it's craft-for-memory, not decoration. The line
  that keeps it out of the "late-90s educational game" uncanny valley: texture is the **stage and
  the objects**, never the reading column or the click-target.
- **Authoring cost is identical** across all three options (posts are markdown + a fixed include
  kit; the author never touches texture). The hybrid only *adds* maintenance — a second register
  to keep in sync — on the repo's single highest-churn surface (~13/28 commits touch the
  realism/bakery layer). One governed register = less code, less drift.

### The real moat is NOT the texture
Scrapbook-skeuo is "nearing common" in 2026 — so leaning *harder on the motif* is trend-following.
The durable, ownable edge is **Chielo's marker-marginalia voice + the Oats palette + the "we leave
the seam showing / visible mend, made by humans together" lineage.** Those survive even if every
competitor adopts torn paper. Win on restraint and intentionality, not on adding more objects.

### Two properties, one palette
drex.style (landing) can stay the **lighter, more playful** register; this blog stays the
realistic one. That's an intentional *by-property* choice, not the brand splitting in two — **as
long as both consume the same `_tokens.scss` palette/type and one light source.** If they drift in
color/type/light, it reads as two brands. (Action: align the landing's tokens to this repo's.)

---

## 2. "Will people find it too confusing to be practical?"

**No — verdict: *practical-with-fixes*, not too-confusing.** Avg confusion 4.6/10, clutter 4.4/10
across 5 personas. But your fear is **half-right in the half that matters most.**

- **The aesthetic is the moat, not the problem.** *Every* persona — including the two who bounced
  — named the handmade look as the site's strongest asset. **Do not flatten it.**
- **The reading experience works.** Reader scored 3/10 confusion, mobile **2/10** (the single best
  persona — mobile correctly drops the drag and renders as calm texture). The playfulness does not
  fight the prose.
- **The one serious problem is the *front door* for cold traffic.** First-timer and skeptic *both*
  scored **7/10** confusion: the home page failed the 5-second test — no plain-language value prop,
  the words "Circles / communities of practice / join" never appeared above the fold, and the hero
  led with a stranger's name ("Chielo's notebook") over copy that read like lorem-ipsum. **Warm
  visitors were fine; cold visitors closed the tab.**

### Fixes — done this session (✅) vs your call (▢)
1. ✅ **Plain-language value prop above the fold** — added a legible, upright, high-contrast lede on
   the hero naming Circles + what you get. *This alone neutralizes your core fear.*
2. ✅ **Signposted "Join a Circle" CTA in the masthead** (+ mobile nav) → the /join-online page, so
   signup isn't buried 60% down /about.
3. ▢ **Inline green hand-CIRCLES inside body prose read as copy-edit "fix-this" marks** (reader +
   mobile flagged it — "looked like an unfinished draft"). Recommend: change `m-circle` inside prose
   to a marker **highlight/underline**; reserve rings for the margin. Brand-primitive change — your
   call, but it's the highest-value reading fix left.
4. ▢ **Translate the insider section labels** (Lore / Vision / Canon) — a stranger can't scan them.
   Keep the zine words as flavor, add a plain scannable label (Essays / About / Manifesto).
5. ▢ **Disambiguate the two near-identical green cards** on /about ("Join a Circle" vs "Invite me to
   help") and **drop/defer the cryptic dropdown** ("How much do you document…?") from the primary
   subscribe — email + first name converts; the dropdown adds hesitation.
6. ▢ Add an end-of-letter subscribe CTA on **desktop** (mobile already nails this).

You are not choosing between *distinctive* and *clear*. You have distinctive-without-clear at the
entrance; we add clarity at ~4 spots and leave 90% of the soul untouched.

---

## 3. Maintainability — the sleeper risk (and the thing that protects the soul)

This is the constraint most likely to erode the brand quietly. A single letter currently carries
**~85+ hand-placed annotations** (48 `m-note` + 37 `m-mark`) across ~10 include types, plus inline
`m-underline / m-circle / m-scribble / m-hl` spans. Claude *can* generate it, but a non-technical
human can't maintain/edit it, and two failure modes are likely: (a) new letters silently lose the
flourishes and drift toward a generic blog, or (b) someone pastes raw HTML and breaks the page.

**The fix is a governance layer, not a redesign** (see `CLAUDE.md`, added this session):
- **Freeze the furniture** to the exact current include kit; Claude emits include calls + markdown,
  **never** textures / sprites / shadow tuning / new colors. The texture lives behind `html.baked`
  in `bakery.js` + `_realism.scss` and is off-limits to authoring.
- **A lean baseline:** a letter must be on-brand and readable with *just* markdown + a few optional
  includes. Dense marginalia is for hero posts, not every post (it's also where the per-post cost
  and the "too busy" risk live).
- **Make the brand rule a real check, not a vibe:** a tiny CI lint that greps compiled CSS for
  `--bk-piece-*` on any `button / submit / nav / .post-tag / .formkit` selector and fails on a new
  match (whitelist the one grandfathered foil submit). Plus assertions that `.prose` stays AA +
  texture-free and targets stay ≥44px. This replaces "discipline in code review" — there is no human
  reviewer — with a check the AI can't blur past. *(Recommended next step; not yet wired.)*

---

## TL;DR
- **Keep the realistic textured world everywhere. Don't go cartoony, don't split into two systems.**
  Govern it with one rule (texture decorates control *edges*, never control *faces* or the reading
  column; AA + 44px enforced). The split that matters is **atmosphere vs affordance**, not realistic
  vs cartoony.
- **The moat is voice + palette + the visible-mend lineage — not the torn paper.** Texture is
  commoditizing; don't lean harder on it, lean on intentionality.
- **The site is practical, not confusing** — except the front door for strangers, now largely fixed.
- **Maintainability is the real long-game risk.** Freeze the furniture, keep a lean baseline, and
  make the brand rule a CI check.
