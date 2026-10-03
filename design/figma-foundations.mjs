// Prints the use_figma script that creates the Figma variables, styles and the
// Foundations page from design/tokens.mjs (so Figma and CSS share names).
import { primitives, semantic, space, radius, duration, easing, fonts, type, elevation } from './tokens.mjs';

const data = { primitives, semantic, space, radius, duration, easing, fonts, type, elevation };

const script = `
const T = ${JSON.stringify(data)};
const hex = (h) => { const n = parseInt(h.slice(1), 16); return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 }; };
const rgba = (h) => ({ ...hex(h), a: 1 });
const out = { collections: {}, notes: [], textStyles: [], effectStyles: [], pages: [], created: [] };

// ---------- Fonts: resolve exact style names ----------
const available = await figma.listAvailableFontsAsync();
const norm = (s) => s.replace(/\\s+/g, '').toLowerCase();
const weightNames = { 400: ['regular'], 450: ['regular'], 500: ['medium'], 600: ['semibold'], 650: ['semibold'], 700: ['bold'], 750: ['bold', 'extrabold'], 800: ['extrabold', 'bold'] };
function pickStyle(family, weight) {
  const styles = available.filter((f) => f.fontName.family === family).map((f) => f.fontName.style);
  for (const want of weightNames[weight] || ['regular']) {
    const hit = styles.find((s) => norm(s) === want);
    if (hit) return { family, style: hit };
  }
  return null;
}
const fontFor = (key, weight) => pickStyle(T.fonts[key].family, weight) || { family: 'Inter', style: weight >= 700 ? 'Bold' : weight >= 600 ? 'Semi Bold' : 'Regular' };
const families = Object.fromEntries(Object.entries(T.fonts).map(([k, v]) => [k, available.some((f) => f.fontName.family === v.family)]));
out.fontsAvailable = families;

// ---------- Idempotent helpers (a previous run may have stopped part-way) ----------
const existingCols = await figma.variables.getLocalVariableCollectionsAsync();
const allVars = await figma.variables.getLocalVariablesAsync();
const findCol = (name) => existingCols.find((c) => c.name === name);
function getCol(name, modeName) {
  let c = findCol(name);
  if (!c) { c = figma.variables.createVariableCollection(name); existingCols.push(c); }
  if (modeName && c.modes[0].name !== modeName) c.renameMode(c.modes[0].modeId, modeName);
  return c;
}
function getVar(name, col, type) {
  let v = allVars.find((x) => x.name === name && x.variableCollectionId === col.id);
  if (v && v.resolvedType !== type) { v.remove(); v = null; }
  if (!v) { v = figma.variables.createVariable(name, col, type); allVars.push(v); }
  return v;
}

// ---------- Primitives ----------
const prim = getCol('Primitives', 'Value');
const primMode = prim.modes[0].modeId;
const primVars = {};
for (const [ramp, steps] of Object.entries(T.primitives)) {
  for (const [step, value] of Object.entries(steps)) {
    const v = getVar(ramp + '/' + step, prim, 'COLOR');
    v.setValueForMode(primMode, rgba(value));
    v.scopes = [];
    v.setVariableCodeSyntax('WEB', 'var(--' + ramp + '-' + step + ')');
    primVars[ramp + '.' + step] = v;
  }
}
out.collections.Primitives = Object.keys(primVars).length;

// ---------- Theme (light + dark) ----------
const scopeFor = (name) => {
  if (name.startsWith('text') || name.startsWith('on-')) return ['TEXT_FILL', 'SHAPE_FILL'];
  if (name.startsWith('border') || name === 'focus') return ['STROKE_COLOR'];
  if (['success', 'warning', 'danger'].includes(name)) return ['TEXT_FILL', 'SHAPE_FILL', 'STROKE_COLOR'];
  return ['FRAME_FILL', 'SHAPE_FILL'];
};
let themeMode = 'modes';
const themes = {};
const splitLight = findCol('Theme/Light'), splitDark = findCol('Theme/Dark');
if (splitLight && splitDark) {
  themeMode = 'split';
  themes.light = { collection: splitLight, modeId: splitLight.modes[0].modeId };
  themes.dark = { collection: splitDark, modeId: splitDark.modes[0].modeId };
} else {
  const theme = getCol('Theme', 'Light');
  let darkMode = theme.modes.find((m) => m.name === 'Dark');
  try {
    const darkId = darkMode ? darkMode.modeId : theme.addMode('Dark');
    themes.light = { collection: theme, modeId: theme.modes[0].modeId };
    themes.dark = { collection: theme, modeId: darkId };
  } catch (e) {
    themeMode = 'split';
    theme.name = 'Theme/Light';
    const darkCol = getCol('Theme/Dark', 'Dark');
    themes.light = { collection: theme, modeId: theme.modes[0].modeId };
    themes.dark = { collection: darkCol, modeId: darkCol.modes[0].modeId };
    out.notes.push('Plan allows one mode per collection; light and dark are split into Theme/Light and Theme/Dark with identical variable names. (' + String(e.message || e).slice(0, 80) + ')');
  }
}
if (themeMode === 'split' && !out.notes.length) out.notes.push('Light and dark live in Theme/Light and Theme/Dark (one mode per collection on this plan).');
const themeVars = { light: {}, dark: {} };
for (const [name, [l, d]] of Object.entries(T.semantic)) {
  if (themeMode === 'modes') {
    const v = getVar('color/' + name, themes.light.collection, 'COLOR');
    v.setValueForMode(themes.light.modeId, { type: 'VARIABLE_ALIAS', id: primVars[l].id });
    v.setValueForMode(themes.dark.modeId, { type: 'VARIABLE_ALIAS', id: primVars[d].id });
    v.scopes = scopeFor(name);
    v.setVariableCodeSyntax('WEB', 'var(--color-' + name + ')');
    themeVars.light[name] = v; themeVars.dark[name] = v;
  } else {
    for (const [which, ref] of [['light', l], ['dark', d]]) {
      const v = getVar('color/' + name, themes[which].collection, 'COLOR');
      v.setValueForMode(themes[which].modeId, { type: 'VARIABLE_ALIAS', id: primVars[ref].id });
      v.scopes = scopeFor(name);
      v.setVariableCodeSyntax('WEB', 'var(--color-' + name + ')');
      themeVars[which][name] = v;
    }
  }
}
out.themeMode = themeMode;
out.collections.Theme = Object.keys(T.semantic).length;

// ---------- Size ----------
const size = getCol('Size', 'Value');
const sizeMode = size.modes[0].modeId;
const spaceVars = {}, radiusVars = {};
for (const [k, v] of Object.entries(T.space)) {
  const x = getVar('space/' + k, size, 'FLOAT');
  x.setValueForMode(sizeMode, v); x.scopes = ['GAP', 'WIDTH_HEIGHT'];
  x.setVariableCodeSyntax('WEB', 'var(--space-' + k + ')'); spaceVars[k] = x;
}
for (const [k, v] of Object.entries(T.radius)) {
  const x = getVar('radius/' + k, size, 'FLOAT');
  x.setValueForMode(sizeMode, v); x.scopes = ['CORNER_RADIUS'];
  x.setVariableCodeSyntax('WEB', 'var(--radius-' + k + ')'); radiusVars[k] = x;
}
out.collections.Size = Object.keys(T.space).length + Object.keys(T.radius).length;

// ---------- Motion ----------
const motion = getCol('Motion', 'Value');
const motionMode = motion.modes[0].modeId;
let motionCount = 0;
for (const [k, v] of Object.entries(T.duration)) {
  let x;
  try { x = getVar('duration/' + k, motion, 'TIMING'); x.setValueForMode(motionMode, v); }
  catch (e) { x = getVar('duration/' + k, motion, 'FLOAT'); x.setValueForMode(motionMode, Math.round(v * 1000)); x.scopes = []; out.notes.push('TIMING unsupported; duration stored as FLOAT ms'); }
  x.setVariableCodeSyntax('WEB', 'var(--duration-' + k + ')'); motionCount++;
}
for (const [k, [x1, y1, x2, y2]] of Object.entries(T.easing)) {
  let x;
  try { x = getVar('ease/' + k, motion, 'EASING'); x.setValueForMode(motionMode, { type: 'CUSTOM_CUBIC_BEZIER', easingFunctionCubicBezier: { x1, y1, x2, y2 } }); }
  catch (e) { x = getVar('ease/' + k, motion, 'STRING'); x.setValueForMode(motionMode, 'cubic-bezier(' + [x1, y1, x2, y2].join(', ') + ')'); x.scopes = []; out.notes.push('EASING unsupported; easing stored as STRING'); }
  x.setVariableCodeSyntax('WEB', 'var(--ease-' + k + ')'); motionCount++;
}
out.collections.Motion = motionCount;

// ---------- Text styles ----------
const styleByKey = {};
const existingText = await figma.getLocalTextStylesAsync();
for (const [k, t] of Object.entries(T.type)) {
  const fn = fontFor(t.font, t.weight);
  await figma.loadFontAsync(fn);
  const s = existingText.find((x) => x.name === k.replace('-', '/')) || figma.createTextStyle();
  s.name = k.replace('-', '/');
  s.fontName = fn; s.fontSize = t.size;
  s.lineHeight = { value: Math.round(t.lh * 100), unit: 'PERCENT' };
  s.letterSpacing = { value: t.ls, unit: 'PERCENT' };
  s.description = 'CSS: .type-' + k + ' (font-size var(--type-' + k + '-size), fluid ' + t.min + '-' + t.size + 'px)';
  styleByKey[k] = s;
  out.textStyles.push(s.name + ' = ' + fn.family + ' ' + fn.style + ' ' + t.size);
}

// ---------- Effect styles ----------
const shadows = {
  1: [[0, 1, 2, 0, 0.06], [0, 1, 1, 0, 0.04]],
  2: [[0, 2, 4, 0, 0.05], [0, 8, 24, -8, 0.16]],
  3: [[0, 4, 8, 0, 0.06], [0, 24, 56, -20, 0.28]],
};
const existingFx = await figma.getLocalEffectStylesAsync();
for (const [k, layers] of Object.entries(shadows)) {
  const e = existingFx.find((x) => x.name === 'elevation/' + k) || figma.createEffectStyle();
  e.name = 'elevation/' + k;
  e.effects = layers.map(([x, y, r, s, a]) => ({ type: 'DROP_SHADOW', color: { r: 20 / 255, g: 25 / 255, b: 39 / 255, a }, offset: { x, y }, radius: r, spread: s, visible: true, blendMode: 'NORMAL' }));
  e.description = 'CSS: var(--elevation-' + k + ')';
  out.effectStyles.push(e.name);
}

// ---------- Pages (Starter plan: 3 pages max) ----------
const pageNames = ['Foundations', 'Components', 'Screens'];
const pages = {};
const spare = figma.root.children.filter((p) => !pageNames.includes(p.name));
for (const n of pageNames) {
  let p = figma.root.children.find((x) => x.name === n);
  if (!p && spare.length) { p = spare.shift(); p.name = n; }
  if (!p) p = figma.createPage(), p.name = n;
  pages[n] = p; out.pages.push({ name: n, id: p.id });
}
// ---------- Foundations page ----------
await figma.setCurrentPageAsync(pages.Foundations);
for (const n of [...pages.Foundations.children]) if (n.name.startsWith('Foundations / ')) n.remove();
const bindFill = (node, v) => { node.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }, 'color', v)]; };
const bindStroke = (node, v) => { node.strokes = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v)]; };
const text = async (chars, styleKey, colorVar) => {
  const t = figma.createText();
  await t.setTextStyleIdAsync(styleByKey[styleKey].id);
  t.characters = chars;
  if (colorVar) bindFill(t, colorVar);
  return t;
};
await Promise.all([...new Set(Object.values(styleByKey).map((s) => JSON.stringify(s.fontName)))].map((f) => figma.loadFontAsync(JSON.parse(f))));

async function themeBoard(which) {
  const V = themeVars[which];
  const board = figma.createAutoLayout('VERTICAL', { name: 'Foundations / ' + (which === 'light' ? 'Light' : 'Dark'), itemSpacing: 40, paddingTop: 64, paddingBottom: 64, paddingLeft: 64, paddingRight: 64 });
  bindFill(board, V.bg);
  board.cornerRadius = 0;
  if (themeMode === 'modes') board.setExplicitVariableModeForCollection(themes[which].collection, themes[which].modeId);
  const head = figma.createAutoLayout('VERTICAL', { name: 'Header', itemSpacing: 8 });
  board.appendChild(head);
  head.appendChild(await text('QR Studio — Foundations', 'display-l', V.text));
  head.appendChild(await text((which === 'light' ? 'Light' : 'Dark') + ' theme · tokens mirrored 1:1 in src/styles/tokens.css', 'body-l', V['text-muted']));

  const groups = [
    ['Surfaces', ['bg', 'bg-sunken', 'surface', 'surface-raised', 'surface-inset', 'stage', 'border', 'border-strong']],
    ['Text', ['text', 'text-muted', 'text-subtle', 'text-inverse']],
    ['Action', ['primary', 'primary-hover', 'on-primary', 'primary-soft', 'on-primary-soft', 'focus']],
    ['Feedback', ['success', 'success-soft', 'warning', 'warning-soft', 'danger', 'danger-soft']],
    ['GDG accents', ['brand-blue', 'brand-red', 'brand-yellow', 'brand-green', 'on-brand']],
  ];
  for (const [title, names] of groups) {
    const g = figma.createAutoLayout('VERTICAL', { name: title, itemSpacing: 16 });
    board.appendChild(g);
    g.appendChild(await text(title, 'title-m', V.text));
    const row = figma.createAutoLayout('HORIZONTAL', { name: title + ' swatches', itemSpacing: 16 });
    g.appendChild(row);
    for (const n of names) {
      const cell = figma.createAutoLayout('VERTICAL', { name: n, itemSpacing: 8 });
      row.appendChild(cell);
      const sw = figma.createRectangle();
      sw.resize(132, 88); sw.cornerRadius = 14; sw.name = 'swatch';
      bindFill(sw, V[n]); bindStroke(sw, V.border); sw.strokeWeight = 1;
      cell.appendChild(sw);
      cell.appendChild(await text('color/' + n, 'label', V.text));
      const [l, d] = T.semantic[n];
      cell.appendChild(await text((which === 'light' ? l : d) + '', 'mono', V['text-subtle']));
    }
  }
  // Type specimen
  const ty = figma.createAutoLayout('VERTICAL', { name: 'Type', itemSpacing: 14 });
  board.appendChild(ty);
  ty.appendChild(await text('Type', 'title-m', V.text));
  const samples = { 'display-xl': 'Codes that scan.', 'display-l': 'Designed in seconds', 'display-m': 'Nothing leaves your device', 'title-l': 'Scan reliability', 'title-m': 'Customise your code', 'body-l': 'QR Studio encodes every payload to its real specification.', 'body-m': 'Warn, never block: the advisor explains the risk and leaves the choice to you.', 'body-s': 'Saved in this browser only.', 'label': 'ERROR CORRECTION', 'mono': 'WIFI:T:WPA;S:GDG-Campus;P:buildwithgdg;;' };
  for (const [k, s] of Object.entries(samples)) {
    const r = figma.createAutoLayout('HORIZONTAL', { name: k, itemSpacing: 24, counterAxisAlignItems: 'BASELINE' });
    ty.appendChild(r);
    const tag = await text(k, 'mono', V['text-subtle']); tag.resize(120, tag.height); tag.textAutoResize = 'HEIGHT';
    r.appendChild(tag);
    r.appendChild(await text(s, k, V.text));
  }
  // Radius + space
  const rs = figma.createAutoLayout('HORIZONTAL', { name: 'Radius', itemSpacing: 16, counterAxisAlignItems: 'MAX' });
  board.appendChild(rs);
  for (const [k, v] of Object.entries(T.radius)) {
    const cell = figma.createAutoLayout('VERTICAL', { name: 'radius/' + k, itemSpacing: 8 });
    rs.appendChild(cell);
    const b = figma.createRectangle(); b.resize(72, 72); b.name = 'shape';
    for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) b.setBoundVariable(c, radiusVars[k]);
    bindFill(b, V['primary-soft']); bindStroke(b, V.primary); b.strokeWeight = 1.5;
    cell.appendChild(b); cell.appendChild(await text('radius/' + k + ' · ' + v, 'mono', V['text-subtle']));
  }
  return board;
}

const light = await themeBoard('light');
light.x = 0; light.y = 0;
const dark = await themeBoard('dark');
dark.x = light.width + 120; dark.y = 0;
out.created.push(light.id, dark.id);
out.boards = { light: [Math.round(light.width), Math.round(light.height)], dark: [Math.round(dark.width), Math.round(dark.height)] };
return out;
`;
process.stdout.write(script);
