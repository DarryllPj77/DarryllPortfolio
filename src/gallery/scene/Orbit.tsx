import { useLoader, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo } from 'react';
import { MeshBasicMaterial, MeshPhysicalMaterial, TextureLoader } from 'three';
import type { GalleryProject } from '../data';
import { HexExhibit, type SharedExhibitParts } from './HexExhibit';
import { createBodyGeometry, createEdgeGeometry } from './hexGeometry';
import { createShadowTexture } from './hallTextures';
import { EXHIBIT_Y } from './layout';
import { placeOnRing } from './placement';
import { prepareScreenshots } from './textures';

interface OrbitProps {
  projects: GalleryProject[];
  /** Ring turn in radians. */
  ringAngle: number;
  /** 0…1 for each case, see HexExhibit. */
  emphasis: number[];
}

/** The three display cases on their ring, each with its floor shadow and its reflection. */
export function Orbit({ projects, ringAngle, emphasis }: OrbitProps) {
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

  const cases = projects.map((project, i) => {
    const place = placeOnRing(i, ringAngle, emphasis[i] ?? 0);
    return { project, place, texture: textures[i], emphasis: emphasis[i] ?? 0 };
  });

  const renderCases = (key: string) =>
    cases.map(({ project, place, texture, emphasis: e }) => (
      <group key={`${key}-${project.slug}`} position={[place.x, EXHIBIT_Y, place.z]} rotation-y={place.yaw}>
        <HexExhibit parts={parts} texture={texture} image={project.cover} focus={project.focus} emphasis={e} />
      </group>
    ));

  return (
    <>
      {renderCases('case')}
      {/* The floor's reflection: the same cases, mirrored below it, seen through its gloss. */}
      <group scale-y={-1}>{renderCases('reflection')}</group>
      {cases.map(({ project, place }) => (
        <mesh
          key={`shadow-${project.slug}`}
          position={[place.x, 0.01, place.z]}
          // Laid flat, then turned with its case (a turn in the plane's own z is a turn about world y).
          rotation={[-Math.PI / 2, 0, place.yaw]}
          material={shadow}
          renderOrder={2}
        >
          <planeGeometry args={[3.8, 1.3]} />
        </mesh>
      ))}
    </>
  );
}
