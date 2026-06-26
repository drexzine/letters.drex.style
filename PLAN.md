# PLAN — Sending Circle Letters as a newsletter (Kit RSS-to-email)

## The request
Every letter on the site also goes out as a Kit newsletter. We want the *article*
in the Drex voice — **without the site chrome** — as HTML that lands in the inbox,
reads like a personal letter, and never looks spammy.

## Key reframe (after deliverability research)
This is **two problems, and the HTML is the smaller one.** Inbox placement is
driven mostly by **sender setup + reputation**, not markup. The research also
settles our design debate: **prose-first, light HTML, high text-to-image ratio**
is both the only honest "email can't do collage" answer AND the deliverability-safe
answer. A heavy image/collage email is a spam signal. So: simple custom email
template, minimal styling, no torn-paper furniture.

Tracks below. **Track 0 (safety) is the top priority** — Sue's biggest worry is an
accidental/unintended send. Then Track A (sender setup), Track B (template), Track C
(tooling).

**Audience model (confirmed with Chielo, updated 2026-06-23):** ONE form, ONE list,
ONE newsletter — everyone gets the same letters. Sole sign-up form = **Circle Jekll –
Join Open Invite** (`f0604c333e`). The SF form (`303c1aa9b2`) is RETIRED (had 0 subs).
→ ONE `email-feed.xml`, ONE Kit RSS automation, recipients = subscribers of the one
form. No tags, no two-feed split, no per-post circle targeting. Open site item: the
SF join page (`join-sf.md`) still embeds the retired form — decide remove vs repoint.

---

## TRACK 0 — SAFETY: never send anything unintended  (highest priority)
Confirmed from Kit RSS docs: Single mode only ever creates DRAFTS; nothing sends
unless "Send automatically" is explicitly ON (then 30 min after draft) — otherwise
drafts sit "indefinitely" for manual send. That's the bedrock guarantee. But Kit does
NOT document its dedup/guid logic or first-connect behavior, so we add defense in
depth — any ONE of these gates alone prevents an unintended send:

**Step 0 (DO FIRST, before touching anything): establish current Kit state.** Are the
two existing "newsletters" just the signup FORMS (inline embeds), or is there already
an RSS broadcast automation connected to `feed.xml`? If one exists with auto-send ON,
changing the site/feed NOW could send. Until confirmed, HOLD. Likely: they're forms
and no RSS sending exists yet → until Kit is deliberately connected, NOTHING in the
repo can send an email.

Six independent gates:
1. **Separate feeds.** Build a NEW `email-feed.xml`; never touch existing `feed.xml`.
   Kit isn't reading the new file during dev → repo work is inert.
2. **Explicit opt-in allowlist.** Email feed includes a post ONLY if front matter has
   `newsletter: true` AND it's past a cutoff date. The 3 existing letters stay
   unflagged → physically cannot be in the email feed → cannot be blasted.
3. **Deterministic tripwire** (extends `check-email-feed.rb` + pre-push hook):
   compare feed items vs a committed manifest; FAIL the push if >1 new item appears
   or an existing guid changed. Catches an archive-blast before Kit sees the feed.
4. **Stable identity.** guid = canonical permalink (stable under `/:year/:month/
   :slug/`). Never change a published post's slug/date (mints a "new" item). Script
   enforces guid presence/stability.
5. **Auto-send OFF in Kit** → drafts only, indefinitely.
6. **Manual review + test-send** each draft (to self / test segment) before the list.

**First cutover, safest order:** (a) confirm Kit state; (b) build + validate
`email-feed.xml` (Kit not connected, zero risk); (c) membership = future posts only,
exclude archive; (d) connect Kit RSS, Single mode, auto-send OFF; (e) dry run: one
throwaway test letter → confirm exactly one draft → test-send to self → verify render
+ unsubscribe → don't send to list; (f) go live, every letter draft→review→send.

---

## TRACK A — Sender reputation & deliverability  (mostly one-time, in Kit + DNS)
Highest leverage. Verified against first-party Google / Microsoft / Kit docs.

### Must-do
1. **Verified sending domain in Kit, on a subdomain** (e.g. `mail.drex.style` or
   Kit's verified-domain flow on `drex.style`). This sets up SPF + DKIM + DMARC and
   moves us onto our own domain reputation instead of Kit's shared pool. Kit uses a
   CNAME envelope sender; DMARC passes via DKIM alignment. Do NOT bulk-send from the
   raw corporate root.
   - src: help.kit.com/.../2502558-verify-your-domain, .../9176509-before-verified-sending-domain
2. **Publish DMARC ≥ `p=none`** (aligned to SPF or DKIM) on the domain. Required by
   Gmail + Yahoo (Feb 2024) and Outlook (enforced May 5 2025; non-compliant
   high-volume mail rejected `550 5.7.515`).
   - src: support.google.com/a/answer/14229414, techcommunity.microsoft.com/.../4399730
3. **Real From-name + real, monitored Reply-To** (founder's name; never `no-reply@`).
   Replies and engagement help placement. *(reply→deliverability link: practitioner,
   not verified in research)*
4. **One-click unsubscribe + visible unsubscribe link.** Kit adds the List-Unsubscribe
   header (RFC 8058) automatically — don't strip it; honor within 48h (Kit handles).
5. **Engagement-first warm-up:** first issues on the verified domain go to most-engaged
   / most-recent subscribers, then ramp volume. (Kit's own guidance.)
6. **List hygiene:** remove hard bounces; sunset chronically unengaged (~6–12 mo no
   opens). Keep **spam complaints < 0.1%, never 0.3%.**
7. **Add the domain to Google Postmaster Tools** to monitor spam rate / reputation.

### Complaint-rate playbook (keep spam < 0.1%, never 0.3%) — by leverage
Mechanics first: **spam rate = complaints ÷ delivered-to-INBOX** (not sent). If
placement slips, the visible rate can look fine while reputation rots. Postmaster
draws lines at 0.10% (recommended) and >0.30% (policy violation). People hit "spam"
instead of "unsubscribe" when they don't recognize the sender, can't find/failed
unsubscribe, or feel over-mailed/irrelevant — so attack each reason:

- **A1. Acquisition (biggest lever): confirmed/double opt-in.** Sources put double
  opt-in near ~97% inbox vs ~83–85% single, with far fewer complaints (numbers
  directional). Never buy/scrape/co-reg. *(one-time setup in Kit)*
- **A2. Immediate welcome email** stating exactly what + how often. Expectation
  clarity is the simplest long-term complaint reducer. *(one-time setup)*
- **A3. Sender recognition:** consistent founder From-name + consistent subject/
  branding — unfamiliar sender → spam button. *(per-send habit)*
- **A4. Consistent cadence:** pick a rhythm, hold it; no long silence → blast.
  *(per-send habit)*
- **A5. Unsubscribe easier than complaining — TWO layers, both Kit-owned at send
  time (NOT in our feed HTML):**
  - *Header one-click (RFC 8058):* `List-Unsubscribe` + `-Post` headers → Gmail/Yahoo
    show a native "Unsubscribe" by the sender name (the thing that competes with the
    spam button). Kit *should* add this automatically; NOT confirmed in Kit docs →
    **verify by live test** (below). It's an SMTP header, so our `email-feed.xml`
    can neither provide nor break it.
  - *Footer link:* Kit auto-injects, legally required, can't remove; customize TEXT
    via `{unsubscribe}` merge tag. Make it OBVIOUS — legible contrast, warm human
    wording ("not for you anymore? unsubscribe anytime — no hard feelings"),
    optionally a short version near the top too.
  - Our template just ends cleanly so it doesn't clash with Kit's appended footer.
  - No bait-and-switch: keep the letters list literary, not promo.
- **A6. Hygiene by engagement using CLICKS/REPLIES, not opens** (Apple MPP inflates
  opens, ~49% of all opens). Sunset/re-permission cold subscribers (Kit flags cold
  = no open/click 90d) before removing; remove hard bounces. *(ongoing, ~quarterly)*
- **A7. Monitor + respond:** watch Postmaster spam-rate vs the 0.10/0.30 lines; on a
  spike → pause, segment to engaged-only, find the offending send, slow cadence.

**Kit does automatically (verified):** auto-unsubscribes spam-complainers (and they
don't bill); built-in cold-subscriber detection to segment on; recommends suppressing
cold subs ~2 weeks during domain warm-up. **Confirm in Kit settings:** List-Unsubscribe
one-click (RFC 8058) enabled; Yahoo/Microsoft FBL auto-enrollment.

Sources: Suped + AWS (denominator), Iterable + Gmail Help (Postmaster lines),
Litmus + MailMonitor (opt-in), Convesio + beehiiv (welcome/expectations), Validity
(unsubscribe/recognition), Growth Rocket + SMTP2GO (cadence), beehiiv + Twilio (MPP/
opens), Kit/ConvertKit help + Tella (Kit auto-handling).

### Nice-to-have (defer)
- **BIMI** — needs DMARC enforcement (`p=quarantine/reject`) + a paid VMC cert
  (~$1k/yr). Skip for a small list; revisit once volume + enforcement are in place.
  *(worthwhileness unverified)*
- **Confirmed (double) opt-in** — protects complaint rate; worth it for a brand that
  cares about standing. *(tradeoff unverified in research)*

---

## TRACK B — The email itself  (what we build in the repo)
**Decision (2026-06-23, supersedes the teaser approach): FULL letter in the email**
(bias to full), with a top "Read in browser · unsubscribe" line (`?ref=newsletter`)
and an optional `<!--more-->` continue-reading split for unusually long letters.
Furniture degrades to plain text; the designed version lives on the web.

### Why full content
- Subscribers get the whole essay in their inbox (what Sue/Chielo want).
- **Measured:** real letters are ~30–50 KB of article HTML — about HALF Gmail's
  ~102 KB clip limit — so full-content letters essentially never clip. Clipping is a
  rare edge case, not routine.
- Furniture (pull-quotes, definition/callout boxes, marginalia, stamps, polaroids)
  degrades to plain readable text (CSS + SVG don't survive email); prose, headings,
  bold/italic, links, images render fine.

### 📌 Retained knowledge — the Gmail ~102 KB clip limit
Gmail clips a single email's HTML at **~102 KB**, hiding the rest behind "[Message
clipped] View entire message". Repeated clipping indirectly hurts deliverability: it
can hide the in-body unsubscribe footer (→ complaints; mitigated because the one-click
unsubscribe is in the HEADER, which is NOT clipped) and lowers engagement (→ worse
placement over time). So we AVOID routine clipping. Our letters are ~half the limit →
safe. `<!--more-->` pre-empts a clip on a monster letter; the validator WARNS at
~100 KB before push. Sources: litmus.com/blog/how-to-keep-gmail-from-clipping-your-emails;
suped.com (clipping → engagement/complaints).

### State: first-pass built, full-content rebuild pending
- `email-feed.xml` currently holds a first-pass TEASER body (title + dek + link) —
  proven to build empty when nothing's flagged and render correctly for a test post
  (screenshot reviewed).
- **TO DO — rebuild `<content:encoded>` to FULL content:** inline-styled wrapper (prose
  inherits), rewrite image/link URLs to **absolute**, a top "Read in browser ·
  unsubscribe" line (`?ref=newsletter`), honor `<!--more-->` → content above it +
  "Continue reading →" (`?ref=newsletter`), signed sign-off. Kit appends its footer
  unsubscribe at send.

3. **Point Kit's RSS-to-email** at `https://letters.drex.style/email-feed.xml`,
   **Single mode, auto-send OFF** (drafts for manual review of every issue).
   **Recipients = subscribers of the one Open Invite form** (`f0604c333e`).
   Kit's `{{post.content}}` maps to our feed's `content:encoded` (the full letter).
   **Final touches + send happen in Kit** (subject, preheader, test-send).

### Subject line + preheader (per send; practitioner guidance, unverified)
- Specific, curiosity-not-clickbait, front-load the meaning, ~≤50 chars.
- Preheader = a real first sentence, never "View in browser" / empty.
- Plain, personal, left-aligned, signed — reads as a letter, not a campaign.

---

## TRACK C — Tooling (answers "skill vs CLAUDE.md vs script")
QA splits by determinism: mechanical checks → a SCRIPT (not prose-in-a-skill);
only visual judgment → human/skill. The feed is a built artifact (`_site/`,
gitignored) rendered from the Liquid template, so the validator runs AFTER
`jekyll build` against rendered HTML — which is why the gate is pre-PUSH, not
pre-commit.

1. **`scripts/check-email-feed.rb`** (Ruby + Nokogiri — already in the lockfile, no
   new deps) = the deterministic contract, single source of truth. Pure, exit-code.
   Checks each `content:encoded`:
   - valid/well-formed XML + RSS; content non-empty (full, not truncated excerpt);
   - all `src`/`href` absolute `https://`; every `<img>` has non-empty `alt`;
   - byte size < ~102 KB (Gmail clip); 
   - no `<script>`/`<style>`/SVG `<filter>`/`url(#…)`/web-font `@import`/leftover
     `class=`-only styling.
2. **pre-push git hook** → runs `jekyll build` + the script; blocks push on failure.
   (Local-only unless committed via `core.hooksPath`.)
3. *(optional, recommended)* **check-only GitHub Action** running the same script on
   push/PR. Does NOT change the deploy — site still ships via stock Pages; the Action
   only lints the feed and can fail the PR. Server-side enforcement across machines.
4. **`/letter-email` skill = thin wrapper only** — runs the script, then renders a
   local screenshot for the dark-mode / fallback-font eyeball. Half-optional, because
   Kit Single-mode drafts are already a human review gate before send. So QA is
   two-stage: deterministic (script/hook/CI) at build, human (Kit draft) at send.
5. **`CLAUDE.md` note** — pipeline + brand-in-email rules (inline-only, web-safe
   fonts, absolute URLs, lean markup; the script is authoritative).

DONE (both): pre-push hook (`.githooks/pre-push` via `core.hooksPath`, bootstrap
`scripts/setup`) + check-only Action (`.github/workflows/email-feed-check.yml`).
⚠️ The CI Action is the one piece NOT locally verifiable — confirm it goes green on the
first push (Ruby/bundler platform on the runner; a `bundle lock --add-platform
x86_64-linux` step is included defensively). The local hook is the real-time gate.

HARDENED after an adversarial multi-agent review (4 lenses, 24 findings). Fixed:
`--bless` now enforces the archive-blast + re-send guards (`--force` to override);
body validation switched from regex denylist to a structural ALLOWLIST (blocks
iframe/form/meta/object/script — incl. inside `<svg>` — and unquoted on*/javascript:);
trusted decorative `<svg>`/`aside` allowed; RSS-root assertion (catches build error
pages); CDATA+element-aware body extraction; http/protocol-relative/srcset URLs blocked;
102KB hard block; BOM-tolerant manifest; stale-build check. 30/30 adversarial self-tests
pass; a real furniture-rich letter validates clean.

---

## Open questions for Sue
1. ~~Furniture in email~~ — RESOLVED: moot. Teaser-and-link means furniture stays on
   the web; the email is just a nudge.
2. **Verified sending domain:** which subdomain do you want mail to come from
   (`mail.drex.style`? something else?), and are you OK adding the DNS records Kit
   provides?
3. ~~Gmail 102 KB clip~~ — RESOLVED for now (teaser email is tiny). Fact retained
   above under "Retained knowledge" — it returns as a live constraint only if we ever
   switch to full-essay-in-email.

## Verification
- `email-feed.xml` validates as RSS; `content:encoded` is full HTML, inline-styled,
  absolute URLs, alt text, no `<script>/<style>/SVG`.
- Render each existing post's email body at 600px + in Gmail/Apple Mail (light +
  dark); confirm legible hierarchy, brand color, graceful font fallback, no clipping.
- Confirm Kit drafts a clean broadcast from the feed (Single mode).
- **Unsubscribe live test (gate before first real send):** send a test broadcast to
  a Gmail AND a Yahoo address; verify (1) the native one-click "Unsubscribe" appears
  by the sender name and actually removes the address (within 48h), and (2) the
  footer unsubscribe link is visible and works.

## Sources (verified)
Google bulk-sender (support.google.com/a/answer/14229414), Outlook high-volume
(techcommunity.microsoft.com/.../4399730), Kit verified domain + RSS
(help.kit.com/.../2502558, .../2502636, .../9176509), Gmail clipping
(litmus.com/blog/how-to-keep-gmail-from-clipping-your-emails). Unverified items
labeled inline.
