/**
 * Numbers spelled as words. Digits read as a metric; words read as
 * prose — and the one place the day-count may appear (the colophon,
 * direction §9) sets it in prose. Covers 0–999, which outlasts them.
 */

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
] as const;

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
] as const;

export function spellNumber(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  const whole = Math.floor(n);
  if (whole < 20) return ONES[whole] ?? "";
  if (whole < 100) {
    const t = TENS[Math.floor(whole / 10)] ?? "";
    const r = whole % 10;
    return r === 0 ? t : `${t}-${ONES[r]}`;
  }
  if (whole < 1000) {
    const h = `${ONES[Math.floor(whole / 100)]} hundred`;
    const r = whole % 100;
    return r === 0 ? h : `${h} and ${spellNumber(r)}`;
  }
  return String(whole); // beyond the colophon's horizon; never reached
}

/** `Forty-one days, both of us.` — the colophon's one line. */
export function colophonLine(count: number): string {
  const words = spellNumber(count);
  const capitalised = words.charAt(0).toUpperCase() + words.slice(1);
  return `${capitalised} ${count === 1 ? "day" : "days"}, both of us.`;
}
