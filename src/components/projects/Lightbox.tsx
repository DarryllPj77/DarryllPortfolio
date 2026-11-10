import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { ProjectScreenshot } from '../../data/types';

interface LightboxProps {
  shots: ProjectScreenshot[];
  index: number;
  /** Name of the group, e.g. "Teacher workflow". */
  label: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/** While the viewer is open, the rest of the page can't be focused or read. */
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

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Full-screen screenshot viewer. Shows screenshots at their real size (never
 * enlarged past it), with previous/next within one group. Keyboard: arrow keys
 * to move, Escape to close; Tab stays inside the viewer. No caption under the
 * picture (the skill's house rule 1): the group's name and the position sit in
 * the bar, and the alt text describes the screen.
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
    <div
      ref={dialogRef}
      className="lb"
      role="dialog"
      aria-modal="true"
      aria-label={`${label} screenshots`}
      onKeyDown={onKeyDown}
    >
      <div className="lb__bar wrap">
        <p className="lb__label">
          {label}
          {hasSiblings ? (
            <span className="muted" aria-live="polite">
              {index + 1} of {count}
            </span>
          ) : null}
        </p>
        <button ref={closeRef} type="button" className="btn btn--secondary lb__btn" onClick={onClose} aria-label="Close screenshot viewer">
          {icon('M6 6l12 12M18 6 6 18')}
        </button>
      </div>

      {/* Clicking the empty area around the screenshot closes the viewer. */}
      <div
        className="lb__stage"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <img
          key={shot.src}
          className="lb__img"
          src={shot.src}
          alt={shot.alt}
          width={shot.width}
          height={shot.height}
          decoding="async"
          style={{ '--w': `${shot.width}px` } as CSSProperties}
        />
      </div>

      {hasSiblings ? (
        <div className="lb__nav">
          <button type="button" className="btn btn--secondary lb__btn" onClick={() => go(-1)} aria-label="Previous screenshot">
            {icon('M15 6l-6 6 6 6')}
          </button>
          <button type="button" className="btn btn--secondary lb__btn" onClick={() => go(1)} aria-label="Next screenshot">
            {icon('M9 6l6 6-6 6')}
          </button>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
