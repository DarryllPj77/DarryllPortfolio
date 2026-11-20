import type { CameraPose } from './cameraPose';

/*
 * Level 1, the Gallery's lobby: an orbit of collection cards around a central object. Real
 * collections take the first slots; the rest are reserved for collections to come, so the orbit
 * is always whole without inventing any. Measurements in scene units (about a metre).
 *
 * The orbit is a ring tilted toward the visitor round a floating sculpture: its back rises and
 * its front dips, and the camera stands above it looking down, so it reads as an ellipse, the
 * front collection low and near, the far ones higher and deeper, the sculpture between them.
 * Only the ring is tilted; each card stands upright on it (leaning back a little toward the
 * camera), so it stays readable.
 */

/** Places on the orbit: the real collections, then reserved slots. */
export const LOBBY_SLOTS = 7;
/** From the central object to each card. */
export const LOBBY_RADIUS = 4.6;
/** A collection card: a tall display card with chamfered corners. */
export const CARD = { width: 1.5, height: 2.3, depth: 0.08, bevel: 0.03, chamfer: 0.24 } as const;
/** Height of the front card's centre: it floats over the floor. */
export const CARD_Y = CARD.height / 2 + 0.45;
/** The ring's tilt: its back rises by this angle (radians, 6°). */
export const ORBIT_TILT = (6 * Math.PI) / 180;
/** How far each card leans back, toward the camera above (radians). */
export const CARD_LEAN = 0.14;
/** Height of the ring's centre: the front of the tilted ring sits at CARD_Y. */
export const ORBIT_Y = CARD_Y + LOBBY_RADIUS * Math.sin(ORBIT_TILT);
/** The centrepiece: a lattice sculpture floating just above the middle of the ring. */
export const SCULPTURE = { y: ORBIT_Y + 0.5, radius: 1.15 } as const;

/** A full circle shared evenly between the slots. */
export const SLOT_TURN = (Math.PI * 2) / LOBBY_SLOTS;

/**
 * Where slot `i` stands when the orbit is turned by `angle` (0 puts slot 0 in front of the
 * camera). Each card faces outward from the central object, so the one in front faces the visitor.
 */
export function placeOnOrbit(i: number, angle: number): { x: number; y: number; z: number; yaw: number } {
  const a = Math.atan2(Math.sin(i * SLOT_TURN + angle), Math.cos(i * SLOT_TURN + angle));
  const flatZ = Math.cos(a) * LOBBY_RADIUS;
  return {
    x: Math.sin(a) * LOBBY_RADIUS,
    y: ORBIT_Y - flatZ * Math.sin(ORBIT_TILT),
    z: flatZ * Math.cos(ORBIT_TILT),
    yaw: a,
  };
}

/** The camera looks down on the ring at this angle (radians, 18°). */
const PITCH = (18 * Math.PI) / 180;
/**
 * Where it looks: this far (a share of its distance) below the middle of the ring, so the ring
 * sits in the upper part of the view, its front clear of the collection's placard below.
 */
const AIM_BELOW = { wide: 0.097, tall: 0.12 } as const;
/** On a wide screen the ring spans this share of the view's width. */
const RING_SPAN = 0.75;
/** At most this much height (scene units, half the view) at the ring: a very wide screen doesn't crop it. */
const HALF_HEIGHT = 4.6;

const tanHalf = (fov: number) => Math.tan(((fov / 2) * Math.PI) / 180);

/**
 * The lobby's resting view: from in front and above, looking down into the exhibition: the
 * whole tilted orbit round the sculpture, the front card largest and lowest. On a tall phone
 * screen it frames the front card, the sculpture above it and the neighbours at the edges.
 */
export function lobbyRestView(fov: number, aspect: number): CameraPose {
  const tanV = tanHalf(fov);
  const byWidth =
    aspect < 1
      ? (CARD.width * 1.45) / (tanV * aspect)
      : (LOBBY_RADIUS + CARD.width / 2 + 0.3) / (tanV * aspect * RING_SPAN);
  const distance = Math.max(HALF_HEIGHT / tanV, byWidth);
  const look: [number, number, number] = [0, ORBIT_Y - distance * (aspect < 1 ? AIM_BELOW.tall : AIM_BELOW.wide), 0];
  return {
    position: [0, look[1] + distance * Math.sin(PITCH), look[2] + distance * Math.cos(PITCH)],
    look,
    distance,
  };
}

/** Square on to the front card, until it fills most of the view: where entering a collection begins. */
export function cardCloseView(fov: number, aspect: number): CameraPose {
  const tanV = tanHalf(fov);
  const distance = Math.max(CARD.height / 2 / (0.8 * tanV), CARD.width / 2 / (0.8 * tanV * aspect));
  const front = placeOnOrbit(0, 0);
  const look: [number, number, number] = [0, front.y, front.z];
  return {
    position: [0, front.y + distance * Math.sin(CARD_LEAN), front.z + distance * Math.cos(CARD_LEAN)],
    look,
    distance,
  };
}
