const FACTS = [
  ['5 QR types', 'URL, text, email, phone, Wi-Fi'],
  ['PNG + SVG', 'pixel-exact or lossless'],
  ['No sign-up', 'open it and start'],
  ['No server', 'encoded in this tab'],
  ['Offline-friendly', 'keeps working if the connection drops'],
] as const;

export function TrustStrip() {
  return (
    <section className="lp-trust" aria-label="At a glance">
      <ul className="container lp-trust__list">
        {FACTS.map(([fact, detail], i) => (
          <li key={fact} className="lp-trust__item" data-tone={i % 4}>
            <strong>{fact}</strong>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
