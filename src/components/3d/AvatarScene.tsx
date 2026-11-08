import type { AvatarProps } from './avatar.types';
import { AvatarPlaceholder } from './AvatarPlaceholder';

/**
 * Future home of the interactive 3D avatar (React Three Fiber + Drei, GLB model).
 *
 * Planned behaviour: idle animation, pointer/head tracking, drag rotation,
 * click/wave interaction, section-aware reactions via `activeSection`,
 * mobile optimisation, and a static pose when `reducedMotion` is true.
 *
 * This module is loaded lazily by AvatarSlot only when `avatarConfig.mode`
 * is 'scene', so three.js never ships in the main bundle. Until the scene is
 * implemented it renders the placeholder.
 */
export default function AvatarScene(props: AvatarProps) {
  return <AvatarPlaceholder {...props} />;
}
