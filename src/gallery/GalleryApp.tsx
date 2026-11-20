import { MotionConfig } from 'motion/react';
import { GalleryBar } from './ui/GalleryBar';
import { StaticGallery } from './ui/StaticGallery';

/**
 * After Hours: the project Gallery, a page of its own that opens in a new tab.
 * Phase 1 shows the exhibits as plain, accessible HTML; the 3D exhibition is built on top
 * of this, and this same view stays as the fallback when WebGL is not available.
 */
export function GalleryApp() {
  return (
    <MotionConfig reducedMotion="user">
      <GalleryBar />
      <StaticGallery />
    </MotionConfig>
  );
}
