import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  getStoneFoundationTexture,
  getWoodPlankTexture,
  getLimeStuccoTexture,
  getSlateShingleTexture,
} from '../ProceduralTextures';
import { ProximityZoneSign } from './R3FNature';
import { liveSceneActivity } from './roomTypes';

// Shared Realistic Architectural PBR Materials Hook
export function useCottageMaterials() {
  const mats = useMemo(() => {
    const stoneTex = getStoneFoundationTexture();
    const woodTex = getWoodPlankTexture();
    const stuccoTex = getLimeStuccoTexture();
    const cedarRoofTex = getSlateShingleTexture('moss_cedar');
    const terracottaRoofTex = getSlateShingleTexture('terracotta');
    const slateRoofTex = getSlateShingleTexture('slate');

    return {
      stoneMat: new THREE.MeshStandardMaterial({
        map: stoneTex,
        color: 0x8e968f,
        roughness: 0.9,
        metalness: 0.04,
      }),
      stepStoneMat: new THREE.MeshStandardMaterial({
        map: stoneTex,
        color: 0xa6aea6,
        roughness: 0.88,
        metalness: 0.04,
      }),
      stuccoMat: new THREE.MeshStandardMaterial({
        map: stuccoTex,
        color: 0xf4ede0,
        roughness: 0.86,
        metalness: 0.02,
      }),
      hoiAnOchreMat: new THREE.MeshStandardMaterial({
        map: stuccoTex,
        color: 0xdcb468,
        roughness: 0.84,
        metalness: 0.03,
      }),
      coastalLimeMat: new THREE.MeshStandardMaterial({
        map: stuccoTex,
        color: 0xf3eee4,
        roughness: 0.84,
        metalness: 0.02,
      }),
      coastalTealMat: new THREE.MeshStandardMaterial({
        map: woodTex,
        color: 0x3f7f82,
        roughness: 0.72,
        metalness: 0.06,
      }),
      oakTimberMat: new THREE.MeshStandardMaterial({
        map: woodTex,
        color: 0x7c5335,
        roughness: 0.76,
        metalness: 0.05,
      }),
      darkTimberMat: new THREE.MeshStandardMaterial({
        map: woodTex,
        color: 0x472f1e,
        roughness: 0.72,
        metalness: 0.06,
      }),
      vermilionMat: new THREE.MeshPhysicalMaterial({
        color: 0x8f2421,
        roughness: 0.36,
        metalness: 0.06,
        clearcoat: 0.55,
        clearcoatRoughness: 0.28,
      }),
      doorMat: new THREE.MeshStandardMaterial({
        map: woodTex,
        color: 0x5d3d28,
        roughness: 0.7,
        metalness: 0.05,
      }),
      woodMat: new THREE.MeshStandardMaterial({
        map: woodTex,
        color: 0x8c6343,
        roughness: 0.8,
        metalness: 0.04,
      }),
      bambooMat: new THREE.MeshStandardMaterial({
        color: 0x9c824a,
        roughness: 0.76,
        metalness: 0.04,
      }),
      cedarRoofMat: new THREE.MeshStandardMaterial({
        map: cedarRoofTex,
        color: 0x5c6e58,
        roughness: 0.86,
        metalness: 0.04,
      }),
      terracottaRoofMat: new THREE.MeshStandardMaterial({
        map: terracottaRoofTex,
        color: 0xb45339,
        roughness: 0.76,
        metalness: 0.05,
      }),
      slateRoofMat: new THREE.MeshStandardMaterial({
        map: slateRoofTex,
        color: 0x4b5563,
        roughness: 0.72,
        metalness: 0.08,
      }),
      glassPaneMat: new THREE.MeshStandardMaterial({
        color: 0xcbe4ee,
        transparent: true,
        opacity: 0.42,
        roughness: 0.14,
        metalness: 0.18,
        envMapIntensity: 1.25,
      }),
      chimneyMat: new THREE.MeshStandardMaterial({
        map: stoneTex,
        color: 0x7d847e,
        roughness: 0.9,
        metalness: 0.04,
      }),
      warmGlassMat: new THREE.MeshStandardMaterial({
        color: 0xfffbeb,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.35,
        roughness: 0.25,
        toneMapped: false,
      }),
      redLanternMat: new THREE.MeshStandardMaterial({
        color: 0xfff1f2,
        emissive: 0xe11d48,
        emissiveIntensity: 1.35,
        roughness: 0.28,
        toneMapped: false,
      }),
      brassMat: new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.85,
        roughness: 0.24,
      }),
      clayMat: new THREE.MeshStandardMaterial({
        color: 0xb46246,
        roughness: 0.82,
        metalness: 0.03,
      }),
      foliageBoxMat: new THREE.MeshStandardMaterial({
        color: 0x4d8443,
        roughness: 0.78,
      }),
      bloomCoralMat: new THREE.MeshStandardMaterial({
        color: 0xf472b6,
        roughness: 0.65,
      }),
      bloomCreamMat: new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        roughness: 0.62,
      }),
    };
  }, []);

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose());
    },
    [mats]
  );

  return mats;
}

// Gentle Animated Chimney / Incense Smoke Wisps
const ChimneySmokePuffs: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const puffsRef = useRef<Array<THREE.Mesh | null>>([]);
  const puffMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xf5f4ef,
        transparent: true,
        opacity: 0.34,
        roughness: 1,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => () => puffMat.dispose(), [puffMat]);

  useFrame((state) => {
    if (!liveSceneActivity.isOutdoor) return;
    const t = state.clock.getElapsedTime();
    puffsRef.current.forEach((mesh, i) => {
      if (!mesh) return;
      const cycle = (t * 0.26 + i * 0.25) % 1;
      mesh.position.y = cycle * 1.9;
      mesh.position.x = Math.sin(t * 1.1 + i * 1.5) * 0.18 * cycle + cycle * 0.24;
      mesh.position.z = Math.cos(t * 0.8 + i) * 0.1 * cycle;
      mesh.scale.setScalar(0.5 + cycle * 1.3);
    });
  });

  return (
    <group position={position}>
      {[0, 1, 2, 3].map((idx) => (
        <mesh
          key={`smoke_${idx}`}
          ref={(el) => {
            puffsRef.current[idx] = el;
          }}
          material={puffMat}
        >
          <sphereGeometry args={[0.17, 10, 8]} />
        </mesh>
      ))}
    </group>
  );
};

// Reusable Hanging Hội An Silk Lantern Cluster
const HoiAnHangingLantern: React.FC<{
  position: [number, number, number];
  variant?: 'red' | 'amber';
  scale?: number;
  mats: ReturnType<typeof useCottageMaterials>;
}> = ({ position, variant = 'red', scale = 1.0, mats }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 0.14, 0]} material={mats.darkTimberMat}>
      <cylinderGeometry args={[0.012, 0.012, 0.22, 6]} />
    </mesh>
    <mesh position={[0, 0.04, 0]} material={mats.brassMat}>
      <cylinderGeometry args={[0.06, 0.06, 0.03, 10]} />
    </mesh>
    <mesh
      position={[0, -0.09, 0]}
      scale={[0.14, 0.17, 0.14]}
      material={variant === 'red' ? mats.redLanternMat : mats.warmGlassMat}
    >
      <sphereGeometry args={[1, 12, 10]} />
    </mesh>
    <mesh position={[0, -0.22, 0]} material={mats.brassMat}>
      <cylinderGeometry args={[0.05, 0.05, 0.03, 10]} />
    </mesh>
    <mesh position={[0, -0.32, 0]} material={mats.redLanternMat}>
      <cylinderGeometry args={[0.015, 0.025, 0.14, 6]} />
    </mesh>
  </group>
);

// Outdoor Plush Garden Armchair & Round Wooden Tea Table
export const CozyGardenArmchair: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0.45 }) => {
  const { chairMat, cushionDarkMat, pillowMat, legMat, mugMat } = useMemo(
    () => ({
      chairMat: new THREE.MeshStandardMaterial({ color: 0xdfb14c, roughness: 0.84, metalness: 0.02 }),
      cushionDarkMat: new THREE.MeshStandardMaterial({ color: 0xc99636, roughness: 0.88 }),
      pillowMat: new THREE.MeshStandardMaterial({ color: 0x89b3c4, roughness: 0.88 }),
      legMat: new THREE.MeshStandardMaterial({ color: 0x6b472f, roughness: 0.8 }),
      mugMat: new THREE.MeshStandardMaterial({ color: 0xfaf7ef, roughness: 0.4 }),
    }),
    []
  );

  useEffect(
    () => () => {
      chairMat.dispose();
      cushionDarkMat.dispose();
      pillowMat.dispose();
      legMat.dispose();
      mugMat.dispose();
    },
    [chairMat, cushionDarkMat, pillowMat, legMat, mugMat]
  );

  return (
    <group position={position} rotation-y={rotationY}>
      {[
        [-0.42, -0.34],
        [0.42, -0.34],
        [-0.42, 0.34],
        [0.42, 0.34],
      ].map(([lx, lz], i) => (
        <mesh key={`leg_${i}`} position={[lx, 0.1, lz]} material={legMat} castShadow>
          <cylinderGeometry args={[0.04, 0.03, 0.2, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 0.24, 0]} material={cushionDarkMat} castShadow receiveShadow>
        <boxGeometry args={[0.98, 0.16, 0.82]} />
      </mesh>
      <mesh position={[0, 0.36, 0.05]} rotation-z={Math.PI / 2} material={chairMat} castShadow receiveShadow>
        <capsuleGeometry args={[0.1, 0.56, 6, 12]} />
      </mesh>
      <mesh position={[0, 0.36, 0.04]} material={chairMat} castShadow receiveShadow>
        <boxGeometry args={[0.74, 0.15, 0.68]} />
      </mesh>
      <mesh position={[0, 0.68, -0.32]} rotation-x={-0.12} material={chairMat} castShadow receiveShadow>
        <boxGeometry args={[0.94, 0.68, 0.19]} />
      </mesh>
      <mesh position={[0, 1.0, -0.36]} rotation-z={Math.PI / 2} material={chairMat} castShadow>
        <capsuleGeometry args={[0.095, 0.74, 6, 12]} />
      </mesh>
      <mesh position={[-0.44, 0.45, 0.02]} material={chairMat} castShadow receiveShadow>
        <boxGeometry args={[0.17, 0.3, 0.78]} />
      </mesh>
      <mesh position={[-0.44, 0.61, 0.02]} rotation-x={Math.PI / 2} material={chairMat} castShadow>
        <capsuleGeometry args={[0.09, 0.64, 6, 12]} />
      </mesh>
      <mesh position={[0.44, 0.45, 0.02]} material={chairMat} castShadow receiveShadow>
        <boxGeometry args={[0.17, 0.3, 0.78]} />
      </mesh>
      <mesh position={[0.44, 0.61, 0.02]} rotation-x={Math.PI / 2} material={chairMat} castShadow>
        <capsuleGeometry args={[0.09, 0.64, 6, 12]} />
      </mesh>
      <mesh position={[0.06, 0.56, -0.14]} rotation={[-0.25, 0.18, 0.08]} material={pillowMat} castShadow>
        <boxGeometry args={[0.38, 0.34, 0.14]} />
      </mesh>

      <group position={[-0.86, 0, 0.22]}>
        <mesh position={[0, 0.21, 0]} material={legMat} castShadow>
          <cylinderGeometry args={[0.045, 0.06, 0.42, 10]} />
        </mesh>
        <mesh position={[0, 0.03, 0]} material={legMat} castShadow receiveShadow>
          <cylinderGeometry args={[0.18, 0.22, 0.05, 12]} />
        </mesh>
        <mesh position={[0, 0.43, 0]} material={legMat} castShadow receiveShadow>
          <cylinderGeometry args={[0.26, 0.25, 0.05, 16]} />
        </mesh>
        <mesh position={[0.03, 0.51, 0.02]} material={mugMat} castShadow>
          <cylinderGeometry args={[0.055, 0.045, 0.11, 12]} />
        </mesh>
        <mesh position={[0.03, 0.56, 0.02]}>
          <cylinderGeometry args={[0.044, 0.044, 0.01, 10]} />
          <meshStandardMaterial color="#879e5e" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};

// Terracotta Pot with Botanical Succulent
export const TerracottaCactusPot: React.FC<{
  position: [number, number, number];
}> = ({ position }) => {
  const { potMat, cactusMat, soilMat } = useMemo(
    () => ({
      potMat: new THREE.MeshStandardMaterial({ color: 0xb95f3c, roughness: 0.8 }),
      cactusMat: new THREE.MeshStandardMaterial({ color: 0x4b8744, roughness: 0.78 }),
      soilMat: new THREE.MeshStandardMaterial({ color: 0x4b3626, roughness: 0.95 }),
    }),
    []
  );

  useEffect(
    () => () => {
      potMat.dispose();
      cactusMat.dispose();
      soilMat.dispose();
    },
    [potMat, cactusMat, soilMat]
  );

  return (
    <group position={position}>
      <mesh position={[0, 0.16, 0]} material={potMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.26, 0.19, 0.32, 16]} />
      </mesh>
      <mesh position={[0, 0.33, 0]} material={potMat} castShadow>
        <cylinderGeometry args={[0.29, 0.28, 0.08, 16]} />
      </mesh>
      <mesh position={[0, 0.35, 0]} material={soilMat}>
        <cylinderGeometry args={[0.24, 0.24, 0.03, 14]} />
      </mesh>
      <mesh position={[0, 0.58, 0]} material={cactusMat} castShadow>
        <capsuleGeometry args={[0.11, 0.3, 6, 12]} />
      </mesh>
      <mesh position={[-0.14, 0.62, 0]} rotation-z={0.55} material={cactusMat} castShadow>
        <capsuleGeometry args={[0.06, 0.14, 4, 8]} />
      </mesh>
      <mesh position={[0.14, 0.54, 0.04]} rotation-z={-0.6} material={cactusMat} castShadow>
        <capsuleGeometry args={[0.06, 0.12, 4, 8]} />
      </mesh>
    </group>
  );
};

// Vintage Trail Lamp Post
export const VintageLampPost: React.FC<{
  position: [number, number, number];
  height?: number;
  rotationY?: number;
}> = ({ position, height = 2.25, rotationY = 0 }) => {
  const { stoneMat, darkTimberMat, chimneyMat } = useCottageMaterials();

  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 0.12, 0]} material={stoneMat} castShadow>
        <cylinderGeometry args={[0.18, 0.24, 0.24, 8]} />
      </mesh>
      <mesh position={[0, height / 2 + 0.12, 0]} material={darkTimberMat} castShadow>
        <cylinderGeometry args={[0.055, 0.08, height, 8]} />
      </mesh>
      <mesh position={[0.24, height + 0.08, 0]} rotation-z={-Math.PI / 3} material={chimneyMat}>
        <cylinderGeometry args={[0.026, 0.026, 0.52, 8]} />
      </mesh>
      <group position={[0.44, height - 0.08, 0]}>
        <mesh position={[0, 0.12, 0]} material={chimneyMat}>
          <coneGeometry args={[0.15, 0.13, 6]} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.09, 0.07, 0.19, 6]} />
          <meshStandardMaterial
            color="#fff7d6"
            emissive="#fbbf24"
            emissiveIntensity={1.5}
            roughness={0.25}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
};

// Carved East-Asian Stone Toro Garden Lantern (Flanking Spiritual Steps)
export const StoneGardenLantern: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const { stoneMat, warmGlassMat } = useCottageMaterials();
  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]} material={stoneMat} castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.2, 0.48]} />
      </mesh>
      <mesh position={[0, 0.58, 0]} material={stoneMat} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.78, 8]} />
      </mesh>
      <mesh position={[0, 1.02, 0]} material={stoneMat} castShadow>
        <boxGeometry args={[0.42, 0.1, 0.42]} />
      </mesh>
      <mesh position={[0, 1.22, 0]} material={warmGlassMat}>
        <boxGeometry args={[0.24, 0.28, 0.24]} />
      </mesh>
      <mesh position={[0, 1.48, 0]} material={stoneMat} castShadow>
        <coneGeometry args={[0.38, 0.28, 4]} />
      </mesh>
    </group>
  );
};

export interface CottageProps {
  position: [number, number, number];
  rotationY?: number;
  type?: 'journal' | 'letters' | 'rain_cabin';
  labelTitle?: string;
  labelSubtitle?: string;
  onLabelClick?: () => void;
}

/**
 * 1. Region-Authentic Vietnamese Sanctuary Architecture:
 *    - 'journal' (Yên Bình Center): Nhà gỗ cổ Hội An mái ngói âm dương vàng nghệ & đèn lồng lụa
 *    - 'letters' (Miền Biển East Cove): Trạm ký ức ven vịnh tường vôi trắng & cửa chớp xanh biển
 *    - 'rain_cabin' (Miền Biển Bay): Nhà kính gỗ lũa ven vịnh biển đón gió
 */
export const StorybookCottage: React.FC<CottageProps> = ({
  position,
  rotationY = 0,
  type = 'journal',
  labelTitle,
  labelSubtitle,
  onLabelClick,
}) => {
  const mats = useCottageMaterials();
  const {
    stoneMat,
    stepStoneMat,
    hoiAnOchreMat,
    coastalLimeMat,
    coastalTealMat,
    oakTimberMat,
    darkTimberMat,
    doorMat,
    terracottaRoofMat,
    slateRoofMat,
    glassPaneMat,
    chimneyMat,
    warmGlassMat,
    brassMat,
    clayMat,
    foliageBoxMat,
    bloomCoralMat,
    bloomCreamMat,
  } = mats;

  // Dedicated Coastal Driftwood & Glass Conservatory Architecture for Căn Phòng Mưa (Miền Biển)
  if (type === 'rain_cabin') {
    const w = 4.6;
    const d = 3.9;
    const h = 2.65;
    return (
      <group
        position={position}
        rotation-y={rotationY}
        onClick={(e) => {
          e.stopPropagation();
          onLabelClick?.();
        }}
      >
        {/* Raised Coastal Coral-Stone & Driftwood Timber Veranda Deck */}
        <mesh position={[0, 0.22, 0.28]} material={stoneMat} castShadow receiveShadow>
          <boxGeometry args={[w + 1.25, 0.44, d + 1.6]} />
        </mesh>
        <mesh position={[0, 0.46, 0.28]} material={oakTimberMat} receiveShadow>
          <boxGeometry args={[w + 1.1, 0.08, d + 1.45]} />
        </mesh>
        {/* Coastal Timber Railing along Veranda Front Sides */}
        {[-w / 2 - 0.15, w / 2 + 0.15].map((rx, i) => (
          <mesh key={`rc_rail_${i}`} position={[rx, 0.85, 0.4]} material={coastalTealMat} castShadow>
            <boxGeometry args={[0.1, 0.72, d + 0.8]} />
          </mesh>
        ))}
        {/* Front Deck Steps */}
        {[0, 1, 2].map((s) => (
          <mesh
            key={`rs_${s}`}
            position={[0, 0.08 + s * 0.12, d / 2 + 1.24 - s * 0.24]}
            material={stepStoneMat}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[1.7, 0.12, 0.28]} />
          </mesh>
        ))}
        {/* Interior Coastal Oak Back Wall & Warm Hearth Glow */}
        <mesh position={[0, 0.5 + h / 2, -d / 2 + 0.08]} material={coastalTealMat} castShadow receiveShadow>
          <boxGeometry args={[w - 0.1, h, 0.18]} />
        </mesh>
        <mesh position={[0, 1.38, 0]} material={warmGlassMat}>
          <boxGeometry args={[w - 0.9, 1.45, d - 0.9]} />
        </mesh>
        <mesh position={[0, 0.5 + h / 2, 0]} material={glassPaneMat}>
          <boxGeometry args={[w - 0.12, h - 0.1, d - 0.12]} />
        </mesh>
        {/* Coastal Sea-Teal Conservatory Posts & Louvered Trim */}
        {[-w / 2, -w / 6, w / 6, w / 2].map((px, i) => (
          <React.Fragment key={`gp_${i}`}>
            <mesh position={[px, 0.5 + h / 2, d / 2]} material={coastalTealMat} castShadow>
              <boxGeometry args={[0.15, h, 0.15]} />
            </mesh>
            <mesh position={[px, 0.5 + h / 2, -d / 2]} material={coastalTealMat} castShadow>
              <boxGeometry args={[0.15, h, 0.15]} />
            </mesh>
          </React.Fragment>
        ))}
        {[-d / 6, d / 6].map((pz, i) => (
          <React.Fragment key={`gps_${i}`}>
            <mesh position={[-w / 2, 0.5 + h / 2, pz]} material={coastalTealMat} castShadow>
              <boxGeometry args={[0.15, h, 0.15]} />
            </mesh>
            <mesh position={[w / 2, 0.5 + h / 2, pz]} material={coastalTealMat} castShadow>
              <boxGeometry args={[0.15, h, 0.15]} />
            </mesh>
          </React.Fragment>
        ))}
        {/* Pitched Slate & Glass Skylight Roof with Extended Coastal Eaves */}
        <mesh position={[-1.35, 0.5 + h + 0.65, 0]} rotation-z={0.54} material={slateRoofMat} castShadow receiveShadow>
          <boxGeometry args={[3.35, 0.14, d + 1.05]} />
        </mesh>
        <mesh position={[1.35, 0.5 + h + 0.65, 0]} rotation-z={-0.54} material={slateRoofMat} castShadow receiveShadow>
          <boxGeometry args={[3.35, 0.14, d + 1.05]} />
        </mesh>
        <mesh position={[0, 0.5 + h + 1.45, 0]} material={darkTimberMat} castShadow>
          <boxGeometry args={[0.28, 0.18, d + 1.1]} />
        </mesh>
        {/* Hanging Coastal Veranda Silk Lanterns */}
        <HoiAnHangingLantern position={[-1.4, 2.55, d / 2 + 0.42]} variant="amber" mats={mats} />
        <HoiAnHangingLantern position={[1.4, 2.55, d / 2 + 0.42]} variant="amber" mats={mats} />
        {/* Stone Chimney */}
        <mesh position={[-w * 0.36, 0.5 + h + 0.9, -d * 0.25]} material={chimneyMat} castShadow>
          <boxGeometry args={[0.58, 2.2, 0.58]} />
        </mesh>
        <ChimneySmokePuffs position={[-w * 0.36, 0.5 + h + 2.05, -d * 0.25]} />
        <pointLight color="#ffd896" intensity={1.85} distance={9.5} position={[0, 1.85, 0.4]} />

        {labelTitle && (
          <ProximityZoneSign
            worldPosition={position}
            localOffset={[0, 5.2, 0]}
            title={labelTitle}
            subtitle={labelSubtitle}
            onClick={onLabelClick}
          />
        )}
      </group>
    );
  }

  // Vietnamese Regional Houses:
  // 'journal' = Nhà Gỗ Cổ Hội An (Yên Bình) | 'letters' = Trạm Ký Ức Ven Vịnh (Miền Biển)
  const isJournal = type === 'journal';
  const wallMat = isJournal ? hoiAnOchreMat : coastalLimeMat;
  const shutterMat = isJournal ? doorMat : coastalTealMat;
  const activeRoofMat = terracottaRoofMat;

  const width = isJournal ? 4.45 : 4.35;
  const depth = 3.65;
  const height = 2.62;
  const roofPeakHeight = 1.9;
  const roofOverhang = 0.72;

  const frontGableShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-width / 2, 0);
    s.lineTo(width / 2, 0);
    s.lineTo(0, roofPeakHeight);
    s.closePath();
    return s;
  }, [width, roofPeakHeight]);

  const frontSlopeAngle = Math.atan2(roofPeakHeight, width / 2 + roofOverhang);
  const frontSlopeLen = Math.sqrt((width / 2 + roofOverhang) ** 2 + roofPeakHeight ** 2);

  return (
    <group
      position={position}
      rotation-y={rotationY}
      onClick={(e) => {
        e.stopPropagation();
        onLabelClick?.();
      }}
    >
      {/* 1. Stacked Stone Plinth Foundation + Covered Veranda Platform */}
      <mesh position={[0, 0.28, 0]} material={stoneMat} castShadow receiveShadow>
        <boxGeometry args={[width + 0.4, 0.56, depth + 0.4]} />
      </mesh>
      <mesh position={[0, 0.28, depth / 2 + 0.65]} material={stoneMat} castShadow receiveShadow>
        <boxGeometry args={[width + 0.15, 0.56, 1.25]} />
      </mesh>

      {/* 2. Carved Stone Steps Leading Up to Veranda */}
      {[0, 1, 2, 3].map((step) => (
        <mesh
          key={`step_${step}`}
          position={[0, 0.08 + step * 0.12, depth / 2 + 1.65 - step * 0.24]}
          material={stepStoneMat}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1.65, 0.12, 0.28]} />
        </mesh>
      ))}

      {/* 3. Authentic Regional Limewashed Walls (Hội An Ochre / Coastal White Lime) */}
      <mesh position={[0, 0.56 + height / 2, 0]} material={wallMat} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
      </mesh>

      {/* 4. Dark Ironwood Timber Columns & Traditional Front Wooden Screen Panels */}
      {[
        [-width / 2, -depth / 2],
        [width / 2, -depth / 2],
        [-width / 2, depth / 2],
        [width / 2, depth / 2],
      ].map(([cx, cz], idx) => (
        <mesh key={`corner_${idx}`} position={[cx, 0.56 + height / 2, cz]} material={darkTimberMat} castShadow>
          <boxGeometry args={[0.2, height + 0.06, 0.2]} />
        </mesh>
      ))}

      {/* Carved Wooden Veranda Columns & Balustrade */}
      {[-width * 0.44, -width * 0.24, width * 0.24, width * 0.44].map((vx, idx) => (
        <mesh key={`vcol_${idx}`} position={[vx, 0.56 + 0.92, depth / 2 + 1.05]} material={darkTimberMat} castShadow>
          <cylinderGeometry args={[0.075, 0.09, 1.84, 8]} />
        </mesh>
      ))}
      <mesh position={[-width * 0.34, 0.92, depth / 2 + 1.05]} material={darkTimberMat} castShadow>
        <boxGeometry args={[width * 0.24, 0.62, 0.08]} />
      </mesh>
      <mesh position={[width * 0.34, 0.92, depth / 2 + 1.05]} material={darkTimberMat} castShadow>
        <boxGeometry args={[width * 0.24, 0.62, 0.08]} />
      </mesh>

      {/* Traditional Carved Wooden Front Door & Side Window Panes */}
      <mesh position={[0, 0.56 + 0.95, depth / 2 + 0.04]} material={darkTimberMat}>
        <boxGeometry args={[1.42, 1.85, 0.1]} />
      </mesh>
      <mesh position={[0, 0.56 + 0.9, depth / 2 + 0.07]} material={doorMat}>
        <boxGeometry args={[1.22, 1.72, 0.08]} />
      </mesh>
      <mesh position={[0, 0.56 + 1.25, depth / 2 + 0.12]} material={warmGlassMat}>
        <planeGeometry args={[0.72, 0.48]} />
      </mesh>
      {/* Lattice muntins on front door */}
      {[-0.18, 0, 0.18].map((mx, i) => (
        <mesh key={`dm_${i}`} position={[mx, 0.56 + 1.25, depth / 2 + 0.13]} material={darkTimberMat}>
          <boxGeometry args={[0.03, 0.5, 0.02]} />
        </mesh>
      ))}
      <mesh position={[0.22, 0.56 + 0.85, depth / 2 + 0.13]} material={brassMat}>
        <sphereGeometry args={[0.045, 8, 8]} />
      </mesh>

      {/* 5. Front & Back Gable Walls + Wooden Louver Vent */}
      <mesh position={[0, 0.56 + height, depth / 2 - 0.01]} material={wallMat} castShadow>
        <shapeGeometry args={[frontGableShape]} />
      </mesh>
      <mesh position={[0, 0.56 + height, -depth / 2 + 0.01]} rotation-y={Math.PI} material={wallMat} castShadow>
        <shapeGeometry args={[frontGableShape]} />
      </mesh>
      <mesh position={[0, 0.56 + height + roofPeakHeight * 0.45, depth / 2 + 0.03]} material={darkTimberMat}>
        <boxGeometry args={[0.72, 0.42, 0.08]} />
      </mesh>

      {/* 6. Sweeping Yin-Yang Terracotta Roof Slopes + Flared Corner Eave Ridge */}
      <mesh
        position={[-(width / 2 + roofOverhang) / 2, 0.56 + height + roofPeakHeight / 2 - 0.05, 0]}
        rotation-z={frontSlopeAngle}
        material={activeRoofMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[frontSlopeLen + 0.24, 0.18, depth + roofOverhang * 2]} />
      </mesh>
      <mesh
        position={[(width / 2 + roofOverhang) / 2, 0.56 + height + roofPeakHeight / 2 - 0.05, 0]}
        rotation-z={-frontSlopeAngle}
        material={activeRoofMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[frontSlopeLen + 0.24, 0.18, depth + roofOverhang * 2]} />
      </mesh>

      {/* Ornamental Vietnamese Roof Ridge & Lotus Ridge Finials */}
      <mesh position={[0, 0.56 + height + roofPeakHeight + 0.07, 0]} material={darkTimberMat} castShadow>
        <boxGeometry args={[0.28, 0.22, depth + roofOverhang * 2 + 0.18]} />
      </mesh>
      <mesh position={[0, 0.56 + height + roofPeakHeight + 0.26, depth / 2 + roofOverhang]} material={brassMat} castShadow>
        <coneGeometry args={[0.14, 0.34, 6]} />
      </mesh>
      <mesh position={[0, 0.56 + height + roofPeakHeight + 0.26, -depth / 2 - roofOverhang]} material={brassMat} castShadow>
        <coneGeometry args={[0.14, 0.34, 6]} />
      </mesh>

      {/* Exposed Hardwood Rafter Tails */}
      {[-1.5, -0.75, 0, 0.75, 1.5].map((rz, rIdx) => (
        <React.Fragment key={`raf_${rIdx}`}>
          <mesh position={[-width / 2 - 0.34, 0.56 + height - 0.1, rz]} rotation-z={frontSlopeAngle} material={darkTimberMat}>
            <boxGeometry args={[0.56, 0.1, 0.1]} />
          </mesh>
          <mesh position={[width / 2 + 0.34, 0.56 + height - 0.1, rz]} rotation-z={-frontSlopeAngle} material={darkTimberMat}>
            <boxGeometry args={[0.56, 0.1, 0.1]} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Extended Terracotta Veranda Roof Awning */}
      <mesh position={[0, 0.56 + 1.88, depth / 2 + 0.62]} rotation-x={0.32} material={activeRoofMat} castShadow>
        <boxGeometry args={[width + 0.65, 0.12, 1.48]} />
      </mesh>

      {/* Hanging Hội An Silk Lanterns Under Veranda Eaves */}
      <HoiAnHangingLantern
        position={[-1.25, 0.56 + 1.56, depth / 2 + 1.12]}
        variant={isJournal ? 'red' : 'amber'}
        mats={mats}
      />
      <HoiAnHangingLantern
        position={[1.25, 0.56 + 1.56, depth / 2 + 1.12]}
        variant={isJournal ? 'amber' : 'red'}
        mats={mats}
      />
      <pointLight color="#ffd896" intensity={1.6} distance={8.5} position={[0, 2.0, depth / 2 + 1.0]} />

      {/* 7. Traditional Rainwater Clay Urn (Chum sành) or Coastal Postbox & Mooring */}
      {isJournal ? (
        <group position={[-1.78, 0, depth / 2 + 1.38]}>
          <mesh position={[0, 0.32, 0]} material={clayMat} castShadow>
            <cylinderGeometry args={[0.24, 0.18, 0.64, 14]} />
          </mesh>
          <mesh position={[0, 0.66, 0]} material={darkTimberMat}>
            <cylinderGeometry args={[0.22, 0.22, 0.05, 14]} />
          </mesh>
        </group>
      ) : (
        <group position={[-1.55, 0, depth / 2 + 1.32]}>
          <mesh position={[0, 0.45, 0]} material={coastalTealMat} castShadow>
            <cylinderGeometry args={[0.055, 0.065, 0.9, 8]} />
          </mesh>
          <mesh position={[0, 0.92, 0]} material={doorMat} castShadow>
            <boxGeometry args={[0.34, 0.3, 0.46]} />
          </mesh>
          <mesh position={[0, 1.07, 0]} rotation-x={Math.PI / 2} material={doorMat} castShadow>
            <cylinderGeometry args={[0.17, 0.17, 0.46, 12, 1, false, 0, Math.PI]} />
          </mesh>
          <mesh position={[0.18, 0.92, 0.1]} material={brassMat}>
            <boxGeometry args={[0.02, 0.12, 0.08]} />
          </mesh>
        </group>
      )}

      {/* 8. Side Windows with Carved Louver Shutters & Bougainvillea Planters */}
      {[
        { pos: [-width / 2 - 0.02, 0.56 + height * 0.38, 0.1] as [number, number, number], rotY: -Math.PI / 2 },
        { pos: [width / 2 + 0.02, 0.56 + height * 0.38, 0.1] as [number, number, number], rotY: Math.PI / 2 },
      ].map((win, wIdx) => (
        <group key={`side_win_${wIdx}`} position={win.pos} rotation-y={win.rotY}>
          <mesh material={darkTimberMat} castShadow>
            <boxGeometry args={[1.08, 1.05, 0.1]} />
          </mesh>
          <mesh position={[-0.7, 0, 0.03]} material={shutterMat} castShadow>
            <boxGeometry args={[0.3, 0.98, 0.05]} />
          </mesh>
          <mesh position={[0.7, 0, 0.03]} material={shutterMat} castShadow>
            <boxGeometry args={[0.3, 0.98, 0.05]} />
          </mesh>
          <mesh position={[0, 0, 0.06]} material={warmGlassMat}>
            <planeGeometry args={[0.84, 0.84]} />
          </mesh>
          <mesh position={[0, 0, 0.07]} material={darkTimberMat}>
            <boxGeometry args={[0.86, 0.05, 0.02]} />
          </mesh>
          <mesh position={[0, 0, 0.07]} material={darkTimberMat}>
            <boxGeometry args={[0.05, 0.86, 0.02]} />
          </mesh>
          <group position={[0, -0.58, 0.18]}>
            <mesh material={darkTimberMat} castShadow>
              <boxGeometry args={[1.08, 0.18, 0.24]} />
            </mesh>
            <mesh position={[0, 0.11, 0]} material={foliageBoxMat}>
              <boxGeometry args={[0.96, 0.12, 0.18]} />
            </mesh>
            {[-0.34, -0.1, 0.14, 0.34].map((fx, fIdx) => (
              <mesh
                key={`wb_${fIdx}`}
                position={[fx, 0.19, fIdx % 2 === 0 ? 0.03 : -0.02]}
                material={fIdx % 2 === 0 ? bloomCoralMat : bloomCreamMat}
              >
                <sphereGeometry args={[0.065, 8, 6]} />
              </mesh>
            ))}
          </group>
        </group>
      ))}

      {/* Rooftop Chimney / Ventilation Cupola */}
      <group position={[width * 0.32, 0.56 + height + roofPeakHeight * 0.52, -depth * 0.24]}>
        <mesh position={[0, 0.85, 0]} material={chimneyMat} castShadow>
          <boxGeometry args={[0.58, 1.75, 0.58]} />
        </mesh>
        <mesh position={[0, 1.76, 0]} material={darkTimberMat} castShadow>
          <boxGeometry args={[0.72, 0.14, 0.72]} />
        </mesh>
        <ChimneySmokePuffs position={[0, 1.9, 0]} />
      </group>

      {labelTitle && (
        <ProximityZoneSign
          worldPosition={position}
          localOffset={[0, 0.56 + height + roofPeakHeight + 1.15, 0]}
          title={labelTitle}
          subtitle={labelSubtitle}
          onClick={onLabelClick}
        />
      )}
    </group>
  );
};

// 2. Miền Quê — Đình Làng Lục Giác Bên Đồng Lúa (Vườn Tâm Tình)
export const ConfessionGardenPavilion: React.FC<{
  position: [number, number, number];
  onLabelClick?: () => void;
}> = ({ position, onLabelClick }) => {
  const mats = useCottageMaterials();
  const { stepStoneMat, darkTimberMat, oakTimberMat, terracottaRoofMat, vermilionMat, warmGlassMat, brassMat, clayMat } = mats;

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onLabelClick?.();
      }}
    >
      {/* Two-Tiered Circular Stone Plinth */}
      <mesh position={[0, 0.15, 0]} material={stepStoneMat} receiveShadow castShadow>
        <cylinderGeometry args={[3.55, 3.78, 0.3, 18]} />
      </mesh>
      <mesh position={[0, 0.36, 0]} material={stepStoneMat} receiveShadow castShadow>
        <cylinderGeometry args={[3.1, 3.25, 0.2, 18]} />
      </mesh>
      {/* 6 Vermilion Lacquered Village Đình Pillars + Carved Railings */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <group key={`dpillar_${i}`}>
            <mesh
              position={[Math.cos(angle) * 2.55, 1.68, Math.sin(angle) * 2.55]}
              material={vermilionMat}
              castShadow
            >
              <cylinderGeometry args={[0.105, 0.12, 2.55, 10]} />
            </mesh>
            {/* Hanging silk lantern from every other corner eave */}
            {i % 2 === 0 && (
              <HoiAnHangingLantern
                position={[Math.cos(angle) * 3.15, 2.52, Math.sin(angle) * 3.15]}
                variant={i === 0 ? 'red' : 'amber'}
                mats={mats}
              />
            )}
          </group>
        );
      })}
      {/* Carved Wooden Lattice Balustrade Segments */}
      {[0, 1, 2, 4, 5].map((i) => {
        const angle = ((i + 0.5) / 6) * Math.PI * 2;
        return (
          <mesh
            key={`drail_${i}`}
            position={[Math.cos(angle) * 2.45, 0.72, Math.sin(angle) * 2.45]}
            rotation-y={-angle + Math.PI / 2}
            material={darkTimberMat}
            castShadow
          >
            <boxGeometry args={[2.15, 0.44, 0.1]} />
          </mesh>
        );
      })}
      {/* Sweeping Double-Tiered Terracotta Village Đình Canopy + Lotus Spire */}
      <mesh position={[0, 3.12, 0]} material={terracottaRoofMat} castShadow>
        <coneGeometry args={[3.85, 1.15, 6]} />
      </mesh>
      <mesh position={[0, 3.78, 0]} material={terracottaRoofMat} castShadow>
        <coneGeometry args={[2.45, 0.95, 6]} />
      </mesh>
      <mesh position={[0, 4.35, 0]} material={brassMat} castShadow>
        <coneGeometry args={[0.18, 0.45, 8]} />
      </mesh>
      {/* Hanging Center Silk Lantern */}
      <mesh position={[0, 2.28, 0]} material={warmGlassMat}>
        <sphereGeometry args={[0.24, 12, 10]} />
      </mesh>
      <pointLight color="#ffd896" intensity={1.55} distance={9.5} position={[0, 2.25, 0]} />
      {/* Carved Benches + Ceramic Courtyard Urn */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 + 0.35;
        return (
          <mesh
            key={`bench_${i}`}
            position={[Math.cos(angle) * 1.65, 0.56, Math.sin(angle) * 1.65]}
            rotation-y={-angle + Math.PI / 2}
            material={oakTimberMat}
            castShadow
          >
            <boxGeometry args={[1.3, 0.22, 0.4]} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.62, 0]} material={clayMat} castShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.42, 12]} />
      </mesh>

      <ProximityZoneSign
        worldPosition={position}
        localOffset={[0, 5.1, 0]}
        title="Vườn tâm tình"
        subtitle="Đình làng Miền Quê"
        onClick={onLabelClick}
      />
    </group>
  );
};

// 3. Miền Núi — Nhà Sàn Tây Bắc Bên Suối Trúc (Góc Gặp Gỡ)
export const StrangerTeaGazebo: React.FC<{
  position: [number, number, number];
  onLabelClick?: () => void;
}> = ({ position, onLabelClick }) => {
  const mats = useCottageMaterials();
  const { stepStoneMat, darkTimberMat, oakTimberMat, bambooMat, warmGlassMat, cedarRoofMat, brassMat } = mats;

  return (
    <group
      position={position}
      rotation-y={-Math.PI * 0.25}
      onClick={(e) => {
        e.stopPropagation();
        onLabelClick?.();
      }}
    >
      {/* Mountain Stone Pad + Elevated Tây Bắc Stilt House Platform */}
      <mesh position={[0, 0.14, 0]} material={stepStoneMat} receiveShadow castShadow>
        <boxGeometry args={[4.6, 0.28, 4.6]} />
      </mesh>
      {/* Sturdy Highland Timber Stilts Raising Floor Deck */}
      {[
        [-1.8, -1.8],
        [0, -1.8],
        [1.8, -1.8],
        [-1.8, 0],
        [1.8, 0],
        [-1.8, 1.8],
        [0, 1.8],
        [1.8, 1.8],
      ].map(([sx, sz], idx) => (
        <mesh key={`stilt_${idx}`} position={[sx, 0.48, sz]} material={darkTimberMat} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 0.72, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 0.84, 0]} material={oakTimberMat} receiveShadow castShadow>
        <boxGeometry args={[4.3, 0.12, 4.3]} />
      </mesh>
      {/* Wooden Steps Leading Up to Stilt Veranda */}
      {[0, 1, 2].map((st) => (
        <mesh
          key={`ns_step_${st}`}
          position={[0, 0.28 + st * 0.2, 2.45 - st * 0.24]}
          material={oakTimberMat}
          castShadow
        >
          <boxGeometry args={[1.35, 0.1, 0.28]} />
        </mesh>
      ))}
      {/* 4 Main Timber Pillars + Bamboo Railing */}
      {[
        [-1.72, -1.72],
        [1.72, -1.72],
        [-1.72, 1.72],
        [1.72, 1.72],
      ].map(([px, pz], idx) => (
        <mesh key={`tp_${idx}`} position={[px, 2.05, pz]} material={darkTimberMat} castShadow>
          <cylinderGeometry args={[0.095, 0.11, 2.45, 8]} />
        </mesh>
      ))}
      <mesh position={[-1.72, 1.25, 0]} material={bambooMat} castShadow>
        <boxGeometry args={[0.08, 0.55, 3.3]} />
      </mesh>
      <mesh position={[1.72, 1.25, 0]} material={bambooMat} castShadow>
        <boxGeometry args={[0.08, 0.55, 3.3]} />
      </mesh>
      {/* Woven Bamboo Lattice Back Screen */}
      <mesh position={[0, 1.92, -1.7]} material={bambooMat} castShadow>
        <boxGeometry args={[3.35, 2.05, 0.08]} />
      </mesh>
      {/* Two-Tier Tây Bắc Thatch-Cedar Stilt House Roof + Crossed Khau Cút Gable Horns */}
      <mesh position={[0, 3.35, 0]} rotation-y={Math.PI / 4} material={cedarRoofMat} castShadow>
        <coneGeometry args={[3.7, 0.98, 4]} />
      </mesh>
      <mesh position={[0, 3.96, 0]} rotation-y={Math.PI / 4} material={cedarRoofMat} castShadow>
        <coneGeometry args={[2.3, 0.92, 4]} />
      </mesh>
      <mesh position={[-0.25, 4.46, 0]} rotation-z={0.55} material={brassMat}>
        <boxGeometry args={[0.08, 0.55, 0.08]} />
      </mesh>
      <mesh position={[0.25, 4.46, 0]} rotation-z={-0.55} material={brassMat}>
        <boxGeometry args={[0.08, 0.55, 0.08]} />
      </mesh>
      {/* Low Cedar Tea Table, Brass Kettle & Floor Cushions */}
      <mesh position={[0, 1.22, 0.1]} material={oakTimberMat} castShadow receiveShadow>
        <boxGeometry args={[1.35, 0.08, 0.92]} />
      </mesh>
      <mesh position={[0, 1.38, 0.1]} material={warmGlassMat}>
        <sphereGeometry args={[0.14, 12, 10]} />
      </mesh>
      <pointLight color="#ffd896" intensity={1.4} distance={8.5} position={[0, 1.65, 0.1]} />
      <mesh position={[-0.95, 0.98, 0.1]} material={darkTimberMat} castShadow>
        <cylinderGeometry args={[0.32, 0.3, 0.14, 12]} />
      </mesh>
      <mesh position={[0.95, 0.98, 0.1]} material={darkTimberMat} castShadow>
        <cylinderGeometry args={[0.32, 0.3, 0.14, 12]} />
      </mesh>

      <ProximityZoneSign
        worldPosition={position}
        localOffset={[0, 5.1, 0]}
        title="Góc gặp gỡ"
        subtitle="Nhà sàn Miền Núi"
        onClick={onLabelClick}
      />
    </group>
  );
};

// 4. Miền Núi — Chùa Đá Trên Non Cao Tam Cốc (Phòng Tâm Linh)
export const SpiritualPavilion: React.FC<{
  position: [number, number, number];
  onLabelClick?: () => void;
}> = ({ position, onLabelClick }) => {
  const mats = useCottageMaterials();
  const { stepStoneMat, oakTimberMat, warmGlassMat, slateRoofMat, terracottaRoofMat, brassMat, vermilionMat } = mats;

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onLabelClick?.();
      }}
    >
      {/* Elevated Two-Tier Carved Limestone Terrace */}
      <mesh position={[0, 0.22, 0]} material={stepStoneMat} receiveShadow castShadow>
        <cylinderGeometry args={[3.55, 3.85, 0.44, 12]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={stepStoneMat} receiveShadow castShadow>
        <cylinderGeometry args={[2.85, 3.0, 0.24, 12]} />
      </mesh>
      {/* Flanking Carved Stone Toro Garden Lanterns at Entrance */}
      <StoneGardenLantern position={[-2.2, 0.1, 2.72]} />
      <StoneGardenLantern position={[2.2, 0.1, 2.72]} />

      {/* 6 Vermilion Lacquered Pagoda Pillars */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={`sp_p_${i}`}
            position={[Math.cos(angle) * 2.15, 1.82, Math.sin(angle) * 2.15]}
            material={vermilionMat}
            castShadow
          >
            <cylinderGeometry args={[0.1, 0.115, 2.55, 10]} />
          </mesh>
        );
      })}
      {/* Crimson Upper Frieze Ring */}
      <mesh position={[0, 2.84, 0]} material={vermilionMat} castShadow>
        <cylinderGeometry args={[2.28, 2.28, 0.26, 6]} />
      </mesh>
      {/* Triple-Tiered Mountain Pagoda Roof (Dark Slate + Terracotta Accent + Gilded Spire) */}
      <mesh position={[0, 3.16, 0]} material={slateRoofMat} castShadow>
        <coneGeometry args={[3.65, 0.94, 6]} />
      </mesh>
      <mesh position={[0, 3.94, 0]} material={terracottaRoofMat} castShadow>
        <coneGeometry args={[2.45, 0.96, 6]} />
      </mesh>
      <mesh position={[0, 4.62, 0]} material={slateRoofMat} castShadow>
        <coneGeometry args={[1.45, 0.78, 6]} />
      </mesh>
      <mesh position={[0, 5.15, 0]} material={brassMat} castShadow>
        <cylinderGeometry args={[0.045, 0.15, 0.52, 8]} />
      </mesh>
      {/* Hanging Lanterns at Upper Eaves */}
      <HoiAnHangingLantern position={[-2.25, 2.75, 1.3]} variant="red" mats={mats} />
      <HoiAnHangingLantern position={[2.25, 2.75, 1.3]} variant="amber" mats={mats} />
      {/* Reading Altar & Warm Illuminated Crystal Lantern */}
      <mesh position={[0, 1.0, 0]} material={oakTimberMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.82, 0.75, 0.1, 16]} />
      </mesh>
      <mesh position={[0, 0.78, 0]} material={oakTimberMat} castShadow>
        <cylinderGeometry args={[0.15, 0.22, 0.44, 10]} />
      </mesh>
      <mesh position={[0, 1.22, 0]} material={warmGlassMat}>
        <octahedronGeometry args={[0.21, 1]} />
      </mesh>
      <pointLight color="#fde68a" intensity={1.85} distance={10} position={[0, 1.45, 0]} />

      <ProximityZoneSign
        worldPosition={position}
        localOffset={[0, 5.65, 0]}
        title="Phòng tâm linh"
        subtitle="Chùa đá Miền Núi"
        onClick={onLabelClick}
      />
    </group>
  );
};
