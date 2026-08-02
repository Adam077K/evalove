---
date: 2026-08-02
from: ceo (session ceo-2-1785631504)
to: the reimagining team
status: OPEN BRIEF — the current build is rejected; the concept is open
authority: founder-granted. You may change anything not in §4.
---

# Reimagine Eva & Adam

## 0. Read this part twice

There is a working app at **https://eva-and-adam.vercel.app**. The founder's verdict on it:

> *"It's really bad. I don't think it looks good. It looks terrible. There is no functionality. It's not the app that we are looking for."*
> *"Now what I see, it's the vibe coding AI slop."*

That is the second rejection. The first produced a restrained, typographic "book" direction; the second produced a saturated, glassy, rounded-card direction. **Both were executed faithfully. Both were wrong.** The problem is not the execution and it is not the palette.

Here is the honest diagnosis, and it is the most useful thing in this document:

**Every previous agent started from our own documents.** A PRD, an architecture doc, a design direction — each written by another agent, each internally coherent, none grounded in a real product anyone would want to open. Coherent documents produced a coherent app that nobody wants. That is what "AI slop" means here: it is not ugly, it is *unfelt*. It reads as a plausible average of a thousand apps rather than a thing made for two specific people.

**So do not start from our documents.** Start from three things, in this order:

1. **Look at the actual app.** Not a screenshot. Open it, click it, feel it.
2. **Look at excellent products.** Real ones, shipped, that people love. Use the tools in §5.
3. **Look at these two people's actual life.** §2. It is unusual and specific and it is the only real design constraint that matters.

Then tell us what this app should be. You are allowed to say it should be something quite different from what exists.

---

## 1. What exists right now

**Live:** https://eva-and-adam.vercel.app — deployed, real Supabase behind it.

Seven surfaces, all rendering **fixtures** (fake data): `home` · `book` · `today` · `dates` · `send` · `echo` · `pocket`.

**To run it locally with real data:**
```
cd apps/web && npx next dev -p 4320
```
Environment variables are set in Vercel; ask the CEO for local values if you need them. The database is live: two members (Eva, `America/New_York`; Adam, `Asia/Jerusalem`), eleven migrations applied, RLS deny-all verified.

**What is genuinely good underneath, and should not be thrown away lightly:**

| Asset | Why it's worth keeping |
|---|---|
| `apps/web/lib/shared-day/` | The day model. 109 tests. Knows both people's local dates at any instant, handles all four DST transitions, and provably cannot file a photo on a day that's already complete. **This is real engineering and it is the app's one genuine differentiator.** |
| `docs/10-activity-library/library.json` | **98 researched date ideas, 179 sources**, indexed by nine real time-windows named in the couple's own language — "Eva's in bed, Adam's awake", "Eva's lunch break", "Saturday — go long". Currently almost invisible in the product. This is a large, unexploited asset. |
| The photo pipeline | EXIF/GPS stripped before upload, verified against a real iPhone HEIC. Durable outbox that survives a dropped connection. |
| `docs/04-features/AI-PARTNER-SPEC.md` | A genuinely careful spec for the AI feature ("Echo"), including what it must never do. |

**What is not built:** nothing is wired. The screens show fake photos. Login exists but has never been used.

---

## 2. Who this is for — the only constraint that really matters

Two people. **Forever.** No third user, no signup, no growth, no monetisation. If a feature only makes sense with more users, it is wrong.

**Eva is in New York. Adam is in Israel.**

- **Six or seven hours apart** — seven for ~339 days a year, six for ~26, because the two countries change clocks on different dates.
- **Adam works Sunday–Thursday. Eva works Monday–Friday.** So **Saturday is their only shared day off.** One day a week.
- For seven hours of every day they are **on different calendar dates.**
- Their largest shared awake window is Adam's early morning against Eva's late night.

Sit with that. It is not "a couple who miss each other." It is two people whose waking lives barely overlap, who get one shared day a week, and for whom *the gap is the medium* — one of them is always awake to leave something the other will find.

The founder's own words for what he wants:

> *"an app that we, as long distance, can do things — the dates and the book and the daily interactions, send small images and pictures of each other, a place where we can go and look at pictures of us together or see cute stuff or get date ideas or talk to an AI that represents the other partner. **Think big.**"*

---

## 3. Your actual job

**Reimagine the product, then build the best version of it you can.**

Not a reskin. You are explicitly authorised to change:

- What the app **is** and what it's for
- What the surfaces are, how many, and what they're called
- The entire visual language
- The navigation and the whole user journey
- What happens on first open, on day one, on day two hundred
- Which of the 98 date ideas surface, and how
- Whether the "book" metaphor survives at all

**Questions worth actually answering, rather than assuming:**

- What does Eva do at 11pm in New York when Adam has been asleep for six hours? What is the app *for* in that moment?
- What does Adam do at 5am when Eva has just gone to bed?
- What makes them open it on a Tuesday when nothing is happening?
- What does it feel like on the 200th day, when it holds two hundred days of their life?
- What does Saturday — their one shared day — look like in this app?
- The 98 date ideas are indexed by time-window. What is the *interaction* that makes that useful mid-video-call, when browsing a list is a failure state?

**Dream big and then be concrete.** An idea that can't be built this week is still worth writing down, but the deliverable includes something running.

---

## 4. The genuinely immovable

Short list. Everything not here is yours.

1. **Two users, forever.** No signup, no multi-tenancy, no growth mechanics.
2. **Privacy is a security property, not a feature.** Anything marked private never appears in an ordinary view, thumbnail, preview, cache or notification. Reaching it is deliberate and re-authenticated. GPS is stripped from every photo before upload. This is non-negotiable and it is already built — don't break it.
3. **Nothing that makes a missed day feel like failure.** No streak that breaks, no guilt mechanic, no "you haven't posted." The gap is already hard enough. *(This is a founder decision — if you think you have a better answer, argue it, don't just do it.)*
4. **Eva's name comes first** wherever both appear. Founder decision.
5. **English only.**
6. **No Eden imagery.** They're two people named Eva and Adam; the founder chose their names, not a myth.
7. **It must work on an iPhone** — installed to the home screen, iOS 26, both of them. No app store.

Note what is *not* on this list: the book, the page-turn, the two-ink colour system, the dial, the seven surfaces, the names of things, the daily photo ritual. All open.

---

## 5. Tools — use them, this is the part previous attempts skipped

**Two previous design passes never looked at a single real product.** One of them said so in its own document: refero and Playwright were unavailable, so its reference list was written from memory. Do not repeat that.

| Tool | Use it for |
|---|---|
| `mcp__refero__*` | **Search real, shipped product screens and flows by style, by pattern, by industry.** Load via ToolSearch. This is the highest-value tool in this brief. |
| `mcp__playwright__*` | Drive the live app and real reference sites. Capture motion, not just stills. |
| `mcp__claude-in-chrome__*` | Browse reference products interactively |
| `WebSearch` / `WebFetch` | Find what's actually good right now, not what was good in 2023 |

**Look at motion, not screenshots.** The difference between a product that feels expensive and one that doesn't is almost never the colour — it's how things move, how they respond to touch, and how much is happening in the first 200ms.

---

## 6. References

**The founder's own folder — look at all five, they are the strongest signal of his taste:**
```
/Users/adamks/Downloads/Eva & Adam -app deisgn inspo
```
Four are rich, saturated, layered consumer apps (a pink/lilac events app, a hot-pink memories app, a purple Time Capsule app, a peach reading app). One is a restrained editorial furniture site. **The Time Capsule one is conceptually important**: sealed things opened later is exactly the shape of this couple's life — one leaves something, the other finds it hours later.

**Go find your own references too.** Categories worth studying, not as things to copy but as quality bars:

- Products built around **one relationship** rather than a network
- Products where **time and place are the interface** (weather, world clocks, astronomy apps)
- Products with **genuinely excellent motion** — Family, Arc, Things, Linear, Raycast
- **Physical objects** that hold memories: photo albums, letter boxes, keepsake tins, advent calendars
- Anything that makes **asynchrony feel like a gift rather than a delay** — this is the hardest and most important one

---

## 7. Skills — read these

**Concept and journey** (read before designing anything):
1. `.claude/skills/brainstorming/SKILL.md` — disciplined divergence before convergence
2. `.claude/skills/product-manager-toolkit/SKILL.md`
3. `.claude/skills/onboarding-cro/SKILL.md` — first-open is the highest-stakes screen
4. `.claude/skills/page-cro/SKILL.md`

**Craft** (read before writing components):
5. `.claude/skills/high-end-visual-design/SKILL.md`
6. `.claude/skills/frontend-design/SKILL.md` — non-templated visual identity
7. `.claude/skills/design-taste-frontend/SKILL.md` — overrides default LLM visual bias
8. `~/.claude/skills/ui-typography/SKILL.md`
9. `.claude/skills/emilkowal-animations/SKILL.md`
10. `~/.claude/skills/12-principles-of-animation/SKILL.md`
11. `.claude/skills/tailwind-patterns/SKILL.md` · `.claude/skills/radix-ui-design-system/SKILL.md`
12. `.claude/skills/wcag-audit-patterns/SKILL.md` — keep text at AA whatever palette you choose

**Judgement:**
13. `~/.claude/skills/design-audit/SKILL.md`
14. `.claude/skills/web-design-guidelines/SKILL.md`

You may install and use any dependency you need — `motion` is already in. The old ban on libraries is lifted.

---

## 8. Deliverables

1. **`docs/04-features/PRODUCT-VISION-V2.md`** — what this app should be, and why. Written for a person, not a spec template. Include what you'd cut from the current product and why. If your answer is "the concept is wrong, here is a better one," say that plainly.
2. **A user journey** — first open, day one, day two, day thirty, day two hundred. What makes them open it. What they feel.
3. **A design system, as code**, replacing what's there.
4. **The three highest-value surfaces, built and running**, in the new language. You choose which three; justify the choice.
5. **A written comparison** — your work against three real products you studied, honest about where yours is still worse.

## 9. How to work

- `apps/web/` — Next 16, React 19, TS strict, Tailwind v4. 251 tests currently pass; don't break them.
- **Commit constantly.** Your turn budget counts thinking turns, not just tool calls. Several previous agents lost hours of work by finishing everything and committing nothing. A committed half beats an uncommitted whole.
- Return `status: PARTIAL` with committed work rather than stopping silently.
- **Flag judgement calls back to the CEO rather than burying them.** Every agent on this project that did so saved real work.

## 10. The bar

The founder will look at this and say either *"yes, that's it"* or *"that's AI slop."* Two directions have already failed. Assume the safe, average, plausible answer fails again.

**Make something that could only exist for these two people.**
