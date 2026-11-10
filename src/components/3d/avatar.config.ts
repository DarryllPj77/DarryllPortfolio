/**
 * Avatar settings in one place.
 *
 * The model is a stylised figure about 1.97 m tall, feet at y = 0, facing +Z.
 * Its parts hang off a joint hierarchy (Hips → Torso → Head, arms, legs);
 * the clips rotate those joints.
 */
export type AvatarMode = 'poster' | 'scene';

/**
 * Camera framing, in metres. The figure is centred in the slot; the canvas
 * extends `bleed` (a fraction of the slot width) to the left, into the space
 * toward the hero text, so the waving hand has room without shrinking the
 * avatar. The canvas is transparent and ignores pointer input, so the extra
 * area is invisible.
 */
export interface AvatarFraming {
  /** Preferred lowest visible height; the ground line crops the figure here. */
  bottom: number;
  /** Highest visible height (just above the hair). */
  top: number;
  /** How far the figure reaches either side of its centre, across all clips. */
  reach: { left: number; right: number };
  /** Extra canvas width on the left, as a fraction of the slot width. */
  bleed: number;
  /** Resting rotation in radians. Negative turns the avatar toward the hero text. */
  yaw: number;
}

export interface AvatarConfig {
  mode: AvatarMode;
  /** Path under /public. The file is used exactly as supplied. */
  modelUrl: string | null;
  /** Still render of the model on the About band's #111 ground (cropped from a 1440 capture), shown first and as the fallback. */
  posterUrl: string | null;
  /** Intrinsic poster size, so the slot never shifts while it loads. */
  posterSize: { width: number; height: number };
  /** Clip names are matched case-insensitively; the first match wins. */
  clips: { idle: string[]; wave: string[]; neutral: string[] };
  /** Name of the joint that turns toward the pointer, and its parent for the torso share. */
  joints: { head: string; torso: string };
  framing: {
    /** Wide desktops (1280 and up): from mid-thigh up, room on the left for the wave. */
    portrait: AvatarFraming;
    /** 640 to 1279, beside the About text: a narrow extension so the canvas stays off the words. */
    mid: AvatarFraming;
    /** Phones, stacked under the text: a square slot with the closer framing. */
    compact: AvatarFraming;
  };
  /** When the mid and compact framings apply. */
  midQuery: string;
  compactQuery: string;
  /** Vertical field of view in degrees. Narrow, for a flat, portrait-like look. */
  fov: number;
}

export const avatarConfig: AvatarConfig = {
  mode: 'scene',
  modelUrl: '/models/darryll-avatar.glb',
  posterUrl: '/models/darryll-avatar-poster.jpg',
  posterSize: { width: 628, height: 520 },
  clips: { idle: ['Idle'], wave: ['Wave'], neutral: ['Neutral'] },
  joints: { head: 'Head', torso: 'Torso' },
  // Reach measured from the clips: Idle ±0.79 m, Wave reaches 1.18 m to the
  // figure's right (screen left). Values include a small margin.
  framing: {
    portrait: { bottom: 0.3, top: 2.12, reach: { left: 1.24, right: 0.8 }, bleed: 0.2, yaw: -0.24 },
    mid: { bottom: 0.6, top: 2.1, reach: { left: 1.24, right: 0.8 }, bleed: 0.1, yaw: -0.18 },
    compact: { bottom: 0.6, top: 2.1, reach: { left: 1.24, right: 0.8 }, bleed: 0.25, yaw: -0.12 },
  },
  midQuery: '(min-width: 640px) and (max-width: 1279px)',
  compactQuery: '(max-width: 639px)',
  fov: 26,
};

/** Devices at or below this memory (GB, where the browser reports it) get the poster. */
export const LOW_MEMORY_GB = 2;
