/**
 * Turn a burst of overlapping async calls into a strict sequence.
 *
 * `QuickSend`'s `drain()` is fired from three independent places — the mount
 * effect, `send()`, and `retry()` — and any two of them can land in the same
 * tick: open the composer while the queue is still catching up from launch,
 * or hit Send right as the mount-effect drain is mid-flight. `drainOutbox`
 * itself has no defence against that: its very first line is `store.pending()`,
 * so two overlapping calls both read the same snapshot, both take their own
 * upload ticket for the same item, and both PUT to a different storage path
 * under a different `photoId`. The commit endpoint's idempotency on
 * `clientUuid` means only one of the two rows is ever written — but the
 * loser's bytes already landed in storage under the ticket nobody's `photos`
 * row points at, and nothing here or in `purgePhoto` is allowed to clean that
 * up (nothing is ever permanently deleted). The fix is not to make
 * `drainOutbox` coordinate with itself; it is to never let two calls run at
 * the same time in the first place.
 *
 * `createSerialQueue` does that with one held promise: every call chains onto
 * whatever the previous call was doing, and only starts once that one has
 * settled — succeeded or failed, either way. A caller that awaits its own
 * call still sees its own result or its own rejection; it is only the START
 * of the work that is serialised, not its outcome.
 */
export type SerialTask<T> = () => Promise<T>;

/** Enqueue a task onto the queue's chain and get back its own result. */
export type SerialQueue = <T>(task: SerialTask<T>) => Promise<T>;

export function createSerialQueue(): SerialQueue {
  // Always a *resolved* promise, regardless of whether the task it followed
  // succeeded — so one failing call cannot wedge every call queued after it,
  // and this chain is never the source of an unhandled rejection.
  let tail: Promise<void> = Promise.resolve();

  return function enqueue<T>(task: SerialTask<T>): Promise<T> {
    const started = tail.then(task, task);
    tail = started.then(
      () => undefined,
      () => undefined,
    );
    return started;
  };
}
