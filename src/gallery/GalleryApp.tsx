import { MotionConfig } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { collections, getCollection, type GalleryCollection } from './collections';
import { CollectionView } from './CollectionView';
import { OrbitState } from './orbit/OrbitState';
import { formatHash, LOBBY, parseHash, type GalleryAddress } from './show/hash';
import { GalleryBar } from './ui/GalleryBar';
import { Lobby } from './ui/Lobby';
import { StaticGallery } from './ui/StaticGallery';
import { supportsWebGL } from './webgl';

/** The full entrance plays once per tab; later visits in the same tab get the short one. */
const ENTERED_KEY = 'after-hours:entered';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function seenEntrance(): boolean {
  try {
    return sessionStorage.getItem(ENTERED_KEY) === '1';
  } catch {
    return false; // storage unavailable: play the full entrance
  }
}

function markEntranceSeen() {
  try {
    sessionStorage.setItem(ENTERED_KEY, '1');
  } catch {
    // Not stored: the next visit plays it again, which is harmless.
  }
}

/**
 * After Hours: the project Gallery, a page of its own that opens in a new tab. Its lobby lists
 * the collections on view; entering one shows its projects as 3D display cases, each opening
 * into its own presentation. Every level has its own address, and Back goes up a level.
 * Without WebGL (or if the 3D scene fails) the same collections are shown as plain HTML.
 */
export function GalleryApp() {
  const [webgl, setWebgl] = useState(supportsWebGL);
  const [address, setAddress] = useState<GalleryAddress>(() => parseHash(window.location.hash, collections));
  const [reduced, setReduced] = useState(prefersReducedMotion);
  /**
   * Each collection's turning state, made once and kept for the visit: coming back finds the
   * same project in front. A project named in the starting address starts in front.
   */
  const [orbits] = useState(() => {
    const start = parseHash(window.location.hash, collections);
    return new Map(
      collections.map((c) => {
        const initial = start.view === 'collection' && start.collection === c.id ? (start.index ?? 0) : 0;
        return [c.id, new OrbitState({ count: c.projectIds.length, initial })];
      }),
    );
  });
  /** Whether this page added the collection's history entry (so going back returns to the lobby). */
  const pushedCollection = useRef(false);
  /** Which entrance the next collection visit plays. */
  const [entered, setEntered] = useState(seenEntrance);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(query.matches);
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  // The lobby, or another collection, from the back and forward buttons or an edited address.
  // (Changes within a collection are handled by its own view.)
  useEffect(() => {
    const onPop = () => {
      const next = parseHash(window.location.hash, collections);
      setAddress((current) => {
        const sameView =
          current.view === next.view &&
          (current.view === 'lobby' || (next.view === 'collection' && current.collection === next.collection));
        if (sameView) return current;
        if (next.view === 'lobby') pushedCollection.current = false;
        return next;
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const enter = useCallback((collection: GalleryCollection) => {
    window.history.pushState(null, '', formatHash(collection.id));
    pushedCollection.current = true;
    setAddress({ view: 'collection', collection: collection.id, index: null, open: false });
  }, []);

  const leave = useCallback(() => {
    if (pushedCollection.current) {
      window.history.back(); // the popstate above shows the lobby
    } else {
      window.history.replaceState(null, '', formatHash());
      setAddress(LOBBY);
    }
  }, []);

  const collection = address.view === 'collection' ? getCollection(address.collection) : undefined;
  const orbit = collection ? orbits.get(collection.id) : undefined;

  // An address naming another project in the collection (Back, Forward, an edited link) turns to it.
  const wanted = address.view === 'collection' ? address.index : null;
  useEffect(() => {
    if (orbit && wanted !== null && wanted !== orbit.getActive()) orbit.goTo(wanted);
  }, [orbit, wanted]);

  // The first collection visit in a tab plays the full entrance; later ones the short one.
  useEffect(() => {
    if (!collection || entered) return;
    markEntranceSeen();
    const t = window.setTimeout(() => setEntered(true), 0);
    return () => window.clearTimeout(t);
  }, [collection, entered]);

  if (!webgl) {
    return (
      <MotionConfig reducedMotion="user">
        <GalleryBar trail={[{ label: 'After Hours' }]} />
        <StaticGallery />
      </MotionConfig>
    );
  }

  if (!collection || !orbit || address.view !== 'collection') {
    return (
      <MotionConfig reducedMotion="user">
        <Lobby onEnter={enter} />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <CollectionView
        key={collection.id}
        collection={collection}
        orbit={orbit}
        entrance={reduced ? 'reduced' : entered ? 'short' : 'full'}
        startOpen={address.open}
        reduced={reduced}
        onLeave={leave}
        onFail={() => setWebgl(false)}
      />
    </MotionConfig>
  );
}
