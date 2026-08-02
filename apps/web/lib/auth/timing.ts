/**
 * Eva & Adam — making every unsuccessful answer take the same time.
 *
 * A constant-time password COMPARISON is not enough on its own. The route can
 * decline for several different reasons — malformed body, rate limited, wrong
 * password — and those cost wildly different amounts of work: rejecting a
 * malformed body is microseconds, running scrypt is tens of milliseconds. Left
 * alone, the response latency tells anyone with a stopwatch which branch they
 * hit, and "this one took 60ms instead of 2ms" is the same information as
 * "that request got as far as the password check".
 *
 * So every declining path is held to one floor. Not a delay ADDED to the work
 * done — a floor the response is not allowed to come back before, which is the
 * difference between "all failures take at least 250ms" and "all failures take
 * about 250ms". Only the second one is uniform.
 *
 * The floor is above the cost of the most expensive declining branch (scrypt at
 * the configured cost, tens of milliseconds), and low enough that a mistyped
 * password still feels like an answer rather than a hang.
 */

/** The floor, in milliseconds. Every unsuccessful answer waits for it. */
export const FAILURE_FLOOR_MS = 250;

/**
 * A monotonic reading, for measuring how long we have already spent.
 *
 * `performance.now()` rather than `Date.now()`: the wall clock can step
 * backwards over an NTP correction, and a negative elapsed time would collapse
 * the floor to nothing at exactly the moment nobody is watching.
 */
export function startClock(): number {
  return performance.now();
}

/**
 * Wait until `FAILURE_FLOOR_MS` have passed since `startedAt`, then return.
 *
 * If the work already took longer than the floor this returns immediately — it
 * cannot un-spend time, and an overrun means the floor should be raised rather
 * than that this call should sleep another quarter second.
 */
export async function holdUntilFloor(
  startedAt: number,
  floorMs: number = FAILURE_FLOOR_MS,
): Promise<void> {
  const remaining = floorMs - (performance.now() - startedAt);
  if (remaining <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, remaining));
}
