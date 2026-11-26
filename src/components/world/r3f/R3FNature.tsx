import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import {
  getWoodPlankTexture,
  getStoneFoundationTexture,
  getBarkTexture,
  getBarkBumpTexture,
  getFoliageSprigTexture,
} from '../ProceduralTextures';
import { groundHeightAt, streamCenterX } from './worldLayout';
import { liveSceneActivity } from './roomTypes';

/**
 * Shared live avatar world position updated every frame in R3FAvatar.
 * Used by ProximityZoneSign to fade floating 3D nameplates smoothly with zero React re-renders.
 */
export const liveAvatarWorldPos = new THREE.Vector3(-3.5, 0.7, 5.5);

export const ProximityZoneSign: React.FC<{
  worldPosition: [number, number, number];
  localOffset?: [number, number, number];
  title: string;
  subtitle?: string;
  onClick?: () => void;
  showDistance?: number;
}> = ({
  worldPosition,
  localOffset = [0, 4.5, 0],
  title,
  subtitle,
  onClick,
  showDistance = 21,
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  useFrame(() => {
    if (!liveSceneActivity.isOutdoor) return;
    const el = btnRef.current;
    if (!el) return;
    const dx = liveAvatarWorldPos.x - worldPosition[0];
    const dz = liveAvatarWorldPos.z - worldPosition[2];
    const dist = Math.hypot(dx, dz);

    if (dist > showDistance) {
      if (el.style.opacity !== '0') {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      }
    } else {
      const fade = THREE.MathUtils.clamp((showDistance - dist) / 7, 0, 1);
      el.style.opacity = fade.toFixed(2);
      el.style.pointerEvents = fade > 0.2 ? 'auto' : 'none';
    }
  });

  return (
    <Html position={localOffset} center distanceFactor={15} zIndexRange={[10, 0]}>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        style={{ opacity: 0, pointerEvents: 'none', transition: 'opacity 180ms ease' }}
        className="px-3.5 py-2 rounded-xl bg-[#faf7ef]/92 hover:bg-[#faf7ef] backdrop-blur-md border border-[#cfd8c9] hover:border-[#46613e]/50 shadow-lg text-center cursor-pointer whitespace-nowrap"
      >
        <div className="text-xs font-serif-healing font-semibold text-[#273829] leading-tight">{title}</div>
        {subtitle && (
          <div className="text-[10px] text-[#5c6e5c] leading-tight mt-0.5">{subtitle}</div>
        )}
      </button>
    </Html>
  );
};

// Shared lush emerald botanical + sakura PBR materials hook
function useNatureMaterials() {
  return useMemo(() => {
    const barkDiff = getBarkTexture();
    const barkBump = getBarkBumpTexture();
    const oakLeafTex = getFoliageSprigTexture('oak');
    const sakuraTex = getFoliageSprigTexture('sakura');
    const crimsonPlumTex = getFoliageSprigTexture('crimson_plum');
    const palmTex = getFoliageSprigTexture('tropical_palm');
    const pineTex = getFoliageSprigTexture('pine');
    const willowTex = getFoliageSprigTexture('willow');

    return {
      barkMat: new THREE.MeshStandardMaterial({
        color: 0x6b4e38,
        map: barkDiff,
        bumpMap: barkBump,
        bumpScale: 0.04,
        roughness: 0.92,
        metalness: 0.02,
      }),
      sakuraBarkMat: new THREE.MeshStandardMaterial({
        color: 0x735248,
        map: barkDiff,
        bumpMap: barkBump,
        bumpScale: 0.03,
        roughness: 0.88,
        metalness: 0.02,
      }),
      oakLeafMat: new THREE.MeshStandardMaterial({
        map: oakLeafTex,
        color: 0x4f8b3f,
        alphaTest: 0.36,
        side: THREE.DoubleSide,
        roughness: 0.78,
        metalness: 0.02,
      }),
      oakLeafWarmMat: new THREE.MeshStandardMaterial({
        map: oakLeafTex,
        color: 0x74ac50,
        alphaTest: 0.36,
        side: THREE.DoubleSide,
        roughness: 0.74,
      }),
      sakuraLeafMat: new THREE.MeshStandardMaterial({
        map: sakuraTex,
        color: 0xffd6e6,
        alphaTest: 0.34,
        side: THREE.DoubleSide,
        roughness: 0.68,
      }),
      crimsonPlumMat: new THREE.MeshStandardMaterial({
        map: crimsonPlumTex,
        color: 0xf472b6,
        alphaTest: 0.34,
        side: THREE.DoubleSide,
        roughness: 0.68,
      }),
      palmFrondMat: new THREE.MeshStandardMaterial({
        map: palmTex,
        color: 0x5ca348,
        alphaTest: 0.34,
        side: THREE.DoubleSide,
        roughness: 0.74,
      }),
      pineLeafMat: new THREE.MeshStandardMaterial({
        map: pineTex,
        color: 0x3b6e44,
        alphaTest: 0.34,
        side: THREE.DoubleSide,
        roughness: 0.82,
      }),
      willowLeafMat: new THREE.MeshStandardMaterial({
        map: willowTex,
        color: 0x5d9652,
        alphaTest: 0.34,
        side: THREE.DoubleSide,
        roughness: 0.76,
      }),
      bambooMat: new THREE.MeshStandardMaterial({
        color: 0x5d8c49,
        roughness: 0.68,
        metalness: 0.04,
      }),
      bambooNodeMat: new THREE.MeshStandardMaterial({
        color: 0x466b36,
        roughness: 0.74,
      }),
    };
  }, []);
}

function bakeMergedGeometry(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const normalized = parts.map((g) => {
    const nonIdx = g.index ? g.toNonIndexed() : g.clone();
    if (!nonIdx.getAttribute('normal')) nonIdx.computeVertexNormals();
    if (!nonIdx.getAttribute('uv')) {
      const count = nonIdx.getAttribute('position').count;
      nonIdx.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    return nonIdx;
  });
  const merged = mergeGeometries(normalized, false);
  normalized.forEach((g) => g.dispose());
  parts.forEach((g) => g.dispose());
  merged.computeBoundingSphere();
  merged.computeBoundingBox();
  return merged;
}

function makeTransformedPlane(
  w: number,
  h: number,
  pos: [number, number, number],
  rot: [number, number, number]
): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(w, h);
  const euler = new THREE.Euler(rot[0], rot[1], rot[2], 'XYZ');
  const mat = new THREE.Matrix4().compose(
    new THREE.Vector3(pos[0], pos[1], pos[2]),
    new THREE.Quaternion().setFromEuler(euler),
    new THREE.Vector3(1, 1, 1)
  );
  g.applyMatrix4(mat);
  return g;
}

function buildClusterParts(
  pos: [number, number, number],
  size: number,
  rotY: number
): THREE.BufferGeometry[] {
  const baseDefs: Array<{ rx: number; ry: number; s: number }> = [
    { rx: 0, ry: 0, s: 1 },
    { rx: 0.18, ry: Math.PI / 3, s: 1 },
    { rx: -0.18, ry: -Math.PI / 3, s: 1 },
    { rx: Math.PI * 0.42, ry: 0, s: 0.92 },
  ];
  const parentQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0));
  const parentPos = new THREE.Vector3(pos[0], pos[1], pos[2]);
  const parentMat = new THREE.Matrix4().compose(parentPos, parentQuat, new THREE.Vector3(1, 1, 1));

  return baseDefs.map((d) => {
    const g = new THREE.PlaneGeometry(size * d.s, size * d.s);
    const localMat = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(d.rx, d.ry, 0, 'XYZ'));
    g.applyMatrix4(localMat);
    g.applyMatrix4(parentMat);
    return g;
  });
}

let cachedUnitClusterGeo: THREE.BufferGeometry | null = null;
function getUnitClusterGeo(): THREE.BufferGeometry {
  if (!cachedUnitClusterGeo) {
    cachedUnitClusterGeo = bakeMergedGeometry(buildClusterParts([0, 0, 0], 1, 0));
  }
  return cachedUnitClusterGeo;
}

// Reusable Helper: Crossed Multi-Plane Botanical Leaf Cluster baked into 1 draw call
const FoliageClusterCard: React.FC<{
  position: [number, number, number];
  size: number;
  material: THREE.Material;
  rotY?: number;
}> = ({ position, size, material, rotY = 0 }) => (
  <mesh
    position={position}
    rotation-y={rotY}
    scale={size}
    geometry={getUnitClusterGeo()}
    material={material}
    castShadow
    receiveShadow
  />
);

let cachedOakWoodGeo: THREE.BufferGeometry | null = null;
let cachedOakPrimaryLeavesGeo: THREE.BufferGeometry | null = null;
let cachedOakSunlitLeavesGeo: THREE.BufferGeometry | null = null;

function getOakMergedGeometries() {
  if (!cachedOakWoodGeo || !cachedOakPrimaryLeavesGeo || !cachedOakSunlitLeavesGeo) {
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.12, 0),
      new THREE.Vector3(0.08, 0.95, 0.04),
      new THREE.Vector3(-0.06, 2.05, -0.05),
      new THREE.Vector3(0.02, 2.9, 0.02),
    ]);
    const trunk = new THREE.TubeGeometry(trunkCurve, 10, 0.24, 8, false);

    const bSpecs = [
      [new THREE.Vector3(0, 1.9, 0), new THREE.Vector3(0.75, 2.65, 0.35), new THREE.Vector3(1.35, 3.2, 0.68), 0.11],
      [new THREE.Vector3(0, 2.05, 0), new THREE.Vector3(-0.72, 2.75, -0.25), new THREE.Vector3(-1.35, 3.3, -0.58), 0.1],
      [new THREE.Vector3(0, 2.18, 0), new THREE.Vector3(0.18, 2.85, -0.68), new THREE.Vector3(0.32, 3.45, -1.28), 0.1],
      [new THREE.Vector3(0, 2.1, 0), new THREE.Vector3(-0.35, 2.8, 0.62), new THREE.Vector3(-0.75, 3.35, 1.22), 0.095],
      [new THREE.Vector3(0, 2.5, 0), new THREE.Vector3(0.05, 3.25, 0.08), new THREE.Vector3(0.12, 3.95, 0.12), 0.09],
    ] as const;

    const branches = bSpecs.map(([s, m, e, r]) =>
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([s, m, e]), 7, r, 7, false)
    );

    const roots = [0, 1.55, 3.1, 4.7].map((a) =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(Math.cos(a) * 0.62, -0.12, Math.sin(a) * 0.62),
          new THREE.Vector3(Math.cos(a) * 0.32, 0.18, Math.sin(a) * 0.32),
          new THREE.Vector3(0, 0.55, 0),
        ]),
        6,
        0.13,
        6,
        false
      )
    );

    cachedOakWoodGeo = bakeMergedGeometry([trunk, ...branches, ...roots]);

    const sprigSpecs = [
      { pos: [1.32, 3.3, 0.65] as [number, number, number], size: 2.35, rot: 0.4, sun: true },
      { pos: [-1.32, 3.38, -0.55] as [number, number, number], size: 2.45, rot: 1.2, sun: false },
      { pos: [0.32, 3.55, -1.25] as [number, number, number], size: 2.25, rot: 2.1, sun: true },
      { pos: [-0.75, 3.45, 1.18] as [number, number, number], size: 2.3, rot: 0.8, sun: false },
      { pos: [0.1, 4.15, 0.1] as [number, number, number], size: 2.55, rot: 1.7, sun: true },
      { pos: [0.75, 3.85, -0.55] as [number, number, number], size: 2.05, rot: 2.6, sun: true },
      { pos: [-0.65, 3.9, 0.45] as [number, number, number], size: 2.1, rot: 0.2, sun: false },
      { pos: [0.05, 3.2, 0.05] as [number, number, number], size: 2.2, rot: 1.4, sun: false },
    ];

    const primaryParts: THREE.BufferGeometry[] = [];
    const sunlitParts: THREE.BufferGeometry[] = [];
    for (const s of sprigSpecs) {
      const target = s.sun ? sunlitParts : primaryParts;
      target.push(...buildClusterParts(s.pos, s.size, s.rot));
    }
    cachedOakPrimaryLeavesGeo = bakeMergedGeometry(primaryParts);
    cachedOakSunlitLeavesGeo = bakeMergedGeometry(sunlitParts);
  }
  return {
    woodGeo: cachedOakWoodGeo,
    primaryLeavesGeo: cachedOakPrimaryLeavesGeo,
    sunlitLeavesGeo: cachedOakSunlitLeavesGeo,
  };
}

// 1. Realistic Broadleaf Oak / Sakura / Crimson Plum Tree (3 Merged Draw Calls per Tree)
export const RealisticOakTree: React.FC<{
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
  variant?: 'oak' | 'sakura' | 'crimson_plum';
}> = ({ position, scale = 1.0, rotationY = 0, variant = 'oak' }) => {
  const mats = useNatureMaterials();
  const trunkMat = variant === 'oak' ? mats.barkMat : mats.sakuraBarkMat;
  const leafPrimary =
    variant === 'crimson_plum'
      ? mats.crimsonPlumMat
      : variant === 'sakura'
        ? mats.sakuraLeafMat
        : mats.oakLeafMat;
  const leafSunlit =
    variant === 'crimson_plum'
      ? mats.crimsonPlumMat
      : variant === 'sakura'
        ? mats.sakuraLeafMat
        : mats.oakLeafWarmMat;

  const { woodGeo, primaryLeavesGeo, sunlitLeavesGeo } = useMemo(() => getOakMergedGeometries(), []);

  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <mesh geometry={woodGeo} material={trunkMat} castShadow receiveShadow />
      <mesh geometry={primaryLeavesGeo} material={leafPrimary} castShadow receiveShadow />
      <mesh geometry={sunlitLeavesGeo} material={leafSunlit} castShadow receiveShadow />
    </group>
  );
};

let cachedPineTrunkGeo: THREE.BufferGeometry | null = null;
let cachedPineFoliageGeo: THREE.BufferGeometry | null = null;

function getPineMergedGeometries() {
  if (!cachedPineTrunkGeo || !cachedPineFoliageGeo) {
    const trunk = new THREE.CylinderGeometry(0.07, 0.24, 5.7, 9);
    trunk.translate(0, 2.75, 0);
    trunk.computeBoundingSphere();
    cachedPineTrunkGeo = trunk;

    const tiers = [
      { y: 1.85, r: 1.65, blades: 6 },
      { y: 2.85, r: 1.4, blades: 6 },
      { y: 3.8, r: 1.15, blades: 5 },
      { y: 4.65, r: 0.85, blades: 5 },
      { y: 5.4, r: 0.58, blades: 4 },
    ];
    const parts: THREE.BufferGeometry[] = [];
    tiers.forEach((tier, tIdx) => {
      const tierRot = tIdx * 0.55;
      for (let bIdx = 0; bIdx < tier.blades; bIdx++) {
        const angle = tierRot + (bIdx / tier.blades) * Math.PI * 2;
        const g = new THREE.PlaneGeometry(tier.r * 1.15, tier.r * 1.25);
        g.rotateX(0.92);
        g.translate(0, 0, tier.r * 0.52);
        g.rotateY(angle);
        g.translate(0, tier.y, 0);
        parts.push(g);
      }
    });
    parts.push(...buildClusterParts([0, 5.75, 0], 1.15, 0));
    cachedPineFoliageGeo = bakeMergedGeometry(parts);
  }
  return { trunkGeo: cachedPineTrunkGeo, foliageGeo: cachedPineFoliageGeo };
}

// 2. Tall Mountain Pine Conifer (2 Merged Draw Calls per Tree)
export const RealisticPineTree: React.FC<{
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
}> = ({ position, scale = 1.0, rotationY = 0 }) => {
  const { barkMat, pineLeafMat } = useNatureMaterials();
  const { trunkGeo, foliageGeo } = useMemo(() => getPineMergedGeometries(), []);

  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <mesh geometry={trunkGeo} material={barkMat} castShadow receiveShadow />
      <mesh geometry={foliageGeo} material={pineLeafMat} castShadow receiveShadow />
    </group>
  );
};

let cachedWillowTrunkGeo: THREE.BufferGeometry | null = null;
let cachedWillowVeilGeo: THREE.BufferGeometry | null = null;

function getWillowMergedGeometries() {
  if (!cachedWillowTrunkGeo || !cachedWillowVeilGeo) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.1, 0),
      new THREE.Vector3(0.28, 1.15, 0.12),
      new THREE.Vector3(0.55, 2.3, 0.25),
    ]);
    cachedWillowTrunkGeo = new THREE.TubeGeometry(curve, 10, 0.24, 8, false);

    const curtains = [
      { pos: [1.35, 2.0, 0.4] as [number, number, number], w: 1.6, h: 2.8, rot: 0.2 },
      { pos: [0.3, 2.15, 1.25] as [number, number, number], w: 1.7, h: 2.9, rot: 1.3 },
      { pos: [-0.55, 2.1, -0.75] as [number, number, number], w: 1.65, h: 2.75, rot: 2.4 },
      { pos: [0.95, 2.15, -0.85] as [number, number, number], w: 1.6, h: 2.7, rot: 0.9 },
      { pos: [-0.2, 2.35, 0.2] as [number, number, number], w: 2.1, h: 2.6, rot: 1.8 },
    ];
    const parts: THREE.BufferGeometry[] = [];
    for (const c of curtains) {
      parts.push(makeTransformedPlane(c.w, c.h, c.pos, [0, c.rot, 0]));
      parts.push(makeTransformedPlane(c.w, c.h, c.pos, [0, c.rot + Math.PI / 2, 0]));
    }
    cachedWillowVeilGeo = bakeMergedGeometry(parts);
  }
  return { trunkGeo: cachedWillowTrunkGeo, veilGeo: cachedWillowVeilGeo };
}

// 3. Lakeside Weeping Willow (2 Merged Draw Calls per Tree)
export const RealisticWillowTree: React.FC<{
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
}> = ({ position, scale = 1.0, rotationY = 0 }) => {
  const { barkMat, willowLeafMat } = useNatureMaterials();
  const { trunkGeo, veilGeo } = useMemo(() => getWillowMergedGeometries(), []);

  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <mesh geometry={trunkGeo} material={barkMat} castShadow receiveShadow />
      <mesh geometry={veilGeo} material={willowLeafMat} castShadow receiveShadow />
    </group>
  );
};

let cachedBambooStalksGeo: THREE.BufferGeometry | null = null;
let cachedBambooNodesGeo: THREE.BufferGeometry | null = null;
let cachedBambooLeavesGeo: THREE.BufferGeometry | null = null;

function getBambooMergedGeometries() {
  if (!cachedBambooStalksGeo || !cachedBambooNodesGeo || !cachedBambooLeavesGeo) {
    const stalks = [
      { x: -0.22, z: -0.18, h: 4.8, leanX: -0.05, leanZ: 0.04 },
      { x: 0.24, z: -0.1, h: 5.4, leanX: 0.06, leanZ: -0.04 },
      { x: -0.05, z: 0.24, h: 4.3, leanX: 0.03, leanZ: 0.07 },
      { x: 0.32, z: 0.28, h: 5.0, leanX: 0.07, leanZ: 0.05 },
      { x: -0.34, z: 0.16, h: 3.9, leanX: -0.08, leanZ: 0.02 },
    ];
    const stalkParts: THREE.BufferGeometry[] = [];
    const nodeParts: THREE.BufferGeometry[] = [];
    const leafParts: THREE.BufferGeometry[] = [];

    stalks.forEach((s, idx) => {
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(s.x, 0, s.z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(s.leanX, idx * 0.7, s.leanZ, 'XYZ')),
        new THREE.Vector3(1, 1, 1)
      );

      const culm = new THREE.CylinderGeometry(0.048, 0.068, s.h, 7);
      culm.translate(0, s.h / 2, 0);
      culm.applyMatrix4(m);
      stalkParts.push(culm);

      for (const ny of [0.9, 1.8, 2.7, 3.6]) {
        if (ny < s.h) {
          const node = new THREE.CylinderGeometry(0.065, 0.065, 0.04, 7);
          node.translate(0, ny, 0);
          node.applyMatrix4(m);
          nodeParts.push(node);
        }
      }

      const leaves = buildClusterParts([0, s.h - 0.35, 0], 1.65, 0);
      leaves.forEach((g) => {
        g.applyMatrix4(m);
        leafParts.push(g);
      });
    });

    cachedBambooStalksGeo = bakeMergedGeometry(stalkParts);
    cachedBambooNodesGeo = bakeMergedGeometry(nodeParts);
    cachedBambooLeavesGeo = bakeMergedGeometry(leafParts);
  }
  return {
    stalksGeo: cachedBambooStalksGeo,
    nodesGeo: cachedBambooNodesGeo,
    leavesGeo: cachedBambooLeavesGeo,
  };
}

// 4. Bamboo Clump Beside Upper Brook & Tea Pavilion (3 Merged Draw Calls per Clump)
export const BambooClump: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
}> = ({ position, rotationY = 0, scale = 1.0 }) => {
  const { bambooMat, bambooNodeMat, willowLeafMat } = useNatureMaterials();
  const { stalksGeo, nodesGeo, leavesGeo } = useMemo(() => getBambooMergedGeometries(), []);

  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <mesh geometry={stalksGeo} material={bambooMat} castShadow />
      <mesh geometry={nodesGeo} material={bambooNodeMat} />
      <mesh geometry={leavesGeo} material={willowLeafMat} castShadow receiveShadow />
    </group>
  );
};

// 4B. Lush Tropical Banana / Fan Palm Cluster (Inspiring Countryside Stream Cottage Greenery)
export const TropicalPalmClump: React.FC<{
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
}> = ({ position, scale = 1.0, rotationY = 0 }) => {
  const { palmFrondMat, barkMat } = useNatureMaterials();
  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <mesh position={[0, 1.05, 0]} material={barkMat} castShadow>
        <cylinderGeometry args={[0.1, 0.16, 2.2, 8]} />
      </mesh>
      <FoliageClusterCard position={[0, 2.55, 0]} size={2.9} material={palmFrondMat} rotY={0.2} />
      <FoliageClusterCard position={[0.45, 2.05, 0.3]} size={2.2} material={palmFrondMat} rotY={1.3} />
    </group>
  );
};

// 5. Valley Forest Distribution (Biomes Tailored Around Each House, River, Meadow & Foothills)
export const BotanicalTreesRing: React.FC = () => {
  const woods = useMemo(() => {
    const oaks: Array<{ pos: [number, number, number]; scale: number; rot: number }> = [
      { pos: [-8.5, groundHeightAt(-8.5, -6.5), -6.5], scale: 1.05, rot: 0.5 },
      { pos: [9.5, groundHeightAt(9.5, -7.5), -7.5], scale: 1.15, rot: 1.8 },
      { pos: [11.5, groundHeightAt(11.5, 2.2), 2.2], scale: 0.95, rot: 2.9 },
      { pos: [-14.0, groundHeightAt(-14.0, 9.5), 9.5], scale: 1.12, rot: 0.9 },
      { pos: [-22.0, groundHeightAt(-22.0, -11.5), -11.5], scale: 1.2, rot: 3.4 },
      { pos: [-40.0, groundHeightAt(-40.0, 8.5), 8.5], scale: 1.25, rot: 2.2 },
      { pos: [-38.0, groundHeightAt(-38.0, -14.0), -14.0], scale: 1.15, rot: 4.1 },
      { pos: [-19.5, groundHeightAt(-19.5, 16.5), 16.5], scale: 1.0, rot: 1.1 },
      { pos: [15.5, groundHeightAt(15.5, 16.5), 16.5], scale: 1.08, rot: 2.5 },
      { pos: [48.0, groundHeightAt(48.0, 22.0), 22.0], scale: 1.2, rot: 0.4 },
      { pos: [52.0, groundHeightAt(52.0, 4.0), 4.0], scale: 1.18, rot: 1.7 },
      { pos: [-46.0, groundHeightAt(-46.0, 28.0), 28.0], scale: 1.25, rot: 3.8 },
      { pos: [-16.0, groundHeightAt(-16.0, 46.0), 46.0], scale: 1.15, rot: 2.1 },
      { pos: [16.0, groundHeightAt(16.0, 48.0), 48.0], scale: 1.22, rot: 0.9 },
    ];

    const sakuras: Array<{ pos: [number, number, number]; scale: number; rot: number }> = [
      { pos: [33.0, groundHeightAt(33.0, 16.0), 16.0], scale: 1.05, rot: 0.7 },
      { pos: [46.5, groundHeightAt(46.5, 8.5), 8.5], scale: 1.18, rot: 2.3 },
      { pos: [28.5, groundHeightAt(28.5, 12.5), 12.5], scale: 0.92, rot: 0.2 },
      { pos: [-23.0, groundHeightAt(-23.0, 29.0), 29.0], scale: 1.0, rot: 1.9 },
    ];

    // Vivid Crimson Plum Blossoms framing Memory Post Office, Spiritual Peak & Eastern Cascade (Panels 3 & 4!)
    const crimsonPlums: Array<{ pos: [number, number, number]; scale: number; rot: number }> = [
      { pos: [36.5, groundHeightAt(36.5, 4.0), 4.0], scale: 1.08, rot: 1.4 },
      { pos: [45.0, groundHeightAt(45.0, 18.5), 18.5], scale: 1.12, rot: 3.6 },
      { pos: [-10.5, groundHeightAt(-10.5, -35.5), -35.5], scale: 1.06, rot: 0.8 },
      { pos: [-22.5, groundHeightAt(-22.5, -32.5), -32.5], scale: 1.1, rot: 2.4 },
      { pos: [streamCenterX(-42) + 5.2, groundHeightAt(streamCenterX(-42) + 5.2, -42), -42], scale: 1.14, rot: 0.5 },
      { pos: [-35.0, groundHeightAt(-35.0, 22.0), 22.0], scale: 1.05, rot: 4.0 },
    ];

    const palms: Array<{ pos: [number, number, number]; scale: number; rot: number }> = [
      // Countryside Lush Banana/Palm Greens beside Journal Cottage & Brook Bend (Panel 1!)
      { pos: [4.6, groundHeightAt(4.6, -5.8), -5.8], scale: 1.05, rot: 0.4 },
      { pos: [-5.8, groundHeightAt(-5.8, -4.6), -4.6], scale: 0.95, rot: 1.7 },
      { pos: [streamCenterX(14) + 4.4, groundHeightAt(streamCenterX(14) + 4.4, 14), 14], scale: 1.02, rot: 2.8 },
    ];

    const pines: Array<{ pos: [number, number, number]; scale: number; rot: number }> = [
      { pos: [-24.0, groundHeightAt(-24.0, -37.0), -37.0], scale: 1.25, rot: 0.3 },
      { pos: [-9.0, groundHeightAt(-9.0, -39.0), -39.0], scale: 1.32, rot: 1.7 },
      { pos: [-18.5, groundHeightAt(-18.5, -44.0), -44.0], scale: 1.4, rot: 2.5 },
      { pos: [-31.0, groundHeightAt(-31.0, -31.0), -31.0], scale: 1.28, rot: 0.9 },
      { pos: [-5.0, groundHeightAt(-5.0, -30.0), -30.0], scale: 1.12, rot: 3.1 },
      { pos: [4.5, groundHeightAt(4.5, -24.0), -24.0], scale: 1.18, rot: 2.0 },
      { pos: [12.0, groundHeightAt(12.0, -34.0), -34.0], scale: 1.35, rot: 0.6 },
      { pos: [24.0, groundHeightAt(24.0, -38.0), -38.0], scale: 1.3, rot: 1.2 },
      { pos: [-45.0, groundHeightAt(-45.0, -24.0), -24.0], scale: 1.35, rot: 2.9 },
      { pos: [35.0, groundHeightAt(35.0, 38.0), 38.0], scale: 1.25, rot: 0.8 },
      { pos: [20.0, groundHeightAt(20.0, 39.0), 39.0], scale: 1.12, rot: 1.9 },
      { pos: [58.0, groundHeightAt(58.0, -34.0), -34.0], scale: 1.38, rot: 3.4 },
    ];

    const willows: Array<{ pos: [number, number, number]; scale: number; rot: number }> = [
      { pos: [-16.8, groundHeightAt(-16.8, 25.0), 25.0], scale: 1.18, rot: 0.4 },
      { pos: [16.5, groundHeightAt(16.5, 25.5), 25.5], scale: 1.15, rot: 2.1 },
      { pos: [20.5, groundHeightAt(20.5, 34.5), 34.5], scale: 1.22, rot: 3.0 },
      { pos: [-14.5, groundHeightAt(-14.5, 39.5), 39.5], scale: 1.12, rot: 1.2 },
      { pos: [streamCenterX(-4) - 4.2, groundHeightAt(streamCenterX(-4) - 4.2, -4), -4], scale: 1.08, rot: 0.7 },
    ];

    const bamboos: Array<{ pos: [number, number, number]; scale: number; rot: number }> = [
      { pos: [38.5, groundHeightAt(38.5, -27.5), -27.5], scale: 1.05, rot: 0.3 },
      { pos: [49.0, groundHeightAt(49.0, -26.0), -26.0], scale: 1.12, rot: 1.6 },
      { pos: [50.5, groundHeightAt(50.5, -18.0), -18.0], scale: 1.08, rot: 2.4 },
      { pos: [37.0, groundHeightAt(37.0, -16.0), -16.0], scale: 1.0, rot: 0.9 },
      { pos: [43.5, groundHeightAt(43.5, -30.5), -30.5], scale: 1.15, rot: 3.1 },
      { pos: [34.5, groundHeightAt(34.5, -24.5), -24.5], scale: 0.95, rot: 1.2 },
    ];

    return { oaks, sakuras, crimsonPlums, palms, pines, willows, bamboos };
  }, []);

  return (
    <group>
      {woods.oaks.map((t, i) => (
        <RealisticOakTree key={`oak_${i}`} position={t.pos} scale={t.scale} rotationY={t.rot} variant="oak" />
      ))}
      {woods.sakuras.map((t, i) => (
        <RealisticOakTree key={`sak_${i}`} position={t.pos} scale={t.scale} rotationY={t.rot} variant="sakura" />
      ))}
      {woods.crimsonPlums.map((t, i) => (
        <RealisticOakTree key={`cpl_${i}`} position={t.pos} scale={t.scale} rotationY={t.rot} variant="crimson_plum" />
      ))}
      {woods.palms.map((t, i) => (
        <TropicalPalmClump key={`plm_${i}`} position={t.pos} scale={t.scale} rotationY={t.rot} />
      ))}
      {woods.pines.map((t, i) => (
        <RealisticPineTree key={`pin_${i}`} position={t.pos} scale={t.scale} rotationY={t.rot} />
      ))}
      {woods.willows.map((t, i) => (
        <RealisticWillowTree key={`wil_${i}`} position={t.pos} scale={t.scale} rotationY={t.rot} />
      ))}
      {woods.bamboos.map((t, i) => (
        <BambooClump key={`bam_${i}`} position={t.pos} scale={t.scale} rotationY={t.rot} />
      ))}
    </group>
  );
};

// 5B. Soaring White Cranes Circling Over Mountain Lake & Waterfalls (Panels 2, 3, 4!)
export const SoaringWhiteCranes: React.FC = () => {
  const craneRefs = useRef<Array<THREE.Group | null>>([]);
  const cranePaths = useMemo(
    () => [
      { cx: -4, cz: 26, y: 11.5, rx: 16, rz: 12, speed: 0.22, phase: 0.2 },
      { cx: -6, cz: 24, y: 12.2, rx: 14, rz: 10, speed: 0.22, phase: 0.58 },
      { cx: -16, cz: -32, y: 14.5, rx: 12, rz: 9, speed: 0.26, phase: 2.1 },
      { cx: 18, cz: -28, y: 13.8, rx: 15, rz: 11, speed: 0.2, phase: 4.0 },
      { cx: 4, cz: 32, y: 10.2, rx: 13, rz: 9, speed: 0.24, phase: 5.2 },
    ],
    []
  );

  const whiteFeatherMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 }),
    []
  );
  const wingTipMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 }),
    []
  );
  const crimsonCrownMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 }),
    []
  );

  useFrame((state) => {
    if (!liveSceneActivity.isOutdoor) return;
    const t = state.clock.getElapsedTime();
    craneRefs.current.forEach((crane, idx) => {
      if (!crane) return;
      const p = cranePaths[idx];
      const ang = t * p.speed + p.phase;
      const nx = p.cx + Math.cos(ang) * p.rx;
      const nz = p.cz + Math.sin(ang) * p.rz;
      const ny = p.y + Math.sin(t * 1.1 + idx) * 0.55;
      crane.position.set(nx, ny, nz);
      crane.rotation.y = -ang;
      const flap = Math.sin(t * 5.2 + idx * 1.4) * 0.42;
      const wingL = crane.getObjectByName('wingL');
      const wingR = crane.getObjectByName('wingR');
      if (wingL) wingL.rotation.z = flap;
      if (wingR) wingR.rotation.z = -flap;
    });
  });

  return (
    <group>
      {cranePaths.map((_, idx) => (
        <group
          key={`crane_${idx}`}
          ref={(el) => {
            craneRefs.current[idx] = el;
          }}
        >
          {/* Sleek Crane Body & Extended Neck */}
          <mesh scale={[0.14, 0.12, 0.44]} material={whiteFeatherMat}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
          <mesh position={[0, 0.08, 0.52]} rotation-x={Math.PI * 0.42} material={whiteFeatherMat}>
            <cylinderGeometry args={[0.032, 0.055, 0.52, 6]} />
          </mesh>
          <mesh position={[0, 0.14, 0.78]} material={crimsonCrownMat}>
            <sphereGeometry args={[0.045, 6, 6]} />
          </mesh>
          {/* Trailing Dark Legs */}
          <mesh position={[-0.04, -0.02, -0.52]} rotation-x={Math.PI * 0.48} material={wingTipMat}>
            <cylinderGeometry args={[0.012, 0.012, 0.48, 4]} />
          </mesh>
          <mesh position={[0.04, -0.02, -0.52]} rotation-x={Math.PI * 0.48} material={wingTipMat}>
            <cylinderGeometry args={[0.012, 0.012, 0.48, 4]} />
          </mesh>
          {/* Left & Right Articulated Wings */}
          <group name="wingL" position={[-0.1, 0.04, 0.05]}>
            <mesh position={[-0.55, 0, -0.04]} rotation-x={-0.08} material={whiteFeatherMat}>
              <boxGeometry args={[1.05, 0.025, 0.36]} />
            </mesh>
            <mesh position={[-1.12, 0, -0.1]} rotation-y={0.22} material={wingTipMat}>
              <boxGeometry args={[0.32, 0.022, 0.24]} />
            </mesh>
          </group>
          <group name="wingR" position={[0.1, 0.04, 0.05]}>
            <mesh position={[0.55, 0, -0.04]} rotation-x={-0.08} material={whiteFeatherMat}>
              <boxGeometry args={[1.05, 0.025, 0.36]} />
            </mesh>
            <mesh position={[1.12, 0, -0.1]} rotation-y={-0.22} material={wingTipMat}>
              <boxGeometry args={[0.32, 0.022, 0.24]} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
};

// 2. Swirling Sky-Island Sanctuary Butterflies (expanded vibrant flock around blossoms & cliff rims)
export const GardenButterflies: React.FC = () => {
  const groupRefs = useRef<Array<THREE.Group | null>>([]);

  const butterflies = useMemo(
    () => [
      { cx: -2.0, cz: 4.5, y: 1.8, radius: 2.6, speed: 0.85, scale: 1.35, color: '#fb923c' },
      { cx: -24.0, cz: 1.0, y: 2.2, radius: 3.2, speed: 0.95, scale: 1.4, color: '#38bdf8' },
      { cx: 36.0, cz: 10.5, y: 2.1, radius: 2.8, speed: 0.78, scale: 1.3, color: '#f9a8d4' },
      { cx: 24.5, cz: 5.5, y: 2.3, radius: 2.4, speed: 0.92, scale: 1.25, color: '#fde047' },
      { cx: 1.5, cz: 17.5, y: 1.8, radius: 2.9, speed: 0.82, scale: 1.4, color: '#60a5fa' },
      { cx: -12.0, cz: 12.0, y: 2.5, radius: 3.6, speed: 0.74, scale: 1.3, color: '#fb923c' },
      { cx: -28.0, cz: 24.0, y: 4.2, radius: 4.1, speed: 0.88, scale: 1.5, color: '#f472b6' },
      { cx: 8.5, cz: 26.0, y: 2.4, radius: 3.4, speed: 0.76, scale: 1.35, color: '#38bdf8' },
      { cx: -16.0, cz: -30.0, y: 4.8, radius: 4.2, speed: 0.68, scale: 1.4, color: '#c4b5fd' },
      { cx: 28.0, cz: -12.0, y: 3.0, radius: 3.8, speed: 0.8, scale: 1.3, color: '#fb923c' },
      { cx: -6.0, cz: -8.0, y: 2.6, radius: 3.2, speed: 0.9, scale: 1.25, color: '#6ee7b7' },
      { cx: 16.0, cz: 18.0, y: 2.2, radius: 2.8, speed: 0.86, scale: 1.3, color: '#fde047' },
      { cx: -34.0, cz: -14.0, y: 3.4, radius: 4.0, speed: 0.72, scale: 1.45, color: '#f9a8d4' },
      { cx: 42.0, cz: -20.0, y: 3.2, radius: 3.5, speed: 0.84, scale: 1.35, color: '#38bdf8' },
      { cx: -4.0, cz: 46.0, y: 2.5, radius: 4.8, speed: 0.7, scale: 1.5, color: '#fb923c' },
      { cx: 34.0, cz: 42.0, y: 2.8, radius: 4.2, speed: 0.78, scale: 1.4, color: '#f472b6' },
      { cx: -52.0, cz: 22.0, y: 3.5, radius: 5.5, speed: 0.64, scale: 1.55, color: '#60a5fa' },
      { cx: 52.0, cz: 28.0, y: 3.6, radius: 5.2, speed: 0.66, scale: 1.55, color: '#fde047' },
    ],
    []
  );

  useFrame((state) => {
    if (!liveSceneActivity.isOutdoor) return;
    const t = state.clock.getElapsedTime();
    groupRefs.current.forEach((g, idx) => {
      if (!g) return;
      const b = butterflies[idx];
      const angle = t * b.speed + idx * 1.4;
      g.position.x = b.cx + Math.cos(angle) * b.radius;
      g.position.z = b.cz + Math.sin(angle * 0.85) * b.radius;
      g.position.y = b.y + Math.sin(t * 2.4 + idx) * 0.28;
      g.rotation.y = -angle;
      const flap = Math.sin(t * 14 + idx * 2) * 0.65;
      const wL = g.children[0];
      const wR = g.children[1];
      if (wL) wL.rotation.z = flap;
      if (wR) wR.rotation.z = -flap;
    });
  });

  return (
    <group>
      {butterflies.map((b, idx) => (
        <group
          key={`bf_${idx}`}
          scale={b.scale}
          ref={(el) => {
            groupRefs.current[idx] = el;
          }}
        >
          <mesh position={[-0.06, 0, 0]} rotation-x={Math.PI / 2}>
            <circleGeometry args={[0.095, 6]} />
            <meshBasicMaterial color={b.color} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0.06, 0, 0]} rotation-x={Math.PI / 2}>
            <circleGeometry args={[0.095, 6]} />
            <meshBasicMaterial color={b.color} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// 3. Curated Flowering Shrubs, Fern Clusters & Wooden Trail Benches
export const GardenShrubsAndBenches: React.FC = () => {
  const { oakLeafMat } = useNatureMaterials();
  const bloomMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xf7cbb8, roughness: 0.65 }),
    []
  );
  const woodTex = getWoodPlankTexture();
  const woodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85 }),
    [woodTex]
  );

  const shrubs: Array<{ pos: [number, number, number]; scale: number; hasFlowers?: boolean }> = useMemo(() => {
    const coords: Array<[number, number, number, boolean]> = [
      [3.8, -1.5, 1.0, true],
      [-3.9, -2.5, 0.95, true],
      [6.5, 3.8, 0.9, false],
      [-9.5, 3.2, 1.05, true],
      [-26.0, -3.5, 1.1, true],
      [35.0, 14.5, 1.0, true],
      [21.0, 29.0, 1.1, false],
      [40.0, -18.5, 0.95, false],
      [-12.5, -28.0, 1.0, true],
    ];
    return coords.map(([x, z, scale, hasFlowers]) => ({
      pos: [x, groundHeightAt(x, z), z],
      scale,
      hasFlowers,
    }));
  }, []);

  const benches: Array<{ pos: [number, number, number]; rotY: number }> = useMemo(() => {
    const coords: Array<[number, number, number]> = [
      [2.6, 17.8, -0.35],      // Overlooking Lake Pier
      [-11.5, 2.2, 0.4],       // Along Western Lavender Trail
      [18.5, 4.5, -0.8],       // Before Lower Timber Bridge
      [-14.0, -21.0, 0.7],     // Resting bench on Spiritual Hill Trail
    ];
    return coords.map(([x, z, rotY]) => ({
      pos: [x, groundHeightAt(x, z), z],
      rotY,
    }));
  }, []);

  return (
    <group>
      {shrubs.map((s, idx) => (
        <group key={`shrub_${idx}`} position={s.pos} scale={s.scale}>
          <FoliageClusterCard position={[0, 0.42, 0]} size={1.15} material={oakLeafMat} rotY={idx * 0.7} />
          {s.hasFlowers &&
            [
              [0.18, 0.46, 0.14],
              [-0.22, 0.36, 0.22],
              [0.26, 0.32, -0.18],
            ].map(([bx, by, bz], bIdx) => (
              <mesh key={`sb_${bIdx}`} position={[bx, by, bz]} material={bloomMat}>
                <sphereGeometry args={[0.06, 8, 6]} />
              </mesh>
            ))}
        </group>
      ))}

      {benches.map((b, idx) => (
        <group key={`bench_${idx}`} position={b.pos} rotation-y={b.rotY}>
          <mesh position={[0, 0.34, 0]} material={woodMat} castShadow receiveShadow>
            <boxGeometry args={[1.45, 0.08, 0.45]} />
          </mesh>
          <mesh position={[0, 0.64, -0.19]} rotation-x={-0.14} material={woodMat} castShadow>
            <boxGeometry args={[1.45, 0.34, 0.06]} />
          </mesh>
          <mesh position={[-0.56, 0.17, 0]} material={woodMat} castShadow>
            <boxGeometry args={[0.09, 0.34, 0.38]} />
          </mesh>
          <mesh position={[0.56, 0.17, 0]} material={woodMat} castShadow>
            <boxGeometry args={[0.09, 0.34, 0.38]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// 4. Arched Wooden Bridge with Stone Abutments & Glowing Post Lanterns
export const ArchedWoodenBridgeR3F: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  length?: number;
  width?: number;
  archHeight?: number;
}> = ({ position, rotationY = 0, length = 8.4, width = 2.25, archHeight = 0.92 }) => {
  const woodTex = getWoodPlankTexture();
  const stoneTex = getStoneFoundationTexture();

  const woodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.82 }),
    [woodTex]
  );
  const stoneMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9 }),
    [stoneTex]
  );

  const numSegments = 18;
  const plankThickness = 0.09;

  const planks = useMemo(() => {
    const list = [];
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const x = (t - 0.5) * length;
      const y = archHeight * Math.sin(t * Math.PI) + 0.08;
      const tangentAngle = Math.atan((archHeight * Math.PI * Math.cos(t * Math.PI)) / length);
      list.push({ x, y, tangentAngle, hasPost: i % 3 === 0 });
    }
    return list;
  }, [length, archHeight, numSegments]);

  const [railGeoL, railGeoR] = useMemo(() => {
    const ptsL: THREE.Vector3[] = [];
    const ptsR: THREE.Vector3[] = [];
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const x = (t - 0.5) * length;
      const y = archHeight * Math.sin(t * Math.PI) + 0.88;
      ptsL.push(new THREE.Vector3(x, y, -width / 2 + 0.08));
      ptsR.push(new THREE.Vector3(x, y, width / 2 - 0.08));
    }
    return [
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsL), 22, 0.045, 8, false),
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsR), 22, 0.045, 8, false),
    ];
  }, [length, width, archHeight, numSegments]);

  return (
    <group position={position} rotation-y={rotationY}>
      {planks.map((p, idx) => (
        <group key={`plank_${idx}`} position={[p.x, p.y, 0]} rotation-z={p.tangentAngle}>
          <mesh material={woodMat} castShadow receiveShadow>
            <boxGeometry args={[(length / numSegments) * 0.92, plankThickness, width]} />
          </mesh>
          {p.hasPost && (
            <>
              <mesh position={[0, 0.42, -width / 2 + 0.08]} material={woodMat} castShadow>
                <cylinderGeometry args={[0.045, 0.05, 0.84, 8]} />
              </mesh>
              <mesh position={[0, 0.42, width / 2 - 0.08]} material={woodMat} castShadow>
                <cylinderGeometry args={[0.045, 0.05, 0.84, 8]} />
              </mesh>
            </>
          )}
        </group>
      ))}
      <mesh geometry={railGeoL} material={woodMat} castShadow />
      <mesh geometry={railGeoR} material={woodMat} castShadow />
      <mesh position={[-length / 2, -0.45, 0]} material={stoneMat} castShadow receiveShadow>
        <boxGeometry args={[0.95, 1.35, width + 0.35]} />
      </mesh>
      <mesh position={[length / 2, -0.45, 0]} material={stoneMat} castShadow receiveShadow>
        <boxGeometry args={[0.95, 1.35, width + 0.35]} />
      </mesh>
      {/* Center bridge post lanterns */}
      {[-width / 2 + 0.08, width / 2 - 0.08].map((zOff, idx) => (
        <mesh key={`bl_${idx}`} position={[0, archHeight + 0.98, zOff]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial
            color="#fffbeb"
            emissive="#fbbf24"
            emissiveIntensity={1.55}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};

// 5. The Great Ancient Wish Tree (Realistic Multi-Trunk Bark + Botanical Alpha Canopy + Stone Prayer Terrace + Silk Ribbons)
export const GreatWishTreeR3F: React.FC<{
  position: [number, number, number];
  onLabelClick?: () => void;
}> = ({ position, onLabelClick }) => {
  const tagsGroupRef = useRef<THREE.Group>(null);
  const { barkMat, oakLeafMat, oakLeafWarmMat } = useNatureMaterials();
  const stoneTex = getStoneFoundationTexture();
  const stoneMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9 }),
    [stoneTex]
  );

  useFrame((state) => {
    if (!liveSceneActivity.isOutdoor) return;
    const t = state.clock.getElapsedTime();
    if (tagsGroupRef.current) {
      tagsGroupRef.current.children.forEach((tag, idx) => {
        tag.rotation.z = Math.sin(t * 1.8 + idx * 0.9) * 0.09;
      });
    }
  });

  const { wishWoodGeo, wishPrimaryGeo, wishSunlitGeo } = useMemo(() => {
    const woodParts: THREE.BufferGeometry[] = [];
    const angles = [0, 1.0, 2.1, 3.2, 4.3, 5.4];
    for (const a of angles) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(a) * 1.75, -0.1, Math.sin(a) * 1.75),
        new THREE.Vector3(Math.cos(a) * 0.95, 0.36, Math.sin(a) * 0.95),
        new THREE.Vector3(0, 1.15, 0),
      ]);
      woodParts.push(new THREE.TubeGeometry(curve, 10, 0.24, 8, false));
    }

    const mainTrunk = new THREE.CylinderGeometry(0.52, 0.92, 3.2, 14);
    mainTrunk.translate(0, 1.55, 0);
    woodParts.push(mainTrunk);

    const coords = [
      { start: [0, 2.6, 0], mid: [0.95, 3.5, 0.45], end: [2.1, 4.2, 1.05], r: 0.22 },
      { start: [0, 2.6, 0], mid: [-1.05, 3.6, -0.35], end: [-2.2, 4.3, -0.85], r: 0.24 },
      { start: [0, 2.8, 0], mid: [0.25, 3.7, -0.9], end: [0.65, 4.4, -1.95], r: 0.2 },
      { start: [0, 2.8, 0], mid: [-0.55, 3.65, 0.85], end: [-1.15, 4.25, 1.8], r: 0.21 },
      { start: [0, 3.2, 0], mid: [0.15, 4.1, 0.1], end: [0.25, 4.95, 0.15], r: 0.18 },
    ];
    for (const l of coords) {
      woodParts.push(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(...l.start),
            new THREE.Vector3(...l.mid),
            new THREE.Vector3(...l.end),
          ]),
          10,
          l.r,
          8,
          false
        )
      );
    }

    const canopySprigs = [
      { pos: [2.05, 4.35, 1.0] as [number, number, number], size: 3.1, rot: 0.3, sun: true },
      { pos: [-2.1, 4.45, -0.8] as [number, number, number], size: 3.2, rot: 1.4, sun: false },
      { pos: [0.62, 4.55, -1.85] as [number, number, number], size: 2.9, rot: 2.2, sun: true },
      { pos: [-1.1, 4.35, 1.72] as [number, number, number], size: 2.95, rot: 0.9, sun: false },
      { pos: [0.2, 5.2, 0.15] as [number, number, number], size: 3.4, rot: 1.7, sun: true },
      { pos: [1.15, 4.85, -0.8] as [number, number, number], size: 2.6, rot: 2.6, sun: true },
      { pos: [-1.15, 4.85, 0.65] as [number, number, number], size: 2.65, rot: 0.2, sun: false },
      { pos: [0, 4.05, 0] as [number, number, number], size: 2.8, rot: 1.1, sun: false },
    ];

    const primaryLeafParts: THREE.BufferGeometry[] = [];
    const sunlitLeafParts: THREE.BufferGeometry[] = [];
    for (const c of canopySprigs) {
      const target = c.sun ? sunlitLeafParts : primaryLeafParts;
      target.push(...buildClusterParts(c.pos, c.size, c.rot));
    }

    return {
      wishWoodGeo: bakeMergedGeometry(woodParts),
      wishPrimaryGeo: bakeMergedGeometry(primaryLeafParts),
      wishSunlitGeo: bakeMergedGeometry(sunlitLeafParts),
    };
  }, []);

  const tags = useMemo(() => {
    const list = [];
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const dist = 1.35 + (i % 3) * 0.42;
      const tx = Math.cos(angle) * dist;
      const tz = Math.sin(angle) * dist;
      const ty = 3.1 - (i % 3) * 0.26;
      list.push({ tx, ty, tz, angle, warm: i % 2 === 0 });
    }
    return list;
  }, []);

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onLabelClick?.();
      }}
    >
      {/* Circular Stone Prayer Terrace Under Tree */}
      <mesh position={[0, 0.08, 0]} material={stoneMat} receiveShadow castShadow>
        <cylinderGeometry args={[3.3, 3.6, 0.22, 24]} />
      </mesh>
      <mesh geometry={wishWoodGeo} material={barkMat} castShadow receiveShadow />
      <mesh geometry={wishPrimaryGeo} material={oakLeafMat} castShadow receiveShadow />
      <mesh geometry={wishSunlitGeo} material={oakLeafWarmMat} castShadow receiveShadow />

      <group ref={tagsGroupRef}>
        {tags.map((t, idx) => (
          <group key={`tag_${idx}`} position={[t.tx, t.ty, t.tz]} rotation-y={t.angle}>
            <mesh>
              <boxGeometry args={[0.1, 0.28, 0.02]} />
              <meshStandardMaterial
                color={t.warm ? '#fef3c7' : '#f4d3c2'}
                emissive={t.warm ? '#f59e0b' : '#f472b6'}
                emissiveIntensity={0.28}
                roughness={0.6}
              />
            </mesh>
            <mesh position={[0, 0.18, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.36, 4]} />
              <meshBasicMaterial color="#d6d3c9" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Luminous Spirit Wisps Floating Around Ancient Wish Tree */}
      {[
        [-1.8, 3.7, 1.4],
        [2.0, 4.1, 1.1],
        [-1.2, 4.6, -1.6],
        [1.5, 3.4, -1.5],
        [0.1, 5.4, 1.5],
      ].map(([wx, wy, wz], idx) => (
        <mesh key={`wish_wisp_${idx}`} position={[wx, wy, wz]}>
          <sphereGeometry args={[0.075, 8, 8]} />
          <meshStandardMaterial
            color="#fef9c3"
            emissive={idx % 2 === 0 ? '#fde047' : '#6ee7b7'}
            emissiveIntensity={1.75}
            toneMapped={false}
          />
        </mesh>
      ))}

      <ProximityZoneSign
        worldPosition={position}
        localOffset={[0, 6.4, 0]}
        title="Cây ước nguyện"
        subtitle="Gửi lời cam kết"
        onClick={onLabelClick}
      />
    </group>
  );
};

// 6. Sculpted Multi-Petal Pink & Cream Lotus Cluster (Đầm Hoa Sen)
export const WaterLilyR3F: React.FC<{ position: [number, number, number]; scale?: number }> = ({
  position,
  scale = 1.0,
}) => (
  <group position={position} scale={scale}>
    {[0, 1, 2, 3].map((i) => {
      const angle = (i / 4) * Math.PI * 2 + 0.3;
      return (
        <mesh
          key={`pad_${i}`}
          rotation-x={-Math.PI / 2}
          rotation-z={angle}
          position={[Math.sin(angle) * 0.48, 0, Math.cos(angle) * 0.48]}
        >
          <circleGeometry args={[0.42, 18, 0, Math.PI * 1.84]} />
          <meshStandardMaterial color="#3c7349" roughness={0.68} side={THREE.DoubleSide} />
        </mesh>
      );
    })}
    {/* Sculpted 8-petal Pink Lotus Flower */}
    <group position={[0, 0.04, 0]}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const ang = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={`lp_${i}`}
            position={[Math.cos(ang) * 0.11, 0.06, Math.sin(ang) * 0.11]}
            rotation={[0, -ang, -0.68]}
          >
            <coneGeometry args={[0.08, 0.22, 5]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#f9a8d4' : '#fbcfe8'} roughness={0.45} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.075, 10, 8]} />
        <meshStandardMaterial color="#fde047" emissive="#fbbf24" emissiveIntensity={0.35} roughness={0.4} />
      </mesh>
    </group>
  </group>
);

// 7. Smooth Botanical River Boulder
export const MossyBoulderR3F: React.FC<{
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
}> = ({ position, scale = 1.0, rotationY = 0 }) => (
  <mesh
    position={position}
    scale={[1.15 * scale, 0.65 * scale, 0.95 * scale]}
    rotation-y={rotationY}
    castShadow
    receiveShadow
  >
    <dodecahedronGeometry args={[0.55, 1]} />
    <meshStandardMaterial color="#9aa49d" roughness={0.88} metalness={0.03} />
  </mesh>
);
