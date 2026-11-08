import type { IconName } from '../components/ui/Icon';
import { certifications } from './certifications';
import { getProject, projects } from './projects';
import type { SectionId } from './types';

export interface SectionInfo {
  id: SectionId;
  /** Nav label. */
  label: string;
  /** Label used in "02 / PROJECTS" style markers. */
  marker: string;
  index: string;
  path: string;
  /** File name shown next to the item in the workspace views. */
  file: string;
}

/** Every section, in reading order. Numbers feed the "01 / …" labels. */
export const sections: Record<SectionId, SectionInfo> = {
  home: { id: 'home', label: 'Home', marker: 'Introduction', index: '01', path: '/', file: 'README.md' },
  projects: { id: 'projects', label: 'Projects', marker: 'Projects', index: '02', path: '/projects', file: 'projects/' },
  about: { id: 'about', label: 'About', marker: 'About', index: '03', path: '/about', file: 'Darryll.md' },
  skills: { id: 'skills', label: 'Skills', marker: 'Skills', index: '04', path: '/skills', file: 'tech-stack.json' },
  certifications: {
    id: 'certifications',
    label: 'Certifications',
    marker: 'Certifications',
    index: '05',
    path: '/certifications',
    file: 'certifications/',
  },
  contact: { id: 'contact', label: 'Contact', marker: 'Contact', index: '06', path: '/contact', file: 'contact.me' },
};

/** Recruiter-friendly top navigation. */
export const primaryNav: SectionId[] = ['home', 'projects', 'about', 'skills', 'contact'];

/** Mobile menu: everything, since there is no Explorer on phones. */
export const mobileNav: SectionId[] = ['home', 'projects', 'about', 'skills', 'certifications', 'contact'];

/* ---------------- Explorer (workspace file tree) ---------------- */

export type FileTone = 'accent' | 'accent-2' | 'success' | 'muted';

export interface ExplorerFile {
  kind: 'file';
  id: string;
  /** File name shown in the tree, e.g. "AcademicSentinel.cs". */
  name: string;
  /** Plain-language name for tooltips and screen readers. */
  title: string;
  path: string;
  hash?: string;
  icon: IconName;
  tone: FileTone;
}

export interface ExplorerFolder {
  kind: 'folder';
  id: string;
  name: string;
  children: ExplorerFile[];
}

export type ExplorerNode = ExplorerFile | ExplorerFolder;

const extensionStyle: Record<string, { icon: IconName; tone: FileTone }> = {
  md: { icon: 'file-text', tone: 'muted' },
  cs: { icon: 'file-code', tone: 'accent' },
  jsx: { icon: 'file-code', tone: 'accent-2' },
  js: { icon: 'file-code', tone: 'accent-2' },
  json: { icon: 'braces', tone: 'success' },
  cert: { icon: 'award', tone: 'accent' },
  me: { icon: 'mail', tone: 'accent-2' },
};

function file(name: string, title: string, path: string, hash?: string): ExplorerFile {
  const ext = name.split('.').pop() ?? '';
  const style = extensionStyle[ext] ?? { icon: 'file-text', tone: 'muted' };
  return { kind: 'file', id: `${path}${hash ?? ''}:${name}`, name, title, path, hash, ...style };
}

export const explorerTree: ExplorerNode[] = [
  file('README.md', 'Home', '/'),
  { kind: 'folder', id: 'about', name: 'about', children: [file('Darryll.md', 'About', '/about')] },
  {
    kind: 'folder',
    id: 'projects',
    name: 'projects',
    children: projects.map((p) => file(p.fileName, p.name, `/projects/${p.slug}`)),
  },
  {
    kind: 'folder',
    id: 'skills',
    name: 'skills',
    children: [file('tech-stack.json', 'Skills', '/skills')],
  },
  {
    kind: 'folder',
    id: 'certifications',
    name: 'certifications',
    children: certifications.map((c) => file(c.fileName, c.name, '/certifications', `#${c.id}`)),
  },
  { kind: 'folder', id: 'contact', name: 'contact', children: [file('contact.me', 'Contact', '/contact')] },
];

/* ---------------- Route metadata ---------------- */

export interface ViewMeta {
  path: string;
  title: string;
  section: SectionId;
  known: boolean;
  /** Set on project detail pages. */
  projectSlug?: string;
}

export function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.replace(/\/+$/, '');
  return pathname;
}

export function getViewMeta(pathname: string): ViewMeta {
  const path = normalizePath(pathname);
  const section = Object.values(sections).find((s) => s.path === path);
  if (section) return { path, title: section.label, section: section.id, known: true };

  const match = /^\/projects\/([^/]+)$/.exec(path);
  const project = match ? getProject(match[1]) : undefined;
  if (project) {
    return { path, title: project.name, section: 'projects', known: true, projectSlug: project.slug };
  }
  return { path, title: 'Not found', section: 'home', known: false };
}
