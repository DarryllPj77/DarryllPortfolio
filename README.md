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
- `src/components/avatar-intro/`: the Home introduction, Real Darryll → 3D Darryll. The real portrait
  (`public/image/darryll/`, resized copies; the original photo is never modified) stands in the avatar's
  spot; "Initialize avatar" runs a scan, splits it into two doors (`clip-path` along one zigzag in
  `portalGeometry.ts`) on a portal in the shell's own style, and the 3D avatar emerges. Timings and phases
  (`portrait → scanning → opening → emerging → ready`) are in `introTimeline.ts`. Every page load
  starts at the portrait and waits for the click; coming back to Home on the same load does not replay it.
  Without WebGL, or if the model fails, the portrait stays.
- `src/components/3d/`: the 3D avatar (`public/models/darryll-avatar.glb`), React Three Fiber.
  - `AvatarSlot` is its spot in the hero (the portrait portal and the mount point).
  - `AvatarModel` plays the GLB's own `Idle` / `Wave` / `Neutral` clips and layers head tracking, travel,
    the companion's gestures and the introduction's entrance on top in one frame loop.
  - `avatarInteraction.ts` holds the interaction states; `avatar.config.ts` the model path, clips, joints
    and camera framing.
- `src/components/companion/`: one canvas for the whole site. `CompanionProvider` owns the avatar's place
  (hero, a section, or free on the page), the introduction's phase, carrying (`useAvatarCarry`: a quick
  click waves, a press and hold picks it up), "Move Darryll" (`DockMenu`) and "Bring the avatar back".
- Optional case-study fields (`problem`, `features`, `hero`, `chapters`) in `src/data/projects.ts` appear on project pages once filled in. Academic Sentinel's screenshots, captions and grouping are in `src/data/academicSentinelScreenshots.ts`; the files themselves are in `public/image/projects/academic-sentinel/`.
- `src/views/`: one component per page.
- `src/styles/tokens.css`: colours, fonts, spacing.

## Resume

Set `profile.resumeUrl` in `src/data/profile.ts` (e.g. `'/resume.pdf'`) after placing a resume **without a phone number** in `public/`.

## Deployment note

This is a single-page app with client-side routes. The host needs a rewrite from all paths to `/index.html` (Vercel: `vercel.json` rewrites; Render static site: a `/* → /index.html` rewrite rule).
