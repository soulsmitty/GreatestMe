# GreatestMe native app plan (iPhone, iPad, iPhone Duo, Apple Watch)

The web app is the product today. Apple-only experiences are deliberately kept out of it (no placeholders, no permission prompts) and are captured here for the Xcode build. The native app wraps the same accounts and journal (Supabase), so nobody migrates anything. This page lists every Apple integration we want and the data it reads or writes, which already exists in the journal.

## What needs the native app, and why

| Capability | Apple framework | What it does in GreatestMe | Data it uses (already stored) |
| --- | --- | --- | --- |
| Push reminders | UserNotifications | Morning, evening and weekly-review nudges at the times set in Settings, plus "streak at risk" at 8pm if the day is empty. Actionable: "Log a win" without opening the app. | `profile.reminders.{morning,evening,weekly}` |
| Siri and Shortcuts | App Intents + App Shortcuts | "Hey Siri, start my morning ritual", "Log a win: …", "What's my streak?", "Check off Drink 3L water". Shows in Spotlight and the Action button. | day docs `day-<journey>-<date>`, `journey.habits` |
| Apple Intelligence | App Intents (assistant schemas) | Siri can read and act on journal entries in context ("Add this to my gratitude"). | same as above |
| Apple Health: State of Mind | HealthKit `HKStateOfMind` | The evening mood (1–5) is written as a daily mood with valence −1…+1; energy goes in the description. | `day.mood`, `day.energy` |
| Apple Health: Mindful Minutes | HealthKit `HKCategoryTypeIdentifier.mindfulSession` | The morning breathing step is saved as a mindful session. | `day.mindful` (seconds, recorded today) |
| Apple Health: activity habits | HealthKit read (steps, workouts) | Auto-check habits like "Move 30 min" when a workout or step goal is met. | `journey.habits[].name` + a new optional `habit.health` link |
| Widgets | WidgetKit (Home, Lock Screen, StandBy) | Today's three rings, streak flame, next ritual. Interactive habit checkboxes. | day docs, `stats()` |
| Live Activity | ActivityKit | The guided ritual on the Lock Screen and Dynamic Island while it runs. | ritual state |
| Apple Watch | WatchKit + SwiftUI, complications | Check off habits and targets from the wrist, start the breathing step, see rings and streak; complication shows the streak. | day docs |
| Handwriting | PencilKit | Native ink with full Pencil features (pressure, tilt, Scribble, double-tap tools) on the existing ruled templates. | ink pages `ink|<journey>-<date>|p<n>` (convert stroke format) |
| Foldable layout | SwiftUI size classes | iPhone Duo inner screen uses the iPad two-column layout; outer screen uses the phone layout. | — |
| Sign in with Apple | AuthenticationServices + Supabase Apple provider | One-tap sign-in (needs the Apple Developer Program). | Supabase auth |
| Haptics | Core Haptics | The same moments that buzz on the web, with richer patterns. | — |

## Mapping rules

- **Mood → State of Mind valence:** 1 → −1.0, 2 → −0.5, 3 → 0, 4 → +0.5, 5 → +1.0. Kind: daily mood. Label from the evening "improve" text is not sent (privacy).
- **Mindful sessions:** one sample per breathing run, start = ritual start, duration = `day.mindful` delta (10 s to 5 min).
- **One permission moment:** onboarding gets a single "Connect your iPhone" step (notifications + Health types, each approve/deny), shown again from the first-run tour if skipped, and editable in Settings → Permissions.
- **Health in Daily highlights:** steps, active energy, workouts, sleep and water (HealthKit) join the Today highlights gallery with tips drawn from them (e.g. a short walk prompt when steps are low by 3pm, an earlier bedtime nudge after short sleep).

## What already works on the web today

- Reminders as iPhone Calendar alerts (Settings → Reminders → Add to my iPhone Calendar) and Shortcuts time automations.
- Siri via Shortcuts "Open URLs" deep links: `#morning`, `#evening`, `#habits`, `#week`, `#ink`, `#calendar`, `#progress`, `#partner`.
- Home Screen app with offline support, badge count of habits left today, safe areas and foldable-aware layouts.
- Apple Pencil handwriting pages on iPad (pressure, palm rejection).

## Build order when we move to Xcode

1. SwiftUI shell with Supabase auth and the same docs table (read/write, realtime).
2. Notifications + App Intents (biggest daily impact).
3. Widgets and Watch app.
4. HealthKit State of Mind + Mindful Minutes.
5. PencilKit ink, Live Activity, Sign in with Apple.

Requires: Apple Developer Program, a Mac with Xcode, TestFlight to share with Lyllian.
