export type SectionId = 'home' | 'about' | 'projects' | 'skills' | 'certifications' | 'contact';

export interface Internship {
  label: string;
  hours: number;
  availability: string;
  note: string;
  isOpen: boolean;
}

export interface Profile {
  fullName: string;
  firstName: string;
  initials: string;
  headline: string;
  focus: string;
  degree: string;
  specialization: string;
  school: string;
  yearLevel: string;
  location: string;
  locationShort: string;
  email: string;
  /** Public path to the resume PDF. Keep `null` until a phone-free version is ready. */
  resumeUrl: string | null;
  intro: string;
  about: string[];
  internship: Internship;
}

export type SocialId = 'github' | 'linkedin' | 'email';

export interface SocialLink {
  id: SocialId;
  label: string;
  href: string;
  display: string;
}

/** How a project was built, stated plainly so it is never overstated. */
export type CreditKind = 'hands-on-ai' | 'ai-assisted';

export interface ProjectCredit {
  kind: CreditKind;
  label: string;
  note: string;
}

export interface ArchitectureNode {
  label: string;
  detail?: string;
}

export interface ProjectArchitecture {
  nodes: ArchitectureNode[];
  realtime?: ArchitectureNode;
}

export interface ProjectLink {
  kind: 'repo' | 'live';
  label: string;
  href: string;
}

export interface Project {
  slug: string;
  name: string;
  period: string;
  category: string;
  tagline: string;
  summary: string;
  featured: boolean;
  stack: string[];
  architecture?: ProjectArchitecture;
  contributions: string[];
  credit: ProjectCredit;
  links: ProjectLink[];
}

export type SkillLevel = 'primary' | 'fundamentals' | 'exposure' | 'tooling' | 'learning';

export interface SkillItem {
  name: string;
  /** Shown next to the skill when the experience is limited, e.g. "fundamentals". */
  qualifier?: string;
}

export interface SkillGroup {
  id: string;
  title: string;
  level?: SkillLevel;
  description: string;
  items: SkillItem[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  /** ISO year-month, e.g. "2025-07". */
  issued: string;
  /** ISO year-month, e.g. "2030-07". */
  expires: string;
}
