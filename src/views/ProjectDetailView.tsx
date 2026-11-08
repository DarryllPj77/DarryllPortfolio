import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArchitectureFlow,
  ContributionList,
  CreditBadge,
  ProjectLinks,
} from '../components/projects/ProjectParts';
import { GridFrame, SectionLabel } from '../components/ui/Grid';
import { Icon } from '../components/ui/Icon';
import { TagList } from '../components/ui/Tag';
import { ViewHeading } from '../components/ui/ViewFrame';
import { sections } from '../data/navigation';
import { getProject, projectNumber, projects } from '../data/projects';
import { MaskedText, Reveal } from '../motion/Reveal';
import { NotFoundView } from './NotFoundView';
import styles from './ProjectDetailView.module.css';

/** One case-study row: label on the left, content on the right, thin rule between rows. */
function Row({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <Reveal as="section" trigger="scroll" className={styles.row} aria-labelledby={id}>
      <h2 id={id} className={styles.rowLabel}>
        {label}
      </h2>
      <div className={styles.rowBody}>{children}</div>
    </Reveal>
  );
}

export function ProjectDetailView() {
  const { slug } = useParams();
  const project = getProject(slug);
  if (!project) return <NotFoundView />;

  const index = projects.indexOf(project);
  const prev = projects[index - 1];
  const next = projects[index + 1];
  const number = projectNumber(project.slug);

  return (
    <GridFrame>
      <article>
        <header className={styles.header}>
          <Reveal>
            <Link to="/projects" className={styles.back}>
              <Icon name="arrow-left" size={14} />
              Back to Projects
            </Link>
          </Reveal>
          <Reveal>
            <SectionLabel
              index={sections.projects.index}
              label={`Case study ${number}`}
              meta={`~/projects/${project.fileName}`}
            />
          </Reveal>
          <ViewHeading className={styles.title}>
            <MaskedText>{project.name}</MaskedText>
          </ViewHeading>
          <Reveal as="p" className={styles.tagline}>
            {project.tagline}
          </Reveal>
          <Reveal className={styles.meta}>
            <dl className={styles.facts}>
              <div>
                <dt>Year</dt>
                <dd>{project.period}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{project.category}</dd>
              </div>
              <div>
                <dt>Built</dt>
                <dd>
                  <CreditBadge project={project} />
                </dd>
              </div>
            </dl>
            <ProjectLinks project={project} />
          </Reveal>
        </header>

        <div className={styles.rows}>
          <Row id="overview" label="Overview">
            <p className={styles.lead}>{project.summary}</p>
          </Row>

          {project.problem ? (
            <Row id="problem" label="Problem">
              <p>{project.problem}</p>
            </Row>
          ) : null}

          <Row id="contribution" label="My contribution">
            <ContributionList items={project.contributions} />
            <p className={styles.note}>{project.credit.note}</p>
          </Row>

          {project.architecture ? (
            <Row id="architecture" label="Architecture">
              <ArchitectureFlow architecture={project.architecture} />
            </Row>
          ) : null}

          <Row id="technologies" label="Technologies">
            <TagList items={project.stack} label={`${project.name} tech stack`} />
          </Row>

          {project.features?.length ? (
            <Row id="features" label="Features">
              <ul className={styles.features}>
                {project.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </Row>
          ) : null}

          {project.screenshots?.length ? (
            <Row id="screenshots" label="Screenshots">
              <div className={styles.shots}>
                {project.screenshots.map((shot) => (
                  <figure key={shot.src} className={styles.shot}>
                    <img
                      src={shot.src}
                      alt={shot.alt}
                      width={shot.width}
                      height={shot.height}
                      loading="lazy"
                      decoding="async"
                    />
                    {shot.caption ? <figcaption>{shot.caption}</figcaption> : null}
                  </figure>
                ))}
              </div>
            </Row>
          ) : null}

          <Row id="links" label="Links">
            <ProjectLinks project={project} />
          </Row>
        </div>

        <nav aria-label="More case studies" className={styles.pager}>
          {prev ? (
            <Link to={`/projects/${prev.slug}`} className={styles.pagerLink}>
              <span className={styles.pagerHint}>
                <Icon name="arrow-left" size={12} /> Previous
              </span>
              <span className={styles.pagerName}>{prev.name}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`/projects/${next.slug}`} className={`${styles.pagerLink} ${styles.pagerNext}`}>
              <span className={styles.pagerHint}>
                Next <Icon name="arrow-right" size={12} />
              </span>
              <span className={styles.pagerName}>{next.name}</span>
            </Link>
          ) : null}
        </nav>
      </article>
    </GridFrame>
  );
}
