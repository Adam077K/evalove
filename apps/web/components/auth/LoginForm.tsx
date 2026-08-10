"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/Field";
import { PillButton } from "@/components/ui/PillButton";
import { declareViewer } from "@/lib/viewer";
import type { MemberSlug } from "@/lib/types";

/**
 * The door — and the tap that used to follow it, for the sessions that
 * still need one.
 *
 * ONE STEP NOW, USUALLY. Eva and Adam have their own passwords
 * (2026-08-10), so the server knows which of them typed one and says so
 * in the success body as `who`. When it does, this form records that
 * name itself and goes straight in: asking "who's this?" when the door
 * has already established the answer is asking a question we know, and
 * inviting an answer that contradicts it.
 *
 * THE PICKER IS NOT DEAD CODE. The server omits `who` when it could not
 * attribute the login — the case being two credentials that turn out to
 * be the same secret (`lib/auth/door.ts`). Then the tap is the only
 * thing that knows, and the old two-step flow runs exactly as it did.
 *
 * WHEN IT DOES RUN IT IS ATTRIBUTION, NOT AUTHENTICATION: it decides
 * whose name goes on what gets written next, it gates nothing, either
 * person can pick either name, and it lives in a cookie script can read
 * — because it is not a secret and treating it like one is how someone
 * later starts trusting it. See `lib/session/profile.ts`.
 */

type Step = "password" | "who";

/** Whose password it was, if the response said. Nothing else is read. */
function whoFrom(body: unknown): MemberSlug | undefined {
  if (!body || typeof body !== "object" || !("who" in body)) return undefined;
  const who = (body as { who: unknown }).who;
  // Narrowed rather than cast: this value decides which name goes on
  // everything written next, and `lib/session/profile.ts` refuses
  // anything but the two slugs for the same reason.
  return who === "eva" || who === "adam" ? who : undefined;
}

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [next, setNext] = useState("/today");

  // Where they were heading before the door stopped them. Read from the
  // live location rather than `useSearchParams` so this page has no
  // Suspense boundary to get wrong, and validated as a same-site path —
  // a redirect target taken from a query string is an open redirect
  // unless something refuses the ones that leave.
  useEffect(() => {
    try {
      const raw = new URLSearchParams(window.location.search).get("next");
      if (raw && raw.startsWith("/") && !raw.startsWith("//")) setNext(raw);
    } catch {
      /* the default is already /today */
    }
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending || password === "") return;

    setPending(true);
    setError(undefined);
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setPassword("");

        // The door's own answer, when it has one. `enter` writes the
        // same cookie the tap would have written, so nothing downstream
        // can tell the two paths apart — this is one fewer screen, not
        // a second way of recording a name.
        const who = whoFrom(await response.json().catch(() => null));
        if (who) enter(who);
        else setStep("who");
        return;
      }

      // The server sends one sentence for every declining case on
      // purpose. It is shown as written rather than re-worded here, so
      // there is one place that decides how much a wrong password is
      // told about why.
      const body: unknown = await response.json().catch(() => null);
      const message =
        body && typeof body === "object" && "message" in body
          ? String((body as { message: unknown }).message)
          : "That's not it. Try again.";
      setPassword("");
      setError(message);
    } catch {
      setError("Couldn't reach the server. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  /**
   * Record the name and go in. Both paths end here — the tap and the
   * server's `who` — so there is one place that decides what "signed
   * in" does, and no chance of the two drifting apart.
   */
  function enter(slug: MemberSlug) {
    declareViewer(slug);
    router.replace(next);
    // A full refresh, so Server Components re-render having seen the
    // profile cookie. Without it the first screen after signing in is
    // rendered from a cache that predates the choice.
    router.refresh();
  }

  if (step === "who") {
    return (
      <div className="w-full max-w-xs text-center">
        <h1 className="type-hero text-ink">Who&rsquo;s this?</h1>
        <p className="type-body measure mx-auto mt-2 text-mute">
          So the right name lands on what you write. You can change it
          any time — it decides nothing else.
        </p>
        {/* Both quiet, neither filled: filling one and not the other
            would make one of them the recommended answer.

            No ink dots here. They were a legend, and a legend is the
            one thing the authorship mark must not be — it means "made
            by", and nobody has made anything at this point in the
            session. The mapping is learned where it is actually
            spent: on a photograph or a sealed note that carries the
            edge and the maker's name together. */}
        <div className="mt-8 flex flex-col gap-3">
          <PillButton
            variant="quiet"
            onClick={() => enter("eva")}
            className="w-full"
          >
            Eva
          </PillButton>
          <PillButton
            variant="quiet"
            onClick={() => enter("adam")}
            className="w-full"
          >
            Adam
          </PillButton>
        </div>
      </div>
    );
  }

  return (
    <form className="w-full max-w-xs text-left" onSubmit={submit}>
      <Field
        label="Password"
        error={error}
        inputProps={{
          type: "password",
          value: password,
          onChange: (e) => {
            setPassword(e.target.value);
            setError(undefined);
          },
          // Each of them has their own now, kept in their own manager.
          // `current-password` is what lets a manager offer it, and it
          // is also why there is no name field above this one: the
          // password IS the name, and a manager keyed on this origin
          // offers whichever one belongs to this phone.
          autoComplete: "current-password",
          autoFocus: true,
          enterKeyHint: "go",
          disabled: pending,
        }}
      />
      <PillButton
        type="submit"
        disabled={password === "" || pending}
        className="mt-5 w-full"
      >
        {pending ? "One moment…" : "Come in"}
      </PillButton>
    </form>
  );
}
