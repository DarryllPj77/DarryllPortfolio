/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { companionLines } from '../data/companion';
import { galleryLink, mobileNav, primaryNav, sections } from '../data/navigation';
import { GalleryApp } from '../gallery/GalleryApp';
import { collections, exhibitsIn } from '../gallery/collections';
import { exhibits } from '../gallery/data';
import { INTRO_SEEN_KEY } from '../intro/introContext';

const root = process.cwd();

/** Width and height stored in a PNG's header or a JPEG's start-of-frame marker. */
function imageSize(bytes: Buffer) {
  if (bytes.readUInt32BE(0) === 0x89504e47) return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  let i = 2;
  while (i < bytes.length) {
    const marker = bytes[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7) };
    }
    i += 2 + bytes.readUInt16BE(i + 2);
  }
  throw new Error('No image size found');
}

describe('gallery exhibits', () => {
  const shots = exhibits.flatMap((g) => [g.cover, ...g.screens]);

  it('are the three projects, Academic Sentinel first', () => {
    expect(exhibits.map((g) => g.slug)).toEqual(['academic-sentinel', 'prematch-tracker', 'spendsync']);
  });

  it('use only real screenshot files, at their stored size, each once', () => {
    for (const shot of shots) {
      const file = resolve(root, 'public', `.${shot.src}`);
      expect(existsSync(file), file).toBe(true);
      expect(imageSize(readFileSync(file)), shot.src).toEqual({ width: shot.width, height: shot.height });
      expect(shot.alt.length, shot.src).toBeGreaterThan(40);
    }
    expect(new Set(shots.map((s) => s.src)).size).toBe(shots.length);
  });

  it('leave out screens with a third party’s details or mostly game footage', () => {
    expect(shots.some((s) => /teacher-|violation-report-export|evidence-review/.test(s.src))).toBe(false);
  });

  it('name at most four technologies, each from the project’s own stack', () => {
    for (const g of exhibits) {
      expect(g.stack.length, g.slug).toBeLessThanOrEqual(4);
      for (const tech of g.stack) expect(g.project.stack, g.slug).toContain(tech);
    }
  });
});

describe('gallery as a separate page', () => {
  it('has its own HTML entry, built alongside the portfolio and served at /gallery', () => {
    expect(readFileSync(resolve(root, 'gallery.html'), 'utf8')).toContain('/src/gallery/main.tsx');
    expect(readFileSync(resolve(root, 'vite.config.ts'), 'utf8')).toContain("gallery.html'");
    const { rewrites } = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8')) as {
      rewrites: { source: string; destination: string }[];
    };
    // The Gallery rule must come before the portfolio's catch-all.
    expect(rewrites[0]).toEqual({ source: '/gallery', destination: '/gallery.html' });
    expect(rewrites.at(-1)?.destination).toBe('/index.html');
  });

  it('is not a section of the portfolio', () => {
    expect(Object.keys(sections)).not.toContain('gallery');
    expect(primaryNav.indexOf('gallery')).toBe(primaryNav.indexOf('projects') + 1);
    expect(mobileNav.indexOf('gallery')).toBe(mobileNav.indexOf('projects') + 1);
    expect(companionLines[galleryLink.companion]?.text).toMatch(/new tab/);
  });

  it('opens from the top nav and the Explorer in a new tab', () => {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    const links = [
      within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: /gallery/i }),
      within(screen.getByRole('navigation', { name: 'Workspace files' })).getByRole('link', { name: /gallery/i }),
    ];
    for (const link of links) {
      expect(link).toHaveAttribute('href', '/gallery');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAccessibleName(/opens in a new tab/i);
    }
  });
});

describe('gallery collections', () => {
  it('show one collection for now, the three best projects in order', () => {
    expect(collections.map((c) => c.id)).toEqual(['3-best-projects']);
    expect(exhibitsIn(collections[0]).map((e) => e.slug)).toEqual(['academic-sentinel', 'prematch-tracker', 'spendsync']);
    expect(collections[0].presentation).toBe('vertical-wheel');
  });

  it('only list projects that have an exhibit, each once', () => {
    for (const c of collections) {
      expect(new Set(c.projectIds).size, c.id).toBe(c.projectIds.length);
      expect(() => exhibitsIn(c), c.id).not.toThrow();
    }
  });
});

describe('gallery page without WebGL', () => {
  it('shows each collection, then each project with its number, name and links, and a way back to the portfolio', () => {
    render(<GalleryApp />);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['3 Best Projects']);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Academic Sentinel',
      'PreMatch Tracker',
      'SpendSync',
    ]);
    for (const [i, g] of exhibitsIn(collections[0]).entries()) {
      const item = screen.getByRole('heading', { level: 3, name: g.project.name }).closest('li')!;
      expect(within(item).getByText(`0${i + 1} / 03`)).toBeInTheDocument();
      expect(within(item).getByRole('img', { name: g.cover.alt })).toHaveAttribute('src', g.cover.src);
      expect(within(item).getAllByRole('link')).toHaveLength(g.links.length);
    }
    expect(screen.getByRole('link', { name: /darryllportfolio/i })).toHaveAttribute('href', '/');
    // No portfolio shell here.
    expect(screen.queryByRole('navigation', { name: 'Workspace files' })).not.toBeInTheDocument();
  });
});
