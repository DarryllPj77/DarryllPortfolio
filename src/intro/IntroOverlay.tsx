import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { duration, ease } from '../motion/tokens';
import { useIntro } from './introContext';
import styles from './Intro.module.css';

const STAGES = ['Foundation', 'Structure', 'Interface', 'Projects', 'Ready'] as const;
const STAGE_MS = 320;
const HOLD_MS = 320;
/** Hard limit: the intro always ends, even if timers or frames are throttled. */
const FAILSAFE_MS = 4000;

function IntroSequence({ onFinish }: { onFinish: () => void }) {
  const [stage, setStage] = useState(0);
  const isLast = stage === STAGES.length - 1;

  useEffect(() => {
    const t = window.setTimeout(
      () => (isLast ? onFinish() : setStage((s) => s + 1)),
      isLast ? HOLD_MS : STAGE_MS,
    );
    return () => window.clearTimeout(t);
  }, [stage, isLast, onFinish]);

  useEffect(() => {
    const failsafe = window.setTimeout(onFinish, FAILSAFE_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFinish();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(failsafe);
      window.removeEventListener('keydown', onKey);
    };
  }, [onFinish]);

  const progress = (stage + 1) / STAGES.length;
  const number = String(stage + 1).padStart(2, '0');

  return (
    <motion.div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Site intro"
      exit={{ opacity: 0 }}
      transition={{ duration: duration.base, ease: ease.out }}
    >
      <div className={styles.grid} aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={`v${i}`} className={styles.vline} style={{ left: `${i * 20}%` }} />
        ))}
        {[1, 2, 3].map((i) => (
          <span key={`h${i}`} className={styles.hline} style={{ top: `${i * 25}%` }} />
        ))}
      </div>

      <button type="button" className={styles.skip} onClick={onFinish} autoFocus>
        Skip intro
        <kbd className={styles.kbd}>Esc</kbd>
      </button>

      <div className={styles.center} aria-hidden="true">
        <p className={styles.kicker}>
          Building <span className={styles.brand}>darryll.dev</span>
        </p>

        <div className={styles.frame}>
          <span className={styles.cross} data-pos="tl" />
          <span className={styles.cross} data-pos="tr" />
          <span className={styles.cross} data-pos="bl" />
          <span className={styles.cross} data-pos="br" />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={stage}
              className={styles.stage}
              initial={{ opacity: 0, y: 48 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -48 }}
              transition={{ duration: duration.fast, ease: ease.out }}
            >
              <span className={styles.stageNumber}>{number}</span>
              <span className={styles.stageName}>{STAGES[stage]}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        <ol className={styles.stages}>
          {STAGES.map((name, i) => (
            <li key={name} data-state={i < stage ? 'done' : i === stage ? 'active' : 'pending'}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              {name}
            </li>
          ))}
        </ol>

        <div className={styles.progress}>
          <motion.span
            className={styles.progressFill}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress }}
            transition={{ duration: STAGE_MS / 1000, ease: ease.inOut }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/** Short "Building darryll.dev" sequence shown on the first visit to Home. */
export function IntroOverlay() {
  const { active, finish } = useIntro();
  return <AnimatePresence>{active ? <IntroSequence onFinish={finish} /> : null}</AnimatePresence>;
}
