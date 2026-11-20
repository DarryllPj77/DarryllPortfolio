import { COUNT } from '../orbit/orbitPhysics';
import { ENTRANCE, entrancePose, HANDOFF, OPENING, openingPose } from './choreography';

/** What the page is doing. */
export type Phase = 'entering' | 'browsing' | 'opening' | 'open' | 'closing';

/** Where the opened case's screen was on the page when the presentation took over, in CSS px. */
export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

type Listener = () => void;

/**
 * The exhibition's moments (the entrance, opening and closing a project) as live values the
 * scene reads every frame, and a phase the page renders from. Like the ring, it is a plain
 * object: the scene animates without re-rendering the page, and the page hears only phase
 * changes.
 */
export class ShowState {
  phase: Phase = 'entering';
  reduced = false;

  /* Live values, recomputed on each step. */
  hall = 0;
  lamp = 0;
  turn = 0;
  depth: number[] = Array(COUNT).fill(16);
  /** Brightness kept by each case (1 = as the ring sets it). */
  caseLight: number[] = Array(COUNT).fill(1);
  /** How far each case has withdrawn outward. */
  withdraw: number[] = Array(COUNT).fill(0);
  approach = 0;
  /** The opened case's screen on the page, measured by the scene as the presentation takes over. */
  screenRect: ScreenRect | null = null;
  /** Which case is opened (or being opened). */
  opened = 0;

  private entrance = 0;
  private entranceLength: number = ENTRANCE.full;
  private open = 0;
  private openTarget = 0;
  private ui = false;
  private handedOff = false;
  /** A case asked to open while the entrance was finishing: it opens as soon as it ends. */
  private pendingOpen: number | null = null;
  private listeners = new Set<Listener>();
  private wake: () => void = () => {};

  constructor({ entrance = 'full' as keyof typeof ENTRANCE, startOpen = false, opened = 0 } = {}) {
    this.entranceLength = ENTRANCE[entrance];
    this.opened = opened;
    if (startOpen) {
      // Arriving on a project's own link: no entrance, the project already open.
      this.entrance = this.entranceLength;
      this.open = this.openTarget = 1;
      this.handedOff = true;
      this.phase = 'open';
    }
    this.update();
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getPhase = () => this.phase;

  /** Whether the placard and the ring's controls are showing. */
  getUi = () => this.ui;

  setWake(wake: () => void) {
    this.wake = wake;
  }

  setReducedMotion(reduced: boolean) {
    this.reduced = reduced;
    if (reduced && this.phase === 'entering') this.entranceLength = ENTRANCE.reduced;
  }

  /** The scene reports where the opened case's screen is on the page. */
  setScreenRect(rect: ScreenRect) {
    this.screenRect = rect;
  }

  /** Any key, click or tap during the entrance jumps to its end. */
  skipEntrance() {
    if (this.phase !== 'entering') return;
    this.entrance = this.entranceLength;
    this.wake();
  }

  /** Opens the case now in front (during the entrance: skips it, then opens). */
  openCase(index: number) {
    if (this.phase === 'entering') {
      this.pendingOpen = index;
      this.skipEntrance();
      return;
    }
    if (this.phase !== 'browsing') return;
    this.opened = index;
    this.openTarget = 1;
    this.handedOff = false;
    this.setPhase('opening');
    this.wake();
  }

  /** The presentation has left; the scene plays the opening backwards. */
  closeCase() {
    if (this.phase !== 'open') return;
    this.openTarget = 0;
    this.setPhase('closing');
    this.wake();
  }

  /** Advances by `dt` seconds. Returns whether anything is still moving. */
  step(dt: number): boolean {
    let moving = false;
    if (this.phase === 'entering') {
      this.entrance = Math.min(this.entranceLength, this.entrance + dt);
      moving = true;
      if (this.entrance >= this.entranceLength) {
        this.update();
        this.setPhase('browsing');
        if (this.pendingOpen !== null) {
          const index = this.pendingOpen;
          this.pendingOpen = null;
          this.openCase(index);
        }
        return true;
      }
    }
    if (this.open !== this.openTarget) {
      const length = this.reduced ? OPENING.reduced : this.openTarget > this.open ? OPENING.open : OPENING.close;
      const d = dt / length;
      this.open = this.openTarget > this.open ? Math.min(1, this.open + d) : Math.max(0, this.open - d);
      moving = true;
    }
    this.update();
    if (this.phase === 'opening' && !this.handedOff && this.open >= HANDOFF) {
      this.handedOff = true;
      this.setPhase('open');
    }
    if (this.phase === 'closing' && this.open === 0) this.setPhase('browsing');
    return moving;
  }

  private update() {
    const e = entrancePose(this.entrance / this.entranceLength, this.reduced);
    const o = openingPose(this.open, this.reduced);
    this.hall = e.hall * o.hall;
    this.lamp = e.lamp * o.lamp;
    this.turn = e.turn;
    this.depth = e.depth;
    this.approach = o.approach;
    for (let i = 0; i < COUNT; i++) {
      const other = i !== this.opened;
      this.caseLight[i] = e.hall * (other ? o.others : 1);
      this.withdraw[i] = other ? o.withdraw : 0;
    }
    const ui = e.ui && (this.phase === 'browsing' || this.phase === 'entering');
    if (ui !== this.ui) {
      this.ui = ui;
      this.emit();
    }
  }

  private setPhase(phase: Phase) {
    this.phase = phase;
    this.update();
    this.emit();
  }

  private emit() {
    for (const l of this.listeners) l();
  }
}
