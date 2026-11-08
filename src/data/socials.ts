import { profile } from './profile';
import type { SocialId, SocialLink } from './types';

export const socials: SocialLink[] = [
  {
    id: 'github',
    label: 'GitHub',
    href: 'https://github.com/DarryllPj77',
    display: 'github.com/DarryllPj77',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/darryll-pajaganas-73489938a',
    display: 'in/darryll-pajaganas',
  },
  {
    id: 'email',
    label: 'Email',
    href: `mailto:${profile.email}`,
    display: profile.email,
  },
];

export function getSocial(id: SocialId): SocialLink {
  const link = socials.find((s) => s.id === id);
  if (!link) throw new Error(`Unknown social link: ${id}`);
  return link;
}
