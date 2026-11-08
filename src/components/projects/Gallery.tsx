import { AnimatePresence } from 'motion/react';
import { useState, type CSSProperties } from 'react';
import type { ProjectScreenshot, ScreenshotBlock } from '../../data/types';
import { Lightbox } from './Lightbox';
import styles from './Gallery.module.css';

interface ShotProps {
  shot: ProjectScreenshot;
  onOpen: () => void;
  /** The hero loads straight away; everything else waits until scrolled near. */
  eager?: boolean;
}

/** A screenshot that opens in the viewer. Never shown larger than its real size. */
function Shot({ shot, onOpen, eager = false }: ShotProps) {
  return (
    <figure className={styles.shot} style={{ '--w': `${shot.width}px` } as CSSProperties}>
      <button type="button" className={styles.shotButton} onClick={onOpen} aria-haspopup="dialog">
        <img
          src={shot.src}
          alt={shot.alt}
          width={shot.width}
          height={shot.height}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : undefined}
          decoding="async"
        />
        <span className="visually-hidden">, open larger view</span>
      </button>
      <figcaption className={styles.caption}>{shot.caption}</figcaption>
    </figure>
  );
}

interface GalleryProps {
  blocks: ScreenshotBlock[];
  /** Group name shown in the viewer, e.g. "Teacher workflow". */
  label: string;
  eager?: boolean;
}

/**
 * Screenshots for one part of a case study, laid out block by block
 * (feature / pair / grid / log). Previous and next in the viewer stay within
 * this group.
 */
export function Gallery({ blocks, label, eager = false }: GalleryProps) {
  const [open, setOpen] = useState<number | null>(null);
  const shots = blocks.flatMap((block) => block.shots);

  return (
    <div className={styles.gallery}>
      {blocks.map((block, b) => (
        <div key={b} className={styles.block} data-layout={block.layout}>
          {block.shots.map((shot) => (
            <Shot
              key={shot.src}
              shot={shot}
              eager={eager}
              onOpen={() => setOpen(shots.indexOf(shot))}
            />
          ))}
        </div>
      ))}

      <AnimatePresence>
        {open !== null ? (
          <Lightbox
            shots={shots}
            index={open}
            label={label}
            onIndexChange={setOpen}
            onClose={() => setOpen(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
