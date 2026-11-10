# Darryll Portfolio

Personal developer portfolio of Darryll J. Pajaganas, a Computer Science student focused on C# / .NET.

Built with React 19, TypeScript and Vite on the design system of the `design-taste-frontend` skill
(its kit is copied into `public/assets`), with a React Three Fiber avatar.

## Scripts

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and build to dist/
npm run lint     # oxlint
npm test         # vitest
```

## Where things live

- `src/data/`: all content (profile, projects, skills, certifications, social links). Edit text and URLs here.
- `src/site/`: the pages. `HomePage.tsx` is one page of screen-high sections (hero, work, projects, about,
  skills) with the nav (`Nav.tsx`), the closing footer (`Closing.tsx`) and the phone action bar.
  `CaseStudyPage.tsx` is the Academic Sentinel sub-page; `site.css` holds the little page CSS the kit lacks.
- `src/kit.ts`: loads the kit's scripts after React has rendered (nav menus and phone sheet, hover and press
  layer, hero entrance, diagrams, the dealt moment). Pages link to each other with full page loads.
- `public/assets/`: the design-taste-frontend kit (system.css and .js, motion, layout, moments, diagrams)
  and the real tool icons fetched with its `icons.mjs`. Do not edit these files; they are the skill's.
- `.taste-skill/`: the design plan and deal (`plan.md`), the deal history, the finish gate's state and its waivers.
- `src/components/3d/`: the 3D avatar in the About section (`public/models/darryll-avatar.glb`, still
  fallback `darryll-avatar-poster.jpg`).
  - `AvatarSlot` shows `AvatarFallback` first and layers the lazy-loaded `AvatarScene` on top for capable
    devices (WebGL2, no data saver, more than 2 GB memory) once the section is in view. Any failure leaves the fallback.
  - `AvatarModel` plays the GLB's own `Idle` / `Wave` / `Neutral` clips and layers head tracking and drag rotation on top.
  - `avatarInteraction.ts` holds the interaction states (`dragging` > `waving` > `pointerTracking` > `idle`).
  - `avatar.config.ts`: model path, clip and joint names, camera framing per width.
- Academic Sentinel's screenshots and their grouping are in `src/data/academicSentinelScreenshots.ts`; the files
  are in `public/image/projects/academic-sentinel/`.

## Resume

Set `profile.resumeUrl` in `src/data/profile.ts` (e.g. `'/resume.pdf'`) after placing a resume **without a phone number** in `public/`.

## Deployment note

The case study lives at `/projects/academic-sentinel`, a client-side path. The host needs a rewrite from all
paths to `/index.html` (Vercel: `vercel.json` rewrites; Render static site: a `/* → /index.html` rewrite rule).
Old paths (`/about`, `/skills`, ...) redirect to the matching section of the home page.
