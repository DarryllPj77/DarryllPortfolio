import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { portrait } from '../../data/portrait';
import { INTRO, type IntroPhase } from './introTimeline';
import { leftClip, rightClip, seamPoints } from './portalGeometry';
import styles from './PortraitPortal.module.css';

interface PortraitPortalProps {
  phase: IntroPhase;
  /** The 3D avatar can be initialized here (WebGL available, the model did not fail). */
  canInitialize: boolean;
  /** The portal is open and still waiting for the model to finish loading. */
  waiting: boolean;
  onInitialize: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Hover, focus or press: a hint the visitor may initialize, so the scene can warm up. */
  onIntent: () => void;
  /** The avatar's mount point: it sits between the portal and the portrait doors. */
  children: ReactNode;
}

const STATUS: Partial<Record<IntroPhase, string>> = {
  scanning: 'IDENTITY MATCHED',
  failed: 'AVATAR UNAVAILABLE',
};

/** The intro's timings as CSS variables, so CSS and script share one source. */
const timing = {
  '--intro-scan': `${INTRO.scan}ms`,
  '--intro-seam': `${INTRO.seam}ms`,
  '--intro-open': `${INTRO.open}ms`,
  '--intro-doors-fade': `${INTRO.doorsFade}ms`,
  '--intro-doors-fade-after': `${INTRO.doorsFadeAfter}ms`,
  '--intro-crossfade': `${INTRO.crossfade}ms`,
} as CSSProperties;

/**
 * Real Darryll → digital Darryll. The real portrait stands where the avatar lives.
 * Initialized, a scan line crosses it and becomes a fracture, the portrait opens like
 * two doors on a portal in the workspace's own language (slate panel, construction
 * grid, thin indigo frame, mono labels), and the 3D avatar emerges from inside it.
 *
 * Purely presentational: the companion owns the phase. Every layer shares the slot's
 * box, so portrait, portal and avatar stay aligned at every size. Nothing modifies
 * the photo: each door is the same image under a clip-path along one shared zigzag.
 */
export function PortraitPortal({
  phase,
  canInitialize,
  waiting,
  onInitialize,
  onIntent,
  children,
}: PortraitPortalProps) {
  const status = waiting ? 'LOADING MODEL' : STATUS[phase];
  const done = phase === 'ready';

  return (
    <div className={styles.stage} data-phase={phase} style={timing}>
      {/* The digital portal behind the portrait. */}
      <div className={styles.portal} aria-hidden="true">
        <svg className={styles.frame} viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect x="3" y="3" width="94" height="94" pathLength={1} />
        </svg>
        <span className={styles.cross} data-pos="tl" />
        <span className={styles.cross} data-pos="tr" />
        <span className={styles.cross} data-pos="bl" />
        <span className={styles.cross} data-pos="br" />
        <p className={styles.label} data-pos="top" style={{ '--i': 0 } as CSSProperties}>
          ~/darryll.glb
        </p>
        <p className={styles.label} data-pos="status" style={{ '--i': 1 } as CSSProperties}>
          <span className={styles.dot} data-waiting={waiting || undefined} />
          {waiting ? 'LOADING MODEL' : 'SYSTEM READY'}
        </p>
        <p className={styles.label} data-pos="stack" style={{ '--i': 2 } as CSSProperties}>
          C# · .NET
        </p>
      </div>

      {children}

      {phase === 'portrait' && canInitialize ? (
        <button
          type="button"
          className={styles.init}
          aria-label="Initialize avatar: replace the photo with Darryll’s interactive 3D avatar"
          onClick={onInitialize}
          onPointerEnter={onIntent}
          onPointerDown={onIntent}
          onFocus={onIntent}
        >
          <span className={styles.cta} aria-hidden="true">
            <span className={styles.ctaMark} />
            INITIALIZE AVATAR
          </span>
        </button>
      ) : null}

      <div className={styles.doors} aria-hidden={done || undefined}>
        {/* The square photo, whole, standing on the slot's ground line. */}
        <div className={styles.photo}>
          {/* At rest the unsplit photo shows (no hairline where the doors meet); the doors take over as they open. */}
          <img
            className={styles.whole}
            src={portrait.src}
            srcSet={portrait.srcSet}
            sizes={portrait.sizes}
            width={portrait.width}
            height={portrait.height}
            alt={done ? '' : portrait.alt}
            fetchPriority="high"
            decoding="async"
          />
          <div className={styles.door} data-side="left" aria-hidden="true">
            <img
              src={portrait.src}
              srcSet={portrait.srcSet}
              sizes={portrait.sizes}
              width={portrait.width}
              height={portrait.height}
              alt=""
              decoding="async"
              style={{ clipPath: leftClip() }}
            />
          </div>
          <div className={styles.door} data-side="right" aria-hidden="true">
            <img
              src={portrait.src}
              srcSet={portrait.srcSet}
              sizes={portrait.sizes}
              width={portrait.width}
              height={portrait.height}
              alt=""
              decoding="async"
              style={{ clipPath: rightClip() }}
            />
          </div>
          <svg className={styles.seam} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={seamPoints()} pathLength={1} />
          </svg>
          <span className={styles.scanGrid} aria-hidden="true" />
          <span className={styles.scan} aria-hidden="true" />
        </div>
        {status ? (
          <p className={styles.status} aria-hidden="true">
            {status}
          </p>
        ) : null}
      </div>
    </div>
  );
}
