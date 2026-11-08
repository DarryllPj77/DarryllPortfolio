import type { SectionId } from '../../data/types';

/**
 * Contract between the hero and any avatar implementation.
 * The placeholder and the future React Three Fiber scene both accept these
 * props, so swapping one for the other does not change the hero.
 */
export interface AvatarProps {
  /** Section currently in view; drives section-aware reactions later. */
  activeSection: SectionId;
  /** True when the visitor prefers reduced motion. Idle/tracking motion must stop. */
  reducedMotion: boolean;
  /** Short accessible description of the avatar. */
  label: string;
}

/**
 * - `placeholder`: static placeholder (Phase 1).
 * - `scene`: lazy-loaded 3D scene (future phase).
 */
export type AvatarMode = 'placeholder' | 'scene';

export const avatarConfig: { mode: AvatarMode } = {
  mode: 'placeholder',
};
