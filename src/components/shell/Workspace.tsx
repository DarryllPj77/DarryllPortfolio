import { AnimatePresence, motion } from 'motion/react';
import { useLocation } from 'react-router';
import { normalizePath } from '../../data/navigation';
import { page } from '../../motion/variants';
import { AppRoutes } from '../../routes';

/**
 * Renders the current view. On navigation the old view fades out quickly,
 * then the new one enters with its content staggered (see motion/variants).
 * `paused` holds the entrance while the intro is showing.
 */
export function Workspace({ paused }: { paused: boolean }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={normalizePath(location.pathname)}
        variants={page}
        initial="hidden"
        animate={paused ? 'hidden' : 'show'}
        exit="exit"
      >
        <AppRoutes location={location} />
      </motion.div>
    </AnimatePresence>
  );
}
