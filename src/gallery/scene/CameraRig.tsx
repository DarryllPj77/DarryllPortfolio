import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Fog, type PerspectiveCamera } from 'three';
import type { ShowState } from '../show/ShowState';
import { wheelCameraPose } from './cameraPose';
import { WHEEL_DEPTH } from './layout';

/** How far the camera drifts with the mouse, in scene units: about two degrees of view. */
const PARALLAX = { x: 0.35, y: 0.18 };

/**
 * The camera. At rest it stands slightly above and in front of the wheel's front cabin, looking
 * at its centre; as a case opens it moves in level with it until it fills most of the view.
 * On a desktop with a mouse it drifts very slightly with the pointer, which gives the hall
 * depth. The fog is measured from wherever the camera stands, so the case it looks at is
 * always clear and the hall behind always fades to dark.
 */
export function CameraRig({ show }: { show: ShowState }) {
  const get = useThree((s) => s.get);
  const invalidate = useThree((s) => s.invalidate);

  /** Pointer position, −1…1 each way, and the camera's eased follow of it. */
  const pointer = useRef({ x: 0, y: 0 });
  const drift = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMove = (e: PointerEvent) => {
      if (!fine.matches || reduced.matches || e.pointerType !== 'mouse') return;
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      invalidate();
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [invalidate]);

  useFrame((state, dt) => {
    const camera = state.camera as PerspectiveCamera;
    const aspect = state.size.width / state.size.height;

    // The mouse drift, eased; none while a case is open or opening.
    const browsing = show.phase === 'browsing';
    const target = browsing ? pointer.current : { x: 0, y: 0 };
    const k = 1 - Math.exp(-dt * 4);
    drift.current.x += (target.x - drift.current.x) * k;
    drift.current.y += (target.y - drift.current.y) * k;
    if (Math.abs(target.x - drift.current.x) + Math.abs(target.y - drift.current.y) > 1e-3) state.invalidate();

    const pose = wheelCameraPose(camera.fov, aspect, show.approach, {
      x: drift.current.x * PARALLAX.x,
      y: drift.current.y * PARALLAX.y,
    });
    camera.position.set(...pose.position);
    camera.lookAt(...pose.look);

    const { scene } = get();
    if (scene.fog instanceof Fog) {
      scene.fog.near = pose.distance + 1;
      scene.fog.far = pose.distance + WHEEL_DEPTH * 2 + 9;
    }
  });

  return null;
}
