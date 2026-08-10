/**
 * PATCH /api/photos/[id]/original — confirm the untouched original has landed.
 *
 * Called by the outbox after `uploadDeferredOriginals` successfully PUTs the
 * original bytes to storage. Flips `original_location` from `'none'` to
 * `'supabase'` on the photo row.
 *
 * This is the only operation this route performs. The original is not readable,
 * movable, or deletable from here — purge is the only operation that removes
 * bytes, it is audited, and it goes through `purgePhoto`.
 *
 * Idempotent: a retried confirm after a dropped response returns the same 200
 * with the current row. The outbox may safely re-call this on reconnect.
 */

import { z } from "zod";

import { confirmOriginalLanded, photoDeps } from "@/lib/data";
import { invalidInput, jsonFail, jsonOk, unauthenticated } from "@/lib/data/http";
import { requireSession, UnauthenticatedError } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  id: z.string().uuid("photo id must be a uuid"),
});

const bodySchema = z.object({
  /**
   * Byte count of the original as reported by the device after upload.
   *
   * Accepted here to match `OriginalTransport.confirmOriginal`'s signature and
   * to make a future `original_bytes` column addition backwards-compatible with
   * existing callers. Not persisted to the database yet — no column exists.
   */
  bytes: z.number().int().positive("bytes must be a positive integer"),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    await requireSession();
  } catch (thrown) {
    if (thrown instanceof UnauthenticatedError) return unauthenticated();
    throw thrown;
  }

  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return invalidInput("invalid photo id", parsedParams.error.issues);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidInput("request body must be valid JSON", []);
  }

  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    return invalidInput("invalid request body", parsedBody.error.issues);
  }

  const { id } = parsedParams.data;

  try {
    const photo = await confirmOriginalLanded(photoDeps(), {
      photoId: id,
      bytes: parsedBody.data.bytes,
    });
    return jsonOk({ photo });
  } catch (thrown) {
    return jsonFail("PATCH /api/photos/[id]/original", thrown);
  }
}
