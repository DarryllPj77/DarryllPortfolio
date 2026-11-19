import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
  type MotionValue,
} from 'motion/react';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router';
import { getDock, type DockId } from '../../data/avatarDocks';
import { getCompanionLine } from '../../data/companion';
import { getViewMeta, normalizePath } from '../../data/navigation';
import { useAvatarCapability } from '../../hooks/useAvatarCapability';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useIntro } from '../../intro/introContext';
import { duration, ease } from '../../motion/tokens';
import { avatarConfig } from '../3d/avatar.config';
import { AvatarErrorBoundary } from '../3d/AvatarErrorBoundary';
import {
  INTRO,
  introDone,
  isCovered,
  markIntroDone,
  type IntroPhase,
} from '../avatar-intro/introTimeline';
import { clamp, TRAVELLING, type CompanionActivity } from '../3d/avatarInteraction';
import { useAvatarInteraction } from '../3d/useAvatarInteraction';
import { Icon } from '../ui/Icon';
import { freeBounds, roamBounds } from './companionBounds';
import {
  classifyClick,
  tapDestination,
  travelDestination,
  type TouchDown,
} from './companionClicks';
import {
  CompanionContext,
  type CompanionLocation,
  type CompanionMode,
  type CompanionState,
} from './companionContext';
import {
  atPoint,
  besideTarget,
  clampToBounds,
  homeBase,
  liftInPlace,
  stepSwing,
  travelSeconds,
  type Bounds,
  type Point,
  type RectLike,
  type Size,
} from './companionPlacement';
import styles from './Companion.module.css';
import { currentDocks, dockOffset, findDock } from './dropZones';
import { SpeechBubble } from './SpeechBubble';
import { useAvatarCarry } from './useAvatarCarry';

const AvatarScene = lazy(() => import('../3d/AvatarScene'));

/** Width of the small avatar; its height keeps the hero spot's shape so shrinking is a pure scale. */
const MINI_WIDTH = 116;
/** Lift while grabbed: a few pixels up and a touch larger. */
const LIFT = { y: -6, scale: 1.04 };
/** Gap (px) between the pointer and the top of the carried avatar's head. */
const GRAB_GAP = 10;
/** How quickly the carried avatar catches up with the pointer (higher is tighter). */
const FOLLOW = 18;
/** Tilt (degrees) into the direction of travel on a journey; it levels out on arrival. */
const TRAVEL_TILT = 6;
/** Reduced motion: no travel at all, a short fade out and in at the new place. */
const REDUCED_FADE = 0.12;
/** Gap (px) between the carried avatar's feet and the landing mark on the ground below it. */
const LANDING_GAP = 14;
/** Landing: a short ease into the destination, then a moment to settle. */
const DROP_SECONDS = 0.32;
const SETTLE_SECONDS = 0.22;
/**
 * How long to wait for a page to show a destination after navigating to it, in rendered
 * frames (about 4 s at 60 fps). Frames, not milliseconds, so a slow or backgrounded page
 * that takes longer to mount is still waited for.
 */
const DOCK_WAIT_FRAMES = 240;

interface Bubble {
  id: number;
  /** The page or file the line is about (a route path, with a hash for one certification). */
  key: string;
  title: string;
  text: string;
  /** Beside the avatar when it is on screen at its small size; null: a caption at the bottom. */
  anchor: (Point & Size) | null;
  avoid: RectLike | null;
}

/** After a page change, the new page has rendered and the avatar has settled. */
const SAY_AFTER_NAV = 450;

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
 * The avatar companion: one 3D canvas for the whole site, in one of three places.
 *
 * - **hero**: large, in the Home hero's avatar spot (registered by AvatarSlot).
 * - **dock**: settled beside a section of the current page (its `data-avatar-dock` element).
 * - **float**: small and free in the workspace.
 *
 * Desktop and tablet can pick it up: a quick click or tap waves; a short press and hold
 * picks it up (it shrinks at once), and it can be carried anywhere on the visible page
 * (it hangs from the pointer and swings a little, with a landing mark on the ground under
 * it) and put down where it is released, where it stays until it is carried again, sent
 * somewhere with the destination menu, or brought back. Escape mid-carry puts it back.
 * While it is out, clicking a file in the Explorer or a top nav link makes it say something
 * about it from where it stands. A right-click anywhere in the workspace (mouse or pen)
 * sends it travelling there, from wherever it is, and it stays. On touch screens a quick
 * tap on empty page space does the same once it is out exploring (tap it: a wave; hold it:
 * pick it up; swipe: the page scrolls).
 *
 * One positioning model: the box's top-left (x, y) and its layout size (w, h) with a CSS
 * scale, always in the coordinate space of the element holding it (the viewport when it
 * is in the fixed layer, the hero spot or a section otherwise). Every move first lifts it
 * into the layer from its real on-screen box, and every destination (the hero spot, a
 * section, a point) is measured fresh at the moment it is needed, never cached.
 *
 * The canvas is never re-created: React renders it into one `holder` element that is
 * moved between the hero spot, a docked section and a fixed layer, so it scrolls with
 * the section it stands in and needs no layout reads on scroll. On every device it can be
 * picked up (touch: a short still hold, so swipes still scroll). The poster stays in the
 * hero whenever the 3D scene is not available.
 */
export function CompanionProvider({ children }: { children: ReactNode }) {
  const capability = useAvatarCapability();
  const intro = useIntro();
  const reducedMotion = useReducedMotion() ?? false;
  const compact = useMediaQuery(avatarConfig.compactQuery);
  const baseFraming = compact ? avatarConfig.framing.compact : avatarConfig.framing.portrait;
  const navigate = useNavigate();
  const route = useLocation();
  const pathname = normalizePath(route.pathname);
  /**
   * The active section, shared by every way of navigating (top nav, Explorer, the phone
   * menu, links in the page, back and forward): Darryll's information follows it.
   */
  const activeSection = getViewMeta(pathname).section;

  const [failed, setFailed] = useState(false);
  const sceneOn = capability === 'scene' && !failed;
  // Every device with the 3D avatar can pick it up (touch: a short still hold, so scrolling stays free).
  const canRoam = sceneOn;
  const [chosen, setChosen] = useState<CompanionLocation>({ kind: 'hero' });
  const location: CompanionLocation = canRoam ? chosen : { kind: 'hero' };
  const mode: CompanionMode = location.kind === 'hero' ? 'hero' : 'mini';
  const locationRef = useRef(location);
  useLayoutEffect(() => {
    locationRef.current = location;
  });

  const [heroMount, setHeroMount] = useState<HTMLElement | null>(null);
  const heroMountRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    heroMountRef.current = heroMount;
  }, [heroMount]);
  const heroInView = useElementInView(heroMount);

  /**
   * The Home introduction (Real Darryll → 3D Darryll), once a visit. Until it has run,
   * the hero shows the real portrait and the 3D avatar is not interactive.
   */
  const [phase, setPhase] = useState<IntroPhase>(() => (introDone() ? 'ready' : 'portrait'));
  const introReady = phase === 'ready';
  /** The visitor showed intent (hover, focus, press on the portrait): mount the scene early. */
  const [warm, setWarm] = useState(false);
  /** The portal is open and the model is not ready yet. */
  const [waitingForModel, setWaitingForModel] = useState(false);
  /** The model could not load or draw: the portrait stays, without the initialize control. */
  const [unavailable, setUnavailable] = useState(false);
  const openedAt = useRef(0);

  const [requested, setRequested] = useState(false);
  const [ready, setReady] = useState(false);
  const wanted = mode === 'mini' || (heroMount !== null && heroInView);
  // Before the introduction, the scene loads only once the visitor shows intent or starts it.
  const wantsScene = phase !== 'portrait' || warm;
  if (sceneOn && !requested && !intro.active && wanted && wantsScene) setRequested(true);
  const live = sceneOn && requested && ready;
  // Renders only while it can be seen: out in the workspace, or the hero spot near the viewport.
  // While the portrait still covers it, it draws its first frame (the warm-up) and then rests.
  const active = wanted && (!isCovered(phase) || !ready);

  const [activity, setActivity] = useState<CompanionActivity>(null);
  const activityRef = useRef<CompanionActivity>(null);
  useLayoutEffect(() => {
    activityRef.current = activity;
  });
  const [bubble, setBubble] = useState<Bubble | null>(null);
  /** The key of the line showing now (or null), so a line is never repeated back to back. */
  const showingKey = useRef<string | null>(null);
  /** The kind of the latest pointer press: a right-click right after a finger touch is touch. */
  const lastPointerType = useRef('mouse');
  /** The latest press closed an open line: the click that follows it only closes the line. */
  const pressClosedLine = useRef(false);
  /** A button's line waiting for him to arrive beside it (a page change does not say it first). */
  const pendingSay = useRef<string | null>(null);
  /** A finger press that may become a tap-to-move, and whether a line was open when it began. */
  const fingerDown = useRef<(TouchDown & { id: number; lineWasOpen: boolean }) | null>(null);
  /** While carried: where it was lifted from (the hero shows its empty spot at once), and whether it is over a destination. */
  const [carrying, setCarrying] = useState<{ from: CompanionLocation['kind'] } | null>(null);
  const [placement, setPlacement] = useState(0);
  /** On its way out of the hero (sent somewhere): the hero shows its empty spot, and it can be called back mid-flight. */
  const [leavingHero, setLeavingHero] = useState(false);

  // How it presents itself where it stands (e.g. turned toward the project list).
  const restYaw = location.kind === 'dock' ? (getDock(location.id).yaw ?? baseFraming.yaw) : baseFraming.yaw;
  const framing = useMemo(() => ({ ...baseFraming, yaw: restYaw }), [baseFraming, restYaw]);

  // The fixed layer for carrying and floating, and the element the avatar is rendered into.
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
  const liftY = useMotionValue(0);
  const liftScale = useMotionValue(1);
  /** Pendulum tilt in degrees while carried, around the grab point at the top of the head. */
  const swing = useMotionValue(0);
  /** The landing mark under the carried avatar's feet. */
  const markX = useMotionValue(0);
  const markY = useMotionValue(0);

  /** A move is placing the holder itself: the settling effect stays out of the way. */
  const busy = useRef(false);
  /** Id of the latest move; an older one stops when a new one starts. */
  const trip = useRef(0);
  const running = useRef<AnimationPlaybackControls[]>([]);
  const bubbleId = useRef(0);
  const miniAspect = useRef(1.25);
  /** A destination to settle into once its page has opened. */
  const pending = useRef<DockId | null>(null);

  /** The carry in progress. */
  const carry = useRef<{
    origin: CompanionLocation;
    originPoint: Point;
    pointer: Point;
    bounds: Bounds;
    frame: number;
    last: number;
    swingVelocity: number;
    unlisten: () => void;
  } | null>(null);

  const interaction = useAvatarInteraction({
    target: box,
    enabled: live && active && introReady,
    reducedMotion,
    activity,
  });

  /* ------------------------------------------------------- the introduction */

  /** Real Darryll → 3D Darryll: the visitor activated the portrait. */
  const initialize = useCallback(() => {
    if (!sceneOn || unavailable) return;
    setWarm(true);
    setPhase((p) => {
      if (p !== 'portrait') return p;
      if (reducedMotion) {
        // No scan or split: straight to waiting for the model, then a short crossfade.
        openedAt.current = performance.now() - INTRO.emergeAfter;
        return 'opening';
      }
      return 'scanning';
    });
  }, [sceneOn, unavailable, reducedMotion]);

  const warmUp = useCallback(() => setWarm(true), []);

  // The timeline: scanning → opening → emerging (once the model has drawn) → ready.
  useEffect(() => {
    if (phase === 'scanning') {
      const t = window.setTimeout(() => {
        openedAt.current = performance.now();
        setPhase('opening');
      }, INTRO.scan + INTRO.seam);
      return () => window.clearTimeout(t);
    }
    if (phase === 'opening') {
      if (failed) {
        setPhase('failed');
        return;
      }
      const sinceOpen = performance.now() - openedAt.current;
      if (!live) {
        // The doors are open and the model is still on its way: say so, and give up eventually.
        const say = window.setTimeout(() => setWaitingForModel(true), Math.max(0, INTRO.emergeAfter - sinceOpen));
        const give = window.setTimeout(() => setPhase('failed'), INTRO.modelTimeout);
        return () => {
          window.clearTimeout(say);
          window.clearTimeout(give);
        };
      }
      const t = window.setTimeout(() => {
        setWaitingForModel(false);
        interaction.input.current.entranceStart = reducedMotion ? 0 : performance.now();
        setPhase('emerging');
      }, Math.max(0, INTRO.emergeAfter - sinceOpen));
      return () => window.clearTimeout(t);
    }
    if (phase === 'emerging') {
      const t = window.setTimeout(() => {
        markIntroDone();
        setPhase('ready');
      }, reducedMotion ? INTRO.crossfade : INTRO.readyAfter);
      return () => window.clearTimeout(t);
    }
    if (phase === 'failed') {
      setWaitingForModel(false);
      setUnavailable(true);
      const t = window.setTimeout(() => setPhase('portrait'), INTRO.failedHold);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, live, failed]);

  // While the portrait shows, fetch the 3D code and the model when the browser is idle, so
  // initializing does not wait on the network (no WebGL context is created until intent).
  useEffect(() => {
    if (!sceneOn || introDone() || !avatarConfig.modelUrl) return;
    const url = avatarConfig.modelUrl;
    const start = () => {
      void import('../3d/AvatarScene');
      void fetch(url).catch(() => {});
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(start, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(start, 2000);
    return () => window.clearTimeout(id);
  }, [sceneOn]);

  /* ------------------------------------------------------------------ helpers */

  const miniSize = (): Size => {
    if (heroMount && heroMount.clientWidth > 0) miniAspect.current = heroMount.clientHeight / heroMount.clientWidth;
    return { w: MINI_WIDTH, h: Math.round(MINI_WIDTH * miniAspect.current) };
  };

  const visualBox = (): Point & Size => ({
    x: x.get(),
    y: y.get(),
    w: w.get() * scale.get(),
    h: h.get() * scale.get(),
  });

  const run = (value: MotionValue<number>, to: number, seconds: number, curve = ease.out) => {
    const a = animate(value, to, { duration: reducedMotion ? 0 : seconds, ease: curve });
    running.current.push(a);
    return a.finished;
  };

  const stopTravel = () => {
    trip.current += 1;
    running.current.forEach((a) => a.stop());
    running.current = [];
  };

  const startActivity = (next: CompanionActivity) => {
    interaction.input.current.activityStart = performance.now();
    setActivity(next);
  };

  /** Moves the holder into the fixed layer without any visible jump. False if it is not on the page. */
  const toLayer = (): boolean => {
    if (holder.parentElement === layer) return true;
    const el = box.current;
    if (!el || !holder.isConnected) return false;
    const r = el.getBoundingClientRect();
    layer.append(holder);
    x.set(r.left);
    y.set(r.top);
    return true;
  };

  /** Swaps the box's layout size, keeping its visible size (the canvas resizes once, invisibly). */
  const resizeKeepingLook = (size: Size) => {
    const visW = w.get() * scale.get();
    w.set(size.w);
    h.set(size.h);
    scale.set(visW / size.w);
  };

  /** A short opacity change that also runs with reduced motion (it is the reduced-motion transition). */
  const fade = (to: number) => {
    const a = animate(opacity, to, { duration: REDUCED_FADE, ease: ease.out });
    running.current.push(a);
    return a.finished;
  };

  /** Glides the box's top-left corner to `to`, optionally scaling. Resolves false if another move replaced it. */
  const glide = async (
    to: Point,
    options: { scaleTo?: number; seconds?: number; as?: CompanionActivity } = {},
  ): Promise<boolean> => {
    stopTravel();
    const id = trip.current;
    const from = { x: x.get(), y: y.get() };
    const dx = to.x - from.x;
    const direction = Math.abs(dx) > 24 ? Math.sign(dx) : 0;
    interaction.input.current.travelDir = direction;
    const place = () => {
      x.set(to.x);
      y.set(to.y);
      if (options.scaleTo !== undefined) scale.set(options.scaleTo);
    };

    if (reducedMotion) {
      // No travel: fade out, move, fade in, so the change of place is still clear.
      const moved = Math.hypot(dx, to.y - from.y) >= 1;
      if (moved && opacity.get() > 0) await fade(0);
      if (trip.current !== id) return false;
      place();
      if (opacity.get() < 1) await fade(1);
      return trip.current === id;
    }

    const seconds = options.seconds ?? travelSeconds(from, to);
    opacity.set(1);
    if (seconds === 0) {
      place();
      return true;
    }
    startActivity(options.as ?? 'moving');
    const curve = options.seconds === undefined ? ease.inOut : ease.out;
    const moves = [run(x, to.x, seconds, curve), run(y, to.y, seconds, curve)];
    if (options.scaleTo !== undefined) moves.push(run(scale, options.scaleTo, seconds, curve));
    // A gentle tilt into the direction of travel, level again on arrival.
    if (direction !== 0) {
      void run(swing, direction * TRAVEL_TILT, seconds * 0.35).then(() => {
        if (trip.current === id) void run(swing, 0, seconds * 0.65, ease.inOut);
      });
    }
    await Promise.all(moves);
    if (trip.current !== id) return false;
    running.current = [];
    return true;
  };

  /** Lowers the lift back to standing. Resolves false if another move replaced it. */
  const settle = async (): Promise<boolean> => {
    const id = trip.current;
    if (liftY.get() !== 0 || liftScale.get() !== 1 || swing.get() !== 0) {
      startActivity('settling');
      await Promise.all([
        run(liftY, 0, SETTLE_SECONDS),
        run(liftScale, 1, SETTLE_SECONDS),
        run(swing, 0, SETTLE_SECONDS),
      ]);
    }
    return trip.current === id;
  };

  const finish = (next: CompanionLocation) => {
    busy.current = false;
    setLeavingHero(false);
    setActivity(null);
    setChosen(next);
    // Re-run the settling effect even when the place keeps its name (the same section on a new page).
    setPlacement((n) => n + 1);
  };

  const closeBubble = useCallback(() => {
    showingKey.current = null;
    setBubble(null);
    setActivity((a) => (a === 'talking' ? null : a));
  }, []);

  /** A bubble's own timer: closes it only if it is still the one showing. */
  const showingBubble = useRef<number | null>(null);
  useLayoutEffect(() => {
    showingBubble.current = bubble?.id ?? null;
  });
  const closeBubbleById = useCallback(
    (id: number) => {
      if (showingBubble.current === id) closeBubble();
    },
    [closeBubble],
  );

  /* ------------------------------------------------------------- destinations */

  /** From the layer into the hero spot, growing back to full size. */
  const flyToHero = async (as: CompanionActivity) => {
    const mount = heroMount;
    if (!mount) return false;
    const r = mount.getBoundingClientRect();
    resizeKeepingLook({ w: r.width, h: r.height });
    const arrived = await glide({ x: r.left, y: r.top }, { scaleTo: 1, seconds: as === 'dropping' ? DROP_SECONDS : undefined, as });
    if (!arrived || !(await settle())) return false;
    mount.append(holder);
    x.set(0);
    y.set(0);
    finish({ kind: 'hero' });
    return true;
  };

  /** From the layer into a destination on this page (`skip`: the outgoing page's, during a page change). */
  const flyToDock = async (id: DockId, as: CompanionActivity, skip?: ReadonlySet<Element>) => {
    const zone = findDock(id, skip);
    if (!zone) return false;
    const size = miniSize();
    resizeKeepingLook(size);
    const r = zone.getBoundingClientRect();
    const off = dockOffset({ w: zone.clientWidth, h: zone.clientHeight }, size);
    const arrived = await glide(
      { x: r.left + off.x, y: r.top + off.y },
      { scaleTo: 1, seconds: as === 'dropping' ? DROP_SECONDS : undefined, as },
    );
    if (!arrived || !(await settle())) return false;
    zone.append(holder);
    x.set(off.x);
    y.set(off.y);
    finish({ kind: 'dock', id });
    if (getDock(id).waveOnArrival) interaction.wave();
    return true;
  };

  /** Free in the workspace at a point (top-left), at the small size. */
  const flyToPoint = async (to: Point, as: CompanionActivity) => {
    resizeKeepingLook(miniSize());
    const arrived = await glide(to, { scaleTo: 1, seconds: as === 'dropping' ? DROP_SECONDS : undefined, as });
    if (!arrived || !(await settle())) return false;
    finish({ kind: 'float' });
    return true;
  };

  /**
   * Right-click: travel to the clicked spot and stay there. From wherever it is (the hero,
   * a section, free on the page), starting from where it stands now, standing on the point
   * (feet at the pointer), kept fully on screen. A new right-click mid-trip redirects it.
   */
  const travelTo = (pointer: Point) => {
    if (!canRoam || !introReady) return;
    // Never while it is on its way home or being carried.
    if (activityRef.current === 'returning' || carry.current) return;
    const fromHero = locationRef.current.kind === 'hero' && holder.parentElement !== layer;
    if (!toLayer()) return;
    // Leaving the hero: it shows its empty spot at once, with "Bring the avatar back".
    if (fromHero) setLeavingHero(true);
    closeBubble();
    busy.current = true;
    const size = miniSize();
    void flyToPoint(atPoint(pointer, size, freeBounds()), 'moving');
  };

  /**
   * A finger tap on empty page space: on touch screens the equivalent of a right-click, but
   * only once Darryll is out exploring (carried out, or sent with Move Darryll), so ordinary
   * reading taps on Home never pull him out of the hero.
   */
  const tapTo = (point: Point) => {
    if (locationRef.current.kind === 'hero' && holder.parentElement !== layer) return;
    travelTo(point);
  };

  /**
   * The avatar was not on the page (hidden while away from Home): it fades in at its
   * home base, bottom right, then travels to the destination, so it never pops into place.
   */
  const appearAt = async (id: DockId, skip?: ReadonlySet<Element>) => {
    if (!findDock(id, skip)) return;
    stopTravel();
    busy.current = true;
    const size = miniSize();
    const base = homeBase(size, roamBounds());
    layer.append(holder);
    w.set(size.w);
    h.set(size.h);
    scale.set(1);
    x.set(base.x);
    y.set(base.y);
    opacity.set(0);
    const id0 = trip.current;
    await fade(1);
    if (trip.current !== id0) return;
    await flyToDock(id, 'moving', skip);
  };

  /** Back to where a cancelled or invalid drop came from. */
  const returnTo = (origin: CompanionLocation, originPoint: Point) => {
    if (origin.kind === 'hero' && heroMount) return flyToHero('returning');
    if (origin.kind === 'dock' && findDock(origin.id)) return flyToDock(origin.id, 'returning');
    const size = miniSize();
    const point = origin.kind === 'float' ? originPoint : homeBase(size, roamBounds());
    return flyToPoint(clampToBounds(point.x, point.y, size, freeBounds()), 'returning');
  };

  /**
   * Leaves for another page: lifts out of where it stands and shrinks as it rises,
   * then keeps floating while the page changes underneath; the navigation effect
   * carries it on into the destination once the new page shows it.
   */
  const departFor = (id: DockId) => {
    busy.current = true;
    const size = miniSize();
    const v = visualBox();
    resizeKeepingLook(size);
    void glide(liftInPlace({ left: v.x, top: v.y, width: v.w, height: v.h, right: v.x + v.w, bottom: v.y + v.h }, size, roamBounds()), {
      scaleTo: 1,
    });
    pending.current = id;
    navigate(getDock(id).path);
  };

  /** Out of the hero: placed elsewhere, or already lifted out and on its way. */
  const isOut = () => locationRef.current.kind !== 'hero' || holder.parentElement === layer;

  /** Sends the avatar to a destination, travelling there; opens its page first when it is elsewhere. */
  const sendTo = (id: DockId) => {
    if (!canRoam) return;
    closeBubble();
    // Leaving the hero: it shows its empty spot at once, with "Bring the avatar back".
    if (id !== 'home' && !isOut() && holder.isConnected) setLeavingHero(true);
    if (id === 'home') {
      if (!isOut()) return;
      if (heroMount) {
        if (!toLayer()) return finish({ kind: 'hero' });
        busy.current = true;
        void flyToHero('moving');
      } else if (toLayer()) {
        departFor('home');
      } else {
        stopTravel();
        holder.remove();
        finish({ kind: 'hero' });
        navigate(getDock('home').path);
      }
      return;
    }
    const zone = findDock(id);
    if (zone) {
      // Lift out first (it stays where it is on screen), then bring the destination
      // into view at once so the flight's target does not move under it.
      const onPage = toLayer();
      zone.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      if (onPage) {
        busy.current = true;
        void flyToDock(id, 'moving');
      } else {
        void appearAt(id);
      }
      return;
    }
    if (toLayer()) departFor(id);
    else {
      pending.current = id;
      navigate(getDock(id).path);
    }
  };

  /** Back to the hero; on other pages it simply goes out of view. */
  const dismiss = () => {
    if (!isOut()) return;
    closeBubble();
    if (heroMount && toLayer()) {
      busy.current = true;
      void flyToHero('returning');
      return;
    }
    stopTravel();
    busy.current = true;
    void run(opacity, 0, duration.base).then(() => {
      holder.remove();
      opacity.set(1);
      finish({ kind: 'hero' });
    });
  };

  /* -------------------------------------------------------------------- carry */

  /** Where the carried avatar hangs for a pointer position: just below it, fully on the page. */
  const hangAt = (pointer: Point, size: Size, bounds: Bounds) =>
    clampToBounds(pointer.x - size.w / 2, pointer.y + GRAB_GAP, size, bounds);

  const followFrame = (now: number) => {
    const c = carry.current;
    if (!c) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - c.last) / 1000));
    c.last = now;

    // Hang just below the pointer, eased toward it, anywhere on the visible page.
    const vis = visualBox();
    const target = hangAt(c.pointer, vis, c.bounds);
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * FOLLOW);
    const nx = vis.x + (target.x - vis.x) * k;
    const ny = vis.y + (target.y - vis.y) * k;
    x.set(nx);
    y.set(ny);
    const speed = (nx - vis.x) / dt;
    const input = interaction.input.current;
    input.travelDir += (clamp(speed / 900, -1, 1) - input.travelDir) * Math.min(1, dt * 10);

    // Swing: the body trails behind the pointer (moving right tilts the feet left), then rights itself.
    if (!reducedMotion) {
      const next = stepSwing(swing.get(), c.swingVelocity, speed, dt);
      c.swingVelocity = next.velocity;
      swing.set(next.angle);
    }

    // The landing mark stays on the ground right under its feet: where it will be put down.
    markX.set(nx + vis.w / 2);
    markY.set(ny + vis.h + LANDING_GAP);
    c.frame = requestAnimationFrame(followFrame);
  };

  const endCarry = () => {
    const c = carry.current;
    if (!c) return null;
    cancelAnimationFrame(c.frame);
    c.unlisten();
    carry.current = null;
    setCarrying(null);
    return c;
  };

  const carryHandlers = useAvatarCarry(canRoam && live, {
    // Picked up: lift out of wherever it stands and shrink to the small size at once,
    // before any movement, then follow the pointer.
    onGrab(pointer) {
      // On its way back home it finishes the trip first.
      if (activityRef.current === 'returning') return;
      stopTravel();
      closeBubble();
      if (!toLayer()) return;
      busy.current = true;
      const origin = locationRef.current;
      const refresh = () => {
        if (carry.current) carry.current.bounds = freeBounds();
      };
      window.addEventListener('resize', refresh);
      carry.current = {
        origin,
        originPoint: { x: x.get(), y: y.get() },
        pointer,
        bounds: freeBounds(),
        frame: 0,
        last: performance.now(),
        swingVelocity: 0,
        unlisten: () => window.removeEventListener('resize', refresh),
      };
      setCarrying({ from: origin.kind });
      startActivity('grabbed');
      void run(liftY, LIFT.y, duration.fast);
      void run(liftScale, LIFT.scale, duration.fast);
      const size = miniSize();
      const shrinkTo = size.w / w.get();
      if (Math.abs(shrinkTo - scale.get()) > 0.01) {
        const id = trip.current;
        void run(scale, shrinkTo, duration.fast).then(() => {
          if (trip.current === id && carry.current) resizeKeepingLook(size);
        });
      }
      const v = visualBox();
      markX.set(v.x + v.w / 2);
      markY.set(v.y + v.h + LANDING_GAP);
      carry.current.frame = requestAnimationFrame(followFrame);
    },
    onDrag(pointer) {
      const c = carry.current;
      if (!c) return;
      c.pointer = pointer;
      setActivity((a) => (a === 'grabbed' ? 'dragging' : a));
    },
    // Put down exactly where it was released, and it stays there.
    onDrop(pointer) {
      const c = endCarry();
      if (!c) return;
      const size = miniSize();
      resizeKeepingLook(size);
      const spot = hangAt(pointer, size, freeBounds());
      void flyToPoint(spot, 'dropping');
    },
    onTap() {
      // A click while it travels does not wave: it is busy going somewhere.
      if (TRAVELLING.has(activityRef.current ?? 'idle')) return;
      interaction.wave();
    },
    // Escape: the carry is called off, so it goes back where it was picked up.
    onCancel() {
      const c = endCarry();
      if (!c) return;
      void returnTo(c.origin, c.originPoint);
    },
  });

  // Never leave a carry running when the avatar goes away.
  useEffect(() => () => void endCarry(), []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------------------------------------ clicks, roam */

  /**
   * Darryll says the line for a page or file. The same for every device and every way of
   * getting there: beside him when he is on screen at his small size, otherwise (in the
   * hero, so the hero text stays clear; on another page; mid-trip; no 3D) as a caption at
   * the bottom of the screen. The same line is never shown twice in a row.
   */
  const say = (key: string, avoid: RectLike | null = null) => {
    if (carry.current || intro.active) return;
    const line = getCompanionLine(key);
    if (!line || showingKey.current === key) return;
    const r = box.current?.getBoundingClientRect();
    const beside =
      live &&
      introReady &&
      !busy.current &&
      (locationRef.current.kind !== 'hero' || holder.parentElement === layer) &&
      holder.isConnected &&
      r !== undefined &&
      r.width > 0 &&
      r.bottom > 0 &&
      r.top < window.innerHeight &&
      r.right > 0 &&
      r.left < window.innerWidth;
    if (beside) startActivity('talking');
    bubbleId.current += 1;
    showingKey.current = key;
    setBubble({
      id: bubbleId.current,
      key,
      ...line,
      anchor: beside && r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null,
      avoid,
    });
  };

  /**
   * Visible buttons and links near a clicked one, so Darryll stands beside it without covering
   * them either. Read once per click, never per frame.
   */
  const buttonsAround = (clicked: Element): RectLike[] =>
    Array.from(document.querySelectorAll('a[href], button, [role="button"], input, select, textarea'))
      .filter((el) => el !== clicked && !clicked.contains(el) && !layer.contains(el) && !holder.contains(el))
      .map((el) => snapshot(el.getBoundingClientRect()))
      .filter((r) => r.width > 0 && r.bottom > 0 && r.top < window.innerHeight);

  /**
   * Desktop: Darryll goes to the clicked button or link, stands beside it without covering
   * its label, then says what it is. From anywhere, the hero included: clicking it is a
   * deliberate request for an explanation.
   */
  const goAndSay = (key: string, element: Element) => {
    const rect = snapshot(element.getBoundingClientRect());
    if (activityRef.current === 'returning' || carry.current) return;
    const fromHero = locationRef.current.kind === 'hero' && holder.parentElement !== layer;
    if (!canRoam || !live || !introReady || !toLayer()) {
      say(key, rect);
      return;
    }
    if (fromHero) setLeavingHero(true);
    closeBubble();
    busy.current = true;
    pendingSay.current = key;
    const to = besideTarget(rect, miniSize(), freeBounds(), buttonsAround(element));
    void flyToPoint(to, 'moving').then((arrived) => {
      if (pendingSay.current === key) pendingSay.current = null;
      if (arrived) say(key, rect);
    });
  };

  /**
   * Clicks on the page.
   * - Desktop (mouse or pen): a click on a marked button or link (top nav, Explorer, the hero
   *   and contact buttons) brings Darryll beside it to explain it; a click on empty page space
   *   sends him there once he is out exploring. The first click while his line is open only
   *   closes the line.
   * - Touch and keyboard: a marked button or link makes him say its line where he is; he never
   *   moves (phones move him with tap-to-move instead).
   * A click that also changes page says its line once, on arrival.
   */
  const onClick = (e: MouseEvent) => {
    if (e.target instanceof Node && (layer.contains(e.target) || holder.contains(e.target))) return;
    const closedLine = pressClosedLine.current;
    pressClosedLine.current = false;
    const click = classifyClick(e, document.getElementById('main'));
    if (!click) return;
    const desktopPointer = e.detail > 0 && lastPointerType.current !== 'touch';
    if (click.kind === 'target') {
      if (desktopPointer) goAndSay(click.key, click.element);
      // Measure now, before the click navigates or closes a menu.
      else if (!busy.current) say(click.key, snapshot(click.element.getBoundingClientRect()));
      return;
    }
    if (desktopPointer && !closedLine) tapTo({ x: e.clientX, y: e.clientY });
  };

  const keepInside = () => {
    if (busy.current || locationRef.current.kind !== 'float') return;
    const v = visualBox();
    // Only when the window shrinks enough to leave it partly off screen. A page change can
    // fire a resize too (the scrollbar comes or goes); then nothing moves and the bubble stays.
    const p = clampToBounds(v.x, v.y, v, freeBounds());
    if (Math.abs(p.x - v.x) < 0.5 && Math.abs(p.y - v.y) < 0.5) return;
    x.set(p.x);
    y.set(p.y);
    closeBubble();
  };

  // Event listeners and effects call the latest versions of these through the ref.
  const api = useRef({ onClick, keepInside, sendTo, dismiss, flyToDock, flyToPoint, flyToHero, travelTo, tapTo, say });
  useLayoutEffect(() => {
    api.current = { onClick, keepInside, sendTo, dismiss, flyToDock, flyToPoint, flyToHero, travelTo, tapTo, say };
  });
  const sendToProxy = useCallback((id: DockId) => api.current.sendTo(id), []);
  const dismissProxy = useCallback(() => api.current.dismiss(), []);

  /* ------------------------------------------------------- settling the holder */

  const locationKey = location.kind === 'dock' ? `dock:${location.id}` : location.kind;

  // Put the holder where the location says, unless a move is placing it itself.
  useLayoutEffect(() => {
    if (!sceneOn || busy.current) return;
    const loc = locationRef.current;
    if (loc.kind === 'hero') {
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
    if (loc.kind === 'dock') {
      const zone = findDock(loc.id);
      if (!zone) return;
      zone.append(holder);
      scale.set(1);
      const fit = () => {
        const size = miniSize();
        w.set(size.w);
        h.set(size.h);
        const off = dockOffset({ w: zone.clientWidth, h: zone.clientHeight }, size);
        x.set(off.x);
        y.set(off.y);
      };
      fit();
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(fit);
      observer.observe(zone);
      return () => observer.disconnect();
    }
    layer.append(holder);
    const size = miniSize();
    w.set(size.w);
    h.set(size.h);
    scale.set(1);
    api.current.keepInside();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneOn, locationKey, placement, heroMount, holder, layer]);

  // Navigation: a docked avatar steps out of the page that is leaving, then settles into
  // the same section on the new page (or the one it was sent to), else waits bottom right.
  const lastPath = useRef(pathname);
  useLayoutEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    const loc = locationRef.current;
    const wantedDock = pending.current ?? (loc.kind === 'dock' ? loc.id : null);
    pending.current = null;
    if (!canRoam || !wantedDock) return;
    // The outgoing page is still mounted while it fades out: never settle into its sections.
    const outgoing = currentDocks();
    if (loc.kind !== 'hero' && toLayer()) busy.current = true;
    const visible = holder.parentElement === layer;
    let frames = 0;
    let frame = 0;
    const look = () => {
      if (wantedDock === 'home') {
        // Back to Home: travel into the hero spot once the new page has registered it.
        if (heroMountRef.current && visible) {
          void api.current.flyToHero('moving');
          return;
        }
      } else if (findDock(wantedDock, outgoing)) {
        if (visible) void api.current.flyToDock(wantedDock, 'moving', outgoing);
        else void appearAt(wantedDock, outgoing);
        return;
      }
      if (++frames < DOCK_WAIT_FRAMES) {
        frame = requestAnimationFrame(look);
        return;
      }
      if (visible) void api.current.flyToPoint(homeBase(miniSize(), roamBounds()), 'moving');
    };
    frame = requestAnimationFrame(look);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Right-click anywhere in the workspace: it travels there (mouse and pen only; touch keeps
  // its hold-to-pick-up). The browser's own menu stays for text fields, selected text,
  // Shift + right-click and everything outside the workspace.
  useEffect(() => {
    if (!canRoam || !live || !introReady) return;
    const onContextMenu = (e: MouseEvent) => {
      // Some in-app browsers fire a long-press as a contextmenu without saying it was a finger.
      const pointerType = (e as PointerEvent).pointerType || lastPointerType.current;
      const to = travelDestination(
        { clientX: e.clientX, clientY: e.clientY, shiftKey: e.shiftKey, target: e.target, pointerType },
        (el) => holder.contains(el) || layer.contains(el),
      );
      if (!to) return;
      e.preventDefault();
      api.current.travelTo(to);
    };
    document.addEventListener('contextmenu', onContextMenu);
    return () => document.removeEventListener('contextmenu', onContextMenu);
  }, [canRoam, live, introReady, holder, layer]);

  // Darryll's information follows the active section: after every page change, however it
  // happened (desktop nav, Explorer, phone menu, a link, back or forward), he says that page's
  // line. Not on the first load: he only speaks when the visitor goes somewhere.
  const sectionKey = `${pathname}${route.hash}`;
  const firstSection = useRef(true);
  useEffect(() => {
    if (firstSection.current) {
      firstSection.current = false;
      return;
    }
    const key = getCompanionLine(sectionKey) ? sectionKey : pathname;
    // A button click that changed the page says this line itself, beside the button, on arrival.
    if (pendingSay.current === key) return;
    const t = window.setTimeout(() => api.current.say(key), SAY_AFTER_NAV);
    return () => window.clearTimeout(t);
  }, [sectionKey, pathname]);

  // Clicks on Explorer folders and files (desktop), Escape and a tap or click anywhere outside
  // the line close it (touch-friendly: no hover needed), resizes keep the avatar on screen.
  // On touch screens a quick tap on empty page space sends Darryll there (tapDestination
  // decides what counts as a tap); the first tap while a line is open only closes the line.
  useEffect(() => {
    const click = (e: MouseEvent) => api.current.onClick(e);
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeBubble();
    };
    const press = (e: PointerEvent) => {
      lastPointerType.current = e.pointerType;
      const lineWasOpen = showingKey.current !== null;
      pressClosedLine.current = lineWasOpen;
      if (lineWasOpen) {
        const line = layer.querySelector('[data-companion-bubble]');
        if (!(line && e.target instanceof Node && line.contains(e.target))) closeBubble();
      }
      // A second finger (a pinch) is never a tap.
      if (e.pointerType !== 'touch' || !e.isPrimary || fingerDown.current) {
        fingerDown.current = null;
        return;
      }
      fingerDown.current = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        t: performance.now(),
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        lineWasOpen,
      };
    };
    const lift = (e: PointerEvent) => {
      const down = fingerDown.current;
      if (!down || down.id !== e.pointerId) return;
      fingerDown.current = null;
      if (down.lineWasOpen) return;
      const to = tapDestination(
        down,
        {
          x: e.clientX,
          y: e.clientY,
          t: performance.now(),
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          target: e.target,
          pointerType: e.pointerType,
        },
        (el) => holder.contains(el) || layer.contains(el),
      );
      if (to) api.current.tapTo(to);
    };
    // The browser took the touch over to scroll (or another finger came): not a tap.
    const cancel = () => {
      fingerDown.current = null;
    };
    const resize = () => api.current.keepInside();
    document.addEventListener('click', click, true);
    document.addEventListener('pointerdown', press, true);
    document.addEventListener('pointerup', lift, true);
    document.addEventListener('pointercancel', cancel, true);
    window.addEventListener('keydown', key);
    window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('click', click, true);
      document.removeEventListener('pointerdown', press, true);
      document.removeEventListener('pointerup', lift, true);
      document.removeEventListener('pointercancel', cancel, true);
      window.removeEventListener('keydown', key);
      window.removeEventListener('resize', resize);
    };
  }, [closeBubble, layer, holder]);


  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailed(true), []);

  const value: CompanionState = {
    canRoam,
    mode,
    location,
    sceneOn,
    sceneRequested: sceneOn && requested,
    sceneReady: live,
    activeSection,
    introPhase: phase,
    canInitialize: sceneOn && !unavailable,
    waitingForModel,
    initialize,
    warmUp,
    liftedFromHero: carrying?.from === 'hero' || leavingHero,
    waving: interaction.state === 'waving',
    setHeroMount,
    wave: interaction.wave,
    sendTo: sendToProxy,
    dismiss: dismissProxy,
  };

  const canCarry = canRoam && live && active && introReady;
  const avatar =
    sceneOn && requested ? (
      <motion.div
        ref={box}
        className={styles.box}
        data-mode={mode}
        data-carry={canCarry || undefined}
        data-ready={live || undefined}
        data-state={live ? interaction.state : undefined}
        style={{ x, y, width: w, height: h, scale, opacity }}
        data-intro={introReady ? undefined : phase}
        {...(canCarry ? carryHandlers : live && active && introReady ? interaction.handlers : {})}
      >
        <motion.div className={styles.lift} style={{ y: liftY, scale: liftScale, rotate: swing }}>
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
        </motion.div>
        {mode === 'mini' && live ? (
          <button
            type="button"
            className={styles.hide}
            aria-label="Bring the avatar back"
            title="Bring the avatar back"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={dismissProxy}
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
          {carrying ? (
            <motion.span
              className={styles.landing}
              style={{ x: markX, y: markY }}
              aria-hidden="true"
            />
          ) : null}
          <p className="visually-hidden" aria-live="polite">
            {bubble ? `${bubble.title}: ${bubble.text}` : ''}
          </p>
          <AnimatePresence>
            {bubble ? (
              <SpeechBubble
                key={bubble.id}
                title={bubble.title}
                text={bubble.text}
                anchor={bubble.anchor}
                avoid={bubble.avoid}
                reducedMotion={reducedMotion}
                id={bubble.id}
                onClose={closeBubbleById}
              />
            ) : null}
          </AnimatePresence>
        </>,
        layer,
      )}
    </CompanionContext.Provider>
  );
}
