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
- A letter is emailable ONLY if ALL of: it's a real dated post in `_posts/`,
  `newsletter: true` in front matter, AND dated on/after `email.start_date` in
  `_config.yml`. Otherwise `/email-feed.xml` stays empty for it.
- `/email-feed.xml` is the Kit feed. Do **not** merge it with `/feed.xml` (RSS
  readers). Keep post **guids stable** (= permalink); changing a published post's
  slug/date makes Kit re-draft. Never bulk-flag old posts.
- The **final pass + send happen in Kit**, post-publish (subject, preheader, test-send,
  Send). The repo only produces a clean draft.
- One sign-up form only: **`Circle Jekll – Join Open Invite` (uid `f0604c333e`)**.

## 📮 Sending a letter — exact runbook (AI agent follows this)
The operator is a non-technical CEO; YOU run these steps when they say "send/publish
the X letter". Go slowly and confirm.
0. Verify the safety hook is enabled: `git config --get core.hooksPath` must print
   `.githooks`. If it doesn't, run `sh scripts/setup` before proceeding.
1. Ensure the letter is a real dated post in `_posts/` (not `_drafts/`, not future-dated).
2. Add `newsletter: true` to its front matter. If it's very long, offer a `<!--more-->`
   break (the validator warns at ~100 KB).
3. `bundle exec jekyll build`
4. `bundle exec ruby scripts/check-email-feed.rb` — it will BLOCK saying the emailable
   set changed (added: this one letter). Read the diff and CONFIRM it's exactly the one
   intended letter, with NO removals.
   - If it reports **>1 added** or **any removed**: STOP. Do not bless. Surface to the
     human — this is the archive-blast / re-send guard doing its job.
5. Only if it's the single intended letter: `bundle exec ruby scripts/check-email-feed.rb --bless`
   (records it in `scripts/email-feed-manifest.txt`). `--bless` REFUSES a >1-added or
   removed+added (re-send) change unless you also pass `--force` — only do that after
   the human explicitly confirms they mean to send multiple / re-send.
6. Commit the post + the manifest together, then push. The pre-push hook re-validates.
7. GitHub Pages rebuilds; Kit's RSS automation **drafts** the email (auto-send is OFF).
8. Tell the human: open Kit, do the final pass (subject, preheader, read it through),
   **send a test to yourself**, then press Send. The send is always theirs, in Kit.

## 🧰 Safety tooling (don't bypass)
- `scripts/check-email-feed.rb` — validator (structure, email-safety, change tripwire).
  Run via `bundle exec ruby`. `--bless` approves the current emailable set.
- `scripts/email-feed-manifest.txt` — committed approval ledger of emailable letters.
- `.githooks/pre-push` — builds + validates on every push. Enable once per clone:
  `git config core.hooksPath .githooks` (verify it's set; set it if not).
- NEVER `--bless` to silence a >1-added or any-removed warning without explicit human
  sign-off. NEVER turn Kit auto-send ON.

## ✍️ Drafts — work without publishing or emailing
- Put work-in-progress in **`_drafts/`** (undated filename). Jekyll does NOT build
  drafts → never on the site, never in the feed, never seen by Kit.
- **Future-dated** posts also don't publish (Jekyll skips future by default;
  `future: false`). 
- Preview drafts locally only: `bundle exec jekyll serve --drafts`.
- Never add `newsletter: true` to a post until it is genuinely ready to email.

## 🏗️ Build / housekeeping
- Stock GitHub Pages build (`github-pages` gem, safe mode) — **no custom plugins**.
  Production runs Liquid only; committed `_site/` is ignored.
- Internal docs are excluded from the build in `_config.yml`: `PLAN.md`,
  `FOR-CHIELO.md`, `CLAUDE.md`, `README.md`, `BRAND-AND-UX.md`.
- House style for posts + the include "kit": see `README.md` and `BRAND-AND-UX.md`.
- Verify changes with `bundle exec jekyll build` before trusting them.
