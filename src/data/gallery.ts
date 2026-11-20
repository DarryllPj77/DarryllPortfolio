import { getProject } from './projects';
import type { Project, ProjectScreenshot } from './types';

/*
 * The Gallery: a visual showcase of the three projects. Names, credits and links come from
 * projects.ts; this file only says which real screenshots each exhibit shows. Every image is
 * an original file in /public/image/projects/, shown at its own size and never edited.
 */

export interface Exhibit {
  project: Project;
  /** The main exhibit is shown largest and first, and can step through its screens. */
  main: boolean;
  /** Shown on the wall. */
  cover: ProjectScreenshot;
  /** Further screens: stepped through on the main exhibit, otherwise only in the viewer. */
  more: ProjectScreenshot[];
}

const shot = (
  folder: string,
  file: string,
  width: number,
  height: number,
  caption: string,
  alt: string,
): ProjectScreenshot => ({ src: `/image/projects/${folder}/${file}`, width, height, caption, alt });

/** `'hero'`: the cover is the project's case-study hero, so the case study opens on the same screen. */
const exhibit = (
  slug: string,
  main: boolean,
  cover: ProjectScreenshot | 'hero',
  more: ProjectScreenshot[],
): Exhibit => {
  const project = getProject(slug);
  const shown = cover === 'hero' ? project?.hero : cover;
  if (!project || !shown) throw new Error(`No project or cover for "${slug}" in the Gallery`);
  return { project, main, cover: shown, more };
};

export const exhibits: Exhibit[] = [
  exhibit(
    'academic-sentinel',
    true,
    shot(
      'academic-sentinel',
      'student-monitoring.png',
      1386,
      813,
      'Instructor Monitoring Console with a student’s details open',
      'Academic Sentinel Instructor Monitoring Console: participants on the left, a live log with idle and unauthorized-process violations in the middle, and a demonstration student’s details on the right showing 2 alerts and a Suspicious risk level.',
    ),
    [
      shot(
        'academic-sentinel',
        'activity-analytics.png',
        886,
        633,
        'Activity analytics for one student',
        'Academic Sentinel Activity Logs in analytic mode for a demonstration student: total events, total severity, a Suspicious risk level, and an event frequency breakdown by type.',
      ),
      shot(
        'academic-sentinel',
        'session-setup.png',
        986,
        613,
        'Session detection rules',
        'Academic Sentinel session setup: the exam type is chosen on the left and detection rules on the right, including focus detection anchored to an LMS exam URL, virtual machine detection, clipboard monitoring and unauthorized app detection.',
      ),
    ],
  ),
  exhibit(
    'prematch-tracker',
    false,
    'hero',
    [
      shot(
        'prematch-tracker',
        '02-manager-player-performance.jpg',
        976,
        1174,
        'Submission inspector for one player',
        'PreMatch Tracker submission inspector for one player: the day’s result marked attendance confirmed and passed, the targets it was checked against, and a score card for each deathmatch and range round.',
      ),
    ],
  ),
  exhibit(
    'spendsync',
    false,
    'hero',
    [
      shot(
        'spendsync',
        'spendsync-spending-categories.jpg',
        1073,
        778,
        'Spending by category',
        'SpendSync category summaries with demo data: spending in rent, groceries, business, utilities, transportation and dining, each with its amount and share of all expenses.',
      ),
    ],
  ),
];

/** Every screen of an exhibit, cover first. */
export const screensOf = (e: Exhibit): ProjectScreenshot[] => [e.cover, ...e.more];
