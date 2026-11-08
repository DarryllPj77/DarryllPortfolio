import type { SkillGroup, SkillLevel } from './types';

/** Plain-language labels so the level of experience is never overstated. */
export const skillLevels: Record<SkillLevel, { label: string; description: string }> = {
  primary: { label: 'Primary', description: 'My main language and where most of my work happens.' },
  fundamentals: {
    label: 'Fundamentals',
    description: 'Learned through coursework; comfortable with the basics.',
  },
  exposure: {
    label: 'Project exposure',
    description: 'Used in projects, mostly through AI-assisted implementation.',
  },
  tooling: { label: 'Experience using', description: 'Tools I use in my regular workflow.' },
  learning: { label: 'Currently learning', description: 'Actively studying right now.' },
};

export const skillGroups: SkillGroup[] = [
  {
    id: 'primary',
    title: 'Primary language',
    level: 'primary',
    description: 'The language I focus on for desktop and backend development.',
    items: [{ name: 'C#' }],
  },
  {
    id: 'dotnet',
    title: '.NET',
    description: 'Frameworks I have worked with in C# projects.',
    items: [
      { name: 'ASP.NET Core' },
      { name: 'WPF' },
      { name: 'Blazor' },
      { name: 'Entity Framework Core', qualifier: 'fundamentals' },
      { name: 'MVC', qualifier: 'fundamentals' },
    ],
  },
  {
    id: 'database',
    title: 'Database',
    description: 'Relational databases and query languages.',
    items: [{ name: 'SQL' }, { name: 'PostgreSQL' }, { name: 'PL/SQL', qualifier: 'fundamentals' }],
  },
  {
    id: 'languages',
    title: 'Programming fundamentals',
    level: 'fundamentals',
    description: 'Other languages from my coursework.',
    items: [{ name: 'C++' }, { name: 'Python' }, { name: 'Java' }, { name: 'PHP' }, { name: 'C' }],
  },
  {
    id: 'web',
    title: 'Web fundamentals',
    level: 'fundamentals',
    description: 'The building blocks of web applications.',
    items: [
      { name: 'HTML5' },
      { name: 'CSS3' },
      { name: 'JavaScript' },
      { name: 'REST APIs' },
      { name: 'JSON' },
    ],
  },
  {
    id: 'exposure',
    title: 'Project exposure',
    level: 'exposure',
    description: 'Front-end tooling used in my web projects.',
    items: [{ name: 'React' }, { name: 'Vite' }],
  },
  {
    id: 'environments',
    title: 'Development environments',
    level: 'tooling',
    description: 'Where I write and debug code.',
    items: [{ name: 'Visual Studio' }, { name: 'Visual Studio Code' }],
  },
  {
    id: 'tools',
    title: 'Tools',
    level: 'tooling',
    description: 'Tools for source control, packages and APIs.',
    items: [
      { name: 'Git' },
      { name: 'GitHub' },
      { name: '.NET CLI' },
      { name: 'NuGet' },
      { name: 'Swagger / OpenAPI' },
    ],
  },
  {
    id: 'learning',
    title: 'Currently learning',
    level: 'learning',
    description: 'Topics I am studying to write better-structured code.',
    items: [{ name: 'SOLID principles' }, { name: 'Design patterns' }],
  },
];
