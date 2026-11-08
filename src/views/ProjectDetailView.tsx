import { Link, useParams } from 'react-router';
import {
  ArchitectureFlow,
  ContributionList,
  CreditBadge,
  ProjectLinks,
} from '../components/projects/ProjectParts';
import { Icon } from '../components/ui/Icon';
import { TagList } from '../components/ui/Tag';
import { SectionTitle, ViewFrame } from '../components/ui/ViewFrame';
import { getProject, projects } from '../data/projects';
import { NotFoundView } from './NotFoundView';
import styles from './Views.module.css';

export function ProjectDetailView() {
  const { slug } = useParams();
  const project = getProject(slug);
  if (!project) return <NotFoundView />;

  const index = projects.indexOf(project);
  const prev = projects[index - 1];
  const next = projects[index + 1];

  return (
    <ViewFrame
      title={project.name}
      path={`portfolio/projects/${project.slug}`}
      description={project.tagline}
    >
      <Link to="/projects" className={styles.back}>
        <Icon name="arrow-left" size={14} />
        All projects
      </Link>

      <div className={styles.metaRow}>
        <span className={styles.metaItem}>
          <Icon name="calendar" size={14} />
          {project.period}
        </span>
        <span className={styles.metaItem}>
          <Icon name="file-code" size={14} />
          {project.category}
        </span>
        <CreditBadge project={project} />
      </div>

      <div className={styles.stack}>
        <section aria-labelledby="overview">
          <SectionTitle id="overview">Overview</SectionTitle>
          <p className={styles.lead}>{project.summary}</p>
          <div className={styles.linksRow}>
            <ProjectLinks project={project} />
          </div>
        </section>

        {project.architecture ? (
          <section aria-labelledby="architecture">
            <SectionTitle id="architecture">Architecture</SectionTitle>
            <ArchitectureFlow architecture={project.architecture} />
          </section>
        ) : null}

        <div className={styles.split}>
          <section aria-labelledby="contribution">
            <SectionTitle id="contribution">My contribution</SectionTitle>
            <ContributionList items={project.contributions} />
          </section>
          <section aria-labelledby="how-built" className={styles.panel}>
            <SectionTitle id="how-built">How it was built</SectionTitle>
            <p className={styles.muted}>{project.credit.note}</p>
          </section>
        </div>

        <section aria-labelledby="stack">
          <SectionTitle id="stack">Tech stack</SectionTitle>
          <TagList items={project.stack} label={`${project.name} tech stack`} />
        </section>

        <nav aria-label="More projects" className={styles.pager}>
          {prev ? (
            <Link to={`/projects/${prev.slug}`} className={styles.pagerLink}>
              <span className={styles.pagerHint}>Previous</span>
              <span className={styles.pagerName}>
                <Icon name="arrow-left" size={14} />
                {prev.name}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`/projects/${next.slug}`} className={`${styles.pagerLink} ${styles.pagerNext}`}>
              <span className={styles.pagerHint}>Next</span>
              <span className={styles.pagerName}>
                {next.name}
                <Icon name="arrow-right" size={14} />
              </span>
            </Link>
          ) : null}
        </nav>
      </div>
    </ViewFrame>
  );
}
