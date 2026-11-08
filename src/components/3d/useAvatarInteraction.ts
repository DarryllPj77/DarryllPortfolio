import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import { clamp, createAvatarInput, LIMITS, resolveAvatarState } from './avatarInteraction';

/** Movement (px) before a press counts as a drag rather than a click. */
const DRAG_THRESHOLD = 6;
/** Radians of rotation per slot-width of horizontal drag. */
const DRAG_SENSITIVITY = 1.6;

interface Options {
  /** The element the avatar is drawn in. Used for drag and pointer maths. */
  target: RefObject<HTMLElement | null>;
  /** True once the 3D avatar is showing. */
  enabled: boolean;
  reducedMotion: boolean;
}

/**
 * DOM-side input for the avatar: pointer tracking (mouse/trackpad only),
 * horizontal drag to turn it, and click/tap to wave. Pointer positions go into
 * a mutable object read by the canvas each frame; only state changes
 * (start/stop dragging, waving, tracking) re-render.
 */
export function useAvatarInteraction({ target, enabled, reducedMotion }: Options) {
  const input = useRef(createAvatarInput());
  const [dragging, setDragging] = useState(false);
  const [waving, setWaving] = useState(false);
  const [pointerActive, setPointerActive] = useState(false);
  const [waveId, setWaveId] = useState(0);
  const press = useRef<{ id: number; startX: number; moved: boolean } | null>(null);

  const state = resolveAvatarState({ dragging, waving, pointerActive });

  const wave = useCallback(() => {
    if (!enabled || dragging || waving) return;
    setWaving(true);
    setWaveId((n) => n + 1);
  }, [enabled, dragging, waving]);

  const onWaveEnd = useCallback(() => setWaving(false), []);

  // Pointer tracking: only with a mouse or trackpad, never with reduced motion.
  useEffect(() => {
    if (!enabled || reducedMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const el = target.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Measured from roughly head height, scaled by the viewport so the turn stays small.
      const headX = rect.left + rect.width / 2;
      const headY = rect.top + rect.height * 0.25;
      input.current.pointer.x = clamp((e.clientX - headX) / (window.innerWidth / 2), -1, 1);
      input.current.pointer.y = clamp((headY - e.clientY) / (window.innerHeight / 2), -1, 1);
      setPointerActive(true);
    };
    const onLeave = () => setPointerActive(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      setPointerActive(false);
    };
  }, [enabled, reducedMotion, target, input]);

  const endPress = () => {
    press.current = null;
    setDragging(false);
  };

  const handlers = {
    onPointerDown(e: ReactPointerEvent<HTMLElement>) {
      if (!enabled || waving || e.button !== 0) return;
      press.current = { id: e.pointerId, startX: e.clientX, moved: false };
    },
    onPointerMove(e: ReactPointerEvent<HTMLElement>) {
      const p = press.current;
      if (!p || p.id !== e.pointerId) return;
      const dx = e.clientX - p.startX;
      if (!p.moved && Math.abs(dx) > DRAG_THRESHOLD) {
        p.moved = true;
        setDragging(true);
        // Keep receiving moves if the pointer leaves the slot. Best effort: it
        // throws for pointers the browser no longer tracks.
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* drag still works while the pointer stays over the slot */
        }
      }
      if (p.moved) {
        const width = e.currentTarget.clientWidth || 1;
        input.current.dragYaw = clamp((dx / width) * DRAG_SENSITIVITY, -LIMITS.dragYaw, LIMITS.dragYaw);
      }
    },
    onPointerUp(e: ReactPointerEvent<HTMLElement>) {
      const p = press.current;
      if (!p || p.id !== e.pointerId) return;
      endPress();
      if (!p.moved) wave();
    },
    onPointerCancel: endPress,
    onLostPointerCapture: () => {
      if (press.current?.moved) endPress();
    },
  };

  return { state, input, waveId, wave, onWaveEnd, handlers };
}
