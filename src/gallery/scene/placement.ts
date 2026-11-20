import { MathUtils } from 'three';
import { FACING_SHARE, HEX_HALF_HEIGHT, HEX_RADIUS, ORBIT_RADIUS, RECEDE } from './layout';

/** A third of a turn: the cases stand 120° apart. */
export const TURN = (Math.PI * 2) / 3;

/** An angle folded into −π … π. */
export const fold = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export interface Placement {
  x: number;
  z: number;
  /** The case's own turn about its vertical axis. */
  yaw: number;
}

/**
 * Where case `index` stands when the ring is turned by `ringAngle` (0 puts case 0 in front of
 * the camera). `emphasis` 1 keeps a case on the ring, 0 steps it back by RECEDE. Each case
 * turns only part of the way with the ring, so the side cases still show their screens.
 */
export function placeOnRing(index: number, ringAngle: number, emphasis: number): Placement {
  const angle = fold(index * TURN + ringAngle);
  const radius = ORBIT_RADIUS + RECEDE * (1 - emphasis);
  return { x: Math.sin(angle) * radius, z: Math.cos(angle) * radius, yaw: angle * FACING_SHARE };
}

/**
 * Room kept around the active case. Across: a little either side, so on a narrow phone the
 * case fills about 80% of the width and its neighbours just peek in. Down: space for the
 * placard below it.
 */
const FRAME_W = HEX_RADIUS * 1.25;
const FRAME_H = HEX_HALF_HEIGHT * 1.85;

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
