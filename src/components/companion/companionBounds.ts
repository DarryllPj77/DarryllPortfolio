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

/**
 * Where the avatar may be put down: anywhere on the visible page between the top bar
 * and the status bar (Explorer included), fully on screen, so it can always be seen
 * and grabbed again. Nothing it could be dropped behind is above it but the top bar.
 */
export function freeBounds(): Bounds {
  // On phones the status bar is the end of the page, not pinned to the screen.
  const bar = document.querySelector('body footer');
  const pinned = bar ? getComputedStyle(bar).position !== 'static' : true;
  return {
    left: EDGE / 2,
    top: cssPx('--topbar-h') + EDGE / 2,
    right: window.innerWidth - EDGE / 2,
    bottom: window.innerHeight - (pinned ? cssPx('--statusbar-h') : 0) - EDGE / 2,
  };
}
