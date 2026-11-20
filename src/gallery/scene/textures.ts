import { SRGBColorSpace, type Texture, type WebGLRenderer } from 'three';

/** Screenshots are sRGB images, sampled sharply at an angle (anisotropic filtering, capped at 8). */
export function prepareScreenshots(textures: Texture[], gl: WebGLRenderer): void {
  const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
  for (const t of textures) {
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = anisotropy;
    t.needsUpdate = true;
  }
}
