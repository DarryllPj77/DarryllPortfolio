import { useThree } from '@react-three/fiber';
import { useLayoutEffect } from 'react';
import { Fog, type PerspectiveCamera } from 'three';
import { FOCUS_POINT, ORBIT_RADIUS } from './layout';
import { framingDistance, framingLift } from './placement';

/**
 * The resting camera: slightly above and in front of the active case, looking at its centre.
 * The fog is measured from wherever the camera stands, so the front case is always clear and
 * the hall behind the ring always fades to dark, on a phone as on a wide screen.
 */
export function CameraRig() {
  // Three.js objects are changed in place; they are read from the store when needed.
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);

  useLayoutEffect(() => {
    const { scene, invalidate } = get();
    const camera = get().camera as PerspectiveCamera;
    const aspect = size.width / size.height;
    const distance = framingDistance(camera.fov, aspect);
    const [x, fy, z] = FOCUS_POINT;
    const y = fy - framingLift(camera.fov, aspect);
    camera.position.set(x, y + distance * 0.07, z + distance);
    camera.lookAt(x, y, z);
    camera.updateProjectionMatrix();
    if (scene.fog instanceof Fog) {
      scene.fog.near = distance + 1;
      scene.fog.far = distance + ORBIT_RADIUS * 2 + 9;
    }
    invalidate();
  }, [get, size]);

  return null;
}
