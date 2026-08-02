import type { IsoDate } from "@/lib/types";

/**
 * The fixture calendar is anchored to 2026-08-02 so every screen's
 * data agrees with every other screen's. The dial and the sky always
 * compute from the REAL clock (`new Date()`) — direction §13 forbids
 * illustrating the offset — so those two surfaces are live even in
 * the fixture build. Wiring replaces this constant with the computed
 * shared day and nothing else changes.
 */
export const FIXTURE_TODAY: IsoDate = "2026-08-02";
