// Real QR geometry for Figma frames, from the same `qrcode` engine the app uses.
import QRCode from 'qrcode';
export function qrSvg(text, { size = 200, margin = 2, fg = '#141927', bg = '#FFFFFF', ecc = 'M' } = {}) {
  const m = QRCode.create(text, { errorCorrectionLevel: ecc }).modules;
  const cells = m.size + margin * 2;
  const edge = (i) => Math.round((i * size) / cells);
  let d = '';
  for (let r = 0; r < m.size; r++) for (let c = 0; c < m.size; c++) {
    if (!m.get(r, c)) continue;
    const x = edge(c + margin), y = edge(r + margin);
    d += `M${x} ${y}h${edge(c + margin + 1) - x}v${edge(r + margin + 1) - y}h${x - edge(c + margin + 1)}z`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${bg}"/><path fill="${fg}" d="${d}"/></svg>`;
}
