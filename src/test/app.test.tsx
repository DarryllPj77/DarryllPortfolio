import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { INTRO_SEEN_KEY } from '../intro/introContext';

function renderAt(path = '/', { intro = false } = {}) {
  if (!intro) window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

const mainNav = () => screen.getByRole('navigation', { name: 'Main' });
const explorer = () => screen.getByRole('navigation', { name: 'Workspace files' });

describe('app shell', () => {
  it('renders the hero with the internship availability', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: /hi, i.m darryll/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Internship availability')).toHaveTextContent('520-hour OJT');
    expect(screen.getByRole('img', { name: /3d avatar/i })).toBeInTheDocument();
  });

  it('navigates with the top nav, marks the active item and focuses the heading', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(within(mainNav()).getByRole('link', { name: 'Skills' }));
    const heading = await screen.findByRole('heading', { level: 1, name: 'Skills' });
    expect(heading).toHaveFocus();
    expect(within(mainNav()).getByRole('link', { name: 'Skills' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('opens a project from the Explorer and keeps Projects active in the top nav', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(within(explorer()).getByRole('link', { name: /PreMatchTracker\.jsx/ }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'PreMatch Tracker' }),
    ).toBeInTheDocument();
    expect(within(mainNav()).getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getAllByText('AI-assisted implementation').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /back to projects/i })).toBeInTheDocument();
  });

  it('collapses Explorer folders', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const folder = within(explorer()).getByRole('button', { name: /projects/ });
    expect(folder).toHaveAttribute('aria-expanded', 'true');
    await user.click(folder);
    expect(folder).toHaveAttribute('aria-expanded', 'false');
    expect(within(explorer()).queryByRole('link', { name: /SpendSync\.js/ })).not.toBeInTheDocument();
  });

  it('toggles the Explorer with the rail button and Ctrl+B', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByRole('button', { name: 'Hide explorer' }));
    expect(screen.queryByRole('navigation', { name: 'Workspace files' })).not.toBeInTheDocument();
    await user.keyboard('{Control>}b{/Control}');
    expect(await screen.findByRole('navigation', { name: 'Workspace files' })).toBeInTheDocument();
  });

  it('starts with the Explorer collapsed on narrower desktops', () => {
    window.innerWidth = 1100;
    renderAt('/');
    expect(screen.getByRole('button', { name: 'Show explorer' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Workspace files' })).not.toBeInTheDocument();
  });

  it('opens a case study from the project index', async () => {
    const user = userEvent.setup();
    renderAt('/projects');
    const main = screen.getByRole('main');
    await user.click(within(main).getByRole('link', { name: /academic sentinel/i }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Academic Sentinel' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Architecture' })).toBeInTheDocument();
  });

  it('jumps to a certification from its .cert file', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(within(explorer()).getByRole('link', { name: /PMI\.cert/ }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Certifications' }),
    ).toBeInTheDocument();
    expect(document.getElementById('pmi-pm-ready')).toHaveAttribute('data-targeted');
  });

  it('shows a not-found view for unknown project slugs', () => {
    renderAt('/projects/does-not-exist');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  });

  it('uses a full-screen menu instead of the Explorer on mobile', async () => {
    window.innerWidth = 375;
    const user = userEvent.setup();
    renderAt('/');
    expect(screen.queryByRole('navigation', { name: 'Workspace files' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(within(mainNav()).getByRole('link', { name: /about/i }));

    expect(await screen.findByRole('heading', { level: 1, name: 'About' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument();
  });
});

describe('intro', () => {
  it('plays on the first visit to Home and can be skipped', async () => {
    const user = userEvent.setup();
    renderAt('/', { intro: true });
    const dialog = screen.getByRole('dialog', { name: 'Site intro' });
    const skip = within(dialog).getByRole('button', { name: /skip intro/i });
    expect(skip).toHaveFocus();
    await user.click(skip);
    expect(screen.queryByRole('dialog', { name: 'Site intro' })).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem(INTRO_SEEN_KEY)).toBe('1');
  });

  it('does not replay once seen in this session', () => {
    renderAt('/');
    expect(screen.queryByRole('dialog', { name: 'Site intro' })).not.toBeInTheDocument();
  });
});
