import { useLayoutEffect, useMemo } from 'react';
import type { BufferGeometry, Material, Texture } from 'three';
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
  /**
   * 1 for the case in front of the visitor, 0 for the others: brightness of its screen and
   * of the lit line around it. Phase 3 animates it between the two.
   */
  emphasis: number;
}

/**
 * One display case: a bevelled graphite hexagon, the project's real screenshot filling its
 * hexagonal screen behind a thin layer of glass, and an indigo line that lights only on the
 * active case.
 */
export function HexExhibit({ parts, texture, image, focus, emphasis }: HexExhibitProps) {
  const faceGeometry = useMemo(() => createFaceGeometry(image, focus), [image, focus]);
  const faceMaterial = useMemo(() => createFaceMaterial(texture), [texture]);
  const edgeMaterial = useMemo(() => createEdgeMaterial(), []);

  useLayoutEffect(() => applyEmphasis(faceMaterial, edgeMaterial, emphasis), [emphasis, faceMaterial, edgeMaterial]);

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
