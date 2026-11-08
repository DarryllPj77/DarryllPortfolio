/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { projects } from '../data/projects';
import type { ProjectScreenshot } from '../data/types';

const publicDir = resolve(process.cwd(), 'public');

/** Reads width and height from a JPEG's start-of-frame marker. */
function jpegSize(bytes: Buffer) {
  let i = 2;
  while (i < bytes.length) {
    const marker = bytes[i + 1];
    const length = bytes.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7) };
    }
    i += 2 + length;
  }
  throw new Error('No JPEG frame header found');
}

const allShots: ProjectScreenshot[] = projects.flatMap((p) => [
  ...(p.hero ? [p.hero] : []),
  ...(p.chapters ?? []).flatMap((c) => c.blocks.flatMap((b) => b.shots)),
]);

describe('case-study screenshots', () => {
  it('point at real files with the recorded dimensions', () => {
    expect(allShots.length).toBeGreaterThan(0);
    for (const shot of allShots) {
      const bytes = readFileSync(resolve(publicDir, `.${shot.src}`));
      expect(jpegSize(bytes), shot.src).toEqual({ width: shot.width, height: shot.height });
    }
  });

  it('use each screenshot once, with a caption and alt text', () => {
    const srcs = allShots.map((s) => s.src);
    expect(new Set(srcs).size).toBe(srcs.length);
    for (const shot of allShots) {
      expect(shot.caption.length, shot.src).toBeGreaterThan(0);
      expect(shot.alt.length, shot.src).toBeGreaterThan(20);
    }
  });

  it('leaves out the report export that shows a third party’s details', () => {
    expect(allShots.some((s) => s.src.includes('violation-report-export'))).toBe(false);
  });
});
