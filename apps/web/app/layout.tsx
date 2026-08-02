import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eva & Adam",
  description: "A private shared space for two.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Root layout.
 *
 * `dir` is FIXED to "ltr" and `lang` is FIXED to "en" — founder decision D7.
 * English only. There is deliberately no i18n framework, no locale negotiation,
 * no locale switcher and no RTL mirroring anywhere in this app. Do not add one
 * "for later": adding it later is cheaper than carrying it now.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
