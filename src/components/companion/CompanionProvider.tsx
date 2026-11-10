import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
} from 'motion/react';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { getCompanionLine } from '../../data/companion';
import { useAvatarCapability } from '../../hooks/useAvatarCapability';
import { useLayoutMode, useMediaQuery } from '../../hooks/useMediaQuery';
import { useIntro } from '../../intro/introContext';
import { duration, ease } from '../../motion/tokens';
import { avatarConfig } from '../3d/avatar.config';
import { AvatarErrorBoundary } from '../3d/AvatarErrorBoundary';
import { LOOK_AROUND_SECONDS, type CompanionActivity } from '../3d/avatarInteraction';
import { useAvatarInteraction } from '../3d/useAvatarInteraction';
import { Icon } from '../ui/Icon';
import { roamBounds } from './companionBounds';
import { classifyClick } from './companionClicks';
import { CompanionContext, type CompanionMode, type CompanionState } from './companionContext';
import {
  atPoint,
  besideTarget,
  clampToBounds,
  homeBase,
  liftInPlace,
  travelSeconds,
  type Point,
  type RectLike,
  type Size,
} from './companionPlacement';
import styles from './Companion.module.css';
import { SpeechBubble } from './SpeechBubble';

const AvatarScene = lazy(() => import('../3d/AvatarScene'));

/** Width of the roaming avatar; its height keeps the hero spot's shape so the shrink is a pure scale. */
const MINI_WIDTH = 116;
/** The lift-off when the avatar wakes in place: short, so it is ready for a click at once. */
const LIFT_SECONDS = 0.45;

interface Bubble {
  id: number;
  title: string;
  text: string;
  anchor: Point & Size;
  avoid: RectLike | null;
}

/** True while the element is within `rootMargin` of the viewport. */
function useElementInView(el: Element | null, rootMargin = '200px') {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [el, rootMargin]);
  return el ? inView : false;
}

const snapshot = ({ left, top, right, bottom, width, height }: RectLike): RectLike => ({
  left,
  top,
  right,
  bottom,
  width,
  height,
});

/**
 * The avatar companion. One 3D canvas for the whole site:
 *
 * - **hero**: large, standing in the Home hero's avatar spot (registered by AvatarSlot).
 * - **mini**: after "Explore with me" (or "Show avatar" in the status bar), it shrinks and
 *   pops up right where it stands, ready at once. Clicking a file in the Explorer or a top nav link
 *   sends it there to say something about it; clicking empty workspace sends it to
 *   that spot, where it looks around or waves. It never follows the cursor.
 *
 * The canvas element is never re-created: React renders it into one `holder`
 * element that is moved between the hero spot and a fixed layer on the page.
 * Phones keep the large avatar in the hero only. The poster stays in the hero
 * whenever the 3D scene is not available.
 */
export function CompanionProvider({ children }: { children: ReactNode }) {
  const capability = useAvatarCapability();
  const layout = useLayoutMode();
  const intro = useIntro();
  const reducedMotion = useReducedMotion() ?? false;
  const compact = useMediaQuery(avatarConfig.compactQuery);
  const framing = compact ? avatarConfig.framing.compact : avatarConfig.framing.portrait;

  const [failed, setFailed] = useState(false);
  const sceneOn = capability === 'scene' && !failed;
  const canRoam = sceneOn && layout !== 'mobile';
  const [chosenMode, setChosenMode] = useState<CompanionMode>('hero');
  const mode: CompanionMode = canRoam ? chosenMode : 'hero';

  const [heroMount, setHeroMount] = useState<HTMLElement | null>(null);
  const heroInView = useElementInView(heroMount);

  const [requested, setRequested] = useState(false);
  const [ready, setReady] = useState(false);
  const wanted = mode === 'mini' || (heroMount !== null && heroInView);
  if (sceneOn && !requested && !intro.active && wanted) setRequested(true);
  const live = sceneOn && requested && ready;
  // Renders only while it can be seen: roaming, or the hero spot near the viewport.
  const active = wanted;

  const [activity, setActivity] = useState<CompanionActivity>(null);
  const [bubble, setBubble] = useState<Bubble | null>(null);

  // The fixed layer for roaming, and the element the avatar is rendered into.
  const [layer] = useState(() => {
    const el = document.createElement('div');
    el.className = styles.layer;
    return el;
  });
  const [holder] = useState(() => {
    const el = document.createElement('div');
    el.className = styles.holder;
    return el;
  });
  useEffect(() => {
    document.body.append(layer);
    return () => {
      layer.remove();
      holder.remove();
    };
  }, [layer, holder]);

  const box = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const w = useMotionValue(0);
  const h = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(1);

  /** A hand-off between the hero and the workspace is running: clicks wait. */
  const busy = useRef(false);
  /** Id of the latest glide; an older one stops when a new one starts. */
  const trip = useRef(0);
  const running = useRef<AnimationPlaybackControls[]>([]);
  const lookTimer = useRef<number | undefined>(undefined);
  const gestures = useRef(0);
  const bubbleId = useRef(0);
  const miniSize = useRef<Size>({ w: MINI_WIDTH, h: Math.round(MINI_WIDTH * 1.25) });

  // A stable `awaken` for the context; it calls the latest version through the ref.
  const api = useRef<{ awaken: () => void; onClick: (e: MouseEvent) => void; keepInside: () => void }>(
    null!,
  );
  const awakenProxy = useCallback(() => api.current.awaken(), []);

  const interaction = useAvatarInteraction({
    target: box,
    enabled: live && active,
    reducedMotion,
    activity,
  });

  const visualBox = (): Point & Size => ({
    x: x.get(),
    y: y.get(),
    w: w.get() * scale.get(),
    h: h.get() * scale.get(),
  });

  const stopTravel = () => {
    trip.current += 1;
    running.current.forEach((a) => a.stop());
    running.current = [];
    window.clearTimeout(lookTimer.current);
  };

  const startActivity = (next: CompanionActivity) => {
    interaction.input.current.activityStart = performance.now();
    setActivity(next);
  };

  /** Glides the box's top-left corner to `to`. Resolves false if another glide replaced it. */
  const glide = async (to: Point, scaleTo?: number, length?: number): Promise<boolean> => {
    stopTravel();
    const id = trip.current;
    const from = { x: x.get(), y: y.get() };
    const seconds = reducedMotion ? 0 : (length ?? travelSeconds(from, to));
    const dx = to.x - from.x;
    interaction.input.current.travelDir = Math.abs(dx) > 24 ? Math.sign(dx) : 0;

    if (seconds === 0) {
      x.set(to.x);
      y.set(to.y);
      if (scaleTo !== undefined) scale.set(scaleTo);
      setActivity(null);
      return true;
    }

    startActivity('moving');
    const t = { duration: seconds, ease: length === undefined ? ease.inOut : ease.out };
    running.current = [animate(x, to.x, t), animate(y, to.y, t)];
    if (scaleTo !== undefined) running.current.push(animate(scale, scaleTo, t));
    await Promise.all(running.current.map((a) => a.finished));
    if (trip.current !== id) return false;
    running.current = [];
    setActivity(null);
    return true;
  };

  const closeBubble = useCallback(() => {
    setBubble(null);
    setActivity((a) => (a === 'talking' ? null : a));
  }, []);

  const awaken = () => {
    if (!canRoam || mode === 'mini' || busy.current) return;
    const bounds = roamBounds();
    const el = box.current;
    const r = el?.getBoundingClientRect();
    const docked = heroMount !== null && holder.parentElement === heroMount;
    const onScreen = r && r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
    setBubble(null);

    if (docked && r && onScreen) {
      // Shrink and pop up in place: the same box, scaled, so nothing re-renders mid-flight.
      const size = { w: MINI_WIDTH, h: Math.round(MINI_WIDTH * (r.height / r.width)) };
      miniSize.current = size;
      busy.current = true;
      layer.append(holder);
      x.set(r.left);
      y.set(r.top);
      w.set(r.width);
      h.set(r.height);
      scale.set(1);
      setChosenMode('mini');
      void glide(liftInPlace(r, size, bounds), size.w / r.width, LIFT_SECONDS).then(() => {
        w.set(size.w);
        h.set(size.h);
        scale.set(1);
        busy.current = false;
      });
      return;
    }

    // Not in the hero (another page, or scrolled away): appear at its home base, bottom right.
    const size = miniSize.current;
    const base = homeBase(size, bounds);
    layer.append(holder);
    w.set(size.w);
    h.set(size.h);
    scale.set(1);
    x.set(base.x);
    y.set(base.y);
    opacity.set(0);
    animate(opacity, 1, { duration: reducedMotion ? 0 : duration.base, ease: ease.out });
    setChosenMode('mini');
  };

  const dismiss = () => {
    if (mode !== 'mini' || busy.current) return;
    setBubble(null);
    stopTravel();
    busy.current = true;
    const finish = () => {
      busy.current = false;
      setActivity(null);
      setChosenMode('hero');
    };
    const r = heroMount?.getBoundingClientRect();
    const heroVisible = r && r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
    if (r && heroVisible) {
      // Grow back into the hero spot.
      const current = visualBox();
      w.set(r.width);
      h.set(r.height);
      scale.set(current.w / r.width);
      void glide({ x: r.left, y: r.top }, 1).then(finish);
    } else {
      void animate(opacity, 0, { duration: reducedMotion ? 0 : duration.base }).finished.then(finish);
    }
  };

  const onClick = (e: MouseEvent) => {
    if (busy.current || intro.active) return;
    if (e.target instanceof Node && layer.contains(e.target)) return;
    const click = classifyClick(e, document.getElementById('main'));
    if (!click) return;
    const size = miniSize.current;
    const bounds = roamBounds();
    setBubble(null);

    if (click.kind === 'target') {
      // Measure now, before the click navigates or closes a menu.
      const rect = snapshot(click.element.getBoundingClientRect());
      const line = getCompanionLine(click.key);
      void glide(besideTarget(rect, size, bounds)).then((arrived) => {
        if (!arrived || !line) return;
        startActivity('talking');
        bubbleId.current += 1;
        setBubble({ id: bubbleId.current, ...line, anchor: visualBox(), avoid: rect });
      });
      return;
    }

    void glide(atPoint(click, size, bounds)).then((arrived) => {
      if (!arrived || reducedMotion) return;
      // Empty space: no words, just a short gesture, alternating.
      gestures.current += 1;
      if (gestures.current % 2 === 1) {
        startActivity('lookingAround');
        lookTimer.current = window.setTimeout(
          () => setActivity((a) => (a === 'lookingAround' ? null : a)),
          LOOK_AROUND_SECONDS * 1000,
        );
      } else {
        interaction.wave();
      }
    });
  };

  const keepInside = () => {
    if (busy.current) return;
    const v = visualBox();
    const p = clampToBounds(v.x, v.y, v, roamBounds());
    x.set(p.x);
    y.set(p.y);
    closeBubble();
  };

  // Event listeners call the latest versions of these through the ref.
  useLayoutEffect(() => {
    api.current = { awaken, onClick, keepInside };
  });

  // Settle the holder where the current mode says, unless a hand-off is placing it.
  useLayoutEffect(() => {
    if (!sceneOn || busy.current) return;
    if (mode === 'hero') {
      if (!heroMount) {
        holder.remove();
        return;
      }
      heroMount.append(holder);
      x.set(0);
      y.set(0);
      scale.set(1);
      opacity.set(1);
      const fit = () => {
        w.set(heroMount.clientWidth);
        h.set(heroMount.clientHeight);
      };
      fit();
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(fit);
      observer.observe(heroMount);
      return () => observer.disconnect();
    }
    layer.append(holder);
    w.set(miniSize.current.w);
    h.set(miniSize.current.h);
    scale.set(1);
    api.current.keepInside();
  }, [sceneOn, mode, heroMount, holder, layer, x, y, w, h, scale, opacity]);

  // While roaming: clicks send it somewhere, Escape closes the bubble, resizes keep it on screen.
  useEffect(() => {
    if (mode !== 'mini' || !live) return;
    const click = (e: MouseEvent) => api.current.onClick(e);
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeBubble();
    };
    const resize = () => api.current.keepInside();
    document.addEventListener('click', click, true);
    window.addEventListener('keydown', key);
    window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('click', click, true);
      window.removeEventListener('keydown', key);
      window.removeEventListener('resize', resize);
    };
  }, [mode, live, closeBubble]);

  useEffect(() => () => window.clearTimeout(lookTimer.current), []);

  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailed(true), []);

  const value: CompanionState = {
    canRoam,
    mode,
    sceneOn,
    sceneRequested: sceneOn && requested,
    sceneReady: live,
    waving: interaction.state === 'waving',
    setHeroMount,
    wave: interaction.wave,
    awaken: awakenProxy,
    dismiss,
  };

  const avatar =
    sceneOn && requested ? (
      <motion.div
        ref={box}
        className={styles.box}
        data-mode={mode}
        data-ready={live || undefined}
        data-state={live ? interaction.state : undefined}
        style={{ x, y, width: w, height: h, scale, opacity }}
        {...(live && active ? interaction.handlers : {})}
      >
        <div className={styles.scene} style={{ left: `${-framing.bleed * 100}%` }} aria-hidden="true">
          <AvatarErrorBoundary onError={onError}>
            <Suspense fallback={null}>
              <AvatarScene
                label="3D avatar of Darryll"
                reducedMotion={reducedMotion}
                active={active}
                framing={framing}
                state={interaction.state}
                input={interaction.input}
                waveId={interaction.waveId}
                onWaveEnd={interaction.onWaveEnd}
                onReady={onReady}
                onError={onError}
              />
            </Suspense>
          </AvatarErrorBoundary>
        </div>
        {mode === 'mini' && live ? (
          <button
            type="button"
            className={styles.hide}
            aria-label="Hide the avatar"
            title="Hide the avatar"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={dismiss}
          >
            <Icon name="close" size={14} />
          </button>
        ) : null}
      </motion.div>
    ) : null;

  return (
    <CompanionContext.Provider value={value}>
      {children}
      {createPortal(avatar, holder)}
      {createPortal(
        <>
          <p className="visually-hidden" aria-live="polite">
            {bubble ? `${bubble.title}: ${bubble.text}` : ''}
          </p>
          <AnimatePresence>
            {bubble && mode === 'mini' ? (
              <SpeechBubble
                key={bubble.id}
                title={bubble.title}
                text={bubble.text}
                anchor={bubble.anchor}
                avoid={bubble.avoid}
                reducedMotion={reducedMotion}
                onClose={closeBubble}
              />
            ) : null}
          </AnimatePresence>
        </>,
        layer,
      )}
    </CompanionContext.Provider>
  );
}
