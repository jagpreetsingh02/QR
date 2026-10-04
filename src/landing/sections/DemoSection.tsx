import { useEffect, useRef } from 'react';
import { Reveal } from '../Reveal';

/**
 * A 28-second motion tour made from real app screens. It loads only
 * when scrolled near, plays muted while in view, and never autoplays under
 * reduced motion; the native controls are always there.
 */
export function DemoSection() {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = video.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (el.preload === 'none') el.preload = 'auto';
          if (!still) void el.play().catch(() => {});
        } else if (!el.paused) el.pause();
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="lp-section lp-demo" id="demo" aria-labelledby="demo-title">
      <div className="container">
        <Reveal className="lp-section__head">
          <h2 id="demo-title" className="type-display-l">
            QR Studio in 28 seconds.
          </h2>
          <p className="type-body-l">
            A short motion tour made from the real app. Every screen and code in it comes from the studio, and the
            photo codes decode.
          </p>
        </Reveal>
        <div className="lp-demo__frame">
          <video
            ref={video}
            className="lp-demo__video"
            width={1280}
            height={720}
            poster="/demo/qr-studio-demo.jpg"
            preload="none"
            muted
            loop
            playsInline
            controls
            aria-label="Motion tour of QR Studio: the studio, photo QR codes, the scan check and the end card"
          >
            <source src="/demo/qr-studio-demo.webm" type="video/webm" />
            <source src="/demo/qr-studio-demo.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
}
