import { useEffect, type RefObject } from 'react';
import { useLocation } from 'react-router';

/**
 * After client-side navigation, start the new view at the top and move focus
 * to its heading, so keyboard and screen-reader users land on the new content.
 * Hash links (e.g. "#pmi-pm-ready") are scrolled by the view itself.
 * The router gives the initial page load the key "default", which is skipped.
 */
export function useViewFocus(ref: RefObject<HTMLElement | null>) {
  const { key, hash } = useLocation();
  useEffect(() => {
    if (key === 'default') return;
    if (!hash) window.scrollTo({ top: 0 });
    ref.current?.focus({ preventScroll: true });
    // Only on mount of a new view: later hash changes are handled by the view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
}
