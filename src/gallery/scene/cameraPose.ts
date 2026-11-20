import { MathUtils } from 'three';
import { AXLE_Y, FOCUS_POINT } from './layout';
import { framingDistance, framingLift, openDistance } from './placement';

/**
 * The lobby's angled view of its model on a wide screen: a little to the left, turned about 15°.
 * (The wheel itself is always shown square on: see wheelCameraPose.)
 */
const WIDE_YAW = -0.26;
export const yawFor = (aspect: number) => (aspect > 1.15 ? WIDE_YAW : 0);

export interface CameraPose {
  position: [number, number, number];
  look: [number, number, number];
  /** From the camera to the front cabin: the fog is measured from here. */
  distance: number;
}

/**
 * Where the camera stands to show the carousel: at rest (`approach` 0), slightly above and in
 * front of the front case; moved in on an opened case (`approach` 1), level with it. It faces
 * the carousel squarely on every screen, so turning moves the cases straight side to side (and
 * back into depth). `drift` is the small offset that follows the
 * mouse. In the wheel's own coordinates (its stand on the floor at the origin), so the lobby can
 * show its scale model from the very same view.
 */
export function wheelCameraPose(
  fov: number,
  aspect: number,
  approach: number,
  drift: { x: number; y: number } = { x: 0, y: 0 },
): CameraPose {
  const [fx, fy, fz] = FOCUS_POINT;
  const restDistance = framingDistance(fov, aspect);
  const restLookY = fy - framingLift(fov, aspect);
  const distance = MathUtils.lerp(restDistance, openDistance(fov, aspect), approach);
  const lookY = MathUtils.lerp(restLookY, AXLE_Y, approach);
  const rise = MathUtils.lerp(restDistance * 0.07, 0, approach);
  return {
    position: [fx + drift.x, lookY + rise - drift.y, fz + distance],
    look: [fx, lookY, fz],
    distance,
  };
}
