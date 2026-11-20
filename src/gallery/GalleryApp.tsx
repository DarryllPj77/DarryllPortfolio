import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { duration, ease } from '../motion/tokens';
import { exhibitNumber, galleryProjects } from './data';
import { OrbitState } from './orbit/OrbitState';
import { formatHash, parseHash } from './show/hash';
import { ShowState } from './show/ShowState';
import { Controls } from './ui/Controls';
import { GalleryBar } from './ui/GalleryBar';
import { Placard } from './ui/Placard';
import { Presentation } from './ui/Presentation';
import { StaticGallery } from './ui/StaticGallery';
import { supportsWebGL } from './webgl';
import styles from './GalleryApp.module.css';

// The 3D code is downloaded only when it can run; the HTML exhibition never waits for it.
const ExhibitionCanvas = lazy(() => import('./scene/ExhibitionCanvas'));

const SLUGS = galleryProjects.map((p) => p.slug);
/** The full entrance plays once per tab; later visits in the same tab get the short one. */
const ENTERED_KEY = 'after-hours:entered';

/** Typing in a field keeps its own keys. */
const isTextField = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Where the visit starts: the address names a project (and maybe opens it), or the first one. */
function startingPoint() {
  const address = parseHash(window.location.hash, SLUGS);
  const index = address.index ?? 0;
  let entered = false;
  try {
    entered = sessionStorage.getItem(ENTERED_KEY) === '1';
  } catch {
    // Storage unavailable: play the full entrance.
  }
  return { index, open: address.open && address.index !== null, entered };
}

/**
 * After Hours: the project Gallery, a page of its own that opens in a new tab.
 * With WebGL it is a 3D exhibition of three hexagonal display cases on a ring: an entrance,
 * a ring to turn, and each project opening into its own presentation. Without WebGL (or if
 * the graphics context is lost) the same exhibits are shown as plain HTML.
 */
export function GalleryApp() {
  const [webgl, setWebgl] = useState(supportsWebGL);
  const [{ orbit, show }] = useState(() => {
    const start = startingPoint();
    return {
      orbit: new OrbitState(start.index),
      show: new ShowState({
        entrance: prefersReducedMotion() ? 'reduced' : start.entered ? 'short' : 'full',
        startOpen: start.open,
        opened: start.index,
      }),
    };
  });
  const active = useSyncExternalStore(orbit.subscribe, orbit.getActive);
  const phase = useSyncExternalStore(show.subscribe, show.getPhase);
  const ui = useSyncExternalStore(show.subscribe, show.getUi);
  const [reduced, setReduced] = useState(prefersReducedMotion);
  /** The presentation is playing its exit. */
  const [leaving, setLeaving] = useState(false);
  /** Said by screen readers when the visitor changes project (empty on arrival). */
  const [announcement, setAnnouncement] = useState('');
  /** Whether this page added the "/open" history entry (so going back closes it). */
  const pushedOpen = useRef(false);
  const openButton = useRef<HTMLButtonElement>(null);

  // The full entrance has now been seen in this tab.
  useEffect(() => {
    try {
      sessionStorage.setItem(ENTERED_KEY, '1');
    } catch {
      // Not stored: the next visit plays it again, which is harmless.
    }
  }, []);

  // Reduced motion: short, direct moves, no momentum, crossfades instead of camera travel.
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      orbit.setReducedMotion(query.matches);
      show.setReducedMotion(query.matches);
      setReduced(query.matches);
    };
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [orbit, show]);

  /* ---------- opening and closing ---------- */

  const open = useCallback(() => {
    const current = show.getPhase();
    if (current !== 'browsing' && current !== 'entering') return;
    const index = orbit.getActive();
    show.openCase(index);
    window.history.pushState(null, '', formatHash(SLUGS[index], true));
    pushedOpen.current = true;
  }, [orbit, show]);

  /** The visitor asks to go back: through history if this page opened it, so Back and the button agree. */
  const requestClose = useCallback(() => {
    if (show.getPhase() !== 'open' || leaving) return;
    if (pushedOpen.current) {
      window.history.back(); // the popstate below starts the exit
    } else {
      window.history.replaceState(null, '', formatHash(SLUGS[show.opened], false));
      setLeaving(true);
    }
  }, [show, leaving]);

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
          window.history.replaceState(null, '', formatHash(SLUGS[orbit.getActive()], false));
        }
      }),
    [orbit, show],
  );

  // Back and forward buttons, and edited addresses.
  useEffect(() => {
    const onPop = () => {
      const address = parseHash(window.location.hash, SLUGS);
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
  }, [orbit, show]);

  /* ---------- keys ---------- */

  useEffect(() => {
    if (!webgl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isTextField(e.target)) return;
      const current = show.getPhase();
      // During the entrance any key (but Tab) skips it, and an arrow key also does its usual job.
      if (current === 'entering' && e.key !== 'Tab') show.skipEntrance();
      if (current === 'open' && e.key === 'Escape') {
        requestClose();
        return;
      }
      if (current !== 'browsing' && current !== 'entering') return;
      const actions: Record<string, () => void> = {
        ArrowLeft: () => orbit.previous(),
        ArrowRight: () => orbit.next(),
        Home: () => orbit.goTo(0),
        End: () => orbit.goTo(galleryProjects.length - 1),
      };
      const action = actions[e.key];
      if (!action) return;
      e.preventDefault();
      action();
    };
    // A click or tap anywhere during the entrance skips to its end.
    const onPointer = () => show.skipEntrance();
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [orbit, show, webgl, requestClose]);

  // Announce each change of project, never the first one on arrival.
  useEffect(
    () =>
      orbit.subscribe(() => {
        const i = orbit.getActive();
        setAnnouncement(`${exhibitNumber(i).replace(' / ', ' of ')}, ${galleryProjects[i].project.name}`);
      }),
    [orbit],
  );

  const select = (index: number) => {
    const current = show.getPhase();
    if (current !== 'browsing' && current !== 'entering') return;
    // A side case comes to the front; the case in front opens.
    if (index !== orbit.getActive()) orbit.goTo(index);
    else open();
  };

  if (!webgl) {
    return (
      <MotionConfig reducedMotion="user">
        <GalleryBar />
        <StaticGallery />
      </MotionConfig>
    );
  }

  const isOpen = phase === 'open';
  const opened = galleryProjects[show.opened];

  return (
    <MotionConfig reducedMotion="user">
      <GalleryBar onBack={isOpen ? requestClose : undefined} />
      <h1 className="visually-hidden">After Hours: a gallery of three projects</h1>
      {/* Behind an open project, the exhibition can't be reached or read. */}
      <div inert={isOpen}>
        <Suspense fallback={null}>
          <ExhibitionCanvas
            projects={galleryProjects}
            orbit={orbit}
            show={show}
            canDrag={phase === 'browsing'}
            onSelect={select}
            onFail={() => setWebgl(false)}
          />
        </Suspense>
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
                <Placard project={galleryProjects[active]} index={active} onOpen={open} openRef={openButton} />
                <Controls
                  projects={galleryProjects}
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
          from={show.screenRect}
          reduced={reduced}
          leaving={leaving}
          onBack={requestClose}
          onExited={onExited}
        />
      ) : null}
    </MotionConfig>
  );
}
