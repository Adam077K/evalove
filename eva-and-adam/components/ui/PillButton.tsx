import { clsx } from "clsx";
import type { Identity } from "@/lib/types";

/**
 * The one primary action per screen — a pill, filled with the ink
 * of whoever is holding the phone. Eva sees a rose-oxblood button;
 * Adam sees a marine one. Paper-coloured label; both pairings clear
 * WCAG AA in both modes (5.64:1 / 7.99:1 day, 6.08:1 / 7.23:1 night).
 */
export function PillButton({
  ink,
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  ink: Identity;
}) {
  return (
    <button
      {...rest}
      className={clsx(
        "press inline-flex min-h-11 items-center justify-center rounded-full px-6 py-2.5",
        "type-entry-title text-paper",
        ink === "eva" ? "bg-ink-eva" : "bg-ink-adam",
        className,
      )}
      style={{ color: "var(--paper)" }}
    >
      {children}
    </button>
  );
}

/** The quiet alternative — text only, no fill, soft ink. */
export function TextButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={clsx(
        "press inline-flex min-h-11 items-center justify-center px-4 py-2",
        "type-body text-ink-soft",
        className,
      )}
    >
      {children}
    </button>
  );
}
