import { useCallback, useSyncExternalStore } from 'react';

export const breakpoints = {
  /** ≥ 1024px: full workspace shell. */
  desktop: '(min-width: 1024px)',
  /** < 768px: mobile layout. */
  mobile: '(max-width: 767.98px)',
} as const;

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export type LayoutMode = 'desktop' | 'tablet' | 'mobile';

export function useLayoutMode(): LayoutMode {
  const isDesktop = useMediaQuery(breakpoints.desktop);
  const isMobile = useMediaQuery(breakpoints.mobile);
  if (isDesktop) return 'desktop';
  return isMobile ? 'mobile' : 'tablet';
}
