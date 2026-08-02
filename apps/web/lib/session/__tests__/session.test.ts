/**
 * The session seam: the five behaviours, and the one distinction that will be
 * collapsed by accident if nothing pins it.
 *
 * THE DISTINCTION. `requireSession()` throws and `requireSessionOrRedirect()`
 * redirects, and they exist separately because a `fetch` and a browser want
 * different answers to "you are not signed in". Merging them is a one-line
 * edit that looks like a cleanup, and the damage — an API client receiving a
 * 307 to an HTML login page and reporting a JSON parse error — surfaces
 * nowhere near the edit. So both directions are asserted here.
 *
 * `next/headers` and `next/navigation` are stubbed. The alternative is a
 * running Next server, which would test the framework rather than this module,
 * and would not catch the merge.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ *
 * Stubs
 * ------------------------------------------------------------------ */

/** A cookie jar with the small surface `next/headers` actually gives us. */
const jar = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    get: (name: string) => {
      const value = store.get(name);
      return value === undefined ? undefined : { name, value };
    },
    // The options argument is the point of several assertions below, so the
    // stub has to declare it — a two-parameter stub makes `call[2]` a type
    // error and tempts the next person to assert on nothing.
    set: vi.fn(
      (name: string, value: string, _options?: Record<string, unknown>) => {
        store.set(name, value);
      },
    ),
  };
});

/**
 * Next's `redirect` throws a sentinel. Reproduced rather than imported: the
 * real one carries framework internals, and what this file needs to know is
 * only "control did not come back, and it went to /login".
 */
const redirectSignal = vi.hoisted(() => {
  class RedirectSignal extends Error {
    constructor(readonly to: string) {
      super(`NEXT_REDIRECT:${to}`);
    }
  }
  return {
    RedirectSignal,
    redirect: vi.fn((to: string) => {
      throw new RedirectSignal(to);
    }),
  };
});

vi.mock("next/headers", () => ({ cookies: async () => jar }));
vi.mock("next/navigation", () => ({ redirect: redirectSignal.redirect }));

/** The one member lookup `getIdentity` makes. No database in this file. */
vi.mock("@/lib/data/members", () => ({
  memberIdBySlug: async (slug: "eva" | "adam") =>
    slug === "eva" ? "1e0a5c1e-0000-4000-8000-00000000eva1" : "2ad0f4b2-0000-4000-8000-0000000adam2",
}));

import {
  createSession,
  destroySession,
  getIdentity,
  getSession,
  requireSession,
  requireSessionOrRedirect,
  UnauthenticatedError,
} from "@/lib/session";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/session/token";

beforeEach(() => {
  jar.store.clear();
  jar.set.mockClear();
  redirectSignal.redirect.mockClear();
});

/* ------------------------------------------------------------------ *
 * The round trip
 * ------------------------------------------------------------------ */

describe("createSession / getSession", () => {
  it("mints a session that reads back", async () => {
    const created = await createSession();
    const read = await getSession();

    expect(read).not.toBeNull();
    expect(read?.sid).toBe(created.sid);
    expect(read?.v).toBe(created.v);
    // No `mid`: one password, two people, and the door cannot tell them apart.
    expect(read?.mid).toBeUndefined();
  });

  it("gives every sign-in its own id", async () => {
    const first = await createSession();
    const second = await createSession();
    expect(first.sid).not.toBe(second.sid);
  });

  it("sets the cookie with every attribute that makes it safe", async () => {
    await createSession();

    const call = jar.set.mock.calls.at(0);
    expect(call).toBeDefined();
    const options = call?.[2];

    expect(options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    // Six months. Pinned as a literal so a change to the constant has to be a
    // decision made twice.
    expect(SESSION_MAX_AGE_SECONDS).toBe(15_552_000);
  });

  it("reads nothing back from a token that has been tampered with", async () => {
    await createSession();
    const [name, token] = jar.set.mock.calls[0] as [string, string];
    // Flip the last character of the signature.
    const last = token.slice(-1) === "A" ? "B" : "A";
    jar.store.set(name, token.slice(0, -1) + last);

    await expect(getSession()).resolves.toBeNull();
  });

  it("reads nothing back from an empty jar", async () => {
    await expect(getSession()).resolves.toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * The distinction
 * ------------------------------------------------------------------ */

describe("requireSession — the route-handler shape", () => {
  it("throws UnauthenticatedError when there is no session", async () => {
    await expect(requireSession()).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("does NOT redirect", async () => {
    // The assertion that stops the merge. A route handler's caller is a
    // `fetch`; handing it a 307 to an HTML page is how a missing session gets
    // reported as a JSON parse error somewhere else entirely.
    await requireSession().catch(() => undefined);
    expect(redirectSignal.redirect).not.toHaveBeenCalled();
  });

  it("returns the session when there is one", async () => {
    const created = await createSession();
    await expect(requireSession()).resolves.toMatchObject({ sid: created.sid });
  });
});

describe("requireSessionOrRedirect — the page shape", () => {
  it("redirects to the door when there is no session", async () => {
    await expect(requireSessionOrRedirect()).rejects.toBeInstanceOf(
      redirectSignal.RedirectSignal,
    );
    expect(redirectSignal.redirect).toHaveBeenCalledWith("/login");
  });

  it("returns the session when there is one", async () => {
    const created = await createSession();
    await expect(requireSessionOrRedirect()).resolves.toMatchObject({
      sid: created.sid,
    });
    expect(redirectSignal.redirect).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ *
 * Attribution
 * ------------------------------------------------------------------ */

describe("getIdentity", () => {
  it("is null when nobody has tapped a name", async () => {
    await expect(getIdentity()).resolves.toBeNull();
  });

  it("carries source: self_declared, always", async () => {
    jar.store.set("profile", "adam");
    const identity = await getIdentity();

    expect(identity?.source).toBe("self_declared");
    expect(identity?.memberId).toBe("2ad0f4b2-0000-4000-8000-0000000adam2");
  });

  it("ignores a profile value that is not one of the two names", async () => {
    // Including index-style values. `a` and `b` are exactly how a
    // wrong-attribution bug gets written, so they are not merely unsupported —
    // they are refused.
    for (const bogus of ["a", "b", "0", "1", "EVA", "", "adam; admin"]) {
      jar.store.set("profile", bogus);
      await expect(getIdentity()).resolves.toBeNull();
    }
  });
});

/* ------------------------------------------------------------------ *
 * Out
 * ------------------------------------------------------------------ */

describe("destroySession", () => {
  it("expires both cookies with the attributes they were set with", async () => {
    await createSession();
    jar.set.mockClear();

    await destroySession();

    const written = Object.fromEntries(
      jar.set.mock.calls.map((call) => [call[0], call[2]]),
    );

    // A browser matches a deletion on name AND path. A `Max-Age=0` that
    // disagrees about `path` leaves the original cookie in place and the
    // person signed in while the UI insists otherwise.
    expect(written["ea_session"]).toMatchObject({ path: "/", maxAge: 0 });
    expect(written["profile"]).toMatchObject({ path: "/", maxAge: 0 });
  });

  it("leaves no readable session behind", async () => {
    await createSession();
    await destroySession();
    await expect(getSession()).resolves.toBeNull();
  });
});
