/**
 * BoardReviewContent — the client component that renders design-H's objects.
 *
 * "use client" lives here so the page.tsx can remain a Server Component
 * (required for the force-dynamic directive to work correctly).
 *
 * Objects are ported from design-H.html:1083-1299, in the same order.
 * Coordinates are verbatim (left, top, width, rotation).
 *
 * Objects NOT ported here (T1 scope is the ground only):
 *   - Voice note, song card — no audio backend; outside T1 scope
 *   - Clocks card — ported in T6 (uses lib/shared-day/)
 *   - Invitation card — ported in T6 (requires date_plans data)
 *   - Deck overlay, book overlay — separate components (T4, T5)
 *   - Day stacks — ported here as static Furniture placeholders
 *   - Ribbon, chips — not porting (replaced by pan gesture + contact sheet)
 *
 * Day stacks use design-H's STACK_AT array verbatim (design-H:2145-2149)
 * and the DAYS data for thickness and labels.
 */

"use client";

import { Table } from "./Table";
import { Print } from "./objects/Print";
import { Bare } from "./objects/Bare";
import { Scrap } from "./objects/Scrap";
import { Tape, Pin, Press, Label } from "./objects/Furniture";
import { CoupleAtWindow } from "./objects/CoupleAtWindow";
import { Tome } from "./objects/Tome";
import { Stack } from "./objects/Stack";

/* ── Day stacks — from design-H:2127-2175 ──────────────────────── */

const DAYS = [
  { d: "20260716", label: "16 Jul", n: 1, orient: "p" as const },
  { d: "20260718", label: "18 Jul", n: 1, orient: "p" as const },
  { d: "20260724", label: "24 Jul", n: 19, orient: "p" as const },
  { d: "20260725", label: "25 Jul", n: 5, orient: "l" as const },
  { d: "20260727", label: "27 Jul", n: 2, orient: "l" as const },
  { d: "20260730", label: "30 Jul", n: 2, orient: "p" as const },
  { d: "20260731", label: "31 Jul", n: 3, orient: "l" as const },
  { d: "20260801", label: "1 Aug", n: 1, orient: "l" as const },
  { d: "20260802", label: "2 Aug", n: 1, orient: "l" as const },
  { d: "20260803", label: "3 Aug", n: 4, orient: "p" as const },
  { d: "20260806", label: "6 Aug", n: 6, orient: "p" as const },
  { d: "20260807", label: "7 Aug", n: 1, orient: "p" as const },
] as const;

// design-H:2145-2149 — verbatim coordinate pairs [left, top]
const STACK_AT: [number, number][] = [
  [470, 70], [588, 58], [700, 88], [812, 66],
  [462, 196], [576, 214], [694, 190], [810, 206],
  [470, 332], [586, 344], [700, 326], [812, 340],
];

export function BoardReviewContent() {
  return (
    // Full-screen container; the Table itself handles the viewport glass
    <div style={{ position: "fixed", inset: 0, background: "#241811" }}>
      <Table onTomeClick={() => void 0}>
        {/* ── Day stacks on the cork board ────────────────────── */}
        {DAYS.map((day, i) => {
          const at = STACK_AT[i];
          if (!at) return null;
          return (
            <Stack
              key={day.d}
              dayKey={day.d}
              label={day.label}
              count={day.n}
              orient={day.orient}
              left={at[0]}
              top={at[1]}
              rotation={(i % 2 ? 1 : -1) * (1.4 + (i % 4) * 1.1)}
              // T1 uses placeholder thumbnail (public not gitignored)
              thumbSrc="/materials/book-cloth-olive.webp"
            />
          );
        })}

        {/* ── DAY — her afternoon ─────────────────────────────── */}
        <Press
          src="/materials/sticker-rose-red-pressed.webp"
          left={326}
          top={166}
          width={76}
          rotation={22}
          zIndex={4}
        />

        {/* Day scrap with date, city, clock */}
        <Scrap
          torn="torn-b"
          rotation={-0.9}
          left={50}
          top={52}
          width={372}
          sheetPadding="15px 18px 46px"
        >
          <p className="board-eyebrow">Sunday</p>
          <span className="board-citybox">New York</span>
          <span className="board-clock">3:41 PM</span>
          <div className="board-rule" />
          <div className="board-cue">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            seven hours ahead, further down
          </div>
        </Scrap>

        <Tape
          src="/materials/washi-terracotta.webp"
          left={350}
          top={38}
          width={76}
          rotation={30}
        />

        {/* Mounted portrait — Eva's photograph (p6) */}
        <Print
          src="/design-p6.jpg"
          alt="Two people sitting close together on grass by a river at sunset, the sky gone orange above the far shore."
          width={250}
          rotation={-3.4}
          left={60}
          top={236}
          caption="2 August"
          photoKey="p6"
        />
        <Tape
          src="/materials/washi-ochre-dots.webp"
          left={250}
          top={242}
          width={96}
          rotation={23}
        />
        <Press
          src="/materials/sticker-butterfly-pressed.webp"
          left={44}
          top={546}
          width={62}
          rotation={-22}
          zIndex={28}
        />

        {/* Bare portrait — Lisbon photograph (p1) */}
        <Bare
          src="/design-p1.jpg"
          alt="A woman standing in a wide stone square in Lisbon, the Rua Augusta arch behind her in bright sun."
          width={158}
          rotation={5.6}
          left={282}
          top={326}
          zIndex={8}
          photoKey="p1"
        />
        <Label text="Lisbon, 6 August" left={278} top={518} rotation={4.4} hers />

        {/* Bare portrait — HaShalom train (p2) */}
        <Bare
          src="/design-p2.jpg"
          alt="A blue and red commuter train pulling into a platform, blurred by its own motion, the platform edge painted yellow."
          width={140}
          rotation={-6.2}
          left={44}
          top={750}
          photoKey="p2"
        />
        <Label text="HaShalom, 7 August" left={40} top={992} rotation={-5.2} />

        {/* Handwritten note scrap */}
        <Scrap
          torn="torn-tb"
          rotation={2.6}
          left={222}
          top={762}
          width={198}
          sheetPadding="16px 15px 20px"
        >
          <p className="board-hand board-his">
            you recorded this at 11:20, your time. I heard it on the platform at twenty past six and the train came in blurred.
          </p>
        </Scrap>
        <Tape
          src="/materials/washi-ochre-dots.webp"
          left={232}
          top={892}
          width={88}
          rotation={-14}
        />

        {/* Cork board background element (z-index 6, below objects) */}
        <div
          className="board-obj board-corkboard"
          style={{ left: 420, top: 560, transform: "rotate(-1.4deg)", zIndex: 6 }}
          aria-hidden="true"
        />

        {/* Mounted portrait on cork — Adam's NYC avenue (p4) */}
        <Print
          src="/design-p4.jpg"
          alt="A New York avenue in low afternoon sun, a cyclist waiting at a green bike lane, a yellow cab crossing."
          width={176}
          rotation={3}
          left={448}
          top={588}
          caption="25 July"
          captionHis
          photoKey="p4"
        />
        <Pin left={524} top={572} />

        {/* Bare portrait — NYC garden path (p7) */}
        <Bare
          src="/design-p7.jpg"
          alt="A woman walking a raised garden path in New York, roses on one side, glass towers behind."
          width={150}
          rotation={-5.5}
          left={600}
          top={620}
          zIndex={12}
          photoKey="p7"
        />
        <Pin left={664} top={606} />
        <Label text="28 July" left={762} top={738} rotation={-7} hers />

        <Press
          src="/materials/sticker-record-45rpm.webp"
          left={772}
          top={576}
          width={104}
          rotation={-9}
          zIndex={14}
        />

        {/* Bare portrait — underwater projection (p8) */}
        <Bare
          src="/design-p8.jpg"
          alt="People standing in a darkened room in front of a vast blue underwater projection."
          width={122}
          rotation={5.4}
          left={632}
          top={808}
          zIndex={12}
          photoKey="p8"
        />
        <Pin left={684} top={794} />
        <Label text="30 July" left={760} top={914} rotation={5} hers />

        <Press
          src="/materials/sticker-ticket-cinema.webp"
          left={778}
          top={798}
          width={86}
          rotation={15}
          zIndex={14}
        />

        {/* Bare landscape — party (p3) */}
        <Bare
          src="/design-p3.jpg"
          alt="Three friends indoors at a party, arms around each other, two wearing novelty star glasses."
          width={196}
          rotation={-2.6}
          left={458}
          top={854}
          photoKey="p3"
        />
        <Pin left={546} top={840} />
        <Label text="31 July" left={462} top={1006} rotation={2} />

        {/* ── DUSK ───────────────────────────────────────────────── */}

        {/* The Book — closed tome */}
        <Tome rotation={-3} left={90} top={1120} />

        {/* Mounted portrait in dusk — reading room (p5) */}
        <Print
          src="/design-p5.jpg"
          alt="A library reading room with a tall triangular window, a timber vaulted ceiling and racks of newspapers."
          width={148}
          rotation={-4.2}
          left={250}
          top={1180}
          caption="3 August"
          captionHis
          captionLeft
          zIndex={8}
          photoKey="p5"
        />

        <Press
          src="/materials/sticker-star-gold-foil.webp"
          left={446}
          top={1222}
          width={36}
          rotation={13}
          zIndex={26}
        />

        <Scrap
          torn="torn-tb"
          rotation={1.6}
          left={470}
          top={1250}
          width={344}
          sheetPadding="18px 20px 24px"
        >
          <p className="board-hand" style={{ fontSize: "17px" }}>
            Nine o&apos;clock, my time. I&apos;ll leave the window open so you can hear the street.
          </p>
        </Scrap>

        <Press
          src="/materials/sticker-stamp-vintage.webp"
          left={756}
          top={1234}
          width={72}
          rotation={11}
          zIndex={26}
        />
        <Press
          src="/materials/sticker-sunflower-pressed-v3.webp"
          left={738}
          top={1290}
          width={110}
          rotation={-19}
          zIndex={26}
        />

        {/* ── NIGHT ─────────────────────────────────────────────── */}

        {/* Art Deco couple at the window */}
        <CoupleAtWindow rotation={-2.2} left={286} top={1440} />

        {/* Clocks card — hardcoded for T1 (real data in T6) */}
        <div
          className="board-obj board-pickup"
          data-rot="0"
          style={{ left: 280, top: 1920, zIndex: 24 }}
          aria-label="Clocks — real data wired in T6"
        >
          <div style={{
            width: 340,
            padding: "15px 16px 14px",
            background: "linear-gradient(168deg,#183254,#102544 68%,#0d1f3a)",
            border: "1px solid rgba(217,164,65,.30)",
            borderRadius: 13,
            color: "#e8dfc8",
            boxShadow: "0 1px 0 rgba(217,164,65,.14) inset, 0 3px 5px rgba(0,0,0,.5), 0 18px 34px rgba(0,0,0,.6), 0 40px 70px rgba(0,0,0,.44)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".20em", textTransform: "uppercase", color: "#d9a441", fontFamily: "var(--board-ui)" }}>Awake and free, both</span>
              <span style={{ fontSize: 11, color: "rgba(232,223,200,.6)", fontFamily: "var(--board-ui)", fontVariantNumeric: "tabular-nums" }}>today</span>
            </div>
            <div style={{ marginTop: 13, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
              <span>
                <span style={{ display: "inline-block", border: "1px solid #e8dfc8", padding: "4px 9px 3px", fontSize: 9.5, fontWeight: 700, letterSpacing: ".26em", textTransform: "uppercase", fontFamily: "var(--board-ui)" }}>New York</span>
                <span style={{ display: "block", marginTop: 8, fontFamily: "\"Fraunces Variable\", Georgia, serif", fontVariationSettings: "\"opsz\" 120, \"wght\" 400", fontSize: 40, lineHeight: 0.9, letterSpacing: "-.028em", fontVariantNumeric: "tabular-nums" }}>3:41 PM</span>
              </span>
              <span style={{ textAlign: "right" }}>
                <span style={{ display: "inline-block", border: "1px solid rgba(232,223,200,.44)", padding: "4px 9px 3px", fontSize: 9.5, fontWeight: 700, letterSpacing: ".26em", textTransform: "uppercase", color: "rgba(232,223,200,.44)", fontFamily: "var(--board-ui)" }}>Tel Aviv</span>
                <span style={{ display: "block", marginTop: 8, fontFamily: "\"Fraunces Variable\", Georgia, serif", fontVariationSettings: "\"opsz\" 96, \"wght\" 400", fontSize: 27, lineHeight: 0.9, letterSpacing: "-.02em", color: "rgba(232,223,200,.56)", fontVariantNumeric: "tabular-nums" }}>10:41 PM</span>
              </span>
            </div>
            <p style={{ marginTop: 11, paddingTop: 10, borderTop: "1px solid rgba(217,164,65,.20)", fontSize: 12, lineHeight: 1.5, color: "#e8dfc8" }}>
              Free together 9:00&ndash;11:00 AM in New York.{" "}
              <span style={{ color: "rgba(232,223,200,.55)" }}>4:00&ndash;6:00 PM his. Then Wednesday, then Saturday.</span>
            </p>
          </div>
        </div>

        {/* Invitation card — hardcoded for T1 (real data in T6) */}
        <div
          className="board-obj board-pickup"
          data-rot="-1.6"
          style={{ left: 268, top: 2270, zIndex: 10 }}
          role="button"
          tabIndex={0}
          aria-label="A date Eva has asked for. Open to answer."
        >
          <div style={{
            width: 296,
            position: "relative",
            padding: "20px 20px 18px",
            background: "linear-gradient(172deg,#f4ead2,#e8dcbe 62%,#dfd1af)",
            borderRadius: 2,
            boxShadow: "0 2px 3px rgba(0,0,0,.44), 0 16px 30px rgba(0,0,0,.5), 0 34px 60px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.7)",
          }}>
            <div style={{ position: "absolute", inset: 7, border: "1px solid rgba(126,44,38,.42)", pointerEvents: "none" }}>
              <div style={{ position: "absolute", inset: 3, border: "1px solid rgba(126,44,38,.22)" }} />
            </div>
            <div style={{ position: "relative", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--board-ui)", fontSize: 8, fontWeight: 700, letterSpacing: ".34em", textTransform: "uppercase", color: "#9b5b3c", textIndent: ".34em" }}>Eva has asked</p>
              <h3 style={{ marginTop: 9, fontFamily: "\"Fraunces Variable\", Georgia, serif", fontVariationSettings: "\"opsz\" 96, \"wght\" 400, \"WONK\" 1", fontSize: 22, fontWeight: 400, color: "#4a3520", lineHeight: 1.1 }}>
                Start the same film at the same second
              </h3>
              <div style={{ height: 1, background: "rgba(126,44,38,.24)", margin: "12px 0 8px" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                  <b style={{ display: "block", fontFamily: "\"Fraunces Variable\", Georgia, serif", fontVariationSettings: "\"opsz\" 60, \"wght\" 440", fontSize: 18, color: "#4a3520" }}>9:00 AM</b>
                  <span style={{ fontSize: 9, fontFamily: "var(--board-ui)", color: "#9b5b3c", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 700 }}>New York</span>
                </span>
                <span style={{ textAlign: "right" }}>
                  <b style={{ display: "block", fontFamily: "\"Fraunces Variable\", Georgia, serif", fontVariationSettings: "\"opsz\" 60, \"wght\" 440", fontSize: 18, color: "#4a3520" }}>4:00 PM</b>
                  <span style={{ fontSize: 9, fontFamily: "var(--board-ui)", color: "#9b5b3c", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 700 }}>Tel Aviv</span>
                </span>
              </div>
              <p style={{ marginTop: 12, fontSize: 11, fontFamily: "var(--board-ui)", color: "#9b5b3c" }}>
                Tap to answer &middot; <b>Eva</b> is waiting
              </p>
            </div>
          </div>
        </div>

      </Table>
    </div>
  );
}
