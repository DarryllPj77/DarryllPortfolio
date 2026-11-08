import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';
import { Link } from 'react-router';
import type { Project } from '../../data/types';
import { buttonClass } from '../ui/buttonClass';
import { Icon } from '../ui/Icon';
import { TagList } from '../ui/Tag';
import { ContributionList, CreditBadge, ProjectLinks } from './ProjectParts';
import styles from './Projects.module.css';

/** Compact project card with an expandable "quick look" section. */
export function ProjectCard({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  const detailsId = useId();
  const titleId = useId();

  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <div className={styles.cardHeader}>
        <div className={styles.cardMeta}>
          <span>{project.category}</span>
          <span aria-hidden="true">·</span>
          <span>{project.period}</span>
        </div>
        <CreditBadge project={project} />
      </div>
      <h3 id={titleId} className={styles.cardTitle}>
        <Link to={`/projects/${project.slug}`} className={styles.cardLink}>
          {project.name}
        </Link>
      </h3>
      <p className={styles.cardTagline}>{project.tagline}</p>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            id={detailsId}
            key="details"
            className={styles.details}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className={styles.detailsInner}>
              <p>{project.summary}</p>
              <h4 className={styles.miniTitle}>My contribution</h4>
              <ContributionList items={project.contributions} />
              <h4 className={styles.miniTitle}>Stack</h4>
              <TagList items={project.stack} label={`${project.name} tech stack`} />
              <ProjectLinks project={project} size="sm" />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className={styles.cardActions}>
        <button
          type="button"
          className={buttonClass('ghost', 'sm')}
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((e) => !e)}
        >
          <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={14} />
          {expanded ? 'Hide details' : 'Quick look'}
          <span className="visually-hidden"> for {project.name}</span>
        </button>
        <Link to={`/projects/${project.slug}`} className={buttonClass('secondary', 'sm')}>
          Open project
          <span className="visually-hidden">: {project.name}</span>
          <Icon name="arrow-right" size={14} />
        </Link>
      </div>
    </article>
  );
}
