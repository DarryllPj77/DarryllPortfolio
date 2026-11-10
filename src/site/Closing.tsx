import { profile } from '../data/profile';
import { projects } from '../data/projects';
import { getSocial } from '../data/socials';
import { Arrow } from './Arrow';
import { contactHref, MAIN_ACTION } from './links';

/* One-colour marks for the footer's social links (icons.mjs get si:github linkedin --mono). */
const GITHUB_PATH =
  'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12';
const LINKEDIN_PATH =
  'M218.123 218.127h-37.931v-59.403c0-14.165-.253-32.4-19.728-32.4-19.756 0-22.779 15.434-22.779 31.369v60.43H99.754V95.967h36.414v16.694h.51a39.91 39.91 0 0 1 35.928-19.733c38.445 0 45.533 25.288 45.533 58.186l-.016 67.013ZM56.955 79.27a22.017 22.017 0 1 1-.008-44.034 22.017 22.017 0 0 1 .008 44.034m18.966 138.858H37.95V95.967h37.97v122.16ZM237.033.018H18.89C8.58-.098.125 8.161-.001 18.471V237.53c.122 10.315 8.576 18.582 18.89 18.474h218.144c10.336.128 18.823-8.139 18.966-18.474V18.455C255.856 8.124 247.368-.134 237.033.001';

function linkHref(slug: string) {
  const project = projects.find((p) => p.slug === slug)!;
  if (project.chapters) return `/projects/${slug}`;
  return (project.links.find((l) => l.kind === 'live') ?? project.links[0]).href;
}

/**
 * footer.closing: the dealt close-type (the h2, one line, the big button across the wrap) and the
 * dealt footer-dark (the name large, the link columns, the legal row) in one last screen.
 */
export function Closing({ home }: { home: boolean }) {
  const github = getSocial('github');
  const linkedin = getSocial('linkedin');
  const section = (id: string) => (home ? `#${id}` : `/#${id}`);

  return (
    <footer className="footer closing footer--dark ground-inverse g2m" id="contact" aria-labelledby="close-h">
      <div className="wrap">
        <div className="closing__cta close--type">
          <div className="section-head">
            <h2 id="close-h">Talk to me about your OJT opening</h2>
            <p className="t-small muted">
              Available {profile.internship.availability} for {profile.internship.hours} hours.
            </p>
          </div>
          <a className="btn btn--primary btn--xl btn--wide" href={contactHref}>
            {MAIN_ACTION}
            <Arrow />
          </a>
        </div>
        <div className="closing__links">
          <div className="grid">
            <div className="span-4 stack-4">
              <a className="nav__logo" href={home ? '#top' : '/'}>
                <span className="mark" data-mark="dots" aria-hidden="true"></span>
                {profile.firstName} {profile.fullName.split(' ').at(-1)}
              </a>
              <p className="footer__lede">
                Computer Science student at {profile.school}, building with C# and .NET.
              </p>
              <p>
                <a className="link" href={contactHref}>
                  {profile.email}
                </a>
              </p>
            </div>
            <div className="span-2 footer__col">
              <h3>Portfolio</h3>
              <ul>
                <li><a href={section('work')}>Work</a></li>
                <li><a href={section('projects')}>Projects</a></li>
                <li><a href={section('about')}>About</a></li>
                <li><a href={section('skills')}>Skills</a></li>
              </ul>
            </div>
            <div className="span-2 footer__col">
              <h3>Projects</h3>
              <ul>
                {projects.map((p) => (
                  <li key={p.slug}>
                    <a href={linkHref(p.slug)}>{p.name}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="span-2 footer__col">
              <h3>Profiles</h3>
              <ul>
                <li><a href={github.href}>GitHub</a></li>
                <li><a href={linkedin.href}>LinkedIn</a></li>
              </ul>
            </div>
            <div className="span-2 footer__col">
              <h3>Contact</h3>
              <ul>
                <li><a href={contactHref}>Email</a></li>
              </ul>
            </div>
          </div>
          <div className="footer__legal">
            <span>
              &copy; 2026 {profile.fullName}. Product names and logos are trademarks of their owners.
            </span>
            <div className="socials">
              <a href={github.href} aria-label="GitHub">
                <svg className="ic ic-svg ic-24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={GITHUB_PATH} /></svg>
              </a>
              <a href={linkedin.href} aria-label="LinkedIn">
                <svg className="ic ic-svg ic-24" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d={LINKEDIN_PATH} /></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
