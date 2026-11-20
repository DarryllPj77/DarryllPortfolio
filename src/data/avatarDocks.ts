import { sections } from './navigation';

/**
 * The places Darryll's avatar can be dropped or sent to. Each page marks its
 * spot with `data-avatar-dock="<id>"` (the Home hero, a page header, the Home
 * "Selected work" heading, the Home contact block); nothing else is a target.
 */
export type DockId = 'home' | 'projects' | 'gallery' | 'about' | 'skills' | 'contact';

export interface AvatarDock {
  id: DockId;
  label: string;
  /** Where the spot lives when it is not on the current page. */
  path: string;
  /**
   * How the avatar presents itself there: its resting turn in radians
   * (negative faces the content on its left). Home uses the hero framing's own.
   */
  yaw?: number;
  /** Wave once after settling. */
  waveOnArrival?: boolean;
}

export const avatarDocks: AvatarDock[] = [
  { id: 'home', label: sections.home.label, path: sections.home.path },
  // Beside the project list, turned toward it.
  { id: 'projects', label: sections.projects.label, path: sections.projects.path, yaw: -0.55 },
  // Beside the exhibits, turned toward them.
  { id: 'gallery', label: sections.gallery.label, path: sections.gallery.path, yaw: -0.45 },
  // Relaxed and neutral: facing the visitor.
  { id: 'about', label: sections.about.label, path: sections.about.path, yaw: 0 },
  { id: 'skills', label: sections.skills.label, path: sections.skills.path, yaw: -0.3 },
  // A wave hello on arrival.
  { id: 'contact', label: sections.contact.label, path: sections.contact.path, yaw: -0.2, waveOnArrival: true },
];

export const getDock = (id: DockId): AvatarDock => avatarDocks.find((d) => d.id === id)!;

export const isDockId = (value: string | null | undefined): value is DockId =>
  avatarDocks.some((d) => d.id === value);
