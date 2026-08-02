/**
 * What a call cost, and the one line written about it.
 *
 * Two rules govern this file and both are about what is NOT here.
 *
 *   The log never contains the prompt, the completion, a caption, a name, or
 *   anything either of them wrote. It is an operations record, not a
 *   transcript. Logs are shipped, aggregated, retained and read by tooling
 *   nobody audited, and this couple's content does not belong in any of that.
 *   §10 of the spec.
 *
 *   Nothing here measures engagement. No session length, no return frequency,
 *   no turn-to-turn latency trend. A metric that rewards the margin for being
 *   talked to more is a metric that will eventually be optimised, and F8 is
 *   what that looks like when it happens.
 *
 * Cost is computed rather than read back from the API so that a call which
 * throws mid-stream still produces a number from whatever usage arrived.
 */

import { PRICING, PRICING_AS_OF } from "./model";

import type { MarginModel, ModelPricing } from "./model";
import type { MarginStop, MarginUsage } from "./types";

/** Raw token counts, exactly as the API reports them. */
export interface TokenCounts {
  inputTokens: number;
  outputTokens: number;
  /** Tokens served from the prompt cache. Cheap. */
  cacheReadTokens: number;
  /** Tokens written into the prompt cache. Dearer than fresh input, once. */
  cacheWriteTokens: number;
}

const PER_MILLION = 1_000_000;

/** Treats a missing or non-finite count as zero rather than as `NaN`. */
function count(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

/**
 * Normalise the SDK's usage object into our own counts.
 *
 * The SDK types several of these as `number | null`, and a null that reaches
 * arithmetic turns a cost log into `NaN` — which then reads as "free" to
 * anything scanning for a threshold. Normalising at the edge is cheaper than
 * discovering that in a month's billing.
 */
export function tokenCountsOf(usage: {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}): TokenCounts {
  return {
    inputTokens: count(usage.input_tokens),
    outputTokens: count(usage.output_tokens),
    cacheReadTokens: count(usage.cache_read_input_tokens),
    cacheWriteTokens: count(usage.cache_creation_input_tokens),
  };
}

/**
 * Dollars for one call.
 *
 * Cached reads and cache writes are priced off the input rate by their own
 * multipliers rather than being lumped in with fresh input, because the whole
 * reason the system prompt is cached is that the two differ by an order of
 * magnitude, and a cost line that hides that cannot show the saving.
 */
export function costUsdOf(
  counts: TokenCounts,
  pricing: ModelPricing = PRICING["claude-opus-5"],
): number {
  const input = counts.inputTokens * pricing.inputPerMTok;
  const cacheRead =
    counts.cacheReadTokens * pricing.inputPerMTok * pricing.cacheReadMultiplier;
  const cacheWrite =
    counts.cacheWriteTokens *
    pricing.inputPerMTok *
    pricing.cacheWriteMultiplier;
  const output = counts.outputTokens * pricing.outputPerMTok;

  return (input + cacheRead + cacheWrite + output) / PER_MILLION;
}

export function usageOf(
  model: MarginModel,
  counts: TokenCounts,
  latencyMs: number,
): MarginUsage {
  return {
    model,
    inputTokens: counts.inputTokens,
    outputTokens: counts.outputTokens,
    cacheReadTokens: counts.cacheReadTokens,
    cacheWriteTokens: counts.cacheWriteTokens,
    costUsd: costUsdOf(counts, PRICING[model]),
    latencyMs,
  };
}

/**
 * The shape of the one line written per call.
 *
 * Every field is a number, an enum, or a fixed string. There is no free-text
 * field, which is the structural reason no caption can ever end up here: there
 * is nowhere to put one.
 */
export interface CostLogLine {
  event: "llm_call";
  feature: "margin";
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  cost_usd: number;
  latency_ms: number;
  stop: MarginStop;
  /** Which refusal category fired, when the API's own classifier declined. */
  refusal_category: string | null;
  /** Staleness marker for the price table the cost was computed from. */
  pricing_as_of: string;
}

/** Where a cost line goes. Injectable so tests assert on it without a spy. */
export type CostSink = (line: CostLogLine) => void;

/**
 * The default sink: one JSON line on stdout.
 *
 * `console.log` rather than a logging library because this app has no logging
 * library and adding one for a single call site is how dependency lists get
 * long. Vercel captures stdout; a JSON line is queryable there.
 */
export const consoleCostSink: CostSink = (line) => {
  console.log(JSON.stringify(line));
};

export function logLlmCall(
  usage: MarginUsage,
  stop: MarginStop,
  refusalCategory: string | null = null,
  sink: CostSink = consoleCostSink,
): CostLogLine {
  const line: CostLogLine = {
    event: "llm_call",
    feature: "margin",
    model: usage.model,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    cache_read_tokens: usage.cacheReadTokens,
    cache_write_tokens: usage.cacheWriteTokens,
    // Six decimals: a single margin turn costs on the order of a cent, and
    // rounding to four would report a cheap turn as zero.
    cost_usd: Number(usage.costUsd.toFixed(6)),
    latency_ms: Math.round(usage.latencyMs),
    stop,
    refusal_category: refusalCategory,
    pricing_as_of: PRICING_AS_OF,
  };

  sink(line);
  return line;
}
