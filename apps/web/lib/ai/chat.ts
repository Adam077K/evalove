/**
 * One exchange with the margin, end to end.
 *
 * The order of operations here is the design, not an implementation detail:
 *
 *   1. Is there any margin left today? If not, nothing is assembled, nothing
 *      is sent, and nothing is billed. The budget is checked before the vault
 *      firewall only because it is cheaper; both are gates and neither is
 *      skippable.
 *   2. Grounding is trimmed to the input ceiling, oldest first.
 *   3. The prompt is assembled — and this is where the vault boundary holds.
 *   4. The call is made, streaming.
 *   5. Usage is priced and one line is logged, on every path that reached the
 *      wire, including the ones that ended badly.
 *
 * Step 5 has no early return past it. A call that throws mid-stream still cost
 * money, and a cost log that only records successes is a cost log that
 * understates the bill in exactly the month something is wrong.
 */

import { InMemorySpendLedger, allowanceOf, fitGrounding } from "./budget";
import { logLlmCall, tokenCountsOf, usageOf } from "./cost";
import { MARGIN_MODEL } from "./model";
import { renderPrompt } from "./context";
import { systemPrompt } from "./transport";
import { VaultBoundaryError } from "./vault-firewall";

import type { SpendLedger } from "./budget";
import type { CostSink } from "./cost";
import type { MarginTransport } from "./transport";
import type {
  MarginRequest,
  MarginStop,
  MarginStreamEvent,
  MarginTurn,
} from "./types";

/**
 * What the margin says when it has run out for the day.
 *
 * Written as a fact about the margin rather than as a limit imposed on the
 * person. "That's me done for today" is a thing a person says; "you have
 * reached your daily quota" is a thing a meter says, and a meter is precisely
 * the register this product refuses everywhere else.
 *
 * It ends by pointing at the other one, because that is what the whole feature
 * is for.
 */
export const OUT_OF_MARGIN =
  "That's me done for today. There's more of the day left than there is of me — " +
  "the other one is the better end of this conversation anyway.";

/**
 * What it says when the API's own classifier declines.
 *
 * Distinct from a refusal the margin chose, and phrased so it cannot be
 * mistaken for one: a margin refusal states a reason about this couple, and
 * this one states a fact about the machine.
 */
export const DECLINED_BY_SAFETY =
  "Something went wrong on my end with that one, and I'd rather say so than " +
  "guess at what you meant. Try putting it a different way.";

export interface MarginChatOptions {
  transport: MarginTransport;
  ledger?: SpendLedger;
  costSink?: CostSink;
  /** Injectable for deterministic latency in tests. */
  now?: () => number;
}

const defaultLedger = new InMemorySpendLedger();

function stopFrom(reason: string | null): MarginStop {
  switch (reason) {
    case "refusal":
      return "declined-by-safety";
    case "max_tokens":
      return "length";
    default:
      return "finished";
  }
}

/**
 * Stream one exchange.
 *
 * Yields our own event type rather than the transport's, so that a surface
 * never sees an Anthropic shape and `speaker: "margin"` rides on every text
 * event. A consumer that renders event by event cannot lose the attribution,
 * which is HL-1 held at the type level rather than in a comment.
 */
export async function* streamMargin(
  request: MarginRequest,
  options: MarginChatOptions,
): AsyncGenerator<MarginStreamEvent> {
  const {
    transport,
    ledger = defaultLedger,
    costSink,
    now = () => Date.now(),
  } = options;

  const { viewer } = request.situation;
  const day = request.situation.viewerLocalDate;

  const allowance = allowanceOf(ledger, viewer, day);
  if (allowance.remaining <= 0) {
    yield { type: "text", speaker: "margin", text: OUT_OF_MARGIN };
    yield { type: "stop", speaker: "margin", stop: "refused" };
    return;
  }

  let userText: string;
  try {
    userText = renderPrompt({
      ...request,
      grounding: fitGrounding(request.grounding),
    });
  } catch (error: unknown) {
    // A boundary violation is not a retryable fault and must not be softened
    // into one. It is a bug in a caller, it is surfaced as such, and no call
    // is made.
    if (error instanceof VaultBoundaryError) {
      yield {
        type: "error",
        speaker: "margin",
        message: error.message,
        retryable: false,
      };
      return;
    }
    throw error;
  }

  // Spent before the call rather than after it. A call that starts and fails
  // still occupied the margin's attention and still cost money; charging only
  // for successes would make a broken day unlimited.
  ledger.spend(viewer, day);

  const startedAt = now();
  let stop: MarginStop = "finished";
  let refusalCategory: string | null = null;
  let model: string = MARGIN_MODEL;
  let counts = tokenCountsOf({});
  let sawText = false;

  try {
    for await (const event of transport({
      system: systemPrompt(),
      userText,
    })) {
      if (event.type === "text") {
        if (event.text !== "") sawText = true;
        yield { type: "text", speaker: "margin", text: event.text };
        continue;
      }

      model = event.model;
      stop = stopFrom(event.stopReason);
      refusalCategory = event.refusalCategory;
      counts = tokenCountsOf(event.usage);
    }

    if (stop === "declined-by-safety" && !sawText) {
      yield { type: "text", speaker: "margin", text: DECLINED_BY_SAFETY };
    }

    yield { type: "stop", speaker: "margin", stop };
  } catch (error: unknown) {
    stop = "declined-by-safety";
    yield {
      type: "error",
      speaker: "margin",
      message:
        error instanceof Error
          ? error.message
          : "The call did not go through.",
      // Retryable from the caller's point of view: the transport already
      // exhausted its own backoff, so this is "try again later", not
      // "try again now".
      retryable: true,
    };
  } finally {
    const usage = usageOf(MARGIN_MODEL, counts, now() - startedAt);
    logLlmCall({ ...usage, model }, stop, refusalCategory, costSink);
    // `yield` inside `finally` is legal and is the only way to guarantee the
    // consumer is handed the usage on every path, including the failing ones.
    yield { type: "usage", usage: { ...usage, model } };
  }
}

/** The same exchange, collected. For callers that do not stream. */
export async function askMargin(
  request: MarginRequest,
  options: MarginChatOptions,
): Promise<MarginTurn> {
  let text = "";
  let stop: MarginStop = "finished";
  let usage = usageOf(MARGIN_MODEL, tokenCountsOf({}), 0);

  for await (const event of streamMargin(request, options)) {
    switch (event.type) {
      case "text":
        text += event.text;
        break;
      case "stop":
        stop = event.stop;
        break;
      case "usage":
        usage = event.usage;
        break;
      case "error":
        text = text === "" ? DECLINED_BY_SAFETY : text;
        stop = "declined-by-safety";
        break;
    }
  }

  return { speaker: "margin", text, stop, usage };
}
