import type { Bounds } from './companionPlacement';

/** Distance kept from the workspace edges. */
const EDGE = 12;

const cssPx = (name: string) =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;

/**
 * The area the companion roams in: the workspace right of the Explorer,
 * between the top bar and the status bar, in viewport pixels.
 */
export function roamBounds(): Bounds {
  const main = document.getElementById('main');
  const left = Math.max(0, main?.getBoundingClientRect().left ?? 0);
  return {
    left: left + EDGE,
    top: cssPx('--topbar-h') + EDGE,
    right: window.innerWidth - EDGE,
    bottom: window.innerHeight - cssPx('--statusbar-h') - EDGE,
  };
}
