import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Path, Shape, ShapeGeometry } from 'three';
import { FACE_RADIUS, HEX_BEVEL, HEX_DEPTH, HEX_RADIUS } from './layout';

/** The six corners of a flat-topped hexagon (a corner on the right, flat edges top and bottom). */
export function hexCorners(radius: number): [number, number][] {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return [Math.cos(a) * radius, Math.sin(a) * radius];
  });
}

function hexPath<T extends Path>(path: T, radius: number): T {
  const [first, ...rest] = hexCorners(radius);
  path.moveTo(...first);
  for (const p of rest) path.lineTo(...p);
  path.closePath();
  return path;
}

export const hexShape = (radius: number) => hexPath(new Shape(), radius);

/** The case's metal body: a true hexagonal prism with a small bevel, centred on z = 0. */
export function createBodyGeometry(): BufferGeometry {
  const geometry = new ExtrudeGeometry(hexShape(HEX_RADIUS - HEX_BEVEL), {
    depth: HEX_DEPTH,
    bevelEnabled: true,
    bevelThickness: HEX_BEVEL,
    bevelSize: HEX_BEVEL,
    bevelSegments: 3,
    curveSegments: 1,
  });
  geometry.translate(0, 0, -HEX_DEPTH / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/** A hexagonal outline `width` wide, just outside the face: the active case's lit line. */
export function createEdgeGeometry(width = 0.018): BufferGeometry {
  const shape = hexShape(FACE_RADIUS + width);
  shape.holes.push(hexPath(new Path(), FACE_RADIUS));
  return new ShapeGeometry(shape);
}

export interface FocalPoint {
  /** 0 (left) to 1 (right) of the screenshot. */
  x: number;
  /** 0 (top) to 1 (bottom) of the screenshot. */
  y: number;
}

/**
 * The hexagonal screen: the screenshot fills it like `object-fit: cover`, centred on the
 * focal point so the important part of the UI stays in view. Only texture coordinates
 * change: the image file itself is never cropped.
 */
export function createFaceGeometry(image: { width: number; height: number }, focus: FocalPoint): BufferGeometry {
  const geometry = new ShapeGeometry(hexShape(FACE_RADIUS));
  const halfW = FACE_RADIUS;
  const halfH = (FACE_RADIUS * Math.sqrt(3)) / 2;
  const faceAspect = halfW / halfH;
  const imageAspect = image.width / image.height;
  // Share of the image visible across and down.
  const spanU = imageAspect > faceAspect ? faceAspect / imageAspect : 1;
  const spanV = imageAspect > faceAspect ? 1 : imageAspect / faceAspect;
  const clamp = (v: number, span: number) => Math.min(1 - span / 2, Math.max(span / 2, v));
  const centreU = clamp(focus.x, spanU);
  // Texture v runs bottom to top; the focal point is measured from the top.
  const centreV = clamp(1 - focus.y, spanV);

  const position = geometry.getAttribute('position');
  const uv: number[] = [];
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i) / (2 * halfW); // -0.5 … 0.5
    const y = position.getY(i) / (2 * halfH);
    uv.push(centreU + x * spanU, centreV + y * spanV);
  }
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  return geometry;
}
