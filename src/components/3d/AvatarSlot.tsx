import { useCompanion } from '../companion/companionContext';
import { AvatarFallback } from './AvatarFallback';
import styles from './Avatar.module.css';

/**
 * The avatar's spot in the Home hero. The fallback always renders first; the
 * 3D avatar itself belongs to the companion (CompanionProvider), which stands
 * it here while it is large and fades it in over the fallback once its first
 * frame has drawn. After it leaves to roam the workspace, the spot offers to
 * bring it back. If anything fails, the fallback stays.
 */
export function AvatarSlot() {
  const companion = useCompanion();
  const { sceneOn, sceneRequested, sceneReady, mode, canRoam, setHeroMount } = companion;
  const away = mode === 'mini';
  const live = sceneReady && !away;

  return (
    <div className={styles.avatar}>
      <div className={styles.slot} data-scene-ready={live || undefined} data-away={away || undefined}>
        <div className={styles.poster}>
          <AvatarFallback
            label={sceneOn ? '3D avatar of Darryll' : 'Illustration standing in for Darryll’s 3D avatar'}
          />
        </div>
        {/* The companion renders the 3D avatar into this element. */}
        <div ref={setHeroMount} className={styles.mount} />
        {away ? (
          <p className={styles.away} aria-hidden="true">
            {'// out exploring the workspace'}
          </p>
        ) : null}
        <span className={styles.ground} aria-hidden="true" />
      </div>

      {away ? (
        <div className={styles.controls}>
          <button type="button" className={styles.wave} onClick={companion.dismiss}>
            Bring the avatar back
          </button>
        </div>
      ) : live ? (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.wave}
            onClick={companion.wave}
            // aria-disabled rather than disabled, so keyboard focus stays on the button.
            aria-disabled={companion.waving}
          >
            Say hi
          </button>
          {canRoam ? (
            <button
              type="button"
              className={styles.wave}
              onClick={companion.awaken}
              title="Or hold the avatar for 3 seconds"
            >
              Explore with me
            </button>
          ) : (
            <span className={styles.hint} aria-hidden="true">
              or drag to turn
            </span>
          )}
        </div>
      ) : sceneRequested ? (
        <p className={styles.status} aria-hidden="true">
          Loading avatar…
        </p>
      ) : null}
    </div>
  );
}
