/**
 * Motion tokens. Every animation in the app uses these values so timing and
 * easing feel consistent. Mirrors the --dur-* / --ease-out CSS variables.
 */
export const duration = {
  /** Hover, focus, small UI feedback. */
  fast: 0.18,
  /** Standard UI transitions: panels, menus, content entering. */
  base: 0.3,
  /** Larger section-level transitions. */
  section: 0.5,
  /** Leaving content: short, so navigation never feels delayed. */
  exit: 0.14,
} as const;

export const ease = {
  /** Default: quick start, gentle settle. */
  out: [0.22, 1, 0.36, 1] as [number, number, number, number],
  /** For things that move and stop in place (progress lines). */
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
};

export const stagger = {
  tight: 0.04,
  base: 0.07,
} as const;

/** Small vertical offset used by entrances. Never large. */
export const rise = 12;
