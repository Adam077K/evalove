import type { OutboxItem } from "@/lib/types";

const thumb = (seed: string) => `https://picsum.photos/seed/${seed}/240/240`;

/**
 * A batch mid-flight. Persistent per-item state, never a toast.
 * Nothing here is a verdict; a stuck item is waiting or asking
 * to be tried again, and the batch is never "complete" until
 * every item committed.
 */
export const OUTBOX_UPLOADING: OutboxItem[] = [
  { clientUuid: "u1", kind: "book", status: "sent", thumbnailUrl: thumb("ea-dumpling") },
  { clientUuid: "u2", kind: "book", status: "sent", thumbnailUrl: thumb("ea-tram") },
  { clientUuid: "u3", kind: "book", status: "sending", thumbnailUrl: thumb("ea-jacket") },
  { clientUuid: "u4", kind: "book", status: "retrying", attempt: 2, thumbnailUrl: thumb("ea-gordon") },
  { clientUuid: "u5", kind: "book", status: "queued", thumbnailUrl: thumb("ea-shakshuka") },
  { clientUuid: "u6", kind: "book", status: "queued", thumbnailUrl: thumb("ea-ftrain") },
];

export const OUTBOX_OFFLINE: OutboxItem[] = [
  { clientUuid: "o1", kind: "daily", status: "waiting-for-network", thumbnailUrl: thumb("ea-awning") },
];

export const OUTBOX_TRY_AGAIN: OutboxItem[] = [
  { clientUuid: "t1", kind: "book", status: "sent", thumbnailUrl: thumb("ea-coffeecat") },
  { clientUuid: "t2", kind: "book", status: "try-again", thumbnailUrl: thumb("ea-tomatoes") },
  { clientUuid: "t3", kind: "book", status: "try-again", thumbnailUrl: thumb("ea-staircat") },
  { clientUuid: "t4", kind: "book", status: "sent", thumbnailUrl: thumb("ea-officefan") },
];
