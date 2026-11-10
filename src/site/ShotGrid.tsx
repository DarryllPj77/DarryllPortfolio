import { useState } from 'react';
import { Lightbox } from '../components/projects/Lightbox';
import type { ProjectScreenshot } from '../data/types';

interface ShotGridProps {
  shots: ProjectScreenshot[];
  /** Group name shown in the viewer, e.g. "Teacher workflow". */
  label: string;
}

/**
 * One row ratio (4:3 frames on the column lines): each screenshot is scaled to fit its frame,
 * never cropped or enlarged, and opens full size in the viewer. No caption under any picture.
 */
export function ShotGrid({ shots, label }: ShotGridProps) {
  const [open, setOpen] = useState<number | null>(null);
  const cols = shots.length === 2 || shots.length === 4 ? 2 : 3;

  return (
    <>
      <ul className="shots grid" data-cols={cols}>
        {shots.map((shot, i) => (
          <li key={shot.src} className={cols === 2 ? 'span-6' : 'span-4'}>
            <button
              type="button"
              className="frame shots__frame m-zoom"
              onClick={() => setOpen(i)}
              aria-haspopup="dialog"
              aria-label={`${shot.alt}, open full size`}
            >
              {/* the button's label describes the screen, so the picture itself is not read twice */}
              <img src={shot.src} alt="" width={shot.width} height={shot.height} loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
      {open !== null ? (
        <Lightbox
          shots={shots}
          index={open}
          label={label}
          onIndexChange={setOpen}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </>
  );
}
