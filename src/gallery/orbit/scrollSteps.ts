/**
 * Turning the wheel by scrolling: one project per scroll gesture, never more.
 *
 * Scrolling adds up until it passes a threshold, then gives one step (down = next, up =
 * previous) and locks. It unlocks only when the scrolling has been quiet for a moment, so the
 * long tail of a trackpad's momentum, or a mouse wheel turned a few notches in one go, can't
 * skip past projects. A small nudge does nothing at all.
 */

/** How far (in pixels) a gesture must scroll before it turns the wheel. */
export const STEP_PX = 60;
/** A pause this long (ms) ends a gesture; the next scroll may turn the wheel again. */
export const QUIET_MS = 220;

/** Scroll delta in pixels, whatever unit the browser reported it in (pixels, lines or pages). */
export function scrollPixels(deltaY: number, deltaMode: number, pageHeight: number): number {
  if (deltaMode === 1) return deltaY * 16; // lines
  if (deltaMode === 2) return deltaY * pageHeight; // pages
  return deltaY;
}

export class ScrollStepper {
  private total = 0;
  private locked = false;
  private last = -Infinity;

  /**
   * Adds one scroll event (pixels, at `now` ms). Returns 1 for "next", -1 for "previous", or 0
   * when this event does not turn the wheel.
   */
  push(pixels: number, now: number): -1 | 0 | 1 {
    if (now - this.last > QUIET_MS) {
      // A new gesture.
      this.locked = false;
      this.total = 0;
    }
    this.last = now;
    if (this.locked || pixels === 0) return 0;
    // Changing direction mid-gesture starts the count again.
    if (Math.sign(pixels) !== Math.sign(this.total) && this.total !== 0) this.total = 0;
    this.total += pixels;
    if (Math.abs(this.total) < STEP_PX) return 0;
    this.locked = true;
    const step = this.total > 0 ? 1 : -1;
    this.total = 0;
    return step;
  }
}
