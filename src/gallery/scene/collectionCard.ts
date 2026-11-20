import {
  BufferGeometry,
  CanvasTexture,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Path,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
} from 'three';
import type { GalleryProject } from '../data';
import { CARD } from './lobbyLayout';

/*
 * A collection card for the lobby's orbit: a tall display card with chamfered corners (a nod
 * to the hexagonal cases inside), a graphite body like theirs, and a face composed here from
 * the collection's real covers. Reserved slots use the same card with a dark, engraved face.
 */

/** The card's outline: a rectangle with its four corners cut, centred on the origin. */
function cardOutline<T extends Path>(path: T, inset = 0): T {
  const w = CARD.width / 2 - inset;
  const h = CARD.height / 2 - inset;
  const c = CARD.chamfer - inset * 0.4;
  path.moveTo(-w + c, -h);
  path.lineTo(w - c, -h);
  path.lineTo(w, -h + c);
  path.lineTo(w, h - c);
  path.lineTo(w - c, h);
  path.lineTo(-w + c, h);
  path.lineTo(-w, h - c);
  path.lineTo(-w, -h + c);
  path.closePath();
  return path;
}

/** The body: the outline extruded, bevelled, centred on z = 0. */
export function createCardBody(): BufferGeometry {
  const g = new ExtrudeGeometry(cardOutline(new Shape(), CARD.bevel), {
    depth: CARD.depth,
    bevelEnabled: true,
    bevelThickness: CARD.bevel,
    bevelSize: CARD.bevel,
    bevelSegments: 2,
    curveSegments: 1,
  });
  g.translate(0, 0, -CARD.depth / 2);
  g.computeVertexNormals();
  return g;
}

/** Front of the body: the face sits just in front of it. */
export const CARD_FRONT_Z = CARD.depth / 2 + CARD.bevel;
const FACE_INSET = 0.07;

/** The face: the outline inset a little, its texture spread across it from corner to corner. */
export function createCardFace(): BufferGeometry {
  const g = new ShapeGeometry(cardOutline(new Shape(), FACE_INSET));
  const pos = g.getAttribute('position');
  const w = CARD.width - FACE_INSET * 2;
  const h = CARD.height - FACE_INSET * 2;
  const uv: number[] = [];
  for (let i = 0; i < pos.count; i++) uv.push(pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  return g;
}

/** A thin line just outside the face: lit on the card in front. */
export function createCardEdge(width = 0.016): BufferGeometry {
  const shape = cardOutline(new Shape(), FACE_INSET - width);
  shape.holes.push(cardOutline(new Path(), FACE_INSET));
  return new ShapeGeometry(shape);
}

/* ---------- the faces ---------- */

const FACE_W = 512;
const FACE_H = Math.round((FACE_W * (CARD.height - FACE_INSET * 2)) / (CARD.width - FACE_INSET * 2));

const MONO = "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace";

function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Draws an image to fill a hexagon like `object-fit: cover`, centred on its focal point. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource & { width: number; height: number },
  focus: { x: number; y: number },
  cx: number,
  cy: number,
  r: number,
) {
  const boxW = r * 2;
  const boxH = r * Math.sqrt(3);
  const scale = Math.max(boxW / image.width, boxH / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const x = clamp(cx - focus.x * w, cx + boxW / 2 - w, cx - boxW / 2);
  const y = clamp(cy - focus.y * h, cy + boxH / 2 - h, cy - boxH / 2);
  ctx.save();
  hexPath(ctx, cx, cy, r);
  ctx.clip();
  ctx.drawImage(image, x, y, w, h);
  ctx.restore();
}

function newFace(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = FACE_W;
  canvas.height = FACE_H;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, FACE_H);
  g.addColorStop(0, '#141c2e');
  g.addColorStop(1, '#0b1120');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, FACE_W, FACE_H);
  return [canvas, ctx];
}

function toTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * A collection's face: its projects' real covers as hexagons stacked one above another (as they
 * ride the wheel inside), its name and how many works it holds. Drawn once the covers have loaded.
 */
export function composeCollectionFace(
  name: string,
  works: GalleryProject[],
  images: (CanvasImageSource & { width: number; height: number })[],
): CanvasTexture {
  const [canvas, ctx] = newFace();
  const r = FACE_W * 0.32;
  const step = r * Math.sqrt(3) * 0.55;
  const top = FACE_H * 0.38 - ((works.length - 1) / 2) * step * 0.5;
  // Back to front: the next project below and the previous above (as on the wheel), smaller and
  // dimmer; the first one last, in front.
  const order = [...works.keys()].filter((i) => i !== 0).concat(0);
  for (const i of order) {
    const offset = i === 0 ? 0 : i === 1 ? 1 : -1;
    const size = i === 0 ? r : r * 0.78;
    const cy = top + step * 0.5 + offset * step;
    drawCover(ctx, images[i], works[i].focus, FACE_W / 2, cy, size);
    ctx.save();
    hexPath(ctx, FACE_W / 2, cy, size);
    if (i !== 0) {
      ctx.fillStyle = 'rgba(11, 17, 32, 0.45)';
      ctx.fill();
    }
    ctx.lineWidth = i === 0 ? 4 : 3;
    ctx.strokeStyle = i === 0 ? '#818cf8' : '#1c2230';
    ctx.stroke();
    ctx.restore();
  }
  // Name and count at the foot of the card.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = `500 ${Math.round(FACE_W * 0.04)}px ${MONO}`;
  ctx.fillText(`${String(works.length).padStart(2, '0')} WORKS`, FACE_W / 2, FACE_H * 0.9);
  ctx.fillStyle = '#f1f5f9';
  ctx.font = `600 ${Math.round(FACE_W * 0.062)}px ${MONO}`;
  const words = name.toUpperCase().split(' ');
  const half = Math.ceil(words.length / 2);
  ctx.fillText(words.slice(0, half).join(' '), FACE_W / 2, FACE_H * 0.79);
  ctx.fillText(words.slice(half).join(' '), FACE_W / 2, FACE_H * 0.79 + FACE_W * 0.075);
  return toTexture(canvas);
}

/** A reserved slot's face: dark glass with a faint engraved hexagon, and nothing written on it. */
export function composeReservedFace(): CanvasTexture {
  const [canvas, ctx] = newFace();
  hexPath(ctx, FACE_W / 2, FACE_H * 0.45, FACE_W * 0.22);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
  ctx.stroke();
  return toTexture(canvas);
}
