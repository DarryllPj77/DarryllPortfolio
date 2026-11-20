import { getProject } from '../data/projects';
import type { Project, ProjectLink } from '../data/types';

/*
 * The Gallery's three exhibits. Names, years, credits and links come from the portfolio's
 * projects.ts, so facts stay in one place; this file only chooses the real screenshots each
 * exhibit shows and a few headline technologies. Every image is an original file in
 * /public/image/projects/, never edited. Left out on purpose: screens showing a third
 * party's email address, and the evidence view that is mostly game footage.
 */

export interface GalleryShot {
  src: string;
  /** Stored size of the file. */
  width: number;
  height: number;
  alt: string;
}

export interface GalleryProject {
  slug: string;
  project: Project;
  /** Shown on the exhibit, and first in the project's presentation. */
  cover: GalleryShot;
  /** The rest of the presentation, in order. */
  screens: GalleryShot[];
  /** At most four headline technologies, each one from the project's own stack. */
  stack: string[];
  links: ProjectLink[];
}

const shot = (folder: string, file: string, width: number, height: number, alt: string): GalleryShot => ({
  src: `/image/projects/${folder}/${file}`,
  width,
  height,
  alt,
});

const exhibit = (slug: string, cover: GalleryShot, screens: GalleryShot[], stack: string[]): GalleryProject => {
  const project = getProject(slug);
  if (!project) throw new Error(`No project "${slug}" for the Gallery`);
  return { slug, project, cover, screens, stack, links: project.links };
};

const AS = 'academic-sentinel';
const PM = 'prematch-tracker';
const SS = 'spendsync';

export const galleryProjects: GalleryProject[] = [
  exhibit(
    AS,
    shot(AS, 'student-monitoring.png', 1386, 813,
      'Academic Sentinel Instructor Monitoring Console: participants on the left, a live log with idle and unauthorized-process violations in the middle, and a demonstration student’s details on the right showing 2 alerts and a Suspicious risk level.'),
    [
      shot(AS, 'live-monitoring.png', 1386, 813,
        'Academic Sentinel Instructor Monitoring Console with monitoring active: the participants list on the left and the Global Log Feed on the right, showing a session start and two violations.'),
      shot(AS, 'activity-analytics.png', 886, 633,
        'Academic Sentinel Activity Logs in analytic mode for a demonstration student: total events, total severity, a Suspicious risk level, and an event frequency breakdown by type.'),
      shot(AS, 'activity-logs.png', 886, 633,
        'Academic Sentinel Activity Logs table for a demonstration student: each event’s timestamp, type, severity and description, with a summary of events by type.'),
      shot(AS, 'session-setup.png', 986, 613,
        'Academic Sentinel session setup: the exam type on the left and detection rules on the right, including focus detection anchored to an LMS exam URL, virtual machine detection, clipboard monitoring and unauthorized app detection.'),
      shot(AS, 'session-history.png', 1920, 1032,
        'Academic Sentinel course page for a teacher: a control to start a new monitoring session above a table of past sessions with their date, duration, attendees and status.'),
    ],
    ['C#', 'WPF', 'ASP.NET Core Web API', 'SignalR'],
  ),
  exhibit(
    PM,
    shot(PM, '01-manager-daily-attendance.jpg', 976, 1028,
      'PreMatch Tracker manager feed for a demo team: the roster, an attendance calendar marked with passed and failed days, and five player submissions for the day with their scores and a pass or fail result.'),
    [
      shot(PM, '02-manager-player-performance.jpg', 976, 1174,
        'PreMatch Tracker submission inspector for one player: the day’s result marked attendance confirmed and passed, the targets it was checked against, and a score card for each deathmatch and range round.'),
      shot(PM, '05-player-practice-submission.jpg', 976, 1899,
        'PreMatch Tracker player page: a practice streak calendar beside the team name, then the day’s deathmatch placements and range scores with their screenshots, and a Submit Run button.'),
      shot(PM, '03-manager-target-settings.jpg', 1088, 789,
        'PreMatch Tracker target settings dialog for the manager: deathmatch matches required, top placement limit, range rounds required and range minimum score.'),
    ],
    ['React 19', 'Express 5', 'Socket.IO', 'PostgreSQL / Neon'],
  ),
  exhibit(
    SS,
    shot(SS, 'spendsync-monthly-analytics-viewport.jpg', 1075, 780,
      'SpendSync Monthly Summary with demo data: total income, total expenses and all-time net, above a bar chart comparing income and expenses for each month from June to November 2026.'),
    [
      shot(SS, 'spendsync-transaction-ledger.jpg', 1073, 778,
        'SpendSync transaction ledger with demo data: search and filters above a table of dated income and expenses, each with its category, payment method and running balance.'),
      shot(SS, 'spendsync-spending-categories.jpg', 1073, 778,
        'SpendSync category summaries with demo data: spending in rent, groceries, business, utilities, transportation and dining, each with its amount and share of all expenses.'),
      shot(SS, 'spendsync-finance-overview.jpg', 1075, 780,
        'SpendSync overview with demo data: income, spending and remaining balance totals above forms to log an expense and a deposit.'),
    ],
    ['JavaScript (ES modules)', 'Chart.js', 'SheetJS', 'Google Drive API'],
  ),
];

/** "01 / 03". */
export const exhibitNumber = (index: number) =>
  `${String(index + 1).padStart(2, '0')} / ${String(galleryProjects.length).padStart(2, '0')}`;
