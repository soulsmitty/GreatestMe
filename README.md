# GreatestMe

A 13-week goal journal for your phone. Set up to three goals, break them into weekly milestones, show up every morning and evening, review each week, and finish with a quarterly review.

**Open it:** https://soulsmitty.github.io/GreatestMe/. On iPhone, tap Share → Add to Home Screen to use it like an app.

## Features

- **Today:** guided morning and evening rituals, three targets, habits, three progress rings, and a calendar that unfolds from this week into the month.
- **Week:** weekly plan, milestones due, habit grid, and a weekly review with scores.
- **Goals:** SMART goals with a why, key actions, accountability, a reward, and milestones by week.
- **Habits and Progress:** streaks, heatmaps, badges, trends, and a quarterly review.
- **Guides:** each page explains itself on your first visit, and Settings → Help holds the full GreatestMe Method.
- **Looks:** fifteen themes, plus **Surprise me** for a new one each session.
- **Accounts:** sign in with email or Google, and your journal syncs live across your devices. It also works offline.
- **Partner:** optional. Share a small summary with one accountability partner.
- **Reminders and recaps:** reminders go into your phone's Calendar, and themed recap emails arrive daily and weekly.

## Privacy

Each journal is private to its owner. Data is stored in Supabase, whose access rules let each account read only its own entries. A partner sees only the summary you choose to share.

## Development

- `app.html` is the whole app. Run `./build.sh` to produce `index.html`.
- `tests/journeys.js` runs real-user journeys in Playwright. They must pass before each deploy (`.github/workflows/pages.yml`).
- `supabase/schema.sql` sets up the database and its access rules.
- `scripts/recaps.mjs` sends the recap emails on a schedule (`.github/workflows/recaps.yml`).
- `icons/` holds the home-screen and tab icons and the app manifest for each look (made by `node scripts/icons.mjs`). `themes/` holds the theme images.
- `docs/` holds the quality bar, the design-review checklist and the plan for a future native iOS app.
