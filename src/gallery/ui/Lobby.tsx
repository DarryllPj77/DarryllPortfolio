import { AnimatePresence, motion } from 'motion/react';
import { lazy, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { duration, ease } from '../../motion/tokens';
import { collectionNumber, collections, exhibitsIn, type GalleryCollection } from '../collections';
import { LOBBY_SLOTS } from '../scene/lobbyLayout';
import { SceneTunnel } from '../scene/tunnel';
import { GalleryBar } from './GalleryBar';
import styles from './Lobby.module.css';

// The lobby's 3D room, downloaded with the rest of the 3D code.
const LobbyScene = lazy(() => import('../scene/LobbyScene'));

interface LobbyProps {
  /** The visitor asks to enter a collection. */
  onEnter: (collection: GalleryCollection) => void;
  /** The collection being entered (the camera is moving into its card), or null. */
  entering: string | null;
  /** The camera has reached the card: show the collection. */
  onEntered: (id: string) => void;
  /** The collection the visitor has just come back from, or null. */
  returnFrom: string | null;
  reduced: boolean;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Typing in a field keeps its own keys. */
const isTextField = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

/**
 * Level 1, the Gallery's lobby: an orbit of collection cards around a central object, the
 * collection in front named on its museum placard. Choosing it (the card, or "Enter") moves the
 * camera into the card and opens the collection's own room. Places on the orbit beyond the real
 * collections are reserved for collections to come. The orbit turns through all of them: ← and →
 * (and the buttons), dragging sideways, scrolling, or choosing a card brings it to the front; a
 * reserved place shows that it is coming, with nothing to enter yet.
 */
export function Lobby({ onEnter, entering, onEntered, returnFrom, reduced }: LobbyProps) {
  const exhibits = useMemo(() => collections.map((c) => ({ id: c.id, name: c.name, projects: exhibitsIn(c) })), []);
  // How far the orbit has turned, in places; it counts on past a full circle so it always turns
  // the short way round. The place in front is `slot`: a collection, or one reserved for later.
  const [position, setPosition] = useState(() => Math.max(0, collections.findIndex((c) => c.id === returnFrom)));
  const slot = mod(position, LOBBY_SLOTS);
  const current: GalleryCollection | undefined = collections[slot];
  const works = current ? exhibitsIn(current) : [];

  const turn = (steps: number) => setPosition((p) => p + steps);

  // ← and → bring the neighbouring places to the front.
  useEffect(() => {
    if (entering) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isTextField(e.target)) return;
      if (e.key === 'ArrowRight') turn(1);
      else if (e.key === 'ArrowLeft') turn(-1);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /** A card was chosen: the collection in front opens; another card comes to the front, the short way. */
  const select = (i: number) => {
    if (i !== slot) turn(mod(i - slot + Math.floor(LOBBY_SLOTS / 2), LOBBY_SLOTS) - Math.floor(LOBBY_SLOTS / 2));
    else if (current) onEnter(current);
  };

  return (
    <>
      <GalleryBar trail={[{ label: 'After Hours' }]} />
      <h1 className="visually-hidden">After Hours: the project Gallery's lobby</h1>
      <SceneTunnel.In>
        <LobbyScene
          exhibits={exhibits}
          position={position}
          returnFrom={returnFrom}
          entering={entering}
          onEntered={onEntered}
          onSelect={select}
          onTurn={turn}
          reduced={reduced}
        />
      </SceneTunnel.In>
      <AnimatePresence>
        {entering ? null : (
          <motion.main
            key="placard"
            className={styles.lobby}
            initial={{ opacity: 0, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.base, ease: ease.out, delay: returnFrom ? 0.5 : 0.9 }}
          >
            <div className={styles.scrim} aria-hidden="true" />
            <p className={styles.onView}>
              {collections.length === 1 ? 'One collection on view' : `${collections.length} collections on view`}
            </p>
            <section className={styles.collection} aria-labelledby="lobby-collection" aria-live="polite">
              <p className={styles.number}>
                {current ? collectionNumber(current) : `Collection ${String(slot + 1).padStart(2, '0')}`}
              </p>
              <h2 id="lobby-collection" className={styles.name} data-reserved={current ? undefined : 'true'}>
                {current ? current.name : 'Coming soon'}
              </h2>
              <p className={styles.works}>
                {current ? (
                  <>
                    {works.length} works <span aria-hidden="true">·</span> {works.map((w) => w.project.name).join(', ')}
                  </>
                ) : (
                  'A future collection, in preparation.'
                )}
              </p>
              <div className={styles.actions}>
                <button type="button" className={styles.step} onClick={() => turn(-1)} aria-label="Previous collection">
                  ←
                </button>
                {current ? (
                  <button
                    type="button"
                    className={styles.enter}
                    style={{ '--accent': current.theme.accent } as CSSProperties}
                    onClick={() => onEnter(current)}
                    aria-label={`Enter ${current.name}`}
                  >
                    Enter <span aria-hidden="true">→</span>
                  </button>
                ) : (
                  <span className={styles.closed}>Not open yet</span>
                )}
                <button type="button" className={styles.step} onClick={() => turn(1)} aria-label="Next collection">
                  →
                </button>
              </div>
            </section>
          </motion.main>
        )}
      </AnimatePresence>
    </>
  );
}
