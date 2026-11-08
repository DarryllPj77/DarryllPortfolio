import { Link } from 'react-router';
import type { Project } from '../../data/types';
import { buttonClass } from '../ui/buttonClass';
import { Icon } from '../ui/Icon';
import { Badge, TagList } from '../ui/Tag';
import { ArchitectureFlow, CreditBadge, ProjectLinks } from './ProjectParts';
import styles from './Projects.module.css';

interface FeaturedProjectProps {
  project: Project;
  /** Heading level for the project name, depending on where the card is used. */
  headingLevel?: 'h2' | 'h3';
  /** Show the full stack list (projects page) or a short preview (home page). */
  compact?: boolean;
}

export function FeaturedProject({ project, headingLevel = 'h2', compact = false }: FeaturedProjectProps) {
  const Heading = headingLevel;
  const stack = compact ? project.stack.slice(0, 6) : project.stack;
  const hidden = project.stack.length - stack.length;

  return (
    <article className={styles.featured} aria-labelledby={`featured-${project.slug}`}>
      <div className={styles.featuredTop}>
        <Badge tone="accent" dot>
          Featured project
        </Badge>
        <span className={styles.cardMeta}>
          {project.category} · {project.period}
        </span>
      </div>

      <Heading id={`featured-${project.slug}`} className={styles.featuredTitle}>
        {project.name}
      </Heading>
      <p className={styles.featuredTagline}>{project.tagline}</p>

      {project.architecture ? <ArchitectureFlow architecture={project.architecture} /> : null}

      <div className={styles.featuredStack}>
        <TagList items={stack} label={`${project.name} tech stack`} />
        {hidden > 0 ? <span className={styles.more}>+{hidden} more</span> : null}
      </div>

      <div className={styles.featuredFooter}>
        <div className={styles.creditRow}>
          <CreditBadge project={project} />
        </div>
        <div className={styles.links}>
          <Link to={`/projects/${project.slug}`} className={buttonClass('primary')}>
            View project details
            <Icon name="arrow-right" size={16} />
          </Link>
          {!compact ? <ProjectLinks project={project} /> : null}
        </div>
      </div>
    </article>
  );
}
