/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { exhibits, screensOf } from '../data/gallery';
import { mobileNav, primaryNav } from '../data/navigation';
import { INTRO_SEEN_KEY } from '../intro/introContext';

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

describe('gallery data', () => {
  it('shows the three projects, Academic Sentinel first and as the main exhibit', () => {
    expect(exhibits.map((e) => e.project.slug)).toEqual(['academic-sentinel', 'prematch-tracker', 'spendsync']);
    expect(exhibits.filter((e) => e.main).map((e) => e.project.slug)).toEqual(['academic-sentinel']);
  });

  it('uses only real screenshot files, at their stored size', () => {
    for (const shot of exhibits.flatMap(screensOf)) {
      const file = resolve(process.cwd(), 'public', `.${shot.src}`);
      expect(existsSync(file), file).toBe(true);
      expect(imageSize(readFileSync(file)), shot.src).toEqual({ width: shot.width, height: shot.height });
      expect(shot.alt.length, shot.src).toBeGreaterThan(40);
    }
  });

  it('opens PreMatch and SpendSync case studies on the same screen as their cover', () => {
    for (const e of exhibits.filter((x) => !x.main)) expect(e.cover).toBe(e.project.hero);
  });

  it('leaves out screens showing a third party’s details or game footage', () => {
    const srcs = exhibits.flatMap(screensOf).map((s) => s.src);
    expect(srcs.some((s) => /teacher-|violation-report-export|evidence-review/.test(s))).toBe(false);
  });

  it('is in the top navigation and the mobile menu, after Projects', () => {
    expect(primaryNav.indexOf('gallery')).toBe(primaryNav.indexOf('projects') + 1);
    expect(mobileNav.indexOf('gallery')).toBe(mobileNav.indexOf('projects') + 1);
  });
});

describe('gallery page', () => {
  const renderAt = (path: string) => {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    return render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
  };
  const exhibit = (name: string) => screen.getByRole('heading', { level: 2, name }).closest('li')!;

  it('is reached from the top navigation', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'Gallery' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Gallery' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Academic Sentinel',
      'PreMatch Tracker',
      'SpendSync',
    ]);
  });

  it('describes each screen for screen readers, with no captions on the wall', () => {
    renderAt('/gallery');
    for (const e of exhibits) {
      expect(within(exhibit(e.project.name)).getByRole('img', { name: e.cover.alt })).toBeInTheDocument();
      expect(within(exhibit(e.project.name)).queryByText(e.cover.caption)).not.toBeInTheDocument();
    }
  });

  it('steps Academic Sentinel through its screens only when asked', async () => {
    const user = userEvent.setup();
    renderAt('/gallery');
    const main = exhibit('Academic Sentinel');
    const ticks = within(main).getAllByRole('button', { name: /^screen \d of \d/i });
    expect(ticks).toHaveLength(3);
    expect(ticks[0]).toHaveAttribute('aria-pressed', 'true');
    await user.click(ticks[1]);
    expect(ticks[1]).toHaveAttribute('aria-pressed', 'true');
    expect(within(main).getByRole('img', { name: exhibits[0].more[0].alt })).toBeInTheDocument();
    // The other exhibits have no screen controls.
    expect(within(exhibit('SpendSync')).queryAllByRole('button', { name: /^screen/i })).toHaveLength(0);
  });

  it('opens an exhibit’s screens full size in the viewer', async () => {
    const user = userEvent.setup();
    renderAt('/gallery');
    await user.click(within(exhibit('PreMatch Tracker')).getByRole('button', { name: /full size/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('img')).toHaveAttribute('src', exhibits[1].cover.src);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('leads each exhibit to its case study', async () => {
    const user = userEvent.setup();
    renderAt('/gallery');
    await user.click(within(exhibit('SpendSync')).getByRole('link', { name: /view case study/i }));
    expect(await screen.findByRole('heading', { level: 1, name: 'SpendSync' })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: exhibits[2].cover.alt }).length).toBeGreaterThan(0);
  });
});
