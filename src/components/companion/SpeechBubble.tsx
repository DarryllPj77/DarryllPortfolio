import { motion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { duration, ease } from '../../motion/tokens';
import { roamBounds } from './companionBounds';
import { placeBubble, type BubblePlacement, type Point, type RectLike, type Size } from './companionPlacement';
import styles from './Companion.module.css';

interface SpeechBubbleProps {
  /** File name for the header, like an editor tab. */
  title: string;
  text: string;
  /** The companion's box when it arrived, in viewport pixels. */
  anchor: Point & Size;
  /** The element the visitor clicked: the bubble keeps clear of it. */
  avoid: RectLike | null;
  reducedMotion: boolean;
  onClose: () => void;
}

/** Long enough to read the line twice at a relaxed pace, within 4 to 9 seconds. */
const readingTime = (text: string) =>
  Math.min(9000, Math.max(4000, 1800 + text.split(/\s+/).length * 300));

/**
 * The companion's speech bubble: an editor-style panel beside the avatar. It
 * opens on the first side that fits on screen and keeps clear of what was
 * clicked, and closes by itself (paused while hovered). Screen readers get the
 * line from the companion's live region, so the bubble itself is hidden from them.
 */
export function SpeechBubble({ title, text, anchor, avoid, reducedMotion, onClose }: SpeechBubbleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<BubblePlacement | null>(null);
  const [paused, setPaused] = useState(false);

  // Measure once rendered, then place before the first paint.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const size = { w: el.offsetWidth, h: el.offsetHeight };
    setPlace(placeBubble(anchor, size, roamBounds(), avoid));
  }, [anchor, avoid]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(onClose, readingTime(text));
    return () => window.clearTimeout(timer);
  }, [paused, text, onClose]);

  return (
    <motion.div
      ref={ref}
      className={styles.bubble}
      data-side={place?.side}
      aria-hidden="true"
      style={{ left: place?.x ?? 0, top: place?.y ?? 0, visibility: place ? 'visible' : 'hidden' }}
      initial={{ opacity: 0, y: reducedMotion ? 0 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: reducedMotion ? 0 : duration.exit } }}
      transition={{ duration: reducedMotion ? 0 : duration.fast, ease: ease.out }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <p className={styles.bubbleTitle}>
        <span className={styles.bubbleDot} />
        {title}
      </p>
      <p className={styles.bubbleText}>{text}</p>
    </motion.div>
  );
}
