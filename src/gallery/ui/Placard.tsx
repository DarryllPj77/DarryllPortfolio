import { ExternalLink } from '../../components/ui/ExternalLink';
import { exhibitNumber, type GalleryProject } from '../data';
import styles from './Placard.module.css';

interface PlacardProps {
  project: GalleryProject;
  index: number;
}

/** The museum placard under the active case: its number and name, and nothing more than its links. */
export function Placard({ project, index }: PlacardProps) {
  return (
    <section className={styles.placard} aria-labelledby="placard-name">
      <p className={styles.number}>{exhibitNumber(index)}</p>
      <h2 id="placard-name" className={styles.name}>
        {project.project.name}
      </h2>
      <p className="visually-hidden">{project.cover.alt}</p>
      <ul role="list" className={styles.links}>
        {project.links.map((link) => (
          <li key={link.href}>
            <ExternalLink href={link.href} className={styles.link}>
              {link.kind === 'repo' ? 'GitHub' : 'Live demo'} <span aria-hidden="true">↗</span>
            </ExternalLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
