import type { AvatarProps } from './avatar.types';
import { AvatarPlaceholder } from './AvatarPlaceholder';

/**
 * Future home of the interactive 3D avatar (React Three Fiber + Drei).
 *
 * Planned structure:
 *   <Canvas> (dpr capped, frameloop "demand" when reducedMotion)
 *     <AvatarModel pose={avatarReactions[activeSection].pose} … />
 *   </Canvas>
 *
 * Loaded lazily by AvatarSlot only when `avatarConfig.mode` is 'scene', so
 * three.js never ships in the main bundle. Until the model exists it renders
 * the placeholder.
 */
export default function AvatarScene(props: AvatarProps) {
  return <AvatarPlaceholder {...props} />;
}
