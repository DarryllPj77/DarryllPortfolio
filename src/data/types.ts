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

export interface ProjectScreenshot {
  /** Path under /public, e.g. "/image/projects/academic-sentinel/teacher-login.jpg". */
  src: string;
  alt: string;
  caption: string;
  /** Intrinsic size of the file. Screenshots are never shown larger than this. */
  width: number;
  height: number;
}

/**
 * How a set of screenshots is laid out inside a case-study chapter:
 * - `feature`: one large screenshot
 * - `pair`: two related screenshots side by side
 * - `grid`: smaller supporting screenshots
 * - `log`: short, wide crops of log entries, stacked like a feed
 */
export type ScreenshotLayout = 'feature' | 'pair' | 'grid' | 'log';

export interface ScreenshotBlock {
  layout: ScreenshotLayout;
  shots: ProjectScreenshot[];
}

/** One part of the product story (e.g. "Teacher workflow") with its screenshots. */
export interface CaseStudyChapter {
  id: string;
  title: string;
  intro: string;
  blocks: ScreenshotBlock[];
}

export interface Project {
  slug: string;
  name: string;
  /** Workspace file name shown in the Explorer, e.g. "AcademicSentinel.cs". */
  fileName: string;
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
  /*
   * Optional case-study sections. Each one only appears on the project page
   * once it has content. Fill these with real information only.
   */
  problem?: string;
  /** "What it does": plain statements of features the project actually has. */
  features?: string[];
  /** Main screenshot, shown under the case-study header. */
  hero?: ProjectScreenshot;
  /** Screenshot chapters, shown in order after "My contribution". */
  chapters?: CaseStudyChapter[];
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
  /** Workspace file name shown in the Explorer, e.g. "Python.cert". */
  fileName: string;
  issuer: string;
  /** ISO year-month, e.g. "2025-07". */
  issued: string;
  /** ISO year-month, e.g. "2030-07". */
  expires: string;
}
