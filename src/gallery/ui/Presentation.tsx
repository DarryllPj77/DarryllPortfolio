import { animate } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, type CSSProperties, type Ref } from 'react';
import { ExternalLink } from '../../components/ui/ExternalLink';
import { duration, ease } from '../../motion/tokens';
import { exhibitNumber, type GalleryProject, type GalleryShot } from '../data';
import type { ScreenRect } from '../show/ShowState';
import { FULL_CLIP, handoffFrom } from './handoff';
import styles from './Presentation.module.css';

interface PresentationProps {
  project: GalleryProject;
  index: number;
  /** Where the 3D screen was on the page, to start the screenshot from; null to fade in. */
  from: ScreenRect | null;
  reduced: boolean;
  /** Set when the visitor asks to go back: the presentation plays its exit, then calls onExited. */
  leaving: boolean;
  onBack: () => void;
  onExited: () => void;
}

const HANDOFF_S = 0.55;

function Screen({ shot, eager, imageRef }: { shot: GalleryShot; eager?: boolean; imageRef?: Ref<HTMLImageElement> }) {
  return (
    <img
      ref={imageRef}
      className={styles.image}
      src={shot.src}
      alt={shot.alt}
      width={shot.width}
      height={shot.height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      // Never shown larger than the file itself.
      style={{ '--w': `${shot.width}px` } as CSSProperties}
    />
  );
}

/**
 * An opened project, as an accessible page over the darkened hall: its screens large and in
 * order, with only its number, name, year, how it was built, a few technologies and its links.
 * Not a second case study: the screens are the point. The first screen arrives from the 3D
 * case itself, opening out of the hexagon into its full rectangle.
 */
export function Presentation({ project, index, from, reduced, leaving, onBack, onExited }: PresentationProps) {
  const overlay = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLImageElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const rest = useRef<HTMLDivElement>(null);
  const { project: p, cover, screens, stack, links, focus } = project;

  /** Plays the hand-off from the 3D screen, forwards (arriving) or backwards (leaving). */
  const handoff = (direction: 'in' | 'out') => {
    const el = hero.current;
    const scrolled = (overlay.current?.scrollTop ?? 0) > 40;
    if (!el || !from || reduced || scrolled) return null;
    const r = el.getBoundingClientRect();
    const h = handoffFrom(from, { left: r.left, top: r.top, width: r.width, height: r.height }, focus);
    const at3d = { x: h.x, y: h.y, scale: h.scale, clipPath: h.clip };
    const atRest = { x: 0, y: 0, scale: 1, clipPath: FULL_CLIP };
    const [a, b] = direction === 'in' ? [at3d, atRest] : [atRest, at3d];
    return animate(
      el,
      { x: [a.x, b.x], y: [a.y, b.y], scale: [a.scale, b.scale], clipPath: [a.clipPath, b.clipPath] },
      { duration: HANDOFF_S, ease: ease.out },
    );
  };

  // Arriving: the overlay and the details fade in while the first screen comes out of the case.
  useLayoutEffect(() => {
    const fade = reduced ? 0.2 : duration.base;
    animate(overlay.current!, { backgroundColor: ['rgba(7, 11, 20, 0)', 'rgba(7, 11, 20, 0.94)'] }, { duration: fade });
    if (!handoff('in')) animate(hero.current!, { opacity: [0, 1] }, { duration: fade });
    animate(rest.current!, { opacity: [0, 1], y: reduced ? 0 : [12, 0] }, { duration: duration.section, delay: reduced ? 0 : 0.2, ease: ease.out });
    heading.current?.focus({ preventScroll: true });
    // Run once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leaving: the reverse, then the scene takes over again.
  useEffect(() => {
    if (!leaving) return;
    const fade = reduced ? 0.2 : duration.base;
    const back = handoff('out');
    animate(rest.current!, { opacity: 0 }, { duration: duration.exit });
    animate(overlay.current!, { backgroundColor: 'rgba(7, 11, 20, 0)' }, { duration: fade });
    const done = back ?? animate(hero.current!, { opacity: 0 }, { duration: fade });
    void done.then(onExited);
    // Run when leaving starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  const titleId = `presentation-${project.slug}`;

  return (
    <div
      ref={overlay}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onBack();
        }
      }}
    >
      <article className={styles.sheet}>
        <div className={styles.hero}>
          <Screen shot={cover} eager imageRef={hero} />
        </div>

        <div ref={rest}>
          <header className={styles.header}>
            <div className={styles.identity}>
              <p className={styles.number}>{exhibitNumber(index)}</p>
              <h2 id={titleId} ref={heading} tabIndex={-1} className={styles.title}>
                {p.name}
              </h2>
            </div>
            <div className={styles.facts}>
              <p className={styles.meta}>
                {p.period} <span aria-hidden="true">·</span> {p.category} <span aria-hidden="true">·</span>{' '}
                {p.credit.label}
              </p>
              <p className={styles.stack}>
                <span className="visually-hidden">Built with </span>
                {stack.join(' / ')}
              </p>
              <ul role="list" className={styles.links}>
                {links.map((link) => (
                  <li key={link.href}>
                    <ExternalLink href={link.href} className={styles.link}>
                      {link.kind === 'repo' ? 'GitHub' : 'Live demo'} <span aria-hidden="true">↗</span>
                    </ExternalLink>
                  </li>
                ))}
                <li>
                  <ExternalLink href={`/projects/${p.slug}`} className={styles.link}>
                    Case study <span aria-hidden="true">↗</span>
                  </ExternalLink>
                </li>
              </ul>
            </div>
          </header>

          <ol role="list" className={styles.screens} aria-label={`More screens from ${p.name}`}>
            {screens.map((shot) => (
              <li key={shot.src}>
                <Screen shot={shot} />
              </li>
            ))}
          </ol>

          <footer className={styles.footer}>
            <button type="button" className={styles.back} onClick={onBack}>
              <span aria-hidden="true">←</span> Back to the exhibition
            </button>
          </footer>
        </div>
      </article>
    </div>
  );
}
