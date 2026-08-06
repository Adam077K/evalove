"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { AudioLines, BookOpen, Home, Plus, Sparkles } from "lucide-react";

/**
 * The tool tray — navigation while reading; scissors, tape and the pen
 * when editing arrives. Founder-directed 2026-08-06.
 *
 * The diagnosis it answers: the app renders a physical world and was
 * navigating it with a SaaS tab bar — a floating black-and-white pill
 * was the one piece of pure app chrome on screen and it fought
 * everything above it. So the dock stops floating and becomes an
 * object: a shallow card-stock tray resting at the near edge of the
 * table, clipped by the bottom of the screen the way the Book's
 * corner is clipped by it — partially out of frame because it
 * physically continues past the frame. Its floor is the same
 * coldpress stock as the table and it dims under the same lamp
 * (`.under-lamp`), because at 11pm the tray is in the room too.
 *
 * What it keeps from the pill, deliberately:
 *   - all four destinations plus send — the founder kept four tabs;
 *   - the ink-filled active pill (SORDJATI's black pill stays the
 *     system's one solid control, sliding on the chrome spring);
 *   - opaque material, no glass, no blur;
 *   - Echo labelled "Echo", never the other person's name (AI spec
 *     hard line 1: this surface may never be mistakable for him).
 *
 * Stage 2 (not built, designed for): the editing tools arrive as
 * additional <TrayTool> children when edit mode is found — the tray
 * itself does not change. No empty wells are shown for them: a
 * prepared place is a solicitation, and composing is never solicited.
 */

const SPRING = { type: "spring" as const, stiffness: 420, damping: 34 };

/**
 * The band this tray covers is published as `--dock-footprint` on
 * `<html>` in `app/layout.tsx`: the tallest tool (3.25rem send) plus
 * the tray's own padding (0.5rem lip, max(0.5rem, safe-area) floor).
 * The tray sits flush to the bottom edge — there is no `--dock-offset`
 * any more, because an object resting on a table does not hover. If
 * the tray's height changes, change the footprint in `app/layout.tsx`
 * and every consumer follows.
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
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center pointer-events-none"
    >
      {/* pointer-events-none on the nav so the full-width transparent band
          does not swallow taps on page content that falls within the nav's
          bounding box but outside the tray itself. */}
      <div className="tray pointer-events-auto relative flex items-center gap-1 rounded-t-[14px] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {/* The tray's floor — the coldpress stock family, but its own
            tone: a shade of card-board darker than the table, or the
            tray vanishes into the surface it rests on (measured on the
            first capture — same stock at the same tone is invisible).
            The scrim multiplies the texture only; the tools sit above
            it, so nothing token-styled dims twice (§9.3). Both layers
            sit under the room's lamp like every other material. */}
        <div
          aria-hidden="true"
          className="under-lamp absolute inset-0 rounded-t-[14px]"
          style={{
            backgroundImage: "url(/materials/paper-coldpress-stock-tile.webp)",
            backgroundSize: "58% auto",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-t-[14px] mix-blend-multiply"
          style={{ background: "rgba(151, 136, 116, 0.22)" }}
        />

        {tabs.slice(0, 2).map((t) => (
          <DockTab key={t.href} tab={t} active={isActive(t.href)} />
        ))}

        {/* Quick send — the raised centre. Sending something small is
            the most frequent act of the whole product. */}
        <Link
          href="/send"
          aria-label="Send something small"
          className="press pill-ink relative mx-1 flex h-13 w-13 shrink-0 items-center justify-center rounded-full"
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
  /* JS-driven motion is out of reach of the global reduced-motion CSS
     kill, so the spring and the label slide remove themselves here —
     full removal, not a degrade (§5). */
  const reduce = useReducedMotion();
  const transition = reduce ? { duration: 0 } : SPRING;
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={`press relative flex h-11 items-center justify-center rounded-[10px] transition-colors duration-200 ${
        active ? "px-4 text-ink" : "w-11 text-mute"
      }`}
    >
      {active ? (
        /* The tool you picked up — a paper chip sitting proud of the
           tray floor, 3px high (static offsets, never animated ones),
           its face catching the lamp along the top edge, a tight
           contact shadow beneath it on the floor. Ink on paper: the
           chip is an object in the light, not a filled control. The
           old ink capsule was a tab-bar affordance riding on a tray;
           a capsule that slides is Linear, a lifted tool is a
           scrapbook. Cut corner (radius-md) because paper is cut —
           pills are for controls, which this no longer is. */
        <motion.span
          layoutId="dock-active"
          transition={transition}
          className="absolute inset-x-0 -top-[3px] bottom-[3px] rounded-[10px] border border-line bg-surface"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 1px 1px rgba(41, 32, 24, 0.1), 0 4px 10px -2px rgba(41, 32, 24, 0.2)",
          }}
        />
      ) : null}
      <span
        className={`relative flex items-center gap-1.5 ${
          active ? "-translate-y-[3px]" : ""
        }`}
      >
        <Icon size={20} strokeWidth={1.9} />
        {active ? (
          <motion.span
            initial={reduce ? false : { opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={transition}
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
