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
- `src/components/3d/`: avatar slot, placeholder, `AvatarScene` and `AvatarModel` stubs, and the planned per-section reactions. Switch `avatarConfig.mode` to `'scene'` once the model exists.
- Optional case-study fields (`problem`, `features`, `hero`, `chapters`) in `src/data/projects.ts` appear on project pages once filled in. Academic Sentinel's screenshots, captions and grouping are in `src/data/academicSentinelScreenshots.ts`; the files themselves are in `public/image/projects/academic-sentinel/`.
- `src/views/`: one component per page.
- `src/styles/tokens.css`: colours, fonts, spacing.

## Resume

Set `profile.resumeUrl` in `src/data/profile.ts` (e.g. `'/resume.pdf'`) after placing a resume **without a phone number** in `public/`.

## Deployment note

This is a single-page app with client-side routes. The host needs a rewrite from all paths to `/index.html` (Vercel: `vercel.json` rewrites; Render static site: a `/* → /index.html` rewrite rule).
