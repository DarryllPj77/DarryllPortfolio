import { getSocial } from '../../data/socials';
import { ExternalLink } from '../ui/ExternalLink';
import { Icon } from '../ui/Icon';
import styles from './ActivityRail.module.css';

interface ActivityRailProps {
  explorerOpen: boolean;
  onToggleExplorer: () => void;
}

/** Narrow strip on the left (tablet and desktop): Explorer toggle and profile links. */
export function ActivityRail({ explorerOpen, onToggleExplorer }: ActivityRailProps) {
  const github = getSocial('github');
  const linkedin = getSocial('linkedin');
  return (
    <div className={styles.rail}>
      <button
        type="button"
        className={styles.item}
        aria-expanded={explorerOpen}
        aria-controls="explorer-panel"
        aria-label={explorerOpen ? 'Hide explorer' : 'Show explorer'}
        title={`${explorerOpen ? 'Hide' : 'Show'} explorer (Ctrl+B)`}
        onClick={onToggleExplorer}
        data-active={explorerOpen || undefined}
      >
        <Icon name="sidebar" size={20} />
      </button>
      <div className={styles.spacer} />
      <ExternalLink href={github.href} className={styles.item} title="GitHub">
        <Icon name="github" size={18} />
        <span className="visually-hidden">GitHub</span>
      </ExternalLink>
      <ExternalLink href={linkedin.href} className={styles.item} title="LinkedIn">
        <Icon name="linkedin" size={18} />
        <span className="visually-hidden">LinkedIn</span>
      </ExternalLink>
    </div>
  );
}
