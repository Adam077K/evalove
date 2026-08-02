/**
 * A real, minimal, baseline JPEG encoder — test support only.
 *
 * Node has no canvas, so the strip assertion needs *something* to stand in for
 * `OffscreenCanvas.convertToBlob()`. The stand-in has to satisfy one property
 * and it is the property under test: **pixels in, JPEG bytes out, carrying no
 * metadata of any kind**. That is exactly what a canvas guarantees and exactly
 * what this produces.
 *
 * It is a genuine encoder, not a byte template: SOI, a standard luminance
 * quantisation table in zig-zag order, SOF0 declaring the real dimensions,
 * two Huffman tables, SOS, byte-stuffed entropy-coded data, EOI. Any decoder
 * reads it. Only the DC coefficient of each 8×8 block is transmitted — the
 * image comes out blocky — because the fidelity of the *pixels* is not what
 * the assertion is about, and a full DCT here would be a hundred lines of
 * arithmetic with its own bugs standing between the test and its subject.
 *
 * What this cannot model is the browser's encoder specifically. That is the
 * job of `e2e/photo-pipeline.spec.ts`, which runs the same `preparePhoto()`
 * against a real `OffscreenCanvas` in WebKit. The two together cover it: this
 * one proves our code forwards encoder output and refuses anything carrying
 * metadata; that one proves the platform encoder emits none.
 */

/** Annex K luminance table, in the zig-zag order DQT is written in. */
const QUANT_ZIGZAG = [
  16, 11, 12, 14, 12, 10, 16, 14, 13, 14, 18, 17, 16, 19, 24, 40, 26, 24, 22,
  22, 24, 49, 35, 37, 29, 40, 58, 51, 61, 60, 57, 51, 56, 55, 64, 72, 92, 78,
  64, 68, 87, 69, 55, 56, 80, 109, 81, 87, 95, 98, 103, 104, 103, 62, 77, 113,
  121, 112, 100, 120, 92, 101, 103, 99,
];

/** The DC quantiser is element 0 of the table in natural order. */
const DC_QUANT = 16;

/** Annex K DC luminance code lengths and values. */
const DC_BITS = [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
const DC_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/**
 * A deliberately tiny AC table: two two-bit codes, EOB and ZRL.
 *
 * Only EOB is ever emitted. Two symbols rather than one because a table with a
 * single code would assign it the all-ones pattern, which the standard
 * reserves.
 */
const AC_BITS = [0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const AC_VALUES = [0x00, 0xf0];

interface HuffmanCode {
  code: number;
  length: number;
}

/**
 * Build the canonical code table from a BITS/HUFFVAL pair.
 *
 * Both lookups are bounds-checked rather than asserted non-null. A BITS array
 * that promises more codes than HUFFVAL supplies is a genuinely broken table,
 * and the symptom of letting it through would be a JPEG that decodes to
 * garbage in some viewers and not others — the worst possible way to find out.
 */
function buildHuffmanTable(
  bits: readonly number[],
  values: readonly number[],
): Map<number, HuffmanCode> {
  const table = new Map<number, HuffmanCode>();
  let code = 0;
  let k = 0;
  for (let length = 1; length <= 16; length++) {
    const countAtLength = bits[length - 1];
    if (countAtLength === undefined) {
      throw new RangeError(
        `Huffman BITS has ${bits.length} entries; 16 are required.`,
      );
    }
    for (let i = 0; i < countAtLength; i++) {
      const symbol = values[k];
      if (symbol === undefined) {
        throw new RangeError(
          `Huffman BITS promises ${k + 1} symbols but HUFFVAL supplies ${values.length}.`,
        );
      }
      table.set(symbol, { code, length });
      code++;
      k++;
    }
    code <<= 1;
  }
  return table;
}

const DC_TABLE = buildHuffmanTable(DC_BITS, DC_VALUES);
const AC_TABLE = buildHuffmanTable(AC_BITS, AC_VALUES);

/** Number of bits needed to represent a DC difference. */
function magnitudeCategory(value: number): number {
  let magnitude = Math.abs(value);
  let category = 0;
  while (magnitude > 0) {
    magnitude >>= 1;
    category++;
  }
  return category;
}

class BitWriter {
  private readonly bytes: number[] = [];
  private accumulator = 0;
  private bitCount = 0;

  write(code: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) {
      this.accumulator = (this.accumulator << 1) | ((code >> i) & 1);
      this.bitCount++;
      if (this.bitCount === 8) {
        this.bytes.push(this.accumulator & 0xff);
        // Byte stuffing: 0xFF in entropy data is followed by 0x00 so it is
        // never mistaken for a marker.
        if ((this.accumulator & 0xff) === 0xff) this.bytes.push(0x00);
        this.accumulator = 0;
        this.bitCount = 0;
      }
    }
  }

  /** Pad the final partial byte with 1s, as the standard requires. */
  finish(): number[] {
    while (this.bitCount !== 0) this.write(1, 1);
    return this.bytes;
  }
}

/**
 * Append without spreading.
 *
 * `out.push(...bytes)` passes every element as an argument, and the entropy
 * data for a 1600 px variant runs to tens of thousands of them — past the
 * argument limit, where it stops being a slow line and becomes a stack
 * overflow that only appears on large photographs.
 */
function append(out: number[], bytes: ArrayLike<number>): void {
  for (let i = 0; i < bytes.length; i++) out.push(bytes[i] as number);
}

function segment(out: number[], code: number, body: ArrayLike<number>): void {
  out.push(0xff, code);
  const length = body.length + 2;
  out.push((length >> 8) & 0xff, length & 0xff);
  append(out, body);
}

/**
 * Read one sample, restating the bounds invariant instead of asserting it away.
 *
 * `encodeBaselineJpeg` already checks that the buffer holds `width * height`
 * bytes, so this never throws in practice. It is here because the alternative
 * spellings both hide a real bug: `!` would let an out-of-range read through as
 * `undefined`, and `?? 0` would turn it into a plausible-looking black pixel.
 * A wrong DC coefficient is invisible until someone looks at a photograph.
 */
function sampleAt(samples: Uint8Array, index: number): number {
  const value = samples[index];
  if (value === undefined) {
    throw new RangeError(
      `Sample ${index} is outside the ${samples.length}-byte buffer.`,
    );
  }
  return value;
}

/**
 * Encode 8-bit grayscale samples to a baseline JPEG.
 *
 * @param samples row-major, `width * height` bytes, 0–255.
 */
export function encodeBaselineJpeg(
  samples: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  if (samples.length < width * height) {
    throw new Error("Not enough samples for the declared dimensions.");
  }

  if (width <= 0 || height <= 0) {
    throw new RangeError("A JPEG needs a positive width and height.");
  }

  const out: number[] = [];
  out.push(0xff, 0xd8); // SOI

  segment(out, 0xdb, [0x00, ...QUANT_ZIGZAG]); // DQT, 8-bit, table 0

  segment(out, 0xc0, [
    0x08, // sample precision
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    0x01, // one component
    0x01, // component id
    0x11, // 1x1 sampling
    0x00, // quantisation table 0
  ]); // SOF0

  segment(out, 0xc4, [0x00, ...DC_BITS, ...DC_VALUES]); // DHT, class 0, id 0
  segment(out, 0xc4, [0x10, ...AC_BITS, ...AC_VALUES]); // DHT, class 1, id 0

  segment(out, 0xda, [
    0x01, // one component in scan
    0x01, // component id
    0x00, // DC table 0, AC table 0
    0x00, // Ss
    0x3f, // Se
    0x00, // Ah / Al
  ]); // SOS

  const writer = new BitWriter();
  const blocksWide = Math.ceil(width / 8);
  const blocksHigh = Math.ceil(height / 8);
  let previousDc = 0;

  for (let by = 0; by < blocksHigh; by++) {
    for (let bx = 0; bx < blocksWide; bx++) {
      // DC of an 8x8 DCT with the usual normalisation is the mean of the
      // level-shifted samples multiplied by 8.
      let sum = 0;
      for (let y = 0; y < 8; y++) {
        const sy = Math.min(by * 8 + y, height - 1);
        for (let x = 0; x < 8; x++) {
          const sx = Math.min(bx * 8 + x, width - 1);
          sum += sampleAt(samples, sy * width + sx) - 128;
        }
      }
      const dc = Math.round(sum / 8 / DC_QUANT);
      const diff = dc - previousDc;
      previousDc = dc;

      const category = magnitudeCategory(diff);
      const dcCode = DC_TABLE.get(category);
      if (!dcCode) throw new Error(`No DC code for category ${category}.`);
      writer.write(dcCode.code, dcCode.length);
      if (category > 0) {
        // Negative values are transmitted as the one's complement.
        const encoded = diff > 0 ? diff : diff + (1 << category) - 1;
        writer.write(encoded, category);
      }

      const eob = AC_TABLE.get(0x00);
      if (!eob) throw new Error("No EOB code.");
      writer.write(eob.code, eob.length);
    }
  }

  append(out, writer.finish());
  out.push(0xff, 0xd9); // EOI

  return Uint8Array.from(out);
}
