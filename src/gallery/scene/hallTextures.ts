import { CanvasTexture, LinearMipmapLinearFilter, RepeatWrapping, SRGBColorSpace } from 'three';

/**
 * The floor's pressed hexagon pattern, drawn once on a small canvas and tiled. The tile is
 * exactly four hexagon columns wide and seven rows tall, so the pattern repeats without a seam.
 */
export function createFloorTexture(): CanvasTexture {
  const r = 32;
  const rowH = Math.sqrt(3) * r;
  const width = 12 * r; // 4 columns × 1.5r … × 2 for the odd-column offset
  const height = Math.round(rowH * 7);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#141d31';
  ctx.lineWidth = 1.5;
  for (let col = -1; col <= 8; col++) {
    for (let row = -1; row <= 8; row++) {
      const cx = col * 1.5 * r;
      const cy = row * rowH + (col % 2 ? rowH / 2 : 0);
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (Math.PI / 3) * i;
        const x = cx + Math.cos(a) * (r - 1.5);
        const y = cy + Math.sin(a) * (r - 1.5);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.anisotropy = 8;
  return texture;
}

/** A soft dark pool, drawn under each case where it would shade the floor. */
export function createShadowTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.75)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.3)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}
