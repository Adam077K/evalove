/**
 * POST /api/ai/chat — one exchange with the margin, streamed.
 *
 * The route is a composition root and nothing else: validate, situate, ground,
 * stream, close. No product rule lives here. Every constraint that matters —
 * the vault boundary, the turn budget, the refusal contract, the cost line —
 * is enforced inside `lib/ai/`, where the eval suite can reach it. A rule that
 * only holds in an HTTP handler is a rule that does not hold in a test.
 *
 * Newline-delimited JSON rather than Server-Sent Events. The consumer here is
 * one `fetch` in a PWA, not an `EventSource`; NDJSON is a line per event with
 * no framing to parse, and it survives a proxy that would otherwise buffer an
 * SSE stream into uselessness.
 *
 * Every line on the wire is a `MarginStreamEvent`. Text events carry
 * `speaker: "margin"` — HL-1 — so no surface can render one as content either
 * partner wrote, and a client that joins late still knows what it is reading.
 */

import { z } from "zod";

import { env } from "@/lib/env";
import { allowanceOf, InMemorySpendLedger } from "@/lib/ai/budget";
import { anthropicTransport, MissingApiKeyError } from "@/lib/ai/transport";
import { situationOf } from "@/lib/ai/context";
import { streamMargin } from "@/lib/ai/chat";
import { groundingFor } from "@/lib/ai/sources";
import { currentWindow } from "@/lib/shared-day";

import type { MarginStreamEvent } from "@/lib/ai/types";

/** Node, not edge: the transport and the library read both want `node:fs`. */
export const runtime = "nodejs";

/**
 * The margin is never cached. Every answer depends on what time it is where
 * the other one lives, and a cached one would be a claim about a clock that
 * has moved.
 */
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ *
 * Input
 * ------------------------------------------------------------------ */

/**
 * The body.
 *
 * `viewer` is taken from the request rather than inferred, mirroring the rest
 * of this app: identity here is `self_declared` — somebody tapped a name — and
 * pretending otherwise would be the mistake `Identity.source` exists to
 * prevent. There are two people and no privilege boundary between them, so a
 * mis-tap is a wrong pronoun, not a leak.
 *
 * The message is capped at a length no honest question exceeds. The cap is
 * input validation, not a product limit: an unbounded string is a bill.
 */
const bodySchema = z.object({
  viewer: z.enum(["eva", "adam"]),
  message: z.string().trim().min(1).max(2000),
});

/** One event, one line. */
function line(event: MarginStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/* ------------------------------------------------------------------ *
 * The ledger
 * ------------------------------------------------------------------ */

/**
 * One ledger for the process.
 *
 * Module scope on purpose: a ledger constructed per request would count to one
 * every time and enforce nothing. Its limits are documented on the class — it
 * is per-process, so a multi-instance deployment enforces a looser cap than
 * the stated one. That is a brake rather than a guarantee until the count
 * moves to a row, and it is the honest state of it.
 */
const ledger = new InMemorySpendLedger();

/* ------------------------------------------------------------------ *
 * Handler
 * ------------------------------------------------------------------ */

export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "Expected a JSON body." }, 400);
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      { error: "Bad request.", issues: parsed.error.issues.map((i) => i.message) },
      400,
    );
  }

  let transport;
  try {
    transport = anthropicTransport({ apiKey: env.ANTHROPIC_API_KEY });
  } catch (error: unknown) {
    if (error instanceof MissingApiKeyError) {
      // 503, not 500. Nothing is broken; a credential is absent, and the rest
      // of the app is unaffected by that.
      return json({ error: error.message, feature: "margin" }, 503);
    }
    throw error;
  }

  const at = new Date();
  const situation = situationOf(parsed.data.viewer, at);
  const grounding = groundingFor(situation, { window: currentWindow(at) });

  const allowance = allowanceOf(
    ledger,
    situation.viewer,
    situation.viewerLocalDate,
  );

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of streamMargin(
          { situation, message: parsed.data.message, grounding },
          { transport, ledger },
        )) {
          controller.enqueue(line(event));
        }
      } catch (error: unknown) {
        // The generator's own error path already emits an `error` event for
        // everything it can see. Reaching here means something escaped it, and
        // a half-open stream is worse than a last line saying so.
        controller.enqueue(
          line({
            type: "error",
            speaker: "margin",
            message:
              error instanceof Error ? error.message : "The call did not go through.",
            retryable: true,
          }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      // Lets a surface render "there's this much of the margin left today"
      // without a second round trip, and without the count appearing in the
      // body where it would read as part of what the margin said.
      "x-margin-remaining": String(allowance.remaining),
      "x-margin-limit": String(allowance.limit),
    },
  });
}
