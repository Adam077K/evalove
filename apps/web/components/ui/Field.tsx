"use client";

import { clsx } from "clsx";
import { useId } from "react";

/**
 * A form field in the book's register: label above, a ruled line
 * rather than a boxed input, error below in plain language.
 * Errors state what happened and what to do — never a scold.
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
      <label htmlFor={id} className="type-eyebrow text-ink-soft">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...inputProps}
        className={clsx(
          "type-body w-full bg-transparent pb-2 text-ink outline-none",
          "border-b transition-colors duration-180",
          error ? "border-ink-eva" : "border-paper-edge focus:border-ink-soft",
          inputProps?.className,
        )}
      />
      {error ? (
        <p id={`${id}-err`} className="type-caption text-ink-eva">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="type-caption text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
