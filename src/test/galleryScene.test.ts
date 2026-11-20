import { describe, expect, it } from 'vitest';
import { exhibits } from '../gallery/data';
import { createFaceGeometry, hexCorners } from '../gallery/scene/hexGeometry';
import { FACING_SHARE, HEX_RADIUS, ORBIT_RADIUS, RECEDE } from '../gallery/scene/layout';
import { framingDistance, framingLift, placeOnRing } from '../gallery/scene/placement';

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

describe('the ring', () => {
  it('puts case 0 in front of the camera and the others 120° round, each turned partly toward the visitor', () => {
    const front = placeOnRing(0, 0, 1, 3);
    close(front.x, 0);
    close(front.z, ORBIT_RADIUS);
    close(front.yaw, 0);
    const right = placeOnRing(1, 0, 1, 3);
    close(Math.atan2(right.x, right.z), (2 * Math.PI) / 3);
    close(right.yaw, ((2 * Math.PI) / 3) * FACING_SHARE);
    // Case 2 sits at −120°, not +240°: it turns the short way.
    close(placeOnRing(2, 0, 1, 3).yaw, ((-2 * Math.PI) / 3) * FACING_SHARE);
  });

  it('turns as one: a third of a turn brings the next case to the front', () => {
    const p = placeOnRing(1, (-2 * Math.PI) / 3, 1, 3);
    close(p.x, 0);
    close(p.z, ORBIT_RADIUS);
  });

  it('steps an inactive case back along its radius', () => {
    const p = placeOnRing(0, 0, 0, 3);
    close(p.z, ORBIT_RADIUS + RECEDE);
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
