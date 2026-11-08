import type { ReactNode } from 'react';
import styles from './Tag.module.css';

export function TagList({ items, label }: { items: string[]; label?: string }) {
  return (
    <ul role="list" className={styles.list} aria-label={label}>
      {items.map((item) => (
        <li key={item} className={styles.tag}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Tag({ children, qualifier }: { children: ReactNode; qualifier?: string }) {
  return (
    <span className={styles.tag}>
      {children}
      {qualifier ? <span className={styles.qualifier}>· {qualifier}</span> : null}
    </span>
  );
}

export type BadgeTone = 'neutral' | 'accent' | 'info' | 'success' | 'warning';

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
}) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {dot ? <span className={styles.dot} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
