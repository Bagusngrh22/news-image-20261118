// news-image-20261118 entry (Node 22, standard library only, no network).
//
// Draws a one-page newspaper front page summing up Wednesday 18 November
// 2026's world news, and writes it to /output/entry.png (1024x1024 PNG).
// All news is baked in at build time; the program makes no network calls,
// reads no clock and uses no randomness, so two runs write byte-identical
// output.
//
// The four stories (each verified as 18 November 2026, from public sources
// read on 18 Nov 2026):
//   1. GULF FLASHPOINT — Iran drones attack a US military radar system in
//      Bahrain; Kuwait's army reports drone interceptions; Bahrain issues an
//      all-clear after the overnight warning. (Jagran Josh, Top World News
//      18 Nov 2026; AppiSToS World, dated 18.11.2026 02:25.)
//   2. TRUMP IN MANILA — Trump arrives in Manila for Quad talks ahead of a
//      China visit; Modi at the East Asia Summit. (Jagran Josh, 18 Nov 2026.)
//   3. UKRAINE STRIKES CRIMEAN BRIDGE — major strike on the bridge; Russia
//      pounds Kyiv bridges in reply; UN counts at least 372 civilians killed
//      in Ukraine in October. (Jagran Josh, 18 Nov 2026; AppiSToS, 18.11.2026.)
//   4. NVIDIA $115.8B — record quarterly revenue, +103% year over year,
//      data center $107.6B, Q4 guidance $130B; first results since Jensen
//      Huang resigned as CEO, interim CEO Colette Kress. (Motley Fool,
//      TechCrunch, Cointelegraph, published 18 Nov 2026.)
// The ticker strip adds: Canada-China extend trade deals, Xi meets Carney
// ahead of APEC; Britain sanctions Israeli settlement firms; US presses the
// UN over Taiwan flight restrictions; Latvia confidence vote; Asif Merchant
// sentenced to 27.5 years; Gaza: WFP one hot meal every two days; Cyclone
// Akvan intensifying.
//
// The image is drawn with a small built-in 5x7 bitmap font and a hand-rolled
// PNG encoder (CRC32 + zlib deflate, fixed settings), so the whole entry is
// one self-contained file.
//
// Run it: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- PNG encoder

/** CRC-32 (IEEE) table, built once. */
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}

/** Encode RGB pixel data (W*H*3 bytes) as a PNG. Deterministic. */
function encodePng(rgb: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type 2 = RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    rgb.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- 5x7 font
// Each glyph is 7 rows of 5 pixels, written as strings, top row first.
// Only the characters the front page needs are defined; anything else
// renders as a blank.

const GLYPHS: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  '\u2022': ['00000', '00000', '01100', '01100', '01100', '00000', '00000'],
};

const BLANK = ['00000', '00000', '00000', '00000', '00000', '00000', '00000'];

// ---------------------------------------------------------------- drawing

type RGB = [number, number, number];
const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];
const RED: RGB = [200, 30, 30];
const GREY: RGB = [110, 110, 110];
const LIGHT: RGB = [238, 238, 238];

class Canvas {
  pixels = Buffer.alloc(W * H * 3, 255);
  set(x: number, y: number, c: RGB): void {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = (y * W + x) * 3;
    this.pixels[i] = c[0];
    this.pixels[i + 1] = c[1];
    this.pixels[i + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
  }
  hline(x: number, y: number, w: number, c: RGB, t = 1): void {
    this.rect(x, y, w, t, c);
  }
  vline(x: number, y: number, h: number, c: RGB, t = 1): void {
    this.rect(x, y, t, h, c);
  }
  border(x: number, y: number, w: number, h: number, c: RGB, t = 2): void {
    this.hline(x, y, w, c, t);
    this.hline(x, y + h - t, w, c, t);
    this.vline(x, y, h, c, t);
    this.vline(x + w - t, y, h, c, t);
  }
  /** Draw one glyph at (x, y), scaled by s. Returns the advance in px. */
  glyph(ch: string, x: number, y: number, s: number, c: RGB): number {
    const g = GLYPHS[ch] ?? BLANK;
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === '1') this.rect(x + col * s, y + r * s, s, s, c);
      }
    }
    return 6 * s;
  }
  text(str: string, x: number, y: number, s: number, c: RGB): number {
    let cx = x;
    for (const ch of str.toUpperCase()) cx += this.glyph(ch, cx, y, s, c);
    return cx - x;
  }
  textWidth(str: string, s: number): number {
    return str.toUpperCase().length * 6 * s;
  }
  centered(str: string, y: number, s: number, c: RGB, cx = W / 2): void {
    this.text(str, Math.round(cx - this.textWidth(str, s) / 2), y, s, c);
  }
  /** Word-wrap str to lines of at most maxW px at scale s. */
  wrap(str: string, maxW: number, s: number): string[] {
    const words = str.toUpperCase().split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const trial = cur ? cur + ' ' + w : w;
      if (this.textWidth(trial, s) <= maxW || !cur) cur = trial;
      else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }
  /** Draw wrapped text; returns the y after the last line. */
  paragraph(str: string, x: number, y: number, maxW: number, s: number, c: RGB, leading?: number): number {
    const lh = leading ?? Math.round(7 * s * 1.5);
    let yy = y;
    for (const line of this.wrap(str, maxW, s)) {
      this.text(line, x, yy, s, c);
      yy += lh;
    }
    return yy;
  }
}

// ---------------------------------------------------------------- front page

function drawFrontPage(): Buffer {
  const cv = new Canvas();
  const M = 32; // margin
  const CW = W - 2 * M; // content width = 960

  // Masthead.
  cv.centered('THE DAILY WORLD', 36, 5, BLACK);
  cv.hline(M, 96, CW, BLACK, 3);
  cv.centered('WEDNESDAY 18 NOVEMBER 2026', 108, 2, BLACK);
  cv.hline(M, 134, CW, BLACK, 1);

  // ---- Lead story: Gulf flashpoint (full width).
  const leadY = 150;
  const leadH = 190;
  cv.border(M, leadY, CW, leadH, BLACK, 2);
  cv.rect(M + 2, leadY + 2, 218, 26, RED);
  cv.text('GULF FLASHPOINT', M + 12, leadY + 9, 2, WHITE);
  cv.paragraph('IRAN DRONES HIT US RADAR IN BAHRAIN', M + 16, leadY + 42, CW - 32, 4, BLACK, 44);
  cv.paragraph(
    'Kuwait intercepts drones as Gulf tensions flare; Bahrain issues all-clear after the overnight warning.',
    M + 16,
    leadY + 132,
    CW - 32,
    2,
    BLACK,
  );

  // ---- Three panels in a row.
  const rowY = 360;
  const rowH = 330;
  const gap = 20;
  const pw = Math.floor((CW - 2 * gap) / 3); // 306
  const px = [M, M + pw + gap, M + 2 * (pw + gap)];

  // Panel 1: Trump in Manila.
  cv.border(px[0], rowY, pw, rowH, BLACK, 2);
  cv.text('TRUMP IN MANILA', px[0] + 14, rowY + 14, 2, RED);
  cv.hline(px[0] + 14, rowY + 40, pw - 28, GREY, 1);
  cv.paragraph('TRUMP LANDS IN MANILA FOR QUAD TALKS', px[0] + 14, rowY + 56, pw - 28, 3, BLACK, 34);
  cv.paragraph(
    'Quad leaders meet ahead of a China visit. Modi presses India-ASEAN cooperation at the East Asia Summit.',
    px[0] + 14,
    rowY + 196,
    pw - 28,
    2,
    BLACK,
  );

  // Panel 2: Crimean bridge.
  cv.border(px[1], rowY, pw, rowH, BLACK, 2);
  cv.text('CRIMEAN BRIDGE HIT', px[1] + 14, rowY + 14, 2, RED);
  cv.hline(px[1] + 14, rowY + 40, pw - 28, GREY, 1);
  cv.paragraph('UKRAINE STRIKES CRIMEAN BRIDGE', px[1] + 14, rowY + 56, pw - 28, 3, BLACK, 34);
  cv.paragraph(
    'Russia pounds Kyiv bridges in reply. UN counts at least 372 civilians killed in Ukraine in October.',
    px[1] + 14,
    rowY + 196,
    pw - 28,
    2,
    BLACK,
  );

  // Panel 3: Nvidia + revenue chart.
  cv.border(px[2], rowY, pw, rowH, BLACK, 2);
  cv.text('NVIDIA $115.8B', px[2] + 14, rowY + 14, 2, RED);
  cv.hline(px[2] + 14, rowY + 40, pw - 28, GREY, 1);
  cv.paragraph('NVIDIA POSTS RECORD $115.8B QUARTER', px[2] + 14, rowY + 56, pw - 28, 3, BLACK, 34);
  cv.paragraph(
    'Revenue +103% YoY; data center $107.6B.',
    px[2] + 14,
    rowY + 196,
    pw - 28,
    2,
    BLACK,
  );
  // Bar chart: Q3 a year ago $57.0B, Q3 now $115.8B, Q4 guide $130B.
  const chartY = rowY + 262;
  const chartX = px[2] + 14;
  const chartW = pw - 28;
  const bars: Array<{ label: string; value: number; color: RGB; outline?: boolean; sub: string }> = [
    { label: '57.0', value: 57.0, color: GREY, sub: 'Q3 25' },
    { label: '115.8', value: 115.8, color: RED, sub: 'Q3 26' },
    { label: '130', value: 130.0, color: BLACK, outline: true, sub: 'Q4 GUIDE' },
  ];
  const maxV = 130;
  const barW = 62;
  const barGap = Math.floor((chartW - 3 * barW) / 2);
  const baseY = chartY + 52;
  cv.hline(chartX, baseY, chartW, BLACK, 2);
  bars.forEach((b, i) => {
    const bh = Math.round((b.value / maxV) * 44);
    const bx = chartX + i * (barW + barGap);
    if (b.outline) {
      cv.border(bx, baseY - bh, barW, bh, BLACK, 2);
    } else {
      cv.rect(bx, baseY - bh, barW, bh, b.color);
    }
    cv.text(b.label, bx + Math.round((barW - cv.textWidth(b.label, 1)) / 2), baseY - bh - 14, 1, BLACK);
    cv.text(b.sub, bx + Math.round((barW - cv.textWidth(b.sub, 1)) / 2), baseY + 6, 1, GREY);
  });

  // ---- Also today: ticker strip.
  const tickY = 716;
  cv.text('ALSO TODAY', M, tickY, 2, RED);
  cv.hline(M, tickY + 26, CW, GREY, 1);
  cv.paragraph(
    'Canada-China extend trade deals as Xi meets Carney ahead of APEC. Britain sanctions Israeli settlement firms. US presses UN over Taiwan flights; China hits back.',
    M,
    tickY + 40,
    CW,
    2,
    BLACK,
  );
  cv.paragraph(
    'Latvia confidence vote backs Kulbergs government. Asif Merchant sentenced to 27.5 years. Gaza: WFP one hot meal every two days. Cyclone Akvan intensifying.',
    M,
    tickY + 112,
    CW,
    2,
    BLACK,
  );
  cv.paragraph(
    'Nvidia: first results since Huang resigned; Kress interim CEO. Dhoni retires from IPL, to mentor CSK.',
    M,
    tickY + 168,
    CW,
    2,
    BLACK,
  );

  // ---- Footer.
  cv.hline(M, 960, CW, BLACK, 3);
  cv.centered('WEDNESDAY 18 NOVEMBER 2026 - THE DAY IN ONE IMAGE', 974, 2, BLACK);

  return encodePng(cv.pixels);
}

function main(): void {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(`${OUTPUT_DIR}/entry.png`, drawFrontPage());
}

main();
