import { useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { MeshBasicMaterial, MeshPhysicalMaterial, TextureLoader, Vector3, type Group, type Mesh } from 'three';
import type { GalleryProject } from '../data';
import type { OrbitState } from '../orbit/OrbitState';
import type { ScreenRect, ShowState } from '../show/ShowState';
import { HexExhibit, type SharedExhibitParts } from './HexExhibit';
import { createBodyGeometry, createEdgeGeometry } from './hexGeometry';
import { createShadowTexture } from './hallTextures';
import { EXHIBIT_Y, FACE_RADIUS, HEX_FRONT_Z } from './layout';
import { placeOnRing } from './placement';
import { prepareScreenshots } from './textures';

/** A press that moved further than this (in pixels) was a drag, not a click. */
const CLICK_SLOP = 6;

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

interface OrbitProps {
  projects: GalleryProject[];
  orbit: OrbitState;
  show: ShowState;
  /** A case was clicked: a side case comes to the front; the front case opens (phase 4). */
  onSelect: (index: number) => void;
  /** The pointer is over a case, or has left all of them. */
  onHover: (index: number | null) => void;
}

/**
 * The three display cases on their ring, each with its floor shadow and its reflection.
 * Every frame they are placed from the ring's live state, so turning costs no React render.
 */
export function Orbit({ projects, orbit, show, onSelect, onHover }: OrbitProps) {
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
  const shadow = useMemo(() => {
    const map = createShadowTexture();
    return new MeshBasicMaterial({ map, transparent: true, depthWrite: false, color: '#000000' });
  }, []);
  useEffect(
    () => () => {
      parts.body.dispose();
      parts.edge.dispose();
      parts.bodyMaterial.dispose();
      parts.glassMaterial.dispose();
      shadow.map?.dispose();
      shadow.dispose();
    },
    [parts, shadow],
  );

  const cases = useRef<(Group | null)[]>([]);
  const reflections = useRef<(Group | null)[]>([]);
  const shadows = useRef<(Mesh | null)[]>([]);

  useFrame((state) => {
    for (let i = 0; i < projects.length; i++) {
      const p = placeOnRing(i, orbit.angle + show.turn, orbit.emphasis[i], show.withdraw[i]);
      // During the entrance each case still has some way to come from deep in the hall.
      const z = p.z - show.depth[i];
      for (const g of [cases.current[i], reflections.current[i]]) {
        g?.position.set(p.x, EXHIBIT_Y, z);
        g?.rotation.set(0, p.yaw, 0);
      }
      // Laid flat, then turned with its case (a turn in the plane's own z is a turn about world y).
      shadows.current[i]?.position.set(p.x, 0.01, z);
      shadows.current[i]?.rotation.set(-Math.PI / 2, 0, p.yaw);
    }
    // While a case opens, measure where its screen is on the page: the presentation starts
    // its screenshot exactly there.
    const opened = cases.current[show.opened];
    if ((show.phase === 'opening' || show.phase === 'open') && opened) {
      opened.updateWorldMatrix(true, false);
      show.setScreenRect(screenRectOf(opened, state.camera, state.size));
    }
  });

  const click = (index: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > CLICK_SLOP || orbit.isDragging) return;
    onSelect(index);
  };

  return (
    <>
      {projects.map((project, i) => (
        <group
          key={`case-${project.slug}`}
          ref={(g) => {
            cases.current[i] = g;
          }}
          onClick={click(i)}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(i);
          }}
          onPointerOut={() => onHover(null)}
        >
          <HexExhibit
            parts={parts}
            texture={textures[i]}
            image={project.cover}
            focus={project.focus}
            orbit={orbit}
            show={show}
            index={i}
          />
        </group>
      ))}
      {/* The floor's reflection: the same cases, mirrored below it, seen through its gloss. */}
      <group scale-y={-1}>
        {projects.map((project, i) => (
          <group
            key={`reflection-${project.slug}`}
            ref={(g) => {
              reflections.current[i] = g;
            }}
          >
            <HexExhibit
              parts={parts}
              texture={textures[i]}
              image={project.cover}
              focus={project.focus}
              orbit={orbit}
              show={show}
              index={i}
            />
          </group>
        ))}
      </group>
      {projects.map((project, i) => (
        <mesh
          key={`shadow-${project.slug}`}
          ref={(m) => {
            shadows.current[i] = m;
          }}
          material={shadow}
          renderOrder={2}
        >
          <planeGeometry args={[3.8, 1.3]} />
        </mesh>
      ))}
    </>
  );
}
