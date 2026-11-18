/**
 * Darryll's real portrait: the "Real Darryll" the Home hero shows before the 3D
 * avatar is initialized. The whole photo, resized copies only (the original is
 * never modified). It is square and always shown whole, standing on the slot's
 * ground line.
 */
export const portrait = {
  src: '/image/darryll/portrait-1024.jpg',
  srcSet: '/image/darryll/portrait-512.jpg 512w, /image/darryll/portrait-1024.jpg 1024w',
  sizes: '(min-width: 1101px) 440px, (min-width: 481px) 360px, 260px',
  width: 1024,
  height: 1024,
  alt: 'Photo of Darryll in glasses and a yellow plaid shirt',
} as const;
