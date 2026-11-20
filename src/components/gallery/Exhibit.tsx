import { AnimatePresence, motion } from 'motion/react';
import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { screensOf, type Exhibit as ExhibitData } from '../../data/gallery';
import { duration, ease } from '../../motion/tokens';
import { Reveal } from '../../motion/Reveal';
import { Lightbox } from '../projects/Lightbox';
import { Icon } from '../ui/Icon';
import styles from './Exhibit.module.css';

interface ExhibitProps {
  exhibit: ExhibitData;
  /** "01 / 03". */
  number: string;
}

/**
 * One project on the Gallery wall: a real screenshot in a quiet frame, its name, and a link
 * to its case study. The main exhibit can step through its screens; every exhibit opens its
 * screens full size in the viewer.
 */
export function Exhibit({ exhibit, number }: ExhibitProps) {
  const { project, main } = exhibit;
  const screens = screensOf(exhibit);
  const [current, setCurrent] = useState(0);
  const [viewing, setViewing] = useState<number | null>(null);
  const shot = screens[current];
  const caseStudy = `/projects/${project.slug}`;
  const titleId = `exhibit-${project.slug}`;

  return (
    <Reveal as="li" className={styles.exhibit} data-main={main ? '' : undefined} aria-labelledby={titleId}>
      <div className={styles.frame}>
        <div className={styles.bar} aria-hidden="true">
          <span>{project.fileName}</span>
          {main ? (
            <span>
              {current + 1} / {screens.length}
            </span>
          ) : null}
        </div>
        {/* The frame keeps the cover's shape; other screens fit inside it whole. */}
        <div
          className={styles.screen}
          data-fit={current === 0 ? 'cover' : 'contain'}
          style={{ '--cover-ratio': `${exhibit.cover.width} / ${exhibit.cover.height}` } as CSSProperties}
        >
          {/* The picture is a second way into the case study; keyboards use the named link below. */}
          <Link to={caseStudy} className={styles.screenLink} tabIndex={-1} aria-hidden="true">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.img
                key={shot.src}
                src={shot.src}
                alt=""
                width={shot.width}
                height={shot.height}
                loading={main ? 'eager' : 'lazy'}
                fetchPriority={main && current === 0 ? 'high' : undefined}
                decoding="async"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.base, ease: ease.out }}
              />
            </AnimatePresence>
          </Link>
          <span className="visually-hidden" role="img" aria-label={shot.alt} />
        </div>
      </div>

      <div className={styles.label}>
        <span className={styles.number} aria-hidden="true">
          {number}
        </span>
        <h2 id={titleId} className={styles.name}>
          {project.name}
        </h2>
        <span className={styles.period}>{project.period}</span>

        <div className={styles.actions}>
          {main ? (
            <div className={styles.ticks} role="group" aria-label={`${project.name} screens`}>
              {screens.map((s, i) => (
                <button
                  key={s.src}
                  type="button"
                  className={styles.tick}
                  aria-pressed={i === current}
                  aria-label={`Screen ${i + 1} of ${screens.length}: ${s.caption}`}
                  onClick={() => setCurrent(i)}
                />
              ))}
            </div>
          ) : null}
          <button
            type="button"
            className={styles.expand}
            aria-haspopup="dialog"
            onClick={() => setViewing(current)}
          >
            <Icon name="expand" size={14} />
            <span className="visually-hidden">View {project.name} screens full size</span>
          </button>
          <Link to={caseStudy} className={styles.caseLink} data-companion={caseStudy}>
            View case study
            <span className="visually-hidden">: {project.name}</span>
            <Icon name="arrow-right" size={14} />
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {viewing !== null ? (
          <Lightbox
            shots={screens}
            index={viewing}
            label={project.name}
            onIndexChange={setViewing}
            onClose={() => setViewing(null)}
          />
        ) : null}
      </AnimatePresence>
    </Reveal>
  );
}
