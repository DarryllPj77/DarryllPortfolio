import { Link } from 'react-router';
import { AvatarSlot } from '../components/3d/AvatarSlot';
import { FeaturedProject } from '../components/projects/FeaturedProject';
import { ResumeButton } from '../components/shell/ResumeButton';
import { buttonClass } from '../components/ui/buttonClass';
import { ExternalLink } from '../components/ui/ExternalLink';
import { Icon } from '../components/ui/Icon';
import { ViewHeading } from '../components/ui/ViewFrame';
import { profile } from '../data/profile';
import { featuredProject } from '../data/projects';
import { getSocial } from '../data/socials';
import styles from './HomeView.module.css';

export function HomeView() {
  const github = getSocial('github');
  const linkedin = getSocial('linkedin');
  const { internship } = profile;

  return (
    <div className={styles.home}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.intro}>
          <p className={styles.eyebrow}>
            <span className={styles.prompt} aria-hidden="true">
              &gt;
            </span>{' '}
            {profile.headline}
          </p>
          <ViewHeading id="hero-title" className={styles.title}>
            Hi, I&rsquo;m {profile.firstName}.
          </ViewHeading>
          <p className={styles.lead}>
            Computer Science student focused on{' '}
            <strong className={styles.highlight}>C# and .NET</strong> software development.
          </p>
          <p className={styles.body}>{profile.intro}</p>

          <div className={styles.actions}>
            <Link to="/projects" className={buttonClass('primary')}>
              Explore Projects
              <Icon name="arrow-right" size={16} />
            </Link>
            <ResumeButton />
          </div>

          <ul role="list" className={styles.socials} aria-label="Profiles">
            <li>
              <ExternalLink href={github.href} className={styles.social}>
                <Icon name="github" size={16} />
                GitHub
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href={linkedin.href} className={styles.social}>
                <Icon name="linkedin" size={16} />
                LinkedIn
              </ExternalLink>
            </li>
          </ul>

          <aside className={styles.availability} aria-label="Internship availability">
            <span className={styles.statusDot} aria-hidden="true" />
            <div>
              <p className={styles.availabilityTitle}>
                {internship.isOpen ? 'Open to internship' : 'Not currently available'} ·{' '}
                {internship.label}
              </p>
              <p className={styles.availabilityText}>
                Tentative availability: {internship.availability}, subject to academic schedule.
              </p>
            </div>
          </aside>
        </div>

        <div className={styles.avatar}>
          <AvatarSlot />
        </div>
      </section>

      <section className={styles.featured} aria-labelledby="home-featured-title">
        <h2 id="home-featured-title" className="visually-hidden">
          Featured project
        </h2>
        <FeaturedProject project={featuredProject} headingLevel="h3" compact />
      </section>
    </div>
  );
}
