import { useReducedMotion } from 'motion/react';
import { lazy, Suspense } from 'react';
import { useLocation } from 'react-router';
import { getViewMeta } from '../../data/navigation';
import { useActiveSection } from '../../hooks/useActiveSection';
import { avatarConfig } from './avatar.types';
import styles from './Avatar.module.css';
import { AvatarPlaceholder } from './AvatarPlaceholder';

const AvatarScene = lazy(() => import('./AvatarScene'));

/**
 * Fixed-size area in the hero that hosts the avatar.
 * The hero only renders <AvatarSlot />; switching `avatarConfig.mode` to
 * 'scene' swaps in the 3D version without changing the hero layout.
 */
export function AvatarSlot() {
  const activeSection = useActiveSection();
  const { pathname } = useLocation();
  const selectedProject = getViewMeta(pathname).projectSlug;
  const reducedMotion = useReducedMotion() ?? false;
  const props = {
    activeSection,
    selectedProject,
    reducedMotion,
    label: 'Placeholder for an interactive 3D avatar of Darryll',
  };

  return (
    <div className={styles.slot}>
      {avatarConfig.mode === 'scene' ? (
        <Suspense fallback={<AvatarPlaceholder {...props} />}>
          <AvatarScene {...props} />
        </Suspense>
      ) : (
        <AvatarPlaceholder {...props} />
      )}
    </div>
  );
}
