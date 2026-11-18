import { useEffect, useLayoutEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { Point } from './companionPlacement';

/** Mouse or pen: how long a still press must last to pick the avatar up (shorter is a click). */
export const MOUSE_HOLD_MS = 160;
/** Touch: how long a still finger must stay down to pick the avatar up (scrolling stays free). */
export const TOUCH_HOLD_MS = 300;
/** Mouse or pen: moving this far (px) before the hold completes picks it up straight away. */
const MOUSE_SLOP = 4;
/** Touch: moving this far (px) before the hold completes means the visitor is scrolling. */
const TOUCH_SLOP = 10;
/** Set on <html> while carrying: no text selection, a grabbing cursor everywhere. */
export const CARRYING_ATTR = 'data-avatar-carrying';

export interface CarryCallbacks {
  /** Picked up (the hold completed): shrink and lift at once, before any movement. */
  onGrab: (pointer: Point) => void;
  /** Carried to this pointer position. */
  onDrag: (pointer: Point) => void;
  /** Released while carried, here: it stays where it is put. */
  onDrop: (pointer: Point) => void;
  /** Released before the hold completed, without moving: a click or tap (a wave). */
  onTap: () => void;
  /** Escape while carried: put it back where it was picked up. */
  onCancel: () => void;
}

interface Session {
  id: number;
  touch: boolean;
  start: Point;
  last: Point;
  grabbed: boolean;
  timer?: number;
  cleanup: () => void;
}

/**
 * Click versus hold on the avatar, with Pointer Events. Two separate gestures:
 *
 *   quick click or tap                 → onTap (a wave)
 *   press and hold → picked up         → onGrab, then onDrag while moving → onDrop on release
 *
 * - Mouse or pen: held still for MOUSE_HOLD_MS, or moved past a few pixels, picks it up.
 * - Touch: a still finger held for TOUCH_HOLD_MS picks it up; a finger that moves sooner
 *   is left to the browser, so the page scrolls as usual.
 * - Once picked up, releasing is always a drop, never a wave, and the click the browser
 *   sends afterwards is swallowed so nothing under the pointer is followed.
 *
 * Moves are followed with window listeners rather than pointer capture, because the
 * avatar's element moves in the DOM when it is lifted out of where it stands.
 */
export function useAvatarCarry(enabled: boolean, callbacks: CarryCallbacks) {
  const cb = useRef(callbacks);
  useLayoutEffect(() => {
    cb.current = callbacks;
  });
  const session = useRef<Session | null>(null);

  const end = () => {
    session.current?.cleanup();
    session.current = null;
  };

  // Stop any carry when the avatar can no longer be carried, and on unmount.
  useEffect(() => {
    if (!enabled) end();
    return end;
  }, [enabled]);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || e.button !== 0 || session.current) return;
    const touch = e.pointerType === 'touch';
    // No text selection, focus change or native image drag from the press.
    if (!touch) e.preventDefault();

    const start = { x: e.clientX, y: e.clientY };
    const s: Session = { id: e.pointerId, touch, start, last: start, grabbed: false, cleanup: () => {} };

    const grab = () => {
      if (s.grabbed) return;
      window.clearTimeout(s.timer);
      s.grabbed = true;
      document.documentElement.setAttribute(CARRYING_ATTR, '');
      window.getSelection()?.removeAllRanges();
      cb.current.onGrab(s.last);
    };

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== s.id) return;
      s.last = { x: ev.clientX, y: ev.clientY };
      if (s.grabbed) {
        cb.current.onDrag(s.last);
        return;
      }
      const distance = Math.hypot(s.last.x - start.x, s.last.y - start.y);
      if (touch) {
        // A finger that moves before the hold completes is a scroll: let it go.
        if (distance > TOUCH_SLOP) end();
      } else if (distance > MOUSE_SLOP) {
        // Pressing and moving at once is a clear intent to carry.
        grab();
        cb.current.onDrag(s.last);
      }
    };

    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== s.id) return;
      const { grabbed } = s;
      end();
      if (grabbed) {
        swallowNextClick();
        cb.current.onDrop({ x: ev.clientX, y: ev.clientY });
      } else {
        cb.current.onTap();
      }
    };

    // The browser took the pointer away mid-carry: put it down where it is, never snap back.
    const cancel = (ev: PointerEvent) => {
      if (ev.pointerId !== s.id) return;
      const { grabbed } = s;
      end();
      if (grabbed) cb.current.onDrop(s.last);
    };

    const key = (ev: KeyboardEvent) => {
      if (ev.key !== 'Escape' || !s.grabbed) return;
      end();
      cb.current.onCancel();
    };

    // Once picked up on a touch screen, the finger carries the avatar instead of scrolling.
    const touchMove = (ev: TouchEvent) => {
      if (s.grabbed && ev.cancelable) ev.preventDefault();
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key);
    if (touch) window.addEventListener('touchmove', touchMove, { passive: false });

    s.cleanup = () => {
      window.clearTimeout(s.timer);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', key);
      window.removeEventListener('touchmove', touchMove);
      document.documentElement.removeAttribute(CARRYING_ATTR);
    };
    session.current = s;
    s.timer = window.setTimeout(grab, touch ? TOUCH_HOLD_MS : MOUSE_HOLD_MS);
  };

  return { onPointerDown };
}

/** Swallows the click the browser sends after a drop, so a link under the pointer does not open. */
function swallowNextClick() {
  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  window.addEventListener('click', stop, { capture: true, once: true });
  window.setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 80);
}
