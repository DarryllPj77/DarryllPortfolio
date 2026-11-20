/// <reference types="node" />
import { execSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { certifications } from '../data/certifications';
import { projects } from '../data/projects';
import { galleryProjects } from '../gallery/data';

/**
 * Vercel builds from the repository, so an image that exists on this machine but was never
 * committed works locally and is missing on the live site (where the Gallery's 3D scene then
 * failed to load). Every image the site uses must be tracked by git.
 */
function trackedFiles(): Set<string> | null {
  try {
    return new Set(execSync('git ls-files public', { encoding: 'utf8' }).split('\n').filter(Boolean));
  } catch {
    return null; // not a git checkout: nothing to compare against
  }
}

const used = [
  ...galleryProjects.flatMap((g) => [g.cover, ...g.screens]).map((s) => s.src),
  ...projects.flatMap((p) => [
    ...(p.hero ? [p.hero.src] : []),
    ...(p.chapters ?? []).flatMap((c) => c.blocks.flatMap((b) => b.shots.map((s) => s.src))),
  ]),
  ...certifications.map((c) => c.image.src),
];

describe('images on the live site', () => {
  const tracked = trackedFiles();

  it.skipIf(!tracked)('are all committed, so Vercel has them', () => {
    const missing = [...new Set(used)].filter((src) => !tracked!.has(`public${src}`));
    expect(missing, 'Images used by the site but not tracked by git (git add them)').toEqual([]);
  });
});
