import { useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  CylinderGeometry,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Quaternion,
  TextureLoader,
  TorusGeometry,
  Vector3,
  type Group,
  type Mesh,
  type Texture,
} from 'three';
import type { GalleryProject } from '../data';
import type { OrbitState } from '../orbit/OrbitState';
import type { ScreenRect, ShowState } from '../show/ShowState';
import { HexExhibit, type SharedExhibitParts } from './HexExhibit';
import { createBodyGeometry, createEdgeGeometry } from './hexGeometry';
import { createShadowTexture } from './hallTextures';
import { AXLE_HALF, AXLE_Y, FACE_RADIUS, HEX_FRONT_Z, HEX_HALF_HEIGHT, RIM_X, WHEEL_RADIUS } from './layout';
import { placeOnWheel, rimPoint } from './placement';
import type { Quality } from './quality';
import { prepareScreenshots } from './textures';

/** A press that moved further than this (in pixels) was a drag, not a click. */
const CLICK_SLOP = 6;

/** A cabin's floor shadow: darkest when it passes just above the floor, gone by two units up. */
function shadeFloor(material: MeshBasicMaterial, cabinY: number) {
  const bottom = cabinY - HEX_HALF_HEIGHT;
  material.opacity = Math.max(0, Math.min(0.9, 1 - bottom / 2));
}

/** The screen's bounding box in the case's own space: its six corners, just in front of the body. */
const FACE_CORNERS = Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 3) * i;
  return new Vector3(Math.cos(a) * FACE_RADIUS, Math.sin(a) * FACE_RADIUS, HEX_FRONT_Z);
});
const corner = new Vector3();

/** Where a case's hexagonal screen appears on the page: its bounding box in CSS pixels. */
function screenRectOf(
  group: Group,
  camera: Parameters<Vector3['project']>[0],
  size: { width: number; height: number; left: number; top: number },
): ScreenRect {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of FACE_CORNERS) {
    corner.copy(c).applyMatrix4(group.matrixWorld).project(camera);
    const x = ((corner.x + 1) / 2) * size.width + size.left;
    const y = ((1 - corner.y) / 2) * size.height + size.top;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
}

/* ---------- the frame: rods, rims and hub ---------- */

const UP = new Vector3(0, 1, 0);
const from = new Vector3();
const to = new Vector3();
const dir = new Vector3();
const spin = new Quaternion();

/** Lays a unit-length rod (a cylinder one unit tall) from point a to point b. */
function setRod(rod: Mesh | null, a: Vector3, b: Vector3) {
  if (!rod) return;
  dir.subVectors(b, a);
  const length = dir.length();
  rod.position.copy(a).addScaledVector(dir, 0.5);
  rod.quaternion.copy(spin.setFromUnitVectors(UP, dir.normalize()));
  rod.scale.set(1, length, 1);
}

/** The wheel's metal: the same graphite family as the cabins, a touch rougher. */
interface FrameParts {
  rod: CylinderGeometry;
  thinRod: CylinderGeometry;
  rim: TorusGeometry;
  hub: CylinderGeometry;
  metal: MeshStandardMaterial;
}

const HUB_HALF = 0.21;

/* ---------- one copy of the wheel (the real one, or its reflection) ---------- */

interface WheelBodyProps {
  projects: GalleryProject[];
  textures: Texture[];
  parts: SharedExhibitParts;
  frame: FrameParts;
  orbit: OrbitState;
  show: ShowState;
  glass: boolean;
  /** The real wheel takes clicks and measures the opened screen; its reflection does neither. */
  interactive?: { onSelect: (index: number) => void; onHover: (index: number | null) => void };
}

/**
 * The wheel: a hexagonal hub on a horizontal axle, twin rims, spokes and a crossbar per cabin,
 * on an A-frame stand; the cabins ride it upright. Placed from the live turning state every
 * frame, so turning costs no React render.
 */
function WheelBody({ projects, textures, parts, frame, orbit, show, glass, interactive }: WheelBodyProps) {
  const count = projects.length;
  const cabins = useRef<(Group | null)[]>([]);
  const spokes = useRef<(Mesh | null)[]>([]);
  const bars = useRef<(Mesh | null)[]>([]);
  const hub = useRef<Group>(null);
  const axle = useRef<Mesh>(null);
  const legs = useRef<(Mesh | null)[]>([]);

  // The stand: an axle out past the rims, and two legs each side down to the floor.
  useLayoutEffect(() => {
    setRod(axle.current, from.set(-AXLE_HALF, AXLE_Y, 0), to.set(AXLE_HALF, AXLE_Y, 0));
    [-1, 1].forEach((side, s) =>
      [-1, 1].forEach((depth, d) => {
        setRod(
          legs.current[s * 2 + d],
          from.set(side * AXLE_HALF, AXLE_Y, 0),
          to.set(side * (AXLE_HALF + 0.45), 0, depth * 1.9),
        );
      }),
    );
  }, []);

  useFrame((state) => {
    const angle = orbit.angle + show.turn;
    if (hub.current) hub.current.rotation.x = angle;
    for (let i = 0; i < count; i++) {
      const p = placeOnWheel(i, angle, orbit.emphasis[i], count, show.withdraw[i]);
      // During the entrance each cabin still has some way to come from deep in the hall.
      const z = p.z - show.depth[i];
      cabins.current[i]?.position.set(0, p.y, z);
      cabins.current[i]?.rotation.set(p.pitch, 0, 0);
      // The frame turns as one: spokes from the hub to the rims, a crossbar between the rims.
      const rim = rimPoint(i, angle, count);
      const rz = rim.z - show.depth[i];
      setRod(spokes.current[i * 2], from.set(-HUB_HALF, AXLE_Y, 0), to.set(-RIM_X, rim.y, rz));
      setRod(spokes.current[i * 2 + 1], from.set(HUB_HALF, AXLE_Y, 0), to.set(RIM_X, rim.y, rz));
      setRod(bars.current[i], from.set(-RIM_X, rim.y, rz - 0.12), to.set(RIM_X, rim.y, rz - 0.12));
    }
    // While a cabin opens, measure where its screen is on the page: the presentation starts
    // its screenshot exactly there.
    const opened = cabins.current[show.opened];
    if (interactive && (show.phase === 'opening' || show.phase === 'open') && opened) {
      opened.updateWorldMatrix(true, false);
      show.setScreenRect(screenRectOf(opened, state.camera, state.size));
    }
  });

  const click = (index: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > CLICK_SLOP || orbit.isDragging) return;
    interactive?.onSelect(index);
  };

  return (
    <group>
      {/* Hub (it turns with the wheel), rims, axle and legs. */}
      <group ref={hub} position={[0, AXLE_Y, 0]}>
        <mesh geometry={frame.hub} material={frame.metal} rotation-z={Math.PI / 2} />
      </group>
      {[-RIM_X, RIM_X].map((x) => (
        <mesh key={x} geometry={frame.rim} material={frame.metal} position={[x, AXLE_Y, 0]} rotation-y={Math.PI / 2} />
      ))}
      <mesh ref={axle} geometry={frame.rod} material={frame.metal} />
      {[0, 1, 2, 3].map((n) => (
        <mesh
          key={`leg-${n}`}
          ref={(m) => {
            legs.current[n] = m;
          }}
          geometry={frame.rod}
          material={frame.metal}
        />
      ))}
      {projects.map((project, i) => (
        <group key={project.slug}>
          {[0, 1].map((side) => (
            <mesh
              key={side}
              ref={(m) => {
                spokes.current[i * 2 + side] = m;
              }}
              geometry={frame.thinRod}
              material={frame.metal}
            />
          ))}
          <mesh
            ref={(m) => {
              bars.current[i] = m;
            }}
            geometry={frame.thinRod}
            material={frame.metal}
          />
          <group
            ref={(g) => {
              cabins.current[i] = g;
            }}
            onClick={interactive ? click(i) : undefined}
            onPointerOver={
              interactive
                ? (e) => {
                    e.stopPropagation();
                    interactive.onHover(i);
                  }
                : undefined
            }
            onPointerOut={interactive ? () => interactive.onHover(null) : undefined}
          >
            <HexExhibit
              parts={parts}
              texture={textures[i]}
              image={project.cover}
              focus={project.focus}
              orbit={orbit}
              show={show}
              index={i}
              glass={glass}
            />
          </group>
        </group>
      ))}
    </group>
  );
}

/* ---------- the exhibit ---------- */

interface WheelProps {
  projects: GalleryProject[];
  orbit: OrbitState;
  show: ShowState;
  /** "low" leaves out the floor reflection and the glass sheen. */
  quality: Quality;
  /** A cabin was clicked: another one comes to the front; the front one opens. */
  onSelect: (index: number) => void;
  /** The pointer is over a cabin, or has left all of them. */
  onHover: (index: number | null) => void;
}

/**
 * The vertical wheel: the collection's projects as display cases riding a wheel that turns
 * about a horizontal axle, with the wheel's reflection in the floor and each cabin's shadow
 * when it passes low.
 */
export function Wheel({ projects, orbit, show, quality, onSelect, onHover }: WheelProps) {
  const high = quality === 'high';
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const textures = useLoader(
    TextureLoader,
    projects.map((p) => p.cover.src),
  );
  useLayoutEffect(() => {
    prepareScreenshots(textures, gl);
    // The hall draws on demand: show the screenshots as soon as they are ready.
    invalidate();
  }, [textures, gl, invalidate]);
  // Leaving the scene releases the screenshots from graphics memory. The loader's cache is
  // deliberately kept: clearing it made each re-render reload the screenshots, and the scene
  // drew nothing while it did (the cases blinked out). A released texture is uploaded again.
  useEffect(
    () => () => {
      for (const t of textures) t.dispose();
    },
    [textures],
  );

  const parts = useMemo<SharedExhibitParts>(
    () => ({
      body: createBodyGeometry(),
      // Graphite anodised metal with a clear coat: the bevels catch the studio reflections.
      bodyMaterial: new MeshPhysicalMaterial({
        color: '#1c2230',
        metalness: 0.85,
        roughness: 0.34,
        clearcoat: 0.6,
        clearcoatRoughness: 0.22,
      }),
      edge: createEdgeGeometry(),
      // The glass in front of each screen: almost invisible, it only carries a soft sheen.
      glassMaterial: new MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0,
        roughness: 0.06,
        transparent: true,
        opacity: 0.07,
        depthWrite: false,
      }),
    }),
    [],
  );
  const frame = useMemo<FrameParts>(
    () => ({
      rod: new CylinderGeometry(0.05, 0.05, 1, 8),
      thinRod: new CylinderGeometry(0.02, 0.02, 1, 6),
      rim: new TorusGeometry(WHEEL_RADIUS, 0.024, 6, 144),
      hub: new CylinderGeometry(0.42, 0.42, HUB_HALF * 2, 6),
      metal: new MeshStandardMaterial({ color: '#262d3b', metalness: 0.85, roughness: 0.4 }),
    }),
    [],
  );
  // One shadow per cabin, so each can fade with its own height above the floor.
  const shadows = useMemo(() => {
    const map = createShadowTexture();
    return projects.map(() => new MeshBasicMaterial({ map, transparent: true, depthWrite: false, color: '#000000' }));
  }, [projects]);
  useEffect(
    () => () => {
      parts.body.dispose();
      parts.edge.dispose();
      parts.bodyMaterial.dispose();
      parts.glassMaterial.dispose();
      frame.rod.dispose();
      frame.thinRod.dispose();
      frame.rim.dispose();
      frame.hub.dispose();
      frame.metal.dispose();
      shadows[0]?.map?.dispose();
      for (const s of shadows) s.dispose();
    },
    [parts, frame, shadows],
  );

  const shadowMeshes = useRef<(Mesh | null)[]>([]);
  useFrame(() => {
    const angle = orbit.angle + show.turn;
    for (let i = 0; i < projects.length; i++) {
      const p = placeOnWheel(i, angle, orbit.emphasis[i], projects.length, show.withdraw[i]);
      const mesh = shadowMeshes.current[i];
      if (!mesh) continue;
      mesh.position.set(0, 0.01, p.z - show.depth[i]);
      shadeFloor(shadows[i], p.y);
    }
  });

  return (
    <>
      <WheelBody
        projects={projects}
        textures={textures}
        parts={parts}
        frame={frame}
        orbit={orbit}
        show={show}
        glass={high}
        interactive={{ onSelect, onHover }}
      />
      {/* The floor's reflection: the same wheel, mirrored below it, seen through its gloss. */}
      <group scale-y={-1} visible={high}>
        <WheelBody
          projects={projects}
          textures={textures}
          parts={parts}
          frame={frame}
          orbit={orbit}
          show={show}
          glass={false}
        />
      </group>
      {projects.map((project, i) => (
        <mesh
          key={`shadow-${project.slug}`}
          ref={(m) => {
            shadowMeshes.current[i] = m;
          }}
          material={shadows[i]}
          rotation-x={-Math.PI / 2}
          renderOrder={2}
        >
          <planeGeometry args={[3.8, 1.3]} />
        </mesh>
      ))}
    </>
  );
}
