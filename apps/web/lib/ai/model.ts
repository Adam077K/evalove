/**
 * The model the margin runs on, and what it costs.
 *
 * One model, named once. Two people share this app and there is no traffic
 * shape that would justify a router: the difference between the cheapest and
 * the most capable model here is a few dollars a month, and the thing that
 * actually goes wrong in this feature is tone — a model that agrees too
 * readily, hedges an impersonation instead of refusing it, or slips into the
 * present tense about someone who is asleep. Those are judgement failures, and
 * judgement is what the price buys.
 *
 * Prices are dollars per million tokens, from the Anthropic pricing table
 * cached 2026-06-24. They are duplicated here rather than fetched because a
 * cost log that silently reports zero when a lookup times out is worse than a
 * cost log that is a few weeks stale, and `PRICING_AS_OF` makes the staleness
 * visible instead of invisible.
 */

/** The only model this feature calls. */
export const MARGIN_MODEL = "claude-opus-5" as const;

export type MarginModel = typeof MARGIN_MODEL;

/** When the prices below were last checked against Anthropic's table. */
export const PRICING_AS_OF = "2026-06-24" as const;

export interface ModelPricing {
  /** USD per million input tokens, uncached. */
  readonly inputPerMTok: number;
  /** USD per million output tokens. */
  readonly outputPerMTok: number;
  /**
   * Multiplier applied to the input rate for tokens written into the prompt
   * cache. Writing costs more than reading fresh; it pays back on the second
   * request and every one after it.
   */
  readonly cacheWriteMultiplier: number;
  /** Multiplier applied to the input rate for tokens served from the cache. */
  readonly cacheReadMultiplier: number;
}

export const PRICING: Readonly<Record<MarginModel, ModelPricing>> = {
  "claude-opus-5": {
    inputPerMTok: 5,
    outputPerMTok: 25,
    cacheWriteMultiplier: 1.25,
    cacheReadMultiplier: 0.1,
  },
};

/**
 * Reasoning effort.
 *
 * `high` is the API default and it is kept deliberately rather than lowered.
 * The failure mode of a cheaper setting is not a worse sentence — it is a
 * refusal that gets hedged into a half-compliance, which is exactly the
 * behaviour the hard lines exist to prevent. Effort is what this feature
 * spends money on; length is not.
 */
export const MARGIN_EFFORT = "high" as const;

/**
 * Output ceiling, in tokens.
 *
 * Short on purpose. The margin's success condition is that the conversation
 * ends with the real person, and long answers are the opposite of that. This
 * is roughly two short paragraphs, which is as much as anything in a margin
 * should ever be.
 */
export const MARGIN_MAX_OUTPUT_TOKENS = 700;

/**
 * Input ceiling, in tokens, for the whole assembled request.
 *
 * The model's context window is a thousand times this. The ceiling is not
 * about what fits; it is about how much of their history is worth sending
 * outside the stack for one question. Grounding is truncated to fit, oldest
 * first, before assembly.
 */
export const MARGIN_MAX_INPUT_TOKENS = 12_000;
