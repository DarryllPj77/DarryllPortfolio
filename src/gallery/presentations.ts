import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { PresentationType } from './collections';
import type { DragAxis } from './orbit/useOrbitDrag';
import type { ExhibitionCanvasProps } from './scene/ExhibitionCanvas';

/**
 * How each presentation type is drawn. The Gallery itself (lobby, navigation, opening a
 * project, the HTML fallback) is the same for every collection; only this part differs.
 */
export interface PresentationSpec {
  /** The 3D exhibit, downloaded only when a collection using it is entered. */
  scene: LazyExoticComponent<ComponentType<ExhibitionCanvasProps>>;
  /** Which way the visitor's hand moves to turn it. */
  dragAxis: DragAxis;
}

export const presentations: Record<PresentationType, PresentationSpec> = {
  // Phase 1 still draws the cases on the horizontal ring; phase 2 replaces the scene with the
  // vertical wheel (and the drag axis with 'y'). Nothing else changes when it does.
  'vertical-wheel': {
    scene: lazy(() => import('./scene/ExhibitionCanvas')),
    dragAxis: 'x',
  },
};
