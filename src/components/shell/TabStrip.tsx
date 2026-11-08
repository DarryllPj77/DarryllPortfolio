import { Link } from 'react-router';
import { getViewMeta } from '../../data/navigation';
import { Icon } from '../ui/Icon';
import styles from './TabStrip.module.css';

interface TabStripProps {
  tabs: string[];
  current: string;
  onClose: (path: string) => void;
}

/** Recently opened views, shown as workspace tabs above the content. */
export function TabStrip({ tabs, current, onClose }: TabStripProps) {
  return (
    <nav aria-label="Open views" className={styles.strip}>
      <ul role="list" className={styles.list}>
        {tabs.map((path) => {
          const meta = getViewMeta(path);
          const active = path === current;
          return (
            <li key={path} className={styles.tab} data-active={active || undefined}>
              <Link to={path} className={styles.link} aria-current={active ? 'page' : undefined}>
                <Icon name={meta.icon} size={14} className={styles.icon} />
                <span className={styles.label}>{meta.title}</span>
              </Link>
              {tabs.length > 1 ? (
                <button
                  type="button"
                  className={styles.close}
                  aria-label={`Close ${meta.title}`}
                  onClick={() => onClose(path)}
                >
                  <Icon name="close" size={12} />
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
