import { createHmac, scryptSync, randomUUID } from "node:crypto";

/**
 * A booted server and a valid session for the e2e suite.
 *
 * Every app route is behind `middleware.ts`, so a layout test that does not
 * authenticate measures the login page. The suite does not weaken the door to
 * get in: it boots the server with an environment of its own and mints a token
 * against that same secret, which is exactly the path a real session takes.
 *
 * The values below are FIXTURES, not secrets. They are constants so that a
 * re-run can reuse a server already listening on the port — a per-run secret
 * would silently invalidate a reused server's sessions and produce a failure
 * that looks like a layout bug. Nothing here is ever used outside `next dev`
 * on a loopback port.
 *
 * `lib/env.ts` validates at module evaluation and refuses to boot on a bad
 * config, including refusing two password hashes that look derived from one
 * another — hence two distinct passwords below. See `lib/__tests__/setup-env.ts`,
 * which does the same job for vitest.
 */

/** 32 bytes of zero-cost fixture entropy, base64 — the shape `lib/env.ts` wants. */
const SESSION_SECRET = Buffer.alloc(32, "eva-adam-e2e-fixture").toString("base64");

/** The cost floor `lib/env.ts` enforces, with a fixed salt so the hash is stable. */
function scryptHash(password: string, salt: string): string {
  const saltBytes = Buffer.alloc(16, salt);
  const key = scryptSync(password, saltBytes, 32, { N: 16_384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${saltBytes.toString("base64")}$${key.toString("base64")}`;
}

export const TEST_ENV: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example-project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: Buffer.alloc(48, "e2e-service-role").toString("hex"),
  APP_PASSWORD_HASH: scryptHash("an-e2e-app-password", "e2e-app-salt"),
  VAULT_PASSPHRASE_HASH: scryptHash("an-independent-e2e-vault-phrase", "e2e-vault-salt"),
  SESSION_SECRET,
};

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/**
 * Mint the same HS256 token `lib/session/token.ts` mints.
 *
 * Signed here with `node:crypto` rather than by importing the app's
 * `signSession`, because that module imports `lib/env` and validating a
 * production-shaped environment inside a Playwright config is a boot failure
 * in the wrong process. The claim set and the algorithm are what must match,
 * and both are asserted by the server verifying the cookie: if this drifts,
 * every test redirects to `/login` and says so loudly.
 */
export function mintSessionCookie(): { name: string; value: string; domain: string; path: string } {
  const iat = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      sid: randomUUID(),
      v: 1, // SESSION_VERSION
      iat,
      exp: iat + 15_552_000,
    }),
  );
  const signature = b64url(
    createHmac("sha256", Buffer.from(SESSION_SECRET, "base64")).update(`${header}.${payload}`).digest(),
  );

  return {
    name: "ea_session", // SESSION_COOKIE
    value: `${header}.${payload}.${signature}`,
    domain: "127.0.0.1",
    path: "/",
  };
}
