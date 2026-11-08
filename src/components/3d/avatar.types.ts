import type { RefObject } from 'react';
import type { AvatarFraming } from './avatar.config';
import type { AvatarInput, AvatarState } from './avatarInteraction';

/**
 * Contract between the hero and any avatar implementation. The fallback and
 * the 3D scene both accept these props, so swapping one for the other does
 * not change the hero.
 */
export interface AvatarProps {
  /** True when the visitor prefers reduced motion. Idle, tracking and easing must stop. */
  reducedMotion: boolean;
  /** Short accessible description of the avatar. */
  label: string;
}

export interface AvatarSceneProps extends AvatarProps {
  /** False while the hero is off screen: the scene stops rendering frames. */
  active: boolean;
  /** Camera framing for the current slot shape (portrait or compact). */
  framing: AvatarFraming;
  /** Current interaction state (see avatarInteraction.ts). */
  state: AvatarState;
  /** Pointer and drag input, written by DOM handlers and read every frame. */
  input: RefObject<AvatarInput>;
  /** Increments each time a wave is requested. */
  waveId: number;
  /** Called when the Wave clip has finished (or can't play). */
  onWaveEnd: () => void;
  /** Called once the first frame with the model has rendered. */
  onReady: () => void;
  /** Called if WebGL or the model fails, including a lost graphics context. */
  onError: () => void;
}

/** Named poses the model provides. */
export type AvatarPose = 'neutral' | 'glance-content' | 'wave';

/**
 * Things on the Home page the avatar can react to. The avatar only lives in
 * the Home hero, so reactions come from what happens there.
 */
export type AvatarTrigger = 'arrive-home' | 'hover-project' | 'hover-nav' | 'press';

/** Planned reactions (a later phase). Data only: nothing reads this yet. */
export const avatarReactions: Record<AvatarTrigger, { pose: AvatarPose; note: string }> = {
  'arrive-home': { pose: 'wave', note: 'Short greeting when the visitor returns to Home.' },
  'hover-project': { pose: 'glance-content', note: 'Glances toward the hovered project row.' },
  'hover-nav': { pose: 'glance-content', note: 'Glances toward the top navigation.' },
  press: { pose: 'wave', note: 'Click, tap or the "Say hi" button.' },
};
