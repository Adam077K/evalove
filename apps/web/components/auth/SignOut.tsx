"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { forgetViewer } from "@/lib/viewer";

/**
 * The way out. One line of text at the foot of Today, and nothing else.
 *
 * WHY THIS EXISTS AT ALL. `DELETE /api/session` has worked since the
 * session layer was written, the service worker has purged its caches
 * on a 204 from it since the offline work, and until now NOTHING IN THE
 * APP CALLED IT — there was no way to sign out. Handing the phone to
 * someone, losing it, or letting a friend look at one photograph all
 * had the same answer: clear the site data in Safari's settings.
 *
 * WHY IT IS A LINE OF TEXT AND NOT A BUTTON. Signing out of a private
 * archive that two people share is rare and, in this product, faintly
 * sad — it is the thing you do when you are handing your phone over.
 * A filled control at the foot of the table would advertise it. The
 * dock is three destinations and a pen, by decision (2026-08-06), and
 * the band is instrumentation, so neither is the place. The foot of
 * Today, after the last object on the table, is where you stop reading.
 *
 * NO CONFIRMATION. There is no "Are you sure?", because there is
 * nothing to be sure about: signing back in is typing the password
 * again, and a dialog would make an ordinary act feel like a mistake.
 * The only irreversible thing on the way out is the local outbox, and
 * that is not touched here.
 *
 * WHAT IT DOES, IN ORDER: ask the server to expire both cookies, forget
 * the name in localStorage (the server cannot reach that, and it is the
 * thing that would otherwise greet the next person by the last one's
 * name), then navigate to the door. `router.refresh()` after the
 * replace so no Server Component keeps rendering from a cache taken
 * while somebody was signed in.
 */
export function SignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    if (pending) return;
    setPending(true);
    try {
      // 204 whether or not there was a session — the route is
      // idempotent by design, so there is no status worth branching on.
      // A failed fetch is the one case that must NOT proceed: clearing
      // the local name while the session cookie survives leaves them
      // signed in and unnamed.
      const response = await fetch("/api/session", { method: "DELETE" });
      if (!response.ok) {
        setPending(false);
        return;
      }
    } catch {
      setPending(false);
      return;
    }

    forgetViewer();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="mt-16 mb-2 flex justify-center">
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className="type-micro press rounded-[8px] px-3 py-2 text-mute normal-case underline decoration-line underline-offset-4 disabled:opacity-60"
      >
        {pending ? "Closing…" : "Sign out"}
      </button>
    </div>
  );
}
