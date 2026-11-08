Read `AGENTS.md` and all existing project instructions first. Inspect the repository before making changes.

Build Phase 1 of my personal developer portfolio.

## Goal

Create an original, professional, interactive portfolio for:

**Darryll J. Pajaganas**  
Computer Science student specializing in Software Engineering  
Primary focus: **C# / .NET Software Development**

This portfolio will be used for internship applications, so prioritize professionalism, readability, responsiveness, accessibility, and performance.

Do not make it look like a generic AI-generated developer portfolio.

## Design Direction

Use a **dark shell/workspace-style interface** inspired by modern developer tools, but DO NOT directly copy VS Code, Visual Studio, or another IDE.

The site should feel like my own developer workspace.

### Color System

- Main background: `#0F172A`
- Shell/sidebar: `#111C2E`
- Panels: `#162033`
- Elevated cards: `#1E293B`
- Borders: `#334155`
- Primary text: `#F1F5F9`
- Secondary text: `#94A3B8`
- Primary accent: `#818CF8`
- Secondary accent: `#38BDF8`
- Success: `#4ADE80`
- Warning: `#FBBF24`
- Error: `#F87171`

Avoid:
- Pure black backgrounds
- Excessive gradients
- Excessive glow
- Glassmorphism everywhere
- Neon cyberpunk styling
- Too many animated elements

Use roughly 90% dark neutral colors and 10% accent colors.

## Shell Layout

Create a responsive application-like shell.

Desktop concept:

- Top bar
- Collapsible/resizable Explorer sidebar
- Main content workspace
- Optional tab/navigation system
- Bottom status bar

Explorer structure:

PORTFOLIO
- About
- Projects
  - Academic Sentinel
  - PreMatch Tracker
  - SpendSync
- Skills
- Certifications
- Contact

The navigation can visually reference files/folders, but keep it professional and understandable to non-programmer recruiters.

## Main Sections

### Home / Hero

Introduce:

**Hi, I'm Darryll.**

Computer Science student focused on **C# and .NET Software Development**.

Include:
- Short professional introduction
- Explore Projects button
- View Resume button
- GitHub
- LinkedIn
- Internship availability indicator

Internship:
520-hour OJT  
Tentative availability: December 2026 or January 2027, subject to academic schedule.

Reserve a prominent area beside the hero for a future **interactive 3D avatar of me**.

For now, create an elegant placeholder.

Do NOT generate or implement the final 3D model yet.

Design the component architecture so a future React Three Fiber / Three.js avatar can replace the placeholder without restructuring the hero.

### About

Explain that I am a fourth-year BS Computer Science student specializing in Software Engineering at FEU Institute of Technology.

My main programming direction is C#/.NET.

Keep the writing concise and natural.

### Skills

Represent skill level accurately.

Primary Programming:
- C#

Programming Fundamentals:
- C++
- Python
- Java
- PHP
- C

.NET:
- ASP.NET Core
- WPF
- Blazor
- Entity Framework Core fundamentals
- MVC fundamentals

Database:
- SQL
- PostgreSQL
- PL/SQL fundamentals

Web Fundamentals:
- HTML5
- CSS3
- JavaScript
- REST APIs
- JSON

Project Exposure:
- React
- Vite

Development:
- Visual Studio
- Visual Studio Code

Experience using:
- Git
- GitHub
- .NET CLI
- NuGet
- Swagger/OpenAPI

Currently Learning:
- SOLID Principles
- Design Patterns

Do not represent me as proficient in technologies where only fundamentals or project exposure are listed.

### Projects

Make **Academic Sentinel** the featured project.

#### Academic Sentinel
2025–2026

Anti-cheating desktop application.

Stack:
C#, WPF, .NET 10, MaterialDesignThemes, ASP.NET Core Web API, PostgreSQL, Entity Framework Core, Npgsql, SignalR, JWT authentication, BCrypt, Swagger/OpenAPI, QuestPDF, log4net.

Architecture:
WPF desktop client → ASP.NET Core REST API → PostgreSQL, with SignalR for live exam monitoring.

My contribution:
- UI work
- UI testing
- Debugging/fixing bugs
- Backend logic
- Feature/concept ideas
- Technical research
- Researching how technologies could be connected
- Using that research to direct AI coding tools such as Claude Code and Codex

Do not falsely imply that I independently implemented every technology in the stack.

GitHub:
https://github.com/DarryllPj77/AcademicSentinel-BackupRepo

The repository may be renamed later, so isolate project URLs in project data/configuration rather than scattering URLs through components.

#### PreMatch Tracker
2026

A web application for recording player practice submissions and reviewing attendance/performance from a manager dashboard.

Stack:
React 19, Vite 7, CSS, Node.js, Express 5, Socket.IO, PostgreSQL/Neon, JWT, LocalForage, ONNX Runtime Web.

This was an **AI-assisted implementation** based on my concept.

My contribution:
- Project concept
- Requirements/feature ideas
- Technical research
- Researching integrations
- Directing Codex
- Testing and iteration

Do not claim that I manually wrote the entire codebase.

GitHub:
https://github.com/DarryllPj77/prematch-tracker

Live:
https://prematch-tracker.onrender.com/

#### SpendSync
2026

Responsive personal and small-business finance tracker.

Stack:
HTML5, CSS3, vanilla JavaScript/ES modules, localStorage, SheetJS, Chart.js, Google Identity Services, Google Drive API, Google Picker API.

AI-assisted implementation based on my concept and research.

My contribution:
- Concept
- Feature planning
- Technical research
- AI-assisted implementation direction
- Testing/iteration

GitHub:
https://github.com/DarryllPj77/SpendSync

### Certifications

Add:

**IT Specialist – Python**
Certiport, a Pearson VUE business
Issued July 2025
Expires July 2030

**PMI Project Management Ready**
Project Management Institute
Issued March 2026
Expires March 2031

### Contact

Include:

Email:
darryll.pajaganas.dev@gmail.com

GitHub:
https://github.com/DarryllPj77

LinkedIn:
https://www.linkedin.com/in/darryll-pajaganas-73489938a

Location:
Antipolo, Rizal, Philippines

Do not expose my phone number publicly on the portfolio for now.

## Interaction Design

Interactions should feel polished but restrained.

Implement:
- Smooth section/navigation transitions
- Active navigation state
- Sidebar collapse
- Responsive sidebar behavior
- Project selection
- Expandable project details where appropriate
- Subtle hover/focus states
- Loading/progress states where actually needed
- Keyboard-accessible navigation
- Reduced-motion support

Animations should reinforce interaction, not exist just for decoration.

Do not implement excessive parallax or constant background animation.

## 3D Avatar Preparation

Create a reusable placeholder/component architecture such as:

`components/3d/AvatarScene`
`components/3d/AvatarPlaceholder`

Do NOT add Three.js dependencies yet unless they are already required by the project.

Later, this will become an interactive 3D model with:
- Idle animation
- Pointer/head tracking
- Drag rotation
- Click/wave interaction
- Section-aware reactions
- Mobile optimization
- Reduced-motion behavior

Phase 1 only needs to prepare for it.

## Architecture

Keep portfolio content separate from presentation when practical.

Prefer centralized data/configuration for:
- Projects
- Skills
- Certifications
- Social links

Avoid giant components.

Use reusable components and a clear folder structure.

Do not over-engineer the project.

## Responsive Requirements

Desktop:
Full shell/workspace experience.

Tablet:
Compact shell with collapsible navigation.

Mobile:
Do not force a desktop IDE layout onto a phone.

Transform the shell naturally into a mobile-friendly interface while retaining the same visual identity.

No horizontal page overflow.

## Accessibility

Use semantic HTML.

Include:
- Keyboard navigation
- Visible focus states
- Appropriate ARIA only where needed
- Sufficient color contrast
- Reduced-motion support
- Accessible interactive controls

## Important

Do not build everything blindly in one pass.

First:
1. Read project instructions.
2. Inspect the repository.
3. Determine the existing stack and architecture.
4. Present a concise implementation plan.
5. Then implement Phase 1 using the existing project conventions.

Do not rewrite unrelated files.

After implementation:
- Run the available build/lint/tests.
- Check desktop, tablet, and mobile layouts.
- Check for overflow.
- Check navigation behavior.
- Check accessibility basics.
- Report what was implemented and any remaining issues.

The 3D avatar will be implemented in a later phase.

For the portfolio we planned, I recommend this stack:
Part	Technology	Purpose
Frontend	React + TypeScript	Main portfolio application
Build Tool	Vite	Development/build system
Styling	CSS / CSS Modules	Original shell design
3D	Three.js	3D rendering
3D + React	React Three Fiber	Integrate your 3D avatar with React
3D Helpers	Drei	Camera, model loading, controls, animations
Animation	Framer Motion / Motion	UI transitions and shell animations
3D Model	GLB / glTF	Your actual 3D avatar file
Deployment	Vercel or Render	Host the portfolio
Version Control	Git + GitHub	Source control