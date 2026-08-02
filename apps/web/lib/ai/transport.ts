/**
 * The wire.
 *
 * Everything that knows about `@anthropic-ai/sdk` is in this file, behind a
 * function type that takes a request and yields events. That is not layering
 * for its own sake — the evals and the tests need to drive the whole pipeline
 * without a network or an API key, and a seam here is what lets them do it
 * against the real assembly code instead of against a parallel fake of it.
 *
 * Retry policy, and why it stops where it does:
 *
 *   429 (rate limited) and 529 (overloaded) are retried with exponential
 *   backoff and jitter, twice, before the stream opens. Two people share this
 *   app; a rate limit here means something is wrong rather than that we are
 *   busy, and retrying forever would turn a transient fault into a bill.
 *
 *   Nothing is retried once bytes have been delivered. A partial answer
 *   followed by a second, different answer is worse than a partial answer
 *   followed by an honest failure, and this is a feature where a confusing
 *   half-message is exactly the wrong artefact to produce.
 *
 *   5xx below 529 is retried; 4xx other than 429 is not. A bad request will
 *   be bad the second time too.
 */

import Anthropic from "@anthropic-ai/sdk";

import { MARGIN_EFFORT, MARGIN_MAX_OUTPUT_TOKENS, MARGIN_MODEL } from "./model";
import { MARGIN_SYSTEM_PROMPT } from "./system-prompt";

/* ------------------------------------------------------------------ *
 * The seam
 * ------------------------------------------------------------------ */

export interface TransportRequest {
  /** The frozen, cacheable system prompt. */
  system: string;
  /** The assembled user turn: clock, grounding, question. */
  userText: string;
}

export interface TransportUsage {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

export type TransportEvent =
  | { type: "text"; text: string }
  | {
      type: "done";
      model: string;
      stopReason: string | null;
      /** Set only when the API's own classifier declined. */
      refusalCategory: string | null;
      usage: TransportUsage;
    };

/** A transport is anything that turns a request into a stream of events. */
export type MarginTransport = (
  request: TransportRequest,
) => AsyncIterable<TransportEvent>;

/* ------------------------------------------------------------------ *
 * Missing credentials
 * ------------------------------------------------------------------ */

/**
 * Thrown when there is no API key.
 *
 * A distinct type rather than a generic error because this is the one failure
 * an operator can fix in thirty seconds, and it should not arrive looking like
 * an outage. The feature is complete without the key; it is just not callable.
 */
export class MissingApiKeyError extends Error {
  override readonly name = "MissingApiKeyError";

  constructor() {
    super(
      "ANTHROPIC_API_KEY is not set. The margin is fully implemented and its " +
        "evals run offline without a key, but no call can be made until one " +
        "exists. Set it in .env.local (see apps/web/.env.example).",
    );
  }
}

/* ------------------------------------------------------------------ *
 * Retry
 * ------------------------------------------------------------------ */

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 500;

/** 429, 529, and 5xx are worth a second try. Everything else is not. */
function isRetryable(error: unknown): boolean {
  if (!(error instanceof Anthropic.APIError)) return false;
  const status = error.status;
  if (status === undefined) return true; // a connection fault, no response
  return status === 429 || status >= 500;
}

/**
 * Backoff with full jitter.
 *
 * Jitter matters even for two clients: without it, a retry after a 529 lands
 * at the same moment as every other retry the provider is fielding, which is
 * how an overload becomes a longer overload.
 */
function delayFor(attempt: number, random: () => number): number {
  const ceiling = BASE_DELAY_MS * 2 ** attempt;
  return Math.round(ceiling * random());
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/* ------------------------------------------------------------------ *
 * The Anthropic transport
 * ------------------------------------------------------------------ */

export interface AnthropicTransportOptions {
  apiKey: string | undefined;
  /** Injectable for tests; defaults to the real client. */
  client?: Anthropic;
  /** Injectable so backoff is deterministic under test. */
  random?: () => number;
}

/**
 * The real transport.
 *
 * Streaming, always. Not for the typing effect — a non-streaming call with a
 * high effort setting can sit past an HTTP timeout, and the request would then
 * be billed and lost.
 *
 * The system prompt carries `cache_control` because it is a fixed constant of
 * roughly two thousand tokens that is identical on every call. Cached reads
 * cost a tenth of fresh input, and this is the one place in the feature where
 * a large stable prefix exists to exploit.
 *
 * Sampling parameters are absent on purpose: `temperature`, `top_p` and
 * `top_k` are removed on this model family and sending one returns a 400.
 * Adaptive thinking replaces the old fixed thinking budget, which is likewise
 * rejected here.
 *
 * Server-side refusal fallbacks are deliberately NOT enabled. On this feature
 * a policy refusal is a diagnostic signal we want to see and answer with our
 * own copy, and silently continuing on a different model would change the
 * voice mid-conversation — the one property this feature cannot afford to
 * vary. `stop_reason: "refusal"` is handled explicitly instead.
 */
export function anthropicTransport(
  options: AnthropicTransportOptions,
): MarginTransport {
  const { apiKey, client, random = Math.random } = options;

  if (client === undefined && (apiKey === undefined || apiKey.trim() === "")) {
    throw new MissingApiKeyError();
  }

  const anthropic = client ?? new Anthropic({ apiKey });

  return async function* run(
    request: TransportRequest,
  ): AsyncIterable<TransportEvent> {
    let attempt = 0;

    for (;;) {
      try {
        const stream = anthropic.messages.stream({
          model: MARGIN_MODEL,
          max_tokens: MARGIN_MAX_OUTPUT_TOKENS,
          thinking: { type: "adaptive" },
          output_config: { effort: MARGIN_EFFORT },
          system: [
            {
              type: "text",
              text: request.system,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: [{ role: "user", content: request.userText }],
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            yield { type: "text", text: event.delta.text };
          }
        }

        const final = await stream.finalMessage();
        yield {
          type: "done",
          model: final.model,
          stopReason: final.stop_reason,
          refusalCategory:
            final.stop_reason === "refusal"
              ? (final.stop_details?.category ?? "unspecified")
              : null,
          usage: final.usage,
        };
        return;
      } catch (error: unknown) {
        attempt += 1;
        if (attempt >= MAX_ATTEMPTS || !isRetryable(error)) throw error;
        await sleep(delayFor(attempt, random));
      }
    }
  };
}

/** The frozen system prompt, as the transport expects to receive it. */
export function systemPrompt(): string {
  return MARGIN_SYSTEM_PROMPT;
}
