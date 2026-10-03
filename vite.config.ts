import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Preloads the two latin font files the first screen needs (display + text),
 * so the hero text does not wait on CSS discovery to fetch them.
 */
function preloadHeroFonts(): Plugin {
  return {
    name: 'preload-hero-fonts',
    enforce: 'post',
    transformIndexHtml(html, ctx) {
      if (!ctx.bundle) return html;
      const files = Object.keys(ctx.bundle).filter((f) => /(figtree|bricolage-grotesque)-latin-wght-normal-.*\.woff2$/.test(f));
      return {
        html,
        tags: files.map((f) => ({
          tag: 'link',
          attrs: { rel: 'preload', href: `/${f}`, as: 'font', type: 'font/woff2', crossorigin: '' },
          injectTo: 'head' as const,
        })),
      };
    },
  };
}

export default defineConfig({
  plugins: [react(), preloadHeroFonts()],
});
