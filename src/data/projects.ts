import type { Project } from './types';

/**
 * All project content and URLs live here. If a repository is renamed,
 * update its link in this file only.
 */
export const projects: Project[] = [
  {
    slug: 'academic-sentinel',
    name: 'Academic Sentinel',
    period: '2025–2026',
    category: 'Desktop application',
    tagline: 'Anti-cheating desktop application with live exam monitoring.',
    summary:
      'A WPF desktop client for running exams, backed by an ASP.NET Core REST API and a PostgreSQL database. SignalR keeps the client and server connected for live exam monitoring. The system also uses JWT authentication with BCrypt password hashing, QuestPDF for PDF generation, and log4net for logging.',
    featured: true,
    stack: [
      'C#',
      'WPF',
      '.NET 10',
      'MaterialDesignThemes',
      'ASP.NET Core Web API',
      'PostgreSQL',
      'Entity Framework Core',
      'Npgsql',
      'SignalR',
      'JWT',
      'BCrypt',
      'Swagger / OpenAPI',
      'QuestPDF',
      'log4net',
    ],
    architecture: {
      nodes: [
        { label: 'WPF desktop client', detail: '.NET 10 · MaterialDesignThemes' },
        { label: 'ASP.NET Core REST API', detail: 'JWT · EF Core · Swagger' },
        { label: 'PostgreSQL', detail: 'Npgsql' },
      ],
      realtime: { label: 'SignalR', detail: 'Live exam monitoring between client and API' },
    },
    contributions: [
      'UI work on the desktop client',
      'UI testing',
      'Debugging and fixing bugs',
      'Backend logic',
      'Feature and concept ideas',
      'Technical research, including how the technologies could be connected',
      'Using that research to direct AI coding tools (Claude Code, Codex)',
    ],
    credit: {
      kind: 'hands-on-ai',
      label: 'Hands-on + AI-assisted',
      note: 'I worked directly on the UI, UI testing, debugging and backend logic. Other parts of the stack were implemented with AI coding tools that I directed based on my own technical research, so I did not build every technology listed here by myself.',
    },
    links: [
      {
        kind: 'repo',
        label: 'Source on GitHub',
        href: 'https://github.com/DarryllPj77/AcademicSentinel-BackupRepo',
      },
    ],
  },
  {
    slug: 'prematch-tracker',
    name: 'PreMatch Tracker',
    period: '2026',
    category: 'Web application',
    tagline: 'Practice submissions and attendance review for a team.',
    summary:
      'A web application where players record their practice submissions and a manager reviews attendance and performance from a dashboard. It uses a React front end with an Express and Socket.IO server, and stores data in PostgreSQL on Neon.',
    featured: false,
    stack: [
      'React 19',
      'Vite 7',
      'CSS',
      'Node.js',
      'Express 5',
      'Socket.IO',
      'PostgreSQL / Neon',
      'JWT',
      'LocalForage',
      'ONNX Runtime Web',
    ],
    contributions: [
      'Project concept',
      'Requirements and feature ideas',
      'Technical research',
      'Researching integrations',
      'Directing Codex through the implementation',
      'Testing and iteration',
    ],
    credit: {
      kind: 'ai-assisted',
      label: 'AI-assisted implementation',
      note: 'The code was implemented with Codex based on my concept. I owned the requirements, research and direction, and tested each iteration.',
    },
    links: [
      {
        kind: 'live',
        label: 'Live site',
        href: 'https://prematch-tracker.onrender.com/',
      },
      {
        kind: 'repo',
        label: 'Source on GitHub',
        href: 'https://github.com/DarryllPj77/prematch-tracker',
      },
    ],
  },
  {
    slug: 'spendsync',
    name: 'SpendSync',
    period: '2026',
    category: 'Web application',
    tagline: 'Responsive finance tracker for personal and small-business use.',
    summary:
      'A responsive finance tracker built with plain HTML, CSS and JavaScript modules. It stores data in the browser, charts spending with Chart.js, works with spreadsheet files through SheetJS, and connects to Google Drive using Google Identity Services and the Drive and Picker APIs.',
    featured: false,
    stack: [
      'HTML5',
      'CSS3',
      'JavaScript (ES modules)',
      'localStorage',
      'SheetJS',
      'Chart.js',
      'Google Identity Services',
      'Google Drive API',
      'Google Picker API',
    ],
    contributions: [
      'Concept',
      'Feature planning',
      'Technical research',
      'Directing the AI-assisted implementation',
      'Testing and iteration',
    ],
    credit: {
      kind: 'ai-assisted',
      label: 'AI-assisted implementation',
      note: 'The code was implemented with AI coding tools based on my concept and research. I planned the features, directed the implementation, and tested each iteration.',
    },
    links: [
      {
        kind: 'repo',
        label: 'Source on GitHub',
        href: 'https://github.com/DarryllPj77/SpendSync',
      },
    ],
  },
];

export function getProject(slug: string | undefined): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export const featuredProject: Project = projects.find((p) => p.featured) ?? projects[0];
