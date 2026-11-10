import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { profile } from '../data/profile';
import { legacyRedirects, loadKit } from '../kit';
import { MAIN_ACTION } from '../site/links';

const renderAt = (path: string) => render(<App path={path} />);

describe('home page', () => {
  it('renders the dealt sections in order, each with one heading', () => {
    const { container } = renderAt('/');
    const ids = [...container.querySelectorAll('main > section')].map((s) => s.id || 'hero');
    expect(ids).toEqual(['hero', 'work', 'projects', 'about', 'skills']);
    expect(screen.getByRole('heading', { level: 1, name: 'C# and .NET developer in Antipolo' })).toBeInTheDocument();
    for (const section of container.querySelectorAll('main > section:not(.hero)')) {
      expect(section.querySelectorAll('h2')).toHaveLength(1);
    }
    expect(container.querySelector('footer.closing#contact')).toBeInTheDocument();
  });

  it('words the main action the same in the nav, the hero, the close and the phone bar', () => {
    renderAt('/');
    const actions = screen.getAllByRole('link', { name: MAIN_ACTION });
    expect(actions).toHaveLength(4);
    expect(document.querySelector('body > nav.actionbar')).toBeInTheDocument();
    for (const a of actions) expect(a.getAttribute('href')).toMatch(new RegExp(`^mailto:${profile.email}`));
  });

  it('keeps every nav word on a section of the page', () => {
    const { container } = renderAt('/');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const words = [...nav.querySelectorAll('.nav__link')].map((a) => a.getAttribute('href'));
    expect(words).toEqual(['#work', '#projects', '#about', '#skills']);
    for (const href of words) expect(container.querySelector(href!)).toBeInTheDocument();
  });

  it('states how each project was built', () => {
    renderAt('/');
    const work = document.getElementById('work')!;
    expect(work).toHaveTextContent('I worked on the UI, UI testing, bug fixing and backend logic.');
    expect(work).toHaveTextContent('AI coding tools wrote other parts');
    expect(document.getElementById('projects')).toHaveTextContent('built with AI tools');
  });

  it('shows skills by level with real icons, and no icon where none exists', () => {
    renderAt('/');
    const skills = document.getElementById('skills')!;
    const chip = (name: string) => within(skills).getByText(name).closest('li')!;
    expect(chip('C#').querySelector('img')?.getAttribute('src')).toBe('/assets/icons/c-sharp.svg');
    expect(chip('WPF').querySelector('img')).toBeNull();
    expect(within(skills).getByRole('list', { name: '.NET fundamentals' })).toBeInTheDocument();
  });

  it('puts the certifications and availability in About, with the avatar fallback', () => {
    renderAt('/');
    const about = document.getElementById('about')!;
    expect(about).toHaveAttribute('data-moment', 'line-carries-colour');
    expect(about).toHaveTextContent('IT Specialist – Python');
    expect(about).toHaveTextContent('PMI Project Management Ready');
    expect(about).toHaveTextContent(profile.internship.availability);
    // jsdom has no WebGL, so the avatar shows its still fallback
    expect(within(about).getByRole('img', { name: /3d avatar/i })).toBeInTheDocument();
  });
});

describe('case study page', () => {
  it('shows each chapter and opens screenshots in the viewer without captions', async () => {
    const user = userEvent.setup();
    renderAt('/projects/academic-sentinel');
    expect(screen.getByRole('heading', { level: 1, name: /Academic Sentinel/ })).toBeInTheDocument();
    for (const name of ['Accounts', 'Teacher workflow', 'Student workflow', 'Violation detection']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
    const teacher = document.getElementById('teacher-workflow')!;
    const opener = within(teacher).getAllByRole('button')[1];
    await user.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Teacher workflow screenshots' });
    expect(dialog).toHaveTextContent('2 of 6');
    expect(dialog.querySelector('figcaption')).toBeNull();
    await user.keyboard('{ArrowRight}');
    expect(dialog).toHaveTextContent('3 of 6');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });

  it('shows a not-found page for paths the site does not have', () => {
    renderAt('/projects/does-not-exist');
    expect(screen.getByRole('heading', { level: 1, name: /not on the portfolio/ })).toBeInTheDocument();
  });
});

describe('kit loading', () => {
  it('adds each kit script once', () => {
    loadKit();
    loadKit();
    const srcs = [...document.querySelectorAll('script[type="module"]')].map((s) => s.getAttribute('src'));
    expect(srcs.filter((s) => s === '/assets/system.js')).toHaveLength(1);
    expect(srcs).toContain('/assets/motion/motion.js');
  });

  it('sends the old routes to the sections that hold their content', () => {
    expect(legacyRedirects['/certifications']).toBe('/#about');
    expect(legacyRedirects['/projects/spendsync']).toBe('/#projects');
  });
});
