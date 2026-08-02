/**
 * Is this a connection we should send 2.5 MB over?
 *
 * Only the deferred originals ask. The display and thumb derivatives go out on
 * whatever connection exists, because those are the photographs — holding them
 * back until wifi would mean she posts something and he does not see it until
 * she gets home, which is the product not working.
 *
 * Originals are different. They are ~2.5 MB each, they are not rendered
 * anywhere, and a 300-item backlog is about 750 MB. Sending that over cellular
 * would be spending her data allowance on bytes she cannot see.
 *
 * `navigator.connection` is unevenly implemented and absent on iOS Safari
 * entirely, which is the one browser this product actually runs in. So the
 * default when we cannot tell has to be chosen rather than inherited, and it
 * is **hold back**: a delayed original costs a day, and an original that ate
 * her roaming data costs money and trust. The person can override it, which is
 * the honest way to handle a heuristic that is usually blind.
 */

export type ConnectionVerdict =
  | "unmetered"
  | "metered"
  | "save-data"
  | "offline"
  | "unknown";

interface NetworkInformationLike {
  type?: string;
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
}

function connection(): NetworkInformationLike | undefined {
  const nav = globalThis.navigator as
    | (Navigator & {
        connection?: NetworkInformationLike;
        mozConnection?: NetworkInformationLike;
        webkitConnection?: NetworkInformationLike;
      })
    | undefined;
  return nav?.connection ?? nav?.mozConnection ?? nav?.webkitConnection;
}

/** What we can tell about the connection right now. */
export function readConnection(): ConnectionVerdict {
  const nav = globalThis.navigator;
  if (nav && nav.onLine === false) return "offline";

  const info = connection();
  if (!info) return "unknown";

  // Explicitly asked to use less data. That is a person's stated preference
  // and it outranks every inference below it.
  if (info.saveData === true) return "save-data";

  if (info.type === "wifi" || info.type === "ethernet") return "unmetered";
  if (info.type === "cellular") return "metered";

  // No connection type, so fall back to the speed class. `4g` covers both a
  // fibre connection and a good LTE signal, so it is not evidence of wifi —
  // only the slow classes are evidence of the opposite.
  if (info.effectiveType === "slow-2g" || info.effectiveType === "2g") {
    return "metered";
  }
  if (info.effectiveType === "3g") return "metered";

  return "unknown";
}

/**
 * May the deferred originals go now?
 *
 * `unknown` answers no. See the header: the default is deliberate.
 */
export function mayUploadOriginals(
  verdict: ConnectionVerdict = readConnection(),
): boolean {
  return verdict === "unmetered";
}

/** Plain language for the batch surface. No jargon, no apology. */
export function describeConnection(verdict: ConnectionVerdict): string {
  switch (verdict) {
    case "unmetered":
      return "On wi-fi. Full-size originals are uploading.";
    case "metered":
      return "On mobile data. Full-size originals are waiting for wi-fi.";
    case "save-data":
      return "Data saver is on. Full-size originals are waiting for wi-fi.";
    case "offline":
      return "No connection. Everything here is saved on this phone and will go out when you're back.";
    case "unknown":
      return "Full-size originals are waiting for wi-fi.";
  }
}

/**
 * The sentence that has to appear wherever a queued item is shown.
 *
 * iOS has no Background Sync. A queued upload does not go out while the app is
 * closed, and it never will — Safari does not run a closed PWA. Saying "we'll
 * finish this in the background" would be a lie she only discovers by
 * wondering, days later, why he never saw the photographs.
 */
export const NO_BACKGROUND_SYNC_NOTICE =
  "These are saved on your phone. They'll finish uploading the next time you open the app — iPhones don't let apps upload in the background.";
