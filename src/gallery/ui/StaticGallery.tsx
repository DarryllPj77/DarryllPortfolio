import type { CSSProperties } from 'react';
import { ExternalLink } from '../../components/ui/ExternalLink';
import { exhibitNumber, galleryProjects } from '../data';
import styles from './StaticGallery.module.css';

/**
 * The exhibition as plain HTML: each project's cover, number and name, and its links.
 * Shown when WebGL is not available, and read by screen readers in every case.
 */
export function StaticGallery() {
  return (
    <main className={styles.hall}>
      <h1 className={styles.title}>Three projects, in their real screens.</h1>
      <ol role="list" className={styles.list}>
        {galleryProjects.map((g, i) => {
          const titleId = `exhibit-${g.slug}`;
          return (
            <li key={g.slug} className={styles.exhibit} aria-labelledby={titleId}>
              <img
                className={styles.cover}
                // Never shown larger than the file itself.
                style={{ '--cover-max': `${g.cover.width}px` } as CSSProperties}
                src={g.cover.src}
                alt={g.cover.alt}
                width={g.cover.width}
                height={g.cover.height}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
              <div className={styles.placard}>
                <span className={styles.number}>{exhibitNumber(i)}</span>
                <h2 id={titleId} className={styles.name}>
                  {g.project.name}
                </h2>
                <span className={styles.year}>{g.project.period}</span>
                <ul role="list" className={styles.links}>
                  {g.links.map((link) => (
                    <li key={link.href}>
                      <ExternalLink href={link.href} className={styles.link}>
                        {link.kind === 'repo' ? 'GitHub' : 'Live demo'} <span aria-hidden="true">↗</span>
                      </ExternalLink>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
