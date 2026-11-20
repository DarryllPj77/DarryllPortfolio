import { useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { MeshBasicMaterial, MeshPhysicalMaterial, TextureLoader, type Group, type Mesh } from 'three';
import type { GalleryProject } from '../data';
import type { OrbitState } from '../orbit/OrbitState';
import { HexExhibit, type SharedExhibitParts } from './HexExhibit';
import { createBodyGeometry, createEdgeGeometry } from './hexGeometry';
import { createShadowTexture } from './hallTextures';
import { EXHIBIT_Y } from './layout';
import { placeOnRing } from './placement';
import { prepareScreenshots } from './textures';

/** A press that moved further than this (in pixels) was a drag, not a click. */
const CLICK_SLOP = 6;

interface OrbitProps {
  projects: GalleryProject[];
  orbit: OrbitState;
  /** A case was clicked: a side case comes to the front; the front case opens (phase 4). */
  onSelect: (index: number) => void;
  /** The pointer is over a case, or has left all of them. */
  onHover: (index: number | null) => void;
}

/**
 * The three display cases on their ring, each with its floor shadow and its reflection.
 * Every frame they are placed from the ring's live state, so turning costs no React render.
 */
export function Orbit({ projects, orbit, onSelect, onHover }: OrbitProps) {
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

  useFrame(() => {
    for (let i = 0; i < projects.length; i++) {
      const p = placeOnRing(i, orbit.angle, orbit.emphasis[i]);
      for (const g of [cases.current[i], reflections.current[i]]) {
        g?.position.set(p.x, EXHIBIT_Y, p.z);
        g?.rotation.set(0, p.yaw, 0);
      }
      // Laid flat, then turned with its case (a turn in the plane's own z is a turn about world y).
      shadows.current[i]?.position.set(p.x, 0.01, p.z);
      shadows.current[i]?.rotation.set(-Math.PI / 2, 0, p.yaw);
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
