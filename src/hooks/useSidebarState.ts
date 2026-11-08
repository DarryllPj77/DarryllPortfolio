import { useCallback, useState } from 'react';

export const SIDEBAR_MIN = 200;
export const SIDEBAR_MAX = 420;
export const SIDEBAR_DEFAULT = 256;

/** Below this width the Explorer starts collapsed so the top nav leads. */
const WIDE_DESKTOP = '(min-width: 1280px)';

const WIDTH_KEY = 'portfolio.sidebar.width';
const COLLAPSED_KEY = 'portfolio.sidebar.collapsed';

export const clampSidebarWidth = (w: number) =>
  Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(w)));

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode); preference just won't persist */
  }
}

/**
 * Desktop Explorer width and collapsed state. Only explicit choices are
 * remembered; until then the default depends on the screen width.
 */
export function useSidebarState() {
  const [width, setWidthState] = useState(() => {
    const stored = Number(read(WIDTH_KEY));
    return stored ? clampSidebarWidth(stored) : SIDEBAR_DEFAULT;
  });
  const [collapsed, setCollapsedState] = useState(() => {
    const stored = read(COLLAPSED_KEY);
    if (stored !== null) return stored === 'true';
    return !window.matchMedia(WIDE_DESKTOP).matches;
  });

  const setWidth = useCallback((w: number) => {
    const next = clampSidebarWidth(w);
    setWidthState(next);
    write(WIDTH_KEY, String(next));
  }, []);

  const toggle = useCallback(() => {
    setCollapsedState((c) => {
      write(COLLAPSED_KEY, String(!c));
      return !c;
    });
  }, []);

  return { width, setWidth, collapsed, toggle };
}
