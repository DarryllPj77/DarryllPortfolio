import type { DockId } from '../../data/avatarDocks';
import type { Point, Size } from './companionPlacement';

/** The attribute a page puts on an element to make it a place "Move Darryll" can send the avatar to. */
export const DOCK_ATTR = 'data-avatar-dock';
/**
 * Finds a destination on the page. `skip` holds the outgoing page's destinations
 * during a page change (it stays mounted while it fades out), so the new page's is found.
 */
export function findDock(id: DockId, skip?: ReadonlySet<Element>): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[${DOCK_ATTR}="${id}"]`);
  return Array.from(all).find((el) => !skip?.has(el)) ?? null;
}

/** The destinations on the page right now, to skip while the page changes. */
export const currentDocks = (): ReadonlySet<Element> => new Set(document.querySelectorAll(`[${DOCK_ATTR}]`));

/**
 * Where the avatar stands in a destination, relative to its top-left: on the
 * right edge, feet on the bottom line, so headings and text on the left stay clear.
 */
export function dockOffset(zone: Size, avatar: Size): Point {
  return { x: Math.max(0, zone.w - avatar.w), y: zone.h - avatar.h };
}
