import { randomBytes, scryptSync } from "node:crypto";
import { test } from "vitest";

const N = 16384;
const R = 8;
const P = 1;
const salt = randomBytes(16);
const h = (s: string, sa = randomBytes(16)) =>
  `scrypt$${N}$${R}$${P}$${sa.toString("base64")}$${scryptSync(s, sa, 32, { N, r: R, p: P }).toString("base64")}`;

test("msg", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
  process.env.NEXT_PUBLIC_SESSION_SECRET = "leaked";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "";
  process.env.APP_PASSWORD_HASH_EVA = h("a", salt);
  process.env.APP_PASSWORD_HASH_ADAM = h("b");
  process.env.VAULT_PASSPHRASE_HASH = h("c", salt);
  process.env.SESSION_SECRET = randomBytes(32).toString("base64");
  try {
    await import("./env");
  } catch (e) {
    console.log("\n" + (e as Error).message + "\n");
  }
});
