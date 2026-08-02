import { randomBytes, scryptSync } from "node:crypto";
import { beforeEach, expect, test, vi } from "vitest";

const N = 16384;
const R = 8;
const P = 1;

function hash(secret: string, salt = randomBytes(16)): string {
  const key = scryptSync(secret, salt, 32, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

const BASE = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefg.supabase.co/",
  SUPABASE_SERVICE_ROLE_KEY: "sb_secret_" + "x".repeat(60),
  APP_PASSWORD_HASH: hash("book-opener"),
  VAULT_PASSPHRASE_HASH: hash("vault-opener"),
  SESSION_SECRET: randomBytes(32).toString("base64"),
};

async function load(overrides: Record<string, string | undefined>) {
  vi.resetModules();
  for (const k of Object.keys(process.env)) {
    if (k.startsWith("NEXT_PUBLIC_")) delete process.env[k];
  }
  for (const [k, v] of Object.entries({ ...BASE, ...overrides })) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return import("./env");
}

beforeEach(() => {
  for (const k of Object.keys(BASE)) delete process.env[k];
});

test("valid env loads and normalises the url", async () => {
  const { env } = await load({});
  expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://abcdefg.supabase.co");
  expect(Object.isFrozen(env)).toBe(true);
});

test("missing var", async () => {
  await expect(load({ SESSION_SECRET: undefined })).rejects.toThrow(
    /SESSION_SECRET is missing/,
  );
});

test("shared salt is refused", async () => {
  const salt = randomBytes(16);
  await expect(
    load({
      APP_PASSWORD_HASH: hash("book-opener", salt),
      VAULT_PASSPHRASE_HASH: hash("vault-opener", salt),
    }),
  ).rejects.toThrow(/share a salt/);
});

test("identical hashes are refused", async () => {
  const same = hash("one-secret-for-both");
  await expect(
    load({ APP_PASSWORD_HASH: same, VAULT_PASSPHRASE_HASH: same }),
  ).rejects.toThrow(/same hash/);
});

test("copied line: same salt and same key reports both", async () => {
  const same = hash("one-secret-for-both");
  await expect(
    load({ APP_PASSWORD_HASH: same, VAULT_PASSPHRASE_HASH: same }),
  ).rejects.toThrow(/share a salt/);
});

test("NEXT_PUBLIC_ secret is refused", async () => {
  await expect(
    load({ NEXT_PUBLIC_SESSION_SECRET: "oops" }),
  ).rejects.toThrow(/NEXT_PUBLIC_SESSION_SECRET uses the NEXT_PUBLIC_ prefix/);
});

test("weak session secret", async () => {
  await expect(
    load({ SESSION_SECRET: randomBytes(8).toString("base64") }),
  ).rejects.toThrow(/HS256 needs at least 32/);
});

test("malformed hash", async () => {
  await expect(load({ APP_PASSWORD_HASH: "notahash" })).rejects.toThrow(
    /APP_PASSWORD_HASH is malformed/,
  );
});

test("low scrypt N", async () => {
  const salt = randomBytes(16);
  const key = scryptSync("x", salt, 32, { N: 1024, r: 8, p: 1 });
  await expect(
    load({
      APP_PASSWORD_HASH: `scrypt$1024$8$1$${salt.toString("base64")}$${key.toString("base64")}`,
    }),
  ).rejects.toThrow(/scrypt N below the 16384 minimum/);
});

test("short salt", async () => {
  const salt = randomBytes(8);
  const key = scryptSync("x", salt, 32, { N, r: R, p: P });
  await expect(
    load({
      APP_PASSWORD_HASH: `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`,
    }),
  ).rejects.toThrow(/8-byte salt/);
});

test("non-https supabase url", async () => {
  await expect(
    load({ NEXT_PUBLIC_SUPABASE_URL: "http://abc.supabase.co" }),
  ).rejects.toThrow(/must use https/);
});

test("blank counts as missing", async () => {
  await expect(load({ SUPABASE_SERVICE_ROLE_KEY: "   " })).rejects.toThrow(
    /SUPABASE_SERVICE_ROLE_KEY is missing/,
  );
});
