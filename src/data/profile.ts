import type { Profile } from './types';

export const profile: Profile = {
  fullName: 'Darryll J. Pajaganas',
  firstName: 'Darryll',
  initials: 'DP',
  headline: 'Computer Science student · Software Engineering',
  focus: 'C# / .NET Software Development',
  degree: 'BS Computer Science',
  specialization: 'Software Engineering',
  school: 'FEU Institute of Technology',
  yearLevel: 'Fourth year',
  location: 'Antipolo, Rizal, Philippines',
  locationShort: 'Antipolo, PH',
  email: 'darryll.pajaganas.dev@gmail.com',
  // Set to '/resume.pdf' once a resume without a phone number is placed in /public.
  resumeUrl: null,
  intro:
    'I build desktop and web applications, mostly with C# and .NET. I like taking an idea from a rough concept to something that works: researching how the pieces should connect, building the interface, and testing until it holds up.',
  about: [
    "I'm a fourth-year BS Computer Science student at FEU Institute of Technology, specializing in Software Engineering.",
    'C# and .NET are my main direction. Most of my project work involves WPF for desktop interfaces and ASP.NET Core for the APIs behind them, with PostgreSQL for data. Coursework has also given me a foundation in C++, Python, Java, PHP and C.',
    'My projects usually start with a problem I want to solve. I research how the technologies should fit together, plan the features, work on the UI and backend logic, and test each iteration. I also use AI coding tools such as Claude Code and Codex as part of that workflow, and I am upfront about where they did the implementation work.',
    "Right now I'm looking for a 520-hour OJT where I can contribute to a real .NET codebase and learn from an experienced team.",
  ],
  internship: {
    label: '520-hour OJT',
    hours: 520,
    availability: 'December 2026 or January 2027',
    note: 'Tentative, subject to academic schedule',
    isOpen: true,
  },
};
