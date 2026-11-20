import { AdditiveBlending, Color, MeshBasicMaterial, type Texture } from 'three';

/**
 * Inactive screens keep this much of their (linear) brightness: about 45% as displayed, so the
 * cases behind the front one read as clearly further back, even a mostly white screenshot.
 */
const DIMMED = 0.17;
const EDGE = new Color('#818cf8');

/** The screenshot: unlit and not tone-mapped, so the UI keeps its true colours. */
export const createFaceMaterial = (texture: Texture) => new MeshBasicMaterial({ map: texture, toneMapped: false });

/** The indigo line around the active case's screen. */
export const createEdgeMaterial = () =>
  new MeshBasicMaterial({
    color: EDGE,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });

/**
 * Brightness of the screen and of the lit line, for an emphasis from 0 (background) to 1
 * (in front), times the light the moment leaves it (the entrance, or another case opening).
 */
export function applyEmphasis(face: MeshBasicMaterial, edge: MeshBasicMaterial, emphasis: number, light = 1): void {
  face.color.setScalar((DIMMED + (1 - DIMMED) * emphasis) * light);
  edge.opacity = 0.9 * emphasis * light;
  edge.visible = emphasis * light > 0.01;
}
