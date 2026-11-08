import type { AvatarProps } from './avatar.types';
import styles from './Avatar.module.css';

/** Static stand-in for the 3D avatar: a framed viewport with a simple silhouette. */
export function AvatarPlaceholder({ label }: AvatarProps) {
  return (
    <div className={styles.placeholder} role="img" aria-label={label}>
      <svg className={styles.figure} viewBox="0 0 200 220" aria-hidden="true">
        <defs>
          <linearGradient id="avatar-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-elevated)" />
            <stop offset="100%" stopColor="var(--color-panel)" />
          </linearGradient>
        </defs>
        {/* Ground ring */}
        <ellipse cx="100" cy="206" rx="70" ry="9" className={styles.ring} />
        {/* Shoulders */}
        <path
          d="M30 206c0-40 30-64 70-64s70 24 70 64Z"
          fill="url(#avatar-fill)"
          className={styles.outline}
        />
        {/* Neck */}
        <path d="M86 122h28v24c-8 6-20 6-28 0Z" fill="var(--color-elevated)" />
        {/* Head */}
        <ellipse
          cx="100"
          cy="86"
          rx="36"
          ry="42"
          fill="url(#avatar-fill)"
          className={styles.outline}
        />
      </svg>
      <span className={styles.corner} data-pos="tl" aria-hidden="true" />
      <span className={styles.corner} data-pos="tr" aria-hidden="true" />
      <span className={styles.corner} data-pos="bl" aria-hidden="true" />
      <span className={styles.corner} data-pos="br" aria-hidden="true" />
      <p className={styles.caption} aria-hidden="true">
        <span className={styles.captionDot} />
        3D avatar · in development
      </p>
    </div>
  );
}
