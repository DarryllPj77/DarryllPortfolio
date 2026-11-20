/**
 * The exhibition's measurements, in scene units (about a metre each). One place, so the
 * hexagons, the wheel, the lights and the camera always agree.
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

/* ---------- The wheel ---------- */

/** From the axle to the centre of each cabin (each display case rides the wheel as a cabin). */
export const WHEEL_RADIUS = 3.3;
/**
 * Height of the axle: a cabin passing straight underneath, stepped back from the rim and
 * tilted, still clears the floor.
 */
export const AXLE_Y = WHEEL_RADIUS + HEX_HALF_HEIGHT + 0.7;
/**
 * The twin rims stand either side of the cabins (which hang between them on a crossbar); the
 * axle runs out past them to the stand's legs.
 */
export const RIM_X = HEX_RADIUS + 0.3;
export const AXLE_HALF = RIM_X + 0.25;
/**
 * Cabins stay upright as the wheel turns, like a Ferris wheel's, and only tilt a little toward
 * the visitor when above or below the front, so their screens are always readable.
 */
export const CABIN_TILT = 0.3;
/** How far a cabin that is not in front steps back along its spoke. */
export const RECEDE = 0.22;

/** Where the camera looks and the exhibit light falls: the front cabin's centre. */
export const FOCUS_POINT = [0, AXLE_Y - 0.1, WHEEL_RADIUS] as const;

export const HALL_COLOUR = '#070b14';
