import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { companionLines } from '../data/companion';
import { INTRO_SEEN_KEY } from '../intro/introContext';

function renderAt(path = '/') {
  window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

const aboutLine = companionLines['/about'].text;
/** The line as shown on screen (the bubble or caption), not the screen-reader live region. */
const shownLine = () =>
  document.querySelector<HTMLElement>('[data-companion-bubble]')?.textContent ?? null;

describe("Darryll's section information", () => {
  it('appears on a phone when a section is tapped in the phone menu (no hover, no Explorer)', async () => {
    window.innerWidth = 375;
    const user = userEvent.setup();
    renderAt('/');
    expect(shownLine()).toBeNull(); // nothing on the first load

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const menu = screen.getByRole('navigation', { name: 'Main' });
    await user.click(within(menu).getByRole('link', { name: /about/i }));

    await waitFor(() => expect(shownLine()).toContain(aboutLine), { timeout: 2000 });
    expect(shownLine()).toContain('Darryll.md');
    // Screen readers get it too, through the live region.
    expect(screen.getByText(`Darryll.md: ${aboutLine}`)).toBeInTheDocument();
  });

  it('shows the same line on desktop from the top navigation: one shared section state', async () => {
    window.innerWidth = 1280;
    const user = userEvent.setup();
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    await user.click(within(nav).getByRole('link', { name: 'About' }));
    await waitFor(() => expect(shownLine()).toContain(aboutLine), { timeout: 2000 });
  });

  it('closes with a tap anywhere else, and with its own close control', async () => {
    window.innerWidth = 375;
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: /about/i }));
    await waitFor(() => expect(shownLine()).not.toBeNull(), { timeout: 2000 });

    await user.click(screen.getByRole('heading', { level: 1, name: 'About' }));
    await waitFor(() => expect(shownLine()).toBeNull());

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: /skills/i }));
    await waitFor(() => expect(shownLine()).not.toBeNull(), { timeout: 2000 });
    await user.click(document.querySelector<HTMLElement>('[data-companion-bubble] button')!);
    await waitFor(() => expect(shownLine()).toBeNull());
  });
});
