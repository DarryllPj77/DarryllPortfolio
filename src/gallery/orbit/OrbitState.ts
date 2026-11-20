import {
  caseAt,
  clampSpeed,
  COUNT,
  emphasisOf,
  isSettled,
  nearestStop,
  releaseTarget,
  rubberBand,
  SPRING,
  SPRING_REDUCED,
  stepSpring,
  stopFor,
  TURN,
} from './orbitPhysics';

type Listener = () => void;

/**
 * The ring's live state, shared by the 3D scene (which reads it every frame) and the HTML
 * controls (which only hear about it when the case in front changes). It is a plain object,
 * not React state, so a turning ring never re-renders the page.
 */
export class OrbitState {
  /** The ring's turn, in radians. */
  angle = 0;
  /** Radians per second. */
  velocity = 0;
  /** The stop it is settling on. */
  target = 0;
  /** How "in front" each case is, 0…1 (see emphasisOf). */
  emphasis: number[] = Array.from({ length: COUNT }, (_, i) => emphasisOf(i, 0));
  /** The case nearest the front. */
  active = 0;
  reducedMotion = false;

  private dragging = false;
  private dragStartAngle = 0;
  private dragStartStop = 0;
  private listeners = new Set<Listener>();
  /** Asks the scene for a frame; set by the scene once it is running. */
  private wake: () => void = () => {};

  constructor(initial = 0) {
    this.angle = this.target = stopFor(initial, 0);
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

  setWake(wake: () => void) {
    this.wake = wake;
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
    this.settleOn(stopFor(index, this.target));
  }

  /** The case to the right comes to the front. */
  next() {
    this.settleOn(nearestStop(this.target) - TURN);
  }

  /** The case to the left comes to the front. */
  previous() {
    this.settleOn(nearestStop(this.target) + TURN);
  }

  beginDrag() {
    this.dragging = true;
    this.dragStartAngle = this.angle;
    this.dragStartStop = nearestStop(this.target);
    this.velocity = 0;
    this.wake();
  }

  /** The hand has moved `offset` radians since the drag began. */
  dragBy(offset: number) {
    if (!this.dragging) return;
    this.angle = this.dragStartStop + rubberBand(this.dragStartAngle - this.dragStartStop + offset);
    this.update();
    this.wake();
  }

  /** Let go at `velocity` radians per second: momentum carries it to at most the next case. */
  endDrag(velocity: number) {
    if (!this.dragging) return;
    this.dragging = false;
    this.target = releaseTarget(this.angle, velocity, this.dragStartStop);
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
    for (let i = 0; i < COUNT; i++) this.emphasis[i] = emphasisOf(i, this.angle);
    const active = caseAt(this.angle);
    if (active !== this.active) {
      this.active = active;
      for (const l of this.listeners) l();
    }
  }
}
