// @vitest-environment jsdom
/**
 * `send()` used to fake 1100ms of latency it did not have, then push a
 * hard-coded apology dressed up as Echo's own chat turn. Two things
 * pin that closed:
 *
 *   1. A source-level check (same technique as
 *      `lib/shared-day/__tests__/no-numeric-shift.test.ts`) that the
 *      file contains no `setTimeout` and no "thinking" simulation —
 *      the mechanism itself cannot come back quietly.
 *   2. A render test proving the honest state appears in the same
 *      synchronous act as the viewer's own bubble, not after a delay
 *      or an awaited update — it is a fact about the surface, not a
 *      reply that arrives.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { EchoChat } from "../EchoChat";

afterEach(cleanup);

// jsdom does not implement `scrollIntoView` — EchoChat calls it to keep
// the newest bubble in view, which is real behaviour, not something
// this test cares about.
Element.prototype.scrollIntoView = vi.fn();

// `import.meta.url` is not a `file://` URL under the jsdom transform,
// unlike in a `node`-environment test file — so this resolves from
// `process.cwd()` instead, which vitest always runs from `apps/web`.
const SOURCE = readFileSync(
  join(process.cwd(), "components/echo/EchoChat.tsx"),
  "utf8",
);

describe("EchoChat source", () => {
  it("never simulates latency", () => {
    expect(SOURCE).not.toMatch(/setTimeout/);
  });

  it("has no thinking / typing-indicator state", () => {
    // Checks for the *mechanism* (a piece of React state and its
    // setter), not the word — the honest fix still explains itself in
    // prose ("No thinking delay…"), which is fine to keep.
    expect(SOURCE).not.toMatch(/\[\s*thinking\s*,/i);
    expect(SOURCE).not.toMatch(/setThinking/i);
    expect(SOURCE).not.toMatch(/useState[^;]*thinking/i);
  });
});

describe("EchoChat send()", () => {
  it("holds the question and states the honest surface fact — both in the same synchronous update, not a delayed reply", () => {
    render(<EchoChat />);

    const input = screen.getByRole("textbox", { name: /Ask Echo about/i });
    fireEvent.change(input, { target: { value: "Find us something for Saturday" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    // No `await`, no `waitFor`, no fake-timer advance between the
    // submit above and these assertions: if either needed a tick to
    // appear, `getByText`/`getByRole` below would already be throwing.
    expect(screen.getByText("Find us something for Saturday")).toBeTruthy();
    expect(
      screen.getByText(/Echo isn.t wired to the record yet/),
    ).toBeTruthy();

    // Real chat replies use `role="status"` region alone — the honest
    // line is not one more entry in the bubble list.
    expect(screen.getByRole("status").textContent).toMatch(
      /Echo isn.t wired to the record yet/,
    );
  });
});
