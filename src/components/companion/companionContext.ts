import { createContext, useContext } from 'react';
import type { DockId } from '../../data/avatarDocks';
import type { SectionId } from '../../data/types';
import type { IntroPhase } from '../avatar-intro/introTimeline';

/**
 * Where the one avatar is:
 * - hero: large, in the Home hero (hidden on other pages until sent somewhere);
 * - dock: settled in a section of the current page (Projects, About, Skills, Contact);
 * - float: small, free in the workspace (after a click on a file or an empty spot).
 */
export type CompanionLocation = { kind: 'hero' } | { kind: 'dock'; id: DockId } | { kind: 'float' };

/** 'hero' while it stands in the Home hero, 'mini' while it is out exploring. */
export type CompanionMode = 'hero' | 'mini';

/**
 * What the rest of the shell needs from the avatar companion. The Home hero
 * registers the spot the large avatar stands in; the hero controls and the
 * status bar send it to a destination.
 */
export interface CompanionState {
  /** The 3D avatar can leave the hero and be carried around (WebGL, not on phones). */
  canRoam: boolean;
  mode: CompanionMode;
  location: CompanionLocation;
  /** The 3D scene has been requested and is loading or showing. */
  sceneRequested: boolean;
  /** The 3D scene has drawn its first frame. */
  sceneReady: boolean;
  /** The section open now, the same however it was reached; Darryll's information follows it. */
  activeSection: SectionId;
  /** It is being carried out of the hero right now: the hero shows its empty spot. */
  liftedFromHero: boolean;
  /** The Home introduction: the real portrait until it opens on the 3D avatar (`ready`). */
  introPhase: IntroPhase;
  /** The portrait can open on the 3D avatar (WebGL available, the model has not failed). */
  canInitialize: boolean;
  /** The portal is open and the model is still loading. */
  waitingForModel: boolean;
  /** Runs the introduction. */
  initialize: () => void;
  /** Mounts the scene early (hover, focus, press on the portrait). */
  warmUp: () => void;
  /** The 3D scene is used at all (capable device, no error). */
  sceneOn: boolean;
  /** True while the Wave clip plays. */
  waving: boolean;
  /** The hero's avatar spot registers itself here (null when Home unmounts). */
  setHeroMount: (el: HTMLElement | null) => void;
  wave: () => void;
  /** Sends the avatar to a destination, opening its page first when it is elsewhere. */
  sendTo: (id: DockId) => void;
  /** Back to the hero (on other pages it simply goes out of view). */
  dismiss: () => void;
}

const noop = () => {};

export const CompanionContext = createContext<CompanionState>({
  canRoam: false,
  mode: 'hero',
  location: { kind: 'hero' },
  sceneRequested: false,
  sceneReady: false,
  activeSection: 'home',
  liftedFromHero: false,
  introPhase: 'portrait',
  canInitialize: false,
  waitingForModel: false,
  initialize: noop,
  warmUp: noop,
  sceneOn: false,
  waving: false,
  setHeroMount: noop,
  wave: noop,
  sendTo: noop,
  dismiss: noop,
});

export const useCompanion = () => useContext(CompanionContext);
