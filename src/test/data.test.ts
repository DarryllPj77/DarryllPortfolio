import { describe, expect, it } from 'vitest';
import { certifications, formatMonth, isActive } from '../data/certifications';
import { profile } from '../data/profile';
import { projects } from '../data/projects';
import { skillGroups } from '../data/skills';
import { socials } from '../data/socials';

describe('portfolio data', () => {
  it('has exactly one featured project, and it is Academic Sentinel', () => {
    const featured = projects.filter((p) => p.featured);
    expect(featured).toHaveLength(1);
    expect(featured[0].slug).toBe('academic-sentinel');
  });

  it('uses unique project slugs and valid https links', () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const project of projects) {
      expect(project.links.length).toBeGreaterThan(0);
      for (const link of project.links) expect(link.href).toMatch(/^https:\/\//);
    }
  });

  it('states how every project was built', () => {
    for (const project of projects) {
      expect(project.credit.note.length).toBeGreaterThan(20);
      expect(project.contributions.length).toBeGreaterThan(0);
    }
  });

  it('lists C# as the only primary skill', () => {
    const primary = skillGroups.filter((g) => g.level === 'primary');
    expect(primary).toHaveLength(1);
    expect(primary[0].items.map((i) => i.name)).toEqual(['C#']);
  });

  it('does not publish a phone number anywhere', () => {
    const blob = JSON.stringify({ profile, projects, skillGroups, socials, certifications });
    expect(blob).not.toMatch(/(\+63|\b09\d{2})[\s-]?\d{3}[\s-]?\d{4}/);
    expect(blob).not.toMatch(/tel:/);
  });

  it('formats and evaluates certification dates', () => {
    expect(formatMonth('2025-07')).toBe('July 2025');
    const [python] = certifications;
    expect(isActive(python, new Date('2030-07-31T12:00:00Z'))).toBe(true);
    expect(isActive(python, new Date('2030-08-01T12:00:00Z'))).toBe(false);
  });
});
