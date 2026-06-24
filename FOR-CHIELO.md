# FOR-CHIELO.md — the drex correspondence newsletter, in plain terms

> Living source-of-truth + how-to for the email newsletter. TLDR / bullet style.
> Sue is building this (taking over from Chielo). Updated as we go.
> Status: 🟡 planning + setup. Nothing sends yet. See `PLAN.md` for the full plan.

## What this is (one picture)
- You publish a letter on the site (as you do today) →
- a **separate email feed** picks it up **only if you flag it** →
- **Kit drafts an email** from it →
- **you review and click send.** Nothing goes out on its own.

## The golden safety rule
- **Nothing can send by accident.** Today there are **zero sending automations** in
  Kit, so editing the site/repo cannot email anyone.
- Even once it's live: Kit is set to **draft only** (auto-send OFF) — emails sit as
  drafts until a human sends them.
- A letter can only enter the email feed if you **explicitly tag it** `newsletter: true`.
  Your existing letters are not tagged, so they can't be sent.

## ⭐ THE ONE TRUE FORM
> **Every sign-up on the site goes to ONE Kit form: `Circle Jekll – Join Open Invite`
> (uid `f0604c333e`).** That is the single source of subscribers. If you ever add a
> sign-up anywhere, use this form. There is no second form.

## The audience (confirmed with Chielo — 2026-06-23)
- **ONE form, ONE list, ONE newsletter — everyone gets the same letters.**
- The only sign-up form is **Circle Jekll – Join Open Invite** (`f0604c333e`).
  Currently: **1 subscriber** (363 visitors / 90 days, ~0.3% conversion).
- **The SF form is RETIRED** — *Circle Jekll – Invite Me to Your Circle*
  (`303c1aa9b2`) had 0 subscribers and is no longer used anywhere on the site.
- Everywhere a sign-up appears now points to the one form: `/join-online/`, the About
  page (both CTAs), and the auto-appended card at the foot of every letter. `/join-sf/`
  redirects to `/join-online/`.

> **⚠️ Heads-up for Chielo — the About page "Invite me to help" CTA.**
> That partnership CTA ("bring Drex to your people") now points to the SAME one form
> (`f0604c333e`), since the old form was retired. So people who fill it out become
> **regular newsletter subscribers**. If you want to tell partnership inquiries apart
> from plain sign-ups, add a hidden field or an automation tag to that form **in Kit**
> (Sue can't see "the thingy in the form" from the repo — it's a Kit-side setting).

## How a letter will go out — just tell Claude
You don't run commands by hand. **Tell Claude Code: "I'm ready to send the [name]
letter."** Claude follows the safe runbook in `CLAUDE.md`. Plain version of what happens:
1. (Optional) Draft privately first — see **Drafts** below; drafts never publish/email.
2. The letter gets published on the site and marked to email (`newsletter: true`; plus
   `<!--more-->` if it's a very long one).
3. **An automatic safety check runs.** It refuses if anything looks wrong — more than
   one letter going out at once, a re-send, a broken/unsafe email. You approve the one
   intended letter, and it's recorded in a ledger.
4. Kit notices the new letter and **drafts** an email. It does NOT auto-send.
5. **The final pass happens IN KIT (post-publish).** Open the draft in Kit, do the last
   touches (subject line, preheader, a final read), **send a test to yourself**, then
   **Send**. ⭐ The email is never "done" from the repo alone — Kit is the last, human,
   review-and-send step. Two human gates: you approve in the repo, you Send in Kit.

> If the safety check ever **blocks**, that's it working. Don't override it — read what
> it says (or ask Claude), and only proceed if it's genuinely the single letter you meant.

## ⭐ Final pass / final touches happen in Kit (post-publish)
- The repo produces a clean draft; **the polish + the send live in Kit.**
- Always expect to review and finish each issue in Kit before it goes out: subject
  line, preview text, a last read at email width, test-send to yourself.
- This is also a safety layer — nothing leaves Kit without you looking at it.

## Drafts — work on a letter without publishing or emailing
- Put work-in-progress in a **`_drafts/`** folder (no date in the filename, e.g.
  `_drafts/my-idea.md`). Jekyll does **not** build drafts, so they never appear on the
  site, never enter the feed, and Kit never sees them. 100% safe.
- A **future-dated** post (date later than today) also won't publish — Jekyll skips
  future posts by default. So nothing goes live before its date.
- To preview a draft locally: `bundle exec jekyll serve --drafts` (the `--drafts` flag
  is local-only; it does not change what's published).
- A letter only becomes emailable once it's (a) a real dated post in `_posts/`, (b)
  flagged `newsletter: true`, and (c) dated on/after the cutoff. All three, or nothing.

## What the email looks like (decided 2026-06-23)
- **The FULL letter goes in the email** (bias to full), in a clean on-brand wrapper
  (oats/ink/grass, web-safe fonts). The reader gets the whole essay in their inbox.
- Top of the email has a small **"Read in your browser →"** link (carries
  `?ref=newsletter` for analytics, and is a safety hatch if a giant letter ever clips).
- Furniture (pull-quotes, definition boxes, marginalia, stamps, polaroids) **degrades
  to plain readable text** in email — the boxes/tape/torn edges need CSS + SVG that
  email strips. Prose, headings, bold/italic, links, and images render fine. The fancy
  version lives on the web.

### Long letters & the `<!--more-->` tag  ⭐ (Chielo: use this)
- 📌 Gmail clips a single email over **~102 KB** of HTML (hides the rest behind
  "[Message clipped]"). Repeated clipping can dent deliverability, so we avoid it.
- **Good news:** your real letters measure ~30–50 KB — about *half* the limit — so
  full-content letters almost never clip.
- **For an unusually long letter**, drop `<!--more-->` in the markdown where you want
  the email to stop. The email then shows everything above it + a **"Continue reading
  →"** link (`?ref=newsletter`); the rest is read on the web. Clean, deliberate, no
  ugly Gmail clip.
- The validator **warns you at ~100 KB** before you push, so you're never surprised —
  that's your cue to add a `<!--more-->` (or accept the rare clip).

## Status checklist (what's done / next)
- [x] Confirmed: no sending automations exist (safe to build).
- [x] Confirmed: one newsletter, everyone; forms = backend tags only.
- [ ] Decide the recipient target in Kit = subscribers of the one Open Invite form.
      (Simple now — one form, no tag split. We'll confirm when Sue test-signs-up.)
- [x] `/join-sf/` now **redirects** to `/join-online/` (the one sign-up). URL kept
      alive on purpose — existing web links / QR codes / the homepage SF button still
      work. (`join-sf.html`, not in sitemap.)
- [x] Homepage: both CTAs kept ("online" + "SF"); SF button → /join-sf/ → redirect.
      Stale code comment fixed.
- [x] `about.md` "Invite me to help" CTA repointed to the one form (`f0604c333e`).
      → see the Chielo heads-up above re: tagging these in Kit.
- [x] Audit complete: retired form `303c1aa9b2` no longer appears anywhere in the
      built site; the include comment + docs all name the one true form.
- [x] From = Chielo, sending from **chielo@letters.drex.style** (that subdomain is a
      verified sending domain → exact DKIM/DMARC alignment). Reply-To = a real inbox.
      ⤷ Ensure chielo@letters.drex.style is added + set as the From in Kit (screenshot
        showed chielo@drex.style as default — switch/add the letters.drex.style one).
- [x] Double opt-in ON + confirmation redirect → /confirmed/ — verified end-to-end
      (Sue confirmed via email and landed on /confirmed/).
- [x] Verified sending domain DONE — both drex.style and letters.drex.style show
      verified (green) in Kit → Settings → Email. From chielo@drex.style aligns.
- [ ] **Welcome email** that sets expectations (cadence + vibe) — high-leverage,
      proven to cut spam complaints. (should-do)
- [x] Built a branded **confirmation / welcome page** → **`https://letters.drex.style/confirmed/`**.
      ⭐ **CHIELO — plug this URL into Kit** as the form's post-confirmation redirect
      (Settings → the confirmation/success URL), so people who click the opt-in email
      land on our page. (Sue can't do the Kit side; Chielo will.)
- [x] Homepage: sign-up CTAs moved INSIDE the main banner box. Verified on a local
      server screenshot.
- [x] Safety validator HARDENED after an adversarial multi-agent review: structural
      allowlist (blocks iframe/form/script/svg-script/etc.), `--bless` now enforces the
      archive-blast + re-send guards (needs `--force` to override), RSS-structure check,
      BOM tolerance, stale-build check, 102KB hard block. 30/30 self-tests pass; real
      furniture letter validates clean. Added `scripts/setup` + a check-only GitHub
      Action (`.github/workflows/email-feed-check.yml`) for server-side enforcement.
- [ ] Customize + test the one-click unsubscribe.
- [x] Build the email feed skeleton + safety gates → `/email-feed.xml`. Verified it
      builds EMPTY (no letter flagged). Inert: Kit not connected.
- [x] Build the email body — FULL letter, inline-styled, absolute URLs, top
      "Read in browser" (?ref=newsletter), `<!--more-->` → "Continue reading", furniture
      degrades to text. Verified (more-tag, URL rewrite, ?ref) + screenshot reviewed.
- [x] Build the safety validator (`scripts/check-email-feed.rb`) + approval ledger
      (`scripts/email-feed-manifest.txt`) + pre-push hook (`.githooks/pre-push`,
      enabled via `core.hooksPath`). Self-tested: blocks malformed XML, `<script>`,
      relative URLs, missing alt, archive-blast (>1 new), slug-change/re-send; warns at
      ~100 KB; `--bless` approves. (Being adversarially re-verified.)
- [ ] Connect Kit (Single mode, auto-send OFF), exclude old letters.
- [ ] Dry run with a throwaway test letter.
- [ ] Go live.

## Glossary (for later)
- **Tag** — a backend label on a subscriber. There's ONE list/newsletter; tags (e.g.
  an SF tag for in-person event invites) are just for separate, non-letter sends.
- **Double opt-in** — new subscribers must click a confirmation link before they're
  added. Protects us from spam complaints. On by default in Kit.
- **RSS feed** — a machine-readable list of letters Kit reads to draft emails.
- **Single mode / auto-send OFF** — Kit drafts one email per letter and waits for you.
- **`<!--more-->`** — a marker you can drop in a long letter's markdown; the email
  stops there and adds a "Continue reading →" link to the web.
- **Drafts (`_drafts/`)** — work-in-progress letters Jekyll never publishes.
- **`?ref=newsletter`** — added to email links so GoatCounter attributes those reads
  to the newsletter.
