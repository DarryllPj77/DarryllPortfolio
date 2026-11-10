import { profile } from '../data/profile';
import { projects } from '../data/projects';
import { contactHref, MAIN_ACTION } from './links';

/** Section links: anchors on the home page, '/#id' from the case-study page. */
const sectionHref = (home: boolean, id: string) => (home ? `#${id}` : `/#${id}`);

/** One-line descriptions for the Projects menu (five words or so, as the kit's menu asks). */
const menuLines: Record<string, string> = {
  'academic-sentinel': 'Exam monitoring, WPF and ASP.NET Core',
  'prematch-tracker': 'Team practice and attendance',
  spendsync: 'Spending tracker from spreadsheets',
};

function projectHref(slug: string) {
  const project = projects.find((p) => p.slug === slug)!;
  if (project.chapters) return `/projects/${slug}`;
  return (project.links.find((l) => l.kind === 'live') ?? project.links[0]).href;
}

/**
 * header.nav, dealt nav-centre: the words centred, the mark and name on the left line, the main
 * action on the right. system.js turns it into the phone sheet and opens the Projects menu.
 */
export function Nav({ home }: { home: boolean }) {
  return (
    <header className="nav nav--centre">
      <div className="wrap nav__bar">
        <a className="skip-link" href="#top">
          Skip to content
        </a>
        <a className="nav__logo" href={home ? '#top' : '/'}>
          <span className="mark" data-mark="dots" aria-hidden="true"></span>
          {profile.firstName} {profile.fullName.split(' ').at(-1)}
        </a>
        <nav className="nav__links" aria-label="Main">
          <div className="nav__item">
            <a className="nav__link" href={sectionHref(home, 'work')}>
              Work
            </a>
          </div>
          <div className="nav__item">
            <a className="nav__link" href={sectionHref(home, 'projects')}>
              Projects{' '}
              <svg className="chev" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <div className="nav__menu">
              <div className="wrap grid">
                <div className="menu-col span-4">
                  <p className="t-label">Projects</p>
                  {projects.map((p) => (
                    <a key={p.slug} href={projectHref(p.slug)}>
                      {p.name}
                      <span>{menuLines[p.slug]}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="nav__item">
            <a className="nav__link" href={sectionHref(home, 'about')}>
              About
            </a>
          </div>
          <div className="nav__item">
            <a className="nav__link" href={sectionHref(home, 'skills')}>
              Skills
            </a>
          </div>
        </nav>
        <div className="nav__actions">
          <a className="btn btn--primary" href={contactHref}>
            {MAIN_ACTION}
          </a>
        </div>
        <button className="nav__toggle" type="button" aria-expanded="false" aria-label="Menu">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M2 5h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}
