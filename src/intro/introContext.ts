import { createContext, useContext } from 'react';

export interface IntroState {
  /** True while the intro overlay is showing. */
  active: boolean;
  /** Ends the intro (skip or natural finish). */
  finish: () => void;
}

export const IntroContext = createContext<IntroState>({ active: false, finish: () => {} });

export const useIntro = () => useContext(IntroContext);

export const INTRO_SEEN_KEY = 'portfolio.intro.seen';

/**
 * Play only when a visitor lands on the home page, once per browser session,
 * and never for visitors who prefer reduced motion.
 */
export function shouldPlayIntro(): boolean {
  try {
    if (window.location.pathname !== '/') return false;
    if (window.sessionStorage.getItem(INTRO_SEEN_KEY)) return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return true;
  } catch {
    return false;
  }
}
