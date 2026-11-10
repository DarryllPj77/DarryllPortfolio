import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

/** jsdom has no layout engine; evaluate min/max-width queries against innerWidth. */
function matches(query: string): boolean {
  const width = window.innerWidth;
  const min = /min-width:\s*([\d.]+)px/.exec(query);
  const max = /max-width:\s*([\d.]+)px/.exec(query);
  if (min && width < Number(min[1])) return false;
  if (max && width > Number(max[1])) return false;
  if (query.includes('prefers-reduced-motion')) return false;
  return Boolean(min || max);
}

window.matchMedia = (query: string) =>
  ({
    matches: matches(query),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;

window.scrollTo = () => {};
Element.prototype.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

// jsdom has no IntersectionObserver; reveal-on-scroll elements just show.
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// jsdom has no canvas/WebGL. Report "no context", like a device without WebGL,
// so the avatar uses its fallback (and jsdom doesn't log "not implemented").
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;

beforeEach(() => {
  window.innerWidth = 1280;
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => cleanup());
