import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OrbitState } from '../gallery/orbit/OrbitState';
import type { ShowState } from '../gallery/show/ShowState';

// jsdom has no WebGL: say it does, and stand in for the 3D scene with a driver that advances
// the real ring and the real entrance the way the scene's frame loop would.
vi.mock('../gallery/webgl', () => ({ supportsWebGL: () => true }));
vi.mock('../gallery/scene/ExhibitionCanvas', () => ({
  default: function FakeScene({ orbit, show }: { orbit: OrbitState; show: ShowState }) {
    useEffect(() => {
      const id = window.setInterval(() => {
        for (let i = 0; i < 20; i++) {
          orbit.step(1 / 60);
          show.step(1 / 60);
        }
      }, 5);
      return () => window.clearInterval(id);
    }, [orbit, show]);
    return <div data-testid="scene" />;
  },
}));

const { GalleryApp } = await import('../gallery/GalleryApp');
const { galleryProjects } = await import('../gallery/data');

const placardName = () => screen.getByRole('heading', { level: 2 }).textContent;
const controls = () => screen.getByRole('navigation', { name: 'Exhibition' });

// Each visit starts from a clean address: the Gallery restores the project named in it.
beforeEach(() => window.history.replaceState(null, '', '/gallery'));

describe('exhibition controls', () => {
  it('starts on Academic Sentinel and announces nothing on arrival', async () => {
    render(<GalleryApp />);
    await screen.findByTestId('scene');
    await screen.findByRole('navigation', { name: 'Exhibition' });
    expect(placardName()).toBe('Academic Sentinel');
    expect(screen.getByText('01 / 03')).toBeInTheDocument();
    expect(document.querySelector('[aria-live]')).toHaveTextContent('');
  });

  it('next and previous turn the ring, name their destinations, and announce the change', async () => {
    const user = userEvent.setup();
    render(<GalleryApp />);
    await screen.findByTestId('scene');
    await screen.findByRole('navigation', { name: 'Exhibition' });
    const next = within(controls()).getByRole('button', { name: 'Next project: PreMatch Tracker' });
    await user.click(next);
    await waitFor(() => expect(placardName()).toBe('PreMatch Tracker'));
    expect(document.querySelector('[aria-live]')).toHaveTextContent('02 of 03, PreMatch Tracker');
    // The labels follow: from PreMatch, previous is Academic Sentinel and next is SpendSync.
    expect(within(controls()).getByRole('button', { name: 'Previous project: Academic Sentinel' })).toBeInTheDocument();
    await user.click(within(controls()).getByRole('button', { name: 'Next project: SpendSync' }));
    await waitFor(() => expect(placardName()).toBe('SpendSync'));
  });

  it('chooses a project directly, marking it as pressed', async () => {
    const user = userEvent.setup();
    render(<GalleryApp />);
    await screen.findByTestId('scene');
    await screen.findByRole('navigation', { name: 'Exhibition' });
    const picker = within(controls()).getByRole('group', { name: 'Choose a project' });
    await user.click(within(picker).getByRole('button', { name: '03 / 03, SpendSync' }));
    await waitFor(() => expect(placardName()).toBe('SpendSync'));
    expect(within(picker).getByRole('button', { name: '03 / 03, SpendSync' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(picker).getByRole('button', { name: '01 / 03, Academic Sentinel' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('turns with the arrow keys from anywhere, wrapping round, and jumps with Home and End', async () => {
    const user = userEvent.setup();
    render(<GalleryApp />);
    await screen.findByTestId('scene');
    await screen.findByRole('navigation', { name: 'Exhibition' });
    await user.keyboard('{ArrowLeft}');
    await waitFor(() => expect(placardName()).toBe('SpendSync')); // left of the first is the last
    await user.keyboard('{Home}');
    await waitFor(() => expect(placardName()).toBe('Academic Sentinel'));
    await user.keyboard('{End}');
    await waitFor(() => expect(placardName()).toBe('SpendSync'));
  });

  it('shows the front project’s own links only', async () => {
    const user = userEvent.setup();
    render(<GalleryApp />);
    await screen.findByTestId('scene');
    await screen.findByRole('navigation', { name: 'Exhibition' });
    const placard = () => screen.getByRole('heading', { level: 2 }).closest('section')!;
    expect(within(placard()).queryByRole('link', { name: /live demo/i })).not.toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(placardName()).toBe('PreMatch Tracker'));
    expect(within(placard()).getByRole('link', { name: /live demo/i })).toHaveAttribute(
      'href',
      'https://prematch-tracker.onrender.com/',
    );
  });
});

describe('opening a project', () => {
  const ready = async () => {
    render(<GalleryApp />);
    await screen.findByRole('navigation', { name: 'Exhibition' });
  };

  it('opens the front project as a dialog, focused on its name, with its screens and links', async () => {
    const user = userEvent.setup();
    await ready();
    await user.click(screen.getByRole('button', { name: 'View project: Academic Sentinel' }));
    const dialog = await screen.findByRole('dialog', { name: 'Academic Sentinel' }, { timeout: 3000 });
    expect(within(dialog).getByRole('heading', { level: 2, name: 'Academic Sentinel' })).toHaveFocus();
    expect(window.location.hash).toBe('#academic-sentinel/open');
    // Every screen, each described, and only the project's own links plus its case study.
    const project = galleryProjects[0];
    for (const shot of [project.cover, ...project.screens]) {
      expect(within(dialog).getByRole('img', { name: shot.alt })).toHaveAttribute('src', shot.src);
    }
    expect(within(dialog).getByRole('link', { name: /case study/i })).toHaveAttribute('href', '/projects/academic-sentinel');
    // How it was built, stated as the portfolio states it.
    expect(dialog).toHaveTextContent(project.project.credit.label);
    // The exhibition behind it can't be reached.
    expect(screen.queryByRole('navigation', { name: 'Exhibition' })).not.toBeInTheDocument();
  });

  it('closes with Escape, back to the same project, focus on the way in', async () => {
    const user = userEvent.setup();
    await ready();
    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(placardName()).toBe('PreMatch Tracker'));
    await user.click(screen.getByRole('button', { name: 'View project: PreMatch Tracker' }));
    await screen.findByRole('dialog', { name: 'PreMatch Tracker' }, { timeout: 3000 });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), { timeout: 3000 });
    await waitFor(() => expect(screen.getByRole('button', { name: 'View project: PreMatch Tracker' })).toHaveFocus(), {
      timeout: 3000,
    });
    expect(window.location.hash).toBe('#prematch-tracker');
  });

  it('closes from the bar’s “Exhibition” button too', async () => {
    const user = userEvent.setup();
    await ready();
    await user.click(screen.getByRole('button', { name: 'View project: Academic Sentinel' }));
    await screen.findByRole('dialog', {}, { timeout: 3000 });
    await user.click(screen.getByRole('button', { name: 'Exhibition' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), { timeout: 3000 });
  });

  it('opens straight onto a project from its own link', async () => {
    window.history.replaceState(null, '', '/gallery#spendsync/open');
    render(<GalleryApp />);
    expect(await screen.findByRole('dialog', { name: 'SpendSync' })).toBeInTheDocument();
  });
});

