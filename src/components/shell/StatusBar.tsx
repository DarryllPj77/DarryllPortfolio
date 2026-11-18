import type { LayoutMode } from '../../hooks/useMediaQuery';
import { profile } from '../../data/profile';
import { getDock } from '../../data/avatarDocks';
import { useCompanion } from '../companion/companionContext';
import { DockMenu } from '../companion/DockMenu';
import styles from './StatusBar.module.css';

/** Quiet strip with the essentials: focus area and OJT availability. */
export function StatusBar({ layout }: { layout: LayoutMode }) {
  const compact = layout === 'mobile';
  const companion = useCompanion();
  const { location } = companion;
  const where =
    location.kind === 'dock' ? getDock(location.id).label : location.kind === 'hero' ? 'Home' : 'Exploring';
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
      <div className={styles.group}>
        {/* After the Home introduction: before it, the portrait is the only way in. */}
        {companion.canRoam && companion.introPhase === 'ready' ? (
          <DockMenu label={`Avatar: ${where}`} placement="up" buttonClassName={styles.toggle} />
        ) : null}
        <p className={styles.group}>
          <span className={styles.item}>
            {profile.internship.isOpen ? 'Available for OJT' : 'Not available for OJT'}
            <span className={styles.dot} aria-hidden="true" />
          </span>
          {compact ? <span className={styles.muted}>{profile.internship.availability}</span> : null}
        </p>
      </div>
    </footer>
  );
}
