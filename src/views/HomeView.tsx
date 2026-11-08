import { Link } from 'react-router';
import { AvatarSlot } from '../components/3d/AvatarSlot';
import { ProjectIndex } from '../components/projects/ProjectIndex';
import { ResumeButton } from '../components/shell/ResumeButton';
import { buttonClass } from '../components/ui/buttonClass';
import { ExternalLink } from '../components/ui/ExternalLink';
import { GridDivider, GridFrame, SectionLabel } from '../components/ui/Grid';
import { Icon } from '../components/ui/Icon';
import { ViewHeading } from '../components/ui/ViewFrame';
import { sections } from '../data/navigation';
import { profile } from '../data/profile';
import { getSocial } from '../data/socials';
import { MaskedText, Reveal } from '../motion/Reveal';
import styles from './HomeView.module.css';

export function HomeView() {
  const github = getSocial('github');
  const linkedin = getSocial('linkedin');
  const { internship } = profile;

  return (
    <GridFrame>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.intro}>
          <Reveal>
            <SectionLabel index={sections.home.index} label={sections.home.marker} meta="~/README.md" />
          </Reveal>
          <ViewHeading id="hero-title" className={styles.title}>
            <MaskedText>Hi, I&rsquo;m {profile.firstName}.</MaskedText>
          </ViewHeading>
          <Reveal as="p" className={styles.lead}>
            Computer Science student focused on{' '}
            <strong className={styles.highlight}>C# and .NET</strong> software development.
          </Reveal>
          <Reveal as="p" className={styles.body}>
            {profile.intro}
          </Reveal>

          <Reveal className={styles.actions}>
            <Link to="/projects" className={buttonClass('primary')}>
              Explore Projects
              <Icon name="arrow-right" size={16} />
            </Link>
            <ResumeButton />
          </Reveal>

          <Reveal className={styles.meta}>
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
              <p>
                <strong>
                  {internship.isOpen ? 'Open to internship' : 'Not currently available'} ·{' '}
                  {internship.label}
                </strong>
                <span>
                  Tentative availability: {internship.availability}, subject to academic schedule.
                </span>
              </p>
            </aside>
          </Reveal>
        </div>

        <Reveal className={styles.avatar}>
          <AvatarSlot />
        </Reveal>
      </section>

      <GridDivider />

      <section aria-labelledby="home-work">
        <Reveal trigger="scroll" className={styles.sectionHead}>
          <SectionLabel index={sections.projects.index} label="Selected work" meta="~/projects/" />
          <h2 id="home-work" className={styles.sectionTitle}>
            Selected work
          </h2>
        </Reveal>
        <ProjectIndex headingLevel="h3" trigger="scroll" />
      </section>

      <GridDivider />

      <Reveal as="section" trigger="scroll" className={styles.cta} aria-labelledby="home-contact">
        <SectionLabel index={sections.contact.index} label={sections.contact.marker} meta="~/contact.me" />
        <h2 id="home-contact" className={styles.sectionTitle}>
          Looking for a .NET intern?
        </h2>
        <p className={styles.body}>
          I&rsquo;m available for a {internship.label} starting {internship.availability}. Email
          is the quickest way to reach me.
        </p>
        <div className={styles.actions}>
          <Link to="/contact" className={buttonClass('primary')}>
            Get in touch
            <Icon name="arrow-right" size={16} />
          </Link>
          <a href={`mailto:${profile.email}`} className={buttonClass('ghost')}>
            <Icon name="mail" size={16} />
            {profile.email}
          </a>
        </div>
      </Reveal>
    </GridFrame>
  );
}
