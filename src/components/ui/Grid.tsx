import type { ReactNode } from 'react';
import styles from './Grid.module.css';

/**
 * Page column framed by thin construction lines, with small crosshair marks at
 * the top corners. Purely decorative; hidden from assistive technology.
 */
export function GridFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`${styles.frame} ${className ?? ''}`}>
      <span className={styles.cross} data-pos="tl" aria-hidden="true" />
      <span className={styles.cross} data-pos="tr" aria-hidden="true" />
      {children}
    </div>
  );
}

/** Full-width hairline with crosshairs where it meets the frame lines. */
export function GridDivider() {
  return (
    <div className={styles.divider} aria-hidden="true">
      <span className={styles.cross} data-pos="l" />
      <span className={styles.cross} data-pos="r" />
    </div>
  );
}

/** Small technical label such as "02 / PROJECTS". Decorative: the heading carries the meaning. */
export function SectionLabel({ index, label, meta }: { index: string; label: string; meta?: string }) {
  return (
    <p className={styles.label} aria-hidden="true">
      <span className={styles.index}>{index}</span>
      <span className={styles.slash}>/</span>
      <span>{label}</span>
      {meta ? <span className={styles.meta}>{meta}</span> : null}
    </p>
  );
}
