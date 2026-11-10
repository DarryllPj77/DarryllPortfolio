/**
 * Where the workspace companion goes and where its speech bubble opens.
 * Pure geometry in viewport pixels, so it can be tested without a browser.
 */
export interface Point {
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
}

/** The area the companion may stand in: the workspace between the top bar and the status bar. */
export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** The parts of a DOMRect the maths needs. */
export interface RectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/** Space between the companion and what it stands next to. */
export const GAP = 12;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Keeps a box of `size` with its top-left at (x, y) fully inside the bounds. */
export function clampToBounds(x: number, y: number, size: Size, b: Bounds): Point {
  return {
    x: clamp(x, b.left, Math.max(b.left, b.right - size.w)),
    y: clamp(y, b.top, Math.max(b.top, b.bottom - size.h)),
  };
}

/** Home base: the bottom-right corner of the workspace, just above the status bar. */
export function homeBase(size: Size, b: Bounds): Point {
  return clampToBounds(b.right - size.w, b.bottom - size.h, size, b);
}

/**
 * Next to a clicked element: below it when it sits in the top bar (above the
 * workspace), otherwise beside it on the right, or on the left when the right
 * has no room. Always inside the bounds.
 */
export function besideTarget(target: RectLike, size: Size, b: Bounds): Point {
  const centerX = target.left + target.width / 2;
  const centerY = target.top + target.height / 2;
  if (target.bottom <= b.top + 1) {
    return clampToBounds(centerX - size.w / 2, b.top, size, b);
  }
  const right = Math.max(target.right, b.left - GAP) + GAP;
  const x = right + size.w <= b.right ? right : target.left - GAP - size.w;
  return clampToBounds(x, centerY - size.h / 2, size, b);
}

/**
 * Lifting off where it stands: the small companion pops up in place, centred
 * over the large avatar at about chest height, then waits for a click.
 */
export function liftInPlace(from: RectLike, size: Size, b: Bounds): Point {
  const x = from.left + from.width / 2 - size.w / 2;
  const y = from.top + from.height * 0.3 - size.h / 2;
  return clampToBounds(x, y, size, b);
}

/** Standing on a clicked spot: the box's bottom centre on the point. */
export function atPoint(point: Point, size: Size, b: Bounds): Point {
  return clampToBounds(point.x - size.w / 2, point.y - size.h, size, b);
}

/** Glide length in seconds: longer trips take a little longer, within a calm range. */
export function travelSeconds(from: Point, to: Point): number {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  if (distance < 1) return 0;
  return clamp(0.4 + distance / 1500, 0.45, 1.1);
}

export type BubbleSide = 'right' | 'left' | 'top' | 'bottom';

export interface BubblePlacement extends Point {
  side: BubbleSide;
}

const overlaps = (a: Point & Size, r: RectLike) =>
  a.x < r.right && a.x + a.w > r.left && a.y < r.bottom && a.y + a.h > r.top;

/**
 * Opens the bubble beside the companion on the first side that fits on screen
 * and keeps clear of `avoid` (the element the visitor clicked), in the order
 * right, left, top, bottom. If no side fits it is pushed back inside the bounds.
 */
export function placeBubble(
  avatar: Point & Size,
  bubble: Size,
  b: Bounds,
  avoid?: RectLike | null,
): BubblePlacement {
  const headY = avatar.y + avatar.h * 0.08;
  const midX = avatar.x + avatar.w / 2 - bubble.w / 2;
  const candidates: BubblePlacement[] = [
    { side: 'right', x: avatar.x + avatar.w + GAP, y: headY },
    { side: 'left', x: avatar.x - GAP - bubble.w, y: headY },
    { side: 'top', x: midX, y: avatar.y - GAP - bubble.h },
    { side: 'bottom', x: midX, y: avatar.y + avatar.h + GAP },
  ];
  const fits = (c: Point) =>
    c.x >= b.left && c.y >= b.top && c.x + bubble.w <= b.right && c.y + bubble.h <= b.bottom;
  const clear = (c: Point) => !avoid || !overlaps({ ...c, ...bubble }, avoid);
  const exact = candidates.find((c) => fits(c) && clear(c));
  if (exact) return exact;
  // Nothing fits as is: push each side back on screen and take the first that stays clear.
  const pushed = candidates.map((c) => ({ side: c.side, ...clampToBounds(c.x, c.y, bubble, b) }));
  return pushed.find(clear) ?? pushed[0];
}
