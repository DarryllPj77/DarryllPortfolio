import type { FocalPoint } from '../scene/hexGeometry';
import type { ScreenRect } from '../show/ShowState';

/** Six corners of a flat-topped hexagon filling a box, in the box's own 0…1 space. */
const HEX = [
  [0.25, 0],
  [0.75, 0],
  [1, 0.5],
  [0.75, 1],
  [0.25, 1],
  [0, 0.5],
] as const;

/** The same six points spread to the corners and edge midpoints of the full rectangle. */
export const FULL_CLIP = 'polygon(0% 0%, 100% 0%, 100% 50%, 100% 100%, 0% 100%, 0% 50%)';

export interface Handoff {
  /** Move and scale (from the top-left corner) that put the screenshot over the 3D screen. */
  x: number;
  y: number;
  scale: number;
  /** The hexagon the screenshot is cut to at that moment, as a CSS clip-path. */
  clip: string;
}

/**
 * The step from the 3D scene into the page. The 3D screen shows the screenshot like
 * `object-fit: cover` inside a hexagon, centred on its focal point. This finds the move and
 * scale that lay the page's full screenshot (`final`, where it rests in the layout) exactly
 * over that, and the hexagon to cut it to; animating from there to nothing (and opening the
 * hexagon out to the full rectangle) hands the picture from the scene to the page.
 */
export function handoffFrom(from: ScreenRect, final: ScreenRect, focus: FocalPoint): Handoff {
  // Scale that makes the screenshot cover the hexagon's box.
  const scale = Math.max(from.width / final.width, from.height / final.height);
  // The hexagon's box as a share of the screenshot, centred on the focal point (kept inside).
  const kw = from.width / (final.width * scale);
  const kh = from.height / (final.height * scale);
  const cx = Math.min(1 - kw / 2, Math.max(kw / 2, focus.x));
  const cy = Math.min(1 - kh / 2, Math.max(kh / 2, focus.y));
  const clip = `polygon(${HEX.map(([px, py]) => `${((cx + (px - 0.5) * kw) * 100).toFixed(3)}% ${((cy + (py - 0.5) * kh) * 100).toFixed(3)}%`).join(', ')})`;
  // Put that focal centre on the 3D screen's centre.
  const left = from.left + from.width / 2 - cx * final.width * scale;
  const top = from.top + from.height / 2 - cy * final.height * scale;
  return { x: left - final.left, y: top - final.top, scale, clip };
}
