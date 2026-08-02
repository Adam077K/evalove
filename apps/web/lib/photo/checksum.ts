/**
 * SHA-256 over the bytes that are actually stored.
 *
 * Computed on the *derivative*, after the re-encode, never on the source file.
 * The server records it against the object it received, so hashing the source
 * would produce a digest that matches nothing anyone can verify later. It is
 * also what makes a retry safe: the same `client_uuid` carrying the same
 * digest is provably the same upload rather than a second one.
 */

import type { Sha256Hex } from "@/lib/types";

/** `crypto.subtle` is present on Safari 15.2+, on Node 20+, and in workers. */
function subtle(): SubtleCrypto {
  const c = globalThis.crypto;
  if (!c?.subtle) {
    throw new Error(
      "Web Crypto is unavailable, so no upload can be checksummed. " +
        "This build requires a secure context.",
    );
  }
  return c.subtle;
}

export async function sha256Hex(bytes: Uint8Array): Promise<Sha256Hex> {
  // `Uint8Array` is not accepted directly by every lib.dom version in play, and
  // slicing to a standalone ArrayBuffer also guarantees we hash exactly this
  // view rather than whatever else shares its backing buffer.
  const view = bytes.slice();
  const digest = await subtle().digest("SHA-256", view.buffer as ArrayBuffer);
  const out = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < out.length; i++) hex += out[i].toString(16).padStart(2, "0");
  return hex;
}
