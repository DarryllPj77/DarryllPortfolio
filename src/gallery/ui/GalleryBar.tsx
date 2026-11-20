import { ExternalLink } from '../../components/ui/ExternalLink';
import styles from './GalleryBar.module.css';

/** The Gallery's only navigation: its name, and the way back to the portfolio. */
export function GalleryBar() {
  return (
    <header className={styles.bar}>
      <p className={styles.mark}>
        After Hours
        <span className={styles.sub}>
          {' '}
          <span aria-hidden="true">·</span> Project Gallery
        </span>
      </p>
      <ExternalLink href="/" className={styles.home}>
        DarryllPortfolio <span aria-hidden="true">↗</span>
      </ExternalLink>
    </header>
  );
}
