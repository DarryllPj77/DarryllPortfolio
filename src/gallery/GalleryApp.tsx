import { MotionConfig } from 'motion/react';
import { lazy, Suspense, useState } from 'react';
import { galleryProjects } from './data';
import { GalleryBar } from './ui/GalleryBar';
import { Placard } from './ui/Placard';
import { StaticGallery } from './ui/StaticGallery';
import { supportsWebGL } from './webgl';

// The 3D code is downloaded only when it can run; the HTML exhibition never waits for it.
const ExhibitionCanvas = lazy(() => import('./scene/ExhibitionCanvas'));

/**
 * After Hours: the project Gallery, a page of its own that opens in a new tab.
 * With WebGL it is a 3D exhibition of three hexagonal display cases on a ring; without it
 * (or if the graphics context is lost) the same exhibits are shown as plain HTML.
 */
export function GalleryApp() {
  const [webgl, setWebgl] = useState(supportsWebGL);
  // Phase 2: the ring stands still with the first project in front. Phase 3 turns it.
  const active = 0;
  const emphasis = galleryProjects.map((_, i) => (i === active ? 1 : 0));

  return (
    <MotionConfig reducedMotion="user">
      <GalleryBar />
      {webgl ? (
        <>
          <h1 className="visually-hidden">After Hours: a gallery of three projects</h1>
          <Suspense fallback={null}>
            <ExhibitionCanvas
              projects={galleryProjects}
              ringAngle={0}
              emphasis={emphasis}
              onFail={() => setWebgl(false)}
            />
          </Suspense>
          <Placard project={galleryProjects[active]} index={active} />
        </>
      ) : (
        <StaticGallery />
      )}
    </MotionConfig>
  );
}
