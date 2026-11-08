import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArchitectureFlow,
  ContributionList,
  CreditBadge,
  ProjectLinks,
} from '../components/projects/ProjectParts';
import { Gallery } from '../components/projects/Gallery';
import { GridFrame, SectionLabel } from '../components/ui/Grid';
import { Icon } from '../components/ui/Icon';
import { TagList } from '../components/ui/Tag';
import { ViewHeading } from '../components/ui/ViewFrame';
import { sections } from '../data/navigation';
import { getProject, projectNumber, projects } from '../data/projects';
import { MaskedText, Reveal } from '../motion/Reveal';
import { NotFoundView } from './NotFoundView';
import styles from './ProjectDetailView.module.css';

interface RowProps {
  id: string;
  label: string;
  children: ReactNode;
  /** Full-width content under the row, e.g. screenshots. */
  media?: ReactNode;
}

/** One case-study row: label on the left, content on the right, thin rule between rows. */
function Row({ id, label, children, media }: RowProps) {
  return (
    <Reveal as="section" trigger="scroll" className={styles.row} aria-labelledby={id}>
      <h2 id={id} className={styles.rowLabel}>
        {label}
      </h2>
      <div className={styles.rowBody}>{children}</div>
      {media ? <div className={styles.rowMedia}>{media}</div> : null}
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

        {project.hero ? (
          <Reveal className={styles.hero}>
            <Gallery
              blocks={[{ layout: 'feature', shots: [project.hero] }]}
              label={project.name}
              eager
            />
          </Reveal>
        ) : null}

        <div className={styles.rows}>
          <Row id="overview" label="Overview">
            <p className={styles.lead}>{project.summary}</p>
          </Row>

          {project.problem ? (
            <Row id="problem" label="Problem">
              <p>{project.problem}</p>
            </Row>
          ) : null}

          {project.features?.length ? (
            <Row id="features" label="What it does">
              <ul className={styles.features}>
                {project.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </Row>
          ) : null}

          <Row id="contribution" label="My contribution">
            <ContributionList items={project.contributions} />
            <p className={styles.note}>{project.credit.note}</p>
          </Row>

          {project.chapters?.map((chapter) => (
            <Row
              key={chapter.id}
              id={chapter.id}
              label={chapter.title}
              media={<Gallery blocks={chapter.blocks} label={chapter.title} />}
            >
              <p>{chapter.intro}</p>
            </Row>
          ))}

          {project.architecture ? (
            <Row id="architecture" label="Architecture">
              <ArchitectureFlow architecture={project.architecture} />
            </Row>
          ) : null}

          <Row id="technologies" label="Technologies">
            <TagList items={project.stack} label={`${project.name} tech stack`} />
          </Row>

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
