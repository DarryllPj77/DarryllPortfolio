import { useReducedMotion } from 'motion/react';
import { lazy, Suspense, useCallback, useRef, useState, type CSSProperties } from 'react';
import { useAvatarCapability } from '../../hooks/useAvatarCapability';
import { useInView } from '../../hooks/useInView';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useIntro } from '../../intro/introContext';
import { avatarConfig } from './avatar.config';
import { AvatarErrorBoundary } from './AvatarErrorBoundary';
import { AvatarFallback } from './AvatarFallback';
import styles from './Avatar.module.css';
import { useAvatarInteraction } from './useAvatarInteraction';

const AvatarScene = lazy(() => import('./AvatarScene'));

/**
 * The avatar area in the Home hero. The fallback always renders first; the 3D
 * scene is layered on top only when this device gets it, the hero is near the
 * viewport and the intro has finished. Once the scene has drawn its first
 * frame it fades in over the fallback. If anything fails, the fallback stays.
 */
export function AvatarSlot() {
  const ref = useRef<HTMLDivElement>(null);
  const mode = useAvatarCapability();
  const inView = useInView(ref);
  const intro = useIntro();
  const reducedMotion = useReducedMotion() ?? false;
  const compact = useMediaQuery(avatarConfig.compactQuery);
  const framing = compact ? avatarConfig.framing.compact : avatarConfig.framing.portrait;
  const [requested, setRequested] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailed(true), []);

  const sceneOn = mode === 'scene' && !failed;
  // Start loading once; the scene pauses itself when scrolled away.
  if (sceneOn && inView && !intro.active && !requested) setRequested(true);

  const showScene = sceneOn && requested;
  const live = showScene && ready;
  const { state, input, waveId, wave, onWaveEnd, handlers } = useAvatarInteraction({
    target: ref,
    enabled: live,
    reducedMotion,
  });

  return (
    <div className={styles.avatar}>
      <div
        ref={ref}
        className={styles.slot}
        data-scene-ready={live || undefined}
        data-state={live ? state : undefined}
        style={{ '--bleed': framing.bleed } as CSSProperties}
        {...(live ? handlers : {})}
      >
        <div className={styles.poster}>
          <AvatarFallback
            label={sceneOn ? '3D avatar of Darryll' : 'Illustration standing in for Darryll’s 3D avatar'}
          />
        </div>
        {showScene ? (
          <div className={styles.scene} aria-hidden="true">
            <AvatarErrorBoundary onError={onError}>
              <Suspense fallback={null}>
                <AvatarScene
                  label="3D avatar of Darryll"
                  reducedMotion={reducedMotion}
                  active={inView}
                  framing={framing}
                  state={state}
                  input={input}
                  waveId={waveId}
                  onWaveEnd={onWaveEnd}
                  onReady={onReady}
                  onError={onError}
                />
              </Suspense>
            </AvatarErrorBoundary>
          </div>
        ) : null}
        <span className={styles.ground} aria-hidden="true" />
      </div>

      {live ? (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.wave}
            onClick={wave}
            // aria-disabled rather than disabled, so keyboard focus stays on the button.
            aria-disabled={state === 'waving'}
          >
            Say hi
          </button>
          <span className={styles.hint} aria-hidden="true">
            or drag to turn
          </span>
        </div>
      ) : showScene ? (
        <p className={styles.status} aria-hidden="true">
          Loading avatar…
        </p>
      ) : null}
    </div>
  );
}
