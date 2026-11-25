import { render, screen, within } from '@testing-library/react';
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

/** The line as shown on screen (the bubble or caption). */
const shownLine = () => document.querySelector<HTMLElement>('[data-companion-bubble]')?.textContent ?? null;
/** Waits past the moment a page's line would appear after a page change. */
const pastTheLine = () => new Promise((r) => setTimeout(r, 700));

/*
 * Darryll's lines are said by the 3D avatar, so they only appear while it is on screen to
 * say them (see CompanionProvider's `say`). Here there is no WebGL, so no avatar: no line,
 * on any device, however the visitor navigates or whatever they click.
 */
describe("Darryll's section information without the avatar", () => {
  it('shows nothing on a phone when a section is tapped in the phone menu', async () => {
    window.innerWidth = 375;
    const user = userEvent.setup();
    renderAt('/');
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: /about/i }));
    await pastTheLine();
    expect(shownLine()).toBeNull();
    // Not even for screen readers: the page itself already says where they are.
    expect(screen.queryByText(`Darryll.md: ${companionLines['/about'].text}`)).not.toBeInTheDocument();
  });

  it('shows nothing on desktop from the top navigation', async () => {
    window.innerWidth = 1280;
    const user = userEvent.setup();
    renderAt('/');
    await user.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'About' }));
    await pastTheLine();
    expect(shownLine()).toBeNull();
  });

  it('shows nothing when a hero button is clicked', async () => {
    window.innerWidth = 1280;
    const user = userEvent.setup();
    renderAt('/');
    await user.click(within(screen.getByRole('list', { name: 'Profiles' })).getByRole('link', { name: /github/i }));
    await pastTheLine();
    expect(shownLine()).toBeNull();
  });
});
