import { useEffect, type RefObject } from 'react';
import type { OrbitState } from './OrbitState';
import { turnFor } from './orbitPhysics';

/** Which way the hand moves to turn the exhibit: sideways for a ring, up and down for a wheel. */
export type DragAxis = 'x' | 'y';

/** A press must move this far (px) along the axis before it becomes a drag; less is a click or tap. */
const DRAG_START = 6;
/** Release speed is measured over the last moments of the drag. */
const SAMPLE_MS = 90;

/**
 * Mouse, pen and touch dragging on the stage: the ring follows the hand sideways (half the
 * stage's width turns it by one case) and, on release, carries the hand's speed into its
 * settle. Movement after the press is followed on the window, so a drag that leaves the
 * stage still ends cleanly, and the scene's own click handling keeps working. Presses are
 * picked up on the window too (those over the stage), so dragging works whenever the lazily
 * loaded stage arrives.
 */
export function useOrbitDrag(
  stage: RefObject<HTMLElement | null>,
  orbit: OrbitState,
  enabled = true,
  axis: DragAxis = 'x',
) {
  useEffect(() => {
    // Only while browsing: not during the entrance, nor behind an open project.
    if (!enabled) return;
    let el: HTMLElement | null = null;

    let startX = 0;
    let pressing = false;
    let dragging = false;
    let radPerPx = 0;
    let samples: { x: number; t: number }[] = [];

    const setCursor = (c: string) => {
      if (el) el.style.cursor = c;
    };

    const along = (e: PointerEvent) => (axis === 'x' ? e.clientX : e.clientY);

    const onMove = (e: PointerEvent) => {
      if (!pressing) return;
      const dx = along(e) - startX;
      if (!dragging && Math.abs(dx) > DRAG_START) {
        dragging = true;
        orbit.beginDrag();
        setCursor('grabbing');
      }
      if (!dragging) return;
      orbit.dragBy(dx * radPerPx);
      const t = performance.now();
      samples.push({ x: along(e), t });
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
      const target = stage.current;
      if (e.button !== 0 || !e.isPrimary || !target || !(e.target instanceof Node) || !target.contains(e.target)) return;
      el = target;
      pressing = true;
      startX = along(e);
      samples = [{ x: startX, t: performance.now() }];
      // Half the stage's size along the axis (within sensible limits) turns it by one case.
      const span = axis === 'x' ? el.clientWidth : el.clientHeight;
      radPerPx = turnFor(orbit.count) / (Math.min(1200, Math.max(320, span)) * 0.5);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', finish);
      window.addEventListener('pointercancel', finish);
    };

    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
  }, [stage, orbit, enabled, axis]);
}
