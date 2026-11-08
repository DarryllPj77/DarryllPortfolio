import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import {
  AnimationMixer,
  Euler,
  LoopOnce,
  MathUtils,
  Quaternion,
  type AnimationAction,
  type AnimationClip,
  type Group,
  type Object3D,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { avatarConfig } from './avatar.config';
import { clamp, LIMITS, type AvatarInput, type AvatarState } from './avatarInteraction';

/** Crossfade times in seconds; match the site's motion tokens (base 0.3s). */
const FADE_IN = 0.3;
const FADE_OUT = 0.45;
/** How quickly offsets settle (higher = faster). Gentle, never snappy. */
const DAMP_TRACK = 4;
const DAMP_RETURN = 3.5;
/**
 * Longest step the animation takes in one frame. Large enough that slow devices
 * (20–30 fps) still animate at real speed; small enough that resuming after a
 * pause never jumps through a clip.
 */
const MAX_DELTA = 0.1;

export interface AvatarModelProps {
  state: AvatarState;
  input: RefObject<AvatarInput>;
  waveId: number;
  reducedMotion: boolean;
  /** Resting rotation from the current framing. */
  restYaw: number;
  onWaveEnd: () => void;
  /** First frame with the model has been drawn. */
  onReady: () => void;
}

function findClip(clips: AnimationClip[], names: string[]) {
  const wanted = names.map((n) => n.toLowerCase());
  return clips.find((clip) => wanted.includes(clip.name.toLowerCase()));
}

const _euler = new Euler();
const _offset = new Quaternion();

/** Adds a small rotation on top of whatever the animation set this frame. */
function addRotation(joint: Object3D | undefined, pitch: number, yaw: number) {
  if (!joint || (pitch === 0 && yaw === 0)) return;
  _offset.setFromEuler(_euler.set(pitch, yaw, 0));
  joint.quaternion.multiply(_offset);
}

/**
 * The avatar from the GLB, animated with its own clips. Everything that moves
 * the model happens in one useFrame, in a fixed order, so nothing conflicts:
 *   1. the animation mixer poses the joints (Idle / Wave / Neutral)
 *   2. pointer tracking adds a small head and torso turn on top
 *   3. the wrapper group gets the resting angle plus any drag rotation
 */
export default function AvatarModel({
  state,
  input,
  waveId,
  reducedMotion,
  restYaw,
  onWaveEnd,
  onReady,
}: AvatarModelProps) {
  const gltf = useLoader(GLTFLoader, avatarConfig.modelUrl!);
  const invalidate = useThree((s) => s.invalidate);
  const group = useRef<Group>(null);

  const rig = useMemo(() => {
    const { clips, joints } = avatarConfig;
    const mixer = new AnimationMixer(gltf.scene);
    const action = (names: string[]) => {
      const clip = findClip(gltf.animations, names);
      return clip ? mixer.clipAction(clip) : undefined;
    };
    const wave = action(clips.wave);
    if (wave) {
      wave.setLoop(LoopOnce, 1);
      wave.clampWhenFinished = true;
    }
    return {
      mixer,
      idle: action(clips.idle),
      neutral: action(clips.neutral),
      wave,
      head: gltf.scene.getObjectByName(joints.head),
      torso: gltf.scene.getObjectByName(joints.torso),
    };
  }, [gltf]);

  // Smoothed offsets, kept outside React state so frames never re-render.
  const motion = useRef({ yaw: restYaw, headYaw: 0, headPitch: 0, started: false });
  const current = useRef<AnimationAction | undefined>(undefined);

  /** The pose to rest in: Idle normally, the still Neutral pose with reduced motion. */
  const resting = (reducedMotion ? rig.neutral : rig.idle) ?? rig.idle ?? rig.neutral;

  const fadeTo = (next: AnimationAction | undefined, duration: number) => {
    const prev = current.current;
    if (!next || next === prev) return;
    next.reset().setEffectiveWeight(1).play();
    if (prev) next.crossFadeFrom(prev, reducedMotion ? 0 : duration, false);
    current.current = next;
    invalidate();
  };

  // Rest pose on load and whenever reduced motion changes.
  useLayoutEffect(() => {
    if (current.current !== rig.wave) fadeTo(resting, FADE_OUT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resting]);

  // Play Wave on request, then return to the rest pose.
  useEffect(() => {
    if (waveId === 0) return;
    if (!rig.wave) {
      onWaveEnd();
      return;
    }
    fadeTo(rig.wave, FADE_IN);
    const onFinished = (e: { action: AnimationAction }) => {
      if (e.action !== rig.wave) return;
      fadeTo(resting, FADE_OUT);
      onWaveEnd();
    };
    rig.mixer.addEventListener('finished', onFinished);
    return () => rig.mixer.removeEventListener('finished', onFinished);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveId]);

  // A state change may need one more frame when rendering on demand.
  useEffect(() => invalidate(), [state, restYaw, invalidate]);

  // Stop clips on unmount (the loader keeps the model cached for the next visit to Home).
  useEffect(
    () => () => {
      rig.mixer.stopAllAction();
      current.current = undefined;
    },
    [rig],
  );

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, MAX_DELTA);
    const m = motion.current;

    // 1. Clips.
    rig.mixer.update(delta);

    // 2. Pointer tracking, layered on top of the clip's head rotation.
    const tracking = state === 'pointerTracking' && !reducedMotion;
    const targetYaw = tracking ? clamp(input.current.pointer.x, -1, 1) * LIMITS.headYaw : 0;
    const targetPitch = tracking ? -clamp(input.current.pointer.y, -1, 1) * LIMITS.headPitch : 0;
    if (reducedMotion) {
      m.headYaw = targetYaw;
      m.headPitch = targetPitch;
    } else {
      m.headYaw = MathUtils.damp(m.headYaw, targetYaw, DAMP_TRACK, delta);
      m.headPitch = MathUtils.damp(m.headPitch, targetPitch, DAMP_TRACK, delta);
    }
    addRotation(rig.torso, 0, m.headYaw * LIMITS.torsoShare);
    addRotation(rig.head, m.headPitch, m.headYaw * (1 - LIMITS.torsoShare));

    // 3. Whole-avatar rotation: follows the drag directly, then eases back to rest.
    const dragging = state === 'dragging';
    const targetBody = restYaw + (dragging ? input.current.dragYaw : 0);
    m.yaw =
      dragging || reducedMotion ? targetBody : MathUtils.damp(m.yaw, targetBody, DAMP_RETURN, delta);
    if (group.current) group.current.rotation.y = m.yaw;

    if (!m.started) {
      m.started = true;
      // Wait one more frame so the first visible frame is fully posed.
      requestAnimationFrame(onReady);
    }
  });

  return (
    <group ref={group}>
      <primitive object={gltf.scene} />
    </group>
  );
}
