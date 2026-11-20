import { describe, expect, it } from 'vitest';
import { exhibits } from '../gallery/data';
import { createFaceGeometry, hexCorners } from '../gallery/scene/hexGeometry';
import { OrbitState } from '../gallery/orbit/OrbitState';
import {
  AXLE_Y,
  CABIN_TILT,
  HEX_HALF_HEIGHT,
  HEX_RADIUS,
  RECEDE,
  WHEEL_DEPTH,
} from '../gallery/scene/layout';
import { framingDistance, framingLift, placeOnWheel } from '../gallery/scene/placement';

const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 6);

describe('hexagonal display case', () => {
  it('is a true flat-topped hexagon: six equal sides, flat top and bottom', () => {
    const c = hexCorners(HEX_RADIUS);
    expect(c).toHaveLength(6);
    for (let i = 0; i < 6; i++) {
      const [ax, ay] = c[i];
      const [bx, by] = c[(i + 1) % 6];
      close(Math.hypot(bx - ax, by - ay), HEX_RADIUS);
    }
    // The top edge is horizontal: corners 1 and 2 share a height.
    close(c[1][1], c[2][1]);
  });

  it('fills its screen with the screenshot like object-fit: cover, around the focal point, inside the image', () => {
    for (const g of exhibits) {
      const uv = createFaceGeometry(g.cover, g.focus).getAttribute('uv');
      const us = Array.from({ length: uv.count }, (_, i) => uv.getX(i));
      const vs = Array.from({ length: uv.count }, (_, i) => uv.getY(i));
      // Never samples outside the picture (no stretched or repeated edges).
      for (const v of [...us, ...vs]) {
        // (Texture coordinates are stored as 32-bit floats.)
        expect(v).toBeGreaterThanOrEqual(-1e-6);
        expect(v).toBeLessThanOrEqual(1 + 1e-6);
      }
      // One direction is used in full: the crop only trims the other.
      const spanU = Math.max(...us) - Math.min(...us);
      const spanV = Math.max(...vs) - Math.min(...vs);
      expect(Math.max(spanU, spanV), g.slug).toBeCloseTo(1, 5);
      // The picture keeps its proportions: span ratio × image ratio = the hexagon's own ratio.
      const hexRatio = 2 / Math.sqrt(3);
      expect((spanU / spanV) * (g.cover.width / g.cover.height), g.slug).toBeCloseTo(hexRatio, 5);
    }
  });
});

describe('the hexagon carousel', () => {
  const N = 3;
  const THIRD = (2 * Math.PI) / 3;

  it('puts project 0 in front, the next one to the right and the previous one to the left, a third of a turn apart', () => {
    const front = placeOnWheel(0, 0, 1, N);
    close(front.x, 0);
    close(front.z, WHEEL_DEPTH);
    close(front.yaw, 0);
    const next = placeOnWheel(1, 0, 1, N);
    close(next.angle, -THIRD);
    expect(next.x).toBeGreaterThan(0); // waiting to the right
    expect(next.z).toBeLessThan(0); // and behind the axis
    const previous = placeOnWheel(2, 0, 1, N);
    close(previous.angle, THIRD); // the short way round: to the left
    expect(previous.x).toBeLessThan(0);
  });

  it('turns side to side only: every case stays at the same height', () => {
    for (let a = -Math.PI; a <= Math.PI; a += 0.1) {
      for (let i = 0; i < N; i++) close(placeOnWheel(i, a, Math.random(), N, Math.random()).y, AXLE_Y);
    }
  });

  it('turns as one: "next" brings the case from the right into the front', () => {
    const orbit = new OrbitState({ count: N });
    orbit.next();
    for (let t = 0; t < 2; t += 1 / 60) orbit.step(1 / 60);
    const p = placeOnWheel(1, orbit.angle, 1, N);
    close(p.x, 0);
    close(p.z, WHEEL_DEPTH);
    // Halfway there it was still to the right of the front, coming forward.
    const halfway = placeOnWheel(1, -THIRD / 2, 1, N);
    expect(halfway.x).toBeGreaterThan(0);
    expect(halfway.z).toBeGreaterThan(0);
  });

  it('keeps every case upright, turning only a little toward the visitor', () => {
    for (const angle of [0, 0.5, 1, 2, 3, -1, -2.5]) {
      for (let i = 0; i < N; i++) {
        const p = placeOnWheel(i, angle, 1, N);
        close(p.yaw, -p.angle * CABIN_TILT);
        expect(Math.abs(p.yaw)).toBeLessThanOrEqual(Math.PI * CABIN_TILT + 1e-9);
      }
    }
  });

  it('floats every case clear of the floor', () => {
    expect(AXLE_Y - HEX_HALF_HEIGHT).toBeGreaterThan(0.25);
  });

  it('withdraws other cabins back into the hall at the same height while a project opens', () => {
    const still = placeOnWheel(1, 0, 0, N);
    const away = placeOnWheel(1, 0, 0, N, 3);
    close(away.y, still.y);
    close(away.z, still.z - 3);
  });

  it('steps a cabin that is not in front further back into the hall, at the same height', () => {
    const p = placeOnWheel(0, 0, 0, N);
    close(p.z, WHEEL_DEPTH - RECEDE);
    close(p.y, AXLE_Y);
  });

  it('sends the others far behind the front case, so perspective makes them smaller', () => {
    const front = placeOnWheel(0, 0, 1, N);
    for (const i of [1, 2]) expect(front.z - placeOnWheel(i, 0, 0, N).z).toBeGreaterThan(WHEEL_DEPTH);
  });

  it('holds exactly the projects it is given, spaced evenly: no copies to fill it out', () => {
    for (const count of [3, 4, 5]) {
      const angles = Array.from({ length: count }, (_, i) => placeOnWheel(i, 0, 1, count).angle);
      const sorted = [...angles].sort((x, y) => x - y);
      for (let i = 1; i < count; i++) close(sorted[i] - sorted[i - 1], (2 * Math.PI) / count);
    }
  });
});

describe('camera framing', () => {
  it('stands further back on a narrow phone screen than on a wide one, so the case always fits', () => {
    expect(framingDistance(30, 375 / 812)).toBeGreaterThan(framingDistance(30, 1280 / 800));
    // On wide screens the height decides, so widening further changes nothing.
    close(framingDistance(30, 16 / 9), framingDistance(30, 21 / 9));
  });

  it('raises the case into the spare height of a tall screen, and leaves wide screens alone', () => {
    expect(framingLift(30, 375 / 812)).toBeGreaterThan(0);
    close(framingLift(30, 1280 / 800), 0);
  });
});
