import { MathUtils } from 'three';
import { turnFor } from '../orbit/orbitPhysics';
import { AXLE_Y, CABIN_TILT, HEX_HALF_HEIGHT, HEX_RADIUS, RECEDE, WHEEL_DEPTH, WHEEL_RADIUS } from './layout';

/** An angle folded into −π … π. */
export const fold = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export interface CabinPlacement {
  /** Where the case is around the ring: 0 in front, positive to the left, negative to the right. */
  angle: number;
  x: number;
  y: number;
  z: number;
  /** Its small turn toward the visitor (about the vertical axis). */
  yaw: number;
}

/**
 * Where case `index` is when the ring is turned by `wheelAngle` (0 puts case 0 in front of the
 * camera). The cases are spread evenly round the ring, the next one waiting to the right of the
 * front and the previous one to the left, so "next" (scroll down, swipe left, → or ↓) brings
 * the next project in from the right. The path is a level circle about a vertical axis,
 * stretched in depth (WHEEL_DEPTH against WHEEL_RADIUS). `emphasis` 1 keeps a case on the
 * path, 0 steps it RECEDE further back. `withdraw` (while another project opens) moves it
 * further back into the hall.
 */
export function placeOnWheel(
  index: number,
  wheelAngle: number,
  emphasis: number,
  count: number,
  withdraw = 0,
): CabinPlacement {
  const angle = fold(-index * turnFor(count) - wheelAngle);
  return {
    angle,
    x: -Math.sin(angle) * WHEEL_RADIUS,
    y: AXLE_Y,
    z: Math.cos(angle) * WHEEL_DEPTH - RECEDE * (1 - emphasis) - withdraw,
    yaw: -angle * CABIN_TILT,
  };
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
