/**
 * Interaction state for the avatar. One state at a time, chosen by priority,
 * so drag, wave, pointer tracking and idle never fight over the model:
 *
 *   dragging > waving > pointerTracking > idle
 *
 * - dragging: the visitor rotates the avatar; head tracking eases to centre.
 * - waving: the Wave clip plays; drag and tracking are paused.
 * - pointerTracking: Idle clip plus a small head/torso turn toward the pointer.
 * - idle: Idle clip (or the still Neutral pose with reduced motion).
 */
export type AvatarState = 'idle' | 'pointerTracking' | 'dragging' | 'waving';

export interface AvatarFlags {
  dragging: boolean;
  waving: boolean;
  /** A fine pointer (mouse/trackpad) is over the page and tracking is allowed. */
  pointerActive: boolean;
}

export function resolveAvatarState({ dragging, waving, pointerActive }: AvatarFlags): AvatarState {
  if (dragging) return 'dragging';
  if (waving) return 'waving';
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
}

export const createAvatarInput = (): AvatarInput => ({ pointer: { x: 0, y: 0 }, dragYaw: 0 });

/** Rotation limits, in radians. Kept small on purpose. */
export const LIMITS = {
  /** Head turn toward the pointer: about 15° sideways, 8° up/down. */
  headYaw: 0.26,
  headPitch: 0.14,
  /** Share of the sideways turn taken by the upper body. */
  torsoShare: 0.3,
  /** Drag rotation either side of the presentation angle: about 30°. */
  dragYaw: 0.52,
} as const;

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
  const moving = !reducedMotion || state === 'waving' || state === 'dragging';
  return moving ? 'always' : 'demand';
}
