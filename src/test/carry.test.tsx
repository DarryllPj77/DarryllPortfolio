import { act, render, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { TRAVELLING } from '../components/3d/avatarInteraction';
import { currentDocks, dockOffset, findDock } from '../components/companion/dropZones';
import {
  CARRYING_ATTR,
  MOUSE_HOLD_MS,
  TOUCH_HOLD_MS,
  useAvatarCarry,
} from '../components/companion/useAvatarCarry';
import { avatarDocks, isDockId } from '../data/avatarDocks';
import { INTRO_SEEN_KEY } from '../intro/introContext';

describe('Move Darryll destinations', () => {
  it('stands the avatar on the right edge with its feet on the bottom line', () => {
    expect(dockOffset({ w: 600, h: 200 }, { w: 116, h: 144 })).toEqual({ x: 484, y: 56 });
    // A short heading: the avatar rises above it rather than covering what is below.
    expect(dockOffset({ w: 600, h: 80 }, { w: 116, h: 144 })).toEqual({ x: 484, y: -64 });
    // Narrower than the avatar: it never moves past the left edge.
    expect(dockOffset({ w: 80, h: 200 }, { w: 116, h: 144 }).x).toBe(0);
  });

  it("skips the outgoing page's destination while the new page fades in", () => {
    document.body.innerHTML = '<header id="old" data-avatar-dock="contact"></header>';
    const outgoing = currentDocks();
    document.body.insertAdjacentHTML('beforeend', '<header id="new" data-avatar-dock="contact"></header>');
    expect(findDock('contact')?.id).toBe('old');
    expect(findDock('contact', outgoing)?.id).toBe('new');
    expect(findDock('about', outgoing)).toBeNull();
    document.body.innerHTML = '';
  });

  it('lists Home, Projects, About, Skills and Contact, and travels only while it moves', () => {
    expect(avatarDocks.map((d) => d.id)).toEqual(['home', 'projects', 'about', 'skills', 'contact']);
    expect(avatarDocks.find((d) => d.id === 'contact')?.waveOnArrival).toBe(true);
    expect(isDockId('certifications')).toBe(false);
    expect([...TRAVELLING].sort()).toEqual(['dragging', 'dropping', 'moving', 'returning']);
  });

  it.each([
    ['/', ['home', 'projects', 'contact']],
    ['/projects', ['projects']],
    ['/about', ['about']],
    ['/skills', ['skills']],
    ['/contact', ['contact']],
    ['/certifications', []],
  ])('marks the Move Darryll destinations on %s and nothing else', (path, ids) => {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    const { container } = render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
    const marked = Array.from(container.querySelectorAll('[data-avatar-dock]')).map((el) =>
      el.getAttribute('data-avatar-dock'),
    );
    expect(marked).toEqual(ids);
  });
});

describe('click versus hold on the avatar', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.removeAttribute(CARRYING_ATTR);
  });

  const press = (x: number, pointerType = 'mouse') =>
    ({
      button: 0,
      pointerId: 1,
      pointerType,
      clientX: x,
      clientY: 100,
      preventDefault: vi.fn(),
    }) as unknown as ReactPointerEvent<HTMLElement>;
  const fire = (type: string, x: number, y = 100) =>
    window.dispatchEvent(new PointerEvent(type, { pointerId: 1, clientX: x, clientY: y }));

  function setup() {
    const cb = {
      onGrab: vi.fn(),
      onDrag: vi.fn(),
      onDrop: vi.fn(),
      onTap: vi.fn(),
      onCancel: vi.fn(),
    };
    const hook = renderHook(() => useAvatarCarry(true, cb));
    return {
      cb,
      hook,
      down: (e: ReactPointerEvent<HTMLElement>) => act(() => hook.result.current.onPointerDown(e)),
      wait: (ms: number) => act(() => vi.advanceTimersByTime(ms)),
    };
  }

  it('waves on a quick click, and never picks it up', () => {
    const { cb, down, wait } = setup();
    const e = press(200);
    down(e);
    expect(e.preventDefault).toHaveBeenCalled(); // no text selection from the press
    wait(MOUSE_HOLD_MS - 40);
    fire('pointerup', 200);
    wait(MOUSE_HOLD_MS);
    expect(cb.onTap).toHaveBeenCalledTimes(1);
    expect(cb.onGrab).not.toHaveBeenCalled();
    expect(cb.onDrop).not.toHaveBeenCalled();
  });

  it('picks it up on a still hold, before any movement (so it shrinks at once)', () => {
    const { cb, down, wait } = setup();
    down(press(200));
    wait(MOUSE_HOLD_MS);
    expect(cb.onGrab).toHaveBeenCalledWith({ x: 200, y: 100 });
    expect(cb.onDrag).not.toHaveBeenCalled();
    expect(document.documentElement.hasAttribute(CARRYING_ATTR)).toBe(true);
  });

  it('carries on move and puts it down on release, without a wave afterwards', () => {
    const { cb, down, wait } = setup();
    down(press(200));
    wait(MOUSE_HOLD_MS);
    fire('pointermove', 420, 300);
    expect(cb.onDrag).toHaveBeenLastCalledWith({ x: 420, y: 300 });
    fire('pointerup', 640, 380);
    expect(cb.onDrop).toHaveBeenCalledWith({ x: 640, y: 380 });
    expect(cb.onTap).not.toHaveBeenCalled();
    expect(cb.onCancel).not.toHaveBeenCalled();
    expect(document.documentElement.hasAttribute(CARRYING_ATTR)).toBe(false);
  });

  it('a hold released without moving is a drop where it is, not a wave', () => {
    const { cb, down, wait } = setup();
    down(press(200));
    wait(MOUSE_HOLD_MS + 200);
    fire('pointerup', 200);
    expect(cb.onDrop).toHaveBeenCalledTimes(1);
    expect(cb.onTap).not.toHaveBeenCalled();
  });

  it('picks it up at once when pressed and moved, without waiting for the hold', () => {
    const { cb, down } = setup();
    down(press(200));
    fire('pointermove', 202); // a wobble is still a click
    expect(cb.onGrab).not.toHaveBeenCalled();
    fire('pointermove', 260, 140);
    expect(cb.onGrab).toHaveBeenCalledTimes(1);
    expect(cb.onDrag).toHaveBeenLastCalledWith({ x: 260, y: 140 });
  });

  it('swallows the click after a drop, so a link under the pointer does not open', () => {
    const { down } = setup();
    down(press(200));
    fire('pointermove', 300);
    fire('pointerup', 300);
    const link = document.createElement('a');
    link.href = '/projects';
    document.body.append(link);
    const followed = vi.fn();
    link.addEventListener('click', followed);
    link.click();
    expect(followed).not.toHaveBeenCalled();
    link.remove();
  });

  it('puts it down where it is if the browser takes the pointer away; Escape puts it back', () => {
    const first = setup();
    first.down(press(200));
    fire('pointermove', 300, 220);
    fire('pointercancel', 300, 220);
    expect(first.cb.onDrop).toHaveBeenCalledWith({ x: 300, y: 220 });
    expect(first.cb.onCancel).not.toHaveBeenCalled();
    first.hook.unmount();

    const second = setup();
    second.down(press(200));
    fire('pointermove', 300);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(second.cb.onCancel).toHaveBeenCalledTimes(1);
    fire('pointerup', 300);
    expect(second.cb.onDrop).not.toHaveBeenCalled();
  });

  it('on touch, a tap waves, a swipe scrolls the page, and a still hold picks it up', () => {
    const { cb, down, wait } = setup();
    // Tap.
    down(press(200, 'touch'));
    fire('pointerup', 200);
    expect(cb.onTap).toHaveBeenCalledTimes(1);

    // Swipe: moves before the hold completes, so the page scrolls instead.
    down(press(200, 'touch'));
    fire('pointermove', 200, 160);
    wait(TOUCH_HOLD_MS);
    expect(cb.onGrab).not.toHaveBeenCalled();

    // Hold, carry, release: it stays where it is put.
    down(press(200, 'touch'));
    wait(TOUCH_HOLD_MS);
    expect(cb.onGrab).toHaveBeenCalledTimes(1);
    fire('pointermove', 280, 180);
    fire('pointerup', 280, 180);
    expect(cb.onDrop).toHaveBeenCalledWith({ x: 280, y: 180 });
    expect(cb.onTap).toHaveBeenCalledTimes(1);
  });

  it('cleans its listeners up, so a release after unmounting does nothing', () => {
    const { cb, down, hook } = setup();
    down(press(200));
    hook.unmount();
    fire('pointermove', 300);
    fire('pointerup', 300);
    expect(cb.onDrag).not.toHaveBeenCalled();
    expect(cb.onDrop).not.toHaveBeenCalled();
    expect(cb.onTap).not.toHaveBeenCalled();
  });
});
