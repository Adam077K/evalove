/**
 * Eva & Adam — one typed string, two credentials, and who it was.
 *
 * THE RULE THIS MODULE EXISTS TO HOLD: EVERY CREDENTIAL IS EVALUATED, EVERY
 * TIME. Not "until one matches". Every one, on every attempt, including the
 * attempts that match on the first.
 *
 * WHY. There are two passwords now — Eva's and Adam's — and the obvious
 * implementation is a loop that returns as soon as one of them verifies. That
 * loop is an oracle. scrypt at the configured cost is tens of milliseconds, so
 * a door that stops early answers Eva (checked first) in one scrypt and Adam in
 * two, and the difference is plainly visible from outside with nothing but a
 * stopwatch. Anyone who can time two logins learns which of the two names is
 * attached to a password they are guessing — the exact fact this change exists
 * to put in the session token, handed out for free to someone who has not got
 * in. `lib/auth/timing.ts` holds every DECLINING answer to a shared floor;
 * nothing holds a successful one, and nothing should: an accepted login has to
 * feel immediate. So the uniformity has to come from the work itself.
 *
 * `Promise.all` over the whole list is what enforces it. Both derivations are
 * started before anything is awaited, so no arrangement of results can skip
 * one, and the wall-clock cost is the same for whichever password was typed.
 *
 * IF YOU ARE ABOUT TO "OPTIMISE" THIS INTO AN EARLY RETURN: the second scrypt
 * is not waste. It is the whole feature. `__tests__/door.test.ts` counts the
 * verifications and will fail, which is the intended outcome.
 *
 * NODE ONLY — `verifySecret` is scrypt. Every caller declares
 * `runtime = "nodejs"`.
 */

import { verifySecret } from "@/lib/auth/password";
import type { ScryptHash } from "@/lib/env";
import type { MemberSlug } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * Shapes
 * ------------------------------------------------------------------ */

/** One person's way in. */
export interface DoorCredential {
  /** Whose credential this is. `eva` or `adam`, never an index. */
  readonly slug: MemberSlug;
  /**
   * The environment variable it came from, for logs.
   *
   * A NAME, never a value. This string can end up in a log aggregator; the
   * hash it labels must not.
   */
  readonly label: string;
  /** The parsed credential itself. */
  readonly hash: ScryptHash;
}

/** What the door concluded. */
export interface DoorAnswer {
  /** Did anything match at all? The only field that decides 200 versus 401. */
  readonly opened: boolean;
  /**
   * Whose password it was, when exactly one credential matched.
   *
   * Null when nothing matched, and null when MORE than one did — see
   * `ambiguous`. A caller must not fall back to a default name on null: that
   * would put the wrong person's name on whatever is written next, which is
   * the failure this whole seam exists to prevent.
   */
  readonly slug: MemberSlug | null;
  /**
   * More than one credential matched the same string.
   *
   * Only possible when two of the secrets ARE the same secret, hashed under
   * different salts — the one derivation mistake `lib/env.ts` cannot see at
   * boot, because two independent salts over one password produce two
   * different keys and there is nothing to compare. It becomes visible here,
   * at the only moment it can be: when one typed string opens both.
   *
   * Deliberately NOT a refusal. Locking both of them out of an archive with no
   * reset flow because the founder reused a password is a worse outcome than
   * letting them in without claiming to know which one arrived.
   */
  readonly ambiguous: boolean;
}

/** The verification this module performs, as a seam a test can count. */
export type VerifyCredential = (
  candidate: string,
  hash: ScryptHash,
) => Promise<boolean>;

/* ------------------------------------------------------------------ *
 * The door
 * ------------------------------------------------------------------ */

/**
 * Does this string open the door, and whose is it?
 *
 * @param candidate the typed password, exactly as typed — not trimmed, not
 *   lowercased. Normalisation belongs to `verifySecret`, which does NFC and
 *   nothing else.
 * @param credentials every credential the door accepts, Eva first. Order is
 *   for legibility only: it cannot affect the answer, because all of them are
 *   evaluated before any of them is read.
 * @param verify the check to run. Defaults to the real scrypt one; a test
 *   substitutes a counting stand-in to prove that all of them ran.
 */
export async function openDoor(
  candidate: string,
  credentials: readonly DoorCredential[],
  verify: VerifyCredential = verifySecret,
): Promise<DoorAnswer> {
  // Started before anything is awaited. `.map` builds every promise first, so
  // there is no point in this function at which one credential's result is
  // known and another's work has not begun.
  const outcomes = await Promise.all(
    credentials.map((credential) => verify(candidate, credential.hash)),
  );

  const matched = credentials.filter((_, index) => outcomes[index] === true);

  if (matched.length === 0) return { opened: false, slug: null, ambiguous: false };
  if (matched.length === 1) {
    return { opened: true, slug: matched[0]!.slug, ambiguous: false };
  }

  return { opened: true, slug: null, ambiguous: true };
}
