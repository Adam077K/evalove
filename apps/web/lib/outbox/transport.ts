/**
 * The three network calls, behind one interface.
 *
 * Kept separate from the drain loop so the retry, ordering and durability
 * behaviour can be tested against a transport that misbehaves on cue — which
 * is the only honest way to know a thirty-item batch survives a tunnel.
 *
 * Coded against the route contract in
 * `docs/03-system-design/LDR-APP-ARCHITECTURE.md`:
 *
 *   POST /api/photos/upload-url  { kind, count<=5 } → { items:[{ photoId, urls }] }
 *   PUT  <signed url>            bytes, direct to Supabase Storage
 *   POST /api/photos             { clientUuid, photoId, … }  → { photo }  (idempotent)
 */

import type { IanaTimeZone, IsoDate, IsoDateTime, PhotoKind, Uuid } from "@/lib/types";
import type { ColorSpace, Sha256Hex } from "@/lib/types";

/** URLs are requested just-in-time in chunks of this size. */
export const TICKET_CHUNK_SIZE = 5;

export interface UploadTicket {
  photoId: Uuid;
  urls: {
    display: string;
    thumb: string;
    /** Present only when the deferred original is being asked for. */
    original?: string;
  };
}

export interface CommitPhotoInput {
  clientUuid: Uuid;
  photoId: Uuid;
  kind: PhotoKind;
  author: Uuid;
  clientTz: IanaTimeZone;
  sharedDay: IsoDate;
  sharedDayTz: IanaTimeZone;
  takenAt?: IsoDateTime;
  caption?: string;
  width: number;
  height: number;
  bytes: number;
  colorSpace: ColorSpace;
  checksumSha256: Sha256Hex;
}

export interface UploadTransport {
  requestUploadUrls(input: {
    kind: PhotoKind;
    count: number;
  }): Promise<UploadTicket[]>;
  putObject(url: string, body: Blob, contentType: string): Promise<void>;
  commitPhoto(input: CommitPhotoInput): Promise<void>;
}

/**
 * Raised for anything the server said no to.
 *
 * `retryable` is the only judgement this layer makes. A dropped connection or
 * a 5xx will succeed later; a 400 will not, and retrying it five times just
 * spends her battery arriving at the same place. Neither one removes the item
 * from the queue.
 */
export class TransportError extends Error {
  readonly status?: number;
  readonly retryable: boolean;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "TransportError";
    this.status = status;
    this.retryable =
      status === undefined || status === 408 || status === 429 || status >= 500;
  }
}

type FetchLike = typeof globalThis.fetch;

async function readProblem(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 200) || response.statusText;
  } catch {
    return response.statusText;
  }
}

export function createHttpTransport(
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis),
): UploadTransport {
  return {
    async requestUploadUrls({ kind, count }) {
      if (count < 1 || count > TICKET_CHUNK_SIZE) {
        throw new TransportError(
          `Signed URLs are requested ${TICKET_CHUNK_SIZE} at a time; asked for ${count}.`,
        );
      }
      let response: Response;
      try {
        response = await fetchImpl("/api/photos/upload-url", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind, count }),
        });
      } catch (error) {
        throw new TransportError(
          error instanceof Error ? error.message : "The request did not go out.",
        );
      }
      if (!response.ok) {
        throw new TransportError(await readProblem(response), response.status);
      }
      const payload = (await response.json()) as { items?: UploadTicket[] };
      const items = payload.items ?? [];
      if (items.length !== count) {
        throw new TransportError(
          `Asked for ${count} upload slots and received ${items.length}.`,
        );
      }
      return items;
    },

    async putObject(url, body, contentType) {
      let response: Response;
      try {
        response = await fetchImpl(url, {
          method: "PUT",
          headers: { "content-type": contentType },
          body,
        });
      } catch (error) {
        throw new TransportError(
          error instanceof Error
            ? error.message
            : "The connection dropped partway through.",
        );
      }
      if (!response.ok) {
        throw new TransportError(await readProblem(response), response.status);
      }
    },

    async commitPhoto(input) {
      let response: Response;
      try {
        response = await fetchImpl("/api/photos", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });
      } catch (error) {
        throw new TransportError(
          error instanceof Error ? error.message : "The commit did not go out.",
        );
      }
      if (!response.ok) {
        throw new TransportError(await readProblem(response), response.status);
      }
    },
  };
}
