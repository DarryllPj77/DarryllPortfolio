import { useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { sections } from '../../data/navigation';
import type { SectionId } from '../../data/types';
import { useViewFocus } from '../../hooks/useViewFocus';
import { MaskedText, Reveal } from '../../motion/Reveal';
import { GridFrame, SectionLabel } from './Grid';
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
  section: SectionId;
  title: string;
  description?: ReactNode;
  /** Overrides the default "03 / ABOUT" label (e.g. for the 404 page). */
  marker?: { index: string; label: string; meta?: string };
  children: ReactNode;
}

/**
 * Standard page layout: construction-grid column, "03 / ABOUT" label,
 * editorial heading that reveals from a mask, then the page content.
 */
export function ViewFrame({ section, title, description, marker, children }: ViewFrameProps) {
  const info = sections[section];
  const label = marker ?? { index: info.index, label: info.marker, meta: `~/${info.file}` };
  return (
    <GridFrame>
      <article>
        <header className={styles.header}>
          <Reveal>
            <SectionLabel {...label} />
          </Reveal>
          <ViewHeading className={styles.title}>
            <MaskedText>{title}</MaskedText>
          </ViewHeading>
          {description ? (
            <Reveal as="p" className={styles.description}>
              {description}
            </Reveal>
          ) : null}
        </header>
        {children}
      </article>
    </GridFrame>
  );
}

/** Small mono heading for sub-sections inside a page. */
export function SectionTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className={styles.sectionTitle}>
      {children}
    </h2>
  );
}
