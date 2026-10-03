---
name: QR Studio
description: QR codes that actually scan, designed in seconds, nothing leaves your device.
colors:
  # Light theme (:root). Keys mirror the CSS variables: `bg` <-> --color-bg.
  bg: "#F8F9FC"
  bg-sunken: "#F1F3F8"
  surface: "#FFFFFF"
  surface-inset: "#F1F3F8"
  stage: "#EEF1F7"
  border: "#E1E5EE"
  border-strong: "#8A93A8"
  text: "#141927"
  text-muted: "#4B5368"
  text-subtle: "#5F6980"
  text-inverse: "#FFFFFF"
  primary: "#1967D2"
  primary-hover: "#185ABC"
  on-primary: "#FFFFFF"
  primary-soft: "#E8F0FE"
  on-primary-soft: "#185ABC"
  focus: "#1A73E8"
  success: "#137333"
  success-soft: "#E6F4EA"
  warning: "#7A4F01"
  warning-soft: "#FEF7E0"
  danger: "#C5221F"
  danger-soft: "#FCE8E6"
  # Brand fills: identical in both themes.
  brand-blue: "#4285F4"
  brand-red: "#EA4335"
  brand-yellow: "#FBBC04"
  brand-green: "#34A853"
  on-brand: "#141927"
  # Payload blocks: dark in both themes.
  code-bg: "#141927"
  code-fg: "#FFFFFF"
  code-accent: "#FDD663"
  code-mark: "#C5221F"
  # Dark theme (:root[data-theme='dark']). Same CSS variable, dark value.
  dark-bg: "#0A0D17"
  dark-bg-sunken: "#070910"
  dark-surface: "#141927"
  dark-surface-inset: "#0F1320"
  dark-stage: "#0F1320"
  dark-border: "#262D40"
  dark-border-strong: "#69738A"
  dark-text: "#FFFFFF"
  dark-text-muted: "#B3BBCC"
  dark-text-subtle: "#8A93A8"
  dark-text-inverse: "#0A0D17"
  dark-primary: "#8AB4F8"
  dark-primary-hover: "#AECBFA"
  dark-on-primary: "#0A0D17"
  dark-primary-soft: "#1A2A4A"
  dark-on-primary-soft: "#AECBFA"
  dark-focus: "#8AB4F8"
  dark-success: "#81C995"
  dark-success-soft: "#13261C"
  dark-warning: "#FDD663"
  dark-warning-soft: "#2A2410"
  dark-danger: "#F28B82"
  dark-danger-soft: "#2C1615"
  dark-code-bg: "#1B2132"
typography:
  display-xl:
    fontFamily: "Bricolage Grotesque Variable, Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(46px, 2.0387rem + 3.5681vw, 84px)"
    fontWeight: 800
    lineHeight: 0.94
    letterSpacing: "-0.035em"
  display-l:
    fontFamily: "Bricolage Grotesque Variable, Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(36px, 1.8099rem + 1.8779vw, 56px)"
    fontWeight: 750
    lineHeight: 1
    letterSpacing: "-0.025em"
  display-m:
    fontFamily: "Bricolage Grotesque Variable, Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(30px, 1.6549rem + 0.9390vw, 40px)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.018em"
  title-l:
    fontFamily: "Bricolage Grotesque Variable, Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(24px, 1.4120rem + 0.3756vw, 28px)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.010em"
  title-m:
    fontFamily: "Figtree Variable, Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(18px, 1.1030rem + 0.0939vw, 19px)"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.004em"
  body-l:
    fontFamily: "Figtree Variable, Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(17px, 1.0185rem + 0.1878vw, 19px)"
    fontWeight: 450
    lineHeight: 1.55
    letterSpacing: "0"
  body-m:
    fontFamily: "Figtree Variable, Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 450
    lineHeight: 1.55
    letterSpacing: "0"
  body-s:
    fontFamily: "Figtree Variable, Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 450
    lineHeight: 1.5
    letterSpacing: "0"
  label:
    fontFamily: "Figtree Variable, Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.002em"
  mono:
    fontFamily: "JetBrains Mono Variable, JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 450
    lineHeight: 1.55
    letterSpacing: "0"
rounded:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "20px"
  xl: "28px"
  2xl: "40px"
  full: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
  "16": "64px"
  "20": "80px"
  "24": "96px"
  "32": "128px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.full}"
    padding: "0 24px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-inset}"
  button-ghost:
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "0 24px"
    height: "48px"
  button-ghost-hover:
    backgroundColor: "{colors.primary-soft}"
  button-lg:
    padding: "0 32px"
    height: "56px"
  button-sm:
    padding: "0 16px"
    height: "38px"
  icon-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.full}"
    size: "44px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    height: "48px"
  input-invalid:
    backgroundColor: "{colors.danger-soft}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "clamp(18px, 2.4vw, 28px)"
  stage-surface:
    backgroundColor: "{colors.stage}"
    rounded: "{rounded.2xl}"
    padding: "clamp(14px, 4vw, 40px)"
  stage-plate:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    width: "min(100%, 360px)"
  type-chip:
    textColor: "{colors.on-brand}"
    rounded: "11px"
    size: "34px"
  status-pill-ok:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  status-pill-warn:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
  status-pill-bad:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
  payload-pill:
    backgroundColor: "{colors.code-bg}"
    textColor: "{colors.code-fg}"
    rounded: "{rounded.full}"
    typography: "{typography.mono}"
  toast:
    backgroundColor: "{colors.text}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.full}"
    padding: "12px 12px 12px 16px"
---

# Design System: QR Studio

## Overview

**Creative North Star: "The Code on Stage"**

The live, engine-rendered QR code is the product and its own proof, so every surface stages it: a white plate lifted on a coloured or dotted stage, never a thumbnail in a card. Around it the system is a cool, quiet neutral ground with one lead action colour (GDG blue) and three brand fills (red, yellow, green) that carry meaning (code type, scan-check severity) and form our own finder-pattern shapes. The feel is the brief's three words: confident (big rounded display type, pill actions), playful (GDG colour shapes, springy settles), exact (real payload strings in mono, real contrast ratios, numbers shown rather than implied).

Two routes share one token set. The landing page (`/`) is expressive: a 1240px container, generous section rhythm, brand-colour shapes and frames. The studio (`/studio`) is a workspace: flat bordered panels on a sunken ground, the stage in the centre, the scan check beside the controls that cause its warnings. Light and dark are first-class; the theme is resolved before first paint from `localStorage` (`qr-studio:theme:v1`) or `prefers-color-scheme` and set as `data-theme` on `<html>`.

**Source of truth.** `design/tokens.mjs` generates `src/styles/tokens.css` (`node design/build-tokens.mjs`) and the Figma variable script, so names match: Figma `color/bg` is CSS `--color-bg`. Never hand-edit `tokens.css`. The Figma library (https://www.figma.com/design/ReC7bi5MHPI7umlpCt3OZM) mirrors the tokens, with light and dark split into two collections, **Theme/Light** and **Theme/Dark**, because the Figma Starter plan allows only one mode per collection. The four `code-*` tokens (`code-bg`, `code-fg`, `code-accent`, `code-mark`) exist in code but are not yet in Figma.

**Key Characteristics:**
- Cool neutral ground; GDG blue leads; red, yellow, green as fills that mean something.
- Bricolage Grotesque display, Figtree text and UI, JetBrains Mono only for data.
- Pills for actions and status, soft squircles for containers, 14px fields.
- Flat panels; shadows only on objects that float (plates, nav, primary button, toast).
- One authored motion moment per surface; everything honours `prefers-reduced-motion`.

## Colors

A cool blue-grey neutral scale carries almost everything; GDG blue is the single action colour, and the four brand colours appear as solid fills behind dark ink.

### Primary
- **Campus Blue** (`--color-primary`): primary buttons, links, active slider thumbs, switch-on track, selected segmented option text, the hero headline's accent phrase. Hover deepens (`--color-primary-hover`). In dark mode it lifts to a pale blue and `--color-on-primary` flips to near-black ink.
- **Blue Wash** (`--color-primary-soft` with `--color-on-primary-soft`): selected states that should read as chosen, not as action: active mobile tab, selected type option, current recent card, logo drop hover, info advice, the landing colour demo field.
- **Focus Blue** (`--color-focus`): focus rings and input focus borders only.

### Secondary (brand fills)
- **GDG Blue / Red / Yellow / Green** (`--color-brand-blue|red|yellow|green`): identical in both themes. Used as fills: hero stage squircle, ring, pill and dot shapes; final CTA card; type chips and recent badges; scan-check reading marks; landing scan frame; trust-strip bullets; the logo mark; toast icons. Ink on top is always `--color-on-brand` (#141927).
- **Selection Yellow**: `::selection` is brand yellow with on-brand ink.

### Tertiary (status)
- **Success / Warning / Danger** (`--color-success|warning|danger` plus `-soft` backgrounds): paired text-on-tint for verdict pills, contrast readouts, advice rows, field errors. Soft tints are dark and desaturated in dark mode.

### Neutral
- **Page Ground** (`--color-bg`): landing background. **Sunken Ground** (`--color-bg-sunken`): studio background, so panels read as lifted by tone alone.
- **Surface** (`--color-surface`): panels, cards, nav bar, inputs, secondary buttons. **Surface Inset** (`--color-surface-inset`): tab tracks, readings, slider tracks, hover fills. **Stage** (`--color-stage`): the studio stage under its dotted grid.
- **Border** (`--color-border`) for containers and dividers; **Border Strong** (`--color-border-strong`) for interactive edges (inputs, secondary buttons, swatches, dashed drop zones).
- **Ink ramp**: `--color-text` (headings, values), `--color-text-muted` (lede, body copy in sections), `--color-text-subtle` (hints, captions, meta). `--color-text-inverse` sits on `--color-text` fills (toast, count badge, skip link).
- **Payload Dark** (`--color-code-bg`, `--color-code-fg`): payload blocks stay dark in both themes so `--color-code-accent` (scheme, yellow) and `--color-code-mark` (escape highlight, red) keep contrast.

`--color-surface-raised` and `--ease-exit` are defined in tokens but not used by any surface yet.

### Named Rules
**The Ink-on-Brand Rule.** Brand blue, red, yellow and green are fills under `--color-on-brand` ink, never text colour and never thin text on the page ground. The "Text" type is the exception that proves it: its chip uses `--color-text-muted` with `--color-surface` ink.

**The Meaning Map Rule.** Type colours are fixed everywhere a type appears (landing showcase, type picker, recent badges, how-it-works): URL blue, Text neutral, Email red, Phone green, Wi-Fi yellow. Severity is fixed too: ok green, warn yellow, bad red for marks and frames; text-level status uses the success/warning/danger pairs.

**The White Plate Rule.** A QR code is always rendered on a light plate. Landing plates (hero, types showcase) are literal white (#ffffff) in both themes because they are scan targets; the studio plate uses `--color-surface` and the canvas itself carries the user's chosen background.

## Typography

**Display Font:** Bricolage Grotesque (fallback ui-sans-serif, system-ui)
**Body Font:** Figtree (fallback ui-sans-serif, system-ui)
**Label/Mono Font:** JetBrains Mono (fallback ui-monospace, SFMono-Regular, Menlo)

**Character:** A heavy, rounded, slightly quirky grotesque for headlines against a friendly, legible humanist sans for everything you read or operate; mono appears only where the content is literally data. All three are self-hosted variable fonts via Fontsource, which is why the ramp uses in-between weights (450, 650, 750).

### Hierarchy
Each step is available as a utility class (`.type-display-xl` … `.type-mono`) and as `--type-<step>-size|weight|leading|tracking` variables. Fluid steps clamp between a mobile floor and the desktop size.
- **Display XL** (800, 46→84px, 0.94): the landing hero headline only, max 11ch.
- **Display L** (750, 36→56px, 1.0): landing section headings and the final CTA (max 14ch).
- **Display M** (700, 30→40px, 1.06): large numeric callouts such as the landing contrast ratio.
- **Title L** (700, 24→28px, 1.15, Bricolage): studio panel titles ("Content", "Design", "Scan check").
- **Title M** (650, 18→19px, 1.3, Figtree): FAQ questions and sub-heads that should stay in the text face.
- **Body L** (450, 17→19px, 1.55): ledes and section intros.
- **Body M** (450, 16px, 1.55): document default; inputs are 16px so iOS never zooms.
- **Body S** (450, 14px, 1.5): hints, captions, meta.
- **Label** (600, 13px, +0.002em, sentence case): small group captions ("What you type") and field-adjacent labels.
- **Mono** (450, 13px, 1.55): payloads, hex values, ratios, px and module counts, `kbd`.

Body text uses `font-variant-numeric: tabular-nums` globally, headings `text-wrap: balance`, paragraphs `text-wrap: pretty`; reading measures are capped (34em lede, 46ch to 62ch elsewhere).

### Named Rules
**The Mono-Means-Data Rule.** JetBrains Mono is used only for strings a machine reads or a number with a unit: payloads, hex, contrast ratios, sizes, file names, shortcuts. Never for decoration or labels.

**The Two-Faces Rule.** Bricolage for display and panel titles; Figtree for everything interactive (buttons, tabs, fields, FAQ). Buttons are Figtree 650.

## Layout

**Landing.** Content sits in `.container`: `min(1240px, 100%)` wide, inline padding `clamp(20px, 5vw, 48px)`. Sections are separated by `--lp-section-gap` (`clamp(80px, 11vw, 152px)`); section heads are max 760px with `clamp(32px, 5vw, 56px)` below. The sticky nav is a floating pill bar (68px min height, `min(1240px, 100% - 24px)`). The presets rail scrolls horizontally with snap, inset to align with the container. Breakpoints are mobile-first:
- 420px and 520px (max-width): nav tightens, byline and CTA icons drop, payload pill narrows.
- 900px: two-column grids for the types showcase, colour demo, privacy diagram, FAQ and footer; final-CTA shapes reposition.
- 960px: scan-check section goes two-column with a sticky stage (`top: 120px`).
- 980px: nav links appear.
- 1024px: hero goes two-column (`1.05fr / 0.95fr`).

**Studio.** A 64px sticky top bar (`--bar-h`) over a sunken ground. Breakpoints are 768px and 1200px:
- Below 768px: one column; a three-way tab bar (Content, Design, Recent) shows one panel at a time; the stage pins under the bar with its meta hidden; the export bar is fixed to the bottom with safe-area padding; the toast lifts above it.
- 768px to 1199px: controls left (`minmax(0, 1fr)`), stage column right (`minmax(300px, 400px)`) and sticky.
- 1200px and up: three full-height columns (`minmax(320px, 380px) / 1fr / minmax(320px, 400px)`), each scrolling independently at `100dvh - 64px` with stable scrollbar gutters; side panels lose their radius and become edge-to-edge with a single divider border. The centre column caps the stage and recent codes at 640px.
- Minor: the keyboard-shortcut hint appears at 1024px; the Copy label hides below 400px.

**Spacing rhythm.** A 4px base scale (`--space-1` 4px through `--space-32` 128px). Panels use 24px internal gaps; field groups 20px; label-to-control 8px; chip and tab tracks 4px. Fluid paddings use `clamp()` rather than extra breakpoints.

## Elevation & Depth

Hybrid: tonal layering does most of the work (sunken ground, surface, inset), and shadows are reserved for objects that float above the page. Panels, cards and fields are flat with a 1 to 1.5px border. Shadows are ink-tinted and soft in light mode and switch to heavier pure-black values in dark mode via the same variable.

### Shadow Vocabulary
- **Elevation 1** (`--elevation-1`): small resting lift: segmented and tab thumbs, landing preset cards, the switch knob.
- **Elevation 2** (`--elevation-2`): interactive objects: primary buttons, the floating nav bar, the types showcase panel, the hero payload pill, slider thumbs.
- **Elevation 3** (`--elevation-3`): the hero object and transient overlays: every QR plate, demo code frames, the toast.

### Named Rules
**The Flat Panels, Lifted Objects Rule.** Containers never carry shadows; the code plate always does. If a new element is not a plate, a floating bar, a primary action or an overlay, it gets a border, not a shadow.

## Shapes

Two shape families. **Pills** (`--radius-full`) for anything you press or read as status: buttons, icon buttons, tab tracks and tabs, verdicts, the payload pill, toasts, badges. **Soft squircles** for containers, scaled to size: fields and readings 14px (`md`), type options and drop zones 20px (`lg`), panels and plates 28px (`xl`), stages, showcase panels and the final CTA 40px (`2xl`); the hero stage squircle is 22% of its box. Small inner chips use 11px; swatches 10px (`sm`); canvases and thumbnails 6px (`xs`). Borders are 1px for containers and 1.5px for interactive edges; dashed 2px marks drop targets and empty states. Decorative shapes are derived from the QR finder pattern: rounded-square ring, pill, dot.

### Named Rules
**The Pill Action Rule.** If it acts or reports, it is a pill. If it holds content, it is a squircle. Square corners do not appear.

## Components

### Buttons
Confident pills, Figtree 650 at 15px.
- **Shape:** fully rounded (999px), 1.5px border.
- **Primary:** Campus Blue fill, on-primary ink, `--elevation-2`; 48px tall, 24px inline padding. Sizes: `--sm` 38px / 16px / 14px text, `--lg` 56px / 32px / 16px text.
- **Hover / Active:** lifts 1px (`translateY(-1px)`), primary deepens to `--color-primary-hover`; active settles to `scale(0.98)`. Transitions run at `--duration-fast` on `--ease-standard`. Disabled is 45% opacity with `not-allowed`.
- **Secondary:** surface fill, `--color-border-strong` edge; hover fills with surface-inset.
- **Ghost:** transparent, blue text; hover fills with Blue Wash.
- **Icon button:** 44px circle, 1.5px border, muted icon that darkens on hover.

### Chips and tabs
- **Type picker:** five options in a grid, each a 20px-radius tile with a 34px brand-coloured icon chip (11px radius, on-brand ink). Selected: a 2px blue outline and Blue Wash fill that slides between options (`layoutId`).
- **Segmented control** (error correction): inset track (`--radius-lg`), options show a display-face letter over a mono detail; the selected thumb is a surface tile with `--elevation-1` that slides between options.
- **Mobile panel tabs / landing type tabs:** pill track on surface or surface-inset; landing uses a sliding surface pill, studio fills the active tab with Blue Wash. Count badges are ink pills.

### Cards / Containers
- **Panel:** 28px radius, surface fill, 1px border, `clamp(18px, 2.4vw, 28px)` padding, no shadow. At 1200px+ side panels become borderless columns.
- **Recent card:** 20px radius, 1.5px border; hover lifts 2px and strengthens the border; current card gets a blue border and Blue Wash. A 32px remove button appears on hover/focus (always visible on `hover: none` devices).
- **Preset tile:** 14px radius, shows a mini code, name, and mono contrast ratio; pressed state is a blue 1.5px ring.

### Inputs / Fields
- **Style:** 48px min height, 1.5px `--color-border-strong` stroke, 14px radius, surface fill, 16px text; placeholder in text-subtle; hover darkens the stroke.
- **Focus:** stroke becomes `--color-focus` plus a 3px halo at 28% focus colour (no outline).
- **Error:** danger stroke over a danger-soft fill; message in danger 600 with an icon, settling in from 3px above.
- **Switch:** 44×26px track, white knob with `--elevation-1`, track turns primary when on; knob moves on `--ease-emphasized`.
- **Slider:** 8px inset track with a strong border, 22px primary thumb ringed in surface; value shown in a mono pill.
- **Colour field:** swatch plus mono hex inside one bordered control; the whole control takes the focus halo.

### Navigation
- **Landing:** sticky floating pill bar at 92% surface opacity with `--elevation-2`; wordmark with "Built for GDG on Campus SRM" byline; links are muted pills that darken with an inset fill on hover; theme toggle icon button and a primary small "Open Studio" button.
- **Studio:** 64px sticky bar on surface with a bottom border; Help link, shortcut hint (1024px+), theme toggle.

### The Stage (signature)
The code's home in the studio: a 40px-radius stage on `--color-stage` with an 18px dotted grid drawn from 14% text colour, holding a 28px-radius plate (`--elevation-3`, max 360px). Empty and error states draw a ghost code (three finder outlines and a few modules) rather than an illustration; error tints it danger. A verdict pill under the plate summarises the scan check (ok / warn / bad) and jumps to it. Below: a fact row (type, size, payload bytes) and the payload block, with Wi-Fi passwords masked until "Show password".

### Scan check
Readings in an auto-fit grid of inset tiles: label in 12.5px subtle, value in mono 600 with an 18px round brand-colour mark (green / yellow / red). The all-clear row draws its tick on `--duration-deliberate`. Advice rows are 14px-radius tints (warning-soft or primary-soft).

### Payload pill and blocks
Dark in both themes: a yellow type badge, mono payload, a yellow block caret while typing. Syntax: scheme in code-accent, escapes highlighted on code-mark.

### Toast
An ink pill at the bottom centre (`--elevation-3`), brand-coloured status icon, optional yellow Undo action with a mono shortcut. It holds while hovered or focused, lasts 10s with an action and 3.2s without, and announces via `role="status"`.

### Motion
Tokens: `--duration-fast` 120ms (hover, colour), `--duration-base` 200ms (toggles, chevrons), `--duration-slow` 320ms (background swaps; also the Motion default), `--duration-deliberate` 560ms (heading settles, tick draw, hero shapes). Easing: `--ease-standard` for state changes, `--ease-emphasized` for arrivals. Motion components run under `MotionConfig reducedMotion="user"` with a 0.32s standard default; selection thumbs slide with shared `layoutId`. The authored moments: on the landing, the hero code assembles cell by cell (420ms emphasized) and morphs between payloads every 4.2s after first interaction or 8s, with a single green scan sweep and the brand shapes turning; in the studio, the preview and scan check react to every change. Section headings settle 14px on `--ease-emphasized`, transform only, so content is never hidden.

## Do's and Don'ts

### Do:
- **Do** add or change tokens in `design/tokens.mjs` and regenerate; reference them as `var(--color-*)`, `var(--space-*)`, `var(--radius-*)`, never raw hex in components.
- **Do** put every QR code on a light plate with `--elevation-3` (The White Plate Rule).
- **Do** use brand colours as fills under `--color-on-brand` ink, and keep the type and severity colour map fixed (The Meaning Map Rule).
- **Do** use pills for actions and status, squircles for containers (The Pill Action Rule).
- **Do** keep focus visible: 3px solid `--color-focus`, 2px offset globally; inputs use the focus border plus 3px 28% halo.
- **Do** keep interactive targets at 44px or larger for primary controls (buttons 48px, icon buttons and tabs 44px).
- **Do** honour reduced motion: the global reset shortens all CSS animation and transition, Motion respects the user setting, and the hero stops cycling and typing.
- **Do** describe codes to assistive tech by type ("URL QR code preview"), never by reading the payload aloud, and mask Wi-Fi passwords by default.
- **Do** keep new Figma variables in sync: light values in Theme/Light, dark values in Theme/Dark; add the four `code-*` tokens when Figma is next updated.

### Don't:
- **Don't** use brand red, yellow or green as text colour or thin strokes on the page ground; they fail contrast as text.
- **Don't** use JetBrains Mono for labels, headings or decoration (The Mono-Means-Data Rule).
- **Don't** add shadows to panels or cards (The Flat Panels, Lifted Objects Rule).
- **Don't** use purple-to-blue gradients, glassmorphism, gradient text, emoji icons, or eyebrow labels above headings.
- **Don't** use or recreate the GDG or Google logos; the mark is our own three finder squares and a green module.
- **Don't** put payloads in URLs or show any claim (user counts, testimonials, benchmarks) the product cannot prove.
