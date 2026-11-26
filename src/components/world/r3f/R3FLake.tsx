import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { getWoodPlankTexture } from '../ProceduralTextures';
import {
  LAKE_CENTER,
  LAKE_RADIUS_X,
  LAKE_RADIUS_Z,
  WORLD_BRIDGES,
  streamCenterX,
} from './worldLayout';
import { ArchedWoodenBridgeR3F } from './R3FNature';
import { liveSceneActivity } from './roomTypes';

export interface FloatingLanternData {
  id: string;
  x: number;
  z: number;
}

export const ReflectiveLake: React.FC<{
  onSelectLantern?: (id: string) => void;
}> = ({ onSelectLantern }) => {
  const foamMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const woodTex = getWoodPlankTexture();
  const woodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: woodTex, color: 0x8a6345, roughness: 0.78, metalness: 0.05 }),
    [woodTex]
  );
  const brassMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.24 }),
    []
  );

  // Custom GLSL Shader for emerald-teal rippling sky-island lake
  const lakeWaterMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uDeepColor: { value: new THREE.Color('#0e5c6b') },
          uShallowColor: { value: new THREE.Color('#29989e') },
          uGlowColor: { value: new THREE.Color('#f5d896') },
        },
        vertexShader: `
          uniform float uTime;
          varying vec2 vUv;
          varying vec3 vWorldPos;
          void main() {
            vUv = uv;
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            worldPos.y += sin(worldPos.x * 0.45 + uTime * 1.1) * 0.014
                        + cos(worldPos.z * 0.52 - uTime * 0.95) * 0.012;
            vWorldPos = worldPos.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPos;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uDeepColor;
          uniform vec3 uShallowColor;
          uniform vec3 uGlowColor;
          varying vec2 vUv;
          varying vec3 vWorldPos;

          void main() {
            float radial = length(vUv - 0.5) * 2.0;
            vec3 col = mix(uDeepColor, uShallowColor, smoothstep(0.18, 0.96, radial));

            float r1 = sin(vWorldPos.x * 1.35 + uTime * 1.4 + sin(vWorldPos.z * 1.15) * 1.65);
            float r2 = cos(vWorldPos.z * 1.55 - uTime * 1.18 + cos(vWorldPos.x * 0.9) * 1.2);
            float r3 = sin((vWorldPos.x + vWorldPos.z) * 2.4 - uTime * 1.9);
            float caustic = smoothstep(0.54, 0.98, (r1 + r2) * 0.42 + r3 * 0.16);
            col += vec3(0.18, 0.34, 0.36) * caustic * 0.5;

            float specularGlint = pow(clamp(caustic, 0.0, 1.0), 3.0) * 0.6;
            float shoreFoam = smoothstep(0.88, 1.0, radial) * (0.35 + 0.25 * r1);
            col += uGlowColor * specularGlint;
            col = mix(col, vec3(0.86, 0.97, 0.96), shoreFoam * 0.48);

            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    []
  );

  // Custom GLSL flowing turquoise mountain brook current shader
  const streamWaterMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uBaseColor: { value: new THREE.Color('#2b838b') },
          uHighlightColor: { value: new THREE.Color('#b8ecee') },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uBaseColor;
          uniform vec3 uHighlightColor;
          varying vec2 vUv;

          void main() {
            float flow = vUv.y - uTime * 0.65;
            float streak1 = sin(vUv.x * 14.0 + sin(flow * 4.5) * 2.0);
            float streak2 = cos(flow * 11.0 + vUv.x * 6.0);
            float foam = smoothstep(0.58, 0.96, (streak1 + streak2) * 0.5);
            vec3 col = mix(uBaseColor, uHighlightColor, foam * 0.52);
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    []
  );

  // Custom GLSL animated vertical scrolling waterfall aqua mist shader
  const waterfallMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uWaterColor: { value: new THREE.Color('#77cde0') },
          uFoamColor: { value: new THREE.Color('#f4fcfd') },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uWaterColor;
          uniform vec3 uFoamColor;
          varying vec2 vUv;

          void main() {
            float scrollY = vUv.y + uTime * 1.85;
            float streaks = sin(vUv.x * 24.0) * 0.4 + sin(scrollY * 18.0 + vUv.x * 9.0) * 0.6;
            float froth = smoothstep(0.18, 0.85, streaks);
            float topBottomFoam = smoothstep(0.24, 0.0, vUv.y) + smoothstep(0.84, 1.0, vUv.y);
            float white = clamp(froth * 0.68 + topBottomFoam * 0.6, 0.0, 1.0);
            vec3 col = mix(uWaterColor, uFoamColor, white);
            float alpha = 0.72 + white * 0.24;
            gl_FragColor = vec4(col, alpha);
          }
        `,
      }),
    []
  );

  // Build meandering brook water ribbon BufferGeometry matching streamCenterX(z)
  const streamGeo = useMemo(() => {
    const zStart = -48;
    const zEnd = 28;
    const segs = 80;
    const halfWidth = 3.4;

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const z = THREE.MathUtils.lerp(zStart, zEnd, t);
      const cx = streamCenterX(z);
      const nextCx = streamCenterX(z + 0.5);
      const slope = (nextCx - cx) / 0.5;
      const invNorm = 1 / Math.sqrt(1 + slope * slope);
      const nx = invNorm;
      const nz = -slope * invNorm;

      positions.push(cx - nx * halfWidth, 0.025, z - nz * halfWidth);
      positions.push(cx + nx * halfWidth, 0.025, z + nz * halfWidth);
      uvs.push(0, t * 12, 1, t * 12);

      if (i < segs) {
        const base = i * 2;
        indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const pierWoodGeo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (let idx = 0; idx < 16; idx++) {
      const plank = new THREE.BoxGeometry(2.15, 0.08, 0.39);
      plank.translate(0, 0.14, idx * 0.45);
      parts.push(plank);
    }
    const leftBeam = new THREE.BoxGeometry(0.12, 0.12, 7.2);
    leftBeam.translate(-0.95, 0.07, 3.4);
    parts.push(leftBeam);

    const rightBeam = new THREE.BoxGeometry(0.12, 0.12, 7.2);
    rightBeam.translate(0.95, 0.07, 3.4);
    parts.push(rightBeam);

    const posts: Array<[number, number]> = [
      [-1.0, 0.2],
      [1.0, 0.2],
      [-1.0, 3.4],
      [1.0, 3.4],
      [-1.0, 6.8],
      [1.0, 6.8],
    ];
    for (const [px, pz] of posts) {
      const post = new THREE.CylinderGeometry(0.08, 0.095, 1.15, 8);
      post.translate(px, 0.15, pz);
      parts.push(post);
    }
    const nonIdx = parts.map((g) => (g.index ? g.toNonIndexed() : g));
    const merged = mergeGeometries(nonIdx, false);
    nonIdx.forEach((g) => g.dispose());
    parts.forEach((g) => g.dispose());
    merged.computeBoundingSphere();
    merged.computeBoundingBox();
    return merged;
  }, []);

  const lotusAssets = useMemo(() => {
    const mergeTransformed = (items: THREE.BufferGeometry[]) => {
      const norm = items.map((g) => (g.index ? g.toNonIndexed() : g));
      const m = mergeGeometries(norm, false);
      norm.forEach((g) => g.dispose());
      items.forEach((g) => g.dispose());
      m.computeBoundingSphere();
      return m;
    };

    const haloGeo = new THREE.RingGeometry(0.42, 0.72, 20);
    haloGeo.rotateX(-Math.PI / 2);
    haloGeo.translate(0, -0.02, 0);

    const padGeo = new THREE.CircleGeometry(0.42, 16, 0, Math.PI * 1.86);
    padGeo.rotateX(-Math.PI / 2);
    padGeo.translate(0, 0.01, 0);

    const outerEvenParts: THREE.BufferGeometry[] = [];
    const outerOddParts: THREE.BufferGeometry[] = [];
    const euler = new THREE.Euler();
    const quat = new THREE.Quaternion();
    const mat4 = new THREE.Matrix4();
    const one = new THREE.Vector3(1, 1, 1);

    for (let pIdx = 0; pIdx < 8; pIdx++) {
      const ang = (pIdx / 8) * Math.PI * 2;
      const g = new THREE.ConeGeometry(0.095, 0.26, 5);
      euler.set(0, -ang, -0.78, 'XYZ');
      quat.setFromEuler(euler);
      mat4.compose(new THREE.Vector3(Math.cos(ang) * 0.16, 0.1, Math.sin(ang) * 0.16), quat, one);
      g.applyMatrix4(mat4);
      if (pIdx % 2 === 0) outerEvenParts.push(g);
      else outerOddParts.push(g);
    }

    const innerParts: THREE.BufferGeometry[] = [];
    for (let pIdx = 0; pIdx < 6; pIdx++) {
      const ang = (pIdx / 6) * Math.PI * 2 + 0.25;
      const g = new THREE.ConeGeometry(0.068, 0.21, 5);
      euler.set(0, -ang, -0.45, 'XYZ');
      quat.setFromEuler(euler);
      mat4.compose(new THREE.Vector3(Math.cos(ang) * 0.1, 0.14, Math.sin(ang) * 0.1), quat, one);
      g.applyMatrix4(mat4);
      innerParts.push(g);
    }

    const coreGeo = new THREE.SphereGeometry(0.095, 10, 8);
    coreGeo.translate(0, 0.17, 0);

    return {
      haloGeo,
      padGeo,
      outerEvenGeo: mergeTransformed(outerEvenParts),
      outerOddGeo: mergeTransformed(outerOddParts),
      innerGeo: mergeTransformed(innerParts),
      coreGeo,
      haloMat: new THREE.MeshBasicMaterial({
        color: '#fde68a',
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
      }),
      padMat: new THREE.MeshStandardMaterial({
        color: '#3c7349',
        roughness: 0.68,
        metalness: 0.04,
        side: THREE.DoubleSide,
      }),
      outerEvenMat: new THREE.MeshStandardMaterial({
        color: '#fbcfe8',
        emissive: '#f472b6',
        emissiveIntensity: 0.28,
        roughness: 0.45,
      }),
      outerOddMat: new THREE.MeshStandardMaterial({
        color: '#f9a8d4',
        emissive: '#ec4899',
        emissiveIntensity: 0.28,
        roughness: 0.45,
      }),
      innerMat: new THREE.MeshStandardMaterial({
        color: '#fef3c7',
        emissive: '#fbbf24',
        emissiveIntensity: 0.55,
        roughness: 0.35,
      }),
      coreMat: new THREE.MeshStandardMaterial({
        color: '#fffbeb',
        emissive: '#fbbf24',
        emissiveIntensity: 1.45,
        toneMapped: false,
      }),
    };
  }, []);

  useEffect(() => {
    return () => {
      woodMat.dispose();
      brassMat.dispose();
      lakeWaterMat.dispose();
      streamWaterMat.dispose();
      waterfallMat.dispose();
      streamGeo.dispose();
      pierWoodGeo.dispose();
      lotusAssets.haloGeo.dispose();
      lotusAssets.padGeo.dispose();
      lotusAssets.outerEvenGeo.dispose();
      lotusAssets.outerOddGeo.dispose();
      lotusAssets.innerGeo.dispose();
      lotusAssets.coreGeo.dispose();
      lotusAssets.haloMat.dispose();
      lotusAssets.padMat.dispose();
      lotusAssets.outerEvenMat.dispose();
      lotusAssets.outerOddMat.dispose();
      lotusAssets.innerMat.dispose();
      lotusAssets.coreMat.dispose();
    };
  }, [woodMat, brassMat, lakeWaterMat, streamWaterMat, waterfallMat, streamGeo, pierWoodGeo, lotusAssets]);

  // Animate shaders & waterfall foam pulse
  useFrame((state) => {
    if (!liveSceneActivity.isOutdoor) return;
    const t = state.clock.getElapsedTime();
    lakeWaterMat.uniforms.uTime.value = t;
    streamWaterMat.uniforms.uTime.value = t;
    waterfallMat.uniforms.uTime.value = t;

    if (foamMatRef.current) {
      foamMatRef.current.opacity = 0.55 + Math.sin(t * 3.5) * 0.14;
    }
    if (koiGroupRef.current) {
      koiGroupRef.current.children.forEach((koi, idx) => {
        const spec = koiSpecs[idx];
        if (!spec) return;
        const ang = t * spec.speed + spec.phase;
        koi.position.set(
          spec.cx + Math.cos(ang) * spec.r,
          0.035 + Math.sin(t * 2.2 + idx) * 0.008,
          spec.cz + Math.sin(ang) * spec.r * 0.72
        );
        koi.rotation.y = -ang;
      });
    }
  });

  // Floating glowing lantern pods across Ho Hoa Dang
  const lanterns: FloatingLanternData[] = useMemo(() => {
    const coords: Array<[number, number]> = [
      [-5.2, 31.4],
      [-2.1, 33.2],
      [3.4, 31.8],
      [7.8, 33.6],
      [-8.6, 35.8],
      [1.8, 36.2],
      [-4.9, 37.8],
      [6.4, 37.5],
      [-11.2, 32.5],
      [-12.8, 36.8],
      [10.5, 35.2],
      [11.8, 30.8],
      [-6.5, 41.2],
      [4.5, 41.5],
      [-1.5, 29.4],
      [8.2, 39.8],
    ];
    return coords.map(([x, z], i) => ({ id: `pod_${i}`, x, z }));
  }, []);

  const cascadeX = streamCenterX(-47);

  // Sculpted swimming golden koi orbits in Ho Hoa Dang
  const koiGroupRef = useRef<THREE.Group>(null);
  const koiSpecs = useMemo(
    () => [
      { cx: -3.2, cz: 30.2, r: 2.1, speed: 0.42, phase: 0, color: '#f97316' },
      { cx: 4.5, cz: 31.8, r: 2.6, speed: 0.36, phase: 1.8, color: '#fb923c' },
      { cx: -6.8, cz: 35.5, r: 2.4, speed: 0.45, phase: 3.1, color: '#fef3c7' },
      { cx: 6.2, cz: 36.2, r: 1.9, speed: 0.5, phase: 4.4, color: '#ea580c' },
      { cx: 1.2, cz: 27.2, r: 1.7, speed: 0.48, phase: 2.3, color: '#fdba74' },
    ],
    []
  );

  // Curved stepping stone bridge from pier/shore toward waterside pavilion (-14.5, 28.8)
  const steppingStones = useMemo(() => {
    const stones: Array<{ x: number; z: number; rot: number; scale: number }> = [];
    const count = 9;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const x = THREE.MathUtils.lerp(-14.2, -7.8, t);
      const z = THREE.MathUtils.lerp(28.5, 25.4, t) + Math.sin(t * Math.PI) * 2.2;
      stones.push({ x, z, rot: t * 1.4, scale: 0.42 + (i % 2) * 0.08 });
    }
    return stones;
  }, []);

  return (
    <group>
      {/* 1. Ho Hoa Dang Lake Water Disc (Animated GLSL Ripple & Lantern Caustic Shader) */}
      <mesh
        position={[LAKE_CENTER.x, 0.02, LAKE_CENTER.z]}
        rotation-x={-Math.PI / 2}
        scale={[LAKE_RADIUS_X + 2.8, LAKE_RADIUS_Z + 2.4, 1]}
        material={lakeWaterMat}
        receiveShadow
      >
        <circleGeometry args={[1, 64]} />
      </mesh>

      {/* 2. Flowing Winding Mountain Brook */}
      <mesh geometry={streamGeo} material={streamWaterMat} receiveShadow />

      {/* 3A. North-East Multi-Tiered Mountain Cascade Waterfall & Splash Pool */}
      <group position={[cascadeX, 0.04, -47.5]} rotation-y={-0.38}>
        <mesh position={[0, 2.2, -2.1]} scale={[2.6, 2.5, 1.3]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.6, 1]} />
          <meshStandardMaterial color="#67726a" roughness={0.92} />
        </mesh>
        <mesh position={[-2.2, 1.4, -1.4]} scale={[1.4, 1.6, 1.2]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.3, 1]} />
          <meshStandardMaterial color="#58665d" roughness={0.92} />
        </mesh>
        <mesh position={[2.2, 1.3, -1.2]} scale={[1.4, 1.5, 1.2]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.2, 1]} />
          <meshStandardMaterial color="#5c6960" roughness={0.92} />
        </mesh>

        {/* Upper cliff chute (Animated Waterfall GLSL) */}
        <mesh position={[0, 2.35, -1.35]} rotation-x={0.42} material={waterfallMat}>
          <planeGeometry args={[2.6, 3.2]} />
        </mesh>
        {/* Mid ledge cascade */}
        <mesh position={[0, 1.05, -0.45]} rotation-x={0.38} material={waterfallMat}>
          <planeGeometry args={[3.2, 2.1]} />
        </mesh>
        {/* Splash Pool Foam Rings */}
        <mesh position={[0, 0.05, 0.75]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.9, 2.5, 24]} />
          <meshBasicMaterial
            ref={foamMatRef}
            color="#eefbf6"
            transparent
            opacity={0.6}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 0.55, 0.25]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[2.3, 20]} />
          <meshBasicMaterial color="#e6f7f2" transparent opacity={0.22} depthWrite={false} />
        </mesh>
      </group>

      {/* 3B. Western Mountain Pine Cliff Waterfall Behind Phong Tam Linh */}
      <group position={[-25.5, 2.1, -43.5]} rotation-y={0.45}>
        <mesh position={[0, 2.1, -1.8]} scale={[2.4, 2.8, 1.2]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.5, 1]} />
          <meshStandardMaterial color="#627068" roughness={0.92} />
        </mesh>
        <mesh position={[0, 1.85, -0.8]} rotation-x={0.32} material={waterfallMat}>
          <planeGeometry args={[2.1, 3.9]} />
        </mesh>
        <mesh position={[0, 0.08, 0.35]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[2.1, 20]} />
          <meshStandardMaterial color="#488477" roughness={0.15} metalness={0.25} />
        </mesh>
        <mesh position={[0, 0.14, 0.4]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.7, 1.75, 20]} />
          <meshBasicMaterial color="#f0fdf9" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      </group>

      {/* 4. Two Arched Timber & Stone Bridges Spanning the Brook */}
      {WORLD_BRIDGES.map((b) => (
        <ArchedWoodenBridgeR3F
          key={b.id}
          position={[b.x, b.baseY, b.z]}
          rotationY={b.rotY}
          length={b.length}
          width={b.width}
          archHeight={b.archHeight}
        />
      ))}

      {/* 4B. Waterside Golden Sunset Tea Pavilion & Curved Stepping-Stone Bridge */}
      <group
        position={[-14.5, 0.16, 28.8]}
        rotation-y={0.62}
        onClick={(e) => {
          e.stopPropagation();
          onSelectLantern?.('pavilion');
        }}
      >
        <mesh position={[0, 0.12, 0]} material={woodMat} castShadow receiveShadow>
          <boxGeometry args={[3.4, 0.14, 3.4]} />
        </mesh>
        {[
          [-1.35, -1.35],
          [1.35, -1.35],
          [-1.35, 1.35],
          [1.35, 1.35],
        ].map(([px, pz], idx) => (
          <React.Fragment key={`wp_${idx}`}>
            <mesh position={[px, -0.42, pz]} material={woodMat}>
              <cylinderGeometry args={[0.075, 0.085, 1.0, 8]} />
            </mesh>
            <mesh position={[px, 1.15, pz]} material={brassMat} castShadow>
              <cylinderGeometry args={[0.065, 0.08, 2.05, 8]} />
            </mesh>
          </React.Fragment>
        ))}
        {/* Curved Vermilion & Cedar Two-Tier Pavilion Eaves */}
        <mesh position={[0, 2.38, 0]} rotation-y={Math.PI / 4} castShadow>
          <coneGeometry args={[2.95, 0.78, 4]} />
          <meshStandardMaterial color="#8c2320" roughness={0.6} metalness={0.08} />
        </mesh>
        <mesh position={[0, 2.86, 0]} rotation-y={Math.PI / 4} castShadow>
          <coneGeometry args={[1.75, 0.72, 4]} />
          <meshStandardMaterial color="#6b4423" roughness={0.62} metalness={0.08} />
        </mesh>
        {/* Warm Amber Pavilion Lantern Orb */}
        <mesh position={[0, 1.75, 0]}>
          <sphereGeometry args={[0.2, 10, 8]} />
          <meshStandardMaterial
            color="#fffbeb"
            emissive="#fbbf24"
            emissiveIntensity={1.45}
            toneMapped={false}
          />
        </mesh>
      </group>

      {steppingStones.map((st, idx) => (
        <mesh
          key={`step_stone_${idx}`}
          position={[st.x, 0.06, st.z]}
          rotation-y={st.rot}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[st.scale, st.scale * 1.08, 0.14, 9]} />
          <meshStandardMaterial color="#8b948c" roughness={0.88} metalness={0.04} />
        </mesh>
      ))}

      {/* 5. Rustic Wooden Lakeside Pier Entering Ho Hoa Dang with Hội An Silk Lanterns */}
      <group
        position={[0, 0.24, 19.6]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectLantern?.('pier');
        }}
      >
        <mesh geometry={pierWoodGeo} material={woodMat} castShadow receiveShadow />

        {[
          [-1.0, 3.4],
          [1.0, 3.4],
          [-1.0, 6.8],
          [1.0, 6.8],
        ].map(([px, pz], idx) => (
          <group key={`post_lantern_${idx}`} position={[px, 0.79, pz]}>
            <mesh scale={[1, 1.18, 1]} castShadow>
              <sphereGeometry args={[0.14, 10, 8]} />
              <meshStandardMaterial
                color={idx < 2 ? '#fff1f2' : '#fffbeb'}
                emissive={idx < 2 ? '#f43f5e' : '#f6c56e'}
                emissiveIntensity={1.55}
                roughness={0.3}
                toneMapped={false}
              />
            </mesh>
            {idx >= 2 && <pointLight color="#fde68a" intensity={1.15} distance={7.5} />}
          </group>
        ))}
      </group>

      {/* 6. Moored Wooden Rowboat Gently Bobbing Beside Pier */}
      <Float speed={1.1} rotationIntensity={0.05} floatIntensity={0.08}>
        <group
          position={[2.6, 0.08, 25.4]}
          rotation-y={-0.42}
          onClick={(e) => {
            e.stopPropagation();
            onSelectLantern?.('boat');
          }}
        >
          <mesh scale={[0.85, 0.36, 1.75]} material={woodMat} castShadow receiveShadow>
            <sphereGeometry args={[0.75, 14, 10, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58]} />
          </mesh>
          <mesh position={[0, 0.05, -0.25]} material={woodMat} castShadow>
            <boxGeometry args={[0.88, 0.05, 0.24]} />
          </mesh>
          <mesh position={[0, 0.05, 0.32]} material={woodMat} castShadow>
            <boxGeometry args={[0.82, 0.05, 0.24]} />
          </mesh>
          <mesh position={[0, 0.18, -0.92]} material={brassMat}>
            <cylinderGeometry args={[0.06, 0.07, 0.16, 8]} />
          </mesh>
          <mesh position={[0, 0.18, -0.92]}>
            <sphereGeometry args={[0.052, 8, 8]} />
            <meshStandardMaterial
              color="#fffbeb"
              emissive="#fbbf24"
              emissiveIntensity={1.65}
              toneMapped={false}
            />
          </mesh>
        </group>
      </Float>

      {/* 6B. Graceful Swimming Golden Koi Beneath Ho Hoa Dang Surface */}
      <group ref={koiGroupRef}>
        {koiSpecs.map((spec, idx) => (
          <group key={`koi_${idx}`}>
            <mesh scale={[0.14, 0.08, 0.42]}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshStandardMaterial color={spec.color} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0, -0.34]} rotation-y={Math.PI / 2}>
              <coneGeometry args={[0.1, 0.22, 4]} />
              <meshStandardMaterial color={spec.color} roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 7. Sculpted Multi-Petal Glowing Hoa Đăng Lotus Lanterns Across Lake (Merged Geometries + Shared Materials) */}
      {lanterns.map((lan, idx) => (
        <Float
          key={lan.id}
          speed={1.25 + (idx % 3) * 0.22}
          rotationIntensity={0.08}
          floatIntensity={0.14}
        >
          <group
            position={[lan.x, 0.06, lan.z]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectLantern?.(lan.id);
            }}
          >
            <mesh geometry={lotusAssets.haloGeo} material={lotusAssets.haloMat} />
            <mesh geometry={lotusAssets.padGeo} material={lotusAssets.padMat} />
            <mesh geometry={lotusAssets.outerEvenGeo} material={lotusAssets.outerEvenMat} />
            <mesh geometry={lotusAssets.outerOddGeo} material={lotusAssets.outerOddMat} />
            <mesh geometry={lotusAssets.innerGeo} material={lotusAssets.innerMat} />
            <mesh geometry={lotusAssets.coreGeo} material={lotusAssets.coreMat} />
          </group>
        </Float>
      ))}
    </group>
  );
};
