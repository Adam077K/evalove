"use client";

import { useEffect } from "react";

/**
 * Blurs every photograph the moment the app stops being looked at.
 *
 * The colour law removed `--photo-dim`, which was the only thing that
 * had ever softened a private photograph, and the landing surface now
 * shows the most recent one at full width and full strength. That is
 * correct while somebody is looking at it and wrong the instant they
 * are not: a phone put down on a desk, handed over, or shoulder-read
 * on a train, and — the case this exists for — the snapshot iOS takes
 * of the app for its own app switcher.
 *
 * §1 is untouched. Photographs are never dimmed, tinted, duotoned or
 * washed *while someone is looking*. This is not a treatment applied
 * to a photograph; it is what happens when the photograph stops being
 * on screen.
 *
 * WHY THIS IS JAVASCRIPT AND NOT CSS. There is no CSS that reaches the
 * app-switcher snapshot. iOS captures that frame after the app is
 * backgrounded, and no media query fires for it — `:focus-within`,
 * `prefers-reduced-transparency`, none of them describe "the operating
 * system is about to photograph your screen". `visibilitychange` does,
 * and it fires *before* the snapshot is taken, which is the entire
 * reason this is a listener rather than a stylesheet rule. `blur` and
 * `pagehide` are belt and braces: Safari has historically been
 * inconsistent about `visibilitychange` on backgrounding, and the
 * failure mode of firing too eagerly is a blurred photo for a moment,
 * while the failure mode of missing it is a stranger seeing a private
 * photograph.
 *
 * The class goes on `<html>` rather than on each image so that the
 * rule covers photographs that mount while hidden.
 *
 * Reduced motion is respected by making it instant rather than by
 * skipping it — this is a privacy control, not decoration, so it is
 * never conditional on a motion preference. The transition is what is
 * conditional. That is handled in `globals.css`, which is also where
 * `prefers-reduced-motion` removes transitions outright, so nothing
 * extra is needed here.
 */
export function PrivacyVeil() {
  useEffect(() => {
    const root = document.documentElement;
    const conceal = () => root.classList.add("is-away");
    const reveal = () => root.classList.remove("is-away");

    const onVisibility = () => {
      if (document.visibilityState === "hidden") conceal();
      else reveal();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", conceal);
    window.addEventListener("blur", conceal);
    window.addEventListener("focus", reveal);
    window.addEventListener("pageshow", reveal);

    // The tab may already be hidden when this mounts.
    onVisibility();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", conceal);
      window.removeEventListener("blur", conceal);
      window.removeEventListener("focus", reveal);
      window.removeEventListener("pageshow", reveal);
      root.classList.remove("is-away");
    };
  }, []);

  return null;
}
