import { clsx } from "clsx";
import type { MemberSlug } from "@/lib/types";

/**
 * The one primary action per screen — a pill filled with the
 * gradient of whoever is holding the phone. Eva presses rose,
 * Adam presses amber; the fill glows softly because primary
 * actions in this product are warm, not procedural.
 */
export function PillButton({
  ink,
  children,
  className,
  style,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  ink: MemberSlug;
}) {
  return (
    <button
      {...rest}
      className={clsx(
        "press relative inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3",
        "type-card text-on-accent",
        ink === "eva" ? "shadow-glow-eva" : "shadow-glow-adam",
        className,
      )}
      style={{
        background: ink === "eva" ? "var(--grad-eva)" : "var(--grad-adam)",
        boxShadow: undefined,
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)" }}
      />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

/** The quiet alternative — text only, no fill. */
export function TextButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={clsx(
        "press inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2",
        "type-label text-mute",
        className,
      )}
    >
      {children}
    </button>
  );
}
