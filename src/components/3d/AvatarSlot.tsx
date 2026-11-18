import { useEffect, useRef } from 'react';
import { PortraitPortal } from '../avatar-intro/PortraitPortal';
import type { IntroPhase } from '../avatar-intro/introTimeline';
import { useCompanion } from '../companion/companionContext';
import { DockMenu } from '../companion/DockMenu';
import styles from './Avatar.module.css';

const ANNOUNCE: Partial<Record<IntroPhase, string>> = {
  scanning: 'Initializing avatar',
  opening: 'Initializing avatar',
  emerging: 'Avatar ready',
  failed: 'The 3D avatar is unavailable',
};

/**
 * The avatar's spot in the Home hero. Darryll's real portrait stands here first; the
 * visitor initializes it, it opens like two doors on a portal, and the 3D avatar (owned
 * by the companion, CompanionProvider) emerges from inside it. That plays once a visit;
 * after it, the portrait only stands in while the model loads, then cross-fades to it.
 * Without WebGL (or if the model fails) the portrait stays, as the fallback.
 *
 * Once ready, the avatar can be carried anywhere or sent somewhere with "Move Darryll";
 * while it is away, the spot says so and offers to bring it back.
 */
export function AvatarSlot() {
  const companion = useCompanion();
  const { sceneOn, sceneReady, mode, canRoam, setHeroMount, introPhase } = companion;
  const away = mode === 'mini' || companion.liftedFromHero;
  const live = sceneReady && !away && introPhase === 'ready';
  // Ready from an earlier introduction but the model is still loading: the portrait stands in.
  const phase: IntroPhase = !sceneOn || (introPhase === 'ready' && !sceneReady) ? 'portrait' : introPhase;
  const canInitialize = sceneOn && introPhase === 'portrait' && companion.canInitialize;

  // The portrait's button goes away when the avatar is ready: "Say hi" takes keyboard focus.
  const sayHi = useRef<HTMLButtonElement>(null);
  const keepFocus = useRef(false);
  useEffect(() => {
    if (live && keepFocus.current) {
      keepFocus.current = false;
      sayHi.current?.focus();
    }
  }, [live]);

  return (
    <div className={styles.avatar}>
      <div className={styles.slot} data-away={away || undefined}>
        <PortraitPortal
          phase={away ? 'ready' : phase}
          canInitialize={canInitialize}
          waiting={companion.waitingForModel}
          onInitialize={(e) => {
            keepFocus.current = document.activeElement === e.currentTarget;
            companion.initialize();
          }}
          onIntent={companion.warmUp}
        >
          {/* The companion renders the 3D avatar into this element. */}
          <div ref={setHeroMount} className={styles.mount} />
        </PortraitPortal>
        {away ? (
          <p className={styles.away} aria-hidden="true">
            {'// out exploring the workspace'}
          </p>
        ) : null}
        <span className={styles.ground} aria-hidden="true" />
      </div>
      <p className="visually-hidden" role="status">
        {ANNOUNCE[introPhase] ?? ''}
      </p>

      {away ? (
        <div className={styles.controls}>
          <button type="button" className={styles.wave} onClick={companion.dismiss}>
            Bring the avatar back
          </button>
        </div>
      ) : live ? (
        <div className={styles.controls}>
          <button
            ref={sayHi}
            type="button"
            className={styles.wave}
            onClick={companion.wave}
            // aria-disabled rather than disabled, so keyboard focus stays on the button.
            aria-disabled={companion.waving}
          >
            Say hi
          </button>
          {canRoam ? (
            // Dragging the avatar is never the only way to move it.
            <DockMenu label="Move Darryll" placement="down" buttonClassName={styles.wave} />
          ) : (
            <span className={styles.hint} aria-hidden="true">
              or drag to turn
            </span>
          )}
        </div>
      ) : introPhase === 'ready' && companion.sceneRequested && !sceneReady ? (
        <p className={styles.status} aria-hidden="true">
          Loading avatar…
        </p>
      ) : null}
    </div>
  );
}
