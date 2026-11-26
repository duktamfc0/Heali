import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { WorldZone } from '../WorldEnvironment';
import {
  VALLEY_PLAYABLE_RADIUS,
  LAKE_CENTER,
  WORLD_OBSTACLES,
  distanceToStream,
  lakeNormDist,
  isOnBridgeOrPier,
  walkableSurfaceHeightAt,
  streamCenterX,
} from './worldLayout';
import { liveAvatarWorldPos } from './R3FNature';
import { liveSceneActivity } from './roomTypes';

export interface R3FAvatarProps {
  robeColor?: number;
  cameraMode?: 'follow' | 'isometric' | 'cinematic';
  cameraZoom?: number;
  cameraYawRef?: React.MutableRefObject<number>;
  cameraPitchRef?: React.MutableRefObject<number>;
  keyboardKeysRef: React.MutableRefObject<{ [key: string]: boolean }>;
  joystickVectorRef: React.MutableRefObject<{ dx: number; dy: number }>;
  clickTarget: THREE.Vector3 | null;
  teleportTarget?: { x: number; z: number; seq: number } | null;
  onClearClickTarget: () => void;
  zones: WorldZone[];
  onNearbyZoneChange: (zone: WorldZone | null) => void;
  avatarPosRef?: React.MutableRefObject<THREE.Vector3>;
}

const _moveDir = new THREE.Vector3();
const _targetCameraPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();

export function resolveAvatarCollision(
  x: number,
  z: number,
  currentX: number,
  currentZ: number
): { x: number; z: number } {
  let newX = x;
  let newZ = z;

  // 1. Valley Foothill Rim Boundary
  const distFromCenter = Math.hypot(newX, newZ);
  if (distFromCenter > VALLEY_PLAYABLE_RADIUS) {
    const angle = Math.atan2(newZ, newX);
    newX = Math.cos(angle) * (VALLEY_PLAYABLE_RADIUS - 0.15);
    newZ = Math.sin(angle) * (VALLEY_PLAYABLE_RADIUS - 0.15);
  }

  const onBridgeOrPier = isOnBridgeOrPier(newX, newZ);

  // 2. Keep traveler out of deep lake basin unless standing on Pier
  if (!onBridgeOrPier && lakeNormDist(newX, newZ) < 1.01) {
    const dx = currentX - LAKE_CENTER.x;
    const dz = currentZ - LAKE_CENTER.z;
    const len = Math.hypot(dx, dz) || 1;
    // Gently resist stepping off the shore into deep water
    newX = currentX + (dx / len) * 0.04;
    newZ = currentZ + (dz / len) * 0.04;
  }

  // 3. Keep traveler on stream banks unless crossing via one of the two Arched Wooden Bridges
  if (!onBridgeOrPier && newZ > -50 && newZ < 30 && distanceToStream(newX, newZ) < 2.2) {
    const cx = streamCenterX(newZ);
    const sideSign = currentX >= cx ? 1 : -1;
    newX = cx + sideSign * 2.25;
  }

  // 3B. Keep traveler safely on golden sand beach when visiting Mien Bien coastal bay (unless on coastal wooden jetty)
  if (!onBridgeOrPier && newX > 25 && newZ > 48.2) {
    const shoreLimit = 48.0 + Math.sin(newX * 0.09) * 1.8;
    if (newZ > shoreLimit) {
      newZ = shoreLimit;
    }
  }

  // 4. Cottage / Pavilion / Boulder Collisions
  for (const obs of WORLD_OBSTACLES) {
    const dx = newX - obs.x;
    const dz = newZ - obs.z;
    const dist = Math.hypot(dx, dz);
    if (dist < obs.radius) {
      const angle = Math.atan2(dz, dx);
      newX = obs.x + Math.cos(angle) * obs.radius;
      newZ = obs.z + Math.sin(angle) * obs.radius;
    }
  }

  return { x: newX, z: newZ };
}

/**
 * Multi-part Donghua Xuanhuan / Cổ Trang Stylized Traveler Character
 */
export const StylizedTravelerCharacter: React.FC<{
  robeColor?: number;
  isMoving: boolean;
}> = React.memo(({ robeColor = 0x2d7a58, isMoving }) => {
  const bodyGroupRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const skirtRef = useRef<THREE.Mesh>(null);
  const ribbonLRef = useRef<THREE.Group>(null);
  const ribbonRRef = useRef<THREE.Group>(null);
  const backHairRef = useRef<THREE.Group>(null);

  const {
    skinMat,
    cheekMat,
    hairMat,
    tunicMat,
    innerRobeMat,
    sashMat,
    goldTrimMat,
    jadeMat,
    pantsMat,
    bootMat,
    eyeMat,
    eyeShineMat,
  } = useMemo(() => {
    const robeBase = new THREE.Color(robeColor);
    const sheenCol = robeBase.clone().lerp(new THREE.Color(0xffffff), 0.55);
    return {
      skinMat: new THREE.MeshStandardMaterial({ color: 0xf7d0b5, roughness: 0.68 }),
      cheekMat: new THREE.MeshStandardMaterial({ color: 0xef9e91, roughness: 0.82 }),
      hairMat: new THREE.MeshPhysicalMaterial({
        color: 0x241918,
        roughness: 0.42,
        sheen: 0.72,
        sheenColor: new THREE.Color(0x7c5a4f),
        sheenRoughness: 0.35,
      }),
      tunicMat: new THREE.MeshPhysicalMaterial({
        color: robeColor,
        roughness: 0.56,
        sheen: 0.92,
        sheenColor: sheenCol,
        sheenRoughness: 0.42,
        side: THREE.DoubleSide,
      }),
      innerRobeMat: new THREE.MeshPhysicalMaterial({
        color: 0xfaf3e4,
        roughness: 0.6,
        sheen: 0.78,
        sheenColor: new THREE.Color(0xffffff),
        sheenRoughness: 0.45,
        side: THREE.DoubleSide,
      }),
      sashMat: new THREE.MeshPhysicalMaterial({
        color: 0xc95b45,
        roughness: 0.48,
        sheen: 0.9,
        sheenColor: new THREE.Color(0xfcd5b5),
        sheenRoughness: 0.38,
        side: THREE.DoubleSide,
      }),
      goldTrimMat: new THREE.MeshStandardMaterial({
        color: 0xe6b655,
        metalness: 0.78,
        roughness: 0.24,
      }),
      jadeMat: new THREE.MeshStandardMaterial({
        color: 0x6ee7b7,
        emissive: 0x10b981,
        emissiveIntensity: 1.1,
        roughness: 0.18,
      }),
      pantsMat: new THREE.MeshStandardMaterial({ color: 0x352c26, roughness: 0.85 }),
      bootMat: new THREE.MeshStandardMaterial({ color: 0x241a15, roughness: 0.74 }),
      eyeMat: new THREE.MeshStandardMaterial({ color: 0x141e2e, roughness: 0.16 }),
      eyeShineMat: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    };
  }, [robeColor]);

  const { skirtGeo, sleeveGeo, backHairGeo, ribbonGeo } = useMemo(() => {
    // Bell-flared silk lower robe hem (open at bottom for flowing Donghua drape)
    const skirtPts = [
      new THREE.Vector2(0.155, 0.58),
      new THREE.Vector2(0.175, 0.46),
      new THREE.Vector2(0.23, 0.3),
      new THREE.Vector2(0.295, 0.14),
      new THREE.Vector2(0.34, 0.0),
    ];
    const sGeo = new THREE.LatheGeometry(skirtPts, 20);

    // Wide flared Cổ Trang sleeves
    const sleevePts = [
      new THREE.Vector2(0.055, 0.0),
      new THREE.Vector2(0.068, -0.12),
      new THREE.Vector2(0.105, -0.24),
      new THREE.Vector2(0.125, -0.31),
    ];
    const slGeo = new THREE.LatheGeometry(sleevePts, 14);

    // Tapered flowing back hair silhouette
    const hairShape = new THREE.Shape();
    hairShape.moveTo(-0.14, 0.0);
    hairShape.quadraticCurveTo(-0.18, -0.24, -0.09, -0.52);
    hairShape.lineTo(0.0, -0.62);
    hairShape.lineTo(0.09, -0.52);
    hairShape.quadraticCurveTo(0.18, -0.24, 0.14, 0.0);
    hairShape.closePath();
    const bhGeo = new THREE.ExtrudeGeometry(hairShape, {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    });

    // Long flowing silk waist ribbon
    const ribShape = new THREE.Shape();
    ribShape.moveTo(-0.045, 0.0);
    ribShape.quadraticCurveTo(-0.06, -0.32, -0.032, -0.62);
    ribShape.lineTo(0.0, -0.7);
    ribShape.lineTo(0.032, -0.62);
    ribShape.quadraticCurveTo(0.06, -0.32, 0.045, 0.0);
    ribShape.closePath();
    const rGeo = new THREE.ShapeGeometry(ribShape, 8);

    return { skirtGeo: sGeo, sleeveGeo: slGeo, backHairGeo: bhGeo, ribbonGeo: rGeo };
  }, []);

  useEffect(() => {
    return () => {
      skinMat.dispose();
      cheekMat.dispose();
      hairMat.dispose();
      tunicMat.dispose();
      innerRobeMat.dispose();
      sashMat.dispose();
      goldTrimMat.dispose();
      jadeMat.dispose();
      pantsMat.dispose();
      bootMat.dispose();
      eyeMat.dispose();
      eyeShineMat.dispose();
      skirtGeo.dispose();
      sleeveGeo.dispose();
      backHairGeo.dispose();
      ribbonGeo.dispose();
    };
  }, [
    skinMat,
    cheekMat,
    hairMat,
    tunicMat,
    innerRobeMat,
    sashMat,
    goldTrimMat,
    jadeMat,
    pantsMat,
    bootMat,
    eyeMat,
    eyeShineMat,
    skirtGeo,
    sleeveGeo,
    backHairGeo,
    ribbonGeo,
  ]);

  const walkPhase = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(0.05, delta);
    if (isMoving) {
      walkPhase.current += dt * 10.5;
    } else {
      walkPhase.current = 0;
    }

    const t = state.clock.getElapsedTime();
    const swing = isMoving ? Math.sin(walkPhase.current) * 0.54 : 0;
    const bob = isMoving
      ? Math.abs(Math.sin(walkPhase.current)) * 0.045
      : Math.sin(t * 2.1) * 0.014;

    if (bodyGroupRef.current) {
      bodyGroupRef.current.position.y = bob;
    }
    if (headGroupRef.current) {
      headGroupRef.current.rotation.z = isMoving
        ? Math.sin(walkPhase.current) * 0.035
        : Math.sin(t * 1.4) * 0.025;
      headGroupRef.current.rotation.x = isMoving ? 0.05 : Math.sin(t * 1.1) * 0.02;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = swing;
      leftArmRef.current.rotation.z = 0.14 + Math.sin(t * 2.0) * 0.03;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = -swing;
      rightArmRef.current.rotation.z = -0.14 - Math.sin(t * 2.0) * 0.03;
    }
    if (leftLegRef.current) leftLegRef.current.rotation.x = -swing * 0.72;
    if (rightLegRef.current) rightLegRef.current.rotation.x = swing * 0.72;

    if (skirtRef.current) {
      const flare = isMoving ? 1.07 + Math.abs(Math.sin(walkPhase.current)) * 0.04 : 1.0;
      skirtRef.current.scale.set(flare, 1.0, flare);
      skirtRef.current.rotation.x = isMoving ? 0.08 : Math.sin(t * 1.6) * 0.025;
    }
    const wind = isMoving ? 0.48 : 0.14;
    if (ribbonLRef.current) {
      ribbonLRef.current.rotation.x = wind + Math.sin(t * 3.4) * 0.14;
      ribbonLRef.current.rotation.z = 0.16 + Math.cos(t * 2.6) * 0.09;
    }
    if (ribbonRRef.current) {
      ribbonRRef.current.rotation.x = wind + Math.cos(t * 3.2 + 0.8) * 0.14;
      ribbonRRef.current.rotation.z = -0.16 - Math.sin(t * 2.5 + 0.5) * 0.09;
    }
    if (backHairRef.current) {
      backHairRef.current.rotation.x = (isMoving ? 0.34 : 0.08) + Math.sin(t * 2.8) * 0.07;
    }
  });

  return (
    <group ref={bodyGroupRef}>
      {/* Legs & Sculpted Embroidered Boots (Partially beneath flared robe skirt) */}
      <group ref={leftLegRef} position={[-0.085, 0.42, 0]}>
        <mesh position={[0, -0.16, 0]} material={pantsMat} castShadow>
          <capsuleGeometry args={[0.056, 0.16, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.34, 0.025]} material={bootMat} castShadow>
          <capsuleGeometry args={[0.058, 0.08, 6, 10]} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.085, 0.42, 0]}>
        <mesh position={[0, -0.16, 0]} material={pantsMat} castShadow>
          <capsuleGeometry args={[0.056, 0.16, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.34, 0.025]} material={bootMat} castShadow>
          <capsuleGeometry args={[0.058, 0.08, 6, 10]} />
        </mesh>
      </group>

      {/* Flowing Bell-Flared Lower Donghua Silk Skirt */}
      <mesh ref={skirtRef} position={[0, 0.16, 0]} geometry={skirtGeo} material={tunicMat} castShadow receiveShadow />
      {/* Inner Ivory Pleated Under-Skirt Trim */}
      <mesh position={[0, 0.22, 0.02]} material={innerRobeMat}>
        <cylinderGeometry args={[0.16, 0.28, 0.36, 14, 1, true, -0.45, 0.9]} />
      </mesh>

      {/* Sculpted Upper Áo Giao Lĩnh Torso */}
      <mesh position={[0, 0.85, 0]} material={tunicMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.155, 0.145, 0.38, 16]} />
      </mesh>
      {/* Crossed Ivory Inner Collar Lapels + Gold Embroidered Rim */}
      <mesh position={[-0.03, 0.94, 0.13]} rotation-z={-0.55} material={innerRobeMat}>
        <boxGeometry args={[0.045, 0.24, 0.035]} />
      </mesh>
      <mesh position={[0.03, 0.94, 0.132]} rotation-z={0.55} material={goldTrimMat}>
        <boxGeometry args={[0.052, 0.25, 0.035]} />
      </mesh>

      {/* Sculpted Silk Waist Sash Belt + Gold Buckle + Glowing Jade Ngọc Bội Pendant */}
      <mesh position={[0, 0.71, 0]} material={sashMat} castShadow>
        <cylinderGeometry args={[0.158, 0.168, 0.11, 16]} />
      </mesh>
      <mesh position={[0, 0.71, 0.165]} material={goldTrimMat}>
        <boxGeometry args={[0.08, 0.08, 0.03]} />
      </mesh>
      <mesh position={[0.13, 0.58, 0.14]} material={jadeMat}>
        <octahedronGeometry args={[0.048, 0]} />
      </mesh>

      {/* Flowing Animated Silk Waist Sash Tails at Back */}
      <group ref={ribbonLRef} position={[-0.08, 0.68, -0.15]}>
        <mesh geometry={ribbonGeo} material={sashMat} castShadow />
      </group>
      <group ref={ribbonRRef} position={[0.08, 0.68, -0.15]}>
        <mesh geometry={ribbonGeo} material={sashMat} castShadow />
      </group>

      {/* Front Embroidered Apron Sash Panel */}
      <mesh position={[0, 0.42, 0.23]} rotation-x={-0.2} material={sashMat} castShadow>
        <boxGeometry args={[0.11, 0.46, 0.018]} />
      </mesh>

      {/* Wide Flared Donghua Sleeves + Graceful Hands */}
      <group ref={leftArmRef} position={[-0.2, 0.98, 0]}>
        <mesh geometry={sleeveGeo} material={tunicMat} castShadow />
        <mesh position={[0, -0.31, 0]} rotation-x={Math.PI / 2} material={goldTrimMat}>
          <torusGeometry args={[0.118, 0.012, 6, 14]} />
        </mesh>
        <mesh position={[0, -0.33, 0.01]} material={skinMat} castShadow>
          <sphereGeometry args={[0.046, 8, 8]} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.2, 0.98, 0]}>
        <mesh geometry={sleeveGeo} material={tunicMat} castShadow />
        <mesh position={[0, -0.31, 0]} rotation-x={Math.PI / 2} material={goldTrimMat}>
          <torusGeometry args={[0.118, 0.012, 6, 14]} />
        </mesh>
        <mesh position={[0, -0.33, 0.01]} material={skinMat} castShadow>
          <sphereGeometry args={[0.046, 8, 8]} />
        </mesh>
      </group>

      {/* Graceful Neck & Head with Detailed Donghua Hair & Gold Hairpin */}
      <mesh position={[0, 1.08, 0]} material={skinMat}>
        <cylinderGeometry args={[0.055, 0.068, 0.12, 10]} />
      </mesh>
      <group ref={headGroupRef} position={[0, 1.24, 0]}>
        {/* Sculpted Soft Oval Face */}
        <mesh scale={[0.94, 1.03, 0.92]} material={skinMat} castShadow receiveShadow>
          <sphereGeometry args={[0.215, 22, 18]} />
        </mesh>
        {/* Sleek Hair Crown */}
        <mesh position={[0, 0.045, -0.025]} material={hairMat} castShadow>
          <sphereGeometry args={[0.225, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.66]} />
        </mesh>
        {/* Donghua High Topknot (Búi Tóc) + Gold Crown Band & Hairpin (Trâm Cài) */}
        <mesh position={[0, 0.27, -0.04]} material={hairMat} castShadow>
          <sphereGeometry args={[0.088, 12, 10]} />
        </mesh>
        <mesh position={[0, 0.225, -0.04]} rotation-x={Math.PI / 2} material={goldTrimMat}>
          <torusGeometry args={[0.078, 0.015, 6, 14]} />
        </mesh>
        <mesh position={[0, 0.27, -0.04]} rotation-z={0.42} material={goldTrimMat}>
          <cylinderGeometry args={[0.008, 0.01, 0.34, 6]} />
        </mesh>
        <mesh position={[0.15, 0.34, -0.04]} material={jadeMat}>
          <sphereGeometry args={[0.022, 8, 8]} />
        </mesh>

        {/* Swept Multi-Strand Bangs & Cheek-Framing Temple Locks */}
        <mesh position={[-0.07, 0.11, 0.165]} rotation={[0.35, -0.22, 2.85]} material={hairMat}>
          <coneGeometry args={[0.065, 0.18, 7]} />
        </mesh>
        <mesh position={[0.075, 0.11, 0.165]} rotation={[0.35, 0.22, -2.85]} material={hairMat}>
          <coneGeometry args={[0.065, 0.18, 7]} />
        </mesh>
        <mesh position={[0.0, 0.135, 0.178]} rotation={[0.32, 0, 3.1]} material={hairMat}>
          <coneGeometry args={[0.048, 0.15, 6]} />
        </mesh>
        {/* Long Temple Side Locks */}
        <mesh position={[-0.175, -0.06, 0.065]} rotation={[0.12, 0, 3.05]} material={hairMat} castShadow>
          <coneGeometry args={[0.052, 0.28, 7]} />
        </mesh>
        <mesh position={[0.175, -0.06, 0.065]} rotation={[0.12, 0, -3.05]} material={hairMat} castShadow>
          <coneGeometry args={[0.052, 0.28, 7]} />
        </mesh>

        {/* Flowing Animated Long Back Hair Cape */}
        <group ref={backHairRef} position={[0, 0.04, -0.17]}>
          <mesh geometry={backHairGeo} material={hairMat} castShadow />
        </group>

        {/* Expressive Almond Donghua Eyes with Double Specular Catchlights */}
        <mesh position={[-0.074, -0.015, 0.188]} scale={[1.15, 1.25, 0.7]} material={eyeMat}>
          <sphereGeometry args={[0.025, 10, 10]} />
        </mesh>
        <mesh position={[-0.066, -0.004, 0.205]} material={eyeShineMat}>
          <sphereGeometry args={[0.0085, 6, 6]} />
        </mesh>
        <mesh position={[-0.081, -0.024, 0.203]} material={eyeShineMat}>
          <sphereGeometry args={[0.0045, 5, 5]} />
        </mesh>

        <mesh position={[0.074, -0.015, 0.188]} scale={[1.15, 1.25, 0.7]} material={eyeMat}>
          <sphereGeometry args={[0.025, 10, 10]} />
        </mesh>
        <mesh position={[0.082, -0.004, 0.205]} material={eyeShineMat}>
          <sphereGeometry args={[0.0085, 6, 6]} />
        </mesh>
        <mesh position={[0.067, -0.024, 0.203]} material={eyeShineMat}>
          <sphereGeometry args={[0.0045, 5, 5]} />
        </mesh>

        {/* Subtle Rosy Peach Cheek Glow */}
        <mesh position={[-0.12, -0.062, 0.16]} scale={[1.25, 0.7, 0.5]} material={cheekMat}>
          <sphereGeometry args={[0.028, 8, 8]} />
        </mesh>
        <mesh position={[0.12, -0.062, 0.16]} scale={[1.25, 0.7, 0.5]} material={cheekMat}>
          <sphereGeometry args={[0.028, 8, 8]} />
        </mesh>
      </group>
    </group>
  );
});

export const ControllableAvatarR3F: React.FC<R3FAvatarProps> = ({
  robeColor = 0x2d7a58,
  cameraMode = 'follow',
  cameraZoom = 1.0,
  cameraYawRef,
  cameraPitchRef,
  keyboardKeysRef,
  joystickVectorRef,
  clickTarget,
  teleportTarget,
  onClearClickTarget,
  zones,
  onNearbyZoneChange,
  avatarPosRef,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const rotationTargetRef = useRef(0.35);
  const nearestZoneIdRef = useRef<string | null>(null);
  const lastTeleportSeqRef = useRef(-1);
  const snapCameraRef = useRef(true);
  const wasOutdoorRef = useRef(true);
  const smoothYawRef = useRef(cameraYawRef?.current ?? 0.24);
  const smoothPitchRef = useRef(cameraPitchRef?.current ?? 0.48);
  const smoothZoomRef = useRef(cameraZoom);
  const smoothAnchorRef = useRef(
    new THREE.Vector3(-3.5, walkableSurfaceHeightAt(-3.5, 5.5), 5.5)
  );

  const speed = 7.4;
  const [isMovingState, setIsMovingState] = React.useState(false);
  const isMovingRef = useRef(false);

  // Sync teleport requests cleanly
  useEffect(() => {
    if (!teleportTarget || teleportTarget.seq === lastTeleportSeqRef.current) return;
    lastTeleportSeqRef.current = teleportTarget.seq;
    snapCameraRef.current = true;
    if (groupRef.current) {
      const y = walkableSurfaceHeightAt(teleportTarget.x, teleportTarget.z);
      groupRef.current.position.set(teleportTarget.x, y, teleportTarget.z);
      smoothAnchorRef.current.set(teleportTarget.x, y, teleportTarget.z);
      liveAvatarWorldPos.copy(groupRef.current.position);
      if (avatarPosRef) avatarPosRef.current.copy(groupRef.current.position);
    }
  }, [teleportTarget, avatarPosRef]);

  useFrame((state, delta) => {
    if (!liveSceneActivity.isOutdoor) {
      wasOutdoorRef.current = false;
      return;
    }

    if (!wasOutdoorRef.current) {
      wasOutdoorRef.current = true;
      snapCameraRef.current = true;
    }

    const avatar = groupRef.current;
    if (!avatar) return;

    const time = state.clock.getElapsedTime();
    const clampedDelta = Math.min(0.08, delta);
    const targetYaw = cameraYawRef?.current ?? 0.24;
    const targetPitch = cameraPitchRef?.current ?? 0.48;
    const targetZoom = THREE.MathUtils.clamp(cameraZoom, 0.55, 2.55);
    if (snapCameraRef.current) {
      smoothYawRef.current = targetYaw;
      smoothPitchRef.current = targetPitch;
      smoothZoomRef.current = targetZoom;
    } else {
      smoothYawRef.current = THREE.MathUtils.damp(smoothYawRef.current, targetYaw, 18, clampedDelta);
      smoothPitchRef.current = THREE.MathUtils.damp(smoothPitchRef.current, targetPitch, 18, clampedDelta);
      smoothZoomRef.current = THREE.MathUtils.damp(smoothZoomRef.current, targetZoom, 12, clampedDelta);
    }
    const yaw = smoothYawRef.current;
    const pitch = smoothPitchRef.current;
    const zScale = smoothZoomRef.current;
    const keyboardKeys = keyboardKeysRef.current;
    const joystickVector = joystickVectorRef.current;

    // Input relative to camera yaw so WASD always moves relative to screen view
    let inputX = 0;
    let inputZ = 0;
    if (keyboardKeys['w'] || keyboardKeys['arrowup']) inputZ -= 1;
    if (keyboardKeys['s'] || keyboardKeys['arrowdown']) inputZ += 1;
    if (keyboardKeys['a'] || keyboardKeys['arrowleft']) inputX -= 1;
    if (keyboardKeys['d'] || keyboardKeys['arrowright']) inputX += 1;

    if (Math.abs(joystickVector.dx) > 0.05 || Math.abs(joystickVector.dy) > 0.05) {
      inputX += joystickVector.dx;
      inputZ += joystickVector.dy;
      if (clickTarget) onClearClickTarget();
    }

    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    _moveDir.set(inputX * cosY + inputZ * sinY, 0, -inputX * sinY + inputZ * cosY);

    let isMoving = false;

    if (_moveDir.lengthSq() > 0.001) {
      if (clickTarget) onClearClickTarget();
      _moveDir.normalize();
      rotationTargetRef.current = Math.atan2(_moveDir.x, _moveDir.z);
      isMoving = true;

      const nextX = avatar.position.x + _moveDir.x * speed * clampedDelta;
      const nextZ = avatar.position.z + _moveDir.z * speed * clampedDelta;
      const resolved = resolveAvatarCollision(nextX, nextZ, avatar.position.x, avatar.position.z);

      avatar.position.x = resolved.x;
      avatar.position.z = resolved.z;
    } else if (clickTarget) {
      const dx = clickTarget.x - avatar.position.x;
      const dz = clickTarget.z - avatar.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.35) {
        isMoving = true;
        rotationTargetRef.current = Math.atan2(dx, dz);
        const moveStep = Math.min(dist, speed * clampedDelta);
        const nextX = avatar.position.x + (dx / dist) * moveStep;
        const nextZ = avatar.position.z + (dz / dist) * moveStep;
        const resolved = resolveAvatarCollision(nextX, nextZ, avatar.position.x, avatar.position.z);

        // Stop gracefully if blocked against an obstacle
        if (Math.hypot(resolved.x - avatar.position.x, resolved.z - avatar.position.z) < 0.004) {
          onClearClickTarget();
        } else {
          avatar.position.x = resolved.x;
          avatar.position.z = resolved.z;
        }
      } else {
        onClearClickTarget();
      }
    }

    avatar.position.y = walkableSurfaceHeightAt(avatar.position.x, avatar.position.z);

    if (isMoving !== isMovingRef.current) {
      isMovingRef.current = isMoving;
      setIsMovingState(isMoving);
    }

    const diffRot = rotationTargetRef.current - avatar.rotation.y;
    const normDiff = Math.atan2(Math.sin(diffRot), Math.cos(diffRot));
    avatar.rotation.y += normDiff * Math.min(1, clampedDelta * 12);

    if (state.camera instanceof THREE.PerspectiveCamera && Math.abs(state.camera.fov - 54) > 0.1) {
      state.camera.fov = 54;
      state.camera.updateProjectionMatrix();
    }

    // Smooth follow anchor prevents chord shrinking during fast spherical orbit drags
    const snap = snapCameraRef.current;
    if (snap) {
      smoothAnchorRef.current.copy(avatar.position);
    } else {
      smoothAnchorRef.current.x = THREE.MathUtils.damp(smoothAnchorRef.current.x, avatar.position.x, 12, clampedDelta);
      smoothAnchorRef.current.y = THREE.MathUtils.damp(smoothAnchorRef.current.y, avatar.position.y, 10, clampedDelta);
      smoothAnchorRef.current.z = THREE.MathUtils.damp(smoothAnchorRef.current.z, avatar.position.z, 12, clampedDelta);
    }
    const ax = smoothAnchorRef.current.x;
    const ay = smoothAnchorRef.current.y;
    const az = smoothAnchorRef.current.z;

    if (cameraMode === 'follow') {
      const orbitDist = 14.0 * zScale;
      const horizDist = Math.cos(pitch) * orbitDist;
      const camH = Math.sin(pitch) * orbitDist;
      const rawCamX = ax + Math.sin(yaw) * horizDist;
      const rawCamZ = az + Math.cos(yaw) * horizDist;
      const terrainAtCam = walkableSurfaceHeightAt(rawCamX, rawCamZ);
      const safeCamY = Math.max(ay + 1.25 + camH, terrainAtCam + 1.45);
      _targetCameraPos.set(rawCamX, safeCamY, rawCamZ);
      _lookTarget.set(
        ax - Math.sin(yaw) * 1.65,
        ay + 1.42,
        az - Math.cos(yaw) * 1.65
      );
      state.camera.position.copy(_targetCameraPos);
      state.camera.lookAt(_lookTarget);
    } else if (cameraMode === 'isometric') {
      const isoPitch = THREE.MathUtils.clamp(pitch + 0.25, 0.52, 1.24);
      const orbitDist = 29.0 * zScale;
      const horizDist = Math.cos(isoPitch) * orbitDist;
      const rawCamX = ax + Math.sin(yaw) * horizDist;
      const rawCamZ = az + Math.cos(yaw) * horizDist;
      const terrainAtCam = walkableSurfaceHeightAt(rawCamX, rawCamZ);
      const safeCamY = Math.max(
        ay + 1.2 + Math.sin(isoPitch) * orbitDist,
        terrainAtCam + 2.4
      );
      _targetCameraPos.set(rawCamX, safeCamY, rawCamZ);
      _lookTarget.set(ax, ay + 1.15, az);
      state.camera.position.copy(_targetCameraPos);
      state.camera.lookAt(_lookTarget);
    } else {
      const cineYaw = yaw + time * 0.085;
      const cinePitch = THREE.MathUtils.clamp(pitch, 0.36, 1.05);
      const orbitDist = 26.0 * zScale;
      const horizDist = Math.cos(cinePitch) * orbitDist;
      const rawCamX = ax + Math.sin(cineYaw) * horizDist;
      const rawCamZ = az + Math.cos(cineYaw) * horizDist;
      const terrainAtCam = walkableSurfaceHeightAt(rawCamX, rawCamZ);
      const safeCamY = Math.max(
        ay + 1.4 + Math.sin(cinePitch) * orbitDist,
        terrainAtCam + 2.6
      );
      _targetCameraPos.set(rawCamX, safeCamY, rawCamZ);
      _lookTarget.set(ax, ay + 1.25, az);
      state.camera.position.copy(_targetCameraPos);
      state.camera.lookAt(_lookTarget);
    }
    snapCameraRef.current = false;

    liveAvatarWorldPos.copy(avatar.position);
    if (avatarPosRef) {
      avatarPosRef.current.copy(avatar.position);
    }

    let nearestZone: WorldZone | null = null;
    let minDist = Infinity;
    for (const z of zones) {
      const d = Math.hypot(avatar.position.x - z.position.x, avatar.position.z - z.position.z);
      if (d < z.radius && d < minDist) {
        nearestZone = z;
        minDist = d;
      }
    }

    if (nearestZone?.id !== nearestZoneIdRef.current) {
      nearestZoneIdRef.current = nearestZone?.id ?? null;
      onNearbyZoneChange(nearestZone);
    }
  });

  const startY = walkableSurfaceHeightAt(-3.5, 5.5);

  return (
    <group ref={groupRef} position={[-3.5, startY, 5.5]}>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.36, 18]} />
        <meshBasicMaterial color="#1b261c" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 0.028, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.35, 0.41, 24]} />
        <meshBasicMaterial color="#f8faf5" transparent opacity={0.78} side={THREE.DoubleSide} />
      </mesh>

      <StylizedTravelerCharacter robeColor={robeColor} isMoving={isMovingState} />
    </group>
  );
};
