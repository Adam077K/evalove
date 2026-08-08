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
 * The tray's and the band's measurements live here, on the scroll
 * container itself, because two different things need each of them and
 * only one of those things is in document coordinates.
 *
 *   --dock-footprint  the whole band the tray covers: its tallest
 *                     tool (3.25rem send) + 0.5rem lip + the floor
 *                     padding, max(0.5rem, safe-area). There is no
 *                     --dock-offset any more: the tray rests flush
 *                     against the bottom edge — an object on the
 *                     table does not hover.
 *
 *   --band-height     the masthead's own height: 56px (Design-Lead's
 *                     figure) plus the safe-area inset it sits inside,
 *                     not stacked on top of. Fixed like the tray, so
 *                     it is reserved space for the shared shell's
 *                     `<main>` the same way `--dock-footprint` is —
 *                     see `app/(app)/layout.tsx`.
 *
 * `scroll-padding-*` is the load-bearing line for both edges. A
 * `padding` further down the tree only lengthens the document, so it
 * buys clearance at exactly one scroll offset — the very end (or, for
 * the top, the very start). Every other scroll the browser performs
 * (focusing a link, `scrollIntoView`, a hash target, Safari revealing
 * an input above the keyboard) aligns to the *scrollport*, and the
 * scrollport's edges are the viewport's edges — underneath the tray,
 * or under the band. Insetting the scrollport is what makes the
 * clearance true at every scroll offset instead of one, and it holds
 * whether the page overflows or not: if there is nothing to scroll,
 * there is no scroll to land wrong.
 */
const CHROME_VARS =
  "[--dock-footprint:calc(3.75rem+max(0.5rem,env(safe-area-inset-bottom)))] " +
  "[--band-height:calc(56px+env(safe-area-inset-top))] " +
  "scroll-pb-[calc(var(--dock-footprint)+1rem)] " +
  "scroll-pt-[var(--band-height)]";

/**
 * `dir` is FIXED to "ltr" and `lang` is FIXED to "en" — founder decision D7.
 * English only. There is deliberately no i18n framework, no locale negotiation,
 * no locale switcher and no RTL mirroring anywhere in this app. Do not add one
 * "for later": adding it later is cheaper than carrying it now.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={CHROME_VARS} suppressHydrationWarning>
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
