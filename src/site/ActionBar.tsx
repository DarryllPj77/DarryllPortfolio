import { createPortal } from 'react-dom';
import { contactHref, MAIN_ACTION } from './links';

/**
 * nav.actionbar: the phone's bar at the foot with the main action. It must be a child of <body>
 * (system.css reads `body > nav.actionbar` and moves the nav's button into the phone sheet), so it
 * renders through a portal. system.js shows it once the hero's button has scrolled away.
 */
export function ActionBar() {
  return createPortal(
    <nav className="actionbar" aria-label="Quick actions">
      <a className="btn btn--primary" href={contactHref}>
        {MAIN_ACTION}
      </a>
    </nav>,
    document.body,
  );
}
