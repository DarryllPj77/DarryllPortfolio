import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  EdgesGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  LineBasicMaterial,
  MeshBasicMaterial,
  OctahedronGeometry,
  SpriteMaterial,
  TetrahedronGeometry,
  type Group,
  type Mesh,
  type PointLight,
  type Sprite,
} from 'three';
import { useQuality } from './qualityContext';

/*
 * The lobby's centrepiece: an abstract lattice sculpture the collections orbit. An open
 * icosahedral cage, a star of two interlocking tetrahedra inside it, a small bright core, two
 * thin rings and a vertical axis, in the hall's indigo and cyan with cool-white highlights.
 * Everything moves slowly, each layer at its own pace; with reduced motion or on a slow device
 * it holds still.
 */

const SPEED = { cage: 0.07, star: -0.12, rings: 0.05 } as const;

/** A circle of `segments` points, as a line loop's geometry. */
function circle(radius: number, segments = 96) {
  const points: number[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points.push(Math.cos(a) * radius, Math.sin(a) * radius, 0);
  }
  return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(points, 3));
}

/** A soft round light for the core's glow: bright in the middle, gone at the edge. */
function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(199, 210, 254, 1)');
  g.addColorStop(0.25, 'rgba(129, 140, 248, 0.45)');
  g.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new CanvasTexture(canvas);
}

const line = (color: string, opacity: number) =>
  new LineBasicMaterial({ color, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false, toneMapped: false });

/** The sculpture's lines, core and glow, at the hall's light  (0…1) and its slow breath. */
function lightSculpture(
  parts: {
    cageMaterial: LineBasicMaterial;
    innerMaterial: LineBasicMaterial;
    starMaterial: LineBasicMaterial;
    ringMaterial: LineBasicMaterial;
    axisMaterial: LineBasicMaterial;
    coreMaterial: MeshBasicMaterial;
    glowMaterial: SpriteMaterial;
  },
  a: number,
  breath: number,
) {
  parts.cageMaterial.opacity = 0.7 * a;
  parts.innerMaterial.opacity = 0.5 * a;
  parts.starMaterial.opacity = 0.85 * a;
  parts.ringMaterial.opacity = 0.4 * a;
  parts.axisMaterial.opacity = 0.3 * a;
  parts.coreMaterial.color.setRGB(0.62 * a, 0.66 * a, 0.82 * a);
  parts.glowMaterial.opacity = 0.5 * a * breath;
}

interface LobbySculptureProps {
  /** Where it floats: the centre of the orbit. */
  position: [number, number, number];
  /** Its size: the cage's radius. */
  radius: number;
  /** The hall's light, 0…1, read every frame: the sculpture fades with the room. */
  level: () => number;
  reduced: boolean;
}

export function LobbySculpture({ position, radius, level, reduced }: LobbySculptureProps) {
  const quality = useQuality();
  const still = reduced || quality === 'low';

  const parts = useMemo(() => {
    const tetra = new TetrahedronGeometry(radius * 0.66);
    const parts = {
      cage: new EdgesGeometry(new IcosahedronGeometry(radius, 0)),
      inner: new EdgesGeometry(new IcosahedronGeometry(radius * 0.42, 0)),
      star: new EdgesGeometry(tetra),
      ring: circle(radius * 1.28),
      axis: new BufferGeometry().setAttribute(
        'position',
        new Float32BufferAttribute([0, -radius * 1.7, 0, 0, radius * 1.7, 0], 3),
      ),
      core: new OctahedronGeometry(radius * 0.1),
      cageMaterial: line('#a5b4fc', 0.38),
      innerMaterial: line('#e0e7ff', 0.3),
      starMaterial: line('#67e8f9', 0.55),
      ringMaterial: line('#818cf8', 0.22),
      axisMaterial: line('#94a3b8', 0.18),
      coreMaterial: new MeshBasicMaterial({ color: '#e0e7ff', toneMapped: false }),
      glowMaterial: new SpriteMaterial({
        map: glowTexture(),
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    };
    tetra.dispose();
    return parts;
  }, [radius]);
  useEffect(
    () => () => {
      for (const g of [parts.cage, parts.inner, parts.star, parts.ring, parts.axis, parts.core]) g.dispose();
      for (const m of [parts.cageMaterial, parts.innerMaterial, parts.starMaterial, parts.ringMaterial, parts.axisMaterial, parts.coreMaterial])
        m.dispose();
      parts.glowMaterial.map?.dispose();
      parts.glowMaterial.dispose();
    },
    [parts],
  );

  const cage = useRef<Group>(null);
  const star = useRef<Group>(null);
  const rings = useRef<Group>(null);
  const core = useRef<Mesh>(null);
  const glow = useRef<Sprite>(null);
  const lamp = useRef<PointLight>(null);
  // Fixed, pleasing angles to start from (and to hold, when it holds still).
  const time = useRef(4);

  useFrame((state, dt) => {
    if (!still) time.current += Math.min(dt, 0.1);
    const t = time.current;
    const a = level();
    if (cage.current) cage.current.rotation.set(0.32, t * SPEED.cage, 0.12);
    if (star.current) star.current.rotation.set(Math.sin(t * 0.21) * 0.18, t * SPEED.star, 0.2);
    if (rings.current) rings.current.rotation.y = t * SPEED.rings;
    if (core.current) {
      core.current.position.y = Math.sin(t * 0.7) * radius * 0.04;
      core.current.rotation.y = t * 0.3;
    }
    const breath = 0.85 + 0.15 * Math.sin(t * 0.55);
    lightSculpture(parts, a, breath);

    if (glow.current) glow.current.scale.setScalar(radius * 1.9);
    if (lamp.current) lamp.current.intensity = 6 * a * breath;
    if (!still) state.invalidate();
  });

  return (
    <group position={position}>
      <group ref={cage}>
        <lineSegments geometry={parts.cage} material={parts.cageMaterial} />
        <lineSegments geometry={parts.inner} material={parts.innerMaterial} />
      </group>
      <group ref={star}>
        <lineSegments geometry={parts.star} material={parts.starMaterial} />
        <lineSegments geometry={parts.star} material={parts.starMaterial} scale={-1} />
      </group>
      <group ref={rings}>
        <lineLoop geometry={parts.ring} material={parts.ringMaterial} rotation={[Math.PI / 2 - 0.42, 0, 0]} />
        <lineLoop geometry={parts.ring} material={parts.ringMaterial} rotation={[Math.PI / 2 + 0.42, 0, 0.9]} />
      </group>
      <lineSegments geometry={parts.axis} material={parts.axisMaterial} />
      <mesh ref={core} geometry={parts.core} material={parts.coreMaterial} />
      <sprite ref={glow} material={parts.glowMaterial} />
      <pointLight ref={lamp} color="#7dd3fc" distance={radius * 6} decay={2} />
    </group>
  );
}
