import type { SectionId } from '../../data/types';

/**
 * Contract between the hero and any avatar implementation.
 * The placeholder and the future React Three Fiber scene both accept these
 * props, so swapping one for the other does not change the hero.
 */
export interface AvatarProps {
  /** Section currently in view; drives section-aware reactions later. */
  activeSection: SectionId;
  /** Slug of the open project page, if any (e.g. "academic-sentinel"). */
  selectedProject?: string;
  /** True when the visitor prefers reduced motion. Idle/tracking motion must stop. */
  reducedMotion: boolean;
  /** Short accessible description of the avatar. */
  label: string;
}

/**
 * - `placeholder`: static placeholder (current).
 * - `scene`: lazy-loaded 3D scene (future phase, once the GLB model exists).
 */
export type AvatarMode = 'placeholder' | 'scene';

export const avatarConfig: { mode: AvatarMode } = {
  mode: 'placeholder',
};

/** Named poses/behaviours the future model will provide. */
export type AvatarPose = 'neutral' | 'look-at-content' | 'lean-in' | 'wave';

/**
 * Intended reaction per section. Not implemented yet: AvatarModel will read
 * this once the real model and its animations exist.
 */
export const avatarReactions: Record<SectionId, { pose: AvatarPose; note: string }> = {
  home: { pose: 'neutral', note: 'Idle, neutral pose; follows the pointer.' },
  projects: { pose: 'look-at-content', note: 'Glances toward the project content.' },
  about: { pose: 'lean-in', note: 'Camera moves slightly closer.' },
  skills: { pose: 'neutral', note: 'Idle.' },
  certifications: { pose: 'neutral', note: 'Idle.' },
  contact: { pose: 'wave', note: 'Friendly wave.' },
};
