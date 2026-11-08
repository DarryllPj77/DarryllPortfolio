import { Link } from 'react-router';
import { projectNumber, projects } from '../../data/projects';
import { Reveal } from '../../motion/Reveal';
import { Icon } from '../ui/Icon';
import { ArchitectureFlow, CreditBadge } from './ProjectParts';
import styles from './Projects.module.css';

interface ProjectIndexProps {
  headingLevel?: 'h2' | 'h3';
  /** `scroll` when the list sits further down a page (e.g. Home). */
  trigger?: 'page' | 'scroll';
}

/** Numbered list of case studies. The featured project gets a larger row. */
export function ProjectIndex({ headingLevel = 'h2', trigger = 'page' }: ProjectIndexProps) {
  const Heading = headingLevel;
  return (
    <ol role="list" className={styles.index}>
      {projects.map((project) => (
        <Reveal
          as="li"
          key={project.slug}
          trigger={trigger}
          className={styles.row}
          data-featured={project.featured ? '' : undefined}
        >
          <Link to={`/projects/${project.slug}`} className={styles.rowLink}>
            <span className={styles.rowNumber} aria-hidden="true">
              {projectNumber(project.slug)}
            </span>
            <span className={styles.rowMain}>
              <span className={styles.rowMeta}>
                {project.featured ? <span className={styles.featuredTag}>Featured</span> : null}
                <span>{project.category}</span>
                <span aria-hidden="true">·</span>
                <span>{project.period}</span>
              </span>
              <Heading className={styles.rowTitle}>{project.name}</Heading>
              <span className={styles.rowTagline}>{project.tagline}</span>
            </span>
            <span className={styles.rowEnd}>
              <CreditBadge project={project} />
              <Icon name="arrow-right" size={20} className={styles.rowArrow} />
            </span>
          </Link>
          {project.featured && project.architecture ? (
            <div className={styles.rowPreview}>
              <ArchitectureFlow architecture={project.architecture} />
            </div>
          ) : null}
        </Reveal>
      ))}
    </ol>
  );
}
