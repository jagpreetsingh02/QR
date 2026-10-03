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

/** A cartoon face on a blue ground: big flat shapes, like a typical avatar photo (synthetic). */
export function writeFacePhoto(file, size = 800) {
  return writePng(file, size, size, (x, y) => {
    const u = x / size - 0.5;
    const v = y / size - 0.5;
    const face = Math.hypot(u, v * 1.08);
    const eye = Math.min(Math.hypot(u + 0.13, v + 0.08), Math.hypot(u - 0.13, v + 0.08));
    const smile = Math.abs(Math.hypot(u, v - 0.02) - 0.2) < 0.025 && v > 0.08;
    if (face > 0.38) return [clamp(40 + 60 * (v + 0.5)), clamp(110 + 50 * (v + 0.5)), 220];
    if (eye < 0.045) return [25, 25, 35];
    if (eye < 0.075) return [250, 250, 250];
    if (smile) return [140, 40, 40];
    return [clamp(250 - 80 * face), clamp(200 - 90 * face), clamp(120 - 60 * face)];
  });
}

/** Bold diagonal colour bands: saturated, high-contrast regions (synthetic). */
export function writeBandsPhoto(file, size = 800) {
  const palette = [[234, 67, 53], [251, 188, 4], [52, 168, 83], [66, 133, 244], [30, 30, 40], [245, 245, 245]];
  return writePng(file, size, size, (x, y) => palette[Math.floor((x + y) / (size / 3)) % palette.length]);
}

/** A tiny valid PNG padded with a private ancillary chunk to exactly `bytes` long (decoders skip the chunk). */
export function writePaddedPng(file, bytes) {
  writePng(file, 64, 64, (x, y) => [clamp(90 + x * 2), clamp(140 + y), 200]);
  const png = fs.readFileSync(file);
  const iend = png.length - 12;
  const pad = bytes - png.length - 12;
  const len = Buffer.alloc(4);
  len.writeUInt32BE(pad);
  const body = Buffer.concat([Buffer.from('paDd'), Buffer.alloc(pad)]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(body) >>> 0);
  fs.writeFileSync(file, Buffer.concat([png.subarray(0, iend), len, body, crc, png.subarray(iend)]));
  return file;
}

/** A hard 8 px checkerboard: the worst case for a photo QR (synthetic). */
export function writeBusyPhoto(file, size = 700) {
  return writePng(file, size, size, (x, y) => (((x >> 3) + (y >> 3)) % 2 ? [15, 15, 20] : [240, 240, 235]));
}
