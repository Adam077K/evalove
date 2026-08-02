"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { PillButton } from "@/components/ui/PillButton";
import { useViewer } from "@/lib/viewer";

/**
 * The gate. It asks every time — there is no "remember this device"
 * for the pocket, by decision. A wrong passphrase gets a plain
 * sentence and a small shake; there is no attempt counter and no
 * lockout theatre, because the only two people who know this app
 * exists are the two people it belongs to.
 *
 * In the fixture build the passphrase check always declines, and
 * says so honestly — the real check arrives with the backend seam.
 */
export function PocketGate() {
  const { member } = useViewer();
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [checking, setChecking] = useState(false);

  const tryOpen = () => {
    if (phrase.trim() === "" || checking) return;
    setChecking(true);
    setError(undefined);
    window.setTimeout(() => {
      setChecking(false);
      setPhrase("");
      setError(
        "That's not it — the pocket stays closed. (The real lock isn't wired on this build yet; it declines everything.)",
      );
    }, 700);
  };

  return (
    <div className="flex min-h-[calc(100dvh-16rem)] flex-col items-center justify-center text-center">
      <span
        className="glass flex h-20 w-20 items-center justify-center rounded-full text-us-deep"
        aria-hidden="true"
      >
        <Lock size={30} strokeWidth={1.6} />
      </span>

      <h1 className="type-hero mt-6 text-ink">The pocket</h1>
      <p className="type-body measure mt-2 text-mute">
        Private things live here. It opens with the passphrase, every
        time — nothing inside is ever previewed, thumbnailed, or shown
        anywhere else in the app.
      </p>

      <form
        className="mt-8 w-full max-w-xs text-left"
        onSubmit={(e) => {
          e.preventDefault();
          tryOpen();
        }}
      >
        <Field
          label="Passphrase"
          error={error}
          inputProps={{
            type: "password",
            value: phrase,
            onChange: (e) => {
              setPhrase(e.target.value);
              setError(undefined);
            },
            autoComplete: "off",
            enterKeyHint: "go",
          }}
        />
        <PillButton
          ink={member.slug}
          type="submit"
          disabled={phrase.trim() === "" || checking}
          className="mt-5 w-full disabled:opacity-50"
        >
          {checking ? "Checking…" : "Open the pocket"}
        </PillButton>
      </form>
    </div>
  );
}
