import { Link } from 'react-router';
import { Icon } from '../components/ui/Icon';
import { SectionTitle, ViewFrame } from '../components/ui/ViewFrame';
import { certifications } from '../data/certifications';
import { profile } from '../data/profile';
import { Reveal } from '../motion/Reveal';
import styles from './Views.module.css';

export function AboutView() {
  const facts: [string, string][] = [
    ['Degree', profile.degree],
    ['Specialization', profile.specialization],
    ['School', profile.school],
    ['Year', profile.yearLevel],
    ['Focus', profile.focus],
    ['Location', profile.location],
    ['Looking for', `${profile.internship.label}, ${profile.internship.availability}`],
  ];

  return (
    <ViewFrame section="about" title="About">
      <div className={styles.split}>
        <Reveal className={styles.prose}>
          {profile.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Reveal>
        <Reveal as="section" className={styles.aside} aria-labelledby="about-facts">
          <SectionTitle id="about-facts">Quick facts</SectionTitle>
          <dl className={styles.facts}>
            {facts.map(([term, value]) => (
              <div key={term} className={styles.fact}>
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <Link to="/certifications" className={styles.inlineLink}>
            {certifications.length} certifications
            <Icon name="arrow-right" size={14} />
          </Link>
        </Reveal>
      </div>
    </ViewFrame>
  );
}
