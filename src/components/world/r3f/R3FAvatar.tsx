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

export interface R3FAvatarProps {
  robeColor?: number;
  cameraMode?: 'follow' | 'isometric' | 'cinematic';
  cameraZoom?: number;
  cameraYawRef?: React.MutableRefObject<number>;
  keyboardKeys: { [key: string]: boolean };
  joystickVector: { dx: number; dy: number };
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
 * Multi-part Stylized Traveler Character (Storybook Sanctuary Explorer)
 */
export const StylizedTravelerCharacter: React.FC<{
  robeColor?: number;
  isMoving: boolean;
}> = ({ robeColor = 0x2d7a58, isMoving }) => {
  const bodyGroupRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const skinMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xf4c7a5, roughness: 0.76 }),
    []
  );
  const cheekMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xec9b88, roughness: 0.85 }),
    []
  );
  const hairMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x7b442b, roughness: 0.82 }),
    []
  );
  const tunicMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: robeColor, roughness: 0.8 }),
    [robeColor]
  );
  const accentMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xd98c4a, roughness: 0.76 }),
    []
  );
  const packMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xa6633c, roughness: 0.84 }),
    []
  );
  const pantsMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x4f3d2f, roughness: 0.88 }),
    []
  );
  const bootMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x33241a, roughness: 0.84 }),
    []
  );
  const eyeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.25 }),
    []
  );
  const eyeShineMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: 0xffffff }),
    []
  );

  const walkPhase = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(0.05, delta);
    if (isMoving) {
      walkPhase.current += dt * 11;
    } else {
      walkPhase.current = 0;
    }

    const t = state.clock.getElapsedTime();
    const swing = isMoving ? Math.sin(walkPhase.current) * 0.58 : 0;
    const bob = isMoving
      ? Math.abs(Math.sin(walkPhase.current)) * 0.05
      : Math.sin(t * 2.2) * 0.012;

    if (bodyGroupRef.current) {
      bodyGroupRef.current.position.y = bob;
    }
    if (headGroupRef.current) {
      headGroupRef.current.rotation.z = isMoving
        ? Math.sin(walkPhase.current) * 0.04
        : Math.sin(t * 1.4) * 0.03;
    }
    if (leftArmRef.current) leftArmRef.current.rotation.x = swing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -swing;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -swing * 0.9;
    if (rightLegRef.current) rightLegRef.current.rotation.x = swing * 0.9;
  });

  return (
    <group ref={bodyGroupRef}>
      <group ref={leftLegRef} position={[-0.1, 0.34, 0]}>
        <mesh position={[0, -0.13, 0]} material={pantsMat} castShadow>
          <capsuleGeometry args={[0.065, 0.14, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.28, 0.03]} material={bootMat} castShadow>
          <boxGeometry args={[0.13, 0.1, 0.19]} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.1, 0.34, 0]}>
        <mesh position={[0, -0.13, 0]} material={pantsMat} castShadow>
          <capsuleGeometry args={[0.065, 0.14, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.28, 0.03]} material={bootMat} castShadow>
          <boxGeometry args={[0.13, 0.1, 0.19]} />
        </mesh>
      </group>

      <mesh position={[0, 0.58, 0]} material={tunicMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.23, 0.48, 14]} />
      </mesh>
      <mesh position={[0, 0.81, 0]} material={accentMat} castShadow>
        <torusGeometry args={[0.15, 0.04, 6, 14]} />
      </mesh>
      <mesh position={[0.02, 0.58, 0.19]} rotation-z={0.58} material={accentMat}>
        <boxGeometry args={[0.055, 0.44, 0.05]} />
      </mesh>
      <mesh position={[0, 0.6, -0.21]} material={packMat} castShadow>
        <boxGeometry args={[0.28, 0.32, 0.14]} />
      </mesh>
      <mesh position={[-0.2, 0.42, 0.06]} material={accentMat} castShadow>
        <boxGeometry args={[0.09, 0.14, 0.14]} />
      </mesh>

      <group ref={leftArmRef} position={[-0.24, 0.74, 0]}>
        <mesh position={[0, -0.13, 0]} rotation-z={0.14} material={tunicMat} castShadow>
          <capsuleGeometry args={[0.055, 0.18, 4, 8]} />
        </mesh>
        <mesh position={[-0.02, -0.26, 0]} material={skinMat} castShadow>
          <sphereGeometry args={[0.055, 8, 8]} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.24, 0.74, 0]}>
        <mesh position={[0, -0.13, 0]} rotation-z={-0.14} material={tunicMat} castShadow>
          <capsuleGeometry args={[0.055, 0.18, 4, 8]} />
        </mesh>
        <mesh position={[0.02, -0.26, 0]} material={skinMat} castShadow>
          <sphereGeometry args={[0.055, 8, 8]} />
        </mesh>
      </group>

      <group ref={headGroupRef} position={[0, 1.04, 0]}>
        <mesh material={skinMat} castShadow receiveShadow>
          <sphereGeometry args={[0.24, 18, 16]} />
        </mesh>
        <mesh position={[0, 0.05, -0.03]} material={hairMat} castShadow>
          <sphereGeometry args={[0.258, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        </mesh>
        <mesh position={[-0.09, 0.14, 0.18]} rotation={[0.3, -0.2, 0.25]} material={hairMat} castShadow>
          <sphereGeometry args={[0.11, 10, 8]} />
        </mesh>
        <mesh position={[0.09, 0.14, 0.18]} rotation={[0.3, 0.2, -0.25]} material={hairMat} castShadow>
          <sphereGeometry args={[0.11, 10, 8]} />
        </mesh>
        <mesh position={[-0.2, 0.02, -0.04]} material={hairMat} castShadow>
          <sphereGeometry args={[0.09, 8, 8]} />
        </mesh>
        <mesh position={[0.2, 0.02, -0.04]} material={hairMat} castShadow>
          <sphereGeometry args={[0.09, 8, 8]} />
        </mesh>
        <mesh position={[-0.08, -0.01, 0.215]} material={eyeMat}>
          <sphereGeometry args={[0.026, 8, 8]} />
        </mesh>
        <mesh position={[-0.072, 0.0, 0.236]} material={eyeShineMat}>
          <sphereGeometry args={[0.008, 6, 6]} />
        </mesh>
        <mesh position={[0.08, -0.01, 0.215]} material={eyeMat}>
          <sphereGeometry args={[0.026, 8, 8]} />
        </mesh>
        <mesh position={[0.088, 0.0, 0.236]} material={eyeShineMat}>
          <sphereGeometry args={[0.008, 6, 6]} />
        </mesh>
        <mesh position={[-0.13, -0.06, 0.185]} scale={[1.2, 0.75, 0.5]} material={cheekMat}>
          <sphereGeometry args={[0.032, 8, 8]} />
        </mesh>
        <mesh position={[0.13, -0.06, 0.185]} scale={[1.2, 0.75, 0.5]} material={cheekMat}>
          <sphereGeometry args={[0.032, 8, 8]} />
        </mesh>
      </group>
    </group>
  );
};

export const ControllableAvatarR3F: React.FC<R3FAvatarProps> = ({
  robeColor = 0x2d7a58,
  cameraMode = 'follow',
  cameraZoom = 1.0,
  cameraYawRef,
  keyboardKeys,
  joystickVector,
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

  const speed = 7.2;
  const [isMovingState, setIsMovingState] = React.useState(false);
  const isMovingRef = useRef(false);

  // Sync teleport requests cleanly
  useEffect(() => {
    if (!teleportTarget || teleportTarget.seq === lastTeleportSeqRef.current) return;
    lastTeleportSeqRef.current = teleportTarget.seq;
    if (groupRef.current) {
      const y = walkableSurfaceHeightAt(teleportTarget.x, teleportTarget.z);
      groupRef.current.position.set(teleportTarget.x, y, teleportTarget.z);
      liveAvatarWorldPos.copy(groupRef.current.position);
      if (avatarPosRef) avatarPosRef.current.copy(groupRef.current.position);
    }
  }, [teleportTarget, avatarPosRef]);

  useFrame((state, delta) => {
    const avatar = groupRef.current;
    if (!avatar) return;

    const time = state.clock.getElapsedTime();
    const clampedDelta = Math.min(0.08, delta);
    const yaw = cameraYawRef?.current ?? 0;

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

    // Airy valley camera rig supporting yaw orbit + scroll zoom
    const zScale = THREE.MathUtils.clamp(cameraZoom, 0.65, 1.85);
    if (cameraMode === 'follow') {
      const distBack = 12.8 * zScale;
      const camH = 6.8 * zScale;
      _targetCameraPos.set(
        avatar.position.x + Math.sin(yaw) * distBack,
        avatar.position.y + camH,
        avatar.position.z + Math.cos(yaw) * distBack
      );
      state.camera.position.lerp(_targetCameraPos, clampedDelta * 4.5);
      _lookTarget.set(
        avatar.position.x - Math.sin(yaw) * 4.2,
        avatar.position.y + 1.4,
        avatar.position.z - Math.cos(yaw) * 4.2
      );
      state.camera.lookAt(_lookTarget);
    } else if (cameraMode === 'isometric') {
      const isoYaw = yaw + 0.48;
      const distBack = 22.0 * zScale;
      _targetCameraPos.set(
        avatar.position.x + Math.sin(isoYaw) * distBack,
        avatar.position.y + 14.5 * zScale,
        avatar.position.z + Math.cos(isoYaw) * distBack
      );
      state.camera.position.lerp(_targetCameraPos, clampedDelta * 3.8);
      _lookTarget.set(avatar.position.x, avatar.position.y + 1.0, avatar.position.z);
      state.camera.lookAt(_lookTarget);
    } else {
      _targetCameraPos.set(
        Math.sin(time * 0.08) * 34 * zScale,
        15.5 * zScale,
        Math.cos(time * 0.08) * 34 * zScale
      );
      state.camera.position.lerp(_targetCameraPos, clampedDelta * 2.0);
      _lookTarget.set(0, 1.5, 4);
      state.camera.lookAt(_lookTarget);
    }

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
