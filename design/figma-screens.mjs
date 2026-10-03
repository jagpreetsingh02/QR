// Prints the use_figma script that composes the key screens from the library.

const script = `
const out = { frames: [], errors: [] };
// Collect library references from the Components page first, then switch pages.
const compPage = figma.root.children.find((p) => p.name === 'Components');
await figma.setCurrentPageAsync(compPage);
const lib = {};
for (const n of compPage.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })) if (!(n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET')) lib[n.name] = n;
const libNames = Object.keys(lib);
const findC = (name) => { const c = lib[name]; if (!c) throw new Error('no component "' + name + '" in [' + libNames.join(', ') + ']'); return c; };
const variant = (set, props) => {
  const kids = findC(set).children;
  const want = props.split(',').map((x) => x.split('=').pop().trim().replace('Preset / ', ''));
  const hit = kids.find((c) => c.name === props) || kids.find((c) => want.every((w) => c.name.includes(w)));
  if (!hit) throw new Error('no variant "' + props + '" in ' + set + ': [' + kids.map((k) => k.name).join(' | ') + ']');
  return hit;
};
const inst = (name, props) => (props ? variant(name, props) : findC(name)).createInstance();

const screens = figma.root.children.find((p) => p.name === 'Screens');
await figma.setCurrentPageAsync(screens);
for (const n of [...screens.children]) n.remove();

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const L = cols.find((c) => c.name === 'Theme/Light');
const S = cols.find((c) => c.name === 'Size');
const V = (p, col, n) => vars.find((x) => x.name === p + n && x.variableCollectionId === col.id);
const C = (n) => V('color/', L, n);
const textStyles = await figma.getLocalTextStylesAsync();
const TS = (n) => textStyles.find((s) => s.name === n);
await Promise.all([...new Set(textStyles.map((s) => JSON.stringify(s.fontName)))].map((f) => figma.loadFontAsync(JSON.parse(f))));
const fx = await figma.getLocalEffectStylesAsync();
const FX = (n) => fx.find((e) => e.name === n);
const paint = (n) => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', C(n));
const fill = (node, n) => { node.fills = n ? [paint(n)] : []; return node; };
const stroke = (node, n, w = 1) => { node.strokes = [paint(n)]; node.strokeWeight = w; node.strokeAlign = 'INSIDE'; return node; };
const text = async (chars, style, color, width) => { const t = figma.createText(); await t.setTextStyleIdAsync(TS(style).id); t.characters = chars; fill(t, color); if (width) { t.resize(width, t.height); t.textAutoResize = 'HEIGHT'; } return t; };
const auto = (dir, props = {}) => { const f = figma.createAutoLayout(dir, props); f.fills = []; return f; };
const setLabel = (instance, chars) => { const t = instance.findOne((n) => n.type === 'TEXT'); if (t) t.characters = chars; return instance; };

function qrPlate(size) {
  const plate = auto('VERTICAL', { name: 'code plate', paddingTop: 20, paddingBottom: 20, paddingLeft: 20, paddingRight: 20 });
  fill(plate, 'surface'); plate.cornerRadius = 28;
  const src = variant('Preset swatch', 'Preset / Classic').findOne((n) => n.name === 'code');
  const q = src.clone(); q.name = 'live code'; q.rescale(size / q.width); q.cornerRadius = 0; plate.appendChild(q);
  return plate;
}
async function heroStage(w, h, codeSize) {
  const stage = figma.createFrame(); stage.name = 'Hero stage'; stage.resize(w, h); stage.fills = []; stage.clipsContent = false;
  const blob = figma.createRectangle(); blob.name = 'blue squircle'; blob.resize(w * 0.86, h * 0.86); blob.x = w * 0.07; blob.y = h * 0.07; blob.cornerRadius = Math.round(w * 0.14); fill(blob, 'brand-blue'); stage.appendChild(blob);
  const ring = figma.createRectangle(); ring.name = 'red finder ring'; ring.resize(w * 0.2, w * 0.2); ring.x = w * 0.78; ring.y = h * 0.02; ring.cornerRadius = Math.round(w * 0.06); ring.fills = []; stroke(ring, 'brand-red', Math.max(10, Math.round(w * 0.035))); ring.rotation = -12; stage.appendChild(ring);
  const pill = figma.createRectangle(); pill.name = 'yellow pill'; pill.resize(w * 0.34, w * 0.11); pill.x = -w * 0.02; pill.y = h * 0.8; pill.cornerRadius = 999; fill(pill, 'brand-yellow'); pill.rotation = 8; stage.appendChild(pill);
  const dot = figma.createEllipse(); dot.name = 'green module'; dot.resize(w * 0.12, w * 0.12); dot.x = w * 0.86; dot.y = h * 0.78; fill(dot, 'brand-green'); stage.appendChild(dot);
  const plate = qrPlate(codeSize); stage.appendChild(plate); await plate.setEffectStyleIdAsync(FX('elevation/3').id);
  plate.x = (w - plate.width) / 2; plate.y = (h - plate.height) / 2 - h * 0.03;
  const scan = figma.createRectangle(); scan.name = 'scan line'; scan.resize(plate.width - 24, 3); scan.x = plate.x + 12; scan.y = plate.y + plate.height * 0.42; scan.cornerRadius = 2; fill(scan, 'brand-green'); scan.opacity = 0.8; stage.appendChild(scan);
  const tag = auto('HORIZONTAL', { name: 'payload tag', paddingTop: 10, paddingBottom: 10, paddingLeft: 14, paddingRight: 14, itemSpacing: 8, counterAxisAlignItems: 'CENTER' }); fill(tag, 'text'); tag.cornerRadius = 999;
  tag.appendChild(await text('WIFI:T:WPA;S:GDG-Campus;P:••••••;;', 'mono', 'text-inverse')); stage.appendChild(tag); tag.x = w * 0.08; tag.y = h * 0.08; await tag.setEffectStyleIdAsync(FX('elevation/2').id);
  return stage;
}
async function heroCopy(width, align) {
  const col = auto('VERTICAL', { name: 'Hero copy', itemSpacing: 24 });
  col.counterAxisAlignItems = align;
  col.appendChild(await text('QR codes that actually scan.', 'display/xl', 'text', width));
  col.appendChild(await text('Design a code for your poster, Wi-Fi or resume in seconds. Every payload is encoded to spec, every design is checked before it fails, and nothing ever leaves your device.', 'body/l', 'text-muted', Math.min(width, 560)));
  const ctas = auto('HORIZONTAL', { name: 'CTAs', itemSpacing: 12 });
  ctas.appendChild(setLabel(inst('Button', 'Variant=Primary, State=Default'), 'Create a QR code'));
  ctas.appendChild(setLabel(inst('Button', 'Variant=Secondary, State=Default'), 'See how it scans'));
  col.appendChild(ctas);
  return col;
}
async function trustStrip(width) {
  const row = auto('HORIZONTAL', { name: 'Trust strip', itemSpacing: 0 });
  row.resize(width, 40); row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'AUTO'; row.layoutWrap = 'WRAP'; row.counterAxisSpacing = 12;
  const facts = ['5 QR types', 'PNG + SVG', 'No sign-up', 'No server', 'Works offline'];
  for (const [i, f] of facts.entries()) {
    const cell = auto('HORIZONTAL', { name: f, itemSpacing: 10, paddingLeft: i ? 20 : 0, paddingRight: 20, counterAxisAlignItems: 'CENTER' });
    const d = figma.createEllipse(); d.resize(8, 8); fill(d, ['brand-blue', 'brand-red', 'brand-yellow', 'brand-green', 'brand-blue'][i]); cell.appendChild(d);
    cell.appendChild(await text(f, 'title/m', 'text'));
    row.appendChild(cell);
  }
  return row;
}
function page(name, w, h) { const f = figma.createFrame(); f.name = name; f.resize(w, h); fill(f, 'bg'); f.clipsContent = true; return f; }

let cursorX = 0;
const place = (f) => { f.x = cursorX; f.y = 0; cursorX += f.width + 160; out.frames.push({ name: f.name, id: f.id, size: [f.width, Math.round(f.height)] }); };

// ---------- Landing desktop 1440 ----------
try {
  const f = page('Landing / Desktop 1440', 1440, 1100);
  const nav = inst('Nav'); f.appendChild(nav); nav.x = 64; nav.y = 24;
  const copy = await heroCopy(620, 'MIN'); f.appendChild(copy); copy.x = 96; copy.y = 210;
  const stage = await heroStage(560, 560, 300); f.appendChild(stage); stage.x = 780; stage.y = 150;
  const strip = await trustStrip(1248); f.appendChild(strip); strip.x = 96; strip.y = 860;
  const rule = figma.createRectangle(); rule.resize(1248, 1); fill(rule, 'border'); f.appendChild(rule); rule.x = 96; rule.y = 830;
  place(f);
} catch (e) { out.errors.push('desktop: ' + e.message); }

// ---------- Landing tablet 834 ----------
try {
  const f = page('Landing / Tablet 834', 834, 1460);
  const nav = inst('Nav'); f.appendChild(nav); nav.resize(770, nav.height); nav.x = 32; nav.y = 20;
  const links = nav.findOne((n) => n.name === 'links'); if (links) links.visible = false;
  const copy = await heroCopy(680, 'MIN'); f.appendChild(copy); copy.x = 64; copy.y = 150;
  const stage = await heroStage(560, 520, 280); f.appendChild(stage); stage.x = 137; stage.y = 640;
  const strip = await trustStrip(706); f.appendChild(strip); strip.x = 64; strip.y = 1250;
  place(f);
} catch (e) { out.errors.push('tablet: ' + e.message); }

// ---------- Landing mobile 375 ----------
try {
  const f = page('Landing / Mobile 375', 375, 1240);
  const bar = auto('HORIZONTAL', { name: 'Mobile nav', primaryAxisAlignItems: 'SPACE_BETWEEN', counterAxisAlignItems: 'CENTER', paddingLeft: 16, paddingRight: 8, paddingTop: 8, paddingBottom: 8 });
  fill(bar, 'surface'); stroke(bar, 'border'); bar.cornerRadius = 999; bar.resize(343, 56); bar.primaryAxisSizingMode = 'FIXED';
  bar.appendChild(inst('Logo / Mark'));
  bar.appendChild(setLabel(inst('Button', 'Variant=Primary, State=Default'), 'Open Studio'));
  f.appendChild(bar); bar.x = 16; bar.y = 12;
  const copy = await heroCopy(335, 'MIN'); f.appendChild(copy); copy.x = 20; copy.y = 104;
  const stage = await heroStage(335, 335, 190); f.appendChild(stage); stage.x = 20; stage.y = 560;
  const strip = await trustStrip(335); f.appendChild(strip); strip.x = 20; strip.y = 940;
  place(f);
} catch (e) { out.errors.push('mobile: ' + e.message); }

// ---------- Studio desktop 1440 ----------
try {
  const f = page('Studio / Desktop 1440', 1440, 960);
  fill(f, 'bg-sunken');
  const top = auto('HORIZONTAL', { name: 'Top bar', primaryAxisAlignItems: 'SPACE_BETWEEN', counterAxisAlignItems: 'CENTER', paddingLeft: 24, paddingRight: 24 });
  top.resize(1440, 64); top.primaryAxisSizingMode = 'FIXED'; top.counterAxisSizingMode = 'FIXED'; fill(top, 'surface'); stroke(top, 'border');
  top.appendChild(inst('Logo / Wordmark'));
  top.appendChild(await text('⌘ ↵  Download PNG', 'mono', 'text-subtle'));
  f.appendChild(top); top.x = 0; top.y = 0;

  const left = auto('VERTICAL', { name: 'Content panel', itemSpacing: 20, paddingTop: 24, paddingBottom: 24, paddingLeft: 24, paddingRight: 24 });
  left.resize(380, 880); left.primaryAxisSizingMode = 'FIXED'; left.counterAxisSizingMode = 'FIXED'; fill(left, 'surface'); stroke(left, 'border');
  left.appendChild(await text('Content', 'title/l', 'text'));
  const tiles = auto('HORIZONTAL', { name: 'Types', itemSpacing: 8 });
  for (const [i, t] of ['URL', 'Text', 'Email', 'Phone', 'Wi-Fi'].entries()) { const tt = inst('Type tile', i === 0 ? 'State=Selected' : 'State=Default'); setLabel(tt, t); tt.resize(100, tt.height); tiles.appendChild(tt); }
  left.appendChild(tiles); tiles.layoutSizingHorizontal = 'FILL'; tiles.layoutWrap = 'WRAP'; tiles.counterAxisSpacing = 8;
  const inp = inst('Input', 'State=Success'); left.appendChild(inp); inp.layoutSizingHorizontal = 'FILL';
  f.appendChild(left); left.x = 0; left.y = 64;

  const right = auto('VERTICAL', { name: 'Design panel', itemSpacing: 22, paddingTop: 24, paddingBottom: 24, paddingLeft: 24, paddingRight: 24 });
  right.resize(380, 880); right.primaryAxisSizingMode = 'FIXED'; right.counterAxisSizingMode = 'FIXED'; fill(right, 'surface'); stroke(right, 'border');
  right.appendChild(await text('Design', 'title/l', 'text'));
  const presets = auto('HORIZONTAL', { name: 'Presets', itemSpacing: 8 });
  for (const p of ['Classic', 'Midnight', 'Campus', 'Forest', 'Sunset', 'Grape', 'Crimson', 'Blueprint']) presets.appendChild(inst('Preset swatch', 'Preset / ' + p));
  right.appendChild(presets); presets.layoutSizingHorizontal = 'FILL'; presets.layoutWrap = 'WRAP'; presets.counterAxisSpacing = 8;
  const sl = inst('Slider'); right.appendChild(sl); sl.layoutSizingHorizontal = 'FILL';
  right.appendChild(inst('Segmented / ECC'));
  right.appendChild(inst('Switch', 'State=Off'));
  f.appendChild(right); right.x = 1060; right.y = 64;

  const center = auto('VERTICAL', { name: 'Stage column', itemSpacing: 20, counterAxisAlignItems: 'CENTER', paddingTop: 32 });
  center.resize(680, 880); center.primaryAxisSizingMode = 'FIXED'; center.counterAxisSizingMode = 'FIXED';
  const stage = auto('VERTICAL', { name: 'Stage', counterAxisAlignItems: 'CENTER', primaryAxisAlignItems: 'CENTER', paddingTop: 36, paddingBottom: 36 });
  stage.resize(600, 420); stage.primaryAxisSizingMode = 'FIXED'; stage.counterAxisSizingMode = 'FIXED'; fill(stage, 'stage'); stage.cornerRadius = 40;
  const plate = qrPlate(300); stage.appendChild(plate); await plate.setEffectStyleIdAsync(FX('elevation/3').id);
  center.appendChild(stage);
  const exportBar = auto('HORIZONTAL', { name: 'Export bar', itemSpacing: 10, counterAxisAlignItems: 'CENTER' });
  exportBar.appendChild(inst('Button', 'Variant=Primary, State=Default'));
  exportBar.appendChild(inst('Button', 'Variant=Secondary, State=Default'));
  exportBar.appendChild(inst('Button', 'Variant=Ghost, State=Default'));
  center.appendChild(exportBar);
  const adv = inst('Advisor callout', 'Tone=Success'); adv.resize(600, adv.height); center.appendChild(adv);
  const hist = auto('HORIZONTAL', { name: 'Recent codes', itemSpacing: 12 });
  for (let i = 0; i < 3; i++) hist.appendChild(inst('History item'));
  center.appendChild(hist);
  f.appendChild(center); center.x = 380; center.y = 64;
  place(f);
} catch (e) { out.errors.push('studio desktop: ' + e.message); }

// ---------- Studio mobile 375 ----------
try {
  const f = page('Studio / Mobile 375', 375, 812);
  const top = auto('HORIZONTAL', { name: 'Top bar', primaryAxisAlignItems: 'SPACE_BETWEEN', counterAxisAlignItems: 'CENTER', paddingLeft: 16, paddingRight: 16 });
  top.resize(375, 56); top.primaryAxisSizingMode = 'FIXED'; top.counterAxisSizingMode = 'FIXED'; fill(top, 'surface'); stroke(top, 'border');
  top.appendChild(inst('Logo / Mark')); top.appendChild(await text('Studio', 'title/m', 'text'));
  f.appendChild(top);
  const stage = auto('VERTICAL', { name: 'Sticky stage', counterAxisAlignItems: 'CENTER', primaryAxisAlignItems: 'CENTER', paddingTop: 16, paddingBottom: 16 });
  stage.resize(343, 260); stage.primaryAxisSizingMode = 'FIXED'; stage.counterAxisSizingMode = 'FIXED'; fill(stage, 'stage'); stage.cornerRadius = 28;
  const plate = qrPlate(180); stage.appendChild(plate); f.appendChild(stage); stage.x = 16; stage.y = 68;
  const tabs = auto('HORIZONTAL', { name: 'Panel tabs', itemSpacing: 4, paddingTop: 4, paddingBottom: 4, paddingLeft: 4, paddingRight: 4 }); fill(tabs, 'surface-inset'); tabs.cornerRadius = 999;
  for (const [i, t] of ['Content', 'Design', 'Recent'].entries()) { const o = auto('HORIZONTAL', { paddingTop: 8, paddingBottom: 8, paddingLeft: 24, paddingRight: 24 }); o.cornerRadius = 999; if (!i) fill(o, 'surface'); o.appendChild(await text(t, 'label', i ? 'text-muted' : 'primary')); tabs.appendChild(o); }
  f.appendChild(tabs); tabs.x = 16; tabs.y = 344;
  const tiles = auto('HORIZONTAL', { name: 'Types', itemSpacing: 8 });
  for (const [i, t] of ['URL', 'Text', 'Email', 'Phone', 'Wi-Fi'].entries()) { const tt = inst('Type tile', i === 0 ? 'State=Selected' : 'State=Default'); setLabel(tt, t); tt.resize(62, tt.height); tiles.appendChild(tt); }
  f.appendChild(tiles); tiles.x = 16; tiles.y = 400;
  const inp = inst('Input', 'State=Focus'); inp.resize(343, inp.height); f.appendChild(inp); inp.x = 16; inp.y = 520;
  const bar = auto('HORIZONTAL', { name: 'Sticky export bar', itemSpacing: 8, paddingTop: 12, paddingBottom: 20, paddingLeft: 16, paddingRight: 16, counterAxisAlignItems: 'CENTER' });
  bar.resize(375, 76); bar.primaryAxisSizingMode = 'FIXED'; fill(bar, 'surface'); stroke(bar, 'border');
  const pb = inst('Button', 'Variant=Primary, State=Default'); bar.appendChild(pb); pb.layoutSizingHorizontal = 'FILL';
  bar.appendChild(setLabel(inst('Button', 'Variant=Secondary, State=Default'), 'SVG'));
  f.appendChild(bar); bar.x = 0; bar.y = 812 - 76;
  place(f);
} catch (e) { out.errors.push('studio mobile: ' + e.message); }

for (const fr of out.frames) { if (fr.name.includes('Desktop')) { const n = await figma.getNodeByIdAsync(fr.id); await n.screenshot({ scale: 0.4 }); } }
return out;
`;
process.stdout.write(script);
