import { MotionConfig } from 'motion/react';
import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { exhibitNumber, galleryProjects } from './data';
import { OrbitState } from './orbit/OrbitState';
import { Controls } from './ui/Controls';
import { GalleryBar } from './ui/GalleryBar';
import { Placard } from './ui/Placard';
import { StaticGallery } from './ui/StaticGallery';
import { supportsWebGL } from './webgl';
import styles from './GalleryApp.module.css';

// The 3D code is downloaded only when it can run; the HTML exhibition never waits for it.
const ExhibitionCanvas = lazy(() => import('./scene/ExhibitionCanvas'));

/** Typing in a field keeps its own arrow keys. */
const isTextField = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

/**
 * After Hours: the project Gallery, a page of its own that opens in a new tab.
 * With WebGL it is a 3D exhibition of three hexagonal display cases on a ring; without it
 * (or if the graphics context is lost) the same exhibits are shown as plain HTML.
 */
export function GalleryApp() {
  const [webgl, setWebgl] = useState(supportsWebGL);
  const [orbit] = useState(() => new OrbitState());
  const active = useSyncExternalStore(orbit.subscribe, orbit.getActive);
  /** Said by screen readers when the visitor changes project (empty on arrival). */
  const [announcement, setAnnouncement] = useState('');

  // Reduced motion: short, direct turns with no carried momentum.
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => orbit.setReducedMotion(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [orbit]);

  // Arrow keys turn the ring from anywhere on the page; Home and End go to the first and last.
  useEffect(() => {
    if (!webgl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isTextField(e.target)) return;
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
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [orbit, webgl]);

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
    // A side case comes to the front. (Opening the front case arrives in phase 4.)
    if (index !== orbit.getActive()) orbit.goTo(index);
  };

  return (
    <MotionConfig reducedMotion="user">
      <GalleryBar />
      {webgl ? (
        <>
          <h1 className="visually-hidden">After Hours: a gallery of three projects</h1>
          <Suspense fallback={null}>
            <ExhibitionCanvas
              projects={galleryProjects}
              orbit={orbit}
              onSelect={select}
              onFail={() => setWebgl(false)}
            />
          </Suspense>
          {/* The floor darkens toward the placard, so its text reads over any reflection. */}
          <div className={styles.scrim} aria-hidden="true" />
          <div className={styles.dock}>
            <Placard project={galleryProjects[active]} index={active} />
            <Controls
              projects={galleryProjects}
              active={active}
              onPrevious={() => orbit.previous()}
              onNext={() => orbit.next()}
              onChoose={(i) => orbit.goTo(i)}
            />
          </div>
          <p className="visually-hidden" aria-live="polite" aria-atomic="true">
            {announcement}
          </p>
        </>
      ) : (
        <StaticGallery />
      )}
    </MotionConfig>
  );
}
