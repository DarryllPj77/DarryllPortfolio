/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { certifications } from '../data/certifications';
import { INTRO_SEEN_KEY } from '../intro/introContext';

const byId = (id: string) => certifications.find((c) => c.id === id)!;

describe('certifications, as stated on their PDFs', () => {
  it('lists all four, newest first', () => {
    expect(certifications.map((c) => c.id)).toEqual(['pmi-pm-ready', 'cisco-ccna-itn', 'its-python', 'its-java']);
    const issued = certifications.map((c) => c.issued);
    expect([...issued].sort().reverse()).toEqual(issued);
  });

  it('matches each certificate exactly', () => {
    expect(byId('pmi-pm-ready')).toMatchObject({
      name: 'PMI Project Management Ready',
      issuer: 'Project Management Institute',
      issued: '2026-03-21',
      expires: '2031-03-21',
      credentialId: 'waSNX-H92N',
    });
    expect(byId('cisco-ccna-itn')).toMatchObject({
      name: 'CCNA: Introduction to Networks',
      kind: 'course',
      issuer: 'Cisco Networking Academy',
      issued: '2025-08-11',
    });
    expect(byId('its-python')).toMatchObject({
      name: 'IT Specialist – Python',
      issued: '2025-07-31',
      expires: '2030-07-31',
      credentialId: 'wM4Xm-H94r',
    });
    expect(byId('its-java')).toMatchObject({
      name: 'IT Specialist – Java',
      issued: '2024-12-02',
      credentialId: '8yBx-uS7m',
    });
  });

  it('never adds an expiry the certificate does not state', () => {
    expect(byId('its-java').expires).toBeUndefined();
    expect(byId('cisco-ccna-itn').expires).toBeUndefined();
  });

  it('shows each certificate from its PNG, at the size stored in the file (its aspect ratio)', () => {
    for (const c of certifications) {
      expect(c.image.src.startsWith('/image/certificate/'), c.id).toBe(true);
      expect(c.image.src.endsWith('.png'), c.id).toBe(true);
      const file = resolve(process.cwd(), 'public', `.${c.image.src}`);
      expect(existsSync(file), file).toBe(true);
      // A PNG stores its width and height at bytes 16 to 23.
      const png = readFileSync(file);
      expect([png.readUInt32BE(16), png.readUInt32BE(20)], c.id).toEqual([c.image.width, c.image.height]);
    }
  });

  it('links every certificate to its own Credly badge', () => {
    expect(Object.fromEntries(certifications.map((c) => [c.id, c.badgeUrl]))).toEqual({
      'cisco-ccna-itn': 'https://www.credly.com/earner/earned/badge/b6b44011-68b9-4b9e-b8b4-02678650ab65',
      'its-java': 'https://www.credly.com/earner/earned/badge/63c72cea-8434-4689-9d53-507262b32788',
      'its-python': 'https://www.credly.com/earner/earned/badge/a5c83f6f-1ff1-4ccd-b3ef-da59ac305f83',
      'pmi-pm-ready': 'https://www.credly.com/earner/earned/badge/a50e81ef-4eeb-4cb9-9889-ce9a11683143',
    });
  });
});

describe('certifications page', () => {
  const renderPage = () => {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    return render(
      <MemoryRouter initialEntries={['/certifications']}>
        <App />
      </MemoryRouter>,
    );
  };
  const card = (name: string) => screen.getByRole('heading', { level: 2, name }).closest('li')!;

  it('opens each certificate inside the portfolio, never in a new tab or as a PDF', async () => {
    const user = userEvent.setup();
    renderPage();
    for (const c of certifications) {
      const view = within(card(c.name)).getByRole('button', { name: /view certificate/i });
      expect(view.tagName).toBe('BUTTON'); // not a link: nothing to navigate to
      await user.click(view);
      const dialog = await screen.findByRole('dialog', { name: `${c.name} certificate` });
      const img = within(dialog).getByRole('img');
      expect(img).toHaveAttribute('src', c.image.src);
      expect(img).toHaveAttribute('width', String(c.image.width));
      expect(img).toHaveAttribute('height', String(c.image.height));
      // Closing is easy, and focus goes back to where it was.
      await user.click(within(dialog).getByRole('button', { name: 'Close certificate viewer' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      await waitFor(() => expect(view).toHaveFocus());
    }
  });

  it('closes the viewer with Escape', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(within(card('IT Specialist – Java')).getByRole('button', { name: /view certificate/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('opens each Credly badge safely in a new tab', () => {
    renderPage();
    for (const c of certifications) {
      const badge = within(card(c.name)).getByRole('link', { name: /view badge/i });
      expect(badge).toHaveAttribute('href', c.badgeUrl);
      expect(badge).toHaveAttribute('target', '_blank');
      expect(badge).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('labels the course as a course, not a certification with a status', () => {
    renderPage();
    const course = card('CCNA: Introduction to Networks');
    expect(within(course).getByText('Course completion')).toBeInTheDocument();
    expect(within(course).queryByText(/^(Active|Expired)$/)).not.toBeInTheDocument();
  });
});
