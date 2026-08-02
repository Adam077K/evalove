import type { Metadata, Viewport } from "next";
import "@fontsource-variable/literata";
import "@fontsource-variable/literata/wght-italic.css";
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/fraunces/full-italic.css";
import "./globals.css";
import { NoiseLayer } from "@/components/chrome/NoiseLayer";

export const metadata: Metadata = {
  title: "Eva & Adam",
  description: "A book for two people.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F6F1E9",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: modeScript }} />
      </head>
      <body className="min-h-[100dvh]">
        {children}
        <NoiseLayer />
      </body>
    </html>
  );
}
