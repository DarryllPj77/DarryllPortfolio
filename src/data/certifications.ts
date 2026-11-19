import type { Certification } from './types';

/** Certificate images live in public/image/certificate/. */
const image = (file: string, width: number, height: number) => ({
  src: `/image/certificate/${file}`,
  width,
  height,
});

/**
 * Every certificate, newest first. Each entry is taken from the certificate itself: the
 * exact title, issuer, award date, the verification code printed on it, and an expiry only
 * where the certificate states one ("Certificate expires 5 years after date of issue").
 * Nothing is added that the document does not say. `image` is the certificate shown in the
 * portfolio's own viewer; `badgeUrl` is its badge on Credly.
 */
export const certifications: Certification[] = [
  {
    id: 'pmi-pm-ready',
    name: 'PMI Project Management Ready',
    kind: 'certification',
    fileName: 'PMI.cert',
    issuer: 'Project Management Institute',
    issued: '2026-03-21',
    // "Certificate expires 5 years after date of issue".
    expires: '2031-03-21',
    credentialId: 'waSNX-H92N',
    verifyAt: 'verify.certiport.com',
    image: image('pmi_cert.png', 1060, 823),
    badgeUrl: 'https://www.credly.com/earner/earned/badge/a50e81ef-4eeb-4cb9-9889-ce9a11683143',
  },
  {
    id: 'cisco-ccna-itn',
    // A course completion, not the CCNA certification: named exactly as the certificate does.
    name: 'CCNA: Introduction to Networks',
    kind: 'course',
    fileName: 'Networking.cert',
    issuer: 'Cisco Networking Academy',
    issued: '2025-08-11',
    image: image('intro_networing_cert.png', 1058, 820),
    badgeUrl: 'https://www.credly.com/earner/earned/badge/b6b44011-68b9-4b9e-b8b4-02678650ab65',
  },
  {
    id: 'its-python',
    name: 'IT Specialist – Python',
    kind: 'certification',
    fileName: 'Python.cert',
    issuer: 'Certiport, a Pearson VUE business',
    issued: '2025-07-31',
    // "Certificate expires 5 years after date of issue".
    expires: '2030-07-31',
    credentialId: 'wM4Xm-H94r',
    verifyAt: 'verify.certiport.com',
    image: image('python_cert.png', 1057, 821),
    badgeUrl: 'https://www.credly.com/earner/earned/badge/a5c83f6f-1ff1-4ccd-b3ef-da59ac305f83',
  },
  {
    id: 'its-java',
    name: 'IT Specialist – Java',
    kind: 'certification',
    fileName: 'Java.cert',
    issuer: 'Certiport, a Pearson VUE business',
    issued: '2024-12-02',
    credentialId: '8yBx-uS7m',
    verifyAt: 'verify.certiport.com',
    image: image('java_cert.png', 1058, 816),
    badgeUrl: 'https://www.credly.com/earner/earned/badge/63c72cea-8434-4689-9d53-507262b32788',
  },
];

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "2025-07-31" → "July 31, 2025". */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return dateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}

/**
 * Whether a certificate with a stated expiry is still current (it is valid through its
 * expiry date). Certificates whose document states no expiry return null: no status is shown.
 */
export function isActive(cert: Certification, now: Date = new Date()): boolean | null {
  if (!cert.expires) return null;
  const [year, month, day] = cert.expires.split('-').map(Number);
  return now < new Date(Date.UTC(year, month - 1, day + 1));
}
