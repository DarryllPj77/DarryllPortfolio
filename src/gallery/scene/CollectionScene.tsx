import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import type { GalleryProject } from '../data';
import type { OrbitState } from '../orbit/OrbitState';
import type { ShowState } from '../show/ShowState';
import { CameraRig } from './CameraRig';
import { Hall, type HallLight } from './Hall';
import { FOCUS_POINT } from './layout';
import { Wheel } from './Wheel';

export interface CollectionSceneProps {
  projects: GalleryProject[];
  orbit: OrbitState;
  show: ShowState;
  /** A cabin was clicked or tapped. */
  onSelect: (index: number) => void;
  /** The pointer is over a cabin, or has left all of them. */
  onHover: (index: number | null) => void;
}

/**
 * Advances the wheel and the moment under way on each frame, and asks for the next frame only
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
    // Whichever scene is drawing owns the wake. A scene that is being replaced (or one React
    // started and discarded) stops drawing, so it can never keep the wake from the live one.
    orbit.setWake(state.invalidate);
    show.setWake(state.invalidate);
    const ring = orbit.step(dt);
    const moment = show.step(dt);
    if (ring || moment) state.invalidate();
  });
  return null;
}

/**
 * How bright the exhibit light is, 0.55…1: full while a cabin stands in front, easing down
 * while the wheel is between cabins and coming back up as the next one arrives.
 */
const lampLevel = (orbit: OrbitState) => 0.55 + 0.45 * Math.max(...orbit.emphasis);

/**
 * A collection shown on the hexagon carousel: the hall, its light on the front cabin, the camera
 * and the wheel itself. Drawn in the Gallery's one canvas (through the scene tunnel), so moving
 * between the lobby and the collection never opens a second graphics context.
 */
export default function CollectionScene({ projects, orbit, show, onSelect, onHover }: CollectionSceneProps) {
  const light = useMemo<HallLight>(
    () => ({
      // The moment (entrance, opening) sets the hall; the wheel dips the lamp between cabins.
      hall: () => show.hall,
      lamp: () => show.lamp * lampLevel(orbit),
    }),
    [orbit, show],
  );
  return (
    <>
      <Driver orbit={orbit} show={show} />
      {/* The hall first: the camera rig measures its fog from where the camera stands. */}
      <Hall light={light} focus={FOCUS_POINT} />
      <CameraRig show={show} />
      <Wheel projects={projects} orbit={orbit} show={show} onSelect={onSelect} onHover={onHover} />
    </>
  );
}
