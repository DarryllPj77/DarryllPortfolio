import { AnimatePresence, motion } from 'motion/react';
import { useLocation } from 'react-router';
import { normalizePath } from '../../data/navigation';
import { AppRoutes } from '../../routes';

/** Renders the current view with a short fade between views. */
export function Workspace() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={normalizePath(location.pathname)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <AppRoutes location={location} />
      </motion.div>
    </AnimatePresence>
  );
}
