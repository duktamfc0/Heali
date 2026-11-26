import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { liveSceneActivity } from './roomTypes';
import { groundHeightAt } from './worldLayout';

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface SatelliteIslandSpec {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  depth: number;
  rotY: number;
  bobSpeed: number;
  bobAmp: number;
  phase: number;
  theme: 'sakura_temple' | 'waterfall_crag' | 'emerald_grove';
  hasWaterfall: boolean;
}

const SATELLITE_ISLANDS: SatelliteIslandSpec[] = [
  {
    id: 'sky_isle_nw',
    x: -96,
    y: 12,
    z: -74,
    radius: 17,
    depth: 24,
    rotY: 0.4,
    bobSpeed: 0.45,
    bobAmp: 0.9,
    phase: 0.2,
    theme: 'sakura_temple',
    hasWaterfall: true,
  },
  {
    id: 'sky_isle_ne',
    x: 92,
    y: 16,
    z: -82,
    radius: 19,
    depth: 27,
    rotY: -0.7,
    bobSpeed: 0.38,
    bobAmp: 1.0,
    phase: 1.6,
    theme: 'waterfall_crag',
    hasWaterfall: true,
  },
  {
    id: 'sky_isle_w',
    x: -112,
    y: 4,
    z: 18,
    radius: 14,
    depth: 19,
    rotY: 1.1,
    bobSpeed: 0.52,
    bobAmp: 0.75,
    phase: 2.7,
    theme: 'emerald_grove',
    hasWaterfall: false,
  },
  {
    id: 'sky_isle_e',
    x: 108,
    y: 7,
    z: 14,
    radius: 15,
    depth: 21,
    rotY: -1.3,
    bobSpeed: 0.48,
    bobAmp: 0.85,
    phase: 3.8,
    theme: 'sakura_temple',
    hasWaterfall: true,
  },
  {
    id: 'sky_isle_sw',
    x: -88,
    y: -3,
    z: 86,
    radius: 12.5,
    depth: 17,
    rotY: 2.0,
    bobSpeed: 0.56,
    bobAmp: 0.7,
    phase: 4.5,
    theme: 'emerald_grove',
    hasWaterfall: false,
  },
  {
    id: 'sky_isle_north_peak',
    x: -6,
    y: 22,
    z: -118,
    radius: 24,
    depth: 34,
    rotY: 0.15,
    bobSpeed: 0.32,
    bobAmp: 1.1,
    phase: 1.1,
    theme: 'waterfall_crag',
    hasWaterfall: true,
  },
];

/**
 * Builds an organic inverted rocky cliff spire for the underside of a floating sky island.
 */
function buildFloatingIslandUnderbellyGeometry(
  radius: number,
  depth: number,
  radialSegs: number,
  ringSegs: number,
  seedOffset: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const mossRim = new THREE.Color('#4d7c3f');
  const rockLight = new THREE.Color('#7f8b80');
  const rockDeep = new THREE.Color('#4a5450');
  const celadonMist = new THREE.Color('#86a69d');

  for (let rIdx = 0; rIdx <= ringSegs; rIdx++) {
    const t = rIdx / ringSegs; // 0 = top rim, 1 = bottom spire tip
    const taper = Math.pow(1 - t, 0.78);
    const baseY = -Math.pow(t, 1.12) * depth;

    for (let aIdx = 0; aIdx <= radialSegs; aIdx++) {
      const ang = (aIdx / radialSegs) * Math.PI * 2;
      const crag1 = Math.sin(ang * 5 + seedOffset + t * 4.2) * 0.14;
      const crag2 = Math.cos(ang * 9 - seedOffset * 1.3 + t * 6.5) * 0.08;
      const crag3 = Math.sin(ang * 15 + t * 9.0) * 0.04;
      const r = Math.max(0.15, radius * taper * (1 + crag1 + crag2 + crag3));
      const y = baseY + Math.sin(ang * 6 + t * 5.0) * (0.4 + t * 1.4);

      positions.push(Math.cos(ang) * r, y, Math.sin(ang) * r);

      const c = mossRim.clone();
      if (t < 0.16) {
        c.lerp(rockLight, t / 0.16);
      } else if (t < 0.65) {
        c.copy(rockLight).lerp(rockDeep, (t - 0.16) / 0.49);
      } else {
        c.copy(rockDeep).lerp(celadonMist, (t - 0.65) / 0.35 * 0.45);
      }
      c.toArray(colors, (rIdx * (radialSegs + 1) + aIdx) * 3);
    }
  }

  for (let rIdx = 0; rIdx < ringSegs; rIdx++) {
    for (let aIdx = 0; aIdx < radialSegs; aIdx++) {
      const a = rIdx * (radialSegs + 1) + aIdx;
      const b = a + radialSegs + 1;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, c, b, c, d, b);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Floating Sky-Island Sanctuary World Props:
 * 1. Inverted craggy rock underbelly beneath the main walkable island.
 * 2. Edge-plunging animated waterfalls spilling off the main island cliffs into the clouds.
 * 3. Surrounding orbiting satellite floating islands with sakura & green groves, waterfalls, and vines.
 * 4. Draping sky-cliff vines, orbiting rock shards, and billowing waterfall cloud plumes.
 */
export const FloatingIslandsWorld: React.FC<{ isSoftwareGl?: boolean }> = ({
  isSoftwareGl = false,
}) => {
  const satelliteRefs = useRef<Array<THREE.Group | null>>([]);
  const shardRefs = useRef<Array<THREE.Mesh | null>>([]);

  // Main Island inverted rocky spire beneath the 196x196 walkable terrain
  const mainUnderbellyGeo = useMemo(
    () => buildFloatingIslandUnderbellyGeometry(88, 36, isSoftwareGl ? 36 : 64, 14, 0.7),
    [isSoftwareGl]
  );

  // Shared underbelly geometry for satellite islands (scaled per island)
  const satUnderbellyGeo = useMemo(
    () => buildFloatingIslandUnderbellyGeometry(1.0, 1.0, 22, 9, 2.3),
    []
  );

  // Cascading animated sky-waterfall GLSL shader
  const skyWaterfallMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uWaterColor: { value: new THREE.Color('#5cb8d1') },
          uFoamColor: { value: new THREE.Color('#f4fcff') },
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
            float scrollY = vUv.y * 2.4 + uTime * 1.45;
            float ribbon1 = sin(vUv.x * 26.0) * 0.4 + sin(scrollY * 14.0 + vUv.x * 8.0) * 0.6;
            float ribbon2 = cos(vUv.x * 42.0 - scrollY * 9.0) * 0.35;
            float froth = smoothstep(0.12, 0.85, ribbon1 + ribbon2);

            // Top crest foam + bottom mist dissolve into the sea of clouds
            float crest = smoothstep(0.84, 1.0, vUv.y);
            float mistDissolve = smoothstep(0.0, 0.28, vUv.y);
            float sideFeather = smoothstep(0.0, 0.16, vUv.x) * (1.0 - smoothstep(0.84, 1.0, vUv.x));

            vec3 col = mix(uWaterColor, uFoamColor, clamp(froth * 0.72 + crest * 0.65, 0.0, 1.0));
            float alpha = (0.76 + froth * 0.2) * mistDissolve * sideFeather;
            gl_FragColor = vec4(col, alpha);
          }
        `,
      }),
    []
  );

  const {
    underbellyMat,
    grassCapMat,
    sakuraMat,
    emeraldCanopyMat,
    trunkMat,
    vineMat,
    mistCloudMat,
    templeWallMat,
    templeRoofMat,
    shardMat,
  } = useMemo(
    () => ({
      underbellyMat: new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.9,
        metalness: 0.04,
      }),
      grassCapMat: new THREE.MeshStandardMaterial({
        color: '#5a9142',
        roughness: 0.86,
      }),
      sakuraMat: new THREE.MeshStandardMaterial({
        color: '#f9a8d4',
        emissive: '#f472b6',
        emissiveIntensity: 0.08,
        roughness: 0.72,
      }),
      emeraldCanopyMat: new THREE.MeshStandardMaterial({
        color: '#4f8c3d',
        roughness: 0.8,
      }),
      trunkMat: new THREE.MeshStandardMaterial({
        color: '#6b4e38',
        roughness: 0.92,
      }),
      vineMat: new THREE.MeshStandardMaterial({
        color: '#3f6e38',
        roughness: 0.86,
      }),
      mistCloudMat: new THREE.MeshBasicMaterial({
        color: '#f4f9ff',
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
      }),
      templeWallMat: new THREE.MeshStandardMaterial({
        color: '#efe8da',
        roughness: 0.78,
      }),
      templeRoofMat: new THREE.MeshStandardMaterial({
        color: '#5d7e8a',
        roughness: 0.56,
      }),
      shardMat: new THREE.MeshStandardMaterial({
        color: '#6c7a72',
        roughness: 0.88,
      }),
    }),
    []
  );

  // Draping hanging vines around the main island cliff rim
  const hangingVines = useMemo(() => {
    const items: Array<{ x: number; y: number; z: number; len: number; rot: number }> = [];
    const count = isSoftwareGl ? 24 : 44;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + seededRand(i * 3) * 0.14;
      const r = 84 + seededRand(i * 7) * 4.5;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      const y = Math.min(-0.4, groundHeightAt(x, z) - 0.6);
      items.push({
        x,
        y,
        z,
        len: 4.5 + seededRand(i * 11) * 9.5,
        rot: ang,
      });
    }
    return items;
  }, [isSoftwareGl]);

  // Levitating broken rock shards drifting near island rims
  const floatingShards = useMemo(() => {
    const count = isSoftwareGl ? 14 : 24;
    return Array.from({ length: count }, (_, i) => {
      const ang = (i / count) * Math.PI * 2 + 0.35;
      const r = 88 + (i % 4) * 7.5;
      return {
        x: Math.cos(ang) * r,
        y: -8 + (i % 5) * 4.5,
        z: Math.sin(ang) * r,
        s: 0.8 + (i % 4) * 0.55,
        phase: i * 0.9,
      };
    });
  }, [isSoftwareGl]);

  useEffect(() => {
    return () => {
      mainUnderbellyGeo.dispose();
      satUnderbellyGeo.dispose();
      skyWaterfallMat.dispose();
      underbellyMat.dispose();
      grassCapMat.dispose();
      sakuraMat.dispose();
      emeraldCanopyMat.dispose();
      trunkMat.dispose();
      vineMat.dispose();
      mistCloudMat.dispose();
      templeWallMat.dispose();
      templeRoofMat.dispose();
      shardMat.dispose();
    };
  }, [
    mainUnderbellyGeo,
    satUnderbellyGeo,
    skyWaterfallMat,
    underbellyMat,
    grassCapMat,
    sakuraMat,
    emeraldCanopyMat,
    trunkMat,
    vineMat,
    mistCloudMat,
    templeWallMat,
    templeRoofMat,
    shardMat,
  ]);

  useFrame((state) => {
    if (!liveSceneActivity.isOutdoor) return;
    const t = state.clock.getElapsedTime();
    skyWaterfallMat.uniforms.uTime.value = t;

    satelliteRefs.current.forEach((grp, idx) => {
      const spec = SATELLITE_ISLANDS[idx];
      if (!grp || !spec) return;
      grp.position.y = spec.y + Math.sin(t * spec.bobSpeed + spec.phase) * spec.bobAmp;
    });

    shardRefs.current.forEach((mesh, idx) => {
      const sh = floatingShards[idx];
      if (!mesh || !sh) return;
      mesh.position.y = sh.y + Math.sin(t * 0.9 + sh.phase) * 0.75;
      mesh.rotation.y = t * 0.14 + sh.phase;
    });
  });

  return (
    <group>
      {/* 1. Main Sanctuary Floating Island Inverted Rocky Underbelly */}
      <mesh position={[0, -1.2, 0]} geometry={mainUnderbellyGeo} material={underbellyMat} />

      {/* 2. Draping Hanging Cliff Vines Around Main Sky Island Rim */}
      {hangingVines.map((v, idx) => (
        <mesh
          key={`cliff_vine_${idx}`}
          position={[v.x, v.y - v.len * 0.5, v.z]}
          rotation-z={Math.sin(idx) * 0.08}
          material={vineMat}
        >
          <cylinderGeometry args={[0.04, 0.015, v.len, 5]} />
        </mesh>
      ))}

      {/* 3. Dramatic Edge-Plunging Waterfalls Pouring Off the Main Island Cliff Rim Into Clouds */}
      {/* 3A. Southern Sky-Island Cliff Waterfall spilling below Hồ Hoa Đăng */}
      <group position={[0, -0.5, 86.2]} rotation-y={0}>
        {/* Narrow spilling chute leading off the southern grass rim */}
        <mesh position={[0, 0.38, -20.0]} rotation-x={-Math.PI / 2} material={skyWaterfallMat}>
          <planeGeometry args={[7.2, 41.0]} />
        </mesh>
        <mesh position={[0, -13.0, 0.6]} material={skyWaterfallMat}>
          <planeGeometry args={[12.0, 29]} />
        </mesh>
        <mesh position={[-4.0, -12.5, 1.0]} rotation-y={0.22} material={skyWaterfallMat}>
          <planeGeometry args={[6.0, 28]} />
        </mesh>
        <mesh position={[4.0, -12.5, 1.0]} rotation-y={-0.22} material={skyWaterfallMat}>
          <planeGeometry args={[6.0, 28]} />
        </mesh>
        {/* Crest foam & billowing cloud plunge mist */}
        <mesh position={[0, 0.25, -0.4]} rotation-x={-Math.PI / 2} material={mistCloudMat}>
          <circleGeometry args={[7.0, 20]} />
        </mesh>
        <mesh position={[0, -21.0, 2.0]} rotation-x={-Math.PI / 2} material={mistCloudMat}>
          <circleGeometry args={[14.0, 24]} />
        </mesh>
      </group>

      {/* 3B. South-East Coastal Lagoon Abyss Waterfall */}
      <group position={[56, -0.5, 65.5]} rotation-y={0.68}>
        <mesh position={[0, -13.5, 0.6]} material={skyWaterfallMat}>
          <planeGeometry args={[15.5, 30]} />
        </mesh>
        <mesh position={[0, 0.25, -0.4]} rotation-x={-Math.PI / 2} material={mistCloudMat}>
          <circleGeometry args={[8.5, 20]} />
        </mesh>
        <mesh position={[0, -21.0, 1.8]} rotation-x={-Math.PI / 2} material={mistCloudMat}>
          <circleGeometry args={[15.0, 24]} />
        </mesh>
      </group>

      {/* 4. Surrounding Floating Satellite Sky Islands (with Trees, Sakura, Temples & Waterfalls) */}
      {SATELLITE_ISLANDS.map((isle, idx) => (
        <group
          key={isle.id}
          ref={(el) => {
            satelliteRefs.current[idx] = el;
          }}
          position={[isle.x, isle.y, isle.z]}
          rotation-y={isle.rotY}
        >
          {/* Inverted craggy floating island rock body */}
          <mesh
            scale={[isle.radius, isle.depth, isle.radius]}
            geometry={satUnderbellyGeo}
            material={underbellyMat}
            castShadow
            receiveShadow
          />

          {/* Lush green domed meadow top */}
          <mesh position={[0, 0.35, 0]} scale={[isle.radius * 0.98, 1.6, isle.radius * 0.98]} material={grassCapMat} receiveShadow>
            <sphereGeometry args={[1, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
          </mesh>

          {/* Misty aura ring hugging the floating island */}
          <mesh position={[0, -isle.depth * 0.22, 0]} rotation-x={-Math.PI / 2} material={mistCloudMat}>
            <ringGeometry args={[isle.radius * 0.65, isle.radius * 1.45, 24]} />
          </mesh>

          {/* Lush trees & sakura blossoms perched atop the floating island */}
          {[
            { tx: -isle.radius * 0.35, tz: -isle.radius * 0.18, s: 1.15, pink: isle.theme === 'sakura_temple' },
            { tx: isle.radius * 0.32, tz: isle.radius * 0.22, s: 1.0, pink: isle.theme !== 'emerald_grove' },
            { tx: 0.4, tz: -isle.radius * 0.38, s: 1.28, pink: isle.theme === 'sakura_temple' },
            { tx: -isle.radius * 0.16, tz: isle.radius * 0.36, s: 0.9, pink: false },
          ].map((tree, tIdx) => (
            <group key={`${isle.id}_tr_${tIdx}`} position={[tree.tx, 1.1, tree.tz]} scale={tree.s}>
              <mesh position={[0, 1.2, 0]} material={trunkMat} castShadow>
                <cylinderGeometry args={[0.24, 0.42, 2.6, 7]} />
              </mesh>
              <mesh
                position={[0, 2.9, 0]}
                material={tree.pink ? sakuraMat : emeraldCanopyMat}
                castShadow
              >
                <dodecahedronGeometry args={[1.65, 1]} />
              </mesh>
              <mesh
                position={[0.85, 2.35, 0.5]}
                material={tree.pink ? sakuraMat : emeraldCanopyMat}
                castShadow
              >
                <dodecahedronGeometry args={[1.05, 1]} />
              </mesh>
            </group>
          ))}

          {/* Optional Floating Sanctuary Pavilion on sakura_temple islands */}
          {isle.theme === 'sakura_temple' && (
            <group position={[0, 1.4, 0]}>
              <mesh position={[0, 1.2, 0]} material={templeWallMat} castShadow>
                <cylinderGeometry args={[1.9, 2.1, 2.4, 8]} />
              </mesh>
              <mesh position={[0, 3.3, 0]} material={templeRoofMat} castShadow>
                <coneGeometry args={[2.75, 2.1, 8]} />
              </mesh>
              <mesh position={[0, 4.9, 0]} material={templeWallMat}>
                <cylinderGeometry args={[0.85, 1.0, 1.3, 8]} />
              </mesh>
              <mesh position={[0, 6.2, 0]} material={sakuraMat}>
                <coneGeometry args={[1.35, 1.5, 8]} />
              </mesh>
            </group>
          )}

          {/* Optional Edge-Cascading Waterfall plunging off the satellite island */}
          {isle.hasWaterfall && (
            <group position={[0, 0.4, isle.radius * 0.92]}>
              <mesh position={[0, -11.5, 0.4]} material={skyWaterfallMat}>
                <planeGeometry args={[isle.radius * 0.34, 24]} />
              </mesh>
              <mesh position={[0, -21.0, 0.8]} rotation-x={-Math.PI / 2} material={mistCloudMat}>
                <circleGeometry args={[isle.radius * 0.48, 16]} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* 5. Orbiting Floating Stone Shards */}
      {floatingShards.map((sh, idx) => (
        <mesh
          key={`shard_${idx}`}
          ref={(el) => {
            shardRefs.current[idx] = el;
          }}
          position={[sh.x, sh.y, sh.z]}
          scale={sh.s}
          material={shardMat}
          castShadow
        >
          <dodecahedronGeometry args={[0.95, 0]} />
        </mesh>
      ))}
    </group>
  );
};
