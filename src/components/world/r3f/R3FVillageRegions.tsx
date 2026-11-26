import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import {
  getBarkTexture,
  getFoliageSprigTexture,
  getSlateShingleTexture,
  getWoodPlankTexture,
} from '../ProceduralTextures';
import { groundHeightAt, streamCenterX } from './worldLayout';
import { liveSceneActivity } from './roomTypes';

// Deterministic PRNG for repeatable lush layouts without Math.random drift across renders
function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const _dummy = new THREE.Object3D();

/**
 * 1. MIỀN QUÊ (Vietnamese Countryside)
 * Terraced green-gold rice paddies, swaying stalks, mud dikes, rustic chòi đồng quê, bamboo grove & Cọn nước waterwheel.
 */
export const MienQueCountryside: React.FC<{ isSoftwareGl: boolean }> = ({ isSoftwareGl }) => {
  const waterwheelRef = useRef<THREE.Group>(null);
  const stalkMeshRef = useRef<THREE.InstancedMesh>(null);
  const stalkUniformRef = useRef<{ uTime: { value: number } }>({ uTime: { value: 0 } });

  const woodTex = getWoodPlankTexture();
  const thatchTex = getSlateShingleTexture('moss_cedar');
  const barkTex = getBarkTexture();

  const {
    dikeMat,
    paddyWaterMat,
    stalkGeo,
    stalkMat,
    woodMat,
    bambooMat,
    bambooNodeMat,
    clayMat,
    thatchMat,
  } = useMemo(() => {
    const dike = new THREE.MeshStandardMaterial({ color: 0x6f5a3e, roughness: 0.92 });
    const paddyWater = new THREE.MeshStandardMaterial({
      color: 0x5c8568,
      roughness: 0.16,
      metalness: 0.25,
      transparent: true,
      opacity: 0.86,
    });
    const wood = new THREE.MeshStandardMaterial({
      map: woodTex,
      color: 0x8a5e3c,
      roughness: 0.82,
    });
    const thatch = new THREE.MeshStandardMaterial({
      map: thatchTex,
      color: 0xb98d4a,
      roughness: 0.92,
    });
    const bamboo = new THREE.MeshStandardMaterial({ color: 0x5d8c49, roughness: 0.65, metalness: 0.04 });
    const bambooNode = new THREE.MeshStandardMaterial({ color: 0x456b36, roughness: 0.72, metalness: 0.04 });
    const clay = new THREE.MeshStandardMaterial({ color: 0x9c5238, roughness: 0.78, metalness: 0.04 });

    // Slim tapered emerald-gold rice stalk cone geometry
    const sGeo = new THREE.ConeGeometry(0.06, 0.72, 4, 1);
    sGeo.translate(0, 0.36, 0);

    const sMat = new THREE.MeshStandardMaterial({
      color: 0x98b948,
      roughness: 0.78,
    });
    sMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = stalkUniformRef.current.uTime;
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vec4 instOrigin = vec4(0.0, 0.0, 0.0, 1.0);
         #ifdef USE_INSTANCING
           instOrigin = instanceMatrix * instOrigin;
         #endif
         float hFactor = clamp(position.y / 0.72, 0.0, 1.0);
         float gust = sin(uTime * 1.9 + instOrigin.x * 0.65 + instOrigin.z * 0.55) * 0.12 * hFactor * hFactor;
         transformed.x += gust;
         transformed.z += gust * 0.55;`
      );
    };

    return {
      dikeMat: dike,
      paddyWaterMat: paddyWater,
      stalkGeo: sGeo,
      stalkMat: sMat,
      woodMat: wood,
      bambooMat: bamboo,
      bambooNodeMat: bambooNode,
      clayMat: clay,
      thatchMat: thatch,
    };
  }, [woodTex, thatchTex]);

  useEffect(() => {
    return () => {
      dikeMat.dispose();
      paddyWaterMat.dispose();
      stalkGeo.dispose();
      stalkMat.dispose();
      woodMat.dispose();
      bambooMat.dispose();
      bambooNodeMat.dispose();
      clayMat.dispose();
      thatchMat.dispose();
    };
  }, [
    dikeMat,
    paddyWaterMat,
    stalkGeo,
    stalkMat,
    woodMat,
    bambooMat,
    bambooNodeMat,
    clayMat,
    thatchMat,
  ]);

  const paddyPools = useMemo(
    () => [
      { cx: -18.0, cz: 11.4, w: 6.8, d: 3.8, rotY: 0.14, y: 0.56 },
      { cx: -23.4, cz: 13.8, w: 5.6, d: 3.4, rotY: -0.08, y: 0.53 },
      { cx: -13.6, cz: 15.0, w: 5.4, d: 3.2, rotY: 0.22, y: 0.5 },
    ],
    []
  );

  // Populate swaying emerald-gold rice stalks inside the 3 paddy pools
  const stalkData = useMemo(() => {
    const count = isSoftwareGl ? 180 : 420;
    const arr: Array<{ x: number; y: number; z: number; rotY: number; scale: number; color: THREE.Color }> = [];
    const colGreen = new THREE.Color('#70a843');
    const colGold = new THREE.Color('#d8b648');

    for (let i = 0; i < count; i++) {
      const pool = paddyPools[i % paddyPools.length];
      const u = (seededRand(i * 3 + 1) - 0.5) * (pool.w - 0.6);
      const v = (seededRand(i * 3 + 2) - 0.5) * (pool.d - 0.6);
      const cos = Math.cos(pool.rotY);
      const sin = Math.sin(pool.rotY);
      const wx = pool.cx + u * cos + v * sin;
      const wz = pool.cz - u * sin + v * cos;
      const tCol = seededRand(i * 5 + 7);
      arr.push({
        x: wx,
        y: pool.y - 0.02,
        z: wz,
        rotY: seededRand(i * 7 + 3) * Math.PI * 2,
        scale: 0.8 + seededRand(i * 11) * 0.45,
        color: new THREE.Color().lerpColors(colGreen, colGold, tCol),
      });
    }
    return arr;
  }, [isSoftwareGl, paddyPools]);

  useEffect(() => {
    const mesh = stalkMeshRef.current;
    if (!mesh) return;
    stalkData.forEach((s, idx) => {
      _dummy.position.set(s.x, s.y, s.z);
      _dummy.rotation.set(0, s.rotY, 0);
      _dummy.scale.set(s.scale, s.scale, s.scale);
      _dummy.updateMatrix();
      mesh.setMatrixAt(idx, _dummy.matrix);
      mesh.setColorAt(idx, s.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [stalkData]);

  // Village bamboo clumps beside rice paddies
  const bambooClusters = useMemo(
    () => [
      { x: -26.5, z: 9.8 },
      { x: -25.2, z: 16.5 },
      { x: -11.2, z: 11.2 },
    ],
    []
  );

  // Cọn nước (wooden waterwheel) near winding brook at z = 10
  const wheelPos = useMemo<[number, number, number]>(() => {
    const wx = streamCenterX(10) - 2.6;
    const wz = 10;
    return [wx, groundHeightAt(wx, wz) + 0.85, wz];
  }, []);

  const choiY = groundHeightAt(-14.5, 9.2);

  useFrame((state, delta) => {
    if (!liveSceneActivity.isOutdoor) return;
    stalkUniformRef.current.uTime.value = state.clock.getElapsedTime();
    if (waterwheelRef.current) {
      waterwheelRef.current.rotation.z -= Math.min(0.05, delta) * 0.65;
    }
  });

  return (
    <group>
      {/* 1. Three Flooded Terraced Paddy Pools & Raised Mud Dikes */}
      {paddyPools.map((pool, idx) => (
        <group key={`paddy_${idx}`} position={[pool.cx, pool.y, pool.cz]} rotation-y={pool.rotY}>
          {/* Shimmering paddy water plane */}
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[pool.w, pool.d]} />
            <primitive object={paddyWaterMat} attach="material" />
          </mesh>
          {/* Four raised earthen dike borders */}
          <mesh position={[0, 0.08, pool.d / 2 + 0.14]} material={dikeMat} receiveShadow castShadow>
            <boxGeometry args={[pool.w + 0.5, 0.22, 0.34]} />
          </mesh>
          <mesh position={[0, 0.08, -pool.d / 2 - 0.14]} material={dikeMat} receiveShadow castShadow>
            <boxGeometry args={[pool.w + 0.5, 0.22, 0.34]} />
          </mesh>
          <mesh position={[pool.w / 2 + 0.14, 0.08, 0]} material={dikeMat} receiveShadow castShadow>
            <boxGeometry args={[0.34, 0.22, pool.d]} />
          </mesh>
          <mesh position={[-pool.w / 2 - 0.14, 0.08, 0]} material={dikeMat} receiveShadow castShadow>
            <boxGeometry args={[0.34, 0.22, pool.d]} />
          </mesh>
        </group>
      ))}

      {/* 2. Swaying InstancedMesh Emerald-Gold Rice Stalks */}
      <instancedMesh
        ref={stalkMeshRef}
        args={[stalkGeo, stalkMat, stalkData.length]}
        castShadow={!isSoftwareGl}
      />

      {/* 3. Chòi Đồng Quê (Thatched Country Resting Pavilion) at (-14.5, 9.2) */}
      <group position={[-14.5, choiY, 9.2]} rotation-y={0.42}>
        <mesh position={[0, 0.12, 0]} material={woodMat} castShadow receiveShadow>
          <boxGeometry args={[2.6, 0.16, 2.4]} />
        </mesh>
        {[
          [-1.08, -0.98],
          [1.08, -0.98],
          [-1.08, 0.98],
          [1.08, 0.98],
        ].map(([px, pz], idx) => (
          <mesh key={`choi_post_${idx}`} position={[px, 1.05, pz]} material={woodMat} castShadow>
            <cylinderGeometry args={[0.06, 0.07, 1.9, 8]} />
          </mesh>
        ))}
        {/* Pyramidal thatched palm roof */}
        <mesh position={[0, 2.25, 0]} rotation-y={Math.PI / 4} material={thatchMat} castShadow>
          <coneGeometry args={[2.25, 0.95, 4]} />
        </mesh>
        {/* Warm hanging bamboo lantern inside Chòi */}
        <mesh position={[0, 1.75, 0]}>
          <sphereGeometry args={[0.14, 10, 8]} />
          <meshStandardMaterial
            color="#fffbeb"
            emissive="#f59e0b"
            emissiveIntensity={1.35}
            toneMapped={false}
          />
        </mesh>
        {/* Bamboo rest bench & clay rainwater jar (Chum sành) */}
        <mesh position={[0, 0.42, -0.45]} material={woodMat} castShadow>
          <boxGeometry args={[1.55, 0.08, 0.58]} />
        </mesh>
        <mesh position={[1.38, 0.28, 0.72]} material={clayMat} castShadow>
          <cylinderGeometry args={[0.2, 0.25, 0.56, 12]} />
        </mesh>
      </group>

      {/* 4. Village Bamboo Clumps (Lũy Tre Làng) */}
      {bambooClusters.map((b, cIdx) => {
        const by = groundHeightAt(b.x, b.z);
        return (
          <group key={`bamboo_clump_${cIdx}`} position={[b.x, by, b.z]}>
            {[0, 1, 2, 3, 4].map((stem) => {
              const ox = (seededRand(cIdx * 20 + stem) - 0.5) * 1.1;
              const oz = (seededRand(cIdx * 20 + stem + 9) - 0.5) * 1.1;
              const h = 3.1 + seededRand(cIdx * 10 + stem) * 1.6;
              return (
                <group
                  key={`b_stem_${stem}`}
                  position={[ox, 0, oz]}
                  rotation-z={(seededRand(stem + 5) - 0.5) * 0.14}
                  rotation-x={(seededRand(stem + 2) - 0.5) * 0.12}
                >
                  <mesh position={[0, h / 2, 0]} material={bambooMat} castShadow>
                    <cylinderGeometry args={[0.045, 0.065, h, 6]} />
                  </mesh>
                  <mesh position={[0, h * 0.45, 0]} material={bambooNodeMat}>
                    <cylinderGeometry args={[0.066, 0.066, 0.05, 6]} />
                  </mesh>
                  <mesh position={[0, h * 0.92, 0]} material={oakOrBambooLeafMat(barkTex)}>
                    <coneGeometry args={[0.52, 0.85, 5]} />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}

      {/* 5. Cọn Nước (Rotating Bamboo Stream Waterwheel) */}
      <group position={wheelPos} rotation-y={-0.32}>
        {/* Supporting A-frame timber posts */}
        <mesh position={[0, -0.45, -0.45]} rotation-x={0.18} material={woodMat} castShadow>
          <cylinderGeometry args={[0.055, 0.065, 1.75, 6]} />
        </mesh>
        <mesh position={[0, -0.45, 0.45]} rotation-x={-0.18} material={woodMat} castShadow>
          <cylinderGeometry args={[0.055, 0.065, 1.75, 6]} />
        </mesh>
        <group ref={waterwheelRef}>
          <mesh material={woodMat} castShadow>
            <torusGeometry args={[1.05, 0.055, 8, 20]} />
          </mesh>
          <mesh rotation-x={Math.PI / 2} material={woodMat}>
            <cylinderGeometry args={[0.06, 0.06, 0.72, 8]} />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((sp) => (
            <group key={`sp_${sp}`} rotation-z={(sp * Math.PI) / 3}>
              <mesh material={bambooMat} castShadow>
                <boxGeometry args={[2.05, 0.045, 0.06]} />
              </mesh>
              <mesh position={[1.05, 0, 0]} material={bambooNodeMat} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 0.24, 6]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* 6. Golden Village Straw Haystacks (Đống Rơm Đồng Quê) */}
      {[
        { x: -29.2, z: 4.5, s: 1.0 },
        { x: -27.4, z: 6.2, s: 0.85 },
      ].map((hs, idx) => (
        <group
          key={`haystack_${idx}`}
          position={[hs.x, groundHeightAt(hs.x, hs.z), hs.z]}
          scale={hs.s}
        >
          <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.68, 0.84, 0.96, 12]} />
            <meshStandardMaterial color="#c99e44" roughness={0.92} />
          </mesh>
          <mesh position={[0, 1.32, 0]} castShadow>
            <coneGeometry args={[0.74, 0.78, 12]} />
            <meshStandardMaterial color="#d9b052" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.78, 0]} material={bambooMat}>
            <cylinderGeometry args={[0.04, 0.04, 0.28, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Lightweight memo-less helper for clean bamboo canopy color without external shader coupling
const sharedBambooLeafMat = new THREE.MeshStandardMaterial({
  color: 0x4f8a42,
  roughness: 0.76,
});
function oakOrBambooLeafMat(_unused: THREE.Texture) {
  return sharedBambooLeafMat;
}

/**
 * 2. MIỀN NÚI (Vietnamese Highlands — Ninh Bình Limestone Karst Pinnacles & Terraces)
 */
export const MienNuiHighlands: React.FC = () => {
  const mistGroupRef = useRef<THREE.Group>(null);

  const { karstStoneMat, karstMossMat, terraceWallMat, terraceWaterMat, mistMat } = useMemo(() => {
    const stone = new THREE.MeshStandardMaterial({ color: 0x67726b, roughness: 0.92 });
    const moss = new THREE.MeshStandardMaterial({ color: 0x3f6b47, roughness: 0.86 });
    const wall = new THREE.MeshStandardMaterial({ color: 0x6d5d44, roughness: 0.9 });
    const water = new THREE.MeshStandardMaterial({
      color: 0x4d8c80,
      roughness: 0.16,
      metalness: 0.24,
    });
    const mist = new THREE.MeshBasicMaterial({
      color: 0xf1f5f9,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    return {
      karstStoneMat: stone,
      karstMossMat: moss,
      terraceWallMat: wall,
      terraceWaterMat: water,
      mistMat: mist,
    };
  }, []);

  useEffect(() => {
    return () => {
      karstStoneMat.dispose();
      karstMossMat.dispose();
      terraceWallMat.dispose();
      terraceWaterMat.dispose();
      mistMat.dispose();
    };
  }, [karstStoneMat, karstMossMat, terraceWallMat, terraceWaterMat, mistMat]);

  const karstPinnacles = useMemo(
    () => [
      { x: -36, z: -54, h: 17.5, r: 5.4, rot: 0.4 },
      { x: 6, z: -56, h: 20.5, r: 6.2, rot: 1.2 },
      { x: 34, z: -52, h: 16.5, r: 5.0, rot: 2.1 },
    ],
    []
  );

  // 4 stepped Tây Bắc terraced fields descending toward central valley (x: 11..25, z: -36..-23)
  const terraces = useMemo(
    () => [
      { x: 17.5, z: -34.5, rx: 5.6, rz: 2.2, yOffset: 0.05 },
      { x: 18.0, z: -31.8, rx: 6.1, rz: 2.2, yOffset: -0.35 },
      { x: 18.4, z: -29.0, rx: 6.6, rz: 2.2, yOffset: -0.75 },
      { x: 18.8, z: -26.2, rx: 7.0, rz: 2.2, yOffset: -1.15 },
    ],
    []
  );

  const mistRibbons = useMemo(
    () => [
      { x: -16, y: 8.8, z: -49, sx: 18, sz: 6, phase: 0.3 },
      { x: 14, y: 10.2, z: -51, sx: 22, sz: 7, phase: 1.9 },
      { x: -30, y: 7.5, z: -46, sx: 15, sz: 5.5, phase: 3.4 },
    ],
    []
  );

  useFrame((state) => {
    if (!liveSceneActivity.isOutdoor || !mistGroupRef.current) return;
    const t = state.clock.getElapsedTime();
    mistGroupRef.current.children.forEach((child, idx) => {
      const m = mistRibbons[idx];
      if (!m) return;
      child.position.x = m.x + Math.sin(t * 0.18 + m.phase) * 3.8;
      child.position.y = m.y + Math.cos(t * 0.25 + m.phase) * 0.45;
    });
  });

  return (
    <group>
      {/* 1. Towering Ninh Bình Limestone Karst Pinnacles (Multi-Tiered Tiên Hiệp Spires) */}
      {karstPinnacles.map((k, idx) => {
        const ky = groundHeightAt(k.x, k.z);
        return (
          <group key={`karst_${idx}`} position={[k.x, ky - 1.2, k.z]} rotation-y={k.rot}>
            <mesh position={[0, k.h * 0.48, 0]} material={karstStoneMat} castShadow receiveShadow>
              <cylinderGeometry args={[k.r * 0.24, k.r * 0.95, k.h, 11]} />
            </mesh>
            <mesh
              position={[k.r * 0.56, k.h * 0.34, k.r * 0.25]}
              material={karstStoneMat}
              castShadow
              receiveShadow
            >
              <cylinderGeometry args={[k.r * 0.16, k.r * 0.6, k.h * 0.74, 9]} />
            </mesh>
            <mesh
              position={[-k.r * 0.46, k.h * 0.28, -k.r * 0.3]}
              material={karstStoneMat}
              castShadow
              receiveShadow
            >
              <cylinderGeometry args={[k.r * 0.18, k.r * 0.52, k.h * 0.58, 9]} />
            </mesh>
            {/* Mossy limestone crown foliage */}
            <mesh position={[0, k.h * 0.9, 0]} material={karstMossMat} castShadow>
              <dodecahedronGeometry args={[k.r * 0.52, 1]} />
            </mesh>
            <mesh
              position={[k.r * 0.5, k.h * 0.7, k.r * 0.22]}
              material={karstMossMat}
              castShadow
            >
              <dodecahedronGeometry args={[k.r * 0.34, 1]} />
            </mesh>
          </group>
        );
      })}

      {/* 2. Stepped Tây Bắc Rice Terraces (Ruộng Bậc Thang) */}
      {terraces.map((tr, idx) => {
        const baseGround = groundHeightAt(17.5, -34.5) + 0.12;
        const ty = baseGround + tr.yOffset;
        return (
          <group key={`terrace_${idx}`} position={[tr.x, ty, tr.z]} rotation-y={-0.18}>
            <mesh scale={[tr.rx, 0.45, tr.rz]} material={terraceWallMat} receiveShadow castShadow>
              <cylinderGeometry args={[1, 1.06, 1, 18]} />
            </mesh>
            <mesh
              position={[0, 0.24, 0]}
              rotation-x={-Math.PI / 2}
              scale={[tr.rx * 0.94, tr.rz * 0.9, 1]}
              material={terraceWaterMat}
              receiveShadow
            >
              <circleGeometry args={[1, 20]} />
            </mesh>
          </group>
        );
      })}

      {/* 3. Drifting Translucent Mountain Mist Layers */}
      <group ref={mistGroupRef}>
        {mistRibbons.map((m, idx) => (
          <mesh
            key={`mist_${idx}`}
            position={[m.x, m.y, m.z]}
            rotation-x={-Math.PI / 2}
            material={mistMat}
          >
            <circleGeometry args={[m.sx * 0.48, 20]} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/**
 * 3. MIỀN BIỂN (South-East Turquoise Coastal Bay, Golden Beach, Palms & Basket Boats)
 */
export const MienBienCoastalBay: React.FC<{ isSoftwareGl: boolean }> = ({ isSoftwareGl }) => {
  const sampanRef = useRef<THREE.Group>(null);
  const thungRef = useRef<THREE.Group>(null);
  const palmCrownGroupRef = useRef<THREE.Group>(null);

  const woodTex = getWoodPlankTexture();
  const palmTex = getFoliageSprigTexture('tropical_palm');

  const oceanMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uShallowColor: { value: new THREE.Color('#42b8b5') },
          uDeepColor: { value: new THREE.Color('#0f6b78') },
          uSunColor: { value: new THREE.Color('#fef3c7') },
        },
        vertexShader: `
          uniform float uTime;
          varying vec2 vUv;
          varying vec2 vWorldXZ;
          varying float vWaveH;
          void main() {
            vUv = uv;
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            float w1 = sin(worldPos.x * 0.25 + uTime * 1.45) * 0.06;
            float w2 = cos(worldPos.z * 0.28 - uTime * 1.15) * 0.05;
            worldPos.y += w1 + w2;
            vWaveH = w1 + w2;
            vWorldXZ = worldPos.xz;
            gl_Position = projectionMatrix * viewMatrix * worldPos;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uShallowColor;
          uniform vec3 uDeepColor;
          uniform vec3 uSunColor;
          varying vec2 vUv;
          varying vec2 vWorldXZ;
          varying float vWaveH;

          void main() {
            float shoreLine = 49.5 + sin(vWorldXZ.x * 0.09) * 2.2;
            float distFromShore = max(0.0, vWorldXZ.y - shoreLine);
            float depthMix = smoothstep(0.0, 20.0, distFromShore);

            vec3 waterCol = mix(uShallowColor, uDeepColor, depthMix);

            float waveEdge = sin(distFromShore * 1.7 - uTime * 2.2 + sin(vWorldXZ.x * 0.18));
            float foamLine = smoothstep(0.76, 0.98, waveEdge) * (1.0 - smoothstep(0.0, 5.5, distFromShore));
            float shoreFoam = 1.0 - smoothstep(0.0, 1.85, distFromShore);
            float foam = clamp(foamLine * 0.8 + shoreFoam * 0.65, 0.0, 1.0);

            float shimmer = smoothstep(0.04, 0.11, vWaveH) * 0.36;
            vec3 finalCol = mix(waterCol + uSunColor * shimmer, vec3(0.95, 0.99, 1.0), foam * 0.72);
            float radialFade = 1.0 - smoothstep(0.78, 1.0, length(vUv - 0.5) * 2.0);
            float edgeAlpha = smoothstep(-0.6, 1.5, vWorldXZ.y - shoreLine) * radialFade * 0.94;

            if (edgeAlpha < 0.02) discard;
            gl_FragColor = vec4(finalCol, clamp(edgeAlpha, 0.02, 0.95));
          }
        `,
      }),
    []
  );

  const {
    woodMat,
    darkWoodMat,
    wovenBambooMat,
    palmTrunkMat,
    palmFrondMat,
    isletStoneMat,
    isletGreenMat,
    lanternWarmMat,
  } = useMemo(() => {
    const wood = new THREE.MeshStandardMaterial({ map: woodTex, color: 0x8a6142, roughness: 0.8 });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x5c3c24, roughness: 0.82 });
    const woven = new THREE.MeshStandardMaterial({ color: 0xc49c5d, roughness: 0.88 });
    const trunk = new THREE.MeshStandardMaterial({ color: 0x7c5a41, roughness: 0.9 });
    const frond = new THREE.MeshStandardMaterial({
      map: palmTex,
      color: 0x5ca348,
      alphaTest: 0.34,
      side: THREE.DoubleSide,
      roughness: 0.72,
    });
    const isletStone = new THREE.MeshStandardMaterial({ color: 0x67726b, roughness: 0.92 });
    const isletGreen = new THREE.MeshStandardMaterial({ color: 0x3e6b46, roughness: 0.86 });
    const lanternWarm = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.5,
      toneMapped: false,
    });
    return {
      woodMat: wood,
      darkWoodMat: darkWood,
      wovenBambooMat: woven,
      palmTrunkMat: trunk,
      palmFrondMat: frond,
      isletStoneMat: isletStone,
      isletGreenMat: isletGreen,
      lanternWarmMat: lanternWarm,
    };
  }, [woodTex, palmTex]);

  // Sculpted curved leaning coconut palm trunks using TubeGeometry
  const palmTrees = useMemo(() => {
    const spots = [
      { x: 33.5, z: 45.8, h: 6.2, leanX: 1.4, leanZ: 1.6, rot: 0.2 },
      { x: 40.8, z: 46.8, h: 6.8, leanX: 1.6, leanZ: 1.8, rot: 0.8 },
      { x: 47.5, z: 45.2, h: 5.9, leanX: -1.1, leanZ: 1.7, rot: 1.5 },
      { x: 53.5, z: 48.0, h: 6.4, leanX: -1.4, leanZ: 1.5, rot: 2.3 },
      { x: 28.5, z: 47.2, h: 5.6, leanX: 1.2, leanZ: 1.5, rot: 2.9 },
    ];
    return spots.map((s) => {
      const yBase = groundHeightAt(s.x, s.z);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(s.leanX * 0.35, s.h * 0.45, s.leanZ * 0.32),
        new THREE.Vector3(s.leanX, s.h, s.leanZ),
      ]);
      const trunkGeo = new THREE.TubeGeometry(curve, 12, 0.14, 7, false);
      return { ...s, yBase, trunkGeo, top: [s.leanX, s.h, s.leanZ] as [number, number, number] };
    });
  }, []);

  useEffect(() => {
    return () => {
      oceanMat.dispose();
      woodMat.dispose();
      darkWoodMat.dispose();
      wovenBambooMat.dispose();
      palmTrunkMat.dispose();
      palmFrondMat.dispose();
      isletStoneMat.dispose();
      isletGreenMat.dispose();
      lanternWarmMat.dispose();
      palmTrees.forEach((p) => p.trunkGeo.dispose());
    };
  }, [
    oceanMat,
    woodMat,
    darkWoodMat,
    wovenBambooMat,
    palmTrunkMat,
    palmFrondMat,
    isletStoneMat,
    isletGreenMat,
    lanternWarmMat,
    palmTrees,
  ]);

  const islets = useMemo(
    () => [
      { x: 50, z: 62, r: 3.4, h: 9.2 },
      { x: 57, z: 54, r: 3.8, h: 10.6 },
      { x: 35, z: 64, r: 3.2, h: 8.8 },
    ],
    []
  );

  useFrame((state) => {
    if (!liveSceneActivity.isOutdoor) return;
    const t = state.clock.getElapsedTime();
    oceanMat.uniforms.uTime.value = t;
    if (sampanRef.current) {
      sampanRef.current.position.y = 0.08 + Math.sin(t * 1.4) * 0.06;
      sampanRef.current.rotation.z = Math.cos(t * 1.2) * 0.04;
    }
    if (thungRef.current) {
      thungRef.current.position.y = 0.08 + Math.cos(t * 1.65 + 0.8) * 0.055;
      thungRef.current.rotation.x = Math.sin(t * 1.3 + 0.4) * 0.045;
    }
    if (palmCrownGroupRef.current) {
      palmCrownGroupRef.current.children.forEach((crown, idx) => {
        crown.rotation.z = Math.sin(t * 1.1 + idx) * 0.045;
      });
    }
  });

  const chairGroundY = groundHeightAt(34.5, 46.5);

  return (
    <group>
      {/* 1. Cliff-Rimmed Turquoise Sky-Island Coastal Lagoon (stays strictly inside island rim) */}
      <mesh position={[44, 0.04, 57]} rotation-x={-Math.PI / 2} material={oceanMat}>
        <circleGeometry args={[24, isSoftwareGl ? 32 : 56]} />
      </mesh>

      {/* 2. Offshore Ha Long / Ninh Hai Limestone Sea-Stack Islets */}
      {islets.map((isl, idx) => (
        <group key={`islet_${idx}`} position={[isl.x, -0.8, isl.z]}>
          <mesh position={[0, isl.h * 0.46, 0]} material={isletStoneMat} castShadow receiveShadow>
            <cylinderGeometry args={[isl.r * 0.46, isl.r, isl.h, 8]} />
          </mesh>
          <mesh position={[0, isl.h * 0.86, 0]} material={isletGreenMat}>
            <dodecahedronGeometry args={[isl.r * 0.62, 1]} />
          </mesh>
        </group>
      ))}

      {/* 3. Walkable Coastal Timber Jetty (x in [36.0, 38.6], z in [45.2, 53.6], deck y = 0.46) */}
      <group position={[37.3, 0.4, 49.4]}>
        {Array.from({ length: 16 }).map((_, idx) => (
          <mesh
            key={`jet_p_${idx}`}
            position={[0, 0.02, -3.9 + idx * 0.52]}
            material={woodMat}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[2.55, 0.08, 0.44]} />
          </mesh>
        ))}
        {[
          [-1.15, -3.7],
          [1.15, -3.7],
          [-1.15, 0],
          [1.15, 0],
          [-1.15, 3.8],
          [1.15, 3.8],
        ].map(([px, pz], idx) => (
          <group key={`jet_post_${idx}`} position={[px, -0.1, pz]}>
            <mesh material={darkWoodMat} castShadow>
              <cylinderGeometry args={[0.08, 0.09, 1.35, 8]} />
            </mesh>
            {idx >= 4 && (
              <mesh position={[0, 0.72, 0]} material={lanternWarmMat}>
                <sphereGeometry args={[0.13, 10, 8]} />
              </mesh>
            )}
          </group>
        ))}
      </group>

      {/* 4. Vietnamese Wooden Fishing Sampan (Thuyền Nan) & Basket Boat (Thuyền Thúng) */}
      <group ref={sampanRef} position={[42.5, 0.08, 54.5]} rotation-y={-0.65}>
        <mesh scale={[0.92, 0.4, 2.25]} material={woodMat} castShadow>
          <sphereGeometry args={[0.8, 14, 10, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58]} />
        </mesh>
        {/* Bamboo arched sun-awning (Mui thuyền) */}
        <mesh position={[0, 0.35, 0.1]} rotation-x={Math.PI / 2} material={wovenBambooMat} castShadow>
          <cylinderGeometry args={[0.56, 0.56, 1.45, 12, 1, true, 0, Math.PI]} />
        </mesh>
        <mesh position={[0, 0.24, -1.35]} material={lanternWarmMat}>
          <sphereGeometry args={[0.1, 8, 8]} />
        </mesh>
      </group>

      <group ref={thungRef} position={[46.2, 0.08, 53.2]} rotation-y={0.3}>
        <mesh scale={[1.05, 0.55, 1.05]} material={wovenBambooMat} castShadow>
          <sphereGeometry args={[0.85, 16, 10, 0, Math.PI * 2, Math.PI * 0.46, Math.PI * 0.54]} />
        </mesh>
        <mesh position={[0, 0.14, 0]} rotation-x={Math.PI / 2} material={darkWoodMat}>
          <torusGeometry args={[0.84, 0.045, 8, 20]} />
        </mesh>
      </group>

      {/* 5. Curved Coastal Coconut Palms (Dừa Nghiêng Ven Biển) */}
      <group ref={palmCrownGroupRef}>
        {palmTrees.map((p, idx) => (
          <group key={`palm_${idx}`} position={[p.x, p.yBase - 0.15, p.z]}>
            <mesh geometry={p.trunkGeo} material={palmTrunkMat} castShadow />
            <group position={p.top} rotation-y={p.rot}>
              {[0, 1, 2, 3, 4].map((fr) => (
                <mesh
                  key={`fr_${fr}`}
                  rotation-y={(fr * Math.PI * 2) / 5}
                  rotation-x={0.55}
                  position={[0, 0.35, 0]}
                  material={palmFrondMat}
                  castShadow
                >
                  <planeGeometry args={[2.5, 2.5]} />
                </mesh>
              ))}
            </group>
          </group>
        ))}
      </group>

      {/* 6. Coastal Golden Sand Sunset Lounge Chairs */}
      <group position={[34.5, chairGroundY, 46.5]} rotation-y={0.28}>
        {[-0.95, 0.95].map((cx, idx) => (
          <group key={`beach_chair_${idx}`} position={[cx, 0, 0]}>
            <mesh position={[0, 0.24, 0]} rotation-x={-0.12} material={woodMat} castShadow>
              <boxGeometry args={[0.72, 0.06, 1.5]} />
            </mesh>
            <mesh position={[0, 0.55, -0.62]} rotation-x={0.62} material={woodMat} castShadow>
              <boxGeometry args={[0.72, 0.06, 0.72]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 7. Coastal Wooden Fishing Net Drying Rack & Mooring Post */}
      <group position={[44.2, groundHeightAt(44.2, 46.8), 46.8]} rotation-y={-0.38}>
        {[-1.1, 1.1].map((px, i) => (
          <mesh key={`nr_${i}`} position={[px, 0.85, 0]} material={darkWoodMat} castShadow>
            <cylinderGeometry args={[0.055, 0.07, 1.7, 7]} />
          </mesh>
        ))}
        <mesh position={[0, 1.62, 0]} rotation-z={Math.PI / 2} material={woodMat} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 2.5, 7]} />
        </mesh>
        <mesh position={[0, 1.02, 0]} material={wovenBambooMat}>
          <planeGeometry args={[2.05, 1.1]} />
        </mesh>
      </group>
    </group>
  );
};

/**
 * 4. NƠI YÊN BÌNH VIỆT NAM (Hội An Silk Lantern Garlands & Golden Valley Sunbeams)
 */
export const VietnamesePeacefulEffects: React.FC = () => {
  const lanternsGroupRef = useRef<THREE.Group>(null);
  const woodTex = getWoodPlankTexture();

  const {
    woodMat,
    vermilionMat,
    terracottaMat,
    stonePlinthMat,
    brassMat,
    sunbeamMat,
    redLanternMat,
    amberLanternMat,
    jadeLanternMat,
  } = useMemo(() => {
    const wood = new THREE.MeshStandardMaterial({ map: woodTex, color: 0x7b5236, roughness: 0.72 });
    const vermilion = new THREE.MeshPhysicalMaterial({
      color: 0x992320,
      roughness: 0.34,
      clearcoat: 0.55,
    });
    const terracotta = new THREE.MeshStandardMaterial({
      color: 0xb65438,
      roughness: 0.74,
    });
    const plinth = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.88 });
    const brass = new THREE.MeshStandardMaterial({
      color: 0xe2af4e,
      metalness: 0.88,
      roughness: 0.22,
    });
    const sunbeam = new THREE.MeshBasicMaterial({
      color: 0xfef3c7,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const redL = new THREE.MeshStandardMaterial({
      color: 0xfff1f2,
      emissive: 0xe11d48,
      emissiveIntensity: 1.4,
      roughness: 0.3,
      toneMapped: false,
    });
    const amberL = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.45,
      roughness: 0.3,
      toneMapped: false,
    });
    const jadeL = new THREE.MeshStandardMaterial({
      color: 0xecfdf5,
      emissive: 0x10b981,
      emissiveIntensity: 1.32,
      roughness: 0.3,
      toneMapped: false,
    });
    return {
      woodMat: wood,
      vermilionMat: vermilion,
      terracottaMat: terracotta,
      stonePlinthMat: plinth,
      brassMat: brass,
      sunbeamMat: sunbeam,
      redLanternMat: redL,
      amberLanternMat: amberL,
      jadeLanternMat: jadeL,
    };
  }, [woodTex]);

  useEffect(() => {
    return () => {
      woodMat.dispose();
      vermilionMat.dispose();
      terracottaMat.dispose();
      stonePlinthMat.dispose();
      brassMat.dispose();
      sunbeamMat.dispose();
      redLanternMat.dispose();
      amberLanternMat.dispose();
      jadeLanternMat.dispose();
    };
  }, [
    woodMat,
    vermilionMat,
    terracottaMat,
    stonePlinthMat,
    brassMat,
    sunbeamMat,
    redLanternMat,
    amberLanternMat,
    jadeLanternMat,
  ]);

  const silkLanternArc = useMemo(
    () => [
      { x: -3.0, z: 18.8, color: 'red' as const },
      { x: -1.5, z: 19.0, color: 'amber' as const },
      { x: 0.0, z: 19.1, color: 'jade' as const },
      { x: 1.5, z: 19.0, color: 'amber' as const },
      { x: 3.0, z: 18.8, color: 'red' as const },
    ],
    []
  );

  const sunbeams = useMemo(
    () => [
      { pos: [-16, 12, 6] as [number, number, number], r: 3.2, h: 24 },
      { pos: [4, 13.5, -18] as [number, number, number], r: 3.8, h: 26 },
      { pos: [30, 12, 34] as [number, number, number], r: 3.4, h: 24 },
    ],
    []
  );

  useFrame((state) => {
    if (!liveSceneActivity.isOutdoor || !lanternsGroupRef.current) return;
    const t = state.clock.getElapsedTime();
    lanternsGroupRef.current.children.forEach((child, idx) => {
      child.rotation.z = Math.sin(t * 1.4 + idx * 0.7) * 0.06;
    });
  });

  const leftPoleY = groundHeightAt(-3.6, 18.6);
  const rightPoleY = groundHeightAt(3.6, 18.6);
  const gateBaseY = Math.max(leftPoleY, rightPoleY);

  return (
    <group>
      {/* 1. Ornate Donghua-Vietnamese Sơn Môn Timber Archway Overlooking Hồ Hoa Đăng */}
      <group position={[-3.6, leftPoleY, 18.6]}>
        <mesh position={[0, 0.2, 0]} material={stonePlinthMat} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.32, 0.4, 10]} />
        </mesh>
        <mesh position={[0, 2.05, 0]} material={vermilionMat} castShadow>
          <cylinderGeometry args={[0.13, 0.16, 3.8, 12]} />
        </mesh>
        <mesh position={[0, 3.35, 0]} material={brassMat}>
          <cylinderGeometry args={[0.16, 0.16, 0.14, 10]} />
        </mesh>
      </group>
      <group position={[3.6, rightPoleY, 18.6]}>
        <mesh position={[0, 0.2, 0]} material={stonePlinthMat} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.32, 0.4, 10]} />
        </mesh>
        <mesh position={[0, 2.05, 0]} material={vermilionMat} castShadow>
          <cylinderGeometry args={[0.13, 0.16, 3.8, 12]} />
        </mesh>
        <mesh position={[0, 3.35, 0]} material={brassMat}>
          <cylinderGeometry args={[0.16, 0.16, 0.14, 10]} />
        </mesh>
      </group>

      {/* Main Carved Crossbeam, Plaque & Sweeping Upturned Tile Roof Eaves */}
      <group position={[0, gateBaseY + 3.45, 18.6]}>
        <mesh material={vermilionMat} castShadow>
          <boxGeometry args={[8.1, 0.26, 0.26]} />
        </mesh>
        <mesh position={[0, 0.42, 0]} material={woodMat} castShadow>
          <boxGeometry args={[7.4, 0.18, 0.22]} />
        </mesh>
        {/* Central Gilded Sanctuary Plaque */}
        <mesh position={[0, 0.24, 0.14]} material={brassMat} castShadow>
          <boxGeometry args={[1.65, 0.48, 0.08]} />
        </mesh>
        {/* Two-Slope Ceremonial Tile Roof with Curved Upturned Corner Eaves */}
        <mesh position={[0, 0.92, 0.34]} rotation-x={0.42} material={terracottaMat} castShadow>
          <boxGeometry args={[8.6, 0.14, 1.35]} />
        </mesh>
        <mesh position={[0, 0.92, -0.34]} rotation-x={-0.42} material={terracottaMat} castShadow>
          <boxGeometry args={[8.6, 0.14, 1.35]} />
        </mesh>
        <mesh position={[0, 1.24, 0]} material={brassMat} castShadow>
          <boxGeometry args={[8.8, 0.18, 0.22]} />
        </mesh>
        {/* Upturned Sweeping Đầu Đao Corner Finials */}
        {[-4.35, 4.35].map((ex, i) => (
          <group key={`eave_tip_${i}`} position={[ex, 1.28, 0]}>
            <mesh rotation-z={i === 0 ? 0.58 : -0.58} material={brassMat} castShadow>
              <coneGeometry args={[0.14, 0.56, 6]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Gently Swaying Hội An Silk Lanterns Suspended Along Archway */}
      <group ref={lanternsGroupRef}>
        {silkLanternArc.map((l, idx) => {
          const mat =
            l.color === 'red' ? redLanternMat : l.color === 'jade' ? jadeLanternMat : amberLanternMat;
          const baseH = gateBaseY + 2.95 - Math.abs(l.x) * 0.025;
          return (
            <Float key={`hoian_${idx}`} speed={1.1} floatIntensity={0.05} rotationIntensity={0}>
              <group position={[l.x, baseH, l.z]}>
                <mesh position={[0, 0.32, 0]} material={brassMat}>
                  <cylinderGeometry args={[0.014, 0.014, 0.32, 6]} />
                </mesh>
                <mesh position={[0, 0.16, 0]} material={brassMat}>
                  <cylinderGeometry args={[0.08, 0.08, 0.04, 10]} />
                </mesh>
                <mesh scale={[0.24, 0.31, 0.24]} material={mat}>
                  <sphereGeometry args={[1, 14, 10]} />
                </mesh>
                <mesh position={[0, -0.22, 0]} material={brassMat}>
                  <cylinderGeometry args={[0.065, 0.065, 0.04, 10]} />
                </mesh>
                <mesh position={[0, -0.34, 0]} material={redLanternMat}>
                  <cylinderGeometry args={[0.014, 0.028, 0.16, 6]} />
                </mesh>
              </group>
            </Float>
          );
        })}
      </group>

      {/* 2. Volumetric Translucent Golden Sunbeams */}
      {sunbeams.map((sb, idx) => (
        <mesh
          key={`sunbeam_${idx}`}
          position={sb.pos}
          rotation-z={-0.36}
          rotation-x={0.22}
          material={sunbeamMat}
        >
          <coneGeometry args={[sb.r, sb.h, 12, 1, true]} />
        </mesh>
      ))}
    </group>
  );
};
