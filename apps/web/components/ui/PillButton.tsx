import { clsx } from "clsx";

/**
 * The one primary action per screen.
 *
 * It used to be filled with the gradient of whoever was holding the
 * phone — Eva pressed rose, Adam pressed amber — and it glowed. Both
 * are gone: the palette has no accent colour at all now, and a
 * person's ink is never a fill and never a button.
 *
 * What replaces it is stronger, and it comes from SORDJATI: an ink
 * pill with paper text. In a page made of warm paper and hairlines,
 * the only solid black object is unmistakably the thing to press.
 * Nothing else on the screen can compete with it, which is exactly
 * what "one primary action" is supposed to mean.
 *
 * `quiet` is the secondary form — paper, a hairline, ink text.
 */
export function PillButton({
  variant = "ink",
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "ink" | "quiet";
}) {
  return (
    <button
      {...rest}
      className={clsx(
        "press inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3",
        "type-card",
        variant === "ink" ? "pill-ink" : "pill-quiet",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** The quiet alternative — text only, no fill, no border. */
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
