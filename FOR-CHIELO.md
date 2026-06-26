# FOR-CHIELO.md — running the Circle Letters newsletter

Plain how-to for the email newsletter. (Full detail + the "why" lives in `PLAN.md`.)

## The one rule that keeps you safe
Kit's RSS is set to **"Send automatically" = OFF**, so Kit only ever **drafts** a letter's
email — it never sends on its own. A human opens the draft and clicks **Send**.
**Never turn that off-setting on.** Worst case of any mistake = a draft you delete.

That's the whole safety model: a letter goes out only when **(1)** you publish a post **and
(2)** you click **Send** in Kit.

## How to send a letter
Just tell Claude Code: **"I'm ready to send the [name] letter."** What happens:
1. It's published as a normal post on the site (every post is a newsletter).
2. Kit notices it and **drafts** the email — within minutes to a few hours. It does NOT send.
3. You open the draft, give it a final pass (subject line, a read-through), **send a test to
   yourself**, then **Send**.

➡️ **Your drafts wait here:** https://app.kit.com/campaigns?status=draft

## Good to know
- **One sign-up form** for everyone: *Circle Jekll – Join Open Invite*. Everyone gets the
  same letters; new sign-ups confirm by email and land on `/confirmed/`.
- **Work in progress?** Put it in a `_drafts/` folder (or future-date it) — it won't publish,
  so it can't email. To publish a post *without* emailing it, add `newsletter: false`.
- **Very long letter?** Drop `<!--more-->` where the email should stop; it adds a "Continue
  reading" link to the web (keeps it under Gmail's ~102KB clip).
- **The email won't look as fancy as the website — that's fine.** Kit keeps email simple.
  The fully designed letter lives on the web; the email is a clean, readable copy that links
  there. Don't sink time into pixel-perfect email — low ROI.

## ⭐ One Kit task for Chielo (optional)
The About page "invite me to help" CTA now lands partnership inquiries on the normal list.
If you want to tell them apart, add a hidden field or tag to the form **in Kit**.

## Still open
- **Welcome email** that sets cadence/expectations (cuts spam complaints).
- **Google Postmaster Tools** (monitor deliverability).
- Finish the **dry-run check** — confirm a test email looks right in the inbox.
