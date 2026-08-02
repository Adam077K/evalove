import { vaultDisplayPath } from "@/lib/schema";

import type { VaultItem } from "@/lib/types";
import { ADAM, EVA } from "./members";

/**
 * Pocket fixtures. Canonical `VaultItem` has NO thumbnail path, on
 * purpose — thumbnails leak. The pocket grid therefore draws prints
 * FACE DOWN (paper backs, a caption in soft ink) and turns one over
 * at a time at full size. These fixture items are deliberately
 * mundane; content is theirs, not ours.
 */

const mk = (
  n: number,
  authorId: string,
  sharedDay: string,
  createdAt: string,
  caption?: string,
): VaultItem => ({
  id: `4a9e77c2-5d10-4f6b-8c21-${String(n).padStart(12, "0")}`,
  clientUuid: `4a9e77c2-5d10-4f6b-8c21-${String(n).padStart(12, "0")}`,
  authorMemberId: authorId,
  sharedDay,
  sharedDayTz: authorId === EVA.id ? EVA.homeTimezone : ADAM.homeTimezone,
  caption,
  // `v/{id}/display.jpg`, built from the shared constant. These fixtures used
  // to say `vault/display/v1.jpg`, a path no migration would accept and one
  // the vault firewall's own prefix check was written against — the two wrong
  // halves agreed with each other and with nothing else.
  storagePathDisplay: vaultDisplayPath(
    `4a9e77c2-5d10-4f6b-8c21-${String(n).padStart(12, "0")}`,
  ),
  width: 1200,
  height: 1600,
  bytes: 214_000 + n * 13_337,
  mime: "image/jpeg",
  checksumSha256: `${"c0ffee".repeat(11)}c0ffeec0ff`.slice(0, 64),
  exifStripped: true,
  createdAt,
});

export const VAULT_ITEMS: VaultItem[] = [
  mk(1, EVA.id, "2026-07-28", "2026-07-29T02:44:00Z", "For the winter"),
  mk(2, ADAM.id, "2026-07-30", "2026-07-30T20:12:00Z"),
  mk(3, EVA.id, "2026-08-01", "2026-08-02T03:01:00Z", "Don’t lose this one"),
];

/** Fixture-only URL seam, mirrored from photos.ts. */
export const VAULT_URL_REGISTRY = new Map<string, string>(
  VAULT_ITEMS.map((v, i) => [
    v.storagePathDisplay,
    `https://picsum.photos/seed/ea-vault-${i + 1}/1200/1600`,
  ]),
);
