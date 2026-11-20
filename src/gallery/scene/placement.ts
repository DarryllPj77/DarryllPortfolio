import { MathUtils } from 'three';
import { turnFor } from '../orbit/orbitPhysics';
import { AXLE_Y, CABIN_TILT, HEX_HALF_HEIGHT, HEX_RADIUS, RECEDE, WHEEL_RADIUS } from './layout';

/** An angle folded into −π … π. */
export const fold = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export interface CabinPlacement {
  /** Where the cabin's centre is around the axle: 0 in front, positive above, negative below. */
  angle: number;
  y: number;
  z: number;
  /** Its small tilt toward the visitor (about the axle's direction). */
  pitch: number;
}

/**
 * Where cabin `index` is when the wheel is turned by `wheelAngle` (0 puts cabin 0 in front of
 * the camera). The cabins are spread evenly round the wheel, the next one waiting below the
 * front and the previous one above, so "next" (scroll down, swipe up, ↓) brings the next
 * project up into view. `emphasis` 1 keeps a cabin on the rim, 0 steps it back along its
 * spoke by RECEDE. `withdraw` (while another project opens) moves it back into the hall at
 * the same height, so a cabin below never sinks through the floor.
 */
export function placeOnWheel(
  index: number,
  wheelAngle: number,
  emphasis: number,
  count: number,
  withdraw = 0,
): CabinPlacement {
  const angle = fold(-index * turnFor(count) - wheelAngle);
  const radius = WHEEL_RADIUS + RECEDE * (1 - emphasis);
  return {
    angle,
    y: AXLE_Y + Math.sin(angle) * radius,
    z: Math.cos(angle) * radius - withdraw,
    pitch: angle * CABIN_TILT,
  };
}

/** Where the rim carries cabin `index` (the point its crossbar and spokes meet). */
export function rimPoint(index: number, wheelAngle: number, count: number): { y: number; z: number } {
  const angle = fold(-index * turnFor(count) - wheelAngle);
  return { y: AXLE_Y + Math.sin(angle) * WHEEL_RADIUS, z: Math.cos(angle) * WHEEL_RADIUS };
}

/**
 * Room kept around the active case. Across: a little either side, so on a narrow phone the
 * case fills about 80% of the width and its neighbours just peek in. Down: space for the
 * placard below it.
 */
const FRAME_W = HEX_RADIUS * 1.25;
const FRAME_H = HEX_HALF_HEIGHT * 2.05;

/**
 * Distance from the active case at which it fits the viewport: on a wide screen its height
 * decides, on a tall phone screen its width does.
 */
export function framingDistance(fovDeg: number, aspect: number): number {
  const tanV = Math.tan(MathUtils.degToRad(fovDeg) / 2);
  return Math.max(FRAME_H / tanV, FRAME_W / (tanV * aspect));
}

/**
 * On a tall screen the width decides the distance, which leaves spare height. The camera then
 * aims this far below the case's centre, raising the case into the space above the placard.
 * On wide screens there is no spare height, so it is 0.
 */
export function framingLift(fovDeg: number, aspect: number): number {
  const tanV = Math.tan(MathUtils.degToRad(fovDeg) / 2);
  const spare = framingDistance(fovDeg, aspect) * tanV - FRAME_H;
  return Math.max(0, spare) * 0.45;
}

/** Share of the view the opened case fills when the camera has moved in. */
const OPEN_FILL = 0.7;

/** Distance from the opened case at which it fills about 70% of the view, whichever way the screen is turned. */
export function openDistance(fovDeg: number, aspect: number): number {
  const tanV = Math.tan(MathUtils.degToRad(fovDeg) / 2);
  return Math.max(HEX_HALF_HEIGHT / (OPEN_FILL * tanV), HEX_RADIUS / (OPEN_FILL * tanV * aspect));
}
