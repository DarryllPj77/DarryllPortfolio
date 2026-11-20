import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo } from 'react';
import type { BufferGeometry, Material, Texture } from 'three';
import type { OrbitState } from '../orbit/OrbitState';
import type { ShowState } from '../show/ShowState';
import { applyEmphasis, createEdgeMaterial, createFaceMaterial } from './exhibitMaterials';
import { createFaceGeometry, type FocalPoint } from './hexGeometry';
import { HEX_FRONT_Z } from './layout';

/** Geometry and materials every case shares: made once, used by all three and their reflections. */
export interface SharedExhibitParts {
  body: BufferGeometry;
  bodyMaterial: Material;
  edge: BufferGeometry;
  glassMaterial: Material;
}

interface HexExhibitProps {
  parts: SharedExhibitParts;
  texture: Texture;
  image: { width: number; height: number };
  focus: FocalPoint;
  /** The ring: how "in front" this case is decides its brightness and its lit line. */
  orbit: OrbitState;
  /** The moment under way: how much light it leaves this case. */
  show: ShowState;
  index: number;
}

/**
 * One display case: a bevelled graphite hexagon, the project's real screenshot filling its
 * hexagonal screen behind a thin layer of glass, and an indigo line that lights as the case
 * comes to the front.
 */
export function HexExhibit({ parts, texture, image, focus, orbit, show, index }: HexExhibitProps) {
  const faceGeometry = useMemo(() => createFaceGeometry(image, focus), [image, focus]);
  const faceMaterial = useMemo(() => createFaceMaterial(texture), [texture]);
  const edgeMaterial = useMemo(() => createEdgeMaterial(), []);

  useFrame(() => applyEmphasis(faceMaterial, edgeMaterial, orbit.emphasis[index], show.caseLight[index]));

  useLayoutEffect(
    () => () => {
      faceGeometry.dispose();
      faceMaterial.dispose();
      edgeMaterial.dispose();
    },
    [faceGeometry, faceMaterial, edgeMaterial],
  );

  return (
    <group>
      <mesh geometry={parts.body} material={parts.bodyMaterial} />
      <mesh geometry={faceGeometry} material={faceMaterial} position-z={HEX_FRONT_Z + 0.002} />
      <mesh geometry={faceGeometry} material={parts.glassMaterial} position-z={HEX_FRONT_Z + 0.012} />
      <mesh geometry={parts.edge} material={edgeMaterial} position-z={HEX_FRONT_Z + 0.004} />
    </group>
  );
}
