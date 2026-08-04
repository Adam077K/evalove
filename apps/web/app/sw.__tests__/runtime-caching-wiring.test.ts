/**
 * runtimeCaching wiring — mutation-tested assertions.
 *
 * These tests assert that the ROUTE_DESCRIPTORS in sw-runtime-caching.ts are
 * wired correctly: the right matchers select the right strategy tags, the right
 * plugins are listed, and handleSignOut actually purges caches.
 *
 * sw.ts builds its Serwist runtimeCaching array by mapping ROUTE_DESCRIPTORS.
 * Mutations to the descriptors therefore break the wiring in production AND make
 * these tests go red — the test file is not testing a copy; it is testing the
 * exact config that sw.ts consumes.
 *
 * MUTATION EVIDENCE (applied in scratchpad copies, never committed):
 *
 *   Mutation B: DELETE the vault NetworkOnly rule (remove the descriptor with
 *               id="vault" from ROUTE_DESCRIPTORS) → tests in the "Mutation B"
 *               suite go RED.
 *
 *   Mutation C: REMOVE "noStorePlugin" from the photo-display descriptor's
 *               pluginNames → tests in the "Mutation C" suite go RED.
 *
 *   Mutation D: GUT handleSignOut (empty the function body) → tests in the
 *               "Mutation D" suite go RED.
 *
 *   Mutation E: REPLACE the api descriptor's strategyTag with "CacheFirst" →
 *               tests in the "Mutation E" suite go RED.
 *
 * Control A (from the original code-reviewer session) is preserved in the
 * existing route-classification.test.ts — it proves the isVaultPath() classifier
 * tests are genuine regression coverage.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  handleSignOut,
  ROUTE_DESCRIPTORS,
} from "../sw-runtime-caching";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUrl(path: string): URL {
  return new URL(`https://evaandadam.app${path}`);
}

/** Finds the first descriptor whose matcher returns true for the given params. */
function findRule(params: { url: URL; request: { method: string; mode?: string } }) {
  return ROUTE_DESCRIPTORS.find((d) => d.matcher(params));
}

// ---------------------------------------------------------------------------
// Mutation B — vault NetworkOnly rule
//
// Removing the vault descriptor leaves /v/ URLs unmatched. The rule MUST exist
// and MUST carry strategyTag "NetworkOnly".
// ---------------------------------------------------------------------------

describe("Mutation B: vault NetworkOnly rule", () => {
  const vaultUrl = makeUrl("/v/550e8400-e29b-41d4-a716-446655440000/display.jpg");
  const vaultRequest = { method: "GET" };

  it("a /v/ URL matches exactly one descriptor", () => {
    const rule = findRule({ url: vaultUrl, request: vaultRequest });
    expect(rule).toBeDefined();
    expect(rule?.id).toBe("vault");
  });

  it("the vault descriptor uses the NetworkOnly strategy", () => {
    const rule = ROUTE_DESCRIPTORS.find((d) => d.id === "vault");
    expect(rule).toBeDefined();
    expect(rule?.strategyTag).toBe("NetworkOnly");
  });

  it("an upper-case /V/ URL is also matched by the vault rule", () => {
    const upperVaultUrl = makeUrl("/V/550E8400-E29B-41D4-A716-446655440000/display.jpg");
    const rule = findRule({ url: upperVaultUrl, request: vaultRequest });
    expect(rule?.id).toBe("vault");
  });
});

// ---------------------------------------------------------------------------
// Mutation C — noStorePlugin in the display CacheFirst strategy
//
// Removing noStorePlugin from the photo-display descriptor's pluginNames means
// no-store responses can slip into the cache. The test asserts the plugin is
// listed, and that sw.ts will therefore include it when constructing CacheFirst.
// ---------------------------------------------------------------------------

describe("Mutation C: noStorePlugin in photo-display CacheFirst", () => {
  const displayUrl = makeUrl("/p/550e8400-e29b-41d4-a716-446655440000/display.jpg");
  const displayRequest = { method: "GET" };

  it("a /p/.../display.jpg URL matches the photo-display descriptor", () => {
    const rule = findRule({ url: displayUrl, request: displayRequest });
    expect(rule?.id).toBe("photo-display");
  });

  it("the photo-display descriptor lists noStorePlugin", () => {
    const rule = ROUTE_DESCRIPTORS.find((d) => d.id === "photo-display");
    expect(rule).toBeDefined();
    expect(rule?.pluginNames).toContain("noStorePlugin");
  });

  it("the photo-thumb descriptor also lists noStorePlugin", () => {
    // Regression guard: if noStorePlugin is removed from display, the same
    // author might remove it from thumb. Both matter.
    const rule = ROUTE_DESCRIPTORS.find((d) => d.id === "photo-thumb");
    expect(rule).toBeDefined();
    expect(rule?.pluginNames).toContain("noStorePlugin");
  });
});

// ---------------------------------------------------------------------------
// Mutation D — handleSignOut purges caches
//
// Gutting handleSignOut's body leaves caches intact after sign-out — the exact
// borrowed-device failure mode. Tests verify:
//   (a) Cache Storage is purged on a successful 204 sign-out.
//   (b) Cache Storage is purged even when the network call throws (offline).
//   (c) OPFS outbox is removed (photograph bytes).
//   (d) IndexedDB eva-adam-outbox is deleted (captions, author).
// ---------------------------------------------------------------------------

describe("Mutation D: handleSignOut purges all personal-content stores", () => {
  // Fake caches, navigator.storage, indexedDB, and fetch are set up in each test.
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function makeCachesMock() {
    const deletedCaches: string[] = [];
    return {
      stub: {
        keys: vi.fn<[], Promise<string[]>>().mockResolvedValue([
          "photo-display-v1",
          "photo-thumb-v1",
          "nav-v1",
        ]),
        delete: vi.fn<[string], Promise<boolean>>().mockImplementation((name) => {
          deletedCaches.push(name);
          return Promise.resolve(true);
        }),
      },
      deletedCaches,
    };
  }

  function makeIdbMock(): { stub: IDBFactory["deleteDatabase"] extends (...args: infer A) => infer R ? { deleteDatabase: (...args: A) => R } : never; deleted: string[] } {
    const deleted: string[] = [];
    return {
      stub: {
        deleteDatabase: vi.fn().mockImplementation((name: string) => {
          deleted.push(name);
          // Simulate an IDBOpenDBRequest that calls onsuccess synchronously.
          const req = {
            onsuccess: null as ((this: IDBRequest) => void) | null,
            onerror: null as ((this: IDBRequest, ev: Event) => void) | null,
            onblocked: null as ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => void) | null,
            error: null as DOMException | null,
            result: undefined as unknown,
            readyState: "done" as IDBRequestReadyState,
          };
          Promise.resolve().then(() => {
            if (req.onsuccess) req.onsuccess.call(req as unknown as IDBRequest);
          });
          return req;
        }),
      },
      deleted,
    };
  }

  function makeStorageMock() {
    const removed: string[] = [];
    const removeEntry = vi.fn().mockImplementation((name: string) => {
      removed.push(name);
      return Promise.resolve();
    });
    return {
      stub: {
        storage: {
          getDirectory: vi.fn<[], Promise<FileSystemDirectoryHandle>>().mockResolvedValue({
            removeEntry,
          } as unknown as FileSystemDirectoryHandle),
        },
      },
      removed,
    };
  }

  it("purges Cache Storage on a successful 204 sign-out", async () => {
    const { stub: cacheStub, deletedCaches } = makeCachesMock();
    const idbMock = makeIdbMock();
    const storageMock = makeStorageMock();

    vi.stubGlobal("caches", cacheStub);
    vi.stubGlobal("indexedDB", idbMock.stub);
    vi.stubGlobal("navigator", storageMock.stub);
    vi.stubGlobal("fetch", vi.fn<[Request], Promise<Response>>().mockResolvedValue(
      new Response(null, { status: 204 }),
    ));

    const request = new Request("https://evaandadam.app/api/session", {
      method: "DELETE",
    });
    await handleSignOut({ request });

    expect(deletedCaches).toContain("photo-display-v1");
    expect(deletedCaches).toContain("photo-thumb-v1");
    expect(deletedCaches).toContain("nav-v1");
  });

  it("purges Cache Storage even when fetch throws (offline sign-out)", async () => {
    const { stub: cacheStub, deletedCaches } = makeCachesMock();
    const idbMock = makeIdbMock();
    const storageMock = makeStorageMock();

    vi.stubGlobal("caches", cacheStub);
    vi.stubGlobal("indexedDB", idbMock.stub);
    vi.stubGlobal("navigator", storageMock.stub);
    vi.stubGlobal(
      "fetch",
      vi.fn<[Request], Promise<Response>>().mockRejectedValue(
        new TypeError("Failed to fetch"),
      ),
    );

    const request = new Request("https://evaandadam.app/api/session", {
      method: "DELETE",
    });
    // Must not throw — local purge is the load-bearing invariant.
    await expect(handleSignOut({ request })).resolves.not.toThrow();

    expect(deletedCaches).toContain("photo-display-v1");
  });

  it("returns a synthetic 204 when the network is unavailable", async () => {
    const { stub: cacheStub } = makeCachesMock();
    const idbMock = makeIdbMock();
    const storageMock = makeStorageMock();

    vi.stubGlobal("caches", cacheStub);
    vi.stubGlobal("indexedDB", idbMock.stub);
    vi.stubGlobal("navigator", storageMock.stub);
    vi.stubGlobal(
      "fetch",
      vi.fn<[Request], Promise<Response>>().mockRejectedValue(
        new TypeError("Failed to fetch"),
      ),
    );

    const request = new Request("https://evaandadam.app/api/session", {
      method: "DELETE",
    });
    const response = await handleSignOut({ request });

    expect(response.status).toBe(204);
  });

  it("removes the OPFS outbox/ directory (photograph bytes)", async () => {
    const { stub: cacheStub } = makeCachesMock();
    const idbMock = makeIdbMock();
    const storageMock = makeStorageMock();

    vi.stubGlobal("caches", cacheStub);
    vi.stubGlobal("indexedDB", idbMock.stub);
    vi.stubGlobal("navigator", storageMock.stub);
    vi.stubGlobal("fetch", vi.fn<[Request], Promise<Response>>().mockResolvedValue(
      new Response(null, { status: 204 }),
    ));

    const request = new Request("https://evaandadam.app/api/session", {
      method: "DELETE",
    });
    await handleSignOut({ request });

    expect(storageMock.removed).toContain("outbox");
  });

  it("deletes IndexedDB eva-adam-outbox (captions, author)", async () => {
    const { stub: cacheStub } = makeCachesMock();
    const idbMock = makeIdbMock();
    const storageMock = makeStorageMock();

    vi.stubGlobal("caches", cacheStub);
    vi.stubGlobal("indexedDB", idbMock.stub);
    vi.stubGlobal("navigator", storageMock.stub);
    vi.stubGlobal("fetch", vi.fn<[Request], Promise<Response>>().mockResolvedValue(
      new Response(null, { status: 204 }),
    ));

    const request = new Request("https://evaandadam.app/api/session", {
      method: "DELETE",
    });
    await handleSignOut({ request });

    expect(idbMock.deleted).toContain("eva-adam-outbox");
  });

  it("handleSignOut is the handler for the sign-out descriptor", () => {
    // Regression: if handleSignOut is replaced with an empty stub, this test
    // still passes (it only checks the descriptor). The tests above verify
    // handleSignOut's actual behavior. Together they cover mutation D.
    const rule = ROUTE_DESCRIPTORS.find((d) => d.id === "sign-out");
    expect(rule).toBeDefined();
    expect(rule?.strategyTag).toBe("handleSignOut");
    // method: "DELETE" is load-bearing — see P2-2 and sw.ts comment.
    expect(rule?.method).toBe("DELETE");
  });
});

// ---------------------------------------------------------------------------
// Mutation E — /api/* NetworkOnly
//
// Replacing the api descriptor's strategyTag with "CacheFirst" allows every
// authenticated API response to be written to disk — a privacy failure. The
// test asserts the strategyTag is "NetworkOnly".
// ---------------------------------------------------------------------------

describe("Mutation E: /api/* NetworkOnly — not CacheFirst", () => {
  it("an /api/ URL matches the api descriptor", () => {
    const apiUrl = makeUrl("/api/photos/550e8400-e29b-41d4-a716-446655440000");
    const rule = findRule({ url: apiUrl, request: { method: "GET" } });
    expect(rule?.id).toBe("api");
  });

  it("the api descriptor uses the NetworkOnly strategy", () => {
    const rule = ROUTE_DESCRIPTORS.find((d) => d.id === "api");
    expect(rule).toBeDefined();
    expect(rule?.strategyTag).toBe("NetworkOnly");
  });

  it("/api/session also matches the api rule (via isApiPath, not sign-out rule)", () => {
    // The sign-out rule only fires on DELETE. A GET /api/session falls through
    // to the api NetworkOnly rule.
    const sessionUrl = makeUrl("/api/session");
    const rule = findRule({ url: sessionUrl, request: { method: "GET" } });
    expect(rule?.id).toBe("api");
  });
});

// ---------------------------------------------------------------------------
// Sign-out rule: method: "DELETE" is load-bearing (P2-2)
//
// The comment in sw.ts previously credited ORDERING for protecting the sign-out
// route. Serwist stores routes per method — the /api/* rule is GET-only, so
// rules 1 and 3 never compete. method: "DELETE" is the actual load-bearing
// field. This test catches the case where someone drops it.
// ---------------------------------------------------------------------------

describe("sign-out rule: method: 'DELETE' is present", () => {
  it("the sign-out descriptor has method: 'DELETE'", () => {
    const rule = ROUTE_DESCRIPTORS.find((d) => d.id === "sign-out");
    expect(rule).toBeDefined();
    expect(rule?.method).toBe("DELETE");
  });

  it("DELETE /api/session matches the sign-out rule (not the api rule)", () => {
    const sessionUrl = makeUrl("/api/session");
    const rule = findRule({ url: sessionUrl, request: { method: "DELETE" } });
    expect(rule?.id).toBe("sign-out");
  });
});
