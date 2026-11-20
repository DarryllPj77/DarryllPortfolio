import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useRef } from 'react';
import { ACESFilmicToneMapping } from 'three';
import type { GalleryProject } from '../data';
import { CameraRig } from './CameraRig';
import { Hall } from './Hall';
import { Orbit } from './Orbit';
import styles from './ExhibitionCanvas.module.css';

interface ExhibitionCanvasProps {
  projects: GalleryProject[];
  ringAngle: number;
  emphasis: number[];
  /** The graphics context was lost or could not start: show the HTML exhibition instead. */
  onFail: () => void;
}

/** Phones and tablets draw at most 1.5 device pixels per CSS pixel, desktops 1.75. */
const maxDpr = () => (window.matchMedia('(pointer: coarse)').matches ? 1.5 : 1.75);

/**
 * The 3D exhibition. It draws a frame only when something changes (`frameloop="demand"`),
 * so a still hall costs nothing. Purely visual: the HTML controls carry the meaning.
 */
export default function ExhibitionCanvas({ projects, ringAngle, emphasis, onFail }: ExhibitionCanvasProps) {
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

  return (
    <div className={styles.stage} aria-hidden="true">
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
        {/* The hall first: the camera rig measures its fog from where the camera stands. */}
        <Hall />
        <CameraRig />
        <Suspense fallback={null}>
          <Orbit projects={projects} ringAngle={ringAngle} emphasis={emphasis} />
        </Suspense>
      </Canvas>
    </div>
  );
}
