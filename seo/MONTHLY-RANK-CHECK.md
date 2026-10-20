# Monthly rank check: instructions for the scheduled Claude run

This file is what a scheduled prompt points at. Follow it exactly. Project folder: `/Users/junyuquick/Documents/Coding-Projects/Loft-Concept/Website`.

## What the run does

1. **Start OpenSEO.** It runs in Docker from `/Users/junyuquick/Documents/Coding-Projects/open-seo`.
   - Remember whether Docker Desktop was already running (`docker info`). If not, start it without bringing it to the front: `open -g -a Docker`, then wait up to 3 minutes for `docker info` to succeed.
   - Then `cd /Users/junyuquick/Documents/Coding-Projects/open-seo && docker compose up -d`.
   - Never run `docker compose down -v` (it erases OpenSEO's data).
2. **Run the check:** `cd /Users/junyuquick/Documents/Coding-Projects/Loft-Concept/Website && /usr/bin/python3 -I seo/rank_check.py`. It looks up 25 phrases in live Google (Singapore, top 40), saves today's positions to `seo/rank-history.json`, and prints a table against the previous month. It costs a few cents of DataForSEO credit.
3. **Write the log.** In `SEO-README.md`, under `## Rank log`, add a new dated `###` entry with: how many phrases are in the top 40 (and last month's number), the phrases that moved or are new, and one plain sentence on what it means. Keep it short and honest. Do not claim a cause for any movement.
4. **Commit and push, only these two files:** `seo/rank-history.json` and `SEO-README.md`. Commit message: `Rank check <date>`. Then `git push origin main`. Check the deploy with `gh run list --limit 1` and report if it fails.
5. **Clean up.** Run `cd /Users/junyuquick/Documents/Coding-Projects/open-seo && docker compose stop`. If you started Docker Desktop in step 1, also run `docker desktop stop`. Check nothing you started is still running.
6. **Report on Telegram** with `/Users/junyuquick/.claude/bin/tg-notify "<summary, max 1000 characters>"`: the number of phrases in the top 40, anything that moved, whether the push and deploy succeeded, and anything that needs the owner's decision.

## What you may and may not do on your own

**Allowed without asking:** everything in the steps above, including pushing those two files.

**Not allowed without the owner's approval:** any change to `src/`, `public/`, `package.json`, `.github/`, or any page content; deleting data; buying credits; changing schedules. If the results suggest a change to the website (for example a page that dropped), describe the idea in the Telegram summary and wait. Do not make it.

## If something goes wrong

- Docker or OpenSEO will not start within 5 minutes: stop, send a Telegram message saying so, and do not retry in a loop.
- OpenSEO reports out of credits: stop and tell the owner. You cannot buy credits.
- More than 5 of the 25 lookups fail: do not write a log entry. Report it.
- The push is rejected because the remote moved: run `git pull --rebase origin main` once. If it does not resolve cleanly, stop and report.
- Never commit unrelated files (`.DS_Store`, `.claude/`, anything not listed above).

## For orientation

- Baseline (21 Oct 2026): only the brand phrase "loft concept singapore" was in the top 40, at position 5. See `SEO-README.md`.
- Positions can move for reasons unrelated to the website. One month is noise. Look at trends over three or more months.
