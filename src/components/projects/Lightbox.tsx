import { motion } from 'motion/react';
import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { ProjectScreenshot } from '../../data/types';
import { duration, ease } from '../../motion/tokens';
import { Icon } from '../ui/Icon';
import styles from './Gallery.module.css';

interface LightboxProps {
  shots: ProjectScreenshot[];
  index: number;
  /** Name of the group, e.g. "Teacher workflow". */
  label: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/** While the viewer is open, the rest of the app can't be focused or read. */
function useModalBackground() {
  useEffect(() => {
    const root = document.getElementById('root');
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    root?.setAttribute('inert', '');
    document.body.style.overflow = 'hidden';
    return () => {
      root?.removeAttribute('inert');
      document.body.style.overflow = overflow;
      opener?.focus({ preventScroll: true });
    };
  }, []);
}

/**
 * Full-screen screenshot viewer. Shows screenshots at their real size (never
 * enlarged past it), with previous/next within one group. Keyboard: arrow
 * keys to move, Escape to close; Tab stays inside the viewer.
 */
export function Lightbox({ shots, index, label, onIndexChange, onClose }: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const shot = shots[index];
  const count = shots.length;
  const hasSiblings = count > 1;

  useModalBackground();
  useEffect(() => closeRef.current?.focus(), []);

  const go = (step: number) => onIndexChange((index + step + count) % count);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    } else if (hasSiblings && e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (hasSiblings && e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return createPortal(
    <motion.div
      ref={dialogRef}
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      aria-label={`${label} screenshots`}
      onKeyDown={onKeyDown}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: duration.exit } }}
      transition={{ duration: duration.fast, ease: ease.out }}
    >
      <div className={styles.lbBar}>
        <p className={styles.lbLabel}>
          {label}
          {hasSiblings ? (
            <span className={styles.lbCount} aria-live="polite">
              {index + 1} / {count}
            </span>
          ) : null}
        </p>
        <button
          ref={closeRef}
          type="button"
          className={styles.lbButton}
          onClick={onClose}
          aria-label="Close screenshot viewer"
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      {/* Clicking the empty area around the screenshot closes the viewer. */}
      <div
        className={styles.lbStage}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <figure className={styles.lbFigure}>
          <motion.img
            key={shot.src}
            className={styles.lbImage}
            src={shot.src}
            alt={shot.alt}
            width={shot.width}
            height={shot.height}
            decoding="async"
            style={{ '--w': `${shot.width}px` } as CSSProperties}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: duration.fast, ease: ease.out }}
          />
          <figcaption className={styles.lbCaption}>{shot.caption}</figcaption>
        </figure>
      </div>

      {hasSiblings ? (
        <div className={styles.lbNav}>
          <button
            type="button"
            className={styles.lbButton}
            onClick={() => go(-1)}
            aria-label="Previous screenshot"
          >
            <Icon name="arrow-left" size={18} />
          </button>
          <button
            type="button"
            className={styles.lbButton}
            onClick={() => go(1)}
            aria-label="Next screenshot"
          >
            <Icon name="arrow-right" size={18} />
          </button>
        </div>
      ) : null}
    </motion.div>,
    document.body,
  );
}
