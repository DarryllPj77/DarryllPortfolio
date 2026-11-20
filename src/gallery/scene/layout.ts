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

/*
 * There is no visible wheel: the cases themselves travel a level ring about an unseen vertical
 * axis, stretched in depth, so the one in front is near and large and the others recede far
 * behind it (smaller through perspective, and dimmer), peeking out to its left and right.
 */

/** Width of the path either side of the axis, to the centre of each case. */
export const WHEEL_RADIUS = 3.2;
/** Depth of the path in front of and behind the axis: the front case is this far forward. */
export const WHEEL_DEPTH = 5.0;
/** Height of the ring (every case's centre): it floats a little over the floor, which reflects it. */
export const AXLE_Y = HEX_HALF_HEIGHT + 1.0;
/**
 * Cases stay upright as they travel, turning only slightly toward the visitor when to the left
 * or right of the front.
 */
export const CABIN_TILT = 0.12;
/** How far a case that is not in front steps further back into the hall. */
export const RECEDE = 0.6;

/** Where the camera looks and the exhibit light falls: the front case's centre. */
export const FOCUS_POINT = [0, AXLE_Y - 0.1, WHEEL_DEPTH] as const;

export const HALL_COLOUR = '#070b14';
