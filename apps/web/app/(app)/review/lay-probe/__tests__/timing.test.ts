/**
 * Tests for the responsiveness fix (LayProbe.tsx's own top docblock,
 * "RESPONSIVENESS FIX (2026-08-06)") — the founder's "laggy" verdict on
 * phone AND web, traced to two causes:
 *
 *   1. A 250ms dead hold before the pile tile showed ANY feedback.
 *   2. An un-eased pop at commit — scale/rotate/lift jumping instantly
 *      with zero interpolation.
 *
 * This file runs under vitest's `environment: "node"` (see
 * vitest.config.ts) — no jsdom, no real pointer events, no layout. That
 * rules out mounting <LayProbe /> and simulating a drag; see
 * board-geometry.test.ts for the same constraint on a sibling probe.
 * What IS testable here, in pure Node:
 *
 *   - `easedHeldPose`, exported specifically so the pop-fix curve is a
 *     plain function of elapsed-time-since-commit, not something only
 *     inspectable by eye or on a device this environment cannot reach.
 *   - The exported timing constants themselves (PRESS_MS, LIFT_EASE_MS).
 *   - The SOURCE TEXT, for the two things a pure function cannot prove:
 *     that the pre-commit rise gate (RISE_START_MS) is actually gone
 *     from the code path, and that the post-commit easing is computed
 *     inline rather than handed to a CSS transition or a motion/react
 *     `animate` — both call out this exact hazard in the file's own
 *     comments, and a regression here would not fail typecheck or any
 *     other automated check. Reading the source to verify a property
 *     jsdom/Chromium cannot expose is precedented in this codebase's
 *     own review notes for this file (`-webkit-touch-callout` cannot be
 *     read back via getComputedStyle either — it has to be grepped).
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { LIFT_EASE_MS, PRESS_MS, easedHeldPose } from "../LayProbe";

const SOURCE_PATH = fileURLToPath(new URL("../LayProbe.tsx", import.meta.url));
const source = readFileSync(SOURCE_PATH, "utf-8");

describe("timing constants — the 250ms distinction stays intact", () => {
  it("PRESS_MS is unchanged at 250ms", () => {
    expect(PRESS_MS).toBe(250);
  });

  it("LIFT_EASE_MS falls inside the brief's ~100-150ms window", () => {
    expect(LIFT_EASE_MS).toBeGreaterThanOrEqual(100);
    expect(LIFT_EASE_MS).toBeLessThanOrEqual(150);
  });
});

describe("easedHeldPose — the un-eased pop, fixed", () => {
  it("starts at the neutral resting pose at elapsed=0 (no pop)", () => {
    const pose = easedHeldPose(0);
    expect(pose.scale).toBe(1);
    expect(pose.rotate).toBe(0);
    expect(pose.lift).toBe(0);
  });

  it("reaches the full picked-up pose by LIFT_EASE_MS", () => {
    const pose = easedHeldPose(LIFT_EASE_MS);
    expect(pose.scale).toBeCloseTo(1.05, 5);
    expect(pose.rotate).toBeCloseTo(-3.5, 5);
    expect(pose.lift).toBeCloseTo(6, 5);
  });

  it("clamps at the full pose for any elapsed time beyond LIFT_EASE_MS", () => {
    const atEnd = easedHeldPose(LIFT_EASE_MS);
    const wayPast = easedHeldPose(LIFT_EASE_MS * 50);
    expect(wayPast).toEqual(atEnd);
  });

  it("never overshoots or goes negative for elapsed time before commit (clock skew)", () => {
    const pose = easedHeldPose(-40);
    expect(pose.scale).toBe(1);
    expect(pose.rotate).toBe(0);
    expect(pose.lift).toBe(0);
  });

  it("is monotonic in magnitude across the ease window — never reads as a second pop", () => {
    const samples = [0, 20, 45, 70, 95, 120, LIFT_EASE_MS];
    const scales = samples.map((t) => easedHeldPose(t).scale);
    const lifts = samples.map((t) => easedHeldPose(t).lift);
    const rotateMagnitudes = samples.map((t) => Math.abs(easedHeldPose(t).rotate));
    for (let i = 1; i < samples.length; i++) {
      expect(scales[i]!).toBeGreaterThanOrEqual(scales[i - 1]!);
      expect(lifts[i]!).toBeGreaterThanOrEqual(lifts[i - 1]!);
      expect(rotateMagnitudes[i]!).toBeGreaterThanOrEqual(rotateMagnitudes[i - 1]!);
    }
  });

  it("decelerates into place (ease-out) rather than moving at a constant rate", () => {
    // Equal-sized early/late windows; ease-out covers more ground early.
    const early = easedHeldPose(LIFT_EASE_MS * 0.4).lift - easedHeldPose(0).lift;
    const late =
      easedHeldPose(LIFT_EASE_MS).lift - easedHeldPose(LIFT_EASE_MS * 0.6).lift;
    expect(early).toBeGreaterThan(late);
  });
});

describe("source — the 120ms dead-hold gate is actually gone, not just renamed", () => {
  it("no longer declares RISE_START_MS as a constant", () => {
    // Prose comments are allowed to name it while explaining the fix
    // (see the file's top docblock and the constants section) — what
    // must be gone is the binding itself and any timer built on it.
    expect(source).not.toMatch(/const RISE_START_MS/);
    expect(source).not.toMatch(/setTimeout\([^)]*RISE_START_MS/);
  });

  it("handleDown starts the rise synchronously, not behind a setTimeout", () => {
    const start = source.indexOf("const handleDown = useCallback(");
    const end = source.indexOf("const handleMove = useCallback(");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const handleDownBody = source.slice(start, end);

    // Exactly one feedback call, and it is bare — not wrapped in a timer.
    expect(handleDownBody).toMatch(/(?<!window\.setTimeout\([^)]*)setRisingId\(photo\.id\);/);
    expect(handleDownBody).not.toMatch(/window\.setTimeout\(\s*\(\)\s*=>\s*setRisingId/);

    // The ONE timer left in handleDown still gates commit at PRESS_MS,
    // preserving the scroll-vs-pickup distinction.
    const timeoutCalls = handleDownBody.match(/window\.setTimeout\(/g) ?? [];
    expect(timeoutCalls).toHaveLength(1);
    expect(handleDownBody).toMatch(/window\.setTimeout\(\s*\(\)\s*=>\s*commit\(/);
  });
});

describe("source — the post-commit ease has no competing animation system", () => {
  it("the held layer is a plain div, not a motion.div", () => {
    const start = source.indexOf("{held && (");
    const end = source.indexOf("</div>\n          )}");
    expect(start).toBeGreaterThan(-1);
    const heldBlock = source.slice(start, end === -1 ? start + 800 : end);
    expect(heldBlock).not.toMatch(/<motion\.div/);
    expect(heldBlock).toMatch(/ref=\{heldLayerRef\}/);
    // No CSS transition on the node handleMove rewrites every pointermove.
    expect(heldBlock).not.toMatch(/transition:/);
  });

  it("handleMove computes the eased pose inline and writes one transform string", () => {
    const start = source.indexOf("const handleMove = useCallback(");
    const end = source.indexOf("const handleUp = useCallback(");
    expect(start).toBeGreaterThan(-1);
    const handleMoveBody = source.slice(start, end);
    expect(handleMoveBody).toMatch(/easedHeldPose\(elapsed\)/);
    expect(handleMoveBody).toMatch(/layer\.style\.transform = `translate3d/);
  });
});
