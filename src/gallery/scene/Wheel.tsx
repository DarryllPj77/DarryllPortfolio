import { useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  TextureLoader,
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
import { FACE_RADIUS, HEX_FRONT_Z, HEX_HALF_HEIGHT } from './layout';
import { placeOnWheel } from './placement';
import { useQuality } from './qualityContext';
import { prepareScreenshots } from './textures';

/** A press that moved further than this (in pixels) was a drag, not a click. */
const CLICK_SLOP = 6;

/** A case's floor shadow: darkest just above the floor, gone by two units up. */
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

/* ---------- one copy of the wheel (the real one, or its reflection) ---------- */

interface WheelBodyProps {
  projects: GalleryProject[];
  textures: Texture[];
  parts: SharedExhibitParts;
  orbit: OrbitState;
  show: ShowState;
  glass: boolean;
  /** The real wheel takes clicks and measures the opened screen; its reflection does neither. */
  interactive?: { onSelect: (index: number) => void; onHover: (index: number | null) => void };
}

/**
 * The ring: the cases alone, travelling their level path upright, with no frame to carry
 * them. Placed from the live turning state every frame, so turning costs no React render.
 */
function WheelBody({ projects, textures, parts, orbit, show, glass, interactive }: WheelBodyProps) {
  const count = projects.length;
  const cabins = useRef<(Group | null)[]>([]);

  useFrame((state) => {
    const angle = orbit.angle + show.turn;
    for (let i = 0; i < count; i++) {
      const p = placeOnWheel(i, angle, orbit.emphasis[i], count, show.withdraw[i]);
      // During the entrance each cabin still has some way to come from deep in the hall.
      const z = p.z - show.depth[i];
      cabins.current[i]?.position.set(p.x, p.y, z);
      cabins.current[i]?.rotation.set(0, p.yaw, 0);
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
      {projects.map((project, i) => (
        <group key={project.slug}>
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
  /**
   * The lobby's scale model: no floor reflection or shadows (it stands on a plinth) and no
   * clicks of its own (the whole model is the way in).
   */
  still?: boolean;
  /** A cabin was clicked: another one comes to the front; the front one opens. */
  onSelect?: (index: number) => void;
  /** The pointer is over a cabin, or has left all of them. */
  onHover?: (index: number | null) => void;
}

/**
 * The hexagon carousel: the collection's projects as display cases travelling a level ring
 * about an unseen vertical axis, the front one large and near, the others far behind it to
 * either side; with their reflection in the floor and each case's shadow.
 */
export function Wheel({ projects, orbit, show, still = false, onSelect, onHover }: WheelProps) {
  // The lighter setting leaves out the floor reflection and the glass sheen.
  const high = useQuality() === 'high';
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
      shadows[0]?.map?.dispose();
      for (const s of shadows) s.dispose();
    },
    [parts, shadows],
  );

  const shadowMeshes = useRef<(Mesh | null)[]>([]);
  useFrame(() => {
    if (still) return;
    const angle = orbit.angle + show.turn;
    for (let i = 0; i < projects.length; i++) {
      const p = placeOnWheel(i, angle, orbit.emphasis[i], projects.length, show.withdraw[i]);
      const mesh = shadowMeshes.current[i];
      if (!mesh) continue;
      mesh.position.set(p.x, 0.01, p.z - show.depth[i]);
      shadeFloor(shadows[i], p.y);
    }
  });

  return (
    <>
      <WheelBody
        projects={projects}
        textures={textures}
        parts={parts}
        orbit={orbit}
        show={show}
        glass={high}
        interactive={still ? undefined : { onSelect: onSelect ?? (() => {}), onHover: onHover ?? (() => {}) }}
      />
      {/* The floor's reflection: the same wheel, mirrored below it, seen through its gloss. */}
      <group scale-y={-1} visible={high && !still}>
        <WheelBody
          projects={projects}
          textures={textures}
          parts={parts}
            orbit={orbit}
          show={show}
          glass={false}
        />
      </group>
      {(still ? [] : projects).map((project, i) => (
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
