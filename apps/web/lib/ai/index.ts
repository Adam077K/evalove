/**
 * The margin — an AI inside Eva & Adam.
 *
 * Specification: `docs/04-features/AI-PARTNER-SPEC.md`. Read it before
 * changing anything here; several of the constraints in this directory look
 * arbitrary and are not.
 *
 * The one-line version: it is a voice that has read the book and talks about
 * what Eva and Adam wrote, in its own voice, never as either of them. Quoting
 * the record is allowed. Predicting the person is not.
 *
 * Layout:
 *   model.ts            the model, the prices, the ceilings
 *   system-prompt.ts    the frozen instructions — cacheable, never templated
 *   vault-firewall.ts   the boundary the pocket is on the far side of
 *   types.ts            the contract the design track builds against
 *   activity-library.ts reading the 98 researched records
 *   context.ts          real app data -> the one block of prompt text
 *   budget.ts           how much of the margin there is in a day
 *   cost.ts             what a call cost, and the one line written about it
 *   transport.ts        the wire, and everything that knows about the SDK
 *   chat.ts             one exchange, end to end
 *   evals/              the cases, the graders, the runner
 */

export {
  MARGIN_EFFORT,
  MARGIN_MAX_INPUT_TOKENS,
  MARGIN_MAX_OUTPUT_TOKENS,
  MARGIN_MODEL,
  PRICING,
  PRICING_AS_OF,
} from "./model";
export type { MarginModel, ModelPricing } from "./model";

export {
  MARGIN_SYSTEM_PROMPT,
  approximateSystemPromptTokens,
} from "./system-prompt";

export {
  GROUNDING_TABLE_ALLOWLIST,
  VaultBoundaryError,
  assertGroundingTable,
  assertPromptVaultFree,
  assertVaultFree,
  isVaultShaped,
} from "./vault-firewall";

export {
  clockGrounding,
  groundingFromActivities,
  groundingFromBookEntries,
  groundingFromDateTurns,
  groundingFromPhotos,
  renderPrompt,
  situationOf,
} from "./context";

export {
  normaliseCost,
  parseActivityLibrary,
  selectActivities,
} from "./activity-library";
export type { ActivityLibrary, ActivityQuery } from "./activity-library";

export {
  InMemorySpendLedger,
  TURNS_PER_SHARED_DAY,
  allowanceOf,
  estimateTokens,
  fitGrounding,
} from "./budget";
export type { SpendLedger } from "./budget";

export {
  consoleCostSink,
  costUsdOf,
  logLlmCall,
  tokenCountsOf,
  usageOf,
} from "./cost";
export type { CostLogLine, CostSink, TokenCounts } from "./cost";

export {
  MissingApiKeyError,
  anthropicTransport,
  systemPrompt,
} from "./transport";
export type {
  MarginTransport,
  TransportEvent,
  TransportRequest,
  TransportUsage,
} from "./transport";

export {
  DECLINED_BY_SAFETY,
  OUT_OF_MARGIN,
  askMargin,
  streamMargin,
} from "./chat";
export type { MarginChatOptions } from "./chat";

export type {
  ActivityGrounding,
  ClockGrounding,
  Grounding,
  GroundingKind,
  MarginAllowance,
  MarginRequest,
  MarginSituation,
  MarginStop,
  MarginStreamEvent,
  MarginTurn,
  MarginUsage,
  SharedDayGrounding,
  WrittenGrounding,
} from "./types";
