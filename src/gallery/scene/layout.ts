/**
 * The exhibition's measurements, in scene units (about a metre each). One place, so the
 * hexagons, the orbit, the lights and the camera always agree.
 */

/** Circumradius of a display case: its corner-to-centre size. The flat edges are top and bottom. */
export const HEX_RADIUS = 1.6;
/** Half the case's height, flat edge to centre. */
export const HEX_HALF_HEIGHT = (HEX_RADIUS * Math.sqrt(3)) / 2;
/** Body thickness, before the bevel. */
export const HEX_DEPTH = 0.16;
export const HEX_BEVEL = 0.045;
/** The screenshot sits inside a metal frame this wide. */
export const FACE_INSET = 0.13;
export const FACE_RADIUS = HEX_RADIUS - FACE_INSET;
/** Front of the body: the face and glass sit just in front of it. */
export const HEX_FRONT_Z = HEX_DEPTH / 2 + HEX_BEVEL;

/** Radius of the invisible ring the cases stand on. */
export const ORBIT_RADIUS = 3.6;
/** Height of a case's centre above the floor: it floats a hand's width above it. */
export const EXHIBIT_Y = HEX_HALF_HEIGHT + 0.32;
/**
 * Each case turns only part of the way with the ring, so the ones at the sides still show
 * their screens at an angle instead of their backs (like displays on small turntables).
 */
export const FACING_SHARE = 0.4;
/** How far an inactive case steps back along the ring's radius. */
export const RECEDE = 0.22;

/** Where the camera looks: the active case's centre, slightly low so the floor shows. */
export const FOCUS_POINT = [0, EXHIBIT_Y - 0.1, ORBIT_RADIUS] as const;

export const HALL_COLOUR = '#070b14';
