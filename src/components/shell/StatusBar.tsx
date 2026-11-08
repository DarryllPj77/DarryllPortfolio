import type { LayoutMode } from '../../hooks/useMediaQuery';
import { profile } from '../../data/profile';
import styles from './StatusBar.module.css';

/** Quiet strip with the essentials: focus area and OJT availability. */
export function StatusBar({ layout }: { layout: LayoutMode }) {
  const compact = layout === 'mobile';
  return (
    <footer className={styles.statusbar}>
      {!compact ? (
        <p className={styles.group}>
          <span>C#</span>
          <span className={styles.sep} aria-hidden="true">·</span>
          <span>.NET</span>
          <span className={styles.sep} aria-hidden="true">·</span>
          <span>Software Engineering</span>
        </p>
      ) : null}
      <p className={styles.group}>
        <span className={styles.item}>
          {profile.internship.isOpen ? 'Available for OJT' : 'Not available for OJT'}
          <span className={styles.dot} aria-hidden="true" />
        </span>
        {compact ? <span className={styles.muted}>{profile.internship.availability}</span> : null}
      </p>
    </footer>
  );
}
