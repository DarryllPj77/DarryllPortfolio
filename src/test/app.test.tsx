import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import App from '../App';

function renderAt(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('app shell', () => {
  it('renders the hero with the internship availability', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: /hi, i.m darryll/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Internship availability')).toHaveTextContent('520-hour OJT');
    expect(screen.getByRole('img', { name: /3d avatar/i })).toBeInTheDocument();
  });

  it('navigates through the Explorer and marks the active item', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const explorer = screen.getByRole('navigation', { name: 'Portfolio sections' });

    await user.click(within(explorer).getByRole('link', { name: 'Skills' }));
    const heading = await screen.findByRole('heading', { level: 1, name: 'Skills' });
    expect(heading).toHaveFocus();
    expect(within(explorer).getByRole('link', { name: 'Skills' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await user.click(within(explorer).getByRole('link', { name: 'PreMatch Tracker' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'PreMatch Tracker' }),
    ).toBeInTheDocument();
    expect(screen.getByText('AI-assisted implementation')).toBeInTheDocument();
  });

  it('opens views as tabs and closes them', async () => {
    const user = userEvent.setup();
    renderAt('/about');
    const explorer = screen.getByRole('navigation', { name: 'Portfolio sections' });
    await user.click(within(explorer).getByRole('link', { name: 'Contact' }));
    await screen.findByRole('heading', { level: 1, name: 'Contact' });

    const tabs = screen.getByRole('navigation', { name: 'Open views' });
    expect(within(tabs).getAllByRole('link')).toHaveLength(2);

    await user.click(within(tabs).getByRole('button', { name: 'Close Contact' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'About' })).toBeInTheDocument();
    expect(within(tabs).getAllByRole('link')).toHaveLength(1);
  });

  it('collapses the Explorer with the rail button and Ctrl+B', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const toggle = screen.getByRole('button', { name: 'Hide explorer' });
    await user.click(toggle);
    expect(screen.queryByRole('navigation', { name: 'Portfolio sections' })).not.toBeInTheDocument();

    await user.keyboard('{Control>}b{/Control}');
    expect(
      await screen.findByRole('navigation', { name: 'Portfolio sections' }),
    ).toBeInTheDocument();
  });

  it('expands a project card quick look', async () => {
    const user = userEvent.setup();
    renderAt('/projects');
    const button = screen.getByRole('button', { name: /quick look\s*for spendsync/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('list', { name: 'SpendSync tech stack' })).toBeInTheDocument();
  });

  it('shows a not-found view for unknown project slugs', () => {
    renderAt('/projects/does-not-exist');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  });

  it('uses a drawer on mobile', async () => {
    window.innerWidth = 375;
    const user = userEvent.setup();
    renderAt('/');
    expect(screen.queryByRole('navigation', { name: 'Portfolio sections' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    const explorer = screen.getByRole('navigation', { name: 'Portfolio sections' });
    await user.click(within(explorer).getByRole('link', { name: 'About' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'About' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Portfolio sections' })).not.toBeInTheDocument();
  });
});
