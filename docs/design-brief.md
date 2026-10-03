# QR Studio — Design brief

*GDG on Campus SRM · Technical Recruitment 2026-27 · Frontend Task 1*

## Positioning

> **QR codes that actually scan, designed in seconds, nothing leaves your device.**

## Audience

- **Makers:** students and event organisers making a code for a real artefact: an event poster,
  a shared Wi-Fi network at a venue, a resume, a business card. Usually one code, usually under
  time pressure, usually printed.
- **Evaluators:** GDG on Campus SRM members reviewing the submission on desktop. They judge craft,
  correctness and engineering judgement.

## Feel

**Confident · playful · exact.**

- *Confident:* big type and a code that is staged like the product itself, not a thumbnail.
- *Playful:* GDG colour shapes with springy, purposeful motion; campus-club energy.
- *Exact:* real payload strings, real contrast ratios, real decode-tested output. Numbers are
  shown, never implied.

## Direction (locked)

**Expressive Google-native product.** A polished product site that feels native to the Google
developer world: bold rounded display type, our own playful shapes in the four GDG colours, and
a live, engine-rendered QR code as the hero object.

- **Identity:** our own mark built from the QR code itself (three rounded finder squares in GDG
  blue, red and yellow, plus a green module). No GDG or Google logo is used or recreated.
- **Type:** Bricolage Grotesque (display) · Figtree (text and UI) · JetBrains Mono (payloads and
  measurements only). All self-hosted variable fonts via Fontsource.
- **Colour:** a cool neutral scale, GDG blue as the lead action colour, and red, yellow and green
  used for meaning (type colour, advisor severity) and for decorative shapes. Brand colours are
  fills behind dark ink, never thin text.
- **Motion:** one authored moment per surface. On the landing page that is the hero code
  assembling and morphing between payloads; in the studio it is the preview reacting to changes.
  Everything honours `prefers-reduced-motion`.

Process: Impeccable `shape` → `init` ([PRODUCT.md](PRODUCT.md)) → direction rounds (assigned roll, two bolder
re-rolls, a steered fresh hand, then the safer register, from which this direction was chosen).

## Avoid

- The generic SaaS look of the current UI: identical white rounded cards, soft pastel blobs,
  Inter, numbered step badges.
- Purple-to-blue gradients, glassmorphism, gradient text, emoji icons, eyebrow labels above
  headings.
- Monospace as decoration: mono only for payloads, measurements and code.
- Any claim we cannot prove (no user counts, testimonials or benchmarks).

## What the critique of the current UI found

Impeccable `critique`, run as two isolated assessments (design review + detector):

- **Heuristics 24/40 (Acceptable).** Weakest: flexibility and efficiency (1/4: no shortcuts, no
  copy, radio groups without arrow keys) and jargon (`ECC M`, `module margin`).
- **Specificity:** the tool logic is product-specific; the visual layer could reskin any product.
- **P1 — preview lost on narrow screens** while customising. → Studio: sticky preview + export bar
  on mobile.
- **P1 — the advisor is buried** under the download buttons, far from the controls that cause its
  warnings. → Studio: advisor as a first-class panel beside the code; landing: a dedicated
  scan-reliability demo.
- **P1 — weak brand.** → New identity above; visible "Built for GDG on Campus SRM" attribution.
- **P2 — destructive actions without undo** (Clear all, Reset design). → Undo toast.
- **Detector:** 1 finding: Inter flagged as an overused face (index.html). → Replaced.
- Also: the canvas `aria-label` read out the raw payload (including Wi-Fi passwords) → fixed to a
  description; the ECC levels only explained in hover tooltips → visible descriptions.

## Figma

Design system file: https://www.figma.com/design/ReC7bi5MHPI7umlpCt3OZM

Tokens live in `design/tokens.mjs` and generate both `src/styles/tokens.css` and the Figma
variables, so names match exactly (`color/bg` in Figma is `--color-bg` in CSS).
