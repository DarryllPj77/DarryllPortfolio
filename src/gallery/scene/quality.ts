/**
 * The exhibition's quality setting. "high" is the full hall; "low" draws at one device pixel
 * per CSS pixel and drops the extras a slow graphics chip feels most: the floor reflection
 * (which draws every case twice), the light beam and the glass sheen. The cases, their real
 * screenshots, the light and the motion are the same in both.
 */
export type Quality = 'high' | 'low';

/** Frames slower than this, on the median, mean the device is struggling (about 33 fps). */
export const SLOW_FRAME_MS = 30;
/** Frames skipped at the start (shader compiling, textures uploading), then frames measured. */
export const WARMUP_FRAMES = 8;
export const SAMPLE_FRAMES = 45;
/**
 * A very slow device may never draw enough frames for a full sample, so a clear early sign
 * decides at once: the first frames this many, at twice the slow limit.
 */
export const EARLY_FRAMES = 10;
/** A gap longer than this is the hall standing still, not a slow frame: it is not counted. */
export const IDLE_GAP_MS = 250;

/** A first guess before anything is measured: low on devices that report little memory. */
export function initialQuality(nav: { deviceMemory?: number } = navigator as { deviceMemory?: number }): Quality {
  return nav.deviceMemory !== undefined && nav.deviceMemory < 4 ? 'low' : 'high';
}

/** The verdict from measured frame times (ms): low when the median frame is too slow. */
export function judgeFrames(frameMs: readonly number[]): Quality {
  const sorted = [...frameMs].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  return median > SLOW_FRAME_MS ? 'low' : 'high';
}

/**
 * Watches frame times while the hall is moving (the entrance, a turn) and gives one verdict.
 * Only steps down: once lowered it stays low, so the hall never flickers between the two.
 */
export class FrameProbe {
  private last = 0;
  private seen = 0;
  private samples: number[] = [];
  done = false;

  /** Records a frame drawn at `now` (ms). Returns a verdict once enough frames are in. */
  frame(now: number): Quality | null {
    if (this.done) return null;
    const gap = this.last ? now - this.last : 0;
    this.last = now;
    if (!gap || gap > IDLE_GAP_MS) return null;
    this.seen++;
    if (this.seen <= WARMUP_FRAMES) return null;
    this.samples.push(gap);
    if (this.samples.length === EARLY_FRAMES && judgeFrames(this.samples.map((g) => g / 2)) === 'low') {
      this.done = true;
      return 'low';
    }
    if (this.samples.length < SAMPLE_FRAMES) return null;
    this.done = true;
    return judgeFrames(this.samples);
  }
}
