import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { OrbitState } from '../gallery/orbit/OrbitState';

// jsdom has no WebGL: say it does, and stand in for the 3D scene with a driver that advances
// the real ring the way the scene's frame loop would.
vi.mock('../gallery/webgl', () => ({ supportsWebGL: () => true }));
vi.mock('../gallery/scene/ExhibitionCanvas', () => ({
  default: function FakeScene({ orbit }: { orbit: OrbitState }) {
    useEffect(() => {
      const id = window.setInterval(() => {
        for (let i = 0; i < 20; i++) orbit.step(1 / 60);
      }, 5);
      return () => window.clearInterval(id);
    }, [orbit]);
    return <div data-testid="scene" />;
  },
}));

const { GalleryApp } = await import('../gallery/GalleryApp');

const placardName = () => screen.getByRole('heading', { level: 2 }).textContent;
const controls = () => screen.getByRole('navigation', { name: 'Exhibition' });

describe('exhibition controls', () => {
  it('starts on Academic Sentinel and announces nothing on arrival', async () => {
    render(<GalleryApp />);
    await screen.findByTestId('scene');
    expect(placardName()).toBe('Academic Sentinel');
    expect(screen.getByText('01 / 03')).toBeInTheDocument();
    expect(document.querySelector('[aria-live]')).toHaveTextContent('');
  });

  it('next and previous turn the ring, name their destinations, and announce the change', async () => {
    const user = userEvent.setup();
    render(<GalleryApp />);
    await screen.findByTestId('scene');
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
