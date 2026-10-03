// Synthetic test images, generated so the repo ships no binary fixtures.
import fs from 'node:fs';
import zlib from 'node:zlib';

/** Writes an RGB PNG where `pixel(x, y)` returns [r, g, b]. */
export function writePng(file, width, height, pixel) {
  const stride = width * 3 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) raw.set(pixel(x, y), y * stride + 1 + x * 3);
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
  return file;
}

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

/** A soft, photo-like scene: sky gradient, a warm sun and green hills (synthetic). */
export function writeTestPhoto(file, width = 900, height = 600) {
  return writePng(file, width, height, (x, y) => {
    const u = x / width;
    const v = y / height;
    const hill = 0.62 + 0.08 * Math.sin(u * 7.5) + 0.05 * Math.cos(u * 15 + 1);
    const sun = Math.max(0, 1 - Math.hypot(u - 0.72, v - 0.28) / 0.16);
    if (v > hill) return [clamp(40 + 40 * u), clamp(120 + 60 * (1 - v)), clamp(60 + 30 * u)];
    return [clamp(66 + 120 * v + 190 * sun), clamp(133 + 70 * v + 150 * sun), clamp(244 - 60 * v + 20 * sun)];
  });
}

/** Random noise barely compresses, so this PNG is reliably over 2 MB. */
export function writeOversizePhoto(file) {
  return writePng(file, 1100, 900, () => [(Math.random() * 256) | 0, (Math.random() * 256) | 0, (Math.random() * 256) | 0]);
}
