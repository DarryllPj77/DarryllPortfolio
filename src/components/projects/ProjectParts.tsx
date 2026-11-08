import type { Project, ProjectArchitecture } from '../../data/types';
import { buttonClass } from '../ui/buttonClass';
import { ExternalLink } from '../ui/ExternalLink';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Tag';
import styles from './Projects.module.css';

export function CreditBadge({ project }: { project: Project }) {
  return (
    <Badge tone={project.credit.kind === 'hands-on-ai' ? 'accent' : 'info'}>
      {project.credit.label}
    </Badge>
  );
}

export function ProjectLinks({ project, size = 'md' }: { project: Project; size?: 'md' | 'sm' }) {
  return (
    <div className={styles.links}>
      {project.links.map((link) => (
        <ExternalLink
          key={link.href}
          href={link.href}
          className={buttonClass(link.kind === 'live' ? 'primary' : 'secondary', size)}
        >
          <Icon name={link.kind === 'repo' ? 'github' : 'external'} size={size === 'sm' ? 14 : 16} />
          {link.label}
        </ExternalLink>
      ))}
    </div>
  );
}

/** Simple left-to-right diagram of how the system's parts connect. */
export function ArchitectureFlow({ architecture }: { architecture: ProjectArchitecture }) {
  const { nodes, realtime } = architecture;
  return (
    <figure className={styles.architecture}>
      <ol role="list" className={styles.flow}>
        {nodes.map((node, i) => (
          <li key={node.label} className={styles.flowItem}>
            <div className={styles.node}>
              <span className={styles.nodeLabel}>{node.label}</span>
              {node.detail ? <span className={styles.nodeDetail}>{node.detail}</span> : null}
            </div>
            {i < nodes.length - 1 ? (
              <span className={styles.arrow} aria-hidden="true">
                <Icon name="arrow-right" size={16} />
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      {realtime ? (
        <figcaption className={styles.realtime}>
          <span className={styles.realtimeLine} aria-hidden="true" />
          <span>
            <strong>{realtime.label}</strong>
            {realtime.detail ? ` · ${realtime.detail}` : null}
          </span>
        </figcaption>
      ) : null}
    </figure>
  );
}

export function ContributionList({ items }: { items: string[] }) {
  return (
    <ul role="list" className={styles.contributions}>
      {items.map((item) => (
        <li key={item}>
          <Icon name="check" size={14} className={styles.check} />
          {item}
        </li>
      ))}
    </ul>
  );
}
