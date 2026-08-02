# User Insights
*Customer language, pain phrases, jobs-to-be-done. Only CMO + CPO may write here.*

> **Scope note:** this repo's active project is **Eva & Adam**, a private LDR app for **one couple,
> two users, forever**. **Eva is in New York** (works Mon–Fri); **Adam is in Israel** (works Sun–Thu).
> "Customer language" here means the founder's and the couple's own words — there is no market to
> sample, and that is by design. The template personas in `docs/01-foundation/` are stale, not
> current (DECISIONS.md 2026-08-02).
>
> **Copy rules, locked:** third person, real names, **Eva before Adam everywhere**. English only.
> **No Eden/garden theming** — they are two people named Eva and Adam; the founder chose their
> names, not a myth.

## Personas

### The couple (the entire user base)
- **Who:** two partners, 7 hours apart (6 hours for ~26 days a year — see PRD §2), offset work weeks, one shared day off (Saturday).
- **Primary pain:** no shared evening, no shared calendar day. Every consumer couple app assumes both.
- **Churn trigger (the equivalent):** the app becomes a chore. A streak that punishes, a list that has to be browsed, a notification that arrives at 3am.

## Recurring pain phrases

*Source: founder brief via CEO, 2026-08-02. Verbatim.*

- **"lots more of those cute little things"** — the real ask behind the feature list; ornament and texture are the product, not decoration on it.
- **"see what we do, but you feel connected"** — the daily picture exchange. Ordinary life, not highlights.
- **"they open this mid-call; browsing a list is a failure state"** — the constraint that kills any menu-shaped UI.
- **"worth staying up for"** — their name for W6 (his 1–5am). Notable: the cost is in the name.
- **"an object you own rather than software"** — the aesthetic brief. Paper, page-turns, the book metaphor.
- The nine windows in their own language: *she's in bed / he's awake · she's up early · her commute · her lunch break · he's fading / she's just off work · worth staying up for · Saturday, their only shared day off · his Friday off / she works · her Sunday off / he works.* **Use these words. Never "W1"–"W9" in any UI.** (Locked: DECISIONS.md 2026-08-02.)

## JTBD

- *When we're on a call and neither of us can think of anything, I want to be told one thing to do, so that we're doing it in ten seconds instead of scrolling for five minutes.*
- *When something ordinary happens in my day, I want to send one picture of it, so that they see my actual life and not a curated version of it.*
- *When I wake up seven hours after their day ended, I want what they left waiting, so that the first thing in my morning is their evening.*
- *When it's my lunch break and I'm in public with a hard stop, I want only things that finish in time and won't embarrass me, so that I don't have to explain my constraints to an app.*
- *When I'm on the subway with my hands full, I want something that works with my eyes closed, so that the commute is time with them instead of time away.*

## Founder preferences revealed through decisions (2026-08-02)

- **A counter with no end in sight reads as pressure, not comfort.** Founder cut the days-until-we're-together countdown rather than ship a placeholder, and ruled out every substitute (days apart, days since we met, time elapsed). *The whole arithmetic-of-separation register is off the table.* Applies to any future feature, not just that one.
- **The count must never be losable.** Explicitly the inverse of the Duolingo mechanic: days both showed up are counted, a missed day simply isn't, nothing resets. Anything that could make a missed day feel like failure is wrong.
- **Real names, never second person.** "Your partner" and "they" are not acceptable substitutes in copy.
- **The app will hold genuinely private content** — intimate photos and voice notes. Which collides with a book you turn pages in, in public, on her lunch break.

## Research-derived insight (not couple-stated, but load-bearing)

- **Mundane beats curated.** Stafford & Merolla (2007, *JSPR* 24(1)) found LDR couples idealize each other more, and that idealization plus long gaps predicts instability at reunion. This is why the daily picture is ordinary-life-shaped and why the product has no highlight reel.
- **Asymmetry is the shape, not a compromise.** 60 of 98 researched activities are `works_asymmetric` — one person is deliberately the passive one. Features letting one leave something for the other to find are structurally right; features requiring simultaneous presence fight their reality.
- **Saturday is a single point of failure.** 20 of 24 both-alert activities land there with no weekday substitute.

## Source log

| Date | Channel | Data points | Collected by |
|---|---|---|---|
| 2026-08-02 | Founder brief via CEO (LDR app spec) | 6 verbatim phrases + 9 window names | CPO |
| 2026-08-02 | 7-thread research synthesis → `docs/10-activity-library/` | 98 activities, 179 sources, 3 peer-reviewed LDR findings | Research-Lead (consumed by CPO) |

> **Still missing:** zero first-person community sourcing (Reddit was tool-blocked for the entire research
> session), and no taste profile — all activity ranking is logistics-only. PRD §7 C25 collects taste
> passively in Phase 2; `build_library.py` already has the re-rank hook waiting.
