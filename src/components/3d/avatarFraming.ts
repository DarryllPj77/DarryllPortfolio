import type { AvatarFraming } from './avatar.config';

/**
 * Works out the camera for a framing and canvas size. The canvas is the slot
 * plus `bleed` on the left; the figure is centred in the slot part.
 * The top of the frame stays fixed; the view only grows downward (showing a
 * little more of the legs) if needed so the figure's full reach fits.
 */
export function frameCamera(framing: AvatarFraming, width: number, height: number, fov: number) {
  const { top, bottom, reach, bleed } = framing;
  const slotAspect = width / (1 + bleed) / Math.max(height, 1);
  const span = Math.max(
    top - bottom,
    (2 * reach.right) / slotAspect,
    reach.left / ((0.5 + bleed) * slotAspect),
  );
  const slotWidth = span * slotAspect;
  const centerY = top - span / 2;
  const centerX = (-bleed * slotWidth) / 2;
  const distance = span / 2 / Math.tan((fov * Math.PI) / 360);
  return { span, centerX, centerY, distance, slotWidth };
}
