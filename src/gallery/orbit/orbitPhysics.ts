/**
 * The physics of a turning exhibit (a ring or a wheel of `count` cases), as pure functions:
 * no React, no three.js, so it can be tested exactly. The axis it turns about is the
 * presentation's business; here there is only an angle.
 *
 * Angles are the turn in radians. A "stop" is a turn that puts one case squarely in front of
 * the camera: 0, ±turn, ±2·turn…, where one turn is a full circle divided by the number of
 * cases. Turning by +turn brings the previous case to the front.
 */

/** The angle between neighbouring cases: a full circle shared out evenly, never padded. */
export const turnFor = (count: number) => (Math.PI * 2) / count;

/** The fastest the ring may turn, in radians per second: a hard fling never becomes a spin. */
export const MAX_SPEED = 6;

export interface Spring {
  stiffness: number;
  damping: number;
  maxSpeed: number;
}

/** Spring for settling on a stop: critically damped, so it arrives without bouncing (≈0.6 s). */
export const SPRING: Spring = { stiffness: 90, damping: 2 * Math.sqrt(90), maxSpeed: MAX_SPEED };
/**
 * With reduced motion: a short, direct move (the new case is in front within about 0.25 s)
 * and no carried momentum. Fast on purpose, so it is not held to the drag speed limit.
 */
export const SPRING_REDUCED: Spring = { stiffness: 420, damping: 2 * Math.sqrt(420), maxSpeed: 40 };
/** How far ahead a release's momentum is projected when choosing where to stop, in seconds. */
export const PROJECTION = 0.18;

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** The nearest stop to an angle. */
export const nearestStop = (angle: number, count: number) => Math.round(angle / turnFor(count)) * turnFor(count);

/** Which case is in front at a stop (or nearest to the front at any angle). */
export const caseAt = (angle: number, count: number) => mod(-Math.round(angle / turnFor(count)), count);

/** The stop that brings case `index` to the front, reached the short way from `angle`. */
export function stopFor(index: number, angle: number, count: number): number {
  const base = -index * turnFor(count);
  const turns = Math.round((angle - base) / (Math.PI * 2));
  return base + turns * Math.PI * 2;
}

/**
 * The ring follows the hand one-to-one for a full case either way from where the drag began;
 * past that it resists (a quarter as far), so no single drag can wind it round.
 */
export function rubberBand(offset: number, count: number): number {
  const limit = turnFor(count);
  const over = Math.abs(offset) - limit;
  return over <= 0 ? offset : Math.sign(offset) * (limit + over * 0.25);
}

/**
 * Where a release settles: the stop nearest to where its momentum would carry it, but never
 * more than one case from the stop the drag began at.
 */
export function releaseTarget(angle: number, velocity: number, startStop: number, count: number): number {
  const turn = turnFor(count);
  const projected = angle + clampSpeed(velocity) * PROJECTION;
  const steps = Math.max(-1, Math.min(1, Math.round((projected - startStop) / turn)));
  return startStop + steps * turn;
}

export const clampSpeed = (v: number) => Math.max(-MAX_SPEED, Math.min(MAX_SPEED, v));

/** The longest frame the spring keeps time through; longer ones (a tab coming back) are cut to this. */
export const MAX_FRAME_S = 0.25;

/**
 * One step of the settling spring, integrated in small fixed sub-steps so a slow frame can
 * never make it overshoot or explode. It keeps real time through slow frames (a slow device
 * sees fewer frames of the same turn, not a turn in slow motion).
 */
export function stepSpring(
  angle: number,
  velocity: number,
  target: number,
  dt: number,
  spring: Spring = SPRING,
): { angle: number; velocity: number } {
  let x = angle;
  let v = velocity;
  let left = Math.min(dt, MAX_FRAME_S);
  while (left > 1e-6) {
    const h = Math.min(left, 1 / 240);
    v += (spring.stiffness * (target - x) - spring.damping * v) * h;
    v = Math.max(-spring.maxSpeed, Math.min(spring.maxSpeed, v));
    x += v * h;
    left -= h;
  }
  return { angle: x, velocity: v };
}

/** Close enough to a stop to stand still there (within 0.06°, far below what the eye sees). */
export const isSettled = (angle: number, velocity: number, target: number) =>
  Math.abs(angle - target) < 1e-3 && Math.abs(velocity) < 1e-2;

/**
 * How much case `index` is "in front" at a ring angle: 1 squarely in front, falling smoothly
 * to 0 by 60% of the way to the next position. Drives its brightness, its lit edge and how
 * far it steps back, so focus moves with the ring instead of switching.
 */
export function emphasisOf(index: number, angle: number, count: number): number {
  const turn = turnFor(count);
  const offset = Math.atan2(Math.sin(index * turn + angle), Math.cos(index * turn + angle));
  const t = Math.max(0, 1 - Math.abs(offset) / (turn * 0.6));
  return t * t * (3 - 2 * t);
}
