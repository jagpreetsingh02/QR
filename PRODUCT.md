# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** students and event organisers who need a QR code for a real artefact — an event
  poster, a shared Wi-Fi network at a venue, a resume, a business card. They are making one code
  (or a handful) for a specific job, usually under some time pressure, and will print or share it.
- **Evaluators:** members of GDG on Campus SRM reviewing this as the Frontend Task 1 submission of
  the Technical Recruitment 2026-27. They judge craft, correctness and engineering judgement.

## Product Purpose

QR Studio generates and designs QR codes entirely in the browser. Success is a code the user
downloads with confidence that it will scan and do the right thing when scanned.

## Positioning

"QR codes that actually scan, designed in seconds, nothing leaves your device."

The mechanism neighbouring generators do not offer together:
1. Payloads are encoded to their real specification per type (escaped `WIFI:` grammar,
   percent-encoded `mailto:`, normalised `tel:`, scheme-completed URLs).
2. A scan-reliability advisor measures risky design choices (WCAG contrast ratio, quiet zone,
   size, logo coverage vs error correction, payload density) and warns without blocking.
3. No backend: nothing is uploaded, which matters because one type carries a Wi-Fi password.

## Operating Context

- Codes end up printed (posters, cards) or shown on screens; scanning happens on phone cameras in
  uneven light.
- Evaluation happens on desktop browsers via the deployed Vercel URL and the public GitHub repo.

## Capabilities and Constraints

- Types: URL, Text, Email, Phone, Wi-Fi, each with its own draft.
- Live preview re-rendered on every valid change; PNG download taken from the preview canvas;
  SVG download from the same geometry.
- Customisation: size, foreground/background colours, error correction, margin, centre logo.
- 8 presets that stay editable afterwards.
- Recent codes persisted in localStorage; restoring brings back data and design.
- Light/dark theme following system preference and remembering the choice.
- React 19 + TypeScript + Vite 8, hand-written CSS with custom properties, no backend.
- Payloads must never be placed in the URL (Wi-Fi password privacy).
- Hard deadline: public GitHub repo by 4 October 2026.

## Brand Commitments

- Must read as a GDG on Campus SRM project: GDG palette (blue, red, yellow, green) as accents on a
  strong neutral base, developer-community tone, visible "Built for GDG on Campus SRM" attribution.
- Must not use or recreate the official GDG or Google logos; uses its own wordmark/mark.
- Product name: QR Studio.

## Evidence on Hand

- The working tool and its 54-check Playwright suite (decodes rendered canvases with jsQR).
- Live deployment: https://qr-studio-jagpreet-singh1.vercel.app
- No testimonials, user counts, press or benchmarks exist; none may be fabricated.

## Product Principles

1. **Correct before pretty.** A beautiful code that encodes the wrong payload is a failure.
2. **Warn, never block.** Explain and quantify risk; leave the decision with the user.
3. **Private by construction.** No server, no payloads in URLs, no tracking.
4. **Show, don't tell.** Demonstrate the encoding and scan-reliability behaviour with the real engine.

## Accessibility & Inclusion

WCAG 2.2 AA in both themes, full keyboard operation, visible focus, `prefers-reduced-motion`
honoured everywhere.
