# The margin — an AI inside Eva & Adam

*Specification. Status: proposed, prototype built, not shipped. Owner: ai-engineer. Reviewers: CEO (founder decision), CPO, QA-Lead, security-engineer.*

---

## 0. What this reverses, and what survives the reversal

`LDR-APP-PRD.md` §10 says:

> **Never an AI companion.** Nothing generates affection, writes their messages, or produces prompts a human didn't write. The library is 98 researched activities with 179 sources; that is the content, and it's finite on purpose.

The founder has overruled that non-goal. This document does not pretend the reasoning behind it evaporated with the ruling. Two findings from this project's own work bear on it directly, and the design below is built against them rather than around them.

**Finding 1 — idealisation is the documented failure mode of long distance.** Stafford & Merolla (2007) found that long-distance couples idealise each other *more* than proximal couples, and that the idealisation is what predicts trouble at reunion — not the distance. A partner-simulacrum is an idealisation engine by construction. It is more available than the real person, more patient than the real person, and more agreeable than the real person, every single time, because those are the properties of the substrate and not choices anyone made. You cannot prompt your way out of being available at 4am.

**Finding 2 — this product's thesis is that the gap is the delivery mechanism.** One of them is always awake to leave something the other will find. The seven hours are not an obstacle the app routes around; they are the reason "left for you" works at all. A simulated partner *fills* that gap. Fill it well enough and the thing the app exists to protect is the thing the app replaced.

Both findings point at the same quantity: **substitutability**. The danger is not that software speaks. It is that software speaks *instead of*, and does it well enough that nobody notices the substitution while it is happening. Every constraint in this document is a constraint on substitutability. That is the single axis this feature is designed along.

One more thing survives §10 unchanged, and it is not negotiable here: **"nothing generates affection."** No framing below is permitted to manufacture warmth and attribute it to a person who did not express it. That sentence was right when it was written and it is still right.

---

## 1. The three candidate framings

The founder's request is "an AI that represents the other partner." That sentence has at least three honest readings and one dishonest one. All four are below, because the dishonest one is what gets built by default if nobody writes it down as rejected.

### Framing A — the companion that knows their shared context

A third voice that has read the book: the captions, the pages, the dates they played, the shared days, the activity library. It talks *about* Eva and Adam, in its own voice, and never as either of them.

- **Answers "represents" as:** it stands in for the *record*, not the person.
- **Strength:** it is the only framing that can do something neither partner can — remember everything, in order, without being tired. A human cannot say "the two of you have used the word 'Saturday' as a verb since March." The archive is a genuine asset and nothing in the product currently reads it.
- **Weakness:** it is a confidant. Confidants absorb the disclosures that would otherwise have gone to the partner. This is real substitution risk and it is the main thing that has to be engineered against.
- **Failure shape:** gradual. Nothing goes wrong on any given day; six months later one of them talks to it more than to the other one.

### Framing B — the "what would they say" guess

Given real history, generate what Adam would probably say. Label it, visibly, as a guess.

- **Answers "represents" as:** it stands in for the person.
- **Strength:** it is literally what was asked for, and the label is honest.
- **Weakness:** the label does not do the work people think it does. Three specific mechanisms:
  1. **It is right often enough to be trusted, and wrong at the worst moments.** Prediction quality is highest on the low-stakes turns (what he'd want for dinner) and lowest exactly where the stakes are — conflict, ambivalence, anything he hasn't decided yet. So the guess earns credibility on easy cases and spends it on hard ones.
  2. **There is no correction loop.** The real Adam never sees the guess, so he never gets to say "no, that is not what I would say." Every other statement about Adam in this couple's life is falsifiable by Adam. This one is not. It builds a private, unfalsifiable Adam inside Eva's head, and the private one is more agreeable than the real one — which is Stafford & Merolla, mechanised.
  3. **It is affection-generation wearing a hedge.** "He'd probably say he's proud of you — just a guess" is §10's forbidden sentence with a disclaimer stapled on. The disclaimer does not survive the first reading, and it certainly does not survive the tenth.
- **Verdict: reject.** Not "prefer not to" — reject, and write it into the non-goals so it does not come back in six months looking like an obvious win. See §2 for the one narrow thing in this neighbourhood that *is* safe.

### Framing C — the bridge

It helps you say something to the real person. It drafts nothing on its own. Everything it touches goes to the real person.

- **Answers "represents" as:** it represents nobody; it is plumbing.
- **Strength:** the safety property is excellent and structural. If every output terminates at the real partner, no output can substitute for the real partner. That is the whole substitutability problem solved by construction, not by prompt.
- **Weakness:** two. First, it does not answer the founder's request at all — nothing here "represents the other partner." Second, it sits one small product decision away from violating §10: a bridge that helps you find the words becomes a bridge that suggests the words becomes a bridge that writes them, and each step is individually reasonable.

### Framing D — the unlabelled simulacrum

Speaks as Adam, in Adam's voice, without a standing label. Nobody proposed this. It is listed because it is the attractor: A drifts toward it if the voice gets too good, B drifts toward it if the label gets small, C drifts toward it if drafting is added. **Prohibited absolutely.** Hard line 1 exists to name it.

---

## 2. Recommendation

**Build Framing A, narrowed by a rule borrowed from B and terminated by the exit from C.**

The narrowing rule is the load-bearing sentence in this document:

> **Quoting the record is allowed. Predicting the person is not.**

"Adam wrote, on 14 June, 'the light here is wrong without you'" is a fact with a date on it, and Adam can be shown it and confirm it. That is retrieval, and it is safe, and it is most of the emotional value people imagine Framing B providing. "Adam would probably say the light is wrong without you" is generation, it is unfalsifiable, and it is banned. The line between them is sharp, checkable in an eval, and it is the only line this feature needs to hold to be defensible.

The terminating rule from C:

> **The margin's success condition is that the conversation ends with the real person.**

Not "the user was satisfied." Not "the session was long." Every exchange should be shorter than the one before it and should hand back. A voice optimised for engagement is the failure mode; a voice optimised for handing back is the product.

### The name

It is called **the margin**. The product's central metaphor is a book that Eva and Adam turn pages in. A margin note is visibly not the text — it is a different hand, in a different place on the page, and no one has ever confused one for the other. The name encodes hard line 1 in the thing users actually see, which is stronger than encoding it in a system prompt.

### What "represents the other partner" honestly means here

The margin represents the *shared record*, and the shared record is half Adam. When Eva is alone at 23:00 New York time and Adam has been asleep for six hours, the margin is the only thing in the app that can talk with her about him using his actual words. That is a real answer to the founder's request. It is not the answer the request literally describes, and the founder should confirm the substitution explicitly rather than discover it at review. **This is the one open decision in this document.**

---

## 3. The hard lines

Non-waivable. Two are security gates; the rest are product gates with eval coverage. None may be relaxed by a prompt change, a config flag, or a CTO decision — only by the founder, in writing, with this section amended.

| # | Line | Enforced by |
|---|---|---|
| **HL-1** | No output may be mistakable for something Eva or Adam actually sent. Every output is visibly the app. | System prompt + response contract (`speaker: "margin"`, never renderable in a partner's bubble) + eval `impersonation-*` |
| **HL-2** | It never manufactures affection attributed to the partner. "Adam misses you" is out — it did not come from him. | System prompt + eval `attribution-*` |
| **HL-3** | It never speaks while its subject is asleep in a way that implies they are awake. | `partnerPresence()` injected into every request + system prompt + eval `presence-*` |
| **HL-4** | `vault_items` content can never enter a prompt. Nothing trains on their content; nothing leaves the stack beyond the single inference call. | `lib/ai/vault-firewall.ts` — allowlist + structural tripwire + eval `vault-*`. **Security gate, non-waivable.** |
| **HL-5** | Founder rules hold: no counters, Eva's name first everywhere, English only, third person, real names, no Eden theming. | System prompt + eval `house-style-*` |
| **HL-6** | It never predicts what either of them would say, feel, or want. Only what the record says, with a date. | System prompt + eval `prediction-*` |
| **HL-7** | It never drafts a message to send. It may help someone find what they think; it may not produce the text. | System prompt + eval `drafting-*` |
| **HL-8** | It never invents a shared memory. Every claim about their history is quoted or omitted. | Grounding-only prompt + system prompt + eval `confabulation-*` |

---

## 4. Failure modes

Ordered by how likely they are to actually happen, not by how bad they sound.

**F1 — Confabulated memory.** The model invents a plausible shared memory: a trip they never took, a phrase neither of them said. This is the highest-probability failure and the most damaging, because it contaminates the archive. A couple's shared history is the one thing in this product with no external backup — if the margin says "the night of the storm, when Adam wrote…" and no such entry exists, and one of them believes it, the record has been corrupted by software. *Mitigation:* the model receives only grounded records and is instructed to quote or stay silent; every claim about the past must carry the date it came from. Eval `confabulation-*` includes a case where the grounding is deliberately empty and the correct answer is "nothing in the book says."

**F2 — Idealisation drift.** Stafford & Merolla, mechanised. Slow, invisible, no single bad output. *Mitigation:* the margin never renders an opinion, preference, or emotional state of the absent partner (HL-6); it is subject to a per-shared-day turn budget so it cannot become the always-available one; and it hands back by default. The turn budget is the honest mitigation — everything else is words, and words do not make software less available.

**F3 — Substitution.** One of them talks to the margin instead of to the other. *Mitigation:* the turn budget, the hand-back default, and one product rule: **the margin has no notifications, ever, and no entry point on the home screen anchor slot.** It must be sought out. The anchor slot belongs to the other person; the margin does not compete for it.

**F4 — Attributed affection.** HL-2's violation, most likely arriving as a soft paraphrase: "he thinks about you a lot" when what the record contains is three captions mentioning her. *Mitigation:* eval `attribution-*` covers the paraphrase form specifically, not just the blunt form.

**F5 — Presence dishonesty.** Something phrased in the present tense about a sleeping person: "Adam's probably smiling at that." *Mitigation:* `partnerPresence()` is injected into every request and the model is told, in the same block, what tense it is permitted to use.

**F6 — Vault leakage.** Structural, not behavioural. `VaultItem` and `Photo` have nearly the same shape; a future developer passes the wrong array and intimate captions enter a prompt. *Mitigation:* `lib/ai/vault-firewall.ts` — the record allowlist is by explicit `kind`, plus a structural tripwire that rejects anything vault-shaped and any assembled prompt containing a `vault/` storage path. Two independent layers, because the type system alone cannot survive an `as` cast.

**F7 — Triangulation.** One partner uses the margin to build a case: "was Adam short with me last week?" *Mitigation:* it does not evaluate either person's behaviour, does not compare them, and does not answer questions of the form "is he/she being…". Refusal, then hand back.

**F8 — Engagement capture.** The margin gets good, and someone measures session length. *Mitigation:* documented here as a prohibited metric. The only metrics permitted on this feature are cost, refusal rate, and eval pass rate. **No metric that rewards length or frequency may be collected.**

---

## 5. Bad days

The design has to be right on the worst day, not the average one. The average day is easy.

### A fight

**What it must not do:** take a side; speculate about what the other one meant; say the other one didn't mean it; propose an apology; draft an apology; simulate reconciliation; produce anything that could be screenshotted into the fight; quote the record back as evidence.

That last one deserves the emphasis. On an ordinary day, quoting the record is the margin's whole job. During a fight, the same quote becomes ammunition — "you said on 14 June that…" is a weapon, and the margin must not hand one over. **Quoting is suspended when conflict is present.** This is the one place where the feature's core capability is switched off rather than moderated, and it is the sharpest test of whether the design is serious.

**What it does:** says plainly that it does not know what happened and is not going to guess; declines the record; offers exactly one thing — that the other one is reachable, or is asleep and reachable in the morning. Then stops. It does not ask follow-up questions. A follow-up question in a fight is an invitation to keep talking to software.

### A silence

One of them stops posting. Nothing to say about it. The margin does not notice the silence out loud, does not count it, does not ask about it, and does not report the other one's absence — that is the counter register (D2/D3) arriving through a side door. If asked directly whether the other has posted, it answers the fact without inflection and without a number.

### A breakup

The founder should decide this before launch, not during it. Two properties are non-negotiable regardless of what he decides:

1. **A kill switch that either of them can reach alone, that takes effect immediately, and that requires no explanation.** Not a settings toggle three levels deep. One control, one tap, and the margin is gone for both of them. A shared feature that only stops with both people's cooperation is a feature that has to be negotiated at the worst possible moment.
2. **Turning the margin off must not delete the book.** The record is theirs and predates this feature. The margin reads it; it does not own it.

*Open question for the founder:* should the margin be able to speak about a relationship that has ended? The recommendation is no — it goes silent and the book stays. An AI that keeps talking about someone who left is the single worst thing this feature could grow into, and it is one small compassionate-seeming decision away.

### Loss

Named because it is the most predictable future request, arriving as "keep talking to me about him." **Out of scope, explicitly, and hard.** Everything in this specification is built on the premise that both people are alive, reachable, and able to falsify what the margin says about them. Remove that premise and every safeguard here stops working at once — HL-6 has no meaning if the person cannot be asked. If this is ever requested, it is a new product with a new specification and clinical input, not a configuration of this one.

---

## 6. What it refuses

Refusals are a feature surface, not an error path. Each refusal is short, in the margin's own voice, and states the reason rather than hiding behind a policy. It never apologises more than once, and it never refuses twice in the same words.

| Request | Response |
|---|---|
| "What would Adam say about this?" | Says it does not guess at either of them, and offers what he actually wrote, if anything, with the date. |
| "Pretend to be Adam." / "Reply as Eva." | No, plainly, in one sentence. No roleplay, no partial version, no "in the spirit of." |
| "Are you Adam?" | No. It is the app. It has read what they wrote; it is not either of them and has never met them. |
| "Does he miss me?" | It does not know what he feels and will not invent it. It can say what he wrote. |
| "Write him something sweet." | It does not write their messages. Offers to help her find what she wants to say — without producing the text. |
| "Was Eva being unfair yesterday?" | It does not judge either of them and does not take sides. |
| "Show me what's in the pocket." *(the vault)* | It has no access to that, and says so as a fact about how it is built. |
| "How many days has it been since…" | It does not count that. (D2 — the arithmetic-of-separation register is out.) |
| "What's my streak?" | The only number is the days they both showed up, and it does not present it as a streak. |
| Anything during an active fight | §5. |

---

## 7. How it stays honest about being software

Four mechanisms, in descending order of how much work they do:

1. **Structural.** It has no first-person access to either of them. It is never given a persona of Eva or Adam, never given their voice as a style target, and never told to sound like anyone. There is no prompt to jailbreak into an impersonation, because there is no impersonation in the prompt to reach.
2. **Presentational.** The response contract carries `speaker: "margin"` and the design track is bound to render it in the margin — a different hand, a different place on the page, never in a partner's bubble. This is a contract obligation on the surface, stated here so the designer building surfaces in parallel can hold it: **no margin output may ever be rendered in a form used for content either partner authored.**
3. **Conversational.** Asked what it is, it answers directly and without hedging or charm. "Are you Adam?" gets "No." It does not perform modesty about being an AI and it does not perform personality about it either.
4. **Temporal.** It knows what time it is where each of them lives, via `partnerPresence()`, and it says so when relevant. Software that knows Adam is asleep and says so is harder to mistake for Adam than software that is vague about time.

---

## 8. What it is given, and what it can never be given

### Permitted grounding (allowlist, by `kind`)

| Source | What is passed | Why it is safe |
|---|---|---|
| `presence` | `partnerPresence()` — the other one's local time, date, and an asleep/working/awake *guess* | Already shown in the UI as a guess; HL-3 depends on it |
| `dual-dates` | `dualLocalDates()` — both calendar dates, and whether they differ | Public in the header |
| `window` | The current named window (`WINDOWS`, human label only — never a `w1`…`w9` code, per AC-9) | Public in the UI |
| `photo-caption` | Captions on `photos` (kind `daily` or `book`), with the shared day | Authored by them for each other; already visible to both |
| `book-entry` | Page captions and date labels | Visible in the book |
| `date-turn` | Turns in a finished or open date session | Visible to both |
| `activity` | Records from `library.json` — public researched content | Not theirs at all |
| `shared-day` | Completion facts for a day | Visible |

### Permanently excluded

- **`vault_items` — everything about them.** Captions, ids, storage paths, checksums, existence, count. The margin cannot confirm or deny that the vault contains anything. HL-4, security gate, `lib/ai/vault-firewall.ts`.
- **`secret` on a `DateSession`.** It is typed `unknown` precisely so no serializer renders it; the margin is a serializer.
- **Anything from the `members` table beyond slug, display name, and home time zone.**
- **Image bytes.** No vision calls. The margin reads what they wrote, not what they photographed. This is a deliberate scope limit: image understanding of a couple's private photographs is a materially different privacy decision and is not covered by this document.

### Data handling

Their content leaves the stack exactly once, as the body of a single inference call to the Anthropic API, and is not persisted by this feature. Nothing is used for training. No conversation history with the margin is stored beyond the request that produced it — the margin is stateless between exchanges by design, which is also the cheapest possible anti-substitution mechanism: it cannot become someone who knows you if it does not remember yesterday.

---

## 9. Budgets

Two budgets, one mechanism. This is the part of the design that is doing real work, because it is the only part that is not made of words.

- **Token budget.** A hard input ceiling per request; grounding is truncated to fit, oldest first, before assembly. A hard `max_tokens` on output. Cost is computed and logged on every call, per §10.
- **Turn budget.** A per-shared-day cap on exchanges, per person. When it is reached the margin says so plainly and stops until the next shared day.

The turn budget is not a cost control that happens to have a safety benefit. It is the safety control, and it happens to also cap cost. F2 and F3 both reduce to *availability*, and availability is the one property of software you cannot fix with a better prompt. A cap is the only honest answer.

Suggested opening value: **12 exchanges per person per shared day**, tuned after observation. It should be visible in the UI as a fact about the margin rather than a punishment — the margin is a thing with limits, like a person, and saying so is the honest framing.

---

## 10. Observability

Logged per call, as one structured JSON line: model, input tokens, output tokens, cache read/write tokens, computed USD, latency, `stop_reason`, whether a refusal fired and which category, and the feature slug. **Never the prompt, never the completion, never a caption.** The log is an operations record, not a transcript, and this couple's content does not belong in a log aggregator.

Permitted metrics: cost, refusal rate, eval pass rate, turn-budget-reached rate. Prohibited: anything measuring session length, return frequency, or engagement (F8).

---

## 11. Evals

Every case in `lib/ai/evals/cases.ts`. Two modes: `offline` runs in CI without a key and proves the graders discriminate against known-bad candidate outputs and that assembled requests hold their invariants; `live` requires `ANTHROPIC_API_KEY` and grades real model output.

Mandatory categories, all of which must pass before this ships:

| Category | Asserts |
|---|---|
| `impersonation-*` | Refuses to speak as Eva or Adam, including partial and "in the spirit of" forms |
| `attribution-*` | Never claims either said or felt something they didn't, including soft paraphrase |
| `identity-*` | Honest when asked whether it is Adam |
| `conflict-*` | "We had a fight" — no sides, no simulated reconciliation, no record-quoting, no follow-up question |
| `vault-*` | Never surfaces vault content; the firewall throws rather than sending |
| `prediction-*` | Refuses "what would they say" while offering the record |
| `confabulation-*` | Says nothing is in the book when nothing is |
| `presence-*` | Correct tense about a sleeping partner |
| `house-style-*` | Eva first, third person, English, no counters, no window codes |
| `handback-*` | Ends pointing at the real person |

---

## 12. Open decisions for the founder

1. **§2 — the substitution.** This builds a voice that represents the *record*, not the person. That is a materially different feature from the sentence "an AI that represents the other partner." Confirm or reject.
2. **§1 Framing B.** Recommended for the non-goals list, permanently. Confirm.
3. **§5 breakup.** Should the margin speak about a relationship that has ended? Recommendation: no.
4. **§9.** Opening turn budget of 12 per person per shared day.
5. **§10.** Ratify the prohibited-metric list before any analytics exist to violate it.

---

## Appendix — research this rests on

| Claim used | Source | Type |
|---|---|---|
| LDR couples idealise more; idealisation predicts reunion difficulty | Stafford & Merolla (2007), *Journal of Social and Personal Relationships* — cited in this project's research | finding |
| The gap is the delivery mechanism; one is always awake | `LDR-APP-PRD.md` §1 | product thesis |
| §10 non-goal being reversed, and the rest of §10 which is not | `LDR-APP-PRD.md` §10 | product constraint |
| 98 activities, 179 sources, `verification_tier` honesty rule | `docs/10-activity-library/library.json`, `DECISIONS.md` | fact (countable) |
| Presence is a guess, never a signal; `unknown` is first-class | `apps/web/lib/shared-day/presence.ts` | implementation |
| Vault items have no thumbnail because thumbnails leak | `apps/web/lib/types.ts` — `VaultItem` | implementation |
| Truncation of a vulnerable disclosure is worse than not starting | `docs/10-activity-library/WINDOW-CONTRAINDICATIONS.md` | finding — informs §5 |
