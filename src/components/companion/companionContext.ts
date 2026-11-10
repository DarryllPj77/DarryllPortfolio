import { createContext, useContext } from 'react';

export type CompanionMode = 'hero' | 'mini';

/**
 * What the rest of the shell needs from the avatar companion. The Home hero
 * registers the spot the large avatar stands in; the status bar shows the
 * show/hide switch.
 */
export interface CompanionState {
  /** The 3D avatar can leave the hero and roam the workspace (WebGL, not on phones). */
  canRoam: boolean;
  /** 'hero': large, in the Home hero. 'mini': small, roaming the workspace. */
  mode: CompanionMode;
  /** The 3D scene has been requested and is loading or showing. */
  sceneRequested: boolean;
  /** The 3D scene has drawn its first frame. */
  sceneReady: boolean;
  /** The 3D scene is used at all (capable device, no error). */
  sceneOn: boolean;
  /** True while the Wave clip plays. */
  waving: boolean;
  /** The hero's avatar spot registers itself here (null when Home unmounts). */
  setHeroMount: (el: HTMLElement | null) => void;
  wave: () => void;
  /** Leave the hero (or appear at home base) as the small companion. */
  awaken: () => void;
  /** Go back to the hero (or simply out of view on other pages). */
  dismiss: () => void;
}

const noop = () => {};

export const CompanionContext = createContext<CompanionState>({
  canRoam: false,
  mode: 'hero',
  sceneRequested: false,
  sceneReady: false,
  sceneOn: false,
  waving: false,
  setHeroMount: noop,
  wave: noop,
  awaken: noop,
  dismiss: noop,
});

export const useCompanion = () => useContext(CompanionContext);
