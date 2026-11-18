/**
 * Interaction state for the avatar. One state at a time, chosen by priority,
 * so nothing fights over the model:
 *
 *   turning > waving > (companion activity) > pointerTracking > idle
 *
 * - turning: the visitor rotates the large avatar with a sideways drag (phones only now).
 * - waving: the Wave clip plays.
 * - companion activity, set by the workspace companion:
 *   - grabbed: pressed and lifted, about to be carried.
 *   - dragging: carried under the pointer; it floats, turns toward where it goes and leans.
 *   - dropping: easing into a valid destination after release.
 *   - settling: landed; a moment to come to rest before idle.
 *   - returning: released somewhere invalid, going back to where it was.
 *   - moving: gliding to a clicked file, link or empty spot.
 *   - talking: a speech bubble is open; a small nod and sway on top of Idle.
 *   - lookingAround: a short head sweep after arriving at an empty spot.
 * - pointerTracking: Idle clip plus a small head/torso turn toward the pointer.
 * - idle: Idle clip (or the still Neutral pose with reduced motion).
 */
export type CompanionActivity =
  | 'grabbed'
  | 'dragging'
  | 'dropping'
  | 'settling'
  | 'returning'
  | 'moving'
  | 'talking'
  | 'lookingAround'
  | null;

export type AvatarState = 'idle' | 'pointerTracking' | 'turning' | 'waving' | NonNullable<CompanionActivity>;

/** Activities in which the avatar travels: it floats, leans and faces its direction. */
export const TRAVELLING: ReadonlySet<AvatarState> = new Set([
  'dragging',
  'dropping',
  'returning',
  'moving',
]);

export interface AvatarFlags {
  turning: boolean;
  waving: boolean;
  /** A fine pointer (mouse/trackpad) is over the page and tracking is allowed. */
  pointerActive: boolean;
  activity?: CompanionActivity;
}

export function resolveAvatarState({
  turning,
  waving,
  pointerActive,
  activity = null,
}: AvatarFlags): AvatarState {
  if (turning) return 'turning';
  if (waving) return 'waving';
  if (activity) return activity;
  if (pointerActive) return 'pointerTracking';
  return 'idle';
}

/**
 * Shared, mutable input for the model. Written by DOM handlers in the main
 * bundle, read every frame inside the canvas, so pointer movement never
 * causes React re-renders.
 */
export interface AvatarInput {
  /** Pointer position relative to the avatar, each axis clamped to -1..1. */
  pointer: { x: number; y: number };
  /** Horizontal drag rotation in radians, relative to the presentation angle. */
  dragYaw: number;
  /** Direction of travel: -1 left, 1 right, 0 straight up or down (fractions while carried). */
  travelDir: number;
  /** When the current companion activity began (performance.now(), in ms). */
  activityStart: number;
  /** When the Home introduction's entrance began (performance.now(), in ms); 0 when none. */
  entranceStart: number;
}

export const createAvatarInput = (): AvatarInput => ({
  pointer: { x: 0, y: 0 },
  dragYaw: 0,
  travelDir: 0,
  activityStart: 0,
  entranceStart: 0,
});

/** Rotation limits, in radians. Kept small on purpose. */
export const LIMITS = {
  /** Head turn toward the pointer: about 15° sideways, 8° up/down. */
  headYaw: 0.26,
  headPitch: 0.14,
  /** Share of the sideways turn taken by the upper body. */
  torsoShare: 0.3,
  /** Drag rotation either side of the presentation angle: about 30°. */
  dragYaw: 0.52,
  /** Body turn toward the direction of travel: about 34°. */
  travelYaw: 0.6,
} as const;

/** Length of the look-around after arriving at an empty spot, in seconds. */
export const LOOK_AROUND_SECONDS = 1.8;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * When the canvas renders: never off screen; continuously while something
 * moves; on demand (only after a change) when reduced motion leaves it still.
 */
export function chooseFrameloop(
  active: boolean,
  reducedMotion: boolean,
  state: AvatarState,
): 'always' | 'demand' | 'never' {
  if (!active) return 'never';
  const moving = !reducedMotion || state === 'waving' || state === 'turning';
  return moving ? 'always' : 'demand';
}
