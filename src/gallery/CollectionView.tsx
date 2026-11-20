import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { duration, ease } from '../motion/tokens';
import { collections, exhibitsIn, type GalleryCollection } from './collections';
import { exhibitNumber } from './data';
import type { OrbitState } from './orbit/OrbitState';
import { useOrbitDrag } from './orbit/useOrbitDrag';
import { useScrollSteps } from './orbit/useScrollSteps';
import { presentations } from './presentations';
import { SceneTunnel } from './scene/tunnel';
import { formatHash, parseHash } from './show/hash';
import { ShowState } from './show/ShowState';
import { Controls } from './ui/Controls';
import { GalleryBar } from './ui/GalleryBar';
import { Placard } from './ui/Placard';
import { Presentation } from './ui/Presentation';
import styles from './GalleryApp.module.css';

/** Typing in a field keeps its own keys. */
const isTextField = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

interface CollectionViewProps {
  collection: GalleryCollection;
  /** The collection's turning state: kept by the Gallery for the whole visit. */
  orbit: OrbitState;
  /** Which entrance to play: the full arrival, the short one, or a fade (reduced motion). */
  entrance: 'full' | 'short' | 'reduced';
  /** The Gallery's 3D stage: drag and scroll turn the wheel there. */
  stageRef: RefObject<HTMLDivElement | null>;
  /** Arrive with the project in front already open (from its own link). */
  startOpen: boolean;
  reduced: boolean;
  /** Back to the lobby. */
  onLeave: () => void;
}

/**
 * One collection's exhibition: its projects as display cases, turned by drag, keys and the
 * controls, each opening into its own presentation. Which 3D layout draws it comes from the
 * collection's presentation type; everything here is the same for every collection.
 */
export function CollectionView({ collection, orbit, entrance, stageRef, startOpen, reduced, onLeave }: CollectionViewProps) {
  const projects = exhibitsIn(collection);
  const total = projects.length;
  const slugs = collection.projectIds;
  const { scene: Scene, dragAxis } = presentations[collection.presentation];

  const [show] = useState(
    () => new ShowState({ count: total, entrance, startOpen, opened: orbit.getActive() }),
  );
  const active = useSyncExternalStore(orbit.subscribe, orbit.getActive);
  const phase = useSyncExternalStore(show.subscribe, show.getPhase);
  const ui = useSyncExternalStore(show.subscribe, show.getUi);
  /** The presentation is playing its exit. */
  const [leaving, setLeaving] = useState(false);
  /** Said by screen readers when the visitor changes project (empty on arrival). */
  const [announcement, setAnnouncement] = useState('');
  /** Whether this page added the "/open" history entry (so going back closes it). */
  const pushedOpen = useRef(false);
  const openButton = useRef<HTMLButtonElement>(null);

  // Reduced motion: short, direct moves, no momentum, crossfades instead of camera travel.
  useEffect(() => {
    orbit.setReducedMotion(reduced);
    show.setReducedMotion(reduced);
  }, [orbit, show, reduced]);

  /* ---------- opening and closing ---------- */

  const open = useCallback(() => {
    const current = show.getPhase();
    if (current !== 'browsing' && current !== 'entering') return;
    const index = orbit.getActive();
    show.openCase(index);
    window.history.pushState(null, '', formatHash(collection.id, slugs[index], true));
    pushedOpen.current = true;
  }, [orbit, show, collection.id, slugs]);

  /** The visitor asks to go back: through history if this page opened it, so Back and the button agree. */
  const requestClose = useCallback(() => {
    if (show.getPhase() !== 'open' || leaving) return;
    if (pushedOpen.current) {
      window.history.back(); // the popstate below starts the exit
    } else {
      window.history.replaceState(null, '', formatHash(collection.id, slugs[show.opened], false));
      setLeaving(true);
    }
  }, [show, leaving, collection.id, slugs]);

  const onExited = useCallback(() => {
    setLeaving(false);
    show.closeCase();
  }, [show]);

  // Back to the exhibition: focus returns to the control that opens a project.
  useEffect(() => {
    if (phase === 'browsing' && !leaving) openButton.current?.focus({ preventScroll: true });
  }, [phase, leaving]);

  /* ---------- the address ---------- */

  // While browsing, the address follows the case in front (replaced, so history stays short).
  useEffect(
    () =>
      orbit.subscribe(() => {
        if (show.getPhase() === 'browsing') {
          window.history.replaceState(null, '', formatHash(collection.id, slugs[orbit.getActive()], false));
        }
      }),
    [orbit, show, collection.id, slugs],
  );

  // Back and forward buttons, and edited addresses, within this collection. (Leaving it for the
  // lobby or another collection is the Gallery's to handle.)
  useEffect(() => {
    const onPop = () => {
      const address = parseHash(window.location.hash, collections);
      if (address.view !== 'collection' || address.collection !== collection.id) return;
      const current = show.getPhase();
      if (current === 'open' && !address.open) {
        pushedOpen.current = false;
        setLeaving(true);
      } else if (current === 'browsing' && address.index !== null) {
        if (address.index !== orbit.getActive()) orbit.goTo(address.index);
        else if (address.open) {
          show.openCase(address.index);
          pushedOpen.current = false;
        }
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [orbit, show, collection.id]);

  /* ---------- keys ---------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isTextField(e.target)) return;
      const current = show.getPhase();
      // During the entrance any key (but Tab) skips it, and an arrow key also does its usual job.
      if (current === 'entering' && e.key !== 'Tab') show.skipEntrance();
      if (e.key === 'Escape') {
        // Up one level: from a project to its collection, from the collection to the lobby.
        if (current === 'open') requestClose();
        else if (current === 'browsing' || current === 'entering') onLeave();
        return;
      }
      if (current !== 'browsing' && current !== 'entering') return;
      // → (or ↓, Page Down) brings the next project in, ← (or ↑, Page Up) the previous one.
      const actions: Record<string, () => void> = {
        ArrowDown: () => orbit.next(),
        ArrowRight: () => orbit.next(),
        PageDown: () => orbit.next(),
        ArrowUp: () => orbit.previous(),
        ArrowLeft: () => orbit.previous(),
        PageUp: () => orbit.previous(),
        Home: () => orbit.goTo(0),
        End: () => orbit.goTo(total - 1),
      };
      const action = actions[e.key];
      if (!action) return;
      e.preventDefault();
      action();
    };
    // A click, tap or scroll anywhere during the entrance skips to its end (a scroll on the
    // wheel also turns it, as an arrow key does).
    const onPointer = () => show.skipEntrance();
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('wheel', onPointer, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('wheel', onPointer);
    };
  }, [orbit, show, total, requestClose, onLeave]);

  // Announce each change of project, never the first one on arrival.
  useEffect(
    () =>
      orbit.subscribe(() => {
        const i = orbit.getActive();
        setAnnouncement(`${exhibitNumber(i, total).replace(' / ', ' of ')}, ${projects[i].project.name}`);
      }),
    [orbit, total, projects],
  );

  const select = (index: number) => {
    const current = show.getPhase();
    if (current !== 'browsing' && current !== 'entering') return;
    // Another case comes to the front; the case in front opens.
    if (index !== orbit.getActive()) orbit.goTo(index);
    else open();
  };

  // Turning by hand and by scroll, on the shared stage: only while browsing (scroll also as the
  // entrance ends, which skips it).
  const browsing = phase === 'browsing';
  useOrbitDrag(stageRef, orbit, browsing, dragAxis);
  useScrollSteps(stageRef, orbit, browsing || phase === 'entering');
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.dataset.browsing = browsing ? 'true' : '';
    return () => {
      stage.dataset.browsing = '';
      stage.dataset.hover = '';
    };
  }, [stageRef, browsing]);
  const setHoverCursor = (index: number | null) => {
    const stage = stageRef.current;
    if (stage && !orbit.isDragging) stage.dataset.hover = index === null || !browsing ? '' : 'case';
  };

  const isOpen = phase === 'open';
  const opened = projects[show.opened];

  return (
    <>
      <GalleryBar
        trail={[
          { label: 'After Hours', onSelect: onLeave },
          { label: collection.name, onSelect: isOpen ? requestClose : undefined },
          ...(isOpen ? [{ label: opened.project.name }] : []),
        ]}
      />
      <h1 className="visually-hidden">{collection.name}: a collection in the After Hours project Gallery</h1>
      {/* Behind an open project, the exhibition can't be reached or read. */}
      <div inert={isOpen}>
        {/* The collection's 3D exhibit, drawn in the Gallery's one canvas. */}
        <SceneTunnel.In>
          <Scene projects={projects} orbit={orbit} show={show} onSelect={select} onHover={setHoverCursor} />
        </SceneTunnel.In>
        <AnimatePresence>
          {ui ? (
            <motion.div
              key="dock"
              initial={{ opacity: 0, y: reduced ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.base, ease: ease.out }}
            >
              {/* The floor darkens toward the placard, so its text reads over any reflection. */}
              <div className={styles.scrim} aria-hidden="true" />
              <div className={styles.dock}>
                <Placard
                  project={projects[active]}
                  index={active}
                  total={total}
                  onOpen={open}
                  openRef={openButton}
                />
              </div>
              {/* A row under the placard, matching the carousel's side-to-side turn. */}
              <div className={styles.rail}>
                <Controls
                  projects={projects}
                  active={active}
                  onPrevious={() => orbit.previous()}
                  onNext={() => orbit.next()}
                  onChoose={(i) => orbit.goTo(i)}
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        {phase === 'entering' ? (
          <button type="button" className={styles.skip} onClick={() => show.skipEntrance()}>
            Skip intro
          </button>
        ) : null}
      </div>
      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      {isOpen ? (
        <Presentation
          key={opened.slug}
          project={opened}
          index={show.opened}
          total={total}
          from={show.screenRect}
          reduced={reduced}
          leaving={leaving}
          onBack={requestClose}
          onExited={onExited}
        />
      ) : null}
    </>
  );
}
