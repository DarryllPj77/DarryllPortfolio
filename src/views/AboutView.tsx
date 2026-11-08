import { SectionTitle, ViewFrame } from '../components/ui/ViewFrame';
import { profile } from '../data/profile';
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
    <ViewFrame title="About" path="portfolio/about">
      <div className={styles.split}>
        <div className={styles.prose}>
          {profile.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <section className={styles.panel} aria-labelledby="about-facts">
          <SectionTitle id="about-facts">Quick facts</SectionTitle>
          <dl className={styles.facts}>
            {facts.map(([term, value]) => (
              <div key={term} className={styles.fact}>
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </ViewFrame>
  );
}
