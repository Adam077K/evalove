/**
 * POST /api/photos — commit a photograph whose derivatives already landed in
 * Supabase Storage.
 *
 * This is the third and last of the three calls in the batch-upload contract
 * (`docs/03-system-design/LDR-APP-ARCHITECTURE.md` §5.9, and the header of
 * `lib/outbox/transport.ts`):
 *
 *   POST /api/photos/upload-url  { kind, count<=5 } → { items:[{ photoId, urls }] }
 *   PUT  <signed url>            bytes, direct to Supabase Storage
 *   POST /api/photos             { clientUuid, photoId, … }  → { photo }  (idempotent)
 *
 * Idempotent on `clientUuid`: a replayed flush from the offline outbox is a
 * normal event, not an incident, and returns the same photo both times. See
 * the ordering guarantees documented on `commitPhoto` itself.
 *
 * ONE TRANSLATION HAPPENS HERE AND NOWHERE ELSE. The outbox's wire contract
 * (`lib/outbox/transport.ts`) names the author by their row id — the same id
 * `EnqueueContext.authorMemberId` carries from the moment a photo is picked —
 * because that is the identifier the rest of the client already has in hand.
 * `commitPhoto`, on the other hand, resolves a member **slug**
 * (`memberBySlug`), because that is what a person can plausibly declare about
 * themselves. Both are correct in their own layer; this route is the one seam
 * where a Uuid becomes a slug, by looking it up against the roster rather than
 * trusting a client-supplied string to already be one.
 */

import { z } from "zod";

import { commitPhoto, photoDeps } from "@/lib/data";
import { DataError } from "@/lib/data/errors";
import { invalidInput, jsonFail, jsonOk, unauthenticated } from "@/lib/data/http";
import { getIdentity, requireSession, UnauthenticatedError } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  clientUuid: z.string().uuid("clientUuid must be a uuid"),
  photoId: z.string().uuid("photoId must be a uuid"),
  kind: z.enum(["daily", "book"]),
  /** The author's member row id, not their slug. See the file header. */
  author: z.string().uuid("author must be a uuid"),
  clientTz: z.string().min(1, "clientTz is required"),
  takenAt: z.string().min(1).optional(),
  caption: z.string().max(2000).optional(),
  width: z.int().positive(),
  height: z.int().positive(),
  bytes: z.int().positive(),
  colorSpace: z.enum(["srgb", "display-p3"]),
  checksumSha256: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, "checksumSha256 must be 64 hex characters"),
  /**
   * The outbox computes these client-side for its own offline bookkeeping
   * before it ever reaches the network. `commitPhoto` ignores them and
   * re-derives `shared_day` itself from `clientTz` and the author's zone of
   * record — deliberately: a stale or spoofed client value must never decide
   * which day a photo is filed under. Accepted here only so a well-formed
   * request from the real client is not rejected for a field it legitimately
   * sends.
   */
  sharedDay: z.string().optional(),
  sharedDayTz: z.string().optional(),
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
        "body is not a valid photo commit",
        parsed.error.issues,
      );
    }

    const deps = photoDeps();

    // `getIdentity()` is who the *session* claims to be holding the phone;
    // `author` below is who the *photo* is declared to be from. They usually
    // agree. `commitPhoto` records whether they did, in `attribution_source`
    // — it does not refuse the write when they don't, because either of them
    // may legitimately post on the other's behalf.
    const identity = await getIdentity();

    const roster = await deps.gateway.listMembers();
    const author = roster.find((member) => member.id === parsed.data.author);
    if (!author) {
      throw new DataError(
        "invalid",
        "author does not name a member on the roster",
        { author: parsed.data.author },
      );
    }

    const { sharedDay: _sharedDay, sharedDayTz: _sharedDayTz, ...rest } =
      parsed.data;

    const result = await commitPhoto(
      deps,
      { ...rest, author: author.slug },
      {
        memberId: identity?.memberId,
        authenticated: identity?.source === "authenticated",
      },
    );

    return jsonOk(
      { photo: result.photo, created: result.created },
      result.created ? 201 : 200,
    );
  } catch (thrown) {
    return jsonFail("POST /api/photos", thrown);
  }
}
