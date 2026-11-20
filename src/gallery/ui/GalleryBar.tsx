import { ExternalLink } from '../../components/ui/ExternalLink';
import styles from './GalleryBar.module.css';

/**
 * The Gallery's only navigation: its name (or, with a project open, the way back to the
 * exhibition), and the way back to the portfolio.
 */
export function GalleryBar({ onBack }: { onBack?: () => void }) {
  return (
    <header className={styles.bar}>
      {onBack ? (
        <button type="button" className={styles.back} onClick={onBack}>
          <span aria-hidden="true">←</span> Exhibition
        </button>
      ) : (
        <p className={styles.mark}>
          After Hours
          <span className={styles.sub}>
            {' '}
            <span aria-hidden="true">·</span> Project Gallery
          </span>
        </p>
      )}
      <ExternalLink href="/" className={styles.home}>
        DarryllPortfolio <span aria-hidden="true">↗</span>
      </ExternalLink>
    </header>
  );
}
