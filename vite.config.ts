/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig, type Connect, type Plugin } from 'vite';

/**
 * The Gallery is its own page (gallery.html) with its own bundle. In development and
 * preview, /gallery serves that page, as vercel.json does in production; every other path
 * falls through to the portfolio.
 */
const galleryRoute = (): Plugin => {
  const rewrite: Connect.NextHandleFunction = (req, _res, next) => {
    const match = req.url ? /^\/gallery\/?(\?.*)?$/.exec(req.url) : null;
    if (match) req.url = `/gallery.html${match[1] ?? ''}`;
    next();
  };
  return {
    name: 'gallery-route',
    configureServer: (server) => void server.middlewares.use(rewrite),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite),
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), galleryRoute()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        gallery: resolve(import.meta.dirname, 'gallery.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
