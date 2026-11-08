import { SectionTitle, ViewFrame } from '../components/ui/ViewFrame';
import { Badge, Tag, type BadgeTone } from '../components/ui/Tag';
import { skillGroups, skillLevels } from '../data/skills';
import type { SkillLevel } from '../data/types';
import styles from './Views.module.css';

const levelTone: Record<SkillLevel, BadgeTone> = {
  primary: 'accent',
  fundamentals: 'neutral',
  exposure: 'info',
  tooling: 'neutral',
  learning: 'warning',
};

export function SkillsView() {
  return (
    <ViewFrame
      title="Skills"
      path="portfolio/skills"
      description="Grouped by how much I have actually used them. Labels mark where my experience is limited to fundamentals or project exposure."
    >
      <section aria-labelledby="skill-legend" className={styles.legendSection}>
        <SectionTitle id="skill-legend">How to read this</SectionTitle>
        <dl className={styles.legend}>
          {(Object.keys(skillLevels) as SkillLevel[]).map((level) => (
            <div key={level} className={styles.legendItem}>
              <dt>
                <Badge tone={levelTone[level]}>{skillLevels[level].label}</Badge>
              </dt>
              <dd>{skillLevels[level].description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className={styles.skillGrid}>
        {skillGroups.map((group) => {
          const headingId = `skills-${group.id}`;
          return (
            <section
              key={group.id}
              aria-labelledby={headingId}
              className={styles.skillCard}
              data-level={group.level}
            >
              <div className={styles.skillHeader}>
                <h2 id={headingId} className={styles.skillTitle}>
                  {group.title}
                </h2>
                {group.level ? (
                  <Badge tone={levelTone[group.level]}>{skillLevels[group.level].label}</Badge>
                ) : null}
              </div>
              <p className={styles.skillDescription}>{group.description}</p>
              <ul role="list" className={styles.skillItems}>
                {group.items.map((item) => (
                  <li key={item.name}>
                    <Tag qualifier={item.qualifier}>{item.name}</Tag>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </ViewFrame>
  );
}
