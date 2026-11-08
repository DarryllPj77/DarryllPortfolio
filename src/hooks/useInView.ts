import { useEffect, useState, type RefObject } from 'react';

/**
 * True while the element is within `rootMargin` of the viewport. Used to mount
 * and pause the avatar scene only when the hero is (nearly) on screen.
 */
export function useInView(ref: RefObject<Element | null>, rootMargin = '200px'): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return inView;
}
