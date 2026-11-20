import type { CSSProperties } from 'react';
import { ExternalLink } from '../../components/ui/ExternalLink';
import { collectionNumber, collections, exhibitsIn } from '../collections';
import { exhibitNumber } from '../data';
import styles from './StaticGallery.module.css';

/**
 * The Gallery as plain HTML, collection by collection: each project's cover, number, name and
 * links. Shown when WebGL is not available or the 3D scene fails.
 */
export function StaticGallery() {
  return (
    <main className={styles.hall}>
      <h1 className={styles.title}>Projects, in their real screens.</h1>
      {collections.map((c) => {
        const works = exhibitsIn(c);
        const collectionId = `collection-${c.id}`;
        return (
          <section key={c.id} className={styles.collection} aria-labelledby={collectionId}>
            <p className={styles.number}>{collectionNumber(c)}</p>
            <h2 id={collectionId} className={styles.collectionName}>
              {c.name}
            </h2>
            <ol role="list" className={styles.list}>
              {works.map((g, i) => {
                const titleId = `exhibit-${c.id}-${g.slug}`;
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
                      <span className={styles.number}>{exhibitNumber(i, works.length)}</span>
                      <h3 id={titleId} className={styles.name}>
                        {g.project.name}
                      </h3>
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
          </section>
        );
      })}
    </main>
  );
}
