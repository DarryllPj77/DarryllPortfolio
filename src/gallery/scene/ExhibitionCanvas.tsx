import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useRef } from 'react';
import { ACESFilmicToneMapping } from 'three';
import type { GalleryProject } from '../data';
import type { OrbitState } from '../orbit/OrbitState';
import { useOrbitDrag } from '../orbit/useOrbitDrag';
import { CameraRig } from './CameraRig';
import { Hall } from './Hall';
import { Orbit } from './Orbit';
import styles from './ExhibitionCanvas.module.css';

interface ExhibitionCanvasProps {
  projects: GalleryProject[];
  orbit: OrbitState;
  /** A case was clicked or tapped. */
  onSelect: (index: number) => void;
  /** The graphics context was lost or could not start: show the HTML exhibition instead. */
  onFail: () => void;
}

/** Phones and tablets draw at most 1.5 device pixels per CSS pixel, desktops 1.75. */
const maxDpr = () => (window.matchMedia('(pointer: coarse)').matches ? 1.5 : 1.75);

/**
 * Moves the ring on each frame and asks for the next frame only while it is moving: a still
 * hall draws nothing. Input wakes it again through the ring's own `wake`.
 */
function OrbitDriver({ orbit }: { orbit: OrbitState }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    orbit.setWake(() => invalidate());
    invalidate();
    return () => orbit.setWake(() => {});
  }, [orbit, invalidate]);
  useFrame((state, dt) => {
    if (orbit.step(dt)) state.invalidate();
  });
  return null;
}

/**
 * The 3D exhibition. It draws a frame only when something changes (`frameloop="demand"`).
 * Purely visual: the HTML controls carry the meaning, so it is hidden from screen readers.
 */
export default function ExhibitionCanvas({ projects, orbit, onSelect, onFail }: ExhibitionCanvasProps) {
  const stage = useRef<HTMLDivElement>(null);
  useOrbitDrag(stage, orbit);

  // A context lost while the scene is mounted counts as a failure; React Three Fiber's own
  // release of the context on unmount does not, so the listener goes when the scene does.
  const loss = useRef<{ el: HTMLCanvasElement; fn: () => void } | null>(null);
  useEffect(
    () => () => {
      loss.current?.el.removeEventListener('webglcontextlost', loss.current.fn);
      loss.current = null;
    },
    [],
  );

  const setHoverCursor = (index: number | null) => {
    if (stage.current && !orbit.isDragging) stage.current.dataset.hover = index === null ? '' : 'case';
  };

  return (
    <div ref={stage} className={styles.stage} aria-hidden="true">
      <Canvas
        frameloop="demand"
        dpr={[1, maxDpr()]}
        camera={{ fov: 30, near: 0.1, far: 60 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          const el = gl.domElement;
          const fn = () => onFail();
          el.addEventListener('webglcontextlost', fn, { once: true });
          loss.current = { el, fn };
        }}
      >
        <OrbitDriver orbit={orbit} />
        {/* The hall first: the camera rig measures its fog from where the camera stands. */}
        <Hall orbit={orbit} />
        <CameraRig />
        <Suspense fallback={null}>
          <Orbit projects={projects} orbit={orbit} onSelect={onSelect} onHover={setHoverCursor} />
        </Suspense>
      </Canvas>
    </div>
  );
}
