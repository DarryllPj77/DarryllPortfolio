import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { getViewMeta, normalizePath } from '../data/navigation';

const MAX_TABS = 5;

/**
 * Tracks recently opened views as workspace tabs.
 * Opening a view adds a tab; closing the active tab moves to a neighbour.
 */
export function useOpenTabs(pathname: string) {
  const navigate = useNavigate();
  const current = normalizePath(pathname);
  const [tabs, setTabs] = useState<string[]>(() => (getViewMeta(current).known ? [current] : []));

  // Adjust state during render when the route changes (avoids an extra effect pass).
  const [lastPath, setLastPath] = useState(current);
  if (lastPath !== current) {
    setLastPath(current);
    if (getViewMeta(current).known && !tabs.includes(current)) {
      const next = [...tabs, current];
      setTabs(next.length > MAX_TABS ? next.slice(next.length - MAX_TABS) : next);
    }
  }

  const close = useCallback(
    (path: string) => {
      const index = tabs.indexOf(path);
      if (index === -1) return;
      const next = tabs.filter((t) => t !== path);
      setTabs(next);
      if (path === current) {
        navigate(next[Math.min(index, next.length - 1)] ?? '/');
      }
    },
    [tabs, current, navigate],
  );

  return { tabs, current, close };
}
