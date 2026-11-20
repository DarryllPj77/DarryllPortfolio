import { describe, expect, it } from 'vitest';
import {
  FrameProbe,
  IDLE_GAP_MS,
  initialQuality,
  judgeFrames,
  EARLY_FRAMES,
  SAMPLE_FRAMES,
  WARMUP_FRAMES,
} from '../gallery/scene/quality';

/** Feeds a probe frames `ms` apart; returns its verdict. */
function feed(probe: FrameProbe, ms: number, count: number, start = 1000) {
  let verdict = null;
  for (let i = 0; i < count && !verdict; i++) verdict = probe.frame(start + i * ms);
  return verdict;
}

describe('quality setting', () => {
  it('starts lighter only on devices that report little memory', () => {
    expect(initialQuality({ deviceMemory: 2 })).toBe('low');
    expect(initialQuality({ deviceMemory: 8 })).toBe('high');
    expect(initialQuality({})).toBe('high'); // most browsers do not say
  });

  it('judges by the median frame, so a few hiccups do not count', () => {
    expect(judgeFrames([16, 17, 16, 90, 16])).toBe('high');
    expect(judgeFrames([40, 38, 42, 16, 45])).toBe('low');
  });

  it('keeps the full hall at 60 frames a second and lightens it below about 33', () => {
    const total = WARMUP_FRAMES + SAMPLE_FRAMES + 2;
    expect(feed(new FrameProbe(), 16.7, total)).toBe('high');
    expect(feed(new FrameProbe(), 45, total)).toBe('low');
  });

  it('ignores the slow first frames, and the gaps while the hall stands still', () => {
    const probe = new FrameProbe();
    // Warm-up: very slow (shaders compiling, textures uploading).
    for (let i = 0; i < WARMUP_FRAMES; i++) probe.frame(1000 + i * 200);
    // The hall stands still for a while: that gap is not a slow frame.
    let t = 1000 + WARMUP_FRAMES * 200 + IDLE_GAP_MS * 10;
    probe.frame(t);
    let verdict = null;
    for (let i = 0; i < SAMPLE_FRAMES + 1 && !verdict; i++) verdict = probe.frame((t += 16.7));
    expect(verdict).toBe('high');
  });

  it('decides early on a device that is clearly very slow', () => {
    const probe = new FrameProbe();
    const verdictAt = (() => {
      for (let i = 0; i <= WARMUP_FRAMES + EARLY_FRAMES + 1; i++) {
        if (probe.frame(1000 + i * 120)) return i;
      }
      return null;
    })();
    // The first frame has no gap before it, so frame i is the i-th measured gap.
    expect(verdictAt).toBe(WARMUP_FRAMES + EARLY_FRAMES);
  });

  it('gives its verdict once', () => {
    const probe = new FrameProbe();
    expect(feed(probe, 16.7, WARMUP_FRAMES + SAMPLE_FRAMES + 2)).toBe('high');
    expect(feed(probe, 60, 200, 99999)).toBeNull();
  });
});
