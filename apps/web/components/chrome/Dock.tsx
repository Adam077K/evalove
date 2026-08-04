"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { AudioLines, BookOpen, Home, Plus, Sparkles } from "lucide-react";

/**
 * The dock — a floating pill, the app's one piece of fixed chrome.
 * Four destinations and, in the middle, the quick send, because
 * sending something small is the most frequent act of the whole
 * product.
 *
 * Opaque, not glass. Glass was attempt #2's fingerprint, and it also
 * failed in the window that matters most: a translucent dock at 11pm
 * put low-contrast chrome over whatever happened to be behind it.
 * White stock, a hairline, a real shadow, and it reads the same over
 * a photograph as over an empty page.
 *
 * The active tab is ink-filled with paper text — the one solid
 * control in a palette with no accent colour, taken from SORDJATI's
 * black pill. It slides between destinations on a spring (layoutId),
 * and the active label speaks; inactive tabs are icons only, like a
 * dock should be.
 *
 * The fourth tab is Echo, and it is labelled "Echo" — never the
 * other person's name. A tab reading "Adam" is a claim that tapping
 * it reaches Adam, and hard line 1 of the AI spec is that this
 * surface may never be mistakable for him. The pocket is behind its
 * lock at the foot of Today, never one accidental tap away.
 */

const SPRING = { type: "spring" as const, stiffness: 420, damping: 34 };

/**
 * How much of the bottom of the screen this dock covers is published
 * as `--dock-footprint`, declared on `<html>` in `app/layout.tsx`:
 * the pill (`p-1.5` twice over plus its tallest child, the 3.25rem
 * send button = 4rem) plus `--dock-offset`, the gap it floats at,
 * which is `max(1rem, env(safe-area-inset-bottom))` so it clears the
 * iOS home indicator.
 *
 * The pill's own offset below reads that same variable, so the 4rem
 * in the footprint is the one number describing this component and it
 * is asserted, not restated: if the pill's height changes, change it
 * in `app/layout.tsx` and every consumer follows. Consumers today are
 * the column's bottom padding and the page's `scroll-padding-bottom`
 * (`app/(app)/layout.tsx`, `app/layout.tsx`), the echo composer's
 * sticky offset, and the pocket gate's column height.
 */

export function Dock() {
  const pathname = usePathname();

  const tabs = [
    { href: "/today", label: "Today", icon: Home },
    { href: "/book", label: "The book", icon: BookOpen },
    { href: "/dates", label: "Dates", icon: Sparkles },
    { href: "/echo", label: "Echo", icon: AudioLines },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[var(--dock-offset)] pointer-events-none"
    >
      {/* pointer-events-none on the nav so the full-width transparent band
          does not swallow taps on page content (links, the pocket lock) that
          fall within the nav's bounding box but outside the pill itself.
          pointer-events-auto restores interactivity on the pill card only. */}
      <div className="card flex items-center gap-1 rounded-full p-1.5 shadow-float pointer-events-auto">
        {tabs.slice(0, 2).map((t) => (
          <DockTab key={t.href} tab={t} active={isActive(t.href)} />
        ))}

        {/* Quick send — the raised centre. */}
        <Link
          href="/send"
          aria-label="Send something small"
          className="press pill-ink mx-1 flex h-13 w-13 shrink-0 items-center justify-center rounded-full"
        >
          <Plus size={24} strokeWidth={2} />
        </Link>

        {tabs.slice(2).map((t) => (
          <DockTab key={t.href} tab={t} active={isActive(t.href)} />
        ))}
      </div>
    </nav>
  );
}

function DockTab({
  tab,
  active,
}: {
  tab: { href: string; label: string; icon: typeof Home };
  active: boolean;
}) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={`press relative flex h-11 items-center justify-center rounded-full transition-colors duration-200 ${
        active ? "px-4 text-on-ink" : "w-11 text-mute"
      }`}
    >
      {active ? (
        <motion.span
          layoutId="dock-active"
          transition={SPRING}
          className="pill-ink absolute inset-0 rounded-full"
        />
      ) : null}
      <span className="relative flex items-center gap-1.5">
        <Icon size={20} strokeWidth={1.9} />
        {active ? (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={SPRING}
            className="type-label whitespace-nowrap"
          >
            {tab.label}
          </motion.span>
        ) : (
          <span className="sr-only">{tab.label}</span>
        )}
      </span>
    </Link>
  );
}
