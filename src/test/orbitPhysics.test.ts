import { describe, expect, it } from 'vitest';
import { OrbitState } from '../gallery/orbit/OrbitState';
import {
  caseAt,
  emphasisOf,
  MAX_SPEED,
  releaseTarget,
  rubberBand,
  stepSpring,
  stopFor,
  TURN,
} from '../gallery/orbit/orbitPhysics';

/** Runs the ring for `seconds` at 60 frames a second; returns the largest overshoot past its target. */
function run(orbit: OrbitState, seconds: number) {
  let overshoot = 0;
  for (let t = 0; t < seconds; t += 1 / 60) {
    orbit.step(1 / 60);
    const from = orbit.target;
    overshoot = Math.max(overshoot, Math.sign(orbit.velocity || 1) * (orbit.angle - from));
  }
  return overshoot;
}

describe('ring stops', () => {
  it('knows which case is in front at each stop, wrapping round', () => {
    expect([0, -TURN, -2 * TURN, -3 * TURN, TURN].map(caseAt)).toEqual([0, 1, 2, 0, 2]);
  });

  it('reaches a case the short way round', () => {
    // From case 0, case 2 is one step back, not two forward.
    expect(stopFor(2, 0)).toBeCloseTo(TURN, 9);
    expect(stopFor(1, 0)).toBeCloseTo(-TURN, 9);
    // After many turns it still picks the nearest equivalent stop.
    expect(stopFor(0, -9 * TURN)).toBeCloseTo(-9 * TURN, 9);
  });
});

describe('dragging and letting go', () => {
  it('follows the hand for one case either way, then resists', () => {
    expect(rubberBand(0.5 * TURN)).toBe(0.5 * TURN);
    expect(rubberBand(2 * TURN)).toBeCloseTo(1.25 * TURN, 9);
    expect(rubberBand(-2 * TURN)).toBeCloseTo(-1.25 * TURN, 9);
  });

  it('a slow release settles on the nearest case; a flick moves at most one case', () => {
    expect(releaseTarget(0.3 * TURN, 0, 0)).toBe(0);
    expect(releaseTarget(0.6 * TURN, 0, 0)).toBeCloseTo(TURN, 9);
    // A small flick is enough to go on to the next case…
    expect(releaseTarget(0.2 * TURN, 4, 0)).toBeCloseTo(TURN, 9);
    // …and the hardest fling still stops after one.
    expect(releaseTarget(1.2 * TURN, 1000, 0)).toBeCloseTo(TURN, 9);
    expect(releaseTarget(-1.2 * TURN, -1000, 0)).toBeCloseTo(-TURN, 9);
  });
});

describe('settling', () => {
  it('arrives without bouncing past the stop, and stands still', () => {
    let s = { angle: 0, velocity: 0 };
    let peak = 0;
    for (let i = 0; i < 120; i++) {
      s = stepSpring(s.angle, s.velocity, TURN, 1 / 60);
      peak = Math.max(peak, s.angle);
    }
    expect(peak).toBeLessThanOrEqual(TURN + 1e-6);
    expect(s.angle).toBeCloseTo(TURN, 3);
  });

  it('never turns faster than its speed limit, even after a long frame', () => {
    const s = stepSpring(0, 0, 100 * TURN, 5);
    expect(Math.abs(s.velocity)).toBeLessThanOrEqual(MAX_SPEED);
  });
});

describe('focus', () => {
  it('lights only the case in front, and passes smoothly to the next as the ring turns', () => {
    expect([0, 1, 2].map((i) => emphasisOf(i, 0))).toEqual([1, 0, 0]);
    const halfway = [0, 1, 2].map((i) => emphasisOf(i, -TURN / 2));
    expect(halfway[0]).toBeCloseTo(halfway[1], 9);
    expect(halfway[0]).toBeLessThan(0.3);
    expect(halfway[2]).toBe(0);
  });
});

describe('OrbitState', () => {
  it('next and previous bring the neighbouring cases to the front, and announce each change', () => {
    const orbit = new OrbitState();
    const heard: number[] = [];
    orbit.subscribe(() => heard.push(orbit.active));
    orbit.next();
    run(orbit, 1.5);
    expect(orbit.active).toBe(1);
    orbit.next();
    run(orbit, 1.5);
    expect(orbit.active).toBe(2);
    orbit.next();
    run(orbit, 1.5);
    expect(orbit.active).toBe(0); // wraps round
    orbit.previous();
    run(orbit, 1.5);
    expect(orbit.active).toBe(2);
    expect(heard).toEqual([1, 2, 0, 2]);
    expect(orbit.step(1 / 60)).toBe(false); // standing still
  });

  it('goes to a chosen case and settles exactly on it', () => {
    const orbit = new OrbitState();
    orbit.goTo(2);
    run(orbit, 1.5);
    expect(orbit.active).toBe(2);
    expect(orbit.angle).toBe(orbit.target);
    expect(orbit.emphasis[2]).toBe(1);
  });

  it('a drag to the left followed by a flick brings the next case in, and only that one', () => {
    const orbit = new OrbitState();
    orbit.beginDrag();
    orbit.dragBy(-0.3 * TURN);
    orbit.dragBy(-3 * TURN); // a long drag resists: three cases' worth of hand moves it one and a half
    expect(orbit.angle).toBeCloseTo(-1.5 * TURN, 9);
    orbit.endDrag(-1000);
    run(orbit, 2);
    expect(orbit.active).toBe(1);
  });

  it('with reduced motion, carries no momentum and arrives quickly', () => {
    const orbit = new OrbitState();
    orbit.setReducedMotion(true);
    orbit.next();
    run(orbit, 0.25);
    expect(orbit.active).toBe(1); // the new case is in front within a quarter second
    run(orbit, 0.35);
    expect(orbit.step(1 / 60)).toBe(false);
  });
});
