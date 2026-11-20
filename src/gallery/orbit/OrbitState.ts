import {
  caseAt,
  clampSpeed,
  emphasisOf,
  isSettled,
  nearestStop,
  releaseTarget,
  rubberBand,
  SPRING,
  SPRING_REDUCED,
  stepSpring,
  stopFor,
  turnFor,
} from './orbitPhysics';

type Listener = () => void;

/**
 * The live state of a turning exhibit (a ring or a wheel of `count` cases), shared by the 3D
 * scene (which reads it every frame) and the HTML controls (which only hear about it when the
 * case in front changes). It is a plain object, not React state, so turning never re-renders
 * the page. It lives as long as its collection's visit, so coming back finds it where it was.
 */
export class OrbitState {
  /** How many cases it holds. */
  readonly count: number;
  /** The ring's turn, in radians. */
  angle = 0;
  /** Radians per second. */
  velocity = 0;
  /** The stop it is settling on. */
  target = 0;
  /** How "in front" each case is, 0…1 (see emphasisOf). */
  emphasis: number[];
  /** The case nearest the front. */
  active = 0;
  reducedMotion = false;

  private dragging = false;
  private dragStartAngle = 0;
  private dragStartStop = 0;
  private listeners = new Set<Listener>();
  /** Asks the scene for a frame; set by the scene once it is running. */
  private wake: () => void = () => {};

  constructor({ count, initial = 0 }: { count: number; initial?: number }) {
    this.count = count;
    this.emphasis = Array.from({ length: count }, (_, i) => emphasisOf(i, 0, count));
    this.angle = this.target = stopFor(initial, 0, count);
    this.update();
  }

  /* ---------- for React (useSyncExternalStore) ---------- */

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getActive = () => this.active;

  /** Reduced motion: short, direct turns with no carried momentum. */
  setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced;
  }

  /* ---------- for the scene ---------- */

  /**
   * Lets the scene be woken (asked for a frame) when something changes. Returns a release that
   * clears it only if it is still this scene's: a scene that is being replaced (React Three
   * Fiber releases an old canvas a moment after the new one starts) must not switch off its
   * successor's wake, or the exhibit would stop answering until something else redraws it.
   */
  setWake(wake: () => void): () => void {
    this.wake = wake;
    return () => {
      if (this.wake === wake) this.wake = () => {};
    };
  }

  /** Advances the ring by `dt` seconds. Returns whether it is still moving. */
  step(dt: number): boolean {
    if (this.dragging) return true;
    if (isSettled(this.angle, this.velocity, this.target)) {
      this.angle = this.target;
      this.velocity = 0;
      this.update();
      return false;
    }
    const next = stepSpring(this.angle, this.velocity, this.target, dt, this.reducedMotion ? SPRING_REDUCED : SPRING);
    this.angle = next.angle;
    this.velocity = next.velocity;
    this.update();
    return true;
  }

  /* ---------- commands ---------- */

  /** Brings case `index` to the front, the short way round. */
  goTo(index: number) {
    this.settleOn(stopFor(index, this.target, this.count));
  }

  /** The next case comes to the front. */
  next() {
    this.settleOn(nearestStop(this.target, this.count) - turnFor(this.count));
  }

  /** The previous case comes to the front. */
  previous() {
    this.settleOn(nearestStop(this.target, this.count) + turnFor(this.count));
  }

  beginDrag() {
    this.dragging = true;
    this.dragStartAngle = this.angle;
    this.dragStartStop = nearestStop(this.target, this.count);
    this.velocity = 0;
    this.wake();
  }

  /** The hand has moved `offset` radians since the drag began. */
  dragBy(offset: number) {
    if (!this.dragging) return;
    this.angle = this.dragStartStop + rubberBand(this.dragStartAngle - this.dragStartStop + offset, this.count);
    this.update();
    this.wake();
  }

  /** Let go at `velocity` radians per second: momentum carries it to at most the next case. */
  endDrag(velocity: number) {
    if (!this.dragging) return;
    this.dragging = false;
    this.target = releaseTarget(this.angle, velocity, this.dragStartStop, this.count);
    this.velocity = this.reducedMotion ? 0 : clampSpeed(velocity);
    this.wake();
  }

  get isDragging() {
    return this.dragging;
  }

  /* ---------- internals ---------- */

  private settleOn(target: number) {
    this.target = target;
    if (this.reducedMotion) this.velocity = 0;
    this.wake();
  }

  private update() {
    for (let i = 0; i < this.count; i++) this.emphasis[i] = emphasisOf(i, this.angle, this.count);
    const active = caseAt(this.angle, this.count);
    if (active !== this.active) {
      this.active = active;
      for (const l of this.listeners) l();
    }
  }
}
