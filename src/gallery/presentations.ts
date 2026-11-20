import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { PresentationType } from './collections';
import type { DragAxis } from './orbit/useOrbitDrag';
import type { CollectionSceneProps } from './scene/CollectionScene';

/**
 * How each presentation type is drawn. The Gallery itself (lobby, navigation, opening a
 * project, the HTML fallback) is the same for every collection; only this part differs.
 */
export interface PresentationSpec {
  /** The 3D exhibit, downloaded only when a collection using it is entered. */
  scene: LazyExoticComponent<ComponentType<CollectionSceneProps>>;
  /** Which way the visitor's hand moves to turn it. */
  dragAxis: DragAxis;
}

export const presentations: Record<PresentationType, PresentationSpec> = {
  // The cases travel a level ring; the hand moves side to side.
  'hex-carousel': {
    scene: lazy(() => import('./scene/CollectionScene')),
    dragAxis: 'x',
  },
};
