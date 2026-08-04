import type { Photo, VaultItem } from "@/lib/types";
import { PHOTO_URL_REGISTRY } from "./photos";
import { VAULT_URL_REGISTRY } from "./vault";

/**
 * The one seam between fixture data and pixels.
 *
 * Canonical `Photo` / `VaultItem` carry storage PATHS, not URLs — the wired
 * app turns an id into the cookie-gated proxy path that actually serves the
 * bytes (`docs/03-system-design/LDR-APP-ARCHITECTURE.md` §5.4). A registry
 * lookup still wins when present, which is what keeps the review/dev fixture
 * screens (`app/(app)/review/**`, `app/dev/**`) rendering their own curated
 * images instead of a 404 against a photo id that was never committed.
 *
 * There was a stock-photo fallback here (`picsum.photos`) for every id the
 * registry didn't recognise. It is gone on purpose: a network image that is
 * never the actual photograph is exactly the "vibe-coding AI slop" this
 * project exists to stop shipping — it read as real and wasn't. An id with no
 * registry entry and no backing row now resolves to the real, honest path and
 * 404s like any other broken reference, instead of quietly lying.
 */
export function photoSrc(p: Photo): string {
  return PHOTO_URL_REGISTRY.get(p.storagePathDisplay) ?? `/p/${p.id}/display.jpg`;
}

export function thumbSrc(p: Photo): string {
  return PHOTO_URL_REGISTRY.get(p.storagePathThumb) ?? `/p/${p.id}/thumb.jpg`;
}

/**
 * Vault items are opened one at a time, at full display size, behind
 * the passphrase — never pre-rendered, never thumbnailed (the type
 * itself has no thumb path, on purpose). Only the open-one view may
 * call this.
 *
 * NOT YET SERVED: `/v/{id}.jpg` is the documented target (§5.5) but its route
 * is not built — vault serving needs its own re-authentication (§5.6,
 * `vault_claim`) and is out of scope for wiring the ordinary photo path. This
 * still points at the real, structurally-separate path rather than a stock
 * photo, which is the honest state to leave it in until that route exists.
 */
export function vaultSrc(v: VaultItem): string {
  return VAULT_URL_REGISTRY.get(v.storagePathDisplay) ?? `/v/${v.id}.jpg`;
}
