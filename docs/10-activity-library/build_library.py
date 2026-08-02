#!/usr/bin/env python3
"""
LDR Activity Library — synthesis build.

Reads the seven researcher thread returns from docs/08-agents_work/research/,
applies semantic dedupe + drops, scores every surviving activity against the
couple's nine-window overlap clock, and emits the website's data source plus
the human-readable library and diagnostic matrices.

Run:  python3 build_library.py

DEFERRED TASTE RE-RANK — the hook lives in apply_taste(). See TASTE_PROFILE
below. Drop a profile in, re-run, and every score/tier/shelf regenerates.
No research is re-run and nothing else changes.
"""

import json
import os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
RESEARCH = os.path.normpath(os.path.join(HERE, "..", "08-agents_work", "research"))

THREAD_FILES = [
    ("T1", "2026-08-02-ldr-T1-shareplay-cowatch.json"),
    ("T2", "2026-08-02-ldr-T2-co-presence.json"),
    ("T3", "2026-08-02-ldr-T3-digital-games.json"),
    ("T4", "2026-08-02-ldr-T4-analog-games.json"),
    ("T5", "2026-08-02-ldr-T5-protocols.json"),
    ("T6", "2026-08-02-ldr-T6-decks-journals.json"),
    ("T7", "2026-08-02-ldr-T7-intimacy.json"),
]

WINDOWS = ["w1", "w2", "w3", "w4", "w5", "w6", "w7", "w8", "w9"]
CATEGORIES = ["live-together", "games", "deep-talk", "intimacy"]

# W2 is OPPORTUNISTIC (founder-confirmed 2026-08-02): she is up at NYC 05:00-07:00
# only sometimes, mostly weekends. It is not hunted, not rewarded, and its matrix
# cells are advisory — never RED.
THIN_WINDOWS = ["w3", "w4", "w8", "w9"]
OPPORTUNISTIC_WINDOWS = ["w2"]

# Only w3 and w4 are hard-bounded by an external constraint (transit / a desk with
# a return-to-work deadline). The rest are soft ceilings and are not scored.
HARD_CEILINGS = {"w3": 45, "w4": 60}

WINDOW_LABELS = {
    "w1": "She's in bed, he's awake",
    "w2": "She's up early",
    "w3": "She's on her commute",
    "w4": "Her lunch break",
    "w5": "He's fading, she's just off work",
    "w6": "Worth staying up for",
    "w7": "Saturday — go long",
    "w8": "His Friday off",
    "w9": "Her Sunday off",
}

# Validated against the founder's account of actual behaviour, 2026-08-02.
# Eight of nine windows are now confirmed rather than inferred. W2 was corrected
# mid-flight from "thin window to hunt" to opportunistic; W3 and W4 were checked
# afterwards and both held. Recorded here so no future round re-litigates it.
WINDOW_STATUS = {
    "w1": "confirmed", "w2": "opportunistic", "w3": "confirmed",
    "w4": "confirmed", "w5": "confirmed", "w6": "rare-by-design",
    "w7": "confirmed", "w8": "confirmed", "w9": "confirmed",
}

WINDOW_CHARACTER = {
    "w1": "She's sleepy and lying down; he's fresh and mobile. Cozy, low-light, the biggest window you have.",
    "w2": "Only when she's up early. Brief and quiet. Never plan around it.",
    "w3": "Mobile, hands busy, headphones in. Audio only — nothing that needs a screen.",
    "w4": "A desk or somewhere public, with a hard stop. Discreet and bounded.",
    "w5": "She's energised, he's fading. He should be the passive one here.",
    "w6": "Costs him a night's sleep. Event-grade only — spend it on what can't happen elsewhere.",
    "w7": "Both fresh, no ceiling. The only symmetric window you have, and it carries a lot.",
    "w8": "He has the whole day, she's working. Ambient, low-commitment, resumable.",
    "w9": "She has the whole day, he's working. Mirror of W8.",
}

WINDOW_CLOCK = {
    "w1": "IL 05:00-09:00 / NYC 22:00-02:00",
    "w2": "IL 12:00-14:00 / NYC 05:00-07:00 — opportunistic",
    "w3": "IL 14:00-17:00 / NYC 07:00-10:00",
    "w4": "IL 18:00-21:00 / NYC 11:00-14:00",
    "w5": "IL 22:00-01:00 / NYC 15:00-18:00",
    "w6": "IL 01:00-05:00 / NYC 18:00-22:00",
    "w7": "Saturday, both off",
    "w8": "His Friday off, she works",
    "w9": "Her Sunday off, he works",
}

# ---------------------------------------------------------------------------
# DROPS — judgement-level, applied on top of the mechanical gates the CEO ran.
# ---------------------------------------------------------------------------
DROPS = {
    "t3-codenames-duet-online": (
        "how_it_works is not executable. T3's own gap note states it could not "
        "confirm any currently-live URL hosting the Duet ruleset, and that most "
        "free web clones implement classic team-mode Codenames instead. An entry "
        "that sends the couple to a dead end mid-call is worse than an absent "
        "entry. Re-commission in round 2 with a verified implementation URL."
    ),
}

# ---------------------------------------------------------------------------
# SEMANTIC MERGES — same core mechanic + overlapping tools.
# Window-specific variants are NOT merged: they are separate activities.
# ---------------------------------------------------------------------------
MERGES = [
    {
        "new_id": "ldr-morning-audio-companion",
        "base": "t2-walk-and-talk-commute",
        "absorbs": ["t2-getting-ready-together-speakerphone"],
        "rationale": "Identical mechanic (audio-only, hands-busy, no screen, no obligation to keep talking) across two consecutive moments of the same morning. Two cards for one activity is padding.",
        "overrides": {
            "name": "Morning Audio Companion — Getting Ready, Then the Commute",
            "subcategory": "mobile presence",
            "one_liner": "One audio-only call that runs from her getting-ready routine straight through her commute — speakerphone at home, headphones on the street — with no screen and no obligation to keep talking.",
            "how_it_works": [
                "He calls (a plain phone call or FaceTime Audio) as she starts getting ready — his early-to-mid afternoon, her morning.",
                "At home the phone goes on speaker and gets set down, so both her hands stay free for coffee, teeth, dressing.",
                "There is no obligation to hold constant conversation — comment on what you're doing, go quiet, come back.",
                "When she leaves, she switches to headphones and the same call keeps running through the walk or the train.",
                "Keep it low-stakes and interruptible: she may drop out for a crosswalk, a ticket gate, or a loud carriage.",
                "End when she arrives. No formal goodbye needed — the call just finishes.",
            ],
            "window_fit": ["w2", "w3"],
            "duration_min": 25,
            "tools_needed": ["Phone or FaceTime Audio", "headphones", "speakerphone"],
            "timezone_friction": "The single cleanest fit for W3's hard constraint — audio-only, hands-busy, no screen at any point. Extends back into W2 for the at-home half if she happens to be up early. His afternoon is unhurried enough to run on her clock.",
            "confidence": "low",
        },
    },
    {
        "new_id": "ldr-gamepigeon-imessage-games",
        "base": "t3-gamepigeon-async-board-games",
        "absorbs": ["t3-gamepigeon-timed-word-games", "t3-gamepigeon-arcade-minigames"],
        "rationale": "One app, one install, one mechanic (asynchronous turns inside the iMessage thread), identical window fit and cost. Three cards for one menu is over-representation and would triple-count the strongest W4 cell.",
        "overrides": {
            "name": "GamePigeon — the whole iMessage games library",
            "subcategory": "imessage-correspondence",
            "one_liner": "Twenty-plus turn-based games living inside the iMessage thread they already use — playing a turn looks identical to sending a text, which makes it the most discreet option in the library.",
            "how_it_works": [
                "Asynchronous. A move is sent as an iMessage attachment; the other is notified like any text and answers whenever.",
                "Install once (free) from the apps row inside an existing iMessage conversation. No separate app to open, ever.",
                "Board games — Chess, Checkers, Four in a Row, Gomoku, Reversi, Dots and Boxes, Mancala — have no timer at all and can sit for days.",
                "Timed word games — Word Hunt, Word Bites, Anagrams — send a challenge; each plays their own 90-second run whenever they open it, and the app compares scores.",
                "Arcade minigames — 8-Ball, 9-Ball, Mini Golf, Darts, Basketball, Cup Pong, Archery, Sea Battle, Knockout, Shuffleboard, Filler, Crazy 8, Tanks — are a few quick aim-and-flick turns each with a natural stopping point.",
                "Confirmed live on the Israeli App Store with ILS pricing (GamePigeon+ at NIS 17.90), so there is no storefront split.",
            ],
            "duration_min": 5,
            "confidence": "high",
        },
    },
    {
        "new_id": "ldr-words-correspondence",
        "base": "t3-words-with-friends-2",
        "absorbs": ["t3-wordfeud"],
        "rationale": "Two Scrabble-style correspondence games with the same mechanic, windows, cost and confidence. The only real difference is the per-move clock, which belongs inside one entry as a choice, not as a second entry.",
        "overrides": {
            "name": "Words With Friends 2 — or Wordfeud for a tighter clock",
            "one_liner": "An asynchronous Scrabble-style board that lives in the background of both their days, with a push notification the moment it's their turn.",
            "how_it_works": [
                "Asynchronous. No live session required at any point.",
                "Both install Words With Friends 2 (free) and connect via Game Center or an in-app friend code.",
                "Start a match. WWF2 allows roughly a 10-12 day per-turn window, so nothing ever feels rushed and a busy week can't kill the game.",
                "A push notification fires the moment it's your turn — play it standing in line, at a desk, or in bed.",
                "Choose Wordfeud instead if you want more daily pressure: same game shape, but a firm 72-hour-per-move forfeit clock, which turns it into a daily nudge rather than something that can go stale for a week.",
                "Keep several boards running at once for a low-grade constant thread of contact between calls.",
            ],
            "tools_needed": ["Words With Friends 2 (iOS, free)", "or Wordfeud (iOS, free) for the 72-hour clock"],
            "confidence": "high",
        },
    },
    {
        "new_id": "ldr-duolingo-shared-streak",
        "base": "t3-duolingo-friend-streak",
        "absorbs": ["t3-duolingo-friends-clash"],
        "rationale": "One app, two social features on the same account connection, same windows, same mechanic (independent daily lessons tallied against a shared counter).",
        "overrides": {
            "name": "Duolingo — Friend Streak, plus the weekly Friends Clash",
            "subcategory": "continuity-league",
            "one_liner": "A shared streak that only advances on days both of them did a lesson, with an optional weekly head-to-head XP battle layered on top — neither requires them to be online together, or even learning the same language.",
            "how_it_works": [
                "Asynchronous. Each does their own lesson at their own hour; the counters do the connecting.",
                "Both add each other as Friends in-app (the invite must be accepted). They do not need to be learning the same language.",
                "Start a Friend Streak from the friend's profile. It increases by 1 only on days BOTH complete at least one lesson — a miss by either side breaks it, which is the point.",
                "Because the streak checks 'did you do a lesson today' against each person's own calendar day, the 7-hour offset and the mismatched work week are structurally irrelevant.",
                "Optionally opt into Friends Clash when it appears in the Leagues/social tab: a weekly 1v1 where each partner's ordinary lesson XP is tallied against the other's, resetting every week. (Friends Clash is sourced to a dedicated fan-tracking site rather than Duolingo's own blog — medium confidence, unlike the Friend Streak itself.)",
            ],
            "confidence": "high",
        },
    },
    {
        "new_id": "ldr-bedtime-rose-bud-thorn",
        "base": "t6-bedtime-rose-bud-thorn",
        "absorbs": ["t6-bedtime-best-worst-of-day"],
        "rationale": "The second entry is a strict reduction of the first — same script, same window, same tools, one step removed. A single entry with two intensity levels is both honest and better product design.",
        "overrides": {
            "name": "Rose, Bud, Thorn at Bedtime — with a shorter version for tired nights",
            "one_liner": "A three-line nightly check-in — one good thing, one hard thing, one thing to look forward to — with a two-line fallback for the nights she is already fading.",
            "how_it_works": [
                "Right as she'd normally fall asleep (her 22:00-02:00 = his 05:00-09:00), lights down on her end, audio-only is fine.",
                "FULL VERSION (~10 min): one partner gives their Rose (a good thing from today), then Thorn (a hard thing — skippable if there genuinely wasn't one), then Bud (something they're looking forward to). Then swap.",
                "SHORT VERSION (~5 min): drop the Bud entirely. Just 'best part of today' and 'worst part of today', one or two sentences each, then swap.",
                "Keep every answer to a single sentence. The point is closure and warmth, not discussion — so it can end the moment she starts drifting.",
                "Pick the version at the top of the call rather than mid-way, so nobody has to negotiate downward while tired.",
            ],
            "confidence": "high",
        },
    },
    {
        "new_id": "ldr-shareplay-film-night",
        "base": "t1-disney-plus-native-shareplay",
        "absorbs": ["t1-max-global-shareplay"],
        "rationale": "Two entries describing the same activity (long-form synchronized viewing over native SharePlay) differing only in which subscription. The per-app detail belongs in the capability appendix, which already carries it.",
        "overrides": {
            "name": "Long-Form SharePlay Film Night (Disney+ or Max)",
            "subcategory": "co-watch, long-form",
            "one_liner": "A full film or a couple of long episodes watched in genuine sync over FaceTime, on either of the two major services confirmed to be both SharePlay-capable and actually available in Israel.",
            "how_it_works": [
                "Both need the same service. Disney+ has been live in Israel since June 2022; Max launched there in January 2026 (SharePlay requires an ad-free Max tier).",
                "Start FaceTime, open the app, pick a title, tap Share then SharePlay, and invite through the call already running.",
                "Playback, pause, rewind and fast-forward sync automatically; either partner can take control.",
                "Key finding: Disney+'s old GroupWatch — which explicitly required both viewers to be in the SAME country — was discontinued globally on 18 September 2023. SharePlay carries no such restriction, which is what makes this usable for an Israel/US couple at all.",
                "Caveat before you commit to a title: per-title catalogs still differ by region, and whether the Israeli and US Max libraries match was NOT confirmed. Check the title exists on both sides first.",
            ],
            "window_fit": ["w1", "w5", "w6", "w7"],
            "duration_min": 60,
            "tools_needed": ["Disney+ or Max (ad-free) subscription, both partners", "FaceTime"],
            "cost": "paid (Disney+ Israel NIS 39.90/mo; Max Israel NIS 49.90-64.90/mo; US pricing not independently verified)",
            "confidence": "high",
        },
    },
]

# ---------------------------------------------------------------------------
# CROSS-BORDER CLEANLINESS (0-10). Default 10 = nothing in the Israel/US split
# gets in the way. Lower = a real, named friction found by the researching thread.
# ---------------------------------------------------------------------------
CROSS_BORDER = {
    "t1-netflix-teleparty-region-workaround": 3,
    "ldr-shareplay-film-night": 6,
    "t1-disney-max-lunch-short-episode": 6,
    "t1-audiobook-manual-sync-commute": 8,
    "t1-syncplay-local-file-sync": 8,
    "t1-espn-twitch-live-sports-w6": 7,
    "t2-flow-club-caveday-alternative": 6,
    "t2-cook-same-recipe-facetime": 8,
    "t3-netflix-exploding-kittens": 6,
    "t3-geoguessr-duels": 8,
    "t3-boardgamearena-splendor-duel-async": 8,
    "t3-boardgamearena-7wonders-duel": 8,
    "t4-qwixx-mirrored": 8,
    "t4-welcome-to-mirrored": 9,
    "t4-railroad-ink-mirrored": 9,
    "t4-story-cubes-narrated": 7,
    "t5-eft-hold-me-tight-conversations": 9,
    "t6-the-and-long-term-couples": 8,
    "t6-single-copy-asymmetric-deck": 7,
    "t6-paired-daily-question": 6,
    "t6-agape-one-minute-question": 6,
    "t6-longwalks-journal-together": 8,
    "t6-lovewick-question-decks": 8,
    "t7-app-controlled-toy-realtime-overlap": 2,
    "t7-omgyes-shared-discovery": 7,
    "t7-book-aasect-therapist-session": 5,
    "t7-scent-object-sleep-ritual": 7,
}

# Entries that genuinely need no screen at any point — the "one of us can't look
# at a screen" shelf. Derived by hand from each entry's tools and mechanics.
SCREEN_FREE = {
    "t1-audiobook-manual-sync-commute", "ldr-morning-audio-companion",
    "t2-narrate-day-eyes-closed", "t2-read-aloud-bedtime-book",
    "t2-sleep-call-propped-phone", "t2-read-recipe-aloud-while-cooking",
    "t4-ghost", "t4-botticelli", "t4-twenty-questions", "t4-contact-two-player",
    "t4-fortunately-unfortunately", "t4-would-you-rather-deep",
    "t4-two-truths-and-a-lie", "t4-just-a-minute", "t4-going-on-a-picnic",
    "t4-ministers-cat", "t4-never-have-i-ever-verbal",
    "t4-newlywed-prediction-quiz", "t4-story-cubes-narrated",
    "t5-gottman-love-map-single-question", "t5-imago-appreciation-micro",
    "t5-gottman-stress-reducing-conversation", "t5-36-questions-set1-warmup",
    "t6-commute-voice-question", "ldr-bedtime-rose-bud-thorn",
    "t6-bedtime-nearly-asleep-question", "t6-lunch-five-minute-checkin",
    "t7-voice-note-audio-only-commute", "t7-totwoo-touch-jewelry",
    "t7-apple-digital-touch-heartbeat", "t7-scent-object-sleep-ritual",
}

# ---------------------------------------------------------------------------
# DEFERRED TASTE RE-RANK — THE HOOK.
#
# As of 2026-08-02 the taste profile has NOT arrived. Every score below is
# LOGISTICS-ONLY: it measures how well an activity fits their clock, their
# energy, their borders and their budget. It says nothing about whether they
# would enjoy it.
#
# To apply the pass later:
#   1. Fill TASTE_PROFILE with the four lists below (ids or free-text tags).
#   2. Set TASTE_PROFILE["applied"] = True.
#   3. Re-run this script. Scores, tiers, shelves and the matrix all regenerate.
#
# It is a MULTIPLIER APPLIED AFTER logistics scoring, never a filter applied
# before it — so a taste-mismatched but structurally perfect activity is demoted
# and annotated, not deleted, and coverage of the thin windows survives a narrow
# profile.
#
# Inputs it needs from the founder:
#   loved      — genres, hobbies, existing shared media, things they already do
#                and still enjoy.               -> x1.25
#   neutral    — anything unmentioned.          -> x1.00 (default)
#   stale      — tried already and burned out, or actively disliked. Annotated
#                with the reason rather than hidden.  -> x0.60
#   ruled_out  — the founder says never. Removed from library.json and logged
#                to the drop list.
# It modifies the FINAL `score` only. No logistics factor is touched, so the
# logistics ranking stays independently inspectable in `score_logistics`.
# ---------------------------------------------------------------------------
TASTE_PROFILE = {
    "applied": False,
    "collected_date": None,
    "loved": [],
    "stale": {},       # id -> reason
    "ruled_out": {},   # id -> reason
}


def apply_taste(activity):
    """Returns (multiplier, annotation). No-op until a profile is supplied."""
    if not TASTE_PROFILE["applied"]:
        return 1.0, None
    aid = activity["id"]
    if aid in TASTE_PROFILE["ruled_out"]:
        return 0.0, "ruled_out: " + TASTE_PROFILE["ruled_out"][aid]
    if aid in TASTE_PROFILE["stale"]:
        return 0.6, "stale: " + TASTE_PROFILE["stale"][aid]
    if aid in TASTE_PROFILE["loved"]:
        return 1.25, "loved"
    return 1.0, None


# ---------------------------------------------------------------------------
# LOAD
# ---------------------------------------------------------------------------
def load():
    threads = {}
    for tid, fname in THREAD_FILES:
        with open(os.path.join(RESEARCH, fname)) as fh:
            threads[tid] = json.load(fh)
    return threads


def dedupe(threads):
    by_id, order = {}, []
    for tid, _ in THREAD_FILES:
        for act in threads[tid]["activities"]:
            act["_thread"] = tid
            by_id[act["id"]] = act
            order.append(act["id"])

    dropped = []
    for did, reason in DROPS.items():
        if did in by_id:
            dropped.append({"id": did, "name": by_id[did]["name"],
                            "thread": by_id[did]["_thread"], "reason": reason})
            del by_id[did]
            order.remove(did)

    merged_log = []
    for spec in MERGES:
        base = by_id.get(spec["base"])
        if base is None:
            continue
        absorbed = [by_id[a] for a in spec["absorbs"] if a in by_id]
        new = dict(base)
        new["id"] = spec["new_id"]
        new["merged_from"] = [base["id"]] + [a["id"] for a in absorbed]

        # union tools + windows, keep the narrower claim only where overridden
        tools = list(base.get("tools_needed", []))
        wins = list(base.get("window_fit", []))
        srcs = [base["source_url"]]
        for a in absorbed:
            for t in a.get("tools_needed", []):
                if t not in tools:
                    tools.append(t)
            for w in a.get("window_fit", []):
                if w not in wins:
                    wins.append(w)
            if a["source_url"] not in srcs:
                srcs.append(a["source_url"])
        new["tools_needed"] = tools
        new["window_fit"] = [w for w in WINDOWS if w in wins]
        new["source_urls_all"] = srcs
        new.update(spec["overrides"])

        idx = order.index(base["id"])
        for a in absorbed:
            order.remove(a["id"])
            del by_id[a["id"]]
        order[order.index(base["id"])] = spec["new_id"]
        del by_id[base["id"]]
        by_id[spec["new_id"]] = new

        merged_log.append({
            "new_id": spec["new_id"], "name": new["name"],
            "from": new["merged_from"], "rationale": spec["rationale"],
        })

    acts = [by_id[i] for i in order]
    for a in acts:
        a.setdefault("merged_from", [])
        a.setdefault("source_urls_all", [a["source_url"]])
    return acts, dropped, merged_log


# ---------------------------------------------------------------------------
# SCORE
# ---------------------------------------------------------------------------
def cell_counts(acts):
    cells = defaultdict(int)
    for a in acts:
        for w in a["window_fit"]:
            cells[(w, a["category"])] += 1
    return cells


def score(a, cells):
    f = {}

    # 1. energy / availability asymmetry fit (20)
    sym = a["energy_symmetry"]
    if sym in ("works_asymmetric", "best_when_one_is_sleepy"):
        f["asymmetry"] = 20
    else:  # needs_both_high — only earns it in the windows that can carry it
        f["asymmetry"] = 20 if ({"w6", "w7"} & set(a["window_fit"])) else 0

    # 2. thin-window coverage (15), scaled by how empty the served cell is.
    #    W2 deliberately scores nothing here — it is opportunistic, not thin.
    best = 0
    for w in a["window_fit"]:
        if w not in THIN_WINDOWS:
            continue
        n = cells[(w, a["category"])]
        best = max(best, 15 if n <= 2 else 10 if n <= 5 else 6)
    f["thin_window"] = best

    # 3. window realism (15): respect the two hard ceilings, reward precision
    realism = 15
    for w, cap in HARD_CEILINGS.items():
        if w in a["window_fit"] and a["duration_min"] > cap:
            realism = 8
            break
    realism -= max(0, len(a["window_fit"]) - 3)
    f["window_realism"] = max(0, realism)

    # 4. ritual-ability (15)
    f["ritual"] = {"ritual": 15, "repeatable": 10, "one_time": 4}[a["novelty_curve"]]

    # 5. friction to start (15)
    setup = {"none": 8, "light": 5, "prep_needed": 2}[a["setup_effort"]]
    c = a["cost"].lower()
    money = 7 if c.startswith("free") else 4 if c.startswith("cheap") else 1
    f["friction"] = setup + money

    # 6. cross-border cleanliness (10)
    f["cross_border"] = CROSS_BORDER.get(a["id"], 10)

    # 7. source confidence (10)
    f["confidence"] = {"high": 10, "medium": 6, "low": 2}[a["confidence"]]

    return sum(f.values()), f


def build():
    threads = load()
    acts, dropped, merged_log = dedupe(threads)
    cells = cell_counts(acts)

    for a in acts:
        total, factors = score(a, cells)
        a["score_logistics"] = total
        a["score_factors"] = factors
        mult, note = apply_taste(a)
        a["taste_multiplier"] = mult
        a["taste_note"] = note
        a["score"] = round(total * mult)
        a["verification_tier"] = "plausible-unverified" if a["confidence"] == "low" else "verified"
        a["screen_free"] = a["id"] in SCREEN_FREE

    if TASTE_PROFILE["applied"]:
        removed = [a for a in acts if a["taste_multiplier"] == 0.0]
        for r in removed:
            dropped.append({"id": r["id"], "name": r["name"], "thread": r["_thread"],
                            "reason": "taste re-rank: " + (r["taste_note"] or "")})
        acts = [a for a in acts if a["taste_multiplier"] > 0.0]

    # ---- tiering. S is verified-only. Two anti-monoculture constraints, both
    # from the synthesis plan's "rank within buckets, never globally" rule:
    #   (a) window seeding — every real window gets at least one S entry, so the
    #       couple never opens the site in a window with no top recommendation.
    #       Without this, the thin-window weighting starves W1/W6/W7 entirely.
    #   (b) category cap — no single category may take more than 5 free slots.
    # Low-confidence entries can never reach S.
    verified = sorted([a for a in acts if a["verification_tier"] == "verified"],
                      key=lambda x: -x["score"])
    seed_windows = [w for w in WINDOWS if w not in OPPORTUNISTIC_WINDOWS]

    s_ids, per_cat = [], defaultdict(int)
    for win in seed_windows:                                    # (a)
        if any(win in by["window_fit"] for by in verified if by["id"] in s_ids):
            continue
        for a in verified:
            if win in a["window_fit"] and a["id"] not in s_ids:
                s_ids.append(a["id"])
                per_cat[a["category"]] += 1
                break

    for a in verified:                                          # (b)
        if len(s_ids) >= 15:
            break
        if a["id"] in s_ids or per_cat[a["category"]] >= 5:
            continue
        s_ids.append(a["id"])
        per_cat[a["category"]] += 1
    s_set = set(s_ids)

    rest = sorted([a for a in acts if a["id"] not in s_set], key=lambda x: -x["score"])
    a_set = set()
    for a in rest:
        if len(a_set) >= 30:
            break
        if a["verification_tier"] == "verified":
            a_set.add(a["id"])

    for a in acts:
        a["tier"] = "S" if a["id"] in s_set else "A" if a["id"] in a_set else "B"

    acts.sort(key=lambda x: (-x["score"], x["id"]))
    return threads, acts, dropped, merged_log, cells


# ---------------------------------------------------------------------------
# EMIT
# ---------------------------------------------------------------------------
SCHEMA_FIELDS = [
    "id", "name", "category", "subcategory", "one_liner", "how_it_works",
    "window_fit", "energy_required", "energy_symmetry", "duration_min",
    "setup_effort", "tools_needed", "cost", "timezone_friction",
    "apple_shareplay", "novelty_curve", "intimacy_level", "source_url",
    "source_date", "confidence",
]
EXTRA_FIELDS = [
    "score", "score_logistics", "score_factors", "tier", "verification_tier",
    "merged_from", "source_urls_all", "screen_free", "taste_multiplier",
    "taste_note", "confidence_note",
]


def emit_library(acts, threads, dropped, merged_log):
    records = []
    for a in acts:
        rec = {k: a[k] for k in SCHEMA_FIELDS}
        rec["thread"] = a["_thread"]
        for k in EXTRA_FIELDS:
            if k in a:
                rec[k] = a[k]
        records.append(rec)

    payload = {
        "generated": "2026-08-02",
        "generator": "docs/10-activity-library/build_library.py",
        "couple": {
            "a": {"location": "Israel", "utc_offset": "+3", "work_week": "Sun-Thu"},
            "b": {"location": "New York City", "utc_offset": "-4", "work_week": "Mon-Fri"},
            "gap_hours": 7,
            "primary_channel": "FaceTime",
        },
        "windows": [
            {"id": w, "label": WINDOW_LABELS[w], "clock": WINDOW_CLOCK[w],
             "character": WINDOW_CHARACTER[w], "status": WINDOW_STATUS[w],
             "thin": w in THIN_WINDOWS, "opportunistic": w in OPPORTUNISTIC_WINDOWS}
            for w in WINDOWS
        ],
        "categories": CATEGORIES,
        "ranking": {
            "basis": "LOGISTICS ONLY — the taste profile had not arrived at build time.",
            "warning": "Tiers reflect fit with the couple's clock, energy, borders and budget. "
                       "They do NOT reflect what these two people actually enjoy. Do not present "
                       "tier S as 'what you'll like most'; it is 'what fits your week best'.",
            "taste_reranked": TASTE_PROFILE["applied"],
            "rerank_hook": "TASTE_PROFILE + apply_taste() in build_library.py",
        },
        "counts": {
            "activities_in": 106,
            "dropped": len(dropped),
            "merged_away": sum(len(m["from"]) - 1 for m in merged_log),
            "activities_out": len(records),
            "verified": sum(1 for r in records if r["verification_tier"] == "verified"),
            "plausible_unverified": sum(1 for r in records if r["verification_tier"] == "plausible-unverified"),
        },
        "drops": dropped,
        "merges": merged_log,
        "activities": records,
        "cross_thread_artifacts": {
            "window_contraindications": threads["T5"]["window_contraindications"],
            "timezone_correctness_audit": threads["T6"]["timezone_correctness_audit"],
            "shareplay_capability_appendix": threads["T1"]["shareplay_capability_appendix"],
            "privacy_findings": threads["T7"]["privacy_findings"],
            "ldr_maintenance_research": threads["T5"]["ldr_maintenance_research"],
        },
    }
    with open(os.path.join(HERE, "library.json"), "w") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
    return payload


def emit_matrix(acts, cells):
    L = []
    w = L.append
    w("# Coverage Matrix\n")
    w("*Generated by `build_library.py` — 2026-08-02. 9 windows x 4 categories = 36 cells.*\n")
    w("**W2 is advisory.** She is up at NYC 05:00-07:00 only sometimes, mostly weekends, so W2 "
      "cells are reported for information and are never scored RED or AMBER. Effective scored "
      "surface is **32 cells**.\n")
    w("Legend: **RED** = 0 entries, commission now · **AMBER** = 1-2, round-2 list · **green** = 3+\n")

    w("\n## Windows x Categories\n")
    w("| Window | live-together | games | deep-talk | intimacy | row total |")
    w("|---|---|---|---|---|---|")
    red, amber = [], []
    for win in WINDOWS:
        row = [f"| **{win.upper()}** — {WINDOW_LABELS[win]} "]
        tot = 0
        for cat in CATEGORIES:
            n = cells[(win, cat)]
            tot += n
            if win in OPPORTUNISTIC_WINDOWS:
                mark = f"{n} _(advisory)_"
            elif n == 0:
                mark = "**0 RED**"
                red.append((win, cat))
            elif n <= 2:
                mark = f"**{n} AMBER**"
                amber.append((win, cat, n))
            else:
                mark = str(n)
            row.append(f"| {mark} ")
        row.append(f"| {tot} |")
        w("".join(row))
    w(f"\n**RED cells: {len(red)}** · **AMBER cells: {len(amber)}**\n")

    w("\n### RED cells (0 entries)\n")
    if red:
        for win, cat in red:
            w(f"- `{win.upper()} x {cat}` — {WINDOW_LABELS[win]}")
    else:
        w("_None._")

    w("\n### AMBER cells (1-2 entries)\n")
    for win, cat, n in amber:
        names = [a["name"] for a in acts if win in a["window_fit"] and a["category"] == cat]
        w(f"- `{win.upper()} x {cat}` ({n}) — {WINDOW_LABELS[win]} — {'; '.join(names)}")

    w("\n## Diagnostic 1 — Windows x energy_symmetry\n")
    w("*Checks that each window's real energy profile is actually served. W1 should be dense in "
      "`best_when_one_is_sleepy`; if it were dense in `needs_both_high` the tagging would be wrong.*\n")
    syms = ["best_when_one_is_sleepy", "works_asymmetric", "needs_both_high"]
    w("| Window | sleepy-friendly | asymmetric | needs both high |")
    w("|---|---|---|---|")
    for win in WINDOWS:
        counts = [sum(1 for a in acts if win in a["window_fit"] and a["energy_symmetry"] == s) for s in syms]
        w(f"| **{win.upper()}** | {counts[0]} | {counts[1]} | {counts[2]} |")

    w("\n## Diagnostic 2 — Windows x duration band\n")
    w("*Checks that hard-bounded windows actually contain short options rather than things that overrun.*\n")
    bands = [("<=20 min", 0, 20), ("21-60", 21, 60), ("61-120", 61, 120), ("120+", 121, 10 ** 6)]
    w("| Window | " + " | ".join(b[0] for b in bands) + " |")
    w("|---|---|---|---|---|")
    for win in WINDOWS:
        cs = [sum(1 for a in acts if win in a["window_fit"] and lo <= a["duration_min"] <= hi)
              for _, lo, hi in bands]
        w(f"| **{win.upper()}** | " + " | ".join(str(c) for c in cs) + " |")

    w("\n## Verification split\n")
    w("| Category | verified | plausible-unverified |")
    w("|---|---|---|")
    for cat in CATEGORIES:
        v = sum(1 for a in acts if a["category"] == cat and a["verification_tier"] == "verified")
        u = sum(1 for a in acts if a["category"] == cat and a["verification_tier"] != "verified")
        w(f"| {cat} | {v} | {u} |")

    with open(os.path.join(HERE, "coverage-matrix.md"), "w") as fh:
        fh.write("\n".join(L) + "\n")
    return red, amber


def emit_sources(acts, threads):
    seen = {}
    for a in acts:
        for u in a.get("source_urls_all", [a["source_url"]]):
            seen.setdefault(u, []).append(a["name"])
    for key in ("T1", "T2", "T3", "T4", "T5", "T6", "T7"):
        for u in threads[key].get("sources", []):
            seen.setdefault(u, [])
    for pf in threads["T7"]["privacy_findings"]:
        seen.setdefault(pf["source_url"], []).append("PRIVACY: " + pf["subject"])
    for r in threads["T5"]["ldr_maintenance_research"]:
        seen.setdefault(r["source_url"], []).append("RESEARCH: framing")

    L = ["# Sources\n",
         "*Every URL behind the library, with the date it was accessed or published. "
         "Nothing in this library is unfalsifiable later.*\n",
         f"**{len(seen)} distinct URLs.** Access date for all: **2026-08-02** unless the entry "
         "carries its own publication date.\n",
         "> **Session-wide sourcing limitation:** reddit.com, old.reddit.com and the Reddit JSON "
         "endpoint were tool-level blocked for the entire research session. All seven threads "
         "confirmed this independently. No first-person community source appears anywhere in this "
         "library. See ROUND-2-COMMISSIONS.md.\n",
         "| Source | Used by |", "|---|---|"]
    for u in sorted(seen):
        used = seen[u]
        label = "; ".join(sorted(set(used))[:3]) + ("…" if len(set(used)) > 3 else "") if used else "_thread-level reference_"
        L.append(f"| {u} | {label} |")
    with open(os.path.join(HERE, "sources.md"), "w") as fh:
        fh.write("\n".join(L) + "\n")
    return len(seen)


def shelves(acts):
    sh = []
    for win in WINDOWS:
        note = " *(opportunistic — only if she's up, mostly weekends)*" if win in OPPORTUNISTIC_WINDOWS else ""
        sh.append((f"{WINDOW_LABELS[win]} ({win.upper()})",
                   WINDOW_CLOCK[win] + note,
                   [a for a in acts if win in a["window_fit"]]))
    sh.append(("Zero setup, right now", "Nothing to buy, nothing to install, nothing to arrange.",
               [a for a in acts if a["setup_effort"] == "none" and a["cost"].lower().startswith("free")]))
    sh.append(("One of us can't look at a screen", "Audio, voice, or touch only — works with eyes closed or hands full.",
               [a for a in acts if a["screen_free"]]))
    sh.append(("We need to talk about something real", "Intimacy level 4-5. Check WINDOW-CONTRAINDICATIONS.md before starting one of these.",
               [a for a in acts if a["intimacy_level"] >= 4]))
    sh.append(("Fifteen minutes", "20 minutes or less, with a clean stopping point.",
               [a for a in acts if a["duration_min"] <= 20]))
    sh.append(("Three hours", "Long-form. Needs a window with no hard stop.",
               [a for a in acts if a["duration_min"] >= 90]))
    return sh


def emit_readable(acts, payload):
    L = []
    w = L.append
    c = payload["counts"]
    w("# The Activity Library\n")
    w("*For one couple: Israel (UTC+3, works Sun-Thu) and New York City (UTC-4, works Mon-Fri). "
      "Seven hours apart. Generated 2026-08-02.*\n")
    w("---\n")
    w("## Read this before you use the tiers\n")
    w("**Tiering here is LOGISTICS ONLY.** Every activity was scored on how well it fits your "
      "clock, your energy at each hour, your two countries and your budget. **None of it is tuned "
      "to what either of you actually likes.** The taste profile had not arrived when this was "
      "built, so tier S means *fits your week best*, not *you'll enjoy this most*. That pass is "
      "built and waiting — see the hook in `build_library.py`.\n")
    w(f"**{c['activities_out']} activities** — {c['verified']} verified, "
      f"{c['plausible_unverified']} plausible-but-unverified. "
      f"{c['activities_in']} came in from research; {c['merged_away']} were merged away as "
      f"duplicates and {c['dropped']} dropped.\n")
    w("Two tiers of trust, kept deliberately separate:\n")
    w("- **verified** — the activity, the tool, or the protocol is traceable to official "
      "documentation, a store listing, a named clinician, or a peer-reviewed paper.")
    w("- **plausible-unverified** — reasonable, internally consistent, and each has a real source, "
      "but no strong precedent was found. Reddit was blocked for the whole research session, which "
      "is where these would normally be corroborated. **Treat them as hypotheses to try, not as "
      "practices with a track record.** They are never ranked alongside verified entries.\n")
    w("---\n")
    w("## Your overlap clock\n")
    w("*Eight of these nine windows are confirmed against how you actually live, not inferred. "
      "W2 is the exception — it happens sometimes, mostly at weekends, so nothing is planned around it.*\n")
    w("| # | Window | When | Status | What it's like |")
    w("|---|---|---|---|---|")
    for win in WINDOWS:
        n = sum(1 for a in acts if win in a["window_fit"])
        w(f"| {n} | **{win.upper()}** {WINDOW_LABELS[win]} | {WINDOW_CLOCK[win]} | "
          f"{WINDOW_STATUS[win]} | {WINDOW_CHARACTER[win]} |")
    w("\n---\n")

    # ---- the organizing frame, and the honest limits of it
    ev = frame_evidence(acts)
    live_asym = sum(1 for a in acts if a["id"] not in ASYNC_IDS
                    and a["energy_symmetry"] != "needs_both_high")
    both_high_w7 = sum(1 for a in acts if a["energy_symmetry"] == "needs_both_high" and "w7" in a["window_fit"])
    both_high_tags = sum(1 for a in acts if a["energy_symmetry"] == "needs_both_high")
    w("## How this library is actually shaped\n")
    w("Two patterns fell out of the research strongly enough to be worth stating. Both are countable "
      "from `library.json`, not impressions.\n")
    w(f"**1. One of you is nearly always the passive one — and that is the design, not a compromise.** "
      f"{live_asym} of {len(acts)} activities ({round(100*live_asym/len(acts))}%) happen live and "
      f"simultaneously but hand the two of you deliberately unequal roles: one narrates while the other "
      f"listens with their eyes shut, one cooks while the other reads the recipe aloud, one holds the "
      f"deck and reads, one rolls the dice and calls the numbers. The sleepy or busy partner is given "
      f"the job that costs almost nothing. This is the single most common shape in the library and it "
      f"showed up independently in the verbal games, the co-presence rituals, the card decks and the "
      f"intimacy entries.\n")
    w(f"**2. Saturday is load-bearing, and it is a single point of failure.** "
      f"{both_high_w7} of the {both_high_tags} activities that genuinely need both of you alert "
      f"list Saturday as a window they work in. There is no weekday substitute — that is what "
      f"'the only symmetric window' means in practice. Everything demanding queues behind one day a "
      f"week. Protect it, and don't schedule two heavy things into the same Saturday.\n")
    w("**What is NOT true, though it sounds like it should be:** that the answer to distance is to go "
      "asynchronous. Asynchronous activities are excellent and there are "
      f"{ev['async_n']} of them — but they are a supplement, not the spine. Delete every asynchronous "
      "activity from this library and all nine windows still have content. Delete every live one and "
      "the library collapses to six of nine windows. Live, simultaneous, asymmetric-role activity is "
      "what actually holds the week together.\n")
    w("\n---\n")

    w("## The shelves\n")
    for title, sub, items in shelves(acts):
        items = sorted(items, key=lambda x: (x["verification_tier"] != "verified", -x["score"]))
        w(f"\n### {title}\n")
        w(f"*{sub}*\n")
        if not items:
            w("_Nothing here yet. See `coverage-matrix.md`._\n")
            continue
        ver = [a for a in items if a["verification_tier"] == "verified"]
        unv = [a for a in items if a["verification_tier"] != "verified"]
        w("| | Activity | Cat | Min | Energy | Cost |")
        w("|---|---|---|---|---|---|")
        for a in ver[:14]:
            w(f"| {a['tier']} | **{a['name']}** — {a['one_liner']} | {a['category']} | "
              f"{a['duration_min']} | {a['energy_required']} | {a['cost'].split('(')[0].strip()} |")
        if len(ver) > 14:
            w(f"\n_+{len(ver) - 14} more verified in this shelf — see `library.json`._\n")
        if unv:
            w(f"\n**Plausible but unverified ({len(unv)})** — try at your own risk:\n")
            for a in unv:
                w(f"- *{a['name']}* — {a['one_liner']}")
    w("\n---\n")

    w("## Everything, by score\n")
    w("*Logistics score out of 100. See `library.json` for the per-factor breakdown of any row.*\n")
    w("| Tier | Score | Activity | Category | Windows | Sym | Trust |")
    w("|---|---|---|---|---|---|---|")
    for a in acts:
        wins = " ".join(x.upper() for x in a["window_fit"])
        sym = {"best_when_one_is_sleepy": "sleepy", "works_asymmetric": "async",
               "needs_both_high": "both-high"}[a["energy_symmetry"]]
        trust = "ok" if a["verification_tier"] == "verified" else "**unverified**"
        w(f"| {a['tier']} | {a['score']} | {a['name']} | {a['category']} | {wins} | {sym} | {trust} |")

    w("\n---\n")
    w("## Companion documents\n")
    w("- **`WINDOW-CONTRAINDICATIONS.md`** — which windows are actively WRONG for which "
      "conversation. This is an enforcement rule, not advice. Read it before anything in the "
      "*something real* shelf.")
    w("- **`APP-COMPATIBILITY.md`** — what actually works across Israel/US: the SharePlay map, "
      "the region locks, and which couple apps break on a split day.")
    w("- **`PRIVACY-NOTES.md`** — encryption status of every channel you'd use, and the iCloud "
      "Backup hole most people miss.")
    w("- **`coverage-matrix.md`** — where the library is thin.")
    w("- **`ROUND-2-COMMISSIONS.md`** — what to research next, prioritised.")
    w("- **`sources.md`** — every URL.")

    with open(os.path.join(HERE, "ACTIVITY-LIBRARY.md"), "w") as fh:
        fh.write("\n".join(L) + "\n")


# Activities that do NOT require both partners present at the same moment.
# This is a different axis from energy_symmetry and is the one the "go async"
# reading of the organizing frame actually rests on.
ASYNC_IDS = {
    "t3-chess-daily-correspondence", "ldr-words-correspondence",
    "ldr-gamepigeon-imessage-games", "t3-boardgamearena-splendor-duel-async",
    "ldr-duolingo-shared-streak", "t2-strava-effort-comparison",
    "t5-ecr-r-attachment-assessment", "t5-love-languages-quiz-honest",
    "t6-async-halves-shared-doc", "t6-longwalks-journal-together",
    "t6-paired-daily-question", "t6-agape-one-minute-question",
    "t6-lovewick-question-decks", "t6-text-relay-single-question",
    "t6-commute-voice-question", "t7-overnight-fell-asleep-to-woke-up-to",
    "t7-lunch-break-discreet-anticipation", "t7-friday-sunday-slow-build",
    "t7-voice-note-audio-only-commute", "t7-apple-digital-touch-heartbeat",
    "t7-totwoo-touch-jewelry", "t7-yes-no-maybe-checklist-async",
    "t7-scent-object-sleep-ritual",
}


def frame_evidence(acts):
    """Numbers behind the 'asymmetry is the design' question. Stated, not asserted."""
    out = {}
    out["async_n"] = sum(1 for a in acts if a["id"] in ASYNC_IDS)
    for lbl, grp in [("async", [a for a in acts if a["id"] in ASYNC_IDS]),
                     ("live", [a for a in acts if a["id"] not in ASYNC_IDS])]:
        out[lbl + "_avg_windows"] = round(sum(len(a["window_fit"]) for a in grp) / max(1, len(grp)), 2)
        out[lbl + "_windows_covered"] = len({w for a in grp for w in a["window_fit"]})
    for sym in ["best_when_one_is_sleepy", "works_asymmetric", "needs_both_high"]:
        g = [a for a in acts if a["energy_symmetry"] == sym]
        out[sym] = {
            "n": len(g),
            "avg_windows": round(sum(len(a["window_fit"]) for a in g) / max(1, len(g)), 2),
            "avg_score": round(sum(a["score"] for a in g) / max(1, len(g)), 1),
        }
    out["async_share"] = round(
        100 * sum(1 for a in acts if a["energy_symmetry"] != "needs_both_high") / len(acts), 1)
    out["top15_needs_both_high"] = sum(
        1 for a in sorted(acts, key=lambda x: -x["score"])[:15] if a["energy_symmetry"] == "needs_both_high")
    return out


if __name__ == "__main__":
    threads, acts, dropped, merged_log, cells = build()
    payload = emit_library(acts, threads, dropped, merged_log)
    red, amber = emit_matrix(acts, cells)
    nsrc = emit_sources(acts, threads)
    emit_readable(acts, payload)

    print(json.dumps({
        "in": 106,
        "out": len(acts),
        "dropped": [d["id"] for d in dropped],
        "merges": [(m["new_id"], len(m["from"])) for m in merged_log],
        "verified": payload["counts"]["verified"],
        "plausible_unverified": payload["counts"]["plausible_unverified"],
        "tiers": {t: sum(1 for a in acts if a["tier"] == t) for t in "SAB"},
        "red_cells": [f"{w.upper()}x{c}" for w, c in red],
        "amber_cells": [f"{w.upper()}x{c}({n})" for w, c, n in amber],
        "sources": nsrc,
        "frame_evidence": frame_evidence(acts),
    }, indent=2))
