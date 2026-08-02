import type { IsoDateTime, Uuid } from "@/lib/types";
import { ADAM, EVA } from "./members";

/**
 * Things left for the other one — the sealed shelf on Home.
 *
 * A left-behind is deliberately opaque until opened: the card knows
 * who left it, roughly when, and what kind of thing it is. It never
 * carries a preview, a thumbnail, or a first line. Anticipation is
 * the whole point of the pattern.
 */
export type LeftKind = "note" | "photo" | "voice";

export interface LeftBehind {
  id: Uuid;
  fromMemberId: Uuid;
  forMemberId: Uuid;
  kind: LeftKind;
  leftAt: IsoDateTime;
  /** Set once the recipient has opened it. */
  openedAt?: IsoDateTime;
}

/** Eva has a note waiting, unopened — Adam left it in his morning, her night. */
export const LEFT_BEHINDS: LeftBehind[] = [
  {
    id: "6c31aa90-2e44-4d8b-b1f0-000000000001",
    fromMemberId: ADAM.id,
    forMemberId: EVA.id,
    kind: "note",
    leftAt: "2026-08-02T05:12:00Z",
  },
];

export function leftFor(memberId: Uuid): LeftBehind[] {
  return LEFT_BEHINDS.filter((l) => l.forMemberId === memberId && !l.openedAt);
}

export const LEFT_KIND_LABEL: Record<LeftKind, string> = {
  note: "a note",
  photo: "a photograph",
  voice: "a voice message",
};
