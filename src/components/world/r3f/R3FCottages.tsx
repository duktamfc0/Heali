import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  getStoneFoundationTexture,
  getWoodPlankTexture,
  getLimeStuccoTexture,
  getSlateShingleTexture,
} from '../ProceduralTextures';
import { ProximityZoneSign } from './R3FNature';

// Shared Realistic Architectural PBR Materials Hook
export function useCottageMaterials() {
  return useMemo(() => {
    const stoneTex = getStoneFoundationTexture();
    const woodTex = getWoodPlankTexture();
    const stuccoTex = getLimeStuccoTexture();
    const cedarRoofTex = getSlateShingleTexture('moss_cedar');
    const terracottaRoofTex = getSlateShingleTexture('terracotta');
    const slateRoofTex = getSlateShingleTexture('slate');

    return {
      stoneMat: new THREE.MeshStandardMaterial({
        map: stoneTex,
        roughness: 0.9,
        metalness: 0.04,
      }),
      stepStoneMat: new THREE.MeshStandardMaterial({
        map: stoneTex,
        color: 0xdbe0d8,
        roughness: 0.86,
        metalness: 0.03,
      }),
      stuccoMat: new THREE.MeshStandardMaterial({
        map: stuccoTex,
        roughness: 0.92,
        metalness: 0.02,
      }),
      oakTimberMat: new THREE.MeshStandardMaterial({
        map: woodTex,
        color: 0x8b6749,
        roughness: 0.8,
        metalness: 0.05,
      }),
      darkTimberMat: new THREE.MeshStandardMaterial({
        map: woodTex,
        color: 0x563d2d,
        roughness: 0.82,
        metalness: 0.05,
      }),
      doorMat: new THREE.MeshStandardMaterial({
        map: woodTex,
        color: 0x9c553b,
        roughness: 0.72,
        metalness: 0.06,
      }),
      woodMat: new THREE.MeshStandardMaterial({
        map: woodTex,
        roughness: 0.82,
        metalness: 0.04,
      }),
      cedarRoofMat: new THREE.MeshStandardMaterial({
        map: cedarRoofTex,
        roughness: 0.82,
        metalness: 0.04,
      }),
      terracottaRoofMat: new THREE.MeshStandardMaterial({
        map: terracottaRoofTex,
        roughness: 0.78,
        metalness: 0.04,
      }),
      slateRoofMat: new THREE.MeshStandardMaterial({
        map: slateRoofTex,
        roughness: 0.76,
        metalness: 0.08,
      }),
      glassPaneMat: new THREE.MeshPhysicalMaterial({
        color: 0xdceae6,
        transparent: true,
        opacity: 0.42,
        roughness: 0.14,
        metalness: 0.08,
        clearcoat: 1.0,
      }),
      chimneyMat: new THREE.MeshStandardMaterial({
        map: stoneTex,
        color: 0x6f7572,
        roughness: 0.92,
        metalness: 0.06,
      }),
      warmGlassMat: new THREE.MeshStandardMaterial({
        color: 0xfff3d1,
        emissive: 0xf5b95b,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      }),
      brassMat: new THREE.MeshStandardMaterial({
        color: 0xd69a42,
        metalness: 0.78,
        roughness: 0.25,
      }),
      foliageBoxMat: new THREE.MeshStandardMaterial({
        color: 0x457441,
        roughness: 0.86,
      }),
      bloomCoralMat: new THREE.MeshStandardMaterial({
        color: 0xe6846d,
        roughness: 0.65,
      }),
      bloomCreamMat: new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        roughness: 0.65,
      }),
    };
  }, []);
}

// Gentle Animated Chimney Smoke Wisps
const ChimneySmokePuffs: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const puffsRef = useRef<Array<THREE.Mesh | null>>([]);
  const puffMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xf5f4ef,
        transparent: true,
        opacity: 0.36,
        roughness: 1,
        depthWrite: false,
      }),
    []
  );

  useFrame((state) => {
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

// Outdoor Plush Garden Armchair & Round Wooden Tea Table
export const CozyGardenArmchair: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0.45 }) => {
  const chairMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xdfb14c, roughness: 0.84, metalness: 0.02 }),
    []
  );
  const cushionDarkMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xc99636, roughness: 0.88 }),
    []
  );
  const pillowMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x89b3c4, roughness: 0.88 }),
    []
  );
  const legMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x6b472f, roughness: 0.8 }),
    []
  );
  const mugMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xfaf7ef, roughness: 0.4 }),
    []
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
  const potMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xb95f3c, roughness: 0.8 }),
    []
  );
  const cactusMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x4b8744, roughness: 0.78 }),
    []
  );
  const soilMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x4b3626, roughness: 0.95 }),
    []
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
          <meshStandardMaterial color="#fff7d6" emissive="#fbbf24" emissiveIntensity={0.7} roughness={0.25} />
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
 * 1. Detailed Realistic Half-Timbered Country Cottage (Journal & Letter Post)
 * OR Glass-and-Timber Lakeshore Conservatory (Rain Room).
 */
export const StorybookCottage: React.FC<CottageProps> = ({
  position,
  rotationY = 0,
  type = 'journal',
  labelTitle,
  labelSubtitle,
  onLabelClick,
}) => {
  const {
    stoneMat,
    stepStoneMat,
    stuccoMat,
    oakTimberMat,
    darkTimberMat,
    doorMat,
    cedarRoofMat,
    terracottaRoofMat,
    slateRoofMat,
    glassPaneMat,
    chimneyMat,
    warmGlassMat,
    brassMat,
    foliageBoxMat,
    bloomCoralMat,
    bloomCreamMat,
  } = useCottageMaterials();

  // Dedicated Glass-Walled Botanical Conservatory Architecture for Căn Phòng Mưa
  if (type === 'rain_cabin') {
    const w = 4.5;
    const d = 3.8;
    const h = 2.6;
    return (
      <group
        position={position}
        rotation-y={rotationY}
        onClick={(e) => {
          e.stopPropagation();
          onLabelClick?.();
        }}
      >
        {/* Raised Timber & River-Stone Veranda Deck */}
        <mesh position={[0, 0.22, 0.28]} material={stoneMat} castShadow receiveShadow>
          <boxGeometry args={[w + 1.1, 0.44, d + 1.5]} />
        </mesh>
        <mesh position={[0, 0.46, 0.28]} material={oakTimberMat} receiveShadow>
          <boxGeometry args={[w + 0.96, 0.08, d + 1.36]} />
        </mesh>
        {/* Front Deck Steps */}
        {[0, 1, 2].map((s) => (
          <mesh
            key={`rs_${s}`}
            position={[0, 0.08 + s * 0.12, d / 2 + 1.18 - s * 0.24]}
            material={stepStoneMat}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[1.6, 0.12, 0.28]} />
          </mesh>
        ))}
        {/* Interior Warm Oak Back Wall & Glowing Piano Hearth Backdrop */}
        <mesh position={[0, 0.5 + h / 2, -d / 2 + 0.08]} material={oakTimberMat} castShadow receiveShadow>
          <boxGeometry args={[w - 0.1, h, 0.16]} />
        </mesh>
        {/* Warm Interior Glow Box */}
        <mesh position={[0, 1.35, 0]} material={warmGlassMat}>
          <boxGeometry args={[w - 0.9, 1.4, d - 0.9]} />
        </mesh>
        {/* Greenhouse Translucent Glass Walls */}
        <mesh position={[0, 0.5 + h / 2, 0]} material={glassPaneMat}>
          <boxGeometry args={[w - 0.12, h - 0.1, d - 0.12]} />
        </mesh>
        {/* Dark Cedar Conservatory Frame Posts & Mullions */}
        {[-w / 2, -w / 6, w / 6, w / 2].map((px, i) => (
          <React.Fragment key={`gp_${i}`}>
            <mesh position={[px, 0.5 + h / 2, d / 2]} material={darkTimberMat} castShadow>
              <boxGeometry args={[0.14, h, 0.14]} />
            </mesh>
            <mesh position={[px, 0.5 + h / 2, -d / 2]} material={darkTimberMat} castShadow>
              <boxGeometry args={[0.14, h, 0.14]} />
            </mesh>
          </React.Fragment>
        ))}
        {[-d / 6, d / 6].map((pz, i) => (
          <React.Fragment key={`gps_${i}`}>
            <mesh position={[-w / 2, 0.5 + h / 2, pz]} material={darkTimberMat} castShadow>
              <boxGeometry args={[0.14, h, 0.14]} />
            </mesh>
            <mesh position={[w / 2, 0.5 + h / 2, pz]} material={darkTimberMat} castShadow>
              <boxGeometry args={[0.14, h, 0.14]} />
            </mesh>
          </React.Fragment>
        ))}
        {/* Pitched Slate & Skylight Conservatory Roof */}
        <mesh position={[-1.3, 0.5 + h + 0.65, 0]} rotation-z={0.56} material={slateRoofMat} castShadow receiveShadow>
          <boxGeometry args={[3.15, 0.14, d + 0.9]} />
        </mesh>
        <mesh position={[1.3, 0.5 + h + 0.65, 0]} rotation-z={-0.56} material={slateRoofMat} castShadow receiveShadow>
          <boxGeometry args={[3.15, 0.14, d + 0.9]} />
        </mesh>
        {/* Center Glass Skylight Ridge */}
        <mesh position={[0, 0.5 + h + 1.42, 0]} material={darkTimberMat} castShadow>
          <boxGeometry args={[0.26, 0.18, d + 0.95]} />
        </mesh>
        {/* Veranda Lantern & Stone Chimney */}
        <mesh position={[-w * 0.36, 0.5 + h + 0.9, -d * 0.25]} material={chimneyMat} castShadow>
          <boxGeometry args={[0.58, 2.2, 0.58]} />
        </mesh>
        <ChimneySmokePuffs position={[-w * 0.36, 0.5 + h + 2.05, -d * 0.25]} />
        <pointLight color="#ffd896" intensity={1.8} distance={9} position={[0, 1.8, 0.4]} />

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

  // Country Half-Timbered Cottage (Journal Meadow Cottage & Letter Post Office)
  const activeRoofMat = type === 'letters' ? terracottaRoofMat : cedarRoofMat;
  const width = type === 'letters' ? 4.3 : 4.2;
  const depth = 3.5;
  const height = 2.6;
  const roofPeakHeight = 1.95;
  const roofOverhang = 0.55;

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
      {/* 1. Stacked Stone Plinth Foundation + Front Veranda Deck */}
      <mesh position={[0, 0.28, 0]} material={stoneMat} castShadow receiveShadow>
        <boxGeometry args={[width + 0.34, 0.56, depth + 0.34]} />
      </mesh>
      <mesh position={[0, 0.28, depth / 2 + 0.55]} material={stoneMat} castShadow receiveShadow>
        <boxGeometry args={[width * 0.72, 0.56, 1.1]} />
      </mesh>

      {/* 2. Four Carved Stone Steps Leading Up to Veranda */}
      {[0, 1, 2, 3].map((step) => (
        <mesh
          key={`step_${step}`}
          position={[0, 0.08 + step * 0.12, depth / 2 + 1.5 - step * 0.22]}
          material={stepStoneMat}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1.45, 0.12, 0.28]} />
        </mesh>
      ))}

      {/* 3. Textured Lime Stucco Main Walls */}
      <mesh position={[0, 0.56 + height / 2, 0]} material={stuccoMat} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
      </mesh>

      {/* 4. Aged Dark Oak Timber Framing (Corner Posts, Waist Beams, Truss Studs) */}
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

      <mesh position={[0, 0.56 + height * 0.55, depth / 2 + 0.03]} material={oakTimberMat}>
        <boxGeometry args={[width + 0.16, 0.15, 0.1]} />
      </mesh>
      <mesh position={[0, 0.56 + height * 0.55, -depth / 2 - 0.03]} material={oakTimberMat}>
        <boxGeometry args={[width + 0.16, 0.15, 0.1]} />
      </mesh>
      <mesh position={[-width / 2 - 0.03, 0.56 + height * 0.55, 0]} material={oakTimberMat}>
        <boxGeometry args={[0.1, 0.15, depth + 0.16]} />
      </mesh>
      <mesh position={[width / 2 + 0.03, 0.56 + height * 0.55, 0]} material={oakTimberMat}>
        <boxGeometry args={[0.1, 0.15, depth + 0.16]} />
      </mesh>

      {/* Upper Gable & Eave Collar Beams */}
      <mesh position={[0, 0.56 + height, depth / 2 + 0.03]} material={darkTimberMat}>
        <boxGeometry args={[width + 0.2, 0.16, 0.12]} />
      </mesh>
      <mesh position={[0, 0.56 + height, -depth / 2 - 0.03]} material={darkTimberMat}>
        <boxGeometry args={[width + 0.2, 0.16, 0.12]} />
      </mesh>
      <mesh position={[-width * 0.27, 0.56 + height * 0.78, depth / 2 + 0.04]} rotation-z={0.52} material={oakTimberMat}>
        <boxGeometry args={[0.12, 1.18, 0.08]} />
      </mesh>
      <mesh position={[width * 0.27, 0.56 + height * 0.78, depth / 2 + 0.04]} rotation-z={-0.52} material={oakTimberMat}>
        <boxGeometry args={[0.12, 1.18, 0.08]} />
      </mesh>

      {/* 5. Front & Back Gable Stucco Walls */}
      <mesh position={[0, 0.56 + height, depth / 2 - 0.01]} material={stuccoMat} castShadow>
        <shapeGeometry args={[frontGableShape]} />
      </mesh>
      <mesh position={[0, 0.56 + height, -depth / 2 + 0.01]} rotation-y={Math.PI} material={stuccoMat} castShadow>
        <shapeGeometry args={[frontGableShape]} />
      </mesh>
      <mesh position={[0, 0.56 + height + roofPeakHeight * 0.45, depth / 2 + 0.03]} material={oakTimberMat}>
        <boxGeometry args={[0.13, roofPeakHeight * 0.88, 0.08]} />
      </mesh>

      {/* 6. Textured Shingled Pitched Roof Slopes + Exposed Eave Rafter Tails */}
      <mesh
        position={[-(width / 2 + roofOverhang) / 2, 0.56 + height + roofPeakHeight / 2 - 0.05, 0]}
        rotation-z={frontSlopeAngle}
        material={activeRoofMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[frontSlopeLen + 0.2, 0.18, depth + roofOverhang * 2]} />
      </mesh>
      <mesh
        position={[(width / 2 + roofOverhang) / 2, 0.56 + height + roofPeakHeight / 2 - 0.05, 0]}
        rotation-z={-frontSlopeAngle}
        material={activeRoofMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[frontSlopeLen + 0.2, 0.18, depth + roofOverhang * 2]} />
      </mesh>

      {/* Exposed Oak Rafter Tails Along Both Side Eaves */}
      {[-1.5, -0.75, 0, 0.75, 1.5].map((rz, rIdx) => (
        <React.Fragment key={`raf_${rIdx}`}>
          <mesh position={[-width / 2 - 0.26, 0.56 + height - 0.08, rz]} rotation-z={frontSlopeAngle} material={darkTimberMat}>
            <boxGeometry args={[0.48, 0.1, 0.1]} />
          </mesh>
          <mesh position={[width / 2 + 0.26, 0.56 + height - 0.08, rz]} rotation-z={-frontSlopeAngle} material={darkTimberMat}>
            <boxGeometry args={[0.48, 0.1, 0.1]} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Bargeboards & Ridge Beam */}
      <mesh
        position={[-(width / 2 + roofOverhang) / 2, 0.56 + height + roofPeakHeight / 2 - 0.05, depth / 2 + roofOverhang + 0.02]}
        rotation-z={frontSlopeAngle}
        material={darkTimberMat}
        castShadow
      >
        <boxGeometry args={[frontSlopeLen + 0.25, 0.22, 0.14]} />
      </mesh>
      <mesh
        position={[(width / 2 + roofOverhang) / 2, 0.56 + height + roofPeakHeight / 2 - 0.05, depth / 2 + roofOverhang + 0.02]}
        rotation-z={-frontSlopeAngle}
        material={darkTimberMat}
        castShadow
      >
        <boxGeometry args={[frontSlopeLen + 0.25, 0.22, 0.14]} />
      </mesh>
      <mesh position={[0, 0.56 + height + roofPeakHeight + 0.04, 0]} material={darkTimberMat} castShadow>
        <boxGeometry args={[0.26, 0.22, depth + roofOverhang * 2 + 0.14]} />
      </mesh>

      {/* 7. Attic Roof Dormer */}
      <group position={[0, 0.56 + height + roofPeakHeight * 0.42, depth * 0.24]}>
        <mesh position={[0, 0, 0.36]} material={stuccoMat} castShadow>
          <boxGeometry args={[0.92, 0.78, 0.78]} />
        </mesh>
        <mesh position={[-0.27, 0.49, 0.38]} rotation-z={0.58} material={activeRoofMat} castShadow>
          <boxGeometry args={[0.74, 0.11, 0.94]} />
        </mesh>
        <mesh position={[0.27, 0.49, 0.38]} rotation-z={-0.58} material={activeRoofMat} castShadow>
          <boxGeometry args={[0.74, 0.11, 0.94]} />
        </mesh>
        <mesh position={[0, 0.06, 0.76]} material={warmGlassMat}>
          <planeGeometry args={[0.48, 0.46]} />
        </mesh>
        <mesh position={[0, 0.06, 0.77]} material={darkTimberMat}>
          <boxGeometry args={[0.5, 0.04, 0.02]} />
        </mesh>
        <mesh position={[0, 0.06, 0.77]} material={darkTimberMat}>
          <boxGeometry args={[0.04, 0.48, 0.02]} />
        </mesh>
      </group>

      {/* 8. Stacked Stone Chimney + Rising Hearth Smoke */}
      <group position={[width * 0.34, 0.56 + height + roofPeakHeight * 0.52, -depth * 0.26]}>
        <mesh position={[0, 0.9, 0]} material={chimneyMat} castShadow>
          <boxGeometry args={[0.64, 1.85, 0.64]} />
        </mesh>
        <mesh position={[0, 1.86, 0]} material={darkTimberMat} castShadow>
          <boxGeometry args={[0.78, 0.14, 0.78]} />
        </mesh>
        <ChimneySmokePuffs position={[0, 2.0, 0]} />
      </group>

      {/* 9. Covered Veranda Awning, Carved Posts, Panelled Door & Warm Lantern */}
      <group position={[0, 0.56, depth / 2]}>
        {/* Veranda Timber Posts */}
        {[-1.18, 1.18].map((px, i) => (
          <mesh key={`vp_${i}`} position={[px, 0.85, 0.92]} material={darkTimberMat} castShadow>
            <cylinderGeometry args={[0.075, 0.09, 1.7, 8]} />
          </mesh>
        ))}
        {/* Veranda Roof Awning */}
        <mesh position={[0, 1.76, 0.52]} rotation-x={0.3} material={activeRoofMat} castShadow>
          <boxGeometry args={[2.8, 0.11, 1.25]} />
        </mesh>
        {/* Front Door Frame & Wood Door */}
        <mesh position={[0, 1.56, 0.04]} material={darkTimberMat}>
          <boxGeometry args={[1.08, 1.62, 0.1]} />
        </mesh>
        <mesh position={[0, 0.78, 0.07]} material={doorMat}>
          <boxGeometry args={[0.86, 1.5, 0.08]} />
        </mesh>
        <mesh position={[0, 1.15, 0.12]} material={warmGlassMat}>
          <planeGeometry args={[0.34, 0.34]} />
        </mesh>
        <mesh position={[0.28, 0.74, 0.13]} material={brassMat}>
          <sphereGeometry args={[0.05, 8, 8]} />
        </mesh>
        {/* Hanging Brass Porch Lantern */}
        <group position={[0.72, 1.35, 0.25]}>
          <mesh position={[0, 0.09, 0]} material={darkTimberMat}>
            <coneGeometry args={[0.11, 0.1, 6]} />
          </mesh>
          <mesh material={warmGlassMat}>
            <cylinderGeometry args={[0.07, 0.055, 0.16, 6]} />
          </mesh>
          <pointLight color="#ffd896" intensity={1.35} distance={7.5} />
        </group>
      </group>

      {/* 10. Recessed Side Windows with Wooden Shutters & Flower Planters */}
      {[
        { pos: [-width / 2 - 0.02, 0.56 + height * 0.36, 0.2] as [number, number, number], rotY: -Math.PI / 2 },
        { pos: [width / 2 + 0.02, 0.56 + height * 0.36, 0.2] as [number, number, number], rotY: Math.PI / 2 },
      ].map((win, wIdx) => (
        <group key={`side_win_${wIdx}`} position={win.pos} rotation-y={win.rotY}>
          <mesh material={darkTimberMat} castShadow>
            <boxGeometry args={[1.02, 1.02, 0.1]} />
          </mesh>
          {/* Wooden Shutters */}
          <mesh position={[-0.66, 0, 0.03]} material={oakTimberMat} castShadow>
            <boxGeometry args={[0.28, 0.96, 0.05]} />
          </mesh>
          <mesh position={[0.66, 0, 0.03]} material={oakTimberMat} castShadow>
            <boxGeometry args={[0.28, 0.96, 0.05]} />
          </mesh>
          <mesh position={[0, 0, 0.06]} material={warmGlassMat}>
            <planeGeometry args={[0.82, 0.82]} />
          </mesh>
          <mesh position={[0, 0, 0.07]} material={darkTimberMat}>
            <boxGeometry args={[0.84, 0.05, 0.02]} />
          </mesh>
          <mesh position={[0, 0, 0.07]} material={darkTimberMat}>
            <boxGeometry args={[0.05, 0.84, 0.02]} />
          </mesh>
          <group position={[0, -0.56, 0.16]}>
            <mesh material={darkTimberMat} castShadow>
              <boxGeometry args={[1.04, 0.18, 0.24]} />
            </mesh>
            <mesh position={[0, 0.11, 0]} material={foliageBoxMat}>
              <boxGeometry args={[0.92, 0.12, 0.18]} />
            </mesh>
            {[-0.32, -0.1, 0.12, 0.32].map((fx, fIdx) => (
              <mesh
                key={`wb_${fIdx}`}
                position={[fx, 0.19, fIdx % 2 === 0 ? 0.03 : -0.02]}
                material={fIdx % 2 === 0 ? bloomCoralMat : bloomCreamMat}
              >
                <sphereGeometry args={[0.06, 8, 6]} />
              </mesh>
            ))}
          </group>
        </group>
      ))}

      {/* Vintage Postbox beside Letter House */}
      {type === 'letters' && (
        <group position={[-1.45, 0, depth / 2 + 1.15]}>
          <mesh position={[0, 0.45, 0]} material={darkTimberMat} castShadow>
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

      {labelTitle && (
        <ProximityZoneSign
          worldPosition={position}
          localOffset={[0, 0.56 + height + roofPeakHeight + 1.1, 0]}
          title={labelTitle}
          subtitle={labelSubtitle}
          onClick={onLabelClick}
        />
      )}
    </group>
  );
};

// 2. Khu Vườn Tâm Tình (Octagonal Sunlit Garden Rotunda in Lavender Meadow)
export const ConfessionGardenPavilion: React.FC<{
  position: [number, number, number];
  onLabelClick?: () => void;
}> = ({ position, onLabelClick }) => {
  const { stepStoneMat, darkTimberMat, oakTimberMat, cedarRoofMat, warmGlassMat } = useCottageMaterials();

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onLabelClick?.();
      }}
    >
      {/* Two-Tiered Circular Stone Plinth */}
      <mesh position={[0, 0.14, 0]} material={stepStoneMat} receiveShadow castShadow>
        <cylinderGeometry args={[3.45, 3.65, 0.28, 24]} />
      </mesh>
      <mesh position={[0, 0.34, 0]} material={stepStoneMat} receiveShadow castShadow>
        <cylinderGeometry args={[3.05, 3.2, 0.2, 24]} />
      </mesh>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={`pillar_${i}`}
            position={[Math.cos(angle) * 2.55, 1.65, Math.sin(angle) * 2.55]}
            material={darkTimberMat}
            castShadow
          >
            <cylinderGeometry args={[0.09, 0.105, 2.5, 8]} />
          </mesh>
        );
      })}
      {/* Octagonal Cedar Shingle Canopy + Lower Eave Skirt */}
      <mesh position={[0, 3.15, 0]} material={cedarRoofMat} castShadow>
        <coneGeometry args={[3.65, 1.35, 8]} />
      </mesh>
      <mesh position={[0, 3.88, 0]} material={oakTimberMat} castShadow>
        <sphereGeometry args={[0.18, 10, 8]} />
      </mesh>
      {/* Hanging Warm Lantern */}
      <mesh position={[0, 2.25, 0]} material={warmGlassMat}>
        <sphereGeometry args={[0.24, 12, 10]} />
      </mesh>
      <pointLight color="#ffd896" intensity={1.4} distance={9} position={[0, 2.25, 0]} />
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 + 0.35;
        return (
          <mesh
            key={`bench_${i}`}
            position={[Math.cos(angle) * 1.75, 0.56, Math.sin(angle) * 1.75]}
            rotation-y={-angle + Math.PI / 2}
            material={oakTimberMat}
            castShadow
          >
            <boxGeometry args={[1.35, 0.22, 0.4]} />
          </mesh>
        );
      })}

      <ProximityZoneSign
        worldPosition={position}
        localOffset={[0, 4.7, 0]}
        title="Vườn tâm tình"
        subtitle="Sẻ chia ẩn danh"
        onClick={onLabelClick}
      />
    </group>
  );
};

// 3. Riverside Tea House for Stranger Chat (Trà Thất Bên Suối Trúc)
export const StrangerTeaGazebo: React.FC<{
  position: [number, number, number];
  onLabelClick?: () => void;
}> = ({ position, onLabelClick }) => {
  const { stepStoneMat, darkTimberMat, oakTimberMat, warmGlassMat, slateRoofMat, stuccoMat } = useCottageMaterials();

  return (
    <group
      position={position}
      rotation-y={-Math.PI * 0.25}
      onClick={(e) => {
        e.stopPropagation();
        onLabelClick?.();
      }}
    >
      {/* Raised Timber Tea Engawa Platform over Stone Plinth */}
      <mesh position={[0, 0.16, 0]} material={stepStoneMat} receiveShadow castShadow>
        <boxGeometry args={[4.4, 0.32, 4.4]} />
      </mesh>
      <mesh position={[0, 0.36, 0]} material={oakTimberMat} receiveShadow castShadow>
        <boxGeometry args={[4.1, 0.1, 4.1]} />
      </mesh>
      {/* 4 Timber Pillars */}
      {[
        [-1.65, -1.65],
        [1.65, -1.65],
        [-1.65, 1.65],
        [1.65, 1.65],
      ].map(([px, pz], idx) => (
        <mesh key={`tp_${idx}`} position={[px, 1.55, pz]} material={darkTimberMat} castShadow>
          <cylinderGeometry args={[0.09, 0.105, 2.4, 8]} />
        </mesh>
      ))}
      {/* Back Shoji Screen Accent Wall */}
      <mesh position={[0, 1.45, -1.62]} material={stuccoMat} castShadow>
        <boxGeometry args={[3.15, 2.05, 0.08]} />
      </mesh>
      {/* Two-Tier Flared Tea-House Roof */}
      <mesh position={[0, 2.85, 0]} rotation-y={Math.PI / 4} material={slateRoofMat} castShadow>
        <coneGeometry args={[3.45, 0.9, 4]} />
      </mesh>
      <mesh position={[0, 3.42, 0]} rotation-y={Math.PI / 4} material={slateRoofMat} castShadow>
        <coneGeometry args={[2.15, 0.85, 4]} />
      </mesh>
      {/* Low Cedar Tea Table, Kettle & Facing Floor Cushions */}
      <mesh position={[0, 0.72, 0.1]} material={oakTimberMat} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.08, 0.9]} />
      </mesh>
      <mesh position={[0, 0.88, 0.1]} material={warmGlassMat}>
        <sphereGeometry args={[0.14, 12, 10]} />
      </mesh>
      <pointLight color="#ffd896" intensity={1.3} distance={8} position={[0, 1.1, 0.1]} />
      <mesh position={[-0.95, 0.48, 0.1]} material={darkTimberMat} castShadow>
        <cylinderGeometry args={[0.32, 0.3, 0.14, 12]} />
      </mesh>
      <mesh position={[0.95, 0.48, 0.1]} material={darkTimberMat} castShadow>
        <cylinderGeometry args={[0.32, 0.3, 0.14, 12]} />
      </mesh>

      <ProximityZoneSign
        worldPosition={position}
        localOffset={[0, 4.45, 0]}
        title="Góc gặp gỡ"
        subtitle="Trà thất bên suối"
        onClick={onLabelClick}
      />
    </group>
  );
};

// 4. Mountain Foothill Two-Tiered Crimson Mountain Pagoda (Đình Thiền Đỏ Trên Núi)
export const SpiritualPavilion: React.FC<{
  position: [number, number, number];
  onLabelClick?: () => void;
}> = ({ position, onLabelClick }) => {
  const { stepStoneMat, oakTimberMat, warmGlassMat, slateRoofMat, brassMat } = useCottageMaterials();
  const vermilionMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xa12824, roughness: 0.52, metalness: 0.08 }),
    []
  );

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onLabelClick?.();
      }}
    >
      {/* Elevated Two-Tier Carved Stone Terrace */}
      <mesh position={[0, 0.2, 0]} material={stepStoneMat} receiveShadow castShadow>
        <cylinderGeometry args={[3.4, 3.7, 0.4, 12]} />
      </mesh>
      <mesh position={[0, 0.46, 0]} material={stepStoneMat} receiveShadow castShadow>
        <cylinderGeometry args={[2.75, 2.9, 0.22, 12]} />
      </mesh>
      {/* Flanking Carved Stone Toro Garden Lanterns at Entrance */}
      <StoneGardenLantern position={[-2.15, 0.1, 2.65]} />
      <StoneGardenLantern position={[2.15, 0.1, 2.65]} />

      {/* 6 Vermilion Lacquered Pagoda Pillars */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={`sp_p_${i}`}
            position={[Math.cos(angle) * 2.1, 1.75, Math.sin(angle) * 2.1]}
            material={vermilionMat}
            castShadow
          >
            <cylinderGeometry args={[0.095, 0.11, 2.5, 10]} />
          </mesh>
        );
      })}
      {/* Crimson Upper Frieze Ring */}
      <mesh position={[0, 2.75, 0]} material={vermilionMat} castShadow>
        <cylinderGeometry args={[2.22, 2.22, 0.24, 6]} />
      </mesh>
      {/* Double-Tiered Pagoda Dark Slate Roof with Flared Trim & Brass Spire */}
      <mesh position={[0, 3.08, 0]} material={slateRoofMat} castShadow>
        <coneGeometry args={[3.45, 0.92, 6]} />
      </mesh>
      <mesh position={[0, 3.88, 0]} material={slateRoofMat} castShadow>
        <coneGeometry args={[2.25, 1.05, 6]} />
      </mesh>
      <mesh position={[0, 4.52, 0]} material={brassMat} castShadow>
        <cylinderGeometry args={[0.04, 0.13, 0.45, 8]} />
      </mesh>
      {/* Reading Altar & Warm Illuminated Crystal Lantern */}
      <mesh position={[0, 0.94, 0]} material={oakTimberMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.78, 0.72, 0.1, 16]} />
      </mesh>
      <mesh position={[0, 0.72, 0]} material={oakTimberMat} castShadow>
        <cylinderGeometry args={[0.14, 0.2, 0.44, 10]} />
      </mesh>
      <mesh position={[0, 1.15, 0]} material={warmGlassMat}>
        <octahedronGeometry args={[0.19, 1]} />
      </mesh>
      <pointLight color="#fde68a" intensity={1.7} distance={9.5} position={[0, 1.35, 0]} />

      <ProximityZoneSign
        worldPosition={position}
        localOffset={[0, 5.2, 0]}
        title="Phòng tâm linh"
        subtitle="Tarot · Tử vi · Cố vấn"
        onClick={onLabelClick}
      />
    </group>
  );
};
