import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState, type RefObject } from 'react';
import { ACESFilmicToneMapping } from 'three';
import { FrameProbe, initialQuality, type Quality } from './quality';
import { QualityContext } from './qualityContext';
import { SceneTunnel } from './tunnel';
import styles from './GalleryCanvas.module.css';

export interface GalleryCanvasProps {
  /** The stage element: views attach their drag and scroll handling to it. */
  stageRef: RefObject<HTMLDivElement | null>;
  /** The graphics context was lost or could not start: show the HTML Gallery instead. */
  onFail: () => void;
}

/** Phones and tablets draw at most 1.5 device pixels per CSS pixel, desktops 1.75. */
const maxDpr = () => (window.matchMedia('(pointer: coarse)').matches ? 1.5 : 1.75);

/** Measures frames while the hall moves and reports once if this device needs the lighter hall. */
function QualityProbe({ onSlow }: { onSlow: () => void }) {
  const probe = useRef(new FrameProbe());
  useFrame(() => {
    if (probe.current.frame(performance.now()) === 'low') onSlow();
  });
  return null;
}

/**
 * The Gallery's one 3D canvas, kept for the whole visit. Each view (the lobby, a collection)
 * puts its own scene into it through the scene tunnel, so moving between them never opens a
 * second graphics context. It draws a frame only when something changes
 * (`frameloop="demand"`). Purely visual: the HTML on top carries the meaning, so it is hidden
 * from screen readers.
 */
export default function GalleryCanvas({ stageRef, onFail }: GalleryCanvasProps) {
  const [quality, setQuality] = useState<Quality>(initialQuality);
  const low = quality === 'low';

  // A context lost while the canvas is mounted counts as a failure; React Three Fiber's own
  // release of the context on unmount does not, so the listener goes when the canvas does.
  const loss = useRef<{ el: HTMLCanvasElement; fn: () => void } | null>(null);
  useEffect(
    () => () => {
      loss.current?.el.removeEventListener('webglcontextlost', loss.current.fn);
      loss.current = null;
    },
    [],
  );

  return (
    <div ref={stageRef} className={styles.stage} data-quality={quality} aria-hidden="true">
      <Canvas
        frameloop="demand"
        dpr={low ? 1 : [1, maxDpr()]}
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
        {low ? null : <QualityProbe onSlow={() => setQuality('low')} />}
        <QualityContext.Provider value={quality}>
          <Suspense fallback={null}>
            <SceneTunnel.Out />
          </Suspense>
        </QualityContext.Provider>
      </Canvas>
    </div>
  );
}
