/**
 * verify.ts — reuses the app's own EXIF/GPS scan, does not reimplement it.
 *
 * `findMetadataEvidence` in `apps/web/lib/photo/guard.ts` is the exact
 * function `commitPhoto`'s `verifyDerivativesAreClean` runs server-side
 * against uploaded bytes (`apps/web/lib/data/photos.ts`), and the exact
 * function the client's `assertNoMetadata` runs before a PUT ever leaves the
 * device. It is a pure byte-segment scan — no DOM, no canvas — which is what
 * makes it safe to import here.
 *
 * `readExifSummary` (`apps/web/lib/photo/exif.ts`) reads the ORIGINAL file
 * before conversion, only to prove GPS was actually present to strip — the
 * "prove it was there, prove it left" pairing that file's own header argues
 * for. It is never called on a derivative and its output is never forwarded
 * anywhere; it exists here purely to make the verification report honest
 * ("we stripped a coordinate", not "we didn't look for one").
 */

import { readFileSync } from "node:fs";
import { findMetadataEvidence } from "@/lib/photo/guard.ts";
import { readExifSummary, type ExifSummary } from "@/lib/photo/exif.ts";
import type { MetadataEvidence } from "@/lib/photo/guard.ts";

export interface DerivativeVerification {
  path: string;
  clean: boolean;
  evidence: MetadataEvidence[];
}

/** Re-read a derivative off disk and prove it carries no EXIF/GPS. */
export function verifyDerivativeClean(path: string): DerivativeVerification {
  const bytes = new Uint8Array(readFileSync(path));
  const evidence = findMetadataEvidence(bytes);
  return { path, clean: evidence.length === 0, evidence };
}

export interface SourceMetadataFacts {
  present: boolean;
  hasGps: boolean;
  takenAtLocal?: string;
}

/** What the ORIGINAL source file carried, read before it is ever converted. */
export function readSourceMetadata(path: string): SourceMetadataFacts {
  const bytes = new Uint8Array(readFileSync(path));
  const summary: ExifSummary = readExifSummary(bytes);
  const facts: SourceMetadataFacts = {
    present: summary.present,
    hasGps: summary.hasGps,
  };
  if (summary.takenAtLocal !== undefined) {
    facts.takenAtLocal = summary.takenAtLocal;
  }
  return facts;
}
