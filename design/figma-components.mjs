// Prints the use_figma script that builds the component library on the
// Components page, bound to the Theme/Light, Size variables and text styles.
import { qrSvg } from './qr-svg.mjs';

const presets = [
  ['Classic', '#111827', '#ffffff'], ['Midnight', '#f8fafc', '#0b1120'], ['Campus', '#174ea6', '#e8f0fe'],
  ['Forest', '#14532d', '#ecfdf5'], ['Sunset', '#7c2d12', '#fff7ed'], ['Grape', '#4c1d95', '#f5f3ff'],
  ['Crimson', '#9f1239', '#fff1f2'], ['Blueprint', '#e0f2fe', '#0c4a6e'],
];
const svg = qrSvg('https://gdg.community.dev', { size: 64, margin: 1 });

const script = `
const PRESETS = ${JSON.stringify(presets)};
const QR_SVG = ${JSON.stringify(svg)};
const out = { sets: {}, created: [] };
const page = figma.root.children.find((p) => p.name === 'Components');
await figma.setCurrentPageAsync(page);
for (const n of [...page.children]) n.remove();

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const L = cols.find((c) => c.name === 'Theme/Light') || cols.find((c) => c.name === 'Theme');
const S = cols.find((c) => c.name === 'Size');
const V = (prefix, col, n) => { const v = vars.find((x) => x.name === prefix + n && x.variableCollectionId === col.id); if (!v) throw new Error('missing var ' + prefix + n); return v; };
const C = (n) => V('color/', L, n);
const RAD = (n) => V('radius/', S, n);
const SP = (n) => V('space/', S, n);
const textStyles = await figma.getLocalTextStylesAsync();
const TS = (n) => textStyles.find((s) => s.name === n);
await Promise.all([...new Set(textStyles.map((s) => JSON.stringify(s.fontName)))].map((f) => figma.loadFontAsync(JSON.parse(f))));
const fx = await figma.getLocalEffectStylesAsync();
const FX = (n) => fx.find((e) => e.name === n);

const paint = (n) => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', C(n));
const fill = (node, n) => { node.fills = n ? [paint(n)] : []; return node; };
const stroke = (node, n, w = 1) => { node.strokes = [paint(n)]; node.strokeWeight = w; node.strokeAlign = 'INSIDE'; return node; };
const radius = (node, n) => { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) node.setBoundVariable(k, RAD(n)); return node; };
const pad = (node, y, x) => { node.setBoundVariable('paddingTop', SP(y)); node.setBoundVariable('paddingBottom', SP(y)); node.setBoundVariable('paddingLeft', SP(x)); node.setBoundVariable('paddingRight', SP(x)); return node; };
const gap = (node, n) => { node.setBoundVariable('itemSpacing', SP(n)); return node; };
const text = async (chars, style, color) => { const t = figma.createText(); await t.setTextStyleIdAsync(TS(style).id); t.characters = chars; fill(t, color); return t; };
const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 }; };
const auto = (dir, props) => figma.createAutoLayout(dir, props);
function comp(name, build) { const c = figma.createComponent(); c.name = name; c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'; c.fills = []; return c; }
async function variants(setName, defs, description) {
  const comps = [];
  for (const [props, build] of defs) { const c = figma.createComponent(); c.name = props; c.fills = []; await build(c); comps.push(c); }
  const set = figma.combineAsVariants(comps, page);
  set.name = setName; set.description = description || '';
  set.layoutMode = 'HORIZONTAL'; set.layoutWrap = 'WRAP'; set.itemSpacing = 24; set.counterAxisSpacing = 24;
  set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 24; set.primaryAxisSizingMode = 'AUTO'; set.counterAxisSizingMode = 'AUTO';
  set.counterAxisAlignItems = 'CENTER';
  set.fills = []; stroke(set, 'border'); set.cornerRadius = 20; set.dashPattern = [6, 4];
  out.sets[setName] = comps.length;
  return set;
}
const asRow = (c, y = '3', x = '5') => { c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'; c.counterAxisAlignItems = 'CENTER'; pad(c, y, x); gap(c, '2'); return c; };
const asCol = (c) => { c.layoutMode = 'VERTICAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'; gap(c, '2'); return c; };

// ---- Logo mark: three rounded finder squares + one module, in the GDG colours (our own mark)
const logo = figma.createComponent(); logo.name = 'Logo / Mark'; logo.resize(40, 40); logo.fills = [];
const finder = (x, y, col) => { const o = figma.createRectangle(); o.resize(17, 17); o.x = x; o.y = y; o.cornerRadius = 6; o.fills = []; stroke(o, col, 4); logo.appendChild(o); const i = figma.createRectangle(); i.resize(5, 5); i.x = x + 6; i.y = y + 6; i.cornerRadius = 1.5; fill(i, col); logo.appendChild(i); };
finder(0, 0, 'brand-blue'); finder(23, 0, 'brand-red'); finder(0, 23, 'brand-yellow');
const dot = figma.createEllipse(); dot.resize(11, 11); dot.x = 26; dot.y = 26; fill(dot, 'brand-green'); logo.appendChild(dot);
logo.description = 'QR Studio mark: three QR finder patterns + one module in the GDG colours. Not the GDG logo.';

const wordmark = figma.createComponent(); wordmark.name = 'Logo / Wordmark'; asRow(wordmark, '0-5', '0-5'); gap(wordmark, '3');
wordmark.appendChild(logo.createInstance());
const wmText = auto('VERTICAL', { name: 'text', itemSpacing: 0 }); wmText.fills = [];
wmText.appendChild(await text('QR Studio', 'title/m', 'text'));
wmText.appendChild(await text('Built for GDG on Campus SRM', 'body/s', 'text-muted'));
wordmark.appendChild(wmText);

// ---- Button
const btn = (variant, state, label) => async (c) => {
  asRow(c, '3', '6'); radius(c, 'full');
  const fg = variant === 'Primary' ? 'on-primary' : variant === 'Secondary' ? 'text' : 'primary';
  if (variant === 'Primary') fill(c, state === 'Hover' ? 'primary-hover' : 'primary');
  if (variant === 'Secondary') { fill(c, state === 'Hover' ? 'surface-inset' : 'surface'); stroke(c, 'border-strong'); }
  if (variant === 'Ghost') fill(c, state === 'Hover' ? 'primary-soft' : null);
  const icon = figma.createEllipse(); icon.resize(16, 16); icon.name = 'icon'; icon.fills = []; stroke(icon, fg, 2); c.appendChild(icon);
  c.appendChild(await text(label, 'label', fg));
  if (state === 'Disabled') c.opacity = 0.45;
};
const buttons = await variants('Button', [
  ...['Primary', 'Secondary', 'Ghost'].flatMap((v) => ['Default', 'Hover', 'Disabled'].map((s) => ['Variant=' + v + ', State=' + s, btn(v, s, v === 'Primary' ? 'Download PNG' : v === 'Secondary' ? 'Download SVG' : 'Copy image')])),
], 'Pill buttons. Primary = one per view. CSS: .btn, .btn--primary/secondary/ghost');

// ---- Input
const input = (state) => async (c) => {
  asCol(c); c.resize(320, 40); c.counterAxisSizingMode = 'FIXED'; c.primaryAxisSizingMode = 'AUTO';
  c.appendChild(await text('Website URL', 'label', 'text-muted'));
  const f = auto('HORIZONTAL', { name: 'field' }); pad(f, '3', '4'); radius(f, 'md'); f.counterAxisAlignItems = 'CENTER';
  fill(f, state === 'Error' ? 'danger-soft' : 'surface'); stroke(f, state === 'Focus' ? 'focus' : state === 'Error' ? 'danger' : state === 'Success' ? 'success' : 'border-strong', state === 'Default' ? 1 : 2);
  c.appendChild(f); f.layoutSizingHorizontal = 'FILL';
  const v = await text(state === 'Error' ? 'gdg community' : 'gdg.community.dev/gdg-on-campus-srm', 'body/m', 'text'); f.appendChild(v);
  const msg = state === 'Error' ? ['A URL cannot contain spaces.', 'danger'] : state === 'Success' ? ['Encodes as https://gdg.community.dev/…', 'success'] : ['https:// is added if you leave it out.', 'text-subtle'];
  c.appendChild(await text(msg[0], 'body/s', msg[1]));
};
const inputs = await variants('Input', ['Default', 'Focus', 'Error', 'Success'].map((s) => ['State=' + s, input(s)]), 'Label above, message below; error and success animate in without layout shift.');

// ---- Segmented control (ECC)
const seg = figma.createComponent(); seg.name = 'Segmented / ECC'; asRow(seg, '1', '1'); gap(seg, '1'); radius(seg, 'full'); fill(seg, 'surface-inset'); stroke(seg, 'border');
for (const [k, label, sel] of [['L', '7%', false], ['M', '15%', true], ['Q', '25%', false], ['H', '30%', false]]) {
  const o = auto('VERTICAL', { name: k, counterAxisAlignItems: 'CENTER', itemSpacing: 0 }); pad(o, '2', '5'); radius(o, 'full'); fill(o, sel ? 'surface' : null);
  if (sel) await o.setEffectStyleIdAsync(FX('elevation/1').id);
  o.appendChild(await text(k, 'label', sel ? 'primary' : 'text-muted'));
  o.appendChild(await text(label, 'mono', sel ? 'text' : 'text-subtle'));
  seg.appendChild(o);
}
seg.description = 'Radio group with arrow-key navigation; each level shows its recovery %.';

// ---- Type tile
const TYPES = [['URL', 'brand-blue'], ['Text', 'text'], ['Email', 'brand-red'], ['Phone', 'brand-green'], ['Wi-Fi', 'brand-yellow']];
const tile = (sel) => async (c) => {
  c.layoutMode = 'VERTICAL'; c.resize(104, 40); c.counterAxisSizingMode = 'FIXED'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisAlignItems = 'CENTER'; pad(c, '4', '3'); gap(c, '2'); radius(c, 'lg');
  fill(c, sel ? 'primary-soft' : 'surface'); stroke(c, sel ? 'primary' : 'border', sel ? 2 : 1);
  const chip = figma.createRectangle(); chip.resize(28, 28); chip.cornerRadius = 9; chip.name = 'icon chip'; fill(chip, 'brand-blue'); c.appendChild(chip);
  c.appendChild(await text('URL', 'label', sel ? 'on-primary-soft' : 'text'));
};
const tiles = await variants('Type tile', [['State=Selected', tile(true)], ['State=Default', tile(false)]], 'Each type owns a GDG colour chip (URL blue, Email red, Phone green, Wi-Fi yellow, Text ink). Selected tile uses a shared-layout indicator.');

// ---- Preset swatch (renders the actual code in the preset colours)
const qrBase = figma.createNodeFromSvg(QR_SVG);
const swatches = [];
for (const [name, fg, bg] of PRESETS) {
  const c = figma.createComponent(); c.name = 'Preset / ' + name; c.layoutMode = 'VERTICAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'; c.counterAxisAlignItems = 'CENTER'; pad(c, '2', '2'); gap(c, '2'); radius(c, 'lg'); fill(c, 'surface'); stroke(c, name === 'Classic' ? 'primary' : 'border', name === 'Classic' ? 2 : 1);
  const q = qrBase.clone(); q.name = 'code';
  const shapes = q.findAll((n) => n.type !== 'FRAME' && 'fills' in n);
  shapes.forEach((s, i) => { s.fills = [{ type: 'SOLID', color: hexRgb(i === 0 ? bg : fg) }]; });
  q.cornerRadius = 8; q.clipsContent = true;
  c.appendChild(q);
  c.appendChild(await text(name, 'label', 'text'));
  swatches.push(c);
}
qrBase.remove();
const presetSet = figma.combineAsVariants(swatches, page); presetSet.name = 'Preset swatch'; presetSet.layoutMode = 'HORIZONTAL'; presetSet.itemSpacing = 12; presetSet.paddingTop = presetSet.paddingBottom = presetSet.paddingLeft = presetSet.paddingRight = 24; presetSet.primaryAxisSizingMode = 'AUTO'; presetSet.counterAxisSizingMode = 'AUTO'; presetSet.fills = []; stroke(presetSet, 'border'); presetSet.dashPattern = [6, 4]; presetSet.cornerRadius = 20;
presetSet.description = 'Swatches preview the real code in each preset, not two dots.'; out.sets['Preset swatch'] = swatches.length;

// ---- Slider
const slider = figma.createComponent(); slider.name = 'Slider'; asCol(slider); slider.resize(320, 40); slider.counterAxisSizingMode = 'FIXED'; slider.primaryAxisSizingMode = 'AUTO';
const sh = auto('HORIZONTAL', { name: 'head', primaryAxisAlignItems: 'SPACE_BETWEEN', counterAxisAlignItems: 'CENTER' }); sh.fills = []; slider.appendChild(sh); sh.layoutSizingHorizontal = 'FILL';
sh.appendChild(await text('Size', 'label', 'text-muted'));
const val = auto('HORIZONTAL', { name: 'value' }); pad(val, '0-5', '2'); radius(val, 'full'); fill(val, 'surface-inset'); val.appendChild(await text('512 px', 'mono', 'text')); sh.appendChild(val);
const track = figma.createFrame(); track.name = 'track'; track.resize(320, 6); radius(track, 'full'); fill(track, 'surface-inset'); stroke(track, 'border');
const fillBar = figma.createRectangle(); fillBar.resize(128, 6); fillBar.cornerRadius = 3; fill(fillBar, 'primary'); track.appendChild(fillBar);
const thumb = figma.createEllipse(); thumb.resize(20, 20); thumb.x = 118; thumb.y = -7; fill(thumb, 'surface'); stroke(thumb, 'primary', 3); track.appendChild(thumb); track.clipsContent = false;
slider.appendChild(track); track.layoutSizingHorizontal = 'FILL';

// ---- Switch
const sw = (on) => async (c) => {
  c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'; c.counterAxisAlignItems = 'CENTER'; gap(c, '3'); c.fills = [];
  c.appendChild(await text('Hidden network', 'body/m', 'text'));
  const t = figma.createFrame(); t.name = 'track'; t.resize(44, 26); radius(t, 'full'); fill(t, on ? 'primary' : 'border-strong');
  const k = figma.createEllipse(); k.resize(20, 20); k.x = on ? 21 : 3; k.y = 3; fill(k, 'surface'); t.appendChild(k); c.appendChild(t);
};
const switches = await variants('Switch', [['State=On', sw(true)], ['State=Off', sw(false)]]);

// ---- Callout / advisor
const TONES = { Info: ['primary-soft', 'on-primary-soft', 'Light modules on a dark background are inverted; older scanners may struggle.'], Warning: ['warning-soft', 'warning', 'Contrast is 3.2:1. Aim for at least 4.5:1 so it scans in poor light.'], Danger: ['danger-soft', 'danger', 'Too similar (1.5:1). Most scanners will not read this code.'], Success: ['success-soft', 'success', 'Scans reliably: 17.7:1 contrast, 4-module quiet zone.'] };
const callout = (tone) => async (c) => {
  c.layoutMode = 'HORIZONTAL'; c.resize(360, 40); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; c.counterAxisAlignItems = 'MIN'; pad(c, '3', '4'); gap(c, '3'); radius(c, 'md');
  const [bg, fg, msg] = TONES[tone]; fill(c, bg);
  const ic = figma.createEllipse(); ic.resize(18, 18); ic.name = 'icon'; ic.fills = []; stroke(ic, fg, 2); c.appendChild(ic);
  const t = await text(msg, 'body/s', fg); c.appendChild(t); t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT';
};
const callouts = await variants('Advisor callout', Object.keys(TONES).map((t) => ['Tone=' + t, callout(t)]), 'Severity by colour AND icon AND wording; no coloured side borders.');

// ---- Toast
const toast = figma.createComponent(); toast.name = 'Toast'; asRow(toast, '3', '5'); radius(toast, 'full'); fill(toast, 'text'); await toast.setEffectStyleIdAsync(FX('elevation/3').id);
const tdot = figma.createEllipse(); tdot.resize(10, 10); fill(tdot, 'brand-green'); toast.appendChild(tdot);
toast.appendChild(await text('Saved qr-url-gdg-community-dev.png', 'label', 'text-inverse'));
const undo = await text('Undo', 'label', 'brand-yellow'); toast.appendChild(undo);

// ---- History item
const hist = figma.createComponent(); hist.name = 'History item'; hist.layoutMode = 'VERTICAL'; hist.resize(168, 40); hist.counterAxisSizingMode = 'FIXED'; hist.primaryAxisSizingMode = 'AUTO'; pad(hist, '2', '2'); gap(hist, '2'); radius(hist, 'lg'); fill(hist, 'surface'); stroke(hist, 'border');
const hq = figma.createNodeFromSvg(${JSON.stringify(qrSvg('WIFI:T:WPA;S:GDG-Campus;P:buildwithgdg;;', { size: 152, margin: 2 }))}); hq.name = 'thumb'; hq.cornerRadius = 10; hq.clipsContent = true; hist.appendChild(hq);
hist.appendChild(await text('GDG-Campus', 'label', 'text'));
const meta = auto('HORIZONTAL', { name: 'meta', itemSpacing: 6, counterAxisAlignItems: 'CENTER' }); meta.fills = [];
const badge = auto('HORIZONTAL', { name: 'badge' }); pad(badge, '0-5', '2'); radius(badge, 'full'); fill(badge, 'brand-yellow'); badge.appendChild(await text('WI-FI', 'label', 'on-brand'));
meta.appendChild(badge); meta.appendChild(await text('2 min ago', 'body/s', 'text-subtle')); hist.appendChild(meta);

// ---- Nav
const nav = figma.createComponent(); nav.name = 'Nav'; nav.layoutMode = 'HORIZONTAL'; nav.resize(1312, 40); nav.primaryAxisSizingMode = 'FIXED'; nav.counterAxisSizingMode = 'AUTO'; nav.primaryAxisAlignItems = 'SPACE_BETWEEN'; nav.counterAxisAlignItems = 'CENTER'; pad(nav, '3', '6'); radius(nav, 'full'); fill(nav, 'surface'); stroke(nav, 'border'); await nav.setEffectStyleIdAsync(FX('elevation/2').id);
nav.appendChild(wordmark.createInstance());
const links = auto('HORIZONTAL', { name: 'links', itemSpacing: 28 }); links.fills = [];
for (const l of ['Types', 'Design', 'Scan check', 'Privacy', 'FAQ']) links.appendChild(await text(l, 'label', 'text-muted'));
nav.appendChild(links);
const navR = auto('HORIZONTAL', { name: 'actions', itemSpacing: 12, counterAxisAlignItems: 'CENTER' }); navR.fills = [];
const themeBtn = figma.createEllipse(); themeBtn.resize(40, 40); themeBtn.name = 'theme toggle'; fill(themeBtn, 'surface-inset'); stroke(themeBtn, 'border'); navR.appendChild(themeBtn);
const openBtn = buttons.children.find((n) => n.name === 'Variant=Primary, State=Default').createInstance(); navR.appendChild(openBtn);
const openLabel = openBtn.findOne((n) => n.type === 'TEXT'); openLabel.characters = 'Open Studio';
nav.appendChild(navR);

// ---- Lay everything out on a labelled board
const board = auto('VERTICAL', { name: 'Components', itemSpacing: 48 }); pad(board, '16', '16'); fill(board, 'bg');
board.appendChild(await text('Components', 'display/l', 'text'));
const sections = [
  ['Brand', [logo, wordmark, nav]],
  ['Actions', [buttons, toast]],
  ['Inputs', [inputs, seg, slider, switches]],
  ['Choosers', [tiles, presetSet]],
  ['Feedback & history', [callouts, hist]],
];
for (const [title, nodes] of sections) {
  const sec = auto('VERTICAL', { name: title, itemSpacing: 20 }); sec.fills = [];
  sec.appendChild(await text(title, 'title/l', 'text'));
  const row = auto('HORIZONTAL', { name: title + ' row', itemSpacing: 32, counterAxisAlignItems: 'MIN', layoutWrap: 'WRAP' }); row.fills = [];
  for (const n of nodes) row.appendChild(n);
  sec.appendChild(row); board.appendChild(sec);
}
board.x = 0; board.y = 0;
out.created.push(board.id);
out.size = [Math.round(board.width), Math.round(board.height)];
await board.screenshot({ scale: 0.5 });
return out;
`;
process.stdout.write(script);
