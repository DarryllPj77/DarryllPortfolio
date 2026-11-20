import { describe, expect, it } from 'vitest';
import { QUIET_MS, ScrollStepper, scrollPixels, STEP_PX } from '../gallery/orbit/scrollSteps';

/** Feeds a gesture: `events` deltas, `gap` ms apart, from time `start`. Returns the steps given. */
function gesture(stepper: ScrollStepper, deltas: number[], gap = 16, start = 1000) {
  return deltas.map((d, i) => stepper.push(d, start + i * gap)).filter((s) => s !== 0);
}

describe('turning the wheel by scrolling', () => {
  it('scroll down brings the next project, scroll up the previous one', () => {
    expect(gesture(new ScrollStepper(), [40, 40])).toEqual([1]);
    expect(gesture(new ScrollStepper(), [-40, -40])).toEqual([-1]);
  });

  it('ignores a small nudge', () => {
    expect(gesture(new ScrollStepper(), [10, 15, 20])).toEqual([]);
    expect(10 + 15 + 20).toBeLessThan(STEP_PX);
  });

  it('moves one project per gesture, however long a trackpad keeps coasting', () => {
    // A strong flick, then 40 frames of slowly fading momentum: still one step.
    const coasting = [120, 90, 70, ...Array.from({ length: 40 }, (_, i) => 50 * 0.9 ** i)];
    expect(gesture(new ScrollStepper(), coasting)).toEqual([1]);
  });

  it('a mouse wheel turned several notches at once is one step too', () => {
    expect(gesture(new ScrollStepper(), [100, 100, 100, 100], 30)).toEqual([1]);
  });

  it('turns again for the next gesture, after a short pause', () => {
    const stepper = new ScrollStepper();
    expect(gesture(stepper, [100], 16, 1000)).toEqual([1]);
    // Still the same gesture: ignored.
    expect(gesture(stepper, [100], 16, 1000 + QUIET_MS - 50)).toEqual([]);
    // A pause, then a new gesture.
    expect(gesture(stepper, [100], 16, 1000 + 3 * QUIET_MS)).toEqual([1]);
    expect(gesture(stepper, [-100], 16, 1000 + 6 * QUIET_MS)).toEqual([-1]);
  });

  it('starts counting again if the direction changes before a step', () => {
    expect(gesture(new ScrollStepper(), [50, -20, -50])).toEqual([-1]);
  });

  it('reads line- and page-based scrolling as pixels', () => {
    expect(scrollPixels(3, 1, 800)).toBe(48); // three lines
    expect(scrollPixels(1, 2, 800)).toBe(800); // one page
    expect(scrollPixels(57, 0, 800)).toBe(57);
  });
});
