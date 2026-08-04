"use client";

import { clsx } from "clsx";
import { useId } from "react";

/**
 * A form field: label above, a rounded well, error below in plain
 * language. Errors state what happened and what to do — never a
 * scold — and they are carried in the danger colour, which belongs
 * to no one. Neither person's ink ever marks a mistake.
 *
 * Focus is ink on ink: the border darkens to full ink rather than
 * taking an accent, because there is no accent. The global
 * `:focus-visible` ring in globals.css handles keyboard focus; this
 * border is the pointer-and-typing affordance underneath it.
 */
export function Field({
  label,
  error,
  hint,
  inputProps,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="type-label text-ink">
        {label}
      </label>
      <input
        id={id}
        {...inputProps}
        /* These sit AFTER the spread, deliberately.
           The red border is driven off `aria-invalid` by a rule in
           globals.css, which makes that attribute load-bearing rather
           than advisory — so a caller passing `aria-invalid` through
           `inputProps` could have silently suppressed the only
           non-textual signal that something went wrong. The `error`
           prop is the single source of truth for invalidity and it
           wins over anything spread in. */
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className={clsx(
          "type-body well w-full rounded-[0.625rem] px-4 py-3 text-ink outline-none",
          "transition-[border-color] duration-200",
          /* No border utility here on purpose. `.well` sets the edge
             with a shorthand at the same specificity, so a utility
             class was losing the cascade silently. The red comes from
             `input[aria-invalid="true"]` in globals.css, which wins on
             specificity and applies to every field in the product
             rather than only the ones that remembered to ask. */
          error ? "[animation:shake_320ms_var(--ease-out)]" : "",
          inputProps?.className,
        )}
      />
      {error ? (
        <p id={`${id}-err`} className="type-caption text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="type-caption text-mute">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
