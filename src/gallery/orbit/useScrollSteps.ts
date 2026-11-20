import { useEffect, type RefObject } from 'react';
import { ScrollStepper, scrollPixels } from './scrollSteps';
import type { OrbitState } from './OrbitState';

/**
 * Scrolling over the 3D stage turns the wheel, one project per gesture: down for the next,
 * up for the previous. Only the stage listens, and only while the visitor is browsing a
 * collection: the lobby, an open project's page and anything else on the page scroll as they
 * normally would. Pinch-zoom (ctrl + wheel) is left to the browser.
 */
export function useScrollSteps(stage: RefObject<HTMLElement | null>, orbit: OrbitState, enabled: boolean) {
  useEffect(() => {
    const el = stage.current;
    if (!el || !enabled) return;
    const stepper = new ScrollStepper();
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      const step = stepper.push(scrollPixels(e.deltaY, e.deltaMode, el.clientHeight), e.timeStamp);
      if (step === 1) orbit.next();
      else if (step === -1) orbit.previous();
    };
    // Not passive: the stage keeps its scroll for the wheel instead of handing it to the page.
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [stage, orbit, enabled]);
}
