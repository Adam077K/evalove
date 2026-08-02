import type { OutboxItem, Uuid } from "@/lib/types";

/**
 * A batch mid-flight, against the canonical `OutboxItem`.
 * Persistent per-item state, never a toast. Nothing here is a
 * verdict: `needs_retry` is waiting to be tried again, and the
 * person decides when to give up, not the code.
 */

const mk = (
  n: number,
  state: OutboxItem["state"],
  attempts: number,
  lastError?: string,
): OutboxItem => ({
  clientUuid: `8e55d2a0-6f77-4b18-a3c9-${String(n).padStart(12, "0")}`,
  state,
  attempts,
  lastError,
  createdAt: `2026-08-02T01:${String(10 + n).padStart(2, "0")}:00Z`,
});

export const OUTBOX_UPLOADING: OutboxItem[] = [
  mk(1, "committed", 1),
  mk(2, "committed", 1),
  mk(3, "uploading", 1),
  mk(4, "needs_retry", 2, "The connection dropped partway through."),
  mk(5, "processing", 0),
  mk(6, "queued", 0),
];

export const OUTBOX_OFFLINE: OutboxItem[] = [
  mk(7, "queued", 0),
  mk(8, "queued", 0),
];

export const OUTBOX_TRY_AGAIN: OutboxItem[] = [
  mk(9, "committed", 1),
  mk(10, "needs_retry", 3, "The connection dropped partway through."),
  mk(11, "needs_retry", 1, "The server didn’t answer in time."),
  mk(12, "committed", 1),
];

/**
 * Local previews, keyed by clientUuid. In the wired app these are
 * object URLs from the IndexedDB blobs — the bytes are already on
 * the device, which is why the outbox can always show what it holds.
 * (Vault uploads never appear here; the pocket has its own quiet
 * queue behind the passphrase.)
 */
export const OUTBOX_PREVIEWS: Record<Uuid, string> = Object.fromEntries(
  [
    ["ea-dumpling", 1],
    ["ea-tram", 2],
    ["ea-jacket", 3],
    ["ea-gordon", 4],
    ["ea-shakshuka", 5],
    ["ea-ftrain", 6],
    ["ea-awning", 7],
    ["ea-staircat", 8],
    ["ea-coffeecat", 9],
    ["ea-tomatoes", 10],
    ["ea-officefan", 11],
    ["ea-cactus", 12],
  ].map(([seed, n]) => [
    `8e55d2a0-6f77-4b18-a3c9-${String(n).padStart(12, "0")}`,
    `https://picsum.photos/seed/${seed}/240/240`,
  ]),
);
