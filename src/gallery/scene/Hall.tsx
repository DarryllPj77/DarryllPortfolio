import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  Color,
  ConeGeometry,
  Fog,
  Object3D,
  PMREMGenerator,
  Quaternion,
  ShaderMaterial,
  Vector3,
  type SpotLight,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitState } from '../orbit/OrbitState';
import { createFloorTexture } from './hallTextures';
import { EXHIBIT_Y, HALL_COLOUR, ORBIT_RADIUS } from './layout';

/** The exhibit light hangs above and in front of the front position and stays there. */
const LAMP = new Vector3(0, 6.4, ORBIT_RADIUS + 2.2);
const LAMP_TARGET = new Vector3(0, EXHIBIT_Y - 0.4, ORBIT_RADIUS);
const WARM = '#fff4e6';
const LAMP_INTENSITY = 70;
const BEAM_STRENGTH = 0.07;

/**
 * How bright the exhibit light is, 0.55…1: full while a case stands in front, easing down
 * while the ring is between cases and coming back up as the next one arrives.
 */
const lampLevel = (orbit: OrbitState) => 0.55 + 0.45 * Math.max(...orbit.emphasis);

/**
 * The room: dark fog, a polished floor with a pressed hexagon pattern (semi-transparent, so
 * the cases' mirrored copies show through as a soft reflection), a small generated studio
 * environment for the metal's reflections, and three lights: a low ambient fill, the warm
 * exhibit spotlight fixed over the front position, and a cool rim light from behind.
 */
export function Hall({ orbit }: { orbit: OrbitState }) {
  // Three.js objects are changed in place; they are read from the store when needed.
  const get = useThree((s) => s.get);

  // Fog and the background colour of the hall.
  useLayoutEffect(() => {
    const { scene } = get();
    scene.background = new Color(HALL_COLOUR);
    scene.fog = new Fog(HALL_COLOUR, 9, 24);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [get]);

  // Controlled reflections: a tiny studio environment generated here, nothing downloaded.
  useEffect(() => {
    const { scene, gl } = get();
    const pmrem = new PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.32;
    pmrem.dispose();
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [get]);

  const floorTexture = useMemo(() => {
    const t = createFloorTexture();
    t.repeat.set(14, 14);
    return t;
  }, []);
  useEffect(() => () => floorTexture.dispose(), [floorTexture]);

  const lampTarget = useMemo(() => {
    const o = new Object3D();
    o.position.copy(LAMP_TARGET);
    return o;
  }, []);

  const lamp = useRef<SpotLight>(null);
  useFrame(() => {
    if (lamp.current) lamp.current.intensity = LAMP_INTENSITY * lampLevel(orbit);
  });

  return (
    <>
      <ambientLight color="#b4c3e0" intensity={0.18} />
      <primitive object={lampTarget} />
      <spotLight
        ref={lamp}
        color={WARM}
        position={LAMP}
        target={lampTarget}
        intensity={LAMP_INTENSITY}
        angle={0.36}
        penumbra={0.85}
        decay={1.6}
        distance={18}
      />
      <directionalLight color="#38bdf8" position={[0, 4, -7]} intensity={0.3} />

      <mesh rotation-x={-Math.PI / 2} renderOrder={1}>
        <planeGeometry args={[60, 60]} />
        {/* Dark polished stone: a faint sheen, and the reflection at about a twelfth. */}
        <meshStandardMaterial
          map={floorTexture}
          color="#8f9ab0"
          roughness={0.6}
          metalness={0}
          envMapIntensity={0.25}
          transparent
          opacity={0.92}
        />
      </mesh>

      <LightBeam orbit={orbit} />
    </>
  );
}

/**
 * The spotlight's visible beam: an open cone, brightest at the lamp and fading towards the
 * floor and its own edges. Additive and very faint; the only "volumetric" touch in the hall.
 */
function LightBeam({ orbit }: { orbit: OrbitState }) {
  const { geometry, material, position, quaternion } = useMemo(() => {
    const direction = LAMP_TARGET.clone().sub(LAMP);
    const length = direction.length() * 1.15;
    direction.normalize();
    const geometry = new ConeGeometry(1.25, length, 48, 1, true);
    // ConeGeometry points its apex at +y: turn it to hang from the lamp along the light.
    const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, -1, 0), direction);
    const position = LAMP.clone().addScaledVector(direction, length / 2);
    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uColour: { value: new Color(WARM) }, uStrength: { value: BEAM_STRENGTH } },
      vertexShader: /* glsl */ `
        varying float vAlong;
        varying float vFacing;
        void main() {
          vAlong = uv.y; // 1 at the lamp, 0 at the open end
          vec3 n = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vFacing = abs(dot(n, normalize(-mv.xyz)));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColour;
        uniform float uStrength;
        varying float vAlong;
        varying float vFacing;
        void main() {
          float a = uStrength * pow(vAlong, 1.4) * pow(vFacing, 2.0);
          gl_FragColor = vec4(uColour * a, a);
        }`,
    });
    return { geometry, material, position, quaternion };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  const beam = useRef<{ material: ShaderMaterial }>({ material });
  useFrame(() => {
    beam.current.material.uniforms.uStrength.value = BEAM_STRENGTH * lampLevel(orbit);
  });

  return <mesh geometry={geometry} material={material} position={position} quaternion={quaternion} renderOrder={3} />;
}
