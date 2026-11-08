import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach, beforeEach } from 'vitest';

// Finish animations instantly so tests don't wait on transitions.
MotionGlobalConfig.skipAnimations = true;

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

beforeEach(() => {
  window.innerWidth = 1280;
  window.localStorage.clear();
});

afterEach(() => cleanup());
