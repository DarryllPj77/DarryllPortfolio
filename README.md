# Darryll Portfolio

Personal developer portfolio of Darryll J. Pajaganas, a Computer Science student focused on C# / .NET.

Built with React 19, TypeScript, Vite, React Router, Motion and CSS Modules.

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
- `src/data/navigation.ts`: section numbers, top nav, mobile menu and the Explorer file tree.
- `src/components/shell/`: the workspace shell (top nav, Explorer, mobile menu, status bar).
- `src/motion/`: motion tokens (durations, easing), shared variants and `Reveal`/`MaskedText`.
- `src/intro/`: the "Building darryll.dev" intro (once per session, Home only, skippable).
- `src/components/3d/`: the Home hero avatar (`public/models/darryll-avatar.glb`).
  - `AvatarSlot` shows `AvatarFallback` first and layers the lazy-loaded `AvatarScene` (React Three Fiber) on top for capable devices (WebGL2, no data saver, more than 2 GB memory), once the hero is in view and the intro has finished. Any failure leaves the fallback.
  - `AvatarModel` plays the GLB's own `Idle` / `Wave` / `Neutral` clips and layers head tracking and drag rotation on top in one frame loop.
  - `avatarInteraction.ts` holds the interaction states (`dragging` > `waving` > `pointerTracking` > `idle`); `useAvatarInteraction.ts` handles pointer, drag and click input.
  - `avatar.config.ts`: model path, clip and joint names, camera framing per layout.
- Optional case-study fields (`problem`, `features`, `hero`, `chapters`) in `src/data/projects.ts` appear on project pages once filled in. Academic Sentinel's screenshots, captions and grouping are in `src/data/academicSentinelScreenshots.ts`; the files themselves are in `public/image/projects/academic-sentinel/`.
- `src/views/`: one component per page.
- `src/styles/tokens.css`: colours, fonts, spacing.

## Resume

Set `profile.resumeUrl` in `src/data/profile.ts` (e.g. `'/resume.pdf'`) after placing a resume **without a phone number** in `public/`.

## Deployment note

This is a single-page app with client-side routes. The host needs a rewrite from all paths to `/index.html` (Vercel: `vercel.json` rewrites; Render static site: a `/* → /index.html` rewrite rule).
