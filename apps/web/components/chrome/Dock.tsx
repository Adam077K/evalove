"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { BookOpen, Home, MessageCircle, Plus, Sparkles } from "lucide-react";
import { partnerOf } from "@/lib/fixtures/members";
import { useViewer } from "@/lib/viewer";

/**
 * The dock — a floating glass pill, the app's one piece of fixed
 * chrome. Four destinations and, in the middle, the quick send: a
 * raised violet circle, because sending something small is the most
 * frequent act of the whole product.
 *
 * The active tab carries a soft violet pill that slides between
 * destinations on a spring (layoutId), and the active label speaks —
 * inactive tabs are icons only, like a dock should be.
 *
 * The Partner tab is titled with the OTHER person's name: on Eva's
 * phone the conversation is with Adam. Today and the pocket are not
 * here on purpose — Today is the hero of Home, and the pocket is
 * behind its lock in the Home header, never one accidental tap away.
 */

const SPRING = { type: "spring" as const, stiffness: 420, damping: 34 };

/**
 * DOCK_FOOTPRINT — how much of the bottom of the screen this dock
 * covers: the pill (`p-1.5` twice over plus its tallest child, the
 * 3.25rem send button = 4rem) plus the offset it floats at, which is
 * `max(1rem, env(safe-area-inset-bottom))` so it clears the iOS home
 * indicator.
 *
 *     calc(4rem + max(1rem, env(safe-area-inset-bottom)))
 *
 * Because the dock is fixed it reserves none of this in the flow.
 * Anything that has to stop above it reserves the footprint itself:
 * the column's bottom padding in `app/(app)/layout.tsx`, and the
 * echo composer's sticky offset. If the pill's height changes, those
 * two change with it.
 */

export function Dock() {
  const pathname = usePathname();
  const { member } = useViewer();
  const partner = partnerOf(member);

  const tabs = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/book", label: "The book", icon: BookOpen },
    { href: "/dates", label: "Dates", icon: Sparkles },
    { href: "/partner", label: partner.displayName, icon: MessageCircle },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="glass-strong flex items-center gap-1 rounded-full p-1.5">
        {tabs.slice(0, 2).map((t) => (
          <DockTab key={t.href} tab={t} active={isActive(t.href)} />
        ))}

        {/* Quick send — the raised centre. */}
        <Link
          href="/send"
          aria-label="Send something small"
          className="press relative mx-1 flex h-13 w-13 shrink-0 items-center justify-center rounded-full text-on-accent shadow-glow-us"
          style={{ background: "var(--grad-us)" }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
          />
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
        active ? "px-4 text-us-deep" : "w-11 text-mute"
      }`}
    >
      {active ? (
        <motion.span
          layoutId="dock-active"
          transition={SPRING}
          className="absolute inset-0 rounded-full bg-us-soft"
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
