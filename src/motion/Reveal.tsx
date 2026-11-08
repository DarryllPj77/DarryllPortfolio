import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { item, maskLine } from './variants';
import styles from './motion.module.css';

type Tag = 'div' | 'section' | 'li' | 'p' | 'header' | 'figure';

interface RevealProps {
  children: ReactNode;
  as?: Tag;
  className?: string;
  id?: string;
  'aria-labelledby'?: string;
  [dataAttribute: `data-${string}`]: string | undefined;
  /**
   * `page` (default): enters with the page's staggered entrance.
   * `scroll`: enters once when scrolled into view. Use sparingly
   * (section headings, project media).
   */
  trigger?: 'page' | 'scroll';
}

/** Content block that rises a few pixels into place. */
export function Reveal({ children, as = 'div', trigger = 'page', ...rest }: RevealProps) {
  const Component = motion[as];
  if (trigger === 'scroll') {
    return (
      <Component
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        {...rest}
      >
        {children}
      </Component>
    );
  }
  return (
    <Component variants={item} {...rest}>
      {children}
    </Component>
  );
}

/**
 * Heading text that slides up from behind a mask. The real text stays in the
 * heading element, so screen readers and search engines read it normally.
 */
export function MaskedText({ children }: { children: ReactNode }) {
  return (
    <span className={styles.mask}>
      <motion.span className={styles.maskInner} variants={maskLine}>
        {children}
      </motion.span>
    </span>
  );
}
