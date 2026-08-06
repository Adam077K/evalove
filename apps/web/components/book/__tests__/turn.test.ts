/**
 * Tests for the spine-hinged turn's pose math — see turn.ts.
 *
 * This is the regression the founder's feedback was: the old leaf
 * capped at ±24° and never showed a back face. Every assertion here
 * is either a boundary of the arc (0, 1, the 90° crossing) or an
 * invariant the physical model claims (monotonic rotation, lift
 * peaking mid-arc, symmetric forward/backward paths) — the same
 * class of pure-function regression test as board-geometry.test.ts.
 */

import { describe, expect, it } from "vitest";

import { LEAF_TURN_END_DEG, leafTurnPose } from "../turn";

describe("leafTurnPose — the hinge, not the illusion", () => {
  it("rests flat, facing the reader, at progress 0", () => {
    const pose = leafTurnPose(0);
    expect(pose.rotateY).toBe(0);
    expect(pose.translateY).toBeCloseTo(0, 10);
    expect(pose.shadow).toBe(0);
    expect(pose.sheen).toBe(0);
  });

  it("rests flat, turned away, at progress 1 — not capped at 24°", () => {
    const pose = leafTurnPose(1);
    expect(pose.rotateY).toBeCloseTo(LEAF_TURN_END_DEG, 5);
    expect(pose.rotateY).toBeGreaterThan(90); // crosses edge-on: the whole point
    expect(pose.translateY).toBeCloseTo(0, 5);
  });

  it("LEAF_TURN_END_DEG matches the cover's own rest angle — one hinge idiom, not two", () => {
    expect(LEAF_TURN_END_DEG).toBe(172);
  });

  it("crosses 90° (edge-on) inside the arc — past this point the back face must show", () => {
    const midpoint = leafTurnPose(0.5);
    expect(midpoint.rotateY).toBeGreaterThan(80);
    expect(midpoint.rotateY).toBeLessThan(100);
  });

  it("rotation is monotonically non-decreasing across the arc", () => {
    const samples = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    const rotations = samples.map((p) => leafTurnPose(p).rotateY);
    for (let i = 1; i < rotations.length; i++) {
      expect(rotations[i]!).toBeGreaterThanOrEqual(rotations[i - 1]!);
    }
  });

  it("the first pixels of progress lift more than they rotate", () => {
    // Ports globals.css's retired §8b precedent ("the first pixels of
    // drag lift, not rotate") into the wider arc: at 3% progress, the
    // fraction of the lift already spent must exceed the fraction of
    // the rotation already spent.
    const early = leafTurnPose(0.03);
    const liftFraction = Math.abs(early.translateY) / 8;
    const rotateFraction = early.rotateY / LEAF_TURN_END_DEG;
    expect(liftFraction).toBeGreaterThan(rotateFraction);
  });

  it("the lift, shadow and sheen peak mid-arc and return to rest at both ends", () => {
    const rest0 = leafTurnPose(0);
    const rest1 = leafTurnPose(1);
    const mid = leafTurnPose(0.5);
    expect(rest0.translateY).toBeCloseTo(0, 10);
    expect(rest1.translateY).toBeCloseTo(0, 5);
    expect(mid.translateY).toBeLessThan(rest0.translateY); // more negative = lifted
    expect(mid.shadow).toBeCloseTo(1, 5);
    expect(mid.sheen).toBeCloseTo(1, 5);
  });

  it("the arc is symmetric — turning away and turning back trace the same path", () => {
    for (const p of [0.1, 0.25, 0.4, 0.6, 0.75, 0.9]) {
      expect(leafTurnPose(p).translateY).toBeCloseTo(leafTurnPose(1 - p).translateY, 10);
      expect(leafTurnPose(p).shadow).toBeCloseTo(leafTurnPose(1 - p).shadow, 10);
      expect(leafTurnPose(p).sheen).toBeCloseTo(leafTurnPose(1 - p).sheen, 10);
    }
  });

  it("clamps outside [0, 1] instead of extrapolating past either rest pose", () => {
    expect(leafTurnPose(-0.5)).toEqual(leafTurnPose(0));
    expect(leafTurnPose(1.5)).toEqual(leafTurnPose(1));
    expect(leafTurnPose(-100)).toEqual(leafTurnPose(0));
    expect(leafTurnPose(100)).toEqual(leafTurnPose(1));
  });
});
