import { afterEach, describe, expect, it } from 'vitest';
import {
  easeOut,
  ENTRANCE,
  INTRO,
  introDone,
  isCovered,
  markIntroDone,
  resetIntro,
} from '../components/avatar-intro/introTimeline';
import {
  FRACTURE,
  FRACTURE_GUIDE,
  leftClip,
  rightClip,
  seamPoints,
} from '../components/avatar-intro/portalGeometry';
import { portrait } from '../data/portrait';

describe('portrait fracture', () => {
  it('splits the portrait into two doors that share one zigzag edge, top to bottom', () => {
    expect(FRACTURE[0][1]).toBe(0);
    expect(FRACTURE.at(-1)![1]).toBe(100);
    const edge = FRACTURE.map(([x, y]) => `${x}% ${y}%`).join(', ');
    expect(leftClip()).toBe(`polygon(0% 0%, ${edge}, 0% 100%)`);
    expect(rightClip()).toBe(`polygon(${edge}, 100% 100%, 100% 0%)`);
    expect(seamPoints().split(' ')).toHaveLength(FRACTURE.length);
  });

  it('follows the reference line down the middle of the photo, staying close to it', () => {
    // Where the reference line is at a given height, by straight lines between its points.
    const guideAt = (y: number) => {
      const i = FRACTURE_GUIDE.findIndex(([, gy]) => gy >= y);
      if (i <= 0) return FRACTURE_GUIDE[0][0];
      const [x0, y0] = FRACTURE_GUIDE[i - 1];
      const [x1, y1] = FRACTURE_GUIDE[i];
      return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
    };
    for (const [x, y] of FRACTURE) expect(Math.abs(x - guideAt(y))).toBeLessThanOrEqual(1.5);
    // Starts and ends near the top and bottom centre, never far from the middle.
    expect(Math.abs(FRACTURE[0][0] - 47.5)).toBeLessThan(1);
    expect(Math.abs(FRACTURE.at(-1)![0] - 47.5)).toBeLessThan(1);
    for (const [x] of FRACTURE) expect(x).toBeGreaterThan(43);
    for (const [x] of FRACTURE) expect(x).toBeLessThan(49);
  });

  it('zigzags rather than running straight', () => {
    const xs = FRACTURE.map(([x]) => x);
    const turns = xs.slice(1, -1).filter((x, i) => Math.sign(x - xs[i]) !== Math.sign(xs[i + 2] - x));
    expect(turns.length).toBeGreaterThanOrEqual(5);
  });
});

describe('introduction timeline', () => {
  afterEach(() => resetIntro());

  it('takes about 1.45 s from the click to the interactive avatar', () => {
    const total = INTRO.scan + INTRO.seam + INTRO.emergeAfter + INTRO.readyAfter;
    expect(total).toBeGreaterThanOrEqual(1000);
    expect(total).toBeLessThanOrEqual(1500);
    // The doors finish fading before the avatar is ready, and the model's entrance before that.
    expect(INTRO.doorsFadeAfter + INTRO.doorsFade).toBeLessThanOrEqual(INTRO.readyAfter);
    expect(INTRO.emerge).toBeLessThanOrEqual(INTRO.readyAfter);
    // Reduced motion: only a short crossfade.
    expect(INTRO.crossfade).toBeLessThanOrEqual(250);
  });

  it('plays once per page load, and never stores it in the browser', () => {
    expect(introDone()).toBe(false);
    markIntroDone();
    expect(introDone()).toBe(true);
    // A reload starts fresh: nothing is kept in session or local storage.
    expect(window.sessionStorage.length).toBe(0);
    expect(window.localStorage.length).toBe(0);
  });

  it('keeps the avatar hidden behind the portrait until it emerges', () => {
    expect(isCovered('portrait')).toBe(true);
    expect(isCovered('scanning')).toBe(true);
    expect(isCovered('opening')).toBe(true);
    expect(isCovered('failed')).toBe(true);
    expect(isCovered('emerging')).toBe(false);
    expect(isCovered('ready')).toBe(false);
  });

  it('brings the model in from smaller and further back, ending exactly at rest', () => {
    expect(ENTRANCE.from).toBeCloseTo(0.65);
    expect(easeOut(0)).toBe(0);
    expect(easeOut(1)).toBe(1);
    expect(easeOut(0.5)).toBeGreaterThan(0.5); // eases out: quick start, gentle settle
  });
});

describe('portrait asset', () => {
  it('uses the project copies, never the original photo', () => {
    expect(portrait.src.startsWith('/image/darryll/')).toBe(true);
    expect(portrait.srcSet).toContain('portrait-512.jpg 512w');
    expect(portrait.srcSet).toContain('portrait-1024.jpg 1024w');
    expect(portrait.width).toBe(portrait.height); // the whole square photo, uncropped
    expect(portrait.alt).toMatch(/darryll/i);
  });
});
