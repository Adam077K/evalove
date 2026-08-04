import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/outfit";
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/fraunces/full-italic.css";
/* Authorship scripts — §2 of the design law. One face per person,
   never swapped. Caveat = Eva (flowing cursive). Patrick Hand = Adam
   (semi-print). Poiret One = DECO titling only, ≥32px, night only. */
import "@fontsource-variable/caveat";
import "@fontsource/patrick-hand";
import "@fontsource/poiret-one";
import "./globals.css";
import { NoiseLayer } from "@/components/chrome/NoiseLayer";
import { PrivacyVeil } from "@/components/chrome/PrivacyVeil";
import { ServiceWorkerRegistration } from "@/components/chrome/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Eva & Adam",
  description: "The sky between two cities.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F5F1" },
    /* Night canvas per D1: the paper dims, it does not invert. */
    { media: "(prefers-color-scheme: dark)", color: "#BAB1A2" },
  ],
};

/**
 * Mode: follow prefers-color-scheme, manual override persisted per
 * device. Never switched on the local clock — an app that overrides
 * a 3 a.m. daylight choice is an app with opinions.
 * (?mode=night|day is the preview override; localStorage the real one.)
 */
const modeScript = `
try {
  var q = new URLSearchParams(location.search).get("mode");
  var m = q || localStorage.getItem("ea-mode");
  if (m === "night" || m === "day") document.documentElement.dataset.mode = m;
} catch (e) {}
`;

/**
 * The dock's measurements live here, on the scroll container itself,
 * because two different things need them and only one of them is in
 * document coordinates.
 *
 *   --dock-offset     how far the pill floats off the bottom edge
 *   --dock-footprint  the whole band the dock covers: pill + offset
 *
 * `scroll-padding-bottom` is the load-bearing line. A `padding-bottom`
 * further down the tree only lengthens the document, so it buys
 * clearance at exactly one scroll offset — the very end. Every other
 * scroll the browser performs (focusing a link, `scrollIntoView`, a
 * hash target, Safari revealing an input above the keyboard) aligns to
 * the *scrollport*, and the scrollport's bottom edge is the viewport's
 * bottom edge — underneath the dock. Insetting the scrollport is what
 * makes the clearance true at every scroll offset instead of one, and
 * it holds whether the page overflows or not: if there is nothing to
 * scroll, there is no scroll to land wrong.
 */
const DOCK_VARS =
  "[--dock-offset:max(1rem,env(safe-area-inset-bottom))] " +
  "[--dock-footprint:calc(4rem+var(--dock-offset))] " +
  "scroll-pb-[calc(var(--dock-footprint)+1rem)]";

/**
 * `dir` is FIXED to "ltr" and `lang` is FIXED to "en" — founder decision D7.
 * English only. There is deliberately no i18n framework, no locale negotiation,
 * no locale switcher and no RTL mirroring anywhere in this app. Do not add one
 * "for later": adding it later is cheaper than carrying it now.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={DOCK_VARS} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: modeScript }} />
      </head>
      <body className="min-h-[100dvh]">
        {children}
        <NoiseLayer />
        <PrivacyVeil />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
