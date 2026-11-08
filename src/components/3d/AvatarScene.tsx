import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useLayoutEffect, useRef } from 'react';
import { NeutralToneMapping, PerspectiveCamera } from 'three';
import { avatarConfig, type AvatarFraming } from './avatar.config';
import type { AvatarSceneProps } from './avatar.types';
import AvatarModel from './AvatarModel';
import { frameCamera } from './avatarFraming';
import { chooseFrameloop } from './avatarInteraction';

/** Points the camera for the current framing. Re-runs when the canvas resizes. */
function CameraRig({ framing }: { framing: AvatarFraming }) {
  const get = useThree((s) => s.get);
  const { width, height } = useThree((s) => s.size);

  useLayoutEffect(() => {
    const { camera: cam, invalidate } = get();
    const camera = cam as PerspectiveCamera;
    const { centerX, centerY, distance } = frameCamera(framing, width, height, camera.fov);
    camera.position.set(centerX, centerY, distance);
    camera.lookAt(centerX, centerY, 0);
    camera.near = distance / 10;
    camera.far = distance * 10;
    camera.updateProjectionMatrix();
    invalidate();
  }, [get, framing, width, height]);

  return null;
}

/** Restrained lighting: soft slate fill, one neutral key, a faint indigo rim to separate dark hair from the page. */
function Lights() {
  return (
    <>
      <hemisphereLight args={['#cbd5e1', '#0f172a', 1.6]} />
      <directionalLight position={[2.5, 3.5, 4]} intensity={2.2} color="#f8fafc" />
      <directionalLight position={[-3, 2.5, -3]} intensity={1.4} color="#818cf8" />
    </>
  );
}

/**
 * The 3D avatar: a transparent canvas with no floor, background or effects.
 * Loaded lazily by AvatarSlot, so three.js never ships in the main bundle.
 *
 * Rendering: continuous only while it's visible and something moves (idle
 * animation, a wave, a drag). With reduced motion it renders on demand.
 * Off screen it stops completely.
 */
export default function AvatarScene({
  active,
  framing,
  state,
  input,
  waveId,
  reducedMotion,
  onWaveEnd,
  onReady,
  onError,
}: AvatarSceneProps) {
  const frameloop = chooseFrameloop(active, reducedMotion, state);

  // React Three Fiber releases the WebGL context itself on unmount, which also
  // fires "webglcontextlost" (asynchronously). Only a loss while this scene is
  // mounted counts as a failure, so the listener is removed on unmount.
  const lossListener = useRef<{ el: HTMLCanvasElement; fn: () => void } | null>(null);
  useEffect(
    () => () => {
      const l = lossListener.current;
      l?.el.removeEventListener('webglcontextlost', l.fn);
      lossListener.current = null;
    },
    [],
  );

  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.5]}
      camera={{ fov: avatarConfig.fov, position: [0, 1.2, 6] }}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      onCreated={({ gl }) => {
        gl.toneMapping = NeutralToneMapping;
        gl.setClearColor(0x000000, 0);
        const el = gl.domElement;
        const fn = () => onError();
        lossListener.current?.el.removeEventListener('webglcontextlost', lossListener.current.fn);
        el.addEventListener('webglcontextlost', fn, { once: true });
        lossListener.current = { el, fn };
      }}
    >
      <CameraRig framing={framing} />
      <Lights />
      <Suspense fallback={null}>
        <AvatarModel
          state={state}
          input={input}
          waveId={waveId}
          reducedMotion={reducedMotion}
          restYaw={framing.yaw}
          onWaveEnd={onWaveEnd}
          onReady={onReady}
        />
      </Suspense>
    </Canvas>
  );
}
