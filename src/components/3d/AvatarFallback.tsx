import { avatarConfig } from './avatar.config';
import styles from './Avatar.module.css';

/**
 * Still version of the avatar. Shown instantly, underneath the 3D scene, and
 * as the permanent fallback (no WebGL, data saver, low memory, errors).
 * Until a real poster render exists it draws a quiet silhouette.
 */
export function AvatarFallback({ label }: { label: string }) {
  const { posterUrl, posterSize } = avatarConfig;

  if (posterUrl) {
    return (
      <img
        className={styles.posterImage}
        src={posterUrl}
        alt={label}
        width={posterSize.width}
        height={posterSize.height}
        decoding="async"
        fetchPriority="high"
      />
    );
  }

  return (
    <div className={styles.silhouette} role="img" aria-label={label}>
      <svg viewBox="0 0 200 250" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
        {/* Shoulders and torso, cropped by the ground line like the planned waist-up framing. */}
        <path d="M18 250c2-58 34-92 82-92s80 34 82 92Z" />
        {/* Neck */}
        <path d="M86 124h28v30c-8 7-20 7-28 0Z" />
        {/* Head */}
        <ellipse cx="100" cy="84" rx="35" ry="42" />
      </svg>
    </div>
  );
}
