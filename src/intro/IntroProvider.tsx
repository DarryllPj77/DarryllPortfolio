import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { INTRO_SEEN_KEY, IntroContext, shouldPlayIntro } from './introContext';

export function IntroProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(shouldPlayIntro);

  // Mark as seen as soon as it starts, so a reload mid-intro doesn't replay it.
  useEffect(() => {
    if (!active) return;
    try {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
  }, [active]);

  const finish = useCallback(() => setActive(false), []);
  const value = useMemo(() => ({ active, finish }), [active, finish]);

  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}
