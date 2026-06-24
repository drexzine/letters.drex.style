# CLAUDE.md — house rules for this repo

This repo is the **drex correspondence** — a Jekyll zine that ALSO powers a live email
**newsletter** sent via Kit (RSS-to-email). Editing here can affect a public site and,
once Kit is connected, real emails. Read this before doing anything.

## 🚨 READ `FOR-CHIELO.md` FIRST — and surface it at every step
`FOR-CHIELO.md` is the operational source of truth for the newsletter (audience, the
one true sign-up form, safety model, how a letter goes out, drafts, the `<!--more-->`
tag, what's done/next). `PLAN.md` holds the full plan + research.

If you are an AI assistant working in this repo:
- **At the start of any task that touches publishing, the feed, forms, subscribe
  includes, posts, or sending**, re-read `FOR-CHIELO.md` and **explicitly remind the
  user (Chielo/Sue) of the relevant safety notes** before acting.
- Treat its safety rules as binding. When in doubt, stop and ask.

## 🚦 Newsletter safety — never send anything unintended
- **Nothing sends by accident.** Kit RSS is **Single mode, auto-send OFF** → it only
  ever creates DRAFTS; a human reviews + sends each one in Kit.
- **ALL posts are newsletters.** A post is emailable if it's a real dated post in
  `_posts/` dated **on/after `email.start_date`** (the launch line in `_config.yml`,
  which keeps the pre-launch archive out). Opt ONE post OUT with `newsletter: false`.
- `/email-feed.xml` is the Kit feed. Do **not** merge it with `/feed.xml` (RSS
  readers). Keep post **guids stable** (= permalink); changing a published post's
  slug/date makes Kit draft it again.
- The **final pass + send happen in Kit**, post-publish (subject, preheader, test-send,
  Send). The repo only produces a clean draft.
- One sign-up form only: **`Circle Jekll – Join Open Invite` (uid `f0604c333e`)**.

## 📮 Sending a letter — runbook (AI agent follows this)
The operator is a non-technical CEO; YOU run these steps when they say "send/publish
the X letter". Go slowly and confirm.
1. Publish it as a real dated post in `_posts/` (not `_drafts/`, not future-dated),
   dated today/after the launch cutoff. That alone makes it a newsletter — no flag.
   (To publish a post WITHOUT emailing it, set `newsletter: false` in its front matter.)
2. Build + lint (always do this): `bundle exec jekyll build && bundle exec ruby
   scripts/check-email-feed.rb`. Read the warnings (relative URLs, missing alt, size,
   >1 item). Advisory — never blocks.
3. **If it warns the email is near/over ~100 KB (Gmail clips long emails), offer to add
   a `<!--more-->`** where the letter should stop in the email — that cuts the email
   short and adds a "Continue reading →" link to the full letter on the web. Rebuild.
4. Commit the post + push.
5. GitHub Pages rebuilds; Kit's RSS automation **drafts** the email (auto-send OFF).
   Kit polls on its own schedule — the draft can take minutes to hours to appear.
6. Tell the human: open Kit, do the final pass (subject, preheader, read it through),
   **send a test to yourself**, then press Send. The send is always theirs, in Kit.

## 🧰 The safety model (right-sized for draft-only)
- A letter goes out only if BOTH happen: (1) you publish a post dated on/after the launch
  cutoff (so it enters `/email-feed.xml`), AND (2) a human clicks **Send** on the Kit draft.
- **Kit "Send automatically" = OFF is the keystone.** Kit only ever DRAFTS; nothing
  sends itself. **NEVER turn it on.** Worst case of any repo mistake = a draft you delete.
- `scripts/check-email-feed.rb` is an **advisory lint only** — warnings, never blocks,
  always exits 0. Optional. (We removed the old blocking validator/ledger/hook/CI on
  purpose: with draft-only they were friction guarding a disaster Kit already prevents.)

## ✍️ Drafts — work without publishing or emailing
- Put work-in-progress in **`_drafts/`** (undated filename). Jekyll does NOT build
  drafts → never on the site, never in the feed, never seen by Kit.
- **Future-dated** posts also don't publish (Jekyll skips future by default;
  `future: false`). 
- Preview drafts locally only: `bundle exec jekyll serve --drafts`.
- A published post past the cutoff auto-becomes a newsletter — so don't put a post in
  `_posts/` with a current date until it's ready (or set `newsletter: false` to hold it).

## 🏗️ Build / housekeeping
- Stock GitHub Pages build (`github-pages` gem, safe mode) — **no custom plugins**.
  Production runs Liquid only; committed `_site/` is ignored.
- Internal docs are excluded from the build in `_config.yml`: `PLAN.md`,
  `FOR-CHIELO.md`, `CLAUDE.md`, `README.md`, `BRAND-AND-UX.md`.
- House style for posts + the include "kit": see `README.md` and `BRAND-AND-UX.md`.
- Verify changes with `bundle exec jekyll build` before trusting them.
