import { certifications } from './certifications';
import { sections } from './navigation';
import { profile } from './profile';
import { featuredProject, projects } from './projects';
import type { Project } from './types';

/**
 * What the workspace companion says when it reaches a file or link. Keys match
 * the `data-companion` attribute on the Explorer rows and top navigation links:
 * a route path, with a hash for a single certification file.
 *
 * Every line is built from the portfolio data so facts stay in one place, and
 * project lines follow each project's credit note (what I did versus what AI
 * tools implemented).
 */
export interface CompanionLine {
  /** File name shown in the bubble's header, like an editor tab. */
  title: string;
  text: string;
}

const projectLine = (p: Project): string => {
  if (p.credit.kind === 'hands-on-ai') {
    return `${p.tagline} I worked on its UI, UI testing, debugging and backend logic; AI tools I directed built other parts.`;
  }
  return `${p.tagline} AI tools wrote the code from my concept; I planned it, directed it and tested each version.`;
};

const certNames = certifications.map((c) => c.name);

export const companionLines: Record<string, CompanionLine> = {
  [sections.home.path]: {
    title: sections.home.file,
    text: `Start here. I'm a ${profile.yearLevel.toLowerCase()} Computer Science student focused on C# and .NET, open to a ${profile.internship.label}.`,
  },
  [sections.about.path]: {
    title: sections.about.file,
    text: `Let me tell you a bit about my background! I study at ${profile.school}, specializing in ${profile.specialization}.`,
  },
  [sections.projects.path]: {
    title: sections.projects.file,
    text: `${projects.length} projects in here. ${featuredProject.name} is the .NET one: a WPF desktop client with an ASP.NET Core API.`,
  },
  [sections.skills.path]: {
    title: sections.skills.file,
    text: 'C# and .NET are my main stack, with WPF, ASP.NET Core and PostgreSQL. Coursework added C++, Python, Java, PHP and C.',
  },
  [sections.certifications.path]: {
    title: sections.certifications.file,
    text: `${certNames.length} certifications so far: ${certNames.join(' and ')}.`,
  },
  [sections.contact.path]: {
    title: sections.contact.file,
    text: `Email is the quickest way to reach me about a ${profile.internship.label}, available ${profile.internship.availability}.`,
  },
  ...Object.fromEntries(
    projects.map((p) => [`/projects/${p.slug}`, { title: p.fileName, text: projectLine(p) }]),
  ),
  ...Object.fromEntries(
    certifications.map((c) => [
      `${sections.certifications.path}#${c.id}`,
      { title: c.fileName, text: `${c.name}, from ${c.issuer}.` },
    ]),
  ),
};

export const getCompanionLine = (key: string): CompanionLine | undefined => companionLines[key];
