import { useLocation } from 'react-router';
import { getViewMeta } from '../data/navigation';
import type { SectionId } from '../data/types';

/** The section currently shown in the workspace. Also feeds the future 3D avatar. */
export function useActiveSection(): SectionId {
  const { pathname } = useLocation();
  return getViewMeta(pathname).section;
}
