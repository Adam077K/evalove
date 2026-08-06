# Long-Term Memory
*Cross-session facts: user preferences, recurring patterns, things every session should know. 100-line cap — compress quarterly.*

## User
- **Name:** Adam (founder). The other user is **Eva** — they are the only two users.
- **Communication:** direct, numbers first. Short answers. Will reverse his own decision when given a better argument — he did exactly that on the band material, so **argue, don't comply.**
- **He judges designs on sight, in one sentence.** Show pixels before documents. A sketch he can look at beats a paragraph describing it.
- **The slop test is his alone**, by name in both governing documents. **No agent may return a verdict on it.** A design-critic's PASS on it was struck. Two design directions have already failed it.
- **Eva has never been asked a single question.** Every claim about her half of this product is Adam's account, not a finding. Her motif is sunflowers — one of the only first-person facts that exists about her.

## Project
- **Evalove** · https://github.com/Adam077K/evalove · evalove.com · stack in CLAUDE.md
- **393×852 is the only viewport that counts.** Two users, both on phones. There is no desktop story.
- **Stage:** Stage 1 UI + the photo path. Design repair, not greenfield.
- **The governing sentence:** *paper is what they made; deco is the distance between them.* Material allocation follows from it — e.g. the two clocks are DECO, because the hours apart are the one thing neither of them chose.

## Recurring patterns
<!-- Things that have gone wrong more than once. Each has cost real time. -->

- **A fact true in one checkout, assumed global.** Three instances in a single day: `jsdom`
  installed in only one worktree (two test files silently didn't run, suite still green);
  `middleware.ts` read in the one tree holding an uncommitted patch (produced a brief telling
  three workers there was no auth wall); `DECISIONS.md` written into a five-commit-stale
  checkout (would have deleted four entries). **Confirm checkout currency before writing to a
  shared file. Run `pnpm install` before trusting any test count.**
- **A green check on an instrument pointed at the wrong thing.** An e2e route array that
  passed while measuring the wrong page; `jsdom`; and a regression test written *inside* a QA
  gate asserting the wrong window, which would have kept passing if the real one broke.
  **An empty return is indistinguishable from a clean one.**
- **Agents return verdicts on things they cannot assess.** Ask every reviewer for its
  NOT ASSESSED list explicitly and treat a short one as suspicious. A longer list is better work.
- **An idle signal is not a completion.** Agents have gone idle with deliverables unwritten
  and work uncommitted. **Verify returns against `git log` and the filesystem, not the
  agent's own account.**
- **Passes QA, fails use.** Seven PASS verdicts were issued on an app Adam then called "very,
  very bad." Every review checked whether the code was *correct*; none could open a page.
  **Use the app before you read it.**
- **Every real finding this project has produced came from two agents disagreeing**, never
  from one being careful. Brief agents to argue back and give them a `disagreements` field.

## Standing constraints
- **Workers cannot authenticate.** There is no legitimate session path. Four agents have
  stalled on this; three were stopped forcing it (middleware bypass, minting a token against
  the real `SESSION_SECRET`, symlinking `.env.local`). **One worker refused a technically
  available route and escalated — that refusal became project law.**
- **The permission classifier blocks agent writes to `apps/web/middleware.ts`.** Correctly. A
  worker asked the CEO to land a blocked edit on its behalf; refused as permission laundering.
  **Auth-boundary changes need Adam's own hand.**
- **`lib/shared-day/` is untouchable** — 109 tests, four DST transitions.
- **Behavioural law:** no counters/streaks/scorekeeping · **no "seen" status, ever** ·
  absolute timestamps only · **photographs never filtered, dimmed or tinted — ink included** ·
  Eva's name before Adam's · no emoji · **no prepared places** (a control that does not do the
  thing it appears to do is a violation, not a stub) · composing is never solicited ·
  nothing is ever consumed.
- **The ornament rule:** *a material earns its place by doing a job, or by being placed by a
  hand. "The page looked empty" is never a job.* Fasteners may be app-placed; ornaments never.

## Vendor lock-ins (accepted)
<!-- Each entry: vendor · why · review trigger date · export-path commitment -->
- None recorded.
