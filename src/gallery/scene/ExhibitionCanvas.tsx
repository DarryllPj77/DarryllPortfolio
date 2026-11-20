import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import { ACESFilmicToneMapping } from 'three';
import type { GalleryProject } from '../data';
import type { OrbitState } from '../orbit/OrbitState';
import { useOrbitDrag, type DragAxis } from '../orbit/useOrbitDrag';
import { useScrollSteps } from '../orbit/useScrollSteps';
import type { ShowState } from '../show/ShowState';
import { CameraRig } from './CameraRig';
import { Hall } from './Hall';
import { Wheel } from './Wheel';
import { FrameProbe, initialQuality, type Quality } from './quality';
import styles from './ExhibitionCanvas.module.css';

export interface ExhibitionCanvasProps {
  projects: GalleryProject[];
  orbit: OrbitState;
  show: ShowState;
  /** Whether the exhibit may be dragged now (only while browsing). */
  canDrag: boolean;
  /** Whether scrolling may turn it now (while browsing, and as the entrance ends). */
  canScroll: boolean;
  /** Which way the hand moves to turn it. */
  dragAxis: DragAxis;
  /** A case was clicked or tapped. */
  onSelect: (index: number) => void;
  /** The graphics context was lost or could not start: show the HTML exhibition instead. */
  onFail: () => void;
}

/** Phones and tablets draw at most 1.5 device pixels per CSS pixel, desktops 1.75. */
const maxDpr = () => (window.matchMedia('(pointer: coarse)').matches ? 1.5 : 1.75);

/**
 * Advances the ring and the moment under way on each frame, and asks for the next frame only
 * while something is moving: a still hall, or a hall behind an open project, draws nothing.
 * Input wakes it again through each one's `wake`.
 */
function Driver({ orbit, show }: { orbit: OrbitState; show: ShowState }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const wake = () => invalidate();
    const releaseOrbit = orbit.setWake(wake);
    const releaseShow = show.setWake(wake);
    invalidate();
    return () => {
      releaseOrbit();
      releaseShow();
    };
  }, [orbit, show, invalidate]);
  useFrame((state, dt) => {
    // Whichever canvas is drawing owns the wake. A canvas that is being replaced (or one React
    // started and discarded) stops drawing, so it can never keep the wake from the live one.
    orbit.setWake(state.invalidate);
    show.setWake(state.invalidate);
    const ring = orbit.step(dt);
    const moment = show.step(dt);
    if (ring || moment) state.invalidate();
  });
  return null;
}

/** Measures frames while the hall moves and reports once if this device needs the lighter hall. */
function QualityProbe({ onSlow }: { onSlow: () => void }) {
  const probe = useRef(new FrameProbe());
  useFrame(() => {
    if (probe.current.frame(performance.now()) === 'low') onSlow();
  });
  return null;
}

/**
 * The 3D exhibition. It draws a frame only when something changes (`frameloop="demand"`).
 * Purely visual: the HTML controls carry the meaning, so it is hidden from screen readers.
 */
export default function ExhibitionCanvas({
  projects,
  orbit,
  show,
  canDrag,
  canScroll,
  dragAxis,
  onSelect,
  onFail,
}: ExhibitionCanvasProps) {
  const stage = useRef<HTMLDivElement>(null);
  useOrbitDrag(stage, orbit, canDrag, dragAxis);
  // A vertical exhibit also turns with the scroll wheel (one project per gesture).
  useScrollSteps(stage, orbit, canScroll && dragAxis === 'y');
  const [quality, setQuality] = useState<Quality>(initialQuality);
  const low = quality === 'low';

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
    if (stage.current && !orbit.isDragging) stage.current.dataset.hover = index === null || !canDrag ? '' : 'case';
  };

  return (
    <div
      ref={stage}
      className={styles.stage}
      data-browsing={canDrag || undefined}
      data-quality={quality}
      aria-hidden="true"
    >
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
        <Driver orbit={orbit} show={show} />
        {low ? null : <QualityProbe onSlow={() => setQuality('low')} />}
        {/* The hall first: the camera rig measures its fog from where the camera stands. */}
        <Hall orbit={orbit} show={show} quality={quality} />
        <CameraRig show={show} />
        <Suspense fallback={null}>
          <Wheel
            projects={projects}
            orbit={orbit}
            show={show}
            quality={quality}
            onSelect={onSelect}
            onHover={setHoverCursor}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
