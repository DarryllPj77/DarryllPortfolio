import { useCallback, useEffect, useState } from 'react';

export const SIDEBAR_MIN = 200;
export const SIDEBAR_MAX = 420;
export const SIDEBAR_DEFAULT = 256;

const WIDTH_KEY = 'portfolio.sidebar.width';
const COLLAPSED_KEY = 'portfolio.sidebar.collapsed';

export const clampSidebarWidth = (w: number) =>
  Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(w)));

function read<T>(key: string, parse: (raw: string) => T, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : parse(raw);
  } catch {
    return fallback;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode); preference just won't persist */
  }
}

/** Desktop Explorer width and collapsed state, remembered between visits. */
export function useSidebarState() {
  const [width, setWidthState] = useState(() =>
    read(WIDTH_KEY, (raw) => clampSidebarWidth(Number(raw) || SIDEBAR_DEFAULT), SIDEBAR_DEFAULT),
  );
  const [collapsed, setCollapsed] = useState(() =>
    read(COLLAPSED_KEY, (raw) => raw === 'true', false),
  );

  useEffect(() => write(WIDTH_KEY, String(width)), [width]);
  useEffect(() => write(COLLAPSED_KEY, String(collapsed)), [collapsed]);

  const setWidth = useCallback((w: number) => setWidthState(clampSidebarWidth(w)), []);
  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  return { width, setWidth, collapsed, setCollapsed, toggle };
}
