// Generates PWA icons (solid violet background + white "vapor bubble" motif) as PNGs.
// Pure Node (zlib), no native deps. Run: node scripts/gen-icons.mjs
import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

const OUT = path.resolve(process.cwd(), "public/icons");
mkdirSync(OUT, { recursive: true });

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10,11,12 = 0 (compression, filter, interlace)
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function makeIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.3;
  const rInner = size * 0.15;
  // violet background, white bubble with a violet core (ring effect)
  const bg = [139, 92, 246];
  const white = [255, 255, 255];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      let col = bg;
      // anti-aliased white ring
      const inWhite = smoothBand(d, rOuter, 1.5);
      const inCore = smoothBand(d, rInner, 1.5);
      const whiteAmount = inWhite * (1 - inCore);
      col = [
        Math.round(bg[0] * (1 - whiteAmount) + white[0] * whiteAmount),
        Math.round(bg[1] * (1 - whiteAmount) + white[1] * whiteAmount),
        Math.round(bg[2] * (1 - whiteAmount) + white[2] * whiteAmount),
      ];
      buf[i] = col[0];
      buf[i + 1] = col[1];
      buf[i + 2] = col[2];
      buf[i + 3] = 255;
    }
  }
  return encodePng(size, buf);
}

// returns 1 inside radius, 0 outside, smooth over `edge` px
function smoothBand(d, radius, edge) {
  if (d <= radius - edge) return 1;
  if (d >= radius + edge) return 0;
  return 1 - (d - (radius - edge)) / (2 * edge);
}

writeFileSync(path.join(OUT, "icon-192.png"), makeIcon(192));
writeFileSync(path.join(OUT, "icon-512.png"), makeIcon(512));
writeFileSync(path.join(OUT, "icon-maskable-512.png"), makeIcon(512));
console.log("✅ icons written to public/icons/");
