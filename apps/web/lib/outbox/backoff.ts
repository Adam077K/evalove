/**
 * When to try again.
 *
 * Exponential, jittered, five automatic attempts, and then the item stays in
 * the queue rather than being dropped. That last clause is the one that
 * matters: the schedule is about not hammering a cell tower, not about
 * deciding a photograph is unsalvageable. Nothing here ever removes anything.
 *
 * The jitter is full-range rather than a small ± band. Thirty items that all
 * hit the same dropped connection would otherwise all wake at the same
 * instant, retry together, and fail together — a thundering herd of one
 * person's photo library against one flaky tower.
 */

/** Automatic attempts before the queue waits to be asked. */
export const MAX_AUTOMATIC_ATTEMPTS = 5;

const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 60_000;

/**
 * Delay before attempt number `attempts + 1`.
 *
 * @param attempts how many attempts have already been made
 * @param random   injected so the schedule is testable; defaults to Math.random
 */
export function backoffDelayMs(
  attempts: number,
  random: () => number = Math.random,
): number {
  const exponent = Math.max(0, attempts);
  const ceiling = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** exponent);
  // Full jitter: uniform in [0, ceiling]. A floor of a few hundred ms keeps a
  // tight retry loop from spinning when the connection is refusing instantly.
  return Math.max(250, Math.round(random() * ceiling));
}

/** Has this item spent its automatic attempts? */
export function isAwaitingPerson(attempts: number): boolean {
  return attempts >= MAX_AUTOMATIC_ATTEMPTS;
}

/** The instant an item becomes eligible again. */
export function nextAttemptAt(
  attempts: number,
  now: Date = new Date(),
  random: () => number = Math.random,
): string {
  return new Date(now.getTime() + backoffDelayMs(attempts, random)).toISOString();
}

/** Is this item eligible for the drain to pick up on its own? */
export function isEligible(
  record: { nextAttemptAt?: string; awaitingPerson: boolean; state: string },
  now: Date = new Date(),
): boolean {
  if (record.state === "committed") return false;
  if (record.awaitingPerson) return false;
  if (!record.nextAttemptAt) return true;
  return Date.parse(record.nextAttemptAt) <= now.getTime();
}
