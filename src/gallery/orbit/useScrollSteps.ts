import { useEffect, type RefObject } from 'react';
import { ScrollStepper, scrollPixels } from './scrollSteps';
import type { OrbitState } from './OrbitState';

/**
 * Scrolling over the 3D stage turns the wheel, one project per gesture: down for the next,
 * up for the previous. Only the stage listens, and only while the visitor is browsing a
 * collection: the lobby, an open project's page and anything else on the page scroll as they
 * normally would. Pinch-zoom (ctrl + wheel) is left to the browser.
 *
 * It listens on the window and acts on scrolling over the stage, so it works whenever the stage
 * arrives: the 3D stage loads lazily, possibly after the collection is already showing.
 */
export function useScrollSteps(stage: RefObject<HTMLElement | null>, orbit: OrbitState, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const stepper = new ScrollStepper();
    const onWheel = (e: WheelEvent) => {
      const el = stage.current;
      if (e.ctrlKey || !el || !(e.target instanceof Node) || !el.contains(e.target)) return;
      e.preventDefault();
      const step = stepper.push(scrollPixels(e.deltaY, e.deltaMode, el.clientHeight), e.timeStamp);
      if (step === 1) orbit.next();
      else if (step === -1) orbit.previous();
    };
    // Not passive: the stage keeps its scroll for the wheel instead of handing it to the page.
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [stage, orbit, enabled]);
}
