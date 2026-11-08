/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { avatarConfig } from '../components/3d/avatar.config';
import { frameCamera } from '../components/3d/avatarFraming';
import { chooseFrameloop, resolveAvatarState } from '../components/3d/avatarInteraction';
import { detectAvatarMode } from '../hooks/useAvatarCapability';

const original = { ...avatarConfig };

function setNavigator(hints: { saveData?: boolean; deviceMemory?: number }) {
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: hints.saveData === undefined ? undefined : { saveData: hints.saveData },
  });
  Object.defineProperty(navigator, 'deviceMemory', {
    configurable: true,
    value: hints.deviceMemory,
  });
}

function mockWebGL2(available: boolean) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((type: string) =>
    available && type === 'webgl2'
      ? ({ getExtension: () => null } as unknown as RenderingContext)
      : null) as never);
}

describe('avatar capability', () => {
  beforeEach(() => {
    Object.assign(avatarConfig, { mode: 'scene', modelUrl: '/models/test.glb' });
    setNavigator({});
    mockWebGL2(true);
  });

  afterEach(() => {
    Object.assign(avatarConfig, original);
    setNavigator({});
    vi.restoreAllMocks();
  });

  it('uses the scene when it is enabled, has a model and WebGL2 works', () => {
    expect(detectAvatarMode()).toBe('scene');
  });

  it('uses the poster while the scene is switched off or has no model', () => {
    Object.assign(avatarConfig, { mode: 'poster' });
    expect(detectAvatarMode()).toBe('poster');
    Object.assign(avatarConfig, { mode: 'scene', modelUrl: null });
    expect(detectAvatarMode()).toBe('poster');
  });

  it('uses the poster without WebGL2, with data saver, or on low-memory devices', () => {
    mockWebGL2(false);
    expect(detectAvatarMode()).toBe('poster');

    mockWebGL2(true);
    setNavigator({ saveData: true });
    expect(detectAvatarMode()).toBe('poster');

    setNavigator({ deviceMemory: 2 });
    expect(detectAvatarMode()).toBe('poster');

    setNavigator({ deviceMemory: 8 });
    expect(detectAvatarMode()).toBe('scene');
  });
});

describe('avatar interaction state', () => {
  const flags = { dragging: false, waving: false, pointerActive: false };

  it('picks one state by priority: dragging > waving > pointerTracking > idle', () => {
    expect(resolveAvatarState(flags)).toBe('idle');
    expect(resolveAvatarState({ ...flags, pointerActive: true })).toBe('pointerTracking');
    expect(resolveAvatarState({ ...flags, pointerActive: true, waving: true })).toBe('waving');
    expect(resolveAvatarState({ dragging: true, waving: true, pointerActive: true })).toBe(
      'dragging',
    );
  });

  it('renders only when needed', () => {
    expect(chooseFrameloop(false, false, 'idle')).toBe('never');
    expect(chooseFrameloop(true, false, 'idle')).toBe('always');
    // Reduced motion: still pose renders on demand, but a wave or drag still animates.
    expect(chooseFrameloop(true, true, 'idle')).toBe('demand');
    expect(chooseFrameloop(true, true, 'pointerTracking')).toBe('demand');
    expect(chooseFrameloop(true, true, 'waving')).toBe('always');
    expect(chooseFrameloop(true, true, 'dragging')).toBe('always');
  });
});

describe('avatar framing', () => {
  const fov = avatarConfig.fov;
  const visible = (framing: typeof avatarConfig.framing.portrait, w: number, h: number) => {
    const { span, centerX, centerY, slotWidth } = frameCamera(framing, w, h, fov);
    const canvasWidth = span * (w / h);
    return {
      top: centerY + span / 2,
      left: centerX - canvasWidth / 2,
      right: centerX + canvasWidth / 2,
      slotRight: slotWidth / 2,
    };
  };

  it.each([
    ['desktop', avatarConfig.framing.portrait, 455, 437],
    ['tablet', avatarConfig.framing.compact, 450, 360],
    ['phone', avatarConfig.framing.compact, 325, 260],
  ])('keeps the full reach (including the wave) in frame on %s', (_, framing, w, h) => {
    const v = visible(framing, w, h);
    expect(v.left).toBeLessThanOrEqual(-framing.reach.left + 1e-6);
    expect(v.right).toBeCloseTo(v.slotRight, 6);
    expect(v.slotRight).toBeGreaterThanOrEqual(framing.reach.right - 1e-6);
    expect(v.top).toBeCloseTo(framing.top, 6);
  });
});

describe('avatar model file', () => {
  const glb = readFileSync(resolve(process.cwd(), 'public', `.${avatarConfig.modelUrl}`));
  const json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString('utf8')) as {
    animations: { name: string }[];
    nodes: { name?: string }[];
  };

  it('contains the clips the config expects', () => {
    const clips = json.animations.map((a) => a.name.toLowerCase());
    const { idle, wave, neutral } = avatarConfig.clips;
    for (const names of [idle, wave, neutral]) {
      expect(names.some((n) => clips.includes(n.toLowerCase()))).toBe(true);
    }
  });

  it('contains the joints used for pointer tracking', () => {
    const nodes = json.nodes.map((n) => n.name);
    expect(nodes).toContain(avatarConfig.joints.head);
    expect(nodes).toContain(avatarConfig.joints.torso);
  });
});
