import { profile } from '../data/profile';

/** The main action, worded the same in the nav, the hero and the close (copy.md rule 5). */
export const MAIN_ACTION = 'Contact me';

/** The portfolio has no form service, so the main action opens an email to Darryll. */
export const contactHref = `mailto:${profile.email}?subject=${encodeURIComponent('OJT opening')}`;
