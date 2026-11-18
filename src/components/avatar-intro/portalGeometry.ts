/**
 * The fracture that splits the portrait into two doors, in percent of the portrait (x, y),
 * shared by both halves so they meet exactly: no gap, no overlap. It follows Darryll's
 * reference line down the middle of the photo: from the top of the head (about 47.5%
 * across), drifting a little left through the chest (about 45%), and back to about 47.5%
 * at the bottom, with a small fractured zigzag (about ±1.2%) along that line.
 */
export type Point = readonly [x: number, y: number];

/** The reference line itself: where the fracture is centred at each height. */
export const FRACTURE_GUIDE: readonly Point[] = [
  [47.4, 0],
  [46.7, 10],
  [46, 25],
  [45.3, 40],
  [45.3, 55],
  [46.4, 70],
  [46.9, 85],
  [47.4, 100],
];

export const FRACTURE: readonly Point[] = [
  [47.5, 0],
  [46.2, 9],
  [47.6, 18],
  [45.4, 28],
  [46.6, 38],
  [44.4, 48],
  [46.1, 58],
  [45.0, 68],
  [47.4, 78],
  [46.0, 89],
  [47.5, 100],
];

const pct = ([x, y]: Point) => `${x}% ${y}%`;

/** The left door: the left edge, down the fracture. */
export function leftClip(points: readonly Point[] = FRACTURE): string {
  return `polygon(0% 0%, ${points.map(pct).join(', ')}, 0% 100%)`;
}

/** The right door: down the fracture, then the right edge. */
export function rightClip(points: readonly Point[] = FRACTURE): string {
  return `polygon(${points.map(pct).join(', ')}, 100% 100%, 100% 0%)`;
}

/** The fracture as SVG polyline points in a 0..100 viewBox, for the thin seam line. */
export function seamPoints(points: readonly Point[] = FRACTURE): string {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}
