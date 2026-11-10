import { lazy, Suspense, useCallback, useRef, useState, type CSSProperties } from 'react';
import { useAvatarCapability } from '../../hooks/useAvatarCapability';
import { useInView } from '../../hooks/useInView';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { avatarConfig } from './avatar.config';
import { AvatarErrorBoundary } from './AvatarErrorBoundary';
import { AvatarFallback } from './AvatarFallback';
import styles from './Avatar.module.css';
import { useAvatarInteraction } from './useAvatarInteraction';

const AvatarScene = lazy(() => import('./AvatarScene'));

/**
 * The avatar in the About section. The fallback always renders first; the 3D
 * scene is layered on top only when this device gets it and the section is near
 * the viewport. Once the scene has drawn its first frame it fades in over the
 * fallback. If anything fails, the fallback stays.
 */
export function AvatarSlot() {
  const ref = useRef<HTMLDivElement>(null);
  const mode = useAvatarCapability();
  const inView = useInView(ref);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const mid = useMediaQuery(avatarConfig.midQuery);
  const compact = useMediaQuery(avatarConfig.compactQuery);
  const { framing: f } = avatarConfig;
  const framing = compact ? f.compact : mid ? f.mid : f.portrait;
  const [requested, setRequested] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailed(true), []);

  const sceneOn = mode === 'scene' && !failed;
  // Start loading once; the scene pauses itself when scrolled away.
  if (sceneOn && inView && !requested) setRequested(true);

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
            label={sceneOn ? '3D avatar of Darryll' : 'Still image of Darryll’s 3D avatar: a figure in amber glasses and a yellow plaid shirt'}
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
      </div>

      {live ? (
        <div className={styles.controls}>
          <button
            type="button"
            className="link avatar__wave"
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
