import { AnimatePresence, motion } from 'motion/react';
import type { Ref } from 'react';
import { ExternalLink } from '../../components/ui/ExternalLink';
import { duration, ease } from '../../motion/tokens';
import { exhibitNumber, type GalleryProject } from '../data';
import styles from './Placard.module.css';

interface PlacardProps {
  project: GalleryProject;
  index: number;
  /** Opens the project's presentation (the same as choosing the case in front). */
  onOpen: () => void;
  openRef?: Ref<HTMLButtonElement>;
}

/**
 * The museum placard under the front case: its number and name, and its links. When another
 * case comes to the front, the old name slides up behind a mask and the new one rises in.
 */
export function Placard({ project, index, onOpen, openRef }: PlacardProps) {
  return (
    // Named directly, not by the heading's id: while the name changes, the old and new headings
    // briefly both exist.
    <section className={styles.placard} aria-label={project.project.name}>
      <div className={styles.mask}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={project.slug}
            className={styles.identity}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: duration.base, ease: ease.out }}
          >
            <p className={styles.number}>{exhibitNumber(index)}</p>
            <h2 className={styles.name}>
              {project.project.name}
            </h2>
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="visually-hidden">{project.cover.alt}</p>
      <ul role="list" className={styles.links}>
        <li>
          <button ref={openRef} type="button" className={styles.open} onClick={onOpen}>
            View project<span className="visually-hidden">: {project.project.name}</span>
          </button>
        </li>
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
