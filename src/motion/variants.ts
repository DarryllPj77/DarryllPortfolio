import type { Variants } from 'motion/react';
import { duration, ease, rise, stagger } from './tokens';

/**
 * Page container. Children that use `item` (or any variant with the same
 * labels) enter one after another once the page is shown.
 */
export const page: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: duration.fast,
      ease: ease.out,
      staggerChildren: stagger.base,
      delayChildren: 0.02,
    },
  },
  exit: { opacity: 0, transition: { duration: duration.exit, ease: ease.out } },
};

/** A block of content rising a few pixels into place. */
export const item: Variants = {
  hidden: { opacity: 0, y: rise },
  show: { opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.out } },
};

/** Groups that stagger their own children (e.g. hero lines, list rows). */
export const group: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: stagger.tight } },
};

/** Text sliding up from behind a mask (used inside MaskedText). */
export const maskLine: Variants = {
  hidden: { y: '105%' },
  show: { y: '0%', transition: { duration: duration.section, ease: ease.out } },
};
