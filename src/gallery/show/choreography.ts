/**
 * The exhibition's choreography as pure functions: given how far along a moment is, where
 * everything should be. No timers here; the scene's frame loop supplies the time. That keeps
 * every moment exact, reversible (closing is opening played backwards) and testable.
 */
import { turnFor } from '../orbit/orbitPhysics';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Progress of a step that runs from `start` to `end` (both 0…1 of the whole moment). */
const span = (t: number, start: number, end: number) => clamp01((t - start) / (end - start));
/** Quick start, gentle settle: the house easing. */
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Entrance length, in seconds: the full arrival once per tab, a short one after (and on stepping
 * in from the lobby), and a fade with reduced motion.
 */
export const ENTRANCE = { full: 3.2, short: 0.8, reduced: 0.3 } as const;
export type EntranceKind = keyof typeof ENTRANCE;
/** Opening and closing a project, in seconds. */
export const OPENING = { open: 0.8, close: 0.6, reduced: 0.25 } as const;
/**
 * How far into the opening the HTML presentation takes over from the 3D scene: once the
 * camera has arrived, so the page's screenshot starts exactly where the 3D screen rests (and
 * closing returns it to the same place).
 */
export const HANDOFF = 1;

export interface EntrancePose {
  /** Light in the hall (ambient, floor, reflections), 0…1. */
  hall: number;
  /** The exhibit spotlight, 0…1. */
  lamp: number;
  /** Extra ring turn while it assembles, radians (0 when settled). */
  turn: number;
  /** How far each case still is behind its place, in scene units (0 when arrived). */
  depth: number[];
  /** Whether the placard and controls have appeared. */
  ui: boolean;
}

/**
 * The arrival, at progress `t` (0…1):
 * - 0–19%: darkness lifts, the floor light rises.
 * - 12–60%: the three cases emerge from deep in the fog, one after another.
 * - 44–75%: the ring turns into place and slows to a stop.
 * - 69–94%: the spotlight finds the front case; the placard appears.
 * With reduced motion nothing travels: the hall and the light simply fade up.
 */
export function entrancePose(t: number, count: number, reduced = false): EntrancePose {
  if (reduced) {
    const f = easeOut(clamp01(t));
    return { hall: f, lamp: f, turn: 0, depth: Array(count).fill(0), ui: t >= 0.5 };
  }
  return {
    hall: easeOut(span(t, 0, 0.19)),
    lamp: easeOut(span(t, 0.69, 0.94)),
    turn: (1 - easeOut(span(t, 0.44, 0.75))) * turnFor(count) * 0.5,
    depth: Array.from({ length: count }, (_, i) => (1 - easeOut(span(t, 0.12 + i * 0.07, 0.42 + i * 0.09))) * 16),
    ui: t >= 0.72,
  };
}

export interface OpeningPose {
  /** How far the other cases have withdrawn outward, scene units. */
  withdraw: number;
  /** Brightness kept by the other cases, 0…1. */
  others: number;
  /** Hall light, 0…1. */
  hall: number;
  /** Spotlight, 0…1. */
  lamp: number;
  /** How far the camera has moved in toward the opened case, 0…1. */
  approach: number;
}

/**
 * Opening the front case, at progress `p` (0 browsing … 1 open): the other cases recede and
 * dim, the hall darkens, the spotlight stays on the chosen case and the camera moves in until
 * it fills most of the view. Closing plays it backwards. With reduced motion the camera stays
 * where it is: only the light changes, and the presentation crossfades in.
 */
export function openingPose(p: number, reduced = false): OpeningPose {
  const e = easeInOut(clamp01(p));
  return {
    withdraw: reduced ? 0 : 3 * e,
    others: 1 - 0.85 * e,
    hall: 1 - 0.6 * e,
    lamp: 1 - 0.15 * e,
    approach: reduced ? 0 : e,
  };
}
