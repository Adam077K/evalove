/**
 * POST /api/photos/upload-url — mint up to five write-only upload slots.
 *
 * This endpoint is why a thirty-photo import works. It hands back a small
 * chunk of short-lived, single-path upload authorisations; the client uploads
 * those, then asks for the next chunk. Issuing all thirty upfront would mint
 * URLs that sit in a queue until they expire, and the failure would land on
 * the twenty-ninth photo of an import somebody waited five minutes for.
 *
 * The bytes go from the browser straight to Supabase Storage and never pass
 * through this function. That is what dodges the 4.5 MB request body limit on
 * a serverless function — a photo is bigger than that, and a proxy upload
 * would fail on the file sizes this product exists to store.
 */

import { z } from "zod";

import { issueUploadSlots, photoDeps } from "@/lib/data";
import { invalidInput, jsonFail, jsonOk, unauthenticated } from "@/lib/data/http";
import { MAX_UPLOAD_URLS_PER_REQUEST } from "@/lib/data/photos";
import { requireSession, UnauthenticatedError } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  kind: z.enum(["daily", "book"]),
  /**
   * The chunk cap is validated here as well as inside the data layer. The
   * duplication is deliberate: this one produces a helpful 400 for a client
   * that asked for thirty, and the one in `issueUploadSlots` holds for every
   * caller including a future server-side one.
   */
  count: z.int().min(1).max(MAX_UPLOAD_URLS_PER_REQUEST),
});

export async function POST(request: Request): Promise<Response> {
  try {
    await requireSession();
  } catch (thrown) {
    if (thrown instanceof UnauthenticatedError) return unauthenticated();
    throw thrown;
  }

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return invalidInput(
        "body is not a valid upload-url request",
        parsed.error.issues,
      );
    }

    const items = await issueUploadSlots(photoDeps(), parsed.data);
    return jsonOk({ items });
  } catch (thrown) {
    return jsonFail("POST /api/photos/upload-url", thrown);
  }
}
