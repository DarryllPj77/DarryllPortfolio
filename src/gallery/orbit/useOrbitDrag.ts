import { useEffect, type RefObject } from 'react';
import type { OrbitState } from './OrbitState';
import { TURN } from './orbitPhysics';

/** A press must move this far (px) sideways before it becomes a drag; less is a click or tap. */
const DRAG_START = 6;
/** Release speed is measured over the last moments of the drag. */
const SAMPLE_MS = 90;

/**
 * Mouse, pen and touch dragging on the stage: the ring follows the hand sideways (half the
 * stage's width turns it by one case) and, on release, carries the hand's speed into its
 * settle. Movement after the press is followed on the window, so a drag that leaves the
 * stage still ends cleanly, and the scene's own click handling keeps working.
 */
export function useOrbitDrag(stage: RefObject<HTMLElement | null>, orbit: OrbitState) {
  useEffect(() => {
    const el = stage.current;
    if (!el) return;

    let startX = 0;
    let pressing = false;
    let dragging = false;
    let radPerPx = 0;
    let samples: { x: number; t: number }[] = [];

    const setCursor = (c: string) => {
      el.style.cursor = c;
    };

    const onMove = (e: PointerEvent) => {
      if (!pressing) return;
      const dx = e.clientX - startX;
      if (!dragging && Math.abs(dx) > DRAG_START) {
        dragging = true;
        orbit.beginDrag();
        setCursor('grabbing');
      }
      if (!dragging) return;
      orbit.dragBy(dx * radPerPx);
      const t = performance.now();
      samples.push({ x: e.clientX, t });
      samples = samples.filter((s) => t - s.t <= SAMPLE_MS);
    };

    const finish = (e: PointerEvent) => {
      if (!pressing) return;
      pressing = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      setCursor('');
      if (!dragging) return;
      dragging = false;
      const first = samples[0];
      const last = samples.at(-1);
      const seconds = first && last ? (last.t - first.t) / 1000 : 0;
      const pxPerSecond = e.type === 'pointerup' && seconds > 0.01 ? (last!.x - first!.x) / seconds : 0;
      orbit.endDrag(pxPerSecond * radPerPx);
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || !e.isPrimary) return;
      pressing = true;
      startX = e.clientX;
      samples = [{ x: e.clientX, t: performance.now() }];
      // Half the stage's width (within sensible limits) turns the ring by one case.
      radPerPx = TURN / (Math.min(1200, Math.max(320, el.clientWidth)) * 0.5);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', finish);
      window.addEventListener('pointercancel', finish);
    };

    el.addEventListener('pointerdown', onDown);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
  }, [stage, orbit]);
}
