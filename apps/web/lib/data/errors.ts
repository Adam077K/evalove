/**
 * The failures the data layer is allowed to have, named.
 *
 * A route handler needs to turn a failure into a status code, and it can only
 * do that honestly if the failure says what kind it is. A bare `Error` forces
 * the handler to either return 500 for everything — which turns "you asked for
 * a photo that does not exist" into "the server is broken" — or to match on
 * message strings, which is a runtime dependency on English prose.
 *
 * So: one class, one discriminating `kind`, and a single mapping to HTTP that
 * lives beside the definition rather than being re-invented per route.
 */

/** What went wrong, in the vocabulary the HTTP layer needs. */
export type DataErrorKind =
  /** The row does not exist, or is soft-deleted, or has been purged. */
  | "not_found"
  /** The caller's input was refused by a rule this layer owns. */
  | "invalid"
  /** The operation is legal but the row is in the wrong state for it. */
  | "conflict"
  /** The caller has done this too many times. */
  | "rate_limited"
  /** The caller is authenticated but not permitted to act on this resource. */
  | "forbidden"
  /** The database, or storage, did not co-operate. */
  | "upstream";

export class DataError extends Error {
  override readonly name = "DataError";

  constructor(
    readonly kind: DataErrorKind,
    message: string,
    /** Structured detail for the log line. Never contains photo bytes. */
    readonly detail: Readonly<Record<string, unknown>> = {},
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }
}

/** The status code a failure deserves. */
export function statusOf(kind: DataErrorKind): number {
  switch (kind) {
    case "not_found":
      return 404;
    case "invalid":
      return 400;
    case "conflict":
      return 409;
    case "rate_limited":
      return 429;
    case "forbidden":
      return 403;
    case "upstream":
      return 502;
  }
}

export function isDataError(value: unknown): value is DataError {
  return value instanceof DataError;
}
