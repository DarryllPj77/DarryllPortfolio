import type { AvatarPose, AvatarProps } from './avatar.types';

export interface AvatarModelProps extends Pick<AvatarProps, 'reducedMotion' | 'selectedProject'> {
  /** Pose resolved from `avatarReactions[activeSection]`. */
  pose: AvatarPose;
  /** Normalised pointer position (-1..1), for head tracking. */
  pointer?: { x: number; y: number };
  /** Fired when the visitor clicks the avatar (e.g. to trigger a wave). */
  onInteract?: () => void;
}

/**
 * Future GLB/glTF avatar, rendered inside AvatarScene's <Canvas>.
 *
 * Responsibilities once the model exists:
 * - idle animation, blending to `pose`
 * - head/eye tracking from `pointer`
 * - click interaction via `onInteract`
 * - holding a static pose when `reducedMotion` is true
 *
 * Intentionally renders nothing until then. It is not imported anywhere yet,
 * so it adds nothing to the bundle.
 */
export default function AvatarModel(_props: AvatarModelProps) {
  return null;
}
