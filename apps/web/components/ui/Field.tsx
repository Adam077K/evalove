"use client";

import { clsx } from "clsx";
import { useId } from "react";

/**
 * A form field: label above, a soft rounded well, error below in
 * plain language. Errors state what happened and what to do — never
 * a scold — and they are carried in the danger colour, which belongs
 * to no one (rose is Eva's, amber is Adam's; mistakes are nobody's).
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
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...inputProps}
        className={clsx(
          "type-body well w-full rounded-[0.875rem] px-4 py-3 text-ink outline-none",
          "border transition-[border-color,box-shadow] duration-200",
          error
            ? "border-danger"
            : "border-transparent focus:border-us focus:shadow-[0_0_0_3px_var(--us-tint)]",
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
