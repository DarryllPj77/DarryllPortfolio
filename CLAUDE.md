# DarryllPortfolio — Claude Code Instructions

## Role

Act as the development assistant for **DarryllPortfolio**, the personal developer portfolio of Darryll J. Pajaganas.

Help implement, debug, test, refactor, and improve the project while preserving its established design direction and architecture.

Do not make major design or architectural changes without explaining them first.

---

## Project Reference

`PORTFOLIO_PLAN.md` contains the main portfolio specification, content, design direction, and requirements.

Reference it when:
- implementing a major new feature
- making architectural changes
- changing the overall UI/UX
- working on portfolio content
- making decisions that could conflict with the original design

You do not need to reread or summarize the entire file for every small task.

---

## Technology Stack

Primary frontend stack:

- React
- TypeScript
- Vite
- CSS
- Motion / Framer Motion where appropriate

Future 3D stack:

- Three.js
- React Three Fiber
- Drei
- GLB/glTF avatar assets

Do not introduce major frameworks or dependencies unless they provide a clear benefit.

---

## Project Identity

The portfolio represents a Computer Science student focused primarily on:

**C# / .NET Software Development**

The website should feel professional enough for internship applications while still having a distinctive developer identity.

Visual direction:

**Midnight .NET + Developer Shell + Editorial Portfolio + Subtle Engineering Grid**

The portfolio may take inspiration from developer tools and high-quality interactive portfolios, but must remain an original design.

Do not directly copy another website, portfolio, VS Code, Visual Studio, or other IDE.

---

## Color System

Use the established palette consistently.

- Main Background: `#0F172A`
- Shell / Sidebar: `#111C2E`
- Panels: `#162033`
- Elevated Surfaces: `#1E293B`
- Borders: `#334155`
- Primary Text: `#F1F5F9`
- Secondary Text: `#94A3B8`
- Primary Accent: `#818CF8`
- Secondary Accent: `#38BDF8`
- Success: `#4ADE80`
- Warning: `#FBBF24`
- Error: `#F87171`

Never use pure black as the main background.

Use accent colors selectively.

---

## Design Rules

Avoid generic AI-generated portfolio styling.

Do NOT overuse:

- gradients
- glowing borders
- neon effects
- glassmorphism
- floating cards
- excessive rounded containers
- excessive shadows
- decorative animations

Prefer:

- strong typography
- whitespace
- subtle borders
- engineering/grid details
- restrained color
- editorial layouts
- meaningful interactions

Not every section needs to be inside a card.

---

## Shell Interface

The portfolio uses a developer workspace/shell concept.

Desktop may include:

- top navigation
- Explorer/sidebar
- main workspace
- project navigation
- status area

The shell should provide personality without making the website difficult for non-technical recruiters to understand.

The top navigation should remain simple and recruiter-friendly.

The Explorer can provide the developer-oriented experience.

---

## Responsive Design

Always consider:

- Desktop
- Tablet
- Mobile

Do not force the desktop IDE/workspace layout onto mobile devices.

On smaller screens:

- collapse or transform the Explorer
- simplify navigation
- preserve content hierarchy
- maintain comfortable touch targets

Never introduce page-level horizontal scrolling.

---

## Motion

Animations should support interaction and hierarchy.

Prefer:

- subtle opacity transitions
- small positional movement
- controlled reveals
- smooth navigation transitions
- restrained staggered entrances

Avoid:

- excessive parallax
- constant floating animation
- large zoom effects
- bouncing UI
- scroll hijacking
- animations that slow navigation

Respect:

`prefers-reduced-motion`

Use consistent animation timing rather than arbitrary durations throughout the project.

---

## 3D Avatar

A future interactive 3D model of Darryll will be integrated into the portfolio.

Keep the architecture ready for components such as:

- `AvatarScene`
- `AvatarModel`
- `AvatarPlaceholder`

The future model may support:

- idle animation
- pointer/head tracking
- drag rotation
- click interaction
- wave animation
- section-aware reactions

Do not implement fake 3D behavior or add unnecessary Three.js dependencies before the actual model is available.

Always consider performance when working with 3D content.

---

## Code Quality

Prefer:

- clear components
- readable TypeScript
- reusable logic
- meaningful names
- simple architecture
- centralized portfolio data where appropriate

Avoid:

- giant components
- unnecessary abstraction
- duplicated data
- duplicated styling
- premature optimization
- over-engineering

Do not rewrite unrelated files when completing a focused task.

Preserve existing working behavior unless the requested change requires modifying it.

---

## Portfolio Data

Where practical, keep content separate from presentation.

Centralize data such as:

- projects
- skills
- certifications
- social links
- navigation items

Do not scatter URLs or repeated portfolio