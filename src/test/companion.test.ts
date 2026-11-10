import { describe, expect, it } from 'vitest';
import { resolveAvatarState } from '../components/3d/avatarInteraction';
import { classifyClick } from '../components/companion/companionClicks';
import {
  atPoint,
  besideTarget,
  homeBase,
  liftInPlace,
  placeBubble,
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
  const flags = { dragging: false, waving: false, pointerActive: true };

  it('puts what the companion is doing above pointer tracking, below a wave or a drag', () => {
    expect(resolveAvatarState({ ...flags, activity: 'moving' })).toBe('moving');
    expect(resolveAvatarState({ ...flags, activity: 'talking' })).toBe('talking');
    expect(resolveAvatarState({ ...flags, activity: 'lookingAround' })).toBe('lookingAround');
    expect(resolveAvatarState({ ...flags, waving: true, activity: 'moving' })).toBe('waving');
    expect(resolveAvatarState({ ...flags, dragging: true, activity: 'talking' })).toBe('dragging');
  });
});
