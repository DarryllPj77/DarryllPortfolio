import { exhibitNumber, type GalleryProject } from '../data';
import styles from './Controls.module.css';

interface ControlsProps {
  projects: GalleryProject[];
  active: number;
  onPrevious: () => void;
  onNext: () => void;
  onChoose: (index: number) => void;
}

/**
 * The exhibition's controls, for every visitor: previous and next, and one button per project
 * (the current one pressed). Plain HTML buttons, so keyboards and screen readers work as
 * everywhere else; the arrow keys work too, from anywhere on the page.
 */
export function Controls({ projects, active, onPrevious, onNext, onChoose }: ControlsProps) {
  const count = projects.length;
  const prev = projects[(active - 1 + count) % count];
  const next = projects[(active + 1) % count];
  return (
    <nav className={styles.controls} aria-label="Exhibition">
      <button type="button" className={styles.step} onClick={onPrevious}>
        <span aria-hidden="true">←</span>
        <span className="visually-hidden">Previous project: {prev.project.name}</span>
      </button>
      <div className={styles.picker} role="group" aria-label="Choose a project">
        {projects.map((p, i) => (
          <button
            key={p.slug}
            type="button"
            className={styles.pick}
            aria-pressed={i === active}
            onClick={() => onChoose(i)}
          >
            <span className="visually-hidden">
              {exhibitNumber(i, count)}, {p.project.name}
            </span>
          </button>
        ))}
      </div>
      <button type="button" className={styles.step} onClick={onNext}>
        <span aria-hidden="true">→</span>
        <span className="visually-hidden">Next project: {next.project.name}</span>
      </button>
    </nav>
  );
}
