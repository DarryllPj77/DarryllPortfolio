import type { IconName } from '../components/ui/Icon';
import { projects } from './projects';
import type { SectionId } from './types';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: IconName;
  section: SectionId;
  children?: NavItem[];
}

/** The Explorer tree. Project entries are generated from the project data. */
export const navTree: NavItem[] = [
  { id: 'home', label: 'Home', path: '/', icon: 'home', section: 'home' },
  { id: 'about', label: 'About', path: '/about', icon: 'user', section: 'about' },
  {
    id: 'projects',
    label: 'Projects',
    path: '/projects',
    icon: 'folder',
    section: 'projects',
    children: projects.map((p) => ({
      id: p.slug,
      label: p.name,
      path: `/projects/${p.slug}`,
      icon: 'file-code' as const,
      section: 'projects' as const,
    })),
  },
  { id: 'skills', label: 'Skills', path: '/skills', icon: 'layers', section: 'skills' },
  {
    id: 'certifications',
    label: 'Certifications',
    path: '/certifications',
    icon: 'award',
    section: 'certifications',
  },
  { id: 'contact', label: 'Contact', path: '/contact', icon: 'mail', section: 'contact' },
];

export interface ViewMeta {
  path: string;
  title: string;
  icon: IconName;
  section: SectionId;
  /** Breadcrumb segments, e.g. ["portfolio", "projects", "academic-sentinel"]. */
  crumbs: string[];
  known: boolean;
}

const flatNav: NavItem[] = navTree.flatMap((item) => [item, ...(item.children ?? [])]);

export function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.replace(/\/+$/, '');
  return pathname;
}

export function getViewMeta(pathname: string): ViewMeta {
  const path = normalizePath(pathname);
  const item = flatNav.find((n) => n.path === path);
  const segments = path.split('/').filter(Boolean);
  const crumbs = ['portfolio', ...segments];

  if (item) {
    return { path, title: item.label, icon: item.icon, section: item.section, crumbs, known: true };
  }
  return {
    path,
    title: 'Not found',
    icon: 'file-text',
    section: 'home',
    crumbs,
    known: false,
  };
}
