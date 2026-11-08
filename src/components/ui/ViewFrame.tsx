import { useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { useViewFocus } from '../../hooks/useViewFocus';
import styles from './ViewFrame.module.css';

/** The page's <h1>. Receives focus after navigation. */
export function ViewHeading({ children, ...rest }: ComponentPropsWithoutRef<'h1'>) {
  const ref = useRef<HTMLHeadingElement>(null);
  useViewFocus(ref);
  return (
    <h1 ref={ref} tabIndex={-1} {...rest}>
      {children}
    </h1>
  );
}

interface ViewFrameProps {
  title: string;
  /** Shown as a small path above the title, e.g. "portfolio/skills". */
  path: string;
  description?: ReactNode;
  children: ReactNode;
}

export function ViewFrame({ title, path, description, children }: ViewFrameProps) {
  return (
    <article className={styles.frame}>
      <header className={styles.header}>
        <p className={styles.path} aria-hidden="true">
          <span>~/</span>
          {path}
        </p>
        <ViewHeading className={styles.title}>{title}</ViewHeading>
        {description ? <p className={styles.description}>{description}</p> : null}
      </header>
      {children}
    </article>
  );
}

export function SectionTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className={styles.sectionTitle}>
      {children}
    </h2>
  );
}
