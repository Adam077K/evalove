import type { Photo, VaultItem } from "@/lib/types";
import { PHOTO_URL_REGISTRY } from "./photos";
import { VAULT_URL_REGISTRY } from "./vault";

/**
 * The one seam between fixture data and pixels.
 *
 * Canonical `Photo` / `VaultItem` carry storage PATHS, not URLs —
 * the wired app turns a path into a signed URL. In the fixture
 * build this function does that job from an in-memory registry.
 * Wiring replaces THIS FILE ONLY; no component changes.
 */
export function photoSrc(p: Photo): string {
  return (
    PHOTO_URL_REGISTRY.get(p.storagePathDisplay) ??
    `https://picsum.photos/seed/${p.id.slice(-6)}/1200/1600`
  );
}

export function thumbSrc(p: Photo): string {
  return PHOTO_URL_REGISTRY.get(p.storagePathThumb) ?? photoSrc(p);
}

/**
 * Vault items are opened one at a time, at full display size, behind
 * the passphrase — never pre-rendered, never thumbnailed (the type
 * itself has no thumb path, on purpose). Only the open-one view may
 * call this.
 */
export function vaultSrc(v: VaultItem): string {
  return (
    VAULT_URL_REGISTRY.get(v.storagePathDisplay) ??
    `https://picsum.photos/seed/${v.id.slice(-6)}/1200/1600`
  );
}
