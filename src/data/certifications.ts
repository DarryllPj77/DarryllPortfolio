import type { Certification } from './types';

export const certifications: Certification[] = [
  {
    id: 'its-python',
    name: 'IT Specialist – Python',
    fileName: 'Python.cert',
    issuer: 'Certiport, a Pearson VUE business',
    issued: '2025-07',
    expires: '2030-07',
  },
  {
    id: 'pmi-pm-ready',
    name: 'PMI Project Management Ready',
    fileName: 'PMI.cert',
    issuer: 'Project Management Institute',
    issued: '2026-03',
    expires: '2031-03',
  },
];

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatMonth(isoMonth: string): string {
  const [year, month] = isoMonth.split('-').map(Number);
  return monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)));
}

/** A certification is active until the end of its expiry month. */
export function isActive(cert: Certification, now: Date = new Date()): boolean {
  const [year, month] = cert.expires.split('-').map(Number);
  return now < new Date(Date.UTC(year, month, 1));
}
