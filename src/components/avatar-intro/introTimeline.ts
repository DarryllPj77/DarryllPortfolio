/**
 * The Home avatar introduction: Real Darryll → identity scan → portrait split →
 * digital portal → 3D Darryll emerges → the interactive avatar.
 *
 *   portrait → scanning → opening → emerging → ready
 *                              └──(model failed)──→ failed → portrait (photo only)
 *
 * Every page load starts at the portrait and waits for the click. Once it has played,
 * coming back to Home on the same load starts at `ready`, and the avatar comes and goes
 * with its normal movement.
 */
export type IntroPhase = 'portrait' | 'scanning' | 'opening' | 'emerging' | 'ready' | 'failed';

/** Timings in milliseconds, from the click. The whole change takes about 1.45 s. */
export const INTRO = {
  /** A cyan line sweeps across the portrait and stops where the fracture runs. */
  scan: 260,
  /** The fracture draws along the line's end. */
  seam: 120,
  /** The two doors swing open; the portal frame and labels draw in. */
  open: 520,
  /** From the doors starting to open to the 3D model starting to emerge. */
  emergeAfter: 220,
  /** The model rises out of the portal: fade, scale .65 → 1, depth and a small rise. */
  emerge: 750,
  /** From the model starting to emerge to the doors and portal fading away. */
  doorsFadeAfter: 500,
  doorsFade: 350,
  /** From the model starting to emerge to the avatar being ready (Idle, interactive). */
  readyAfter: 850,
  /** Reduced motion: no scan, split or travel; a short crossfade instead. */
  crossfade: 200,
  /** Longest wait for the model with the portal open before giving up. */
  modelTimeout: 10000,
  /** How long "Avatar unavailable" shows before the photo stays on its own. */
  failedHold: 1400,
} as const;

/** The model's own entrance, used by the 3D scene. */
export const ENTRANCE = { from: 0.65, depth: 0.6, rise: 0.1 } as const;

/** Phases where the portrait (or its doors) still covers the avatar. */
export const isCovered = (phase: IntroPhase) => phase === 'portrait' || phase === 'scanning' || phase === 'opening' || phase === 'failed';

/**
 * Played already on this page load: the hero then starts with the avatar ready, so moving
 * around the portfolio and coming back to Home never replays it. Kept in memory only, so
 * every load or reload starts again at the real portrait and waits for the click.
 */
let played = false;

export function introDone(): boolean {
  return played;
}

export function markIntroDone(): void {
  played = true;
}

/** For tests: back to a fresh page load. */
export function resetIntro(): void {
  played = false;
}

/** Ease-out cubic, for the model's entrance. */
export const easeOut = (t: number) => 1 - (1 - t) ** 3;
