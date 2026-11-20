import { describe, expect, it } from 'vitest';
import { TURN } from '../gallery/orbit/orbitPhysics';
import { ENTRANCE, entrancePose, OPENING, openingPose } from '../gallery/show/choreography';
import { formatHash, parseHash } from '../gallery/show/hash';
import { ShowState } from '../gallery/show/ShowState';
import { FULL_CLIP, handoffFrom } from '../gallery/ui/handoff';

const run = (show: ShowState, seconds: number) => {
  for (let t = 0; t < seconds; t += 1 / 60) show.step(1 / 60);
};

describe('the entrance', () => {
  it('starts dark, with the cases deep in the hall and the ring turned away', () => {
    const p = entrancePose(0);
    expect(p.hall).toBe(0);
    expect(p.lamp).toBe(0);
    expect(p.turn).toBeCloseTo(TURN * 0.5, 9);
    expect(Math.min(...p.depth)).toBeGreaterThan(10);
    expect(p.ui).toBe(false);
  });

  it('ends lit and settled, with the placard showing', () => {
    expect(entrancePose(1)).toEqual({ hall: 1, lamp: 1, turn: 0, depth: [0, 0, 0], ui: true });
  });

  it('brings the cases in one after another', () => {
    const mid = entrancePose(0.3).depth;
    expect(mid[0]).toBeLessThan(mid[1]);
    expect(mid[1]).toBeLessThan(mid[2]);
  });

  it('lights the spotlight last, after the ring has settled', () => {
    expect(entrancePose(0.6).lamp).toBe(0);
    expect(entrancePose(0.75).turn).toBeCloseTo(0, 9);
  });

  it('with reduced motion only fades the light up: nothing travels or turns', () => {
    for (const t of [0, 0.3, 0.7, 1]) {
      const p = entrancePose(t, true);
      expect(p.turn).toBe(0);
      expect(p.depth).toEqual([0, 0, 0]);
    }
  });
});

describe('opening a project', () => {
  it('withdraws and dims the other cases, darkens the hall and brings the camera in', () => {
    expect(openingPose(0)).toEqual({ withdraw: 0, others: 1, hall: 1, lamp: 1, approach: 0 });
    const open = openingPose(1);
    expect(open.withdraw).toBe(3);
    expect(open.others).toBeCloseTo(0.15, 9);
    expect(open.hall).toBeCloseTo(0.4, 9);
    expect(open.approach).toBe(1);
  });

  it('with reduced motion keeps the camera and the cases still: only the light changes', () => {
    const p = openingPose(1, true);
    expect(p.approach).toBe(0);
    expect(p.withdraw).toBe(0);
    expect(p.hall).toBeLessThan(1);
  });
});

describe('ShowState', () => {
  it('plays the entrance, then lets the visitor browse', () => {
    const show = new ShowState();
    expect(show.getPhase()).toBe('entering');
    run(show, ENTRANCE.full + 0.1);
    expect(show.getPhase()).toBe('browsing');
    expect(show.getUi()).toBe(true);
    expect(show.step(1 / 60)).toBe(false); // nothing moving: no frames drawn
  });

  it('skips the entrance on request', () => {
    const show = new ShowState();
    show.skipEntrance();
    run(show, 0.05);
    expect(show.getPhase()).toBe('browsing');
  });

  it('opens a case, hands over to the page when the camera arrives, and closes back to browsing', () => {
    const show = new ShowState({ entrance: 'short' });
    run(show, ENTRANCE.short + 0.1);
    const phases: string[] = [];
    show.subscribe(() => phases.push(show.getPhase()));
    show.openCase(2);
    run(show, OPENING.open + 0.1);
    expect(show.getPhase()).toBe('open');
    expect(show.approach).toBe(1);
    // The opened case keeps its light; the others dim.
    expect(show.caseLight[2]).toBe(1);
    expect(show.caseLight[0]).toBeLessThan(0.2);
    expect(show.getUi()).toBe(false);
    show.closeCase();
    run(show, OPENING.close + 0.1);
    expect(show.getPhase()).toBe('browsing');
    expect(show.approach).toBe(0);
    expect(phases).toEqual(expect.arrayContaining(['opening', 'open', 'closing', 'browsing']));
  });

  it('opening during the entrance finishes it first, then opens', () => {
    const show = new ShowState();
    show.openCase(1);
    run(show, OPENING.open + 0.2);
    expect(show.getPhase()).toBe('open');
    expect(show.opened).toBe(1);
  });

  it('ignores closing when nothing is open', () => {
    const show = new ShowState();
    show.closeCase();
    expect(show.getPhase()).toBe('entering');
  });

  it('can start with a project already open, from its own link', () => {
    const show = new ShowState({ startOpen: true, opened: 1 });
    expect(show.getPhase()).toBe('open');
    expect(show.opened).toBe(1);
    expect(show.approach).toBe(1);
  });
});

describe('the address', () => {
  const slugs = ['academic-sentinel', 'prematch-tracker', 'spendsync'];

  it('names the project in front, and whether it is open', () => {
    expect(parseHash('#prematch-tracker', slugs)).toEqual({ index: 1, open: false });
    expect(parseHash('#spendsync/open', slugs)).toEqual({ index: 2, open: true });
    expect(formatHash('spendsync', true)).toBe('#spendsync/open');
    expect(formatHash('academic-sentinel', false)).toBe('#academic-sentinel');
  });

  it('ignores an empty or unknown address', () => {
    expect(parseHash('', slugs)).toEqual({ index: null, open: false });
    expect(parseHash('#nope/open', slugs)).toEqual({ index: null, open: false });
  });
});

describe('the hand-off from the 3D screen to the page', () => {
  const corners = (clip: string) =>
    clip
      .replace(/^polygon\(|\)$/g, '')
      .split(', ')
      .map((pt) => pt.split(' ').map((v) => parseFloat(v) / 100));

  it('lays the screenshot over the 3D screen: the hexagon it is cut to lands exactly on it', () => {
    const from = { left: 400, top: 120, width: 520, height: 450 };
    const final = { left: 100, top: 90, width: 1100, height: 645 }; // a wide screenshot at rest
    const h = handoffFrom(from, final, { x: 0.58, y: 0.5 });
    const px = (u: number) => final.left + h.x + u * final.width * h.scale;
    const py = (v: number) => final.top + h.y + v * final.height * h.scale;
    const pts = corners(h.clip);
    expect(pts).toHaveLength(6);
    const xs = pts.map(([u]) => px(u));
    const ys = pts.map(([, v]) => py(v));
    expect(Math.min(...xs)).toBeCloseTo(from.left, 1);
    expect(Math.max(...xs)).toBeCloseTo(from.left + from.width, 1);
    expect(Math.min(...ys)).toBeCloseTo(from.top, 1);
    expect(Math.max(...ys)).toBeCloseTo(from.top + from.height, 1);
  });

  it('opens out to the full rectangle, with the same six points so it can animate between them', () => {
    expect(corners(FULL_CLIP)).toHaveLength(6);
  });
});
