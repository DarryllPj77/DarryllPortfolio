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
    items: [{ name: 'C#', icon: 'c-sharp.svg' }],
  },
  {
    id: 'dotnet',
    title: '.NET fundamentals',
    level: 'fundamentals',
    description: 'Frameworks I have worked with in C# projects.',
    items: [
      { name: 'ASP.NET Core' },
      { name: 'ASP.NET Core MVC' },
      { name: 'WPF' },
      { name: 'Blazor' },
      { name: 'Entity Framework Core' },
    ],
  },
  {
    id: 'database',
    title: 'Database',
    description: 'Relational databases and query languages.',
    items: [{ name: 'SQL' }, { name: 'PostgreSQL', icon: 'postgres.svg' }, { name: 'PL/SQL', qualifier: 'fundamentals' }],
  },
  {
    id: 'languages',
    title: 'Programming fundamentals',
    level: 'fundamentals',
    description: 'Other languages from my coursework.',
    items: [{ name: 'C++', icon: 'c-plusplus.svg' }, { name: 'Python', icon: 'python.svg' }, { name: 'Java', icon: 'java.svg' }, { name: 'PHP', icon: 'php.svg' }, { name: 'C', icon: 'c.svg' }],
  },
  {
    id: 'web',
    title: 'Web fundamentals',
    level: 'fundamentals',
    description: 'The building blocks of web applications.',
    items: [
      { name: 'HTML5', icon: 'html-5.svg' },
      { name: 'CSS3', icon: 'css.svg' },
      { name: 'JavaScript', icon: 'javascript.svg' },
      { name: 'REST APIs' },
      { name: 'JSON' },
    ],
  },
  {
    id: 'exposure',
    title: 'Project exposure',
    level: 'exposure',
    description: 'Front-end tooling used in my web projects.',
    items: [{ name: 'React', icon: 'react.svg' }, { name: 'Vite', icon: 'vitejs.svg' }],
  },
  {
    id: 'environments',
    title: 'Development environments',
    level: 'tooling',
    description: 'Where I write and debug code.',
    items: [{ name: 'Visual Studio', icon: 'visual-studio.svg' }, { name: 'Visual Studio Code', icon: 'visual-studio-code.svg' }],
  },
  {
    id: 'tools',
    title: 'Tools',
    level: 'tooling',
    description: 'Tools for source control, packages and APIs.',
    items: [
      { name: 'Git', icon: 'git-icon.svg' },
      { name: 'GitHub', icon: 'github.svg' },
      { name: '.NET CLI', icon: 'dotnet.svg' },
      { name: 'NuGet', icon: 'nuget-icon.svg' },
      { name: 'Swagger / OpenAPI', icon: 'swagger.svg' },
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
