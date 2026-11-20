import { useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AdditiveBlending,
  Fog,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  RingGeometry,
  TextureLoader,
  type CanvasTexture,
  type Group,
  type PerspectiveCamera,
} from 'three';
import type { GalleryProject } from '../data';
import { ScrollStepper, scrollPixels } from '../orbit/scrollSteps';
import { easeInOut, easeOut } from '../show/choreography';
import type { CameraPose } from './cameraPose';
import {
  CARD_FRONT_Z,
  composeCollectionFace,
  composeReservedFace,
  createCardBody,
  createCardEdge,
  createCardFace,
} from './collectionCard';
import { Hall, type HallLight } from './Hall';
import { LobbySculpture } from './LobbySculpture';
import {
  CARD,
  CARD_LEAN,
  cardCloseView,
  LOBBY_RADIUS,
  LOBBY_SLOTS,
  lobbyRestView,
  ORBIT_TILT,
  ORBIT_Y,
  placeOnOrbit,
  SCULPTURE,
  SLOT_TURN,
} from './lobbyLayout';

/** One collection on the lobby's orbit. */
export interface LobbyExhibit {
  id: string;
  name: string;
  projects: GalleryProject[];
}

export interface LobbySceneProps {
  exhibits: LobbyExhibit[];
  /**
   * How far the orbit has been turned, in places: slot `position mod LOBBY_SLOTS` is in front.
   * It counts on past a full circle, so going round from the last place to the first is one step.
   */
  position: number;
  /** Coming back from this collection (the camera starts close on its card and steps back), or null. */
  returnFrom: string | null;
  /** The collection being entered (the camera is moving into its card), or null. */
  entering: string | null;
  /** The camera has reached the card: the collection takes over. */
  onEntered: (id: string) => void;
  /** A card on the orbit (slot `i`) was clicked or tapped. */
  onSelect: (slot: number) => void;
  /** The visitor turned the orbit by dragging or scrolling: this many places (positive = next). */
  onTurn: (steps: number) => void;
  reduced: boolean;
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixPose = (a: CameraPose, b: CameraPose, t: number): CameraPose => ({
  position: [mix(a.position[0], b.position[0], t), mix(a.position[1], b.position[1], t), mix(a.position[2], b.position[2], t)],
  look: [mix(a.look[0], b.look[0], t), mix(a.look[1], b.look[1], t), mix(a.look[2], b.look[2], t)],
  distance: mix(a.distance, b.distance, t),
});

/** How "in front" a slot is at an orbit angle: 1 squarely in front, 0 by 60% of the way to the next. */
function frontness(i: number, angle: number) {
  const off = Math.abs(Math.atan2(Math.sin(i * SLOT_TURN + angle), Math.cos(i * SLOT_TURN + angle)));
  const t = Math.max(0, 1 - off / (SLOT_TURN * 0.6));
  return t * t * (3 - 2 * t);
}

/** Puts a picture on a card's face. */
function setFace(face: MeshBasicMaterial, picture: CanvasTexture) {
  face.map = picture;
  face.needsUpdate = true;
}

/**
 * A card's brightness and lit edge, for how "in front" it is and the light in the hall. A
 * reserved card brightens a little in front but never takes the lit edge: only a collection does.
 */
function lightCard(face: MeshBasicMaterial, edge: MeshBasicMaterial, emphasis: number, hall: number, real: boolean) {
  face.color.setScalar((0.32 + (real ? 0.68 : 0.3) * emphasis) * hall);
  edge.opacity = real ? 0.9 * emphasis * hall : 0;
  edge.visible = edge.opacity > 0.01;
}

const ARRIVE_S = 1.4;
const RETURN_S = 0.9;
const ENTER_S = 1.0;
const REDUCED_S = 0.25;
/** Dragging this many pixels turns the orbit by one place. */
const DRAG_PX_PER_PLACE = 180;
/** A pointer that moved further than this (px) was dragging, not clicking a card. */
const CLICK_SLOP = 6;

/**
 * Level 1 of the Gallery, its lobby: the hall after hours with a horizontal orbit of collection
 * cards around a central object. Real collections take the first places on the orbit, each card
 * showing its own works; the remaining places are reserved for collections to come (blank,
 * engraved cards, nothing pretending to be there). Choosing the card in front moves the camera
 * into it as the hall darkens, and the collection's own room opens from the dark.
 */
export default function LobbyScene({
  exhibits,
  position,
  returnFrom,
  entering,
  onEntered,
  onSelect,
  onTurn,
  reduced,
}: LobbySceneProps) {
  const get = useThree((s) => s.get);
  const invalidate = useThree((s) => s.invalidate);

  /* ---------- parts ---------- */

  const parts = useMemo(
    () => ({
      body: createCardBody(),
      face: createCardFace(),
      edge: createCardEdge(),
      bodyMaterial: new MeshPhysicalMaterial({
        color: '#1c2230',
        metalness: 0.85,
        roughness: 0.34,
        clearcoat: 0.6,
        clearcoatRoughness: 0.22,
      }),
      orbitLine: new RingGeometry(LOBBY_RADIUS - 0.012, LOBBY_RADIUS + 0.012, 160),
      lineMaterial: new MeshBasicMaterial({ color: '#475569', transparent: true, opacity: 0.6, depthWrite: false }),
    }),
    [],
  );

  // Every card's face (real collections drawn from their covers once the fonts are ready).
  const covers = useLoader(
    TextureLoader,
    exhibits.flatMap((e) => e.projects.map((p) => p.cover.src)),
  );
  const reservedFace = useMemo(() => composeReservedFace(), []);
  const [faces, setFaces] = useState<CanvasTexture[] | null>(null);
  useEffect(() => {
    let alive = true;
    let made: CanvasTexture[] = [];
    void (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (!alive) return;
      let k = 0;
      made = exhibits.map((e) =>
        composeCollectionFace(
          e.name,
          e.projects,
          e.projects.map(() => covers[k++].image as HTMLImageElement),
        ),
      );
      setFaces(made);
      invalidate();
    });
    return () => {
      alive = false;
      for (const t of made) t.dispose();
    };
  }, [exhibits, covers, invalidate]);

  /** Each slot's own materials: its face picture, and its lit edge. */
  const slots = useMemo(
    () =>
      Array.from({ length: LOBBY_SLOTS }, () => ({
        face: new MeshBasicMaterial({ toneMapped: false }),
        edge: new MeshBasicMaterial({
          color: '#818cf8',
          transparent: true,
          blending: AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        }),
      })),
    [],
  );
  useEffect(() => {
    slots.forEach((s, i) => setFace(s.face, (faces && faces[i]) ?? reservedFace));
    invalidate();
  }, [slots, faces, reservedFace, invalidate]);

  useEffect(
    () => () => {
      for (const g of [parts.body, parts.face, parts.edge, parts.orbitLine]) g.dispose();
      for (const m of [parts.bodyMaterial, parts.lineMaterial]) m.dispose();
      for (const s of slots) {
        s.face.dispose();
        s.edge.dispose();
      }
      reservedFace.dispose();
    },
    [parts, slots, reservedFace],
  );

  /* ---------- the moment ---------- */

  const level = useRef({ hall: 0, lamp: 0 });
  const light = useMemo<HallLight>(() => ({ hall: () => level.current.hall, lamp: () => level.current.lamp }), []);
  const sculptureLight = useMemo(() => () => level.current.hall / 0.9, []);

  /** Orbit turn (slot `position` in front at rest), and the progress of arriving and entering. */
  const angle = useRef(-position * SLOT_TURN + (returnFrom ? 0 : SLOT_TURN * 0.5));
  /**
   * Extra turn from a drag (radians). On release the drag's whole places go to `position`; the
   * nudge is cleared when that new position arrives (`nudgeFor` is the position it belongs to).
   */
  const nudge = useRef(0);
  const nudgeFor = useRef(position);
  const dragging = useRef(false);
  const arrive = useRef(0);
  const walk = useRef(0);
  const handedOver = useRef(false);
  const cards = useRef<(Group | null)[]>([]);

  useEffect(() => {
    walk.current = 0;
    handedOver.current = false;
    invalidate();
  }, [entering, invalidate]);
  useEffect(() => {
    invalidate();
  }, [position, invalidate]);

  // Dragging sideways turns the orbit with the pointer; scrolling turns it one place per gesture.
  const turnRef = useRef(onTurn);
  useEffect(() => {
    turnRef.current = onTurn;
  });
  const interactive = !entering;
  useEffect(() => {
    if (!interactive) return;
    const el = get().gl.domElement;
    el.style.cursor = 'grab';
    let drag: { id: number; x: number; base: number } | null = null;
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || drag) return;
      drag = { id: e.pointerId, x: e.clientX, base: nudge.current };
      dragging.current = true;
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      nudge.current = drag.base + ((e.clientX - drag.x) / DRAG_PX_PER_PLACE) * SLOT_TURN;
      if (Math.abs(e.clientX - drag.x) > CLICK_SLOP) el.style.cursor = 'grabbing';
      invalidate();
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      dragging.current = false;
      el.style.cursor = 'grab';
      // Dragging right brings the card on the left to the front (a step back), and the reverse.
      // The orbit holds where the pointer left it until the new position arrives, then eases
      // into place from there.
      const steps = -Math.round(nudge.current / SLOT_TURN);
      if (steps !== 0) turnRef.current(steps);
      else nudge.current = 0;
      invalidate();
    };
    const stepper = new ScrollStepper();
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const step = stepper.push(scrollPixels(delta, e.deltaMode, el.clientHeight), e.timeStamp);
      if (step !== 0) turnRef.current(step);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
      // The canvas stays for the collection, which sets its own cursor.
      el.style.cursor = '';
    };
  }, [interactive, get, invalidate]);

  useFrame((state, dt) => {
    const camera = state.camera as PerspectiveCamera;
    const aspect = state.size.width / state.size.height;
    let moving = false;

    const arriveS = reduced ? REDUCED_S : returnFrom ? RETURN_S : ARRIVE_S;
    if (arrive.current < 1) {
      arrive.current = Math.min(1, arrive.current + dt / arriveS);
      moving = true;
    }
    if (entering && walk.current < 1) {
      walk.current = Math.min(1, walk.current + dt / (reduced ? REDUCED_S : ENTER_S));
      moving = true;
    }

    // The orbit eases toward the card in front (and, arriving fresh, turns into place).
    // A finished drag's turn has arrived in `position`: the nudge is done.
    if (nudgeFor.current !== position) {
      nudgeFor.current = position;
      nudge.current = 0;
    }
    const target = -position * SLOT_TURN + nudge.current;
    // Following a finger closely; settling more gently.
    const k = 1 - Math.exp(-dt * (reduced ? 30 : dragging.current ? 22 : 5));
    const before = angle.current;
    angle.current += (target - angle.current) * k;
    if (Math.abs(target - angle.current) > 1e-4) moving = true;
    else angle.current = target;
    if (Math.abs(before - angle.current) > 1e-6) moving = true;

    // Light: a fresh arrival fades up; entering fades to dark; returning comes up from dark.
    const a = easeOut(arrive.current);
    const w = easeInOut(walk.current);
    level.current.hall = 0.9 * a * (1 - w);
    level.current.lamp = a * (1 - 0.6 * w);

    // Camera: at rest across the room; into the card when entering; out of it when returning.
    const rest = lobbyRestView(camera.fov, aspect);
    const close = cardCloseView(camera.fov, aspect);
    let pose = rest;
    if (entering) pose = mixPose(rest, close, w);
    else if (returnFrom && arrive.current < 1) pose = mixPose(close, rest, a);
    camera.position.set(...pose.position);
    camera.lookAt(...pose.look);
    const { scene } = get();
    if (scene.fog instanceof Fog) {
      scene.fog.near = pose.distance + 1;
      scene.fog.far = pose.distance + LOBBY_RADIUS * 2 + 10;
    }

    // Cards around the orbit, each lit by how "in front" it is.
    for (let i = 0; i < LOBBY_SLOTS; i++) {
      const p = placeOnOrbit(i, angle.current);
      cards.current[i]?.position.set(p.x, p.y, p.z);
      cards.current[i]?.rotation.set(-CARD_LEAN, p.yaw, 0, 'YXZ');
      const real = i < exhibits.length;
      lightCard(slots[i].face, slots[i].edge, frontness(i, angle.current), level.current.hall + 0.1, real);
    }

    if (entering && walk.current >= 1 && !handedOver.current) {
      handedOver.current = true;
      onEntered(entering);
    }
    if (moving) state.invalidate();
  });

  const front0 = placeOnOrbit(0, 0);
  const cursor = (value: string) => {
    get().gl.domElement.style.cursor = value;
  };
  const choose = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!entering && e.delta <= CLICK_SLOP) onSelect(i);
  };

  return (
    <>
      <Hall light={light} focus={[front0.x, front0.y, front0.z]} />
      {/* The centrepiece the collections orbit. */}
      <LobbySculpture position={[0, SCULPTURE.y, 0]} radius={SCULPTURE.radius} level={sculptureLight} reduced={reduced} />
      {/* The orbit: a ring tilted toward the visitor, just under the cards. */}
      <group position={[0, ORBIT_Y, 0]} rotation-x={ORBIT_TILT}>
        <mesh geometry={parts.orbitLine} material={parts.lineMaterial} position-y={-CARD.height / 2 - 0.14} rotation-x={-Math.PI / 2} />
      </group>
      {slots.map((s, i) => {
        return (
          <group
            key={i}
            ref={(g) => {
              cards.current[i] = g;
            }}
            onClick={choose(i)}
            onPointerOver={() => cursor('pointer')}
            onPointerOut={() => cursor(entering ? '' : 'grab')}
          >
            <mesh geometry={parts.body} material={parts.bodyMaterial} />
            <mesh geometry={parts.face} material={s.face} position-z={CARD_FRONT_Z + 0.002} />
            <mesh geometry={parts.edge} material={s.edge} position-z={CARD_FRONT_Z + 0.004} />
          </group>
        );
      })}
    </>
  );
}
