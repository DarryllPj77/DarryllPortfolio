import { useEffect, type RefObject } from 'react';
import { useLocation } from 'react-router';

/**
 * After client-side navigation, move focus to the new view's heading and
 * scroll the workspace to the top, so keyboard and screen-reader users land
 * on the new content. The router gives the initial page load the key
 * "default", which lets us skip focusing on first load.
 */
export function useViewFocus(ref: RefObject<HTMLElement | null>) {
  const { key } = useLocation();
  useEffect(() => {
    if (key === 'default') return;
    document.getElementById('main')?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
    ref.current?.focus({ preventScroll: true });
  }, [key, ref]);
}
