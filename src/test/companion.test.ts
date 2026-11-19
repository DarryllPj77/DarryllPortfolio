import { describe, expect, it } from 'vitest';
import { resolveAvatarState } from '../components/3d/avatarInteraction';
import { classifyClick, travelDestination } from '../components/companion/companionClicks';
import {
  atPoint,
  besideTarget,
  homeBase,
  liftInPlace,
  placeBubble,
  stepSwing,
  SWING,
  travelSeconds,
  type Bounds,
} from '../components/companion/companionPlacement';
import { companionLines, getCompanionLine } from '../data/companion';
import { explorerTree, primaryNav, sections } from '../data/navigation';
import { projects } from '../data/projects';

const bounds: Bounds = { left: 300, top: 60, right: 1268, bottom: 828 };
const size = { w: 116, h: 145 };
const rect = (left: number, top: number, width: number, height: number) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

describe('companion placement', () => {
  it('rests at the bottom-right of the workspace, above the status bar', () => {
    expect(homeBase(size, bounds)).toEqual({ x: 1268 - 116, y: 828 - 145 });
  });

  it('stands to the right of an Explorer file, inside the workspace', () => {
    const row = rect(60, 200, 220, 28);
    const p = besideTarget(row, size, bounds);
    expect(p.x).toBeGreaterThanOrEqual(bounds.left);
    expect(p.y + size.h / 2).toBeCloseTo(214, 0);
  });

  it('stands just below a top navigation link', () => {
    const link = rect(600, 10, 60, 28);
    expect(besideTarget(link, size, bounds)).toEqual({ x: 630 - 58, y: bounds.top });
  });

  it('goes to the left of a target near the right edge, and never leaves the bounds', () => {
    const target = rect(1150, 400, 100, 30);
    expect(besideTarget(target, size, bounds).x).toBe(1150 - 12 - 116);
    expect(atPoint({ x: 2000, y: 2000 }, size, bounds)).toEqual(homeBase(size, bounds));
    expect(atPoint({ x: 0, y: 0 }, size, bounds)).toEqual({ x: bounds.left, y: bounds.top });
  });

  it('lifts off right where the large avatar stands, without docking first', () => {
    const hero = rect(960, 176, 420, 520);
    const p = liftInPlace(hero, size, bounds);
    expect(p.x + size.w / 2).toBe(960 + 210);
    expect(p.y + size.h / 2).toBe(176 + 156);
    expect(p).not.toEqual(homeBase(size, bounds));
    // Near the top of the workspace it still stays below the top bar.
    expect(liftInPlace(rect(960, -200, 420, 520), size, bounds).y).toBe(bounds.top);
  });

  it('stands on a clicked spot', () => {
    expect(atPoint({ x: 700, y: 500 }, size, bounds)).toEqual({ x: 642, y: 355 });
  });

  it('glides for a calm, bounded time', () => {
    expect(travelSeconds({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
    expect(travelSeconds({ x: 0, y: 0 }, { x: 30, y: 0 })).toBe(0.45);
    expect(travelSeconds({ x: 0, y: 0 }, { x: 5000, y: 0 })).toBe(1.1);
  });

  it('opens the bubble on a side that fits and keeps it off the clicked element', () => {
    const bubble = { w: 260, h: 90 };
    expect(placeBubble({ x: 400, y: 300, ...size }, bubble, bounds).side).toBe('right');

    const atEdge = placeBubble({ x: 1150, y: 300, ...size }, bubble, bounds);
    expect(atEdge.side).toBe('left');
    expect(atEdge.x + bubble.w).toBeLessThanOrEqual(1150);

    const clicked = rect(540, 300, 200, 40);
    expect(placeBubble({ x: 400, y: 300, ...size }, bubble, bounds, clicked).side).not.toBe('right');

    const cramped = placeBubble({ x: 300, y: 60, w: 968, h: 768 }, bubble, bounds);
    expect(cramped.x).toBeGreaterThanOrEqual(bounds.left);
    expect(cramped.y + bubble.h).toBeLessThanOrEqual(bounds.bottom);
  });
});

describe('carried swing', () => {
  const run = (angle: number, speed: number, seconds: number) => {
    let s = { angle, velocity: 0 };
    let peak = angle;
    for (let t = 0; t < seconds; t += 1 / 60) {
      s = stepSwing(s.angle, s.velocity, speed, 1 / 60);
      peak = Math.max(peak, Math.abs(s.angle));
    }
    return { ...s, peak };
  };

  it('leans against the direction of travel, never past the limit', () => {
    expect(run(0, 600, 1).angle).toBeGreaterThan(5); // moving right: feet trail left
    expect(run(0, -600, 1).angle).toBeLessThan(-5);
    expect(run(0, 50_000, 1).peak).toBeLessThanOrEqual(SWING.max);
  });

  it('rights itself once the pointer stops, without swinging back past upright', () => {
    const settled = run(12, 0, 1.2);
    expect(Math.abs(settled.angle)).toBeLessThan(0.5);
    let s = { angle: 12, velocity: 0 };
    let lowest = 12;
    for (let i = 0; i < 120; i++) {
      s = stepSwing(s.angle, s.velocity, 0, 1 / 60);
      lowest = Math.min(lowest, s.angle);
    }
    expect(lowest).toBeGreaterThan(-1); // at most a hair past upright: no bounce
  });
});

describe('companion clicks', () => {
  const click = (target: Element, extra: Partial<MouseEvent> = {}) =>
    ({
      button: 0,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      clientX: 50,
      clientY: 60,
      target,
      ...extra,
    }) as MouseEvent;
  const collapsed = { isCollapsed: true } as Selection;

  const setup = () => {
    document.body.innerHTML = `
      <nav><a href="/about" data-companion="/about"><span id="label">Darryll.md</span></a></nav>
      <main id="main"><p id="text">Words</p><a id="link" href="/x">Link</a><button id="btn">Go</button><div id="blank"></div></main>`;
    const $ = (id: string) => document.getElementById(id)!;
    return { $, main: $('main') };
  };

  it('sends the companion to a marked file or link, even from a child element', () => {
    const { $, main } = setup();
    expect(classifyClick(click($('label')), main, collapsed)).toMatchObject({
      kind: 'target',
      key: '/about',
    });
  });

  it('roams to empty workspace space, but not for links, buttons, selections or modified clicks', () => {
    const { $, main } = setup();
    expect(classifyClick(click($('blank')), main, collapsed)).toEqual({ kind: 'roam', x: 50, y: 60 });
    expect(classifyClick(click($('text')), main, collapsed)).toMatchObject({ kind: 'roam' });
    expect(classifyClick(click($('link')), main, collapsed)).toBeNull();
    expect(classifyClick(click($('btn')), main, collapsed)).toBeNull();
    expect(classifyClick(click($('blank')), main, { isCollapsed: false } as Selection)).toBeNull();
    expect(classifyClick(click($('blank'), { ctrlKey: true }), main, collapsed)).toBeNull();
    expect(classifyClick(click($('blank'), { button: 2 }), main, collapsed)).toBeNull();
  });

  it('ignores clicks outside the workspace', () => {
    const { main } = setup();
    const outside = document.createElement('div');
    document.body.append(outside);
    expect(classifyClick(click(outside), main, collapsed)).toBeNull();
  });
});

describe('right-click travel', () => {
  const setup = () => {
    document.body.innerHTML = `
      <header id="top"><a id="nav" href="/">Home</a></header>
      <aside id="explorer-panel"><a id="file" href="/about">Darryll.md</a></aside>
      <main id="main"><p id="text">Words</p><input id="field" /><div id="avatar"></div></main>
      <footer id="status">Status</footer>`;
    return (id: string) => document.getElementById(id)!;
  };
  const collapsed = { isCollapsed: true } as Selection;
  const ev = (target: Element, extra: Partial<MouseEvent> & { pointerType?: string } = {}) => ({
    clientX: 640,
    clientY: 480,
    shiftKey: false,
    target,
    pointerType: 'mouse',
    ...extra,
  });
  const notAvatar = () => false;

  it('sends it to the pointer from anywhere in the workspace, links and the Explorer included', () => {
    const $ = setup();
    expect(travelDestination(ev($('text')), notAvatar, collapsed)).toEqual({ x: 640, y: 480 });
    expect(travelDestination(ev($('file')), notAvatar, collapsed)).toEqual({ x: 640, y: 480 });
    expect(travelDestination(ev($('text'), { pointerType: 'pen' }), notAvatar, collapsed)).not.toBeNull();
  });

  it('keeps the browser menu for touch, Shift, text fields, selected text and outside the workspace', () => {
    const $ = setup();
    expect(travelDestination(ev($('text'), { pointerType: 'touch' }), notAvatar, collapsed)).toBeNull();
    expect(travelDestination(ev($('text'), { shiftKey: true }), notAvatar, collapsed)).toBeNull();
    expect(travelDestination(ev($('field')), notAvatar, collapsed)).toBeNull();
    expect(travelDestination(ev($('text')), notAvatar, { isCollapsed: false } as Selection)).toBeNull();
    expect(travelDestination(ev($('nav')), notAvatar, collapsed)).toBeNull();
    expect(travelDestination(ev($('status')), notAvatar, collapsed)).toBeNull();
  });

  it('counts a right-click on the avatar itself (it lives outside the page content)', () => {
    setup();
    const avatar = document.createElement('div');
    document.body.append(avatar);
    expect(travelDestination(ev(avatar), (el) => el === avatar, collapsed)).not.toBeNull();
  });
});

describe('companion lines', () => {
  it('has a line for every Explorer file and folder and every top navigation link', () => {
    const keys = [
      ...primaryNav.map((id) => sections[id].path),
      ...explorerTree.flatMap((node) =>
        node.kind === 'folder'
          ? [`/${node.id}`, ...node.children.map((f) => `${f.path}${f.hash ?? ''}`)]
          : [`${node.path}${node.hash ?? ''}`],
      ),
    ];
    for (const key of keys) expect(getCompanionLine(key), key).toBeDefined();
  });

  it('opens About with a line about the background', () => {
    expect(companionLines['/about']).toMatchObject({ title: 'Darryll.md' });
    expect(companionLines['/about'].text).toMatch(/^Let me tell you a bit about my background!/);
  });

  it('keeps each project line in step with how the project was built', () => {
    for (const p of projects) {
      const { text } = companionLines[`/projects/${p.slug}`];
      expect(text).toContain(p.tagline);
      expect(text).toMatch(/AI tools/);
    }
  });
});

describe('companion state priority', () => {
  const flags = { turning: false, waving: false, pointerActive: true };

  it('puts what the companion is doing above pointer tracking, below a wave or a turn', () => {
    expect(resolveAvatarState({ ...flags, activity: 'grabbed' })).toBe('grabbed');
    expect(resolveAvatarState({ ...flags, activity: 'dragging' })).toBe('dragging');
    expect(resolveAvatarState({ ...flags, activity: 'dropping' })).toBe('dropping');
    expect(resolveAvatarState({ ...flags, activity: 'settling' })).toBe('settling');
    expect(resolveAvatarState({ ...flags, activity: 'returning' })).toBe('returning');
    expect(resolveAvatarState({ ...flags, activity: 'moving' })).toBe('moving');
    expect(resolveAvatarState({ ...flags, activity: 'talking' })).toBe('talking');
    expect(resolveAvatarState({ ...flags, activity: 'lookingAround' })).toBe('lookingAround');
    expect(resolveAvatarState({ ...flags, waving: true, activity: 'moving' })).toBe('waving');
    expect(resolveAvatarState({ ...flags, turning: true, activity: 'dragging' })).toBe('turning');
  });
});
