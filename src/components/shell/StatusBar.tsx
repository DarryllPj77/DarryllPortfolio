import type { ViewMeta } from '../../data/navigation';
import { profile } from '../../data/profile';
import type { LayoutMode } from '../../hooks/useMediaQuery';
import { Icon } from '../ui/Icon';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  meta: ViewMeta;
  layout: LayoutMode;
}

export function StatusBar({ meta, layout }: StatusBarProps) {
  const { internship } = profile;
  const compact = layout === 'mobile';
  return (
    <footer className={styles.statusbar}>
      <div className={styles.group}>
        <span className={styles.item}>
          <span className={styles.dot} aria-hidden="true" />
          {compact ? 'Open to OJT' : `Open to internship · ${internship.label}`}
        </span>
        {!compact ? (
          <span className={styles.item}>
            <Icon name="calendar" size={12} />
            {internship.availability}
          </span>
        ) : null}
      </div>
      <div className={styles.group}>
        {layout === 'desktop' ? <span className={styles.item}>C# · .NET</span> : null}
        <span className={styles.item}>
          <Icon name="map-pin" size={12} />
          {profile.locationShort}
        </span>
        {layout === 'desktop' ? (
          <span className={styles.item} aria-hidden="true">
            {meta.title}
          </span>
        ) : null}
      </div>
    </footer>
  );
}
