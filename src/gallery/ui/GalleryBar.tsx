import { ExternalLink } from '../../components/ui/ExternalLink';
import styles from './GalleryBar.module.css';

/** One level of the Gallery: the lobby, a collection, or an open project. */
export interface Crumb {
  label: string;
  /** Goes back to this level; absent on the level the visitor is on. */
  onSelect?: () => void;
}

/**
 * The Gallery's only navigation: where the visitor is (After Hours / 3 Best Projects /
 * PreMatch Tracker), each level above a way back to it, and the way back to the portfolio.
 * On a phone only the way up one level shows ("← 3 Best Projects").
 */
export function GalleryBar({ trail }: { trail: Crumb[] }) {
  // The level a phone keeps: the nearest one to go back to, or the only one there is.
  const parent = trail.findLastIndex((c) => c.onSelect);
  const keep = parent === -1 ? trail.length - 1 : parent;
  return (
    <header className={styles.bar}>
      <nav aria-label="Gallery" className={styles.trail}>
        <ol role="list">
          {trail.map((crumb, i) => (
            <li key={crumb.label} data-keep={i === keep || undefined} data-first={i === 0 || undefined}>
              {i > 0 ? (
                <span className={styles.sep} aria-hidden="true">
                  /
                </span>
              ) : null}
              {crumb.onSelect ? (
                <button type="button" className={styles.crumb} onClick={crumb.onSelect}>
                  <span className={styles.up} aria-hidden="true">
                    ←{' '}
                  </span>
                  {crumb.label}
                </button>
              ) : (
                <span className={styles.current} aria-current="page">
                  {crumb.label}
                  {trail.length === 1 ? <span className={styles.sub}> · Project Gallery</span> : null}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <ExternalLink href="/" className={styles.home}>
        DarryllPortfolio <span aria-hidden="true">↗</span>
      </ExternalLink>
    </header>
  );
}
