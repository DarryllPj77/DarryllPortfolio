import type { CSSProperties } from 'react';
import { collectionNumber, collections, exhibitsIn, type GalleryCollection } from '../collections';
import { GalleryBar } from './GalleryBar';
import styles from './Lobby.module.css';

/** The hexagon each cover is cut to in the lobby: the same shape as the display cases. */
const HEX = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';

/**
 * The Gallery's lobby: the exhibitions on view, each one a way in. Only real collections are
 * listed, so with one collection it is one entrance, centred, and nothing pretends there is
 * more. (Phase 4 turns it into a 3D room with the collection as a model on a plinth.)
 */
export function Lobby({ onEnter }: { onEnter: (collection: GalleryCollection) => void }) {
  return (
    <>
      <GalleryBar trail={[{ label: 'After Hours' }]} />
      <main className={styles.lobby}>
        <h1 className="visually-hidden">After Hours: the project Gallery's lobby</h1>
        <p className={styles.onView}>
          {collections.length === 1 ? 'One collection on view' : `${collections.length} collections on view`}
        </p>
        <ul role="list" className={styles.collections}>
          {collections.map((c) => {
            const works = exhibitsIn(c);
            const titleId = `collection-${c.id}`;
            return (
              <li key={c.id} className={styles.collection} aria-labelledby={titleId}>
                <div className={styles.covers} aria-hidden="true">
                  {works.map((w, i) => (
                    <img
                      key={w.slug}
                      src={w.cover.src}
                      alt=""
                      width={w.cover.width}
                      height={w.cover.height}
                      className={styles.cover}
                      data-place={i}
                      style={{ clipPath: HEX, objectPosition: `${w.focus.x * 100}% ${w.focus.y * 100}%` }}
                      loading="eager"
                      decoding="async"
                    />
                  ))}
                </div>
                <p className={styles.number}>{collectionNumber(c)}</p>
                <h2 id={titleId} className={styles.name}>
                  {c.name}
                </h2>
                <p className={styles.works}>
                  {works.length} works <span aria-hidden="true">·</span> {works.map((w) => w.project.name).join(', ')}
                </p>
                <button
                  type="button"
                  className={styles.enter}
                  style={{ '--accent': c.theme.accent } as CSSProperties}
                  onClick={() => onEnter(c)}
                  aria-label={`Enter ${c.name}`}
                >
                  Enter <span aria-hidden="true">→</span>
                </button>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
