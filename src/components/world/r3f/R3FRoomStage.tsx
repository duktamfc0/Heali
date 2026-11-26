import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { StylizedTravelerCharacter } from './R3FAvatar';
import {
  ROOM_LIGHT_SPECS,
  ROOM_SPATIAL_CONFIGS,
  type ActiveInteriorRoomId,
  type ObstacleCircle,
} from './rooms/roomConfigs';
import {
  ContactShadowDisc,
  useRoomSculptedGeometries,
  useRoomVistaTextures,
  useSharedRoomMaterials,
} from './rooms/roomShared';
import { JournalLibraryRoom, LettersPostRoom } from './rooms/RoomJournalAndLetters';
import { CalmConservatoryRoom, WishesTempleRoom } from './rooms/RoomWishesAndCalm';
import {
  CommunityTeaRoom,
  LakePavilionRoom,
  SpiritualSanctumRoom,
} from './rooms/RoomCommunitySpiritualLake';
import type { ActiveRoomHotspot, RoomActionId } from './roomTypes';

export type { ActiveInteriorRoomId };

export interface R3FRoomStageProps {
  activeRoom: ActiveInteriorRoomId | null;
  isSoftwareGl?: boolean;
  roomWideView?: boolean;
  robeColor?: number;
  roomYawRef: React.MutableRefObject<number>;
  roomPitchRef: React.MutableRefObject<number>;
  roomZoomRef: React.MutableRefObject<number>;
  dragDeltaRef: React.MutableRefObject<number>;
  keyboardKeysRef: React.MutableRefObject<{ [key: string]: boolean }>;
  joystickVectorRef: React.MutableRefObject<{ dx: number; dy: number }>;
  clickTarget: THREE.Vector3 | null;
  onSetClickTarget: (pt: THREE.Vector3) => void;
  onClearClickTarget: () => void;
  onTriggerAction: (action: RoomActionId) => void;
  onHotspotChange: (hotspot: ActiveRoomHotspot | null) => void;
  onNearDoorChange: (near: boolean) => void;
  onExitToOutdoor: () => void;
}

const _camPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();

/**
 * Ray-box spring-arm so the camera can rotate freely 360° inside a room
 * without ever clipping outside opaque walls or ceiling trusses.
 */
function clipCameraToRoomBounds(
  originX: number,
  originY: number,
  originZ: number,
  dirX: number,
  dirY: number,
  dirZ: number,
  maxDist: number,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number }
): number {
  const minX = bounds.minX - 0.35;
  const maxX = bounds.maxX + 0.35;
  const minZ = bounds.minZ - 0.35;
  const maxZ = bounds.maxZ + 5.2; // Spacious open cutaway front stage
  const minY = 1.1;
  const maxY = 5.65; // Higher vaulted ceiling clearance

  let tMax = maxDist;
  if (dirX < -1e-4) tMax = Math.min(tMax, (minX - originX) / dirX);
  else if (dirX > 1e-4) tMax = Math.min(tMax, (maxX - originX) / dirX);

  if (dirY < -1e-4) tMax = Math.min(tMax, (minY - originY) / dirY);
  else if (dirY > 1e-4) tMax = Math.min(tMax, (maxY - originY) / dirY);

  if (dirZ < -1e-4) tMax = Math.min(tMax, (minZ - originZ) / dirZ);
  else if (dirZ > 1e-4) tMax = Math.min(tMax, (maxZ - originZ) / dirZ);

  return Math.max(1.5, tMax * 0.96);
}

function resolveRoomCollision(
  x: number,
  z: number,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  obstacles: ObstacleCircle[]
): { x: number; z: number } {
  let newX = Math.max(bounds.minX, Math.min(bounds.maxX, x));
  let newZ = Math.max(bounds.minZ, Math.min(bounds.maxZ, z));
  for (const obs of obstacles) {
    const dx = newX - obs.x;
    const dz = newZ - obs.z;
    const dist = Math.hypot(dx, dz);
    if (dist < obs.radius) {
      const ang = dist > 0.0001 ? Math.atan2(dz, dx) : 0;
      newX = obs.x + Math.cos(ang) * obs.radius;
      newZ = obs.z + Math.sin(ang) * obs.radius;
    }
  }
  return { x: newX, z: newZ };
}

const RoomAvatarRig: React.FC<{
  activeRoom: ActiveInteriorRoomId | null;
  roomWideView: boolean;
  robeColor: number;
  contactShadowMat: THREE.Material;
  roomYawRef: React.MutableRefObject<number>;
  roomPitchRef: React.MutableRefObject<number>;
  roomZoomRef: React.MutableRefObject<number>;
  keyboardKeysRef: React.MutableRefObject<{ [key: string]: boolean }>;
  joystickVectorRef: React.MutableRefObject<{ dx: number; dy: number }>;
  clickTarget: THREE.Vector3 | null;
  onClearClickTarget: () => void;
  onHotspotChange: (hotspot: ActiveRoomHotspot | null) => void;
  onNearDoorChange: (near: boolean) => void;
}> = ({
  activeRoom,
  roomWideView,
  robeColor,
  contactShadowMat,
  roomYawRef,
  roomPitchRef,
  roomZoomRef,
  keyboardKeysRef,
  joystickVectorRef,
  clickTarget,
  onClearClickTarget,
  onHotspotChange,
  onNearDoorChange,
}) => {
  const avatarRef = useRef<THREE.Group>(null);
  const [isMovingState, setIsMovingState] = useState(false);
  const isMovingRef = useRef(false);
  const rotTargetRef = useRef(Math.PI);
  const lastHotspotActionRef = useRef<string | null>(null);
  const lastNearDoorRef = useRef(false);
  const snapCamRef = useRef(true);
  const smoothYawRef = useRef(0.16);
  const smoothPitchRef = useRef(0.4);
  const smoothZoomRef = useRef(1.08);
  const smoothFocusRef = useRef(new THREE.Vector3(0, 1.05, 0.45));

  useEffect(() => {
    if (!activeRoom) return;
    const cfg = ROOM_SPATIAL_CONFIGS[activeRoom];
    snapCamRef.current = true;
    lastHotspotActionRef.current = null;
    lastNearDoorRef.current = false;
    rotTargetRef.current = Math.PI;
    smoothYawRef.current = roomYawRef.current;
    smoothPitchRef.current = roomPitchRef.current;
    smoothZoomRef.current = roomZoomRef.current;
    smoothFocusRef.current.set(cfg.spawnPos[0] * 0.65, 1.05, cfg.spawnPos[2] * 0.65 - 0.35);
    if (avatarRef.current) {
      avatarRef.current.position.set(cfg.spawnPos[0], cfg.spawnPos[1], cfg.spawnPos[2]);
      avatarRef.current.rotation.y = Math.PI;
    }
  }, [activeRoom, roomYawRef, roomPitchRef, roomZoomRef]);

  useFrame((state, delta) => {
    if (!activeRoom) return;
    const avatar = avatarRef.current;
    if (!avatar) return;

    const dt = Math.min(0.08, delta);
    const config = ROOM_SPATIAL_CONFIGS[activeRoom];
    const keyboardKeys = keyboardKeysRef.current;
    const joystickVector = joystickVectorRef.current;

    if (snapCamRef.current) {
      smoothYawRef.current = roomYawRef.current;
      smoothPitchRef.current = roomPitchRef.current;
      smoothZoomRef.current = roomZoomRef.current;
    } else {
      smoothYawRef.current = THREE.MathUtils.damp(smoothYawRef.current, roomYawRef.current, 18, dt);
      smoothPitchRef.current = THREE.MathUtils.damp(smoothPitchRef.current, roomPitchRef.current, 18, dt);
      smoothZoomRef.current = THREE.MathUtils.damp(smoothZoomRef.current, roomZoomRef.current, 12, dt);
    }
    const yaw = smoothYawRef.current;
    const pitch = smoothPitchRef.current;
    const zoom = smoothZoomRef.current;

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

    let isMoving = false;
    const speed = 5.4;
    const inputLen = Math.hypot(inputX, inputZ);

    if (inputLen > 0.01) {
      if (clickTarget) onClearClickTarget();
      const nx = inputX / inputLen;
      const nz = inputZ / inputLen;
      const worldX = nx * Math.cos(yaw) + nz * Math.sin(yaw);
      const worldZ = -nx * Math.sin(yaw) + nz * Math.cos(yaw);

      rotTargetRef.current = Math.atan2(worldX, worldZ);
      isMoving = true;

      const resolved = resolveRoomCollision(
        avatar.position.x + worldX * speed * dt,
        avatar.position.z + worldZ * speed * dt,
        config.bounds,
        config.obstacles
      );
      avatar.position.x = resolved.x;
      avatar.position.z = resolved.z;
    } else if (clickTarget) {
      const dx = clickTarget.x - avatar.position.x;
      const dz = clickTarget.z - avatar.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.22) {
        isMoving = true;
        rotTargetRef.current = Math.atan2(dx, dz);
        const step = Math.min(dist, speed * dt);
        const resolved = resolveRoomCollision(
          avatar.position.x + (dx / dist) * step,
          avatar.position.z + (dz / dist) * step,
          config.bounds,
          config.obstacles
        );
        if (Math.hypot(resolved.x - avatar.position.x, resolved.z - avatar.position.z) < 0.003) {
          onClearClickTarget();
        } else {
          avatar.position.x = resolved.x;
          avatar.position.z = resolved.z;
        }
      } else {
        onClearClickTarget();
      }
    }

    if (isMoving !== isMovingRef.current) {
      isMovingRef.current = isMoving;
      setIsMovingState(isMoving);
    }

    const diffRot = rotTargetRef.current - avatar.rotation.y;
    avatar.rotation.y += Math.atan2(Math.sin(diffRot), Math.cos(diffRot)) * Math.min(1, dt * 12);

    let nearest: ActiveRoomHotspot | null = null;
    let bestDist = Infinity;
    for (const h of config.hotspots) {
      const d = Math.hypot(avatar.position.x - h.x, avatar.position.z - h.z);
      if (d < h.radius && d < bestDist) {
        bestDist = d;
        nearest = h.hotspot;
      }
    }
    const nextAction = nearest?.action ?? null;
    if (nextAction !== lastHotspotActionRef.current) {
      lastHotspotActionRef.current = nextAction;
      onHotspotChange(nearest);
    }

    const nearDoor =
      Math.hypot(
        avatar.position.x - config.exitDoorPos[0],
        avatar.position.z - config.exitDoorPos[2]
      ) < 1.15;
    if (nearDoor !== lastNearDoorRef.current) {
      lastNearDoorRef.current = nearDoor;
      onNearDoorChange(nearDoor);
    }

    if (state.camera instanceof THREE.PerspectiveCamera && Math.abs(state.camera.fov - 60) > 0.1) {
      state.camera.fov = 60;
      state.camera.updateProjectionMatrix();
    }

    const desiredFocusX = roomWideView ? 0 : avatar.position.x * 0.58;
    const desiredFocusY = roomWideView ? avatar.position.y + 1.35 : avatar.position.y + 1.15;
    const desiredFocusZ = roomWideView ? -0.9 : avatar.position.z * 0.58 - 0.55;

    if (snapCamRef.current) {
      smoothFocusRef.current.set(desiredFocusX, desiredFocusY, desiredFocusZ);
    } else {
      smoothFocusRef.current.x = THREE.MathUtils.damp(smoothFocusRef.current.x, desiredFocusX, 10, dt);
      smoothFocusRef.current.y = THREE.MathUtils.damp(smoothFocusRef.current.y, desiredFocusY, 10, dt);
      smoothFocusRef.current.z = THREE.MathUtils.damp(smoothFocusRef.current.z, desiredFocusZ, 10, dt);
    }

    const fx = smoothFocusRef.current.x;
    const fy = smoothFocusRef.current.y;
    const fz = smoothFocusRef.current.z;

    const baseDist = roomWideView ? config.cameraBaseDist * 1.44 : config.cameraBaseDist;
    const orbitDist = baseDist * zoom;
    const cosP = Math.cos(pitch);
    const dirX = Math.sin(yaw) * cosP;
    const dirY = Math.sin(pitch);
    const dirZ = Math.cos(yaw) * cosP;

    const safeDist = clipCameraToRoomBounds(fx, fy, fz, dirX, dirY, dirZ, orbitDist, config.bounds);

    _camPos.set(fx + dirX * safeDist, fy + dirY * safeDist, fz + dirZ * safeDist);
    _lookTarget.set(
      fx - Math.sin(yaw) * 0.45,
      fy + 0.08,
      fz - Math.cos(yaw) * 0.45
    );

    state.camera.position.copy(_camPos);
    state.camera.lookAt(_lookTarget);
    snapCamRef.current = false;
  });

  return (
    <group ref={avatarRef} position={[0, 0, 1.2]}>
      <ContactShadowDisc position={[0, 0.018, 0]} radius={0.55} mat={contactShadowMat} />
      <mesh position={[0, 0.026, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.37, 0.42, 24]} />
        <meshBasicMaterial color="#f8faf5" transparent opacity={0.78} side={THREE.DoubleSide} />
      </mesh>
      <StylizedTravelerCharacter robeColor={robeColor} isMoving={isMovingState} />
    </group>
  );
};

export const R3FRoomStage: React.FC<R3FRoomStageProps> = ({
  activeRoom,
  isSoftwareGl = false,
  roomWideView = false,
  robeColor = 0x2d7a58,
  roomYawRef,
  roomPitchRef,
  roomZoomRef,
  dragDeltaRef,
  keyboardKeysRef,
  joystickVectorRef,
  clickTarget,
  onSetClickTarget,
  onClearClickTarget,
  onTriggerAction,
  onHotspotChange,
  onNearDoorChange,
  onExitToOutdoor,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    setHoveredId(null);
  }, [activeRoom]);

  useEffect(() => {
    document.body.style.cursor = hoveredId ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hoveredId]);

  const vistas = useRoomVistaTextures();
  const geos = useRoomSculptedGeometries();
  const mats = useSharedRoomMaterials(vistas.tarotBack, isSoftwareGl);

  const lightSpec = activeRoom ? ROOM_LIGHT_SPECS[activeRoom] : ROOM_LIGHT_SPECS.journal;
  const exitDoorPos = useMemo<[number, number, number]>(
    () => (activeRoom ? ROOM_SPATIAL_CONFIGS[activeRoom].exitDoorPos : [0, 0.03, 4.15]),
    [activeRoom]
  );

  // Dynamic room animation refs
  const accent1Ref = useRef<THREE.PointLight>(null);
  const journalCrystalRef = useRef<THREE.Mesh>(null);
  const wishCrystalRef = useRef<THREE.Mesh>(null);
  const wishRibbonsRef = useRef<THREE.Group>(null);
  const breathOrbRef = useRef<THREE.Mesh>(null);
  const breathRing1Ref = useRef<THREE.Mesh>(null);
  const breathRing2Ref = useRef<THREE.Mesh>(null);
  const windChimesRef = useRef<THREE.Group>(null);
  const rainGroupRef = useRef<THREE.Group>(null);
  const armillaryOuterRef = useRef<THREE.Mesh>(null);
  const armillaryInnerRef = useRef<THREE.Mesh>(null);
  const lanternFloatRef = useRef<THREE.Group>(null);
  const teaSteamRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!activeRoom) return;
    const t = state.clock.getElapsedTime();

    if (activeRoom === 'journal') {
      if (accent1Ref.current) {
        accent1Ref.current.intensity = 1.85 + Math.sin(t * 13) * 0.22 + Math.cos(t * 21) * 0.14;
      }
      if (journalCrystalRef.current) {
        journalCrystalRef.current.rotation.y = t * 0.65;
        journalCrystalRef.current.position.y = 1.42 + Math.sin(t * 2.1) * 0.06;
      }
    } else if (activeRoom === 'letters') {
      if (accent1Ref.current) {
        accent1Ref.current.intensity = 1.75 + Math.sin(t * 11) * 0.22 + Math.cos(t * 17) * 0.14;
      }
    } else if (activeRoom === 'wishes') {
      if (wishCrystalRef.current) {
        wishCrystalRef.current.rotation.y = t * 0.7;
        wishCrystalRef.current.position.y = 1.58 + Math.sin(t * 2.0) * 0.06;
      }
      if (wishRibbonsRef.current) {
        wishRibbonsRef.current.children.forEach((rib, idx) => {
          rib.rotation.z = Math.sin(t * 1.9 + idx * 0.8) * 0.11;
        });
      }
    } else if (activeRoom === 'calm') {
      if (breathOrbRef.current) {
        const s = 1 + Math.sin(t * 0.75) * 0.24;
        breathOrbRef.current.scale.setScalar(s);
        breathOrbRef.current.position.y = 1.48 + Math.sin(t * 0.75) * 0.08;
        breathOrbRef.current.rotation.y = t * 0.3;
      }
      if (breathRing1Ref.current) {
        breathRing1Ref.current.rotation.z = t * 0.45;
        breathRing1Ref.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.75) * 0.15;
      }
      if (breathRing2Ref.current) {
        breathRing2Ref.current.rotation.z = -t * 0.38;
        breathRing2Ref.current.rotation.y = Math.cos(t * 0.75) * 0.25;
      }
      if (windChimesRef.current) {
        windChimesRef.current.rotation.z = Math.sin(t * 1.4) * 0.055;
      }
      if (rainGroupRef.current) {
        rainGroupRef.current.children.forEach((drop, idx) => {
          drop.position.y -= 0.085;
          if (drop.position.y < 0.2) {
            drop.position.y = 3.85 + (idx % 6) * 0.22;
          }
        });
      }
    } else if (activeRoom === 'community') {
      if (teaSteamRef.current) {
        teaSteamRef.current.children.forEach((wisp, idx) => {
          const cyc = (t * 0.35 + idx * 0.33) % 1;
          wisp.position.y = 0.7 + cyc * 0.55;
          wisp.position.x = Math.sin(t * 2 + idx) * 0.045;
          wisp.scale.setScalar(0.5 + cyc * 0.8);
        });
      }
    } else if (activeRoom === 'spiritual_room') {
      if (armillaryOuterRef.current) {
        armillaryOuterRef.current.rotation.y = t * 0.45;
        armillaryOuterRef.current.rotation.x = Math.sin(t * 0.3) * 0.25;
      }
      if (armillaryInnerRef.current) {
        armillaryInnerRef.current.rotation.z = -t * 0.65;
        armillaryInnerRef.current.rotation.y = t * 0.35;
      }
    } else if (activeRoom === 'lake') {
      if (lanternFloatRef.current) {
        lanternFloatRef.current.children.forEach((child, idx) => {
          child.position.y = 0.04 + Math.sin(t * 1.5 + idx * 1.1) * 0.036;
        });
      }
    }
  });

  const handleFloorClick = useCallback(
    (e: { stopPropagation: () => void; point: THREE.Vector3 }) => {
      if (dragDeltaRef.current > 8) return;
      e.stopPropagation();
      onSetClickTarget(new THREE.Vector3(e.point.x, 0, e.point.z));
    },
    [dragDeltaRef, onSetClickTarget]
  );

  return (
    <group>
      {/* Unified Fixed-Count Lighting Rig for Spacious Rooms */}
      <ambientLight color={lightSpec.ambientColor} intensity={lightSpec.ambientIntensity} />
      <hemisphereLight
        args={[lightSpec.hemiSky, lightSpec.hemiGround, lightSpec.hemiIntensity]}
        position={[0, 7.2, 0]}
      />
      <directionalLight
        position={[-5.5, 10.0, 6.8]}
        color={lightSpec.dirColor}
        intensity={lightSpec.dirIntensity}
        castShadow={!isSoftwareGl}
        shadow-mapSize={isSoftwareGl ? [512, 512] : [1024, 1024]}
        shadow-bias={-0.0005}
      >
        <orthographicCamera attach="shadow-camera" args={[-12, 12, 12, -12, 0.5, 28]} />
      </directionalLight>
      <directionalLight
        position={[6.5, 5.5, -6.5]}
        color={lightSpec.rimColor}
        intensity={lightSpec.rimIntensity}
      />
      <pointLight
        ref={accent1Ref}
        color={lightSpec.accent1Color}
        intensity={lightSpec.accent1Intensity}
        distance={20}
        decay={2}
        position={lightSpec.accent1Pos}
      />
      <pointLight
        color={lightSpec.accent2Color}
        intensity={lightSpec.accent2Intensity}
        distance={18}
        decay={2}
        position={lightSpec.accent2Pos}
      />

      <JournalLibraryRoom
        active={activeRoom === 'journal'}
        isSoftwareGl={isSoftwareGl}
        mats={mats}
        geos={geos}
        vistaTex={vistas.journal}
        hoveredId={activeRoom === 'journal' ? hoveredId : null}
        setHoveredId={setHoveredId}
        onFloorClick={handleFloorClick}
        onTriggerAction={onTriggerAction}
        crystalRef={journalCrystalRef}
      />

      <LettersPostRoom
        active={activeRoom === 'letters'}
        isSoftwareGl={isSoftwareGl}
        mats={mats}
        geos={geos}
        vistaTex={vistas.letters}
        hoveredId={activeRoom === 'letters' ? hoveredId : null}
        setHoveredId={setHoveredId}
        onFloorClick={handleFloorClick}
        onTriggerAction={onTriggerAction}
      />

      <WishesTempleRoom
        active={activeRoom === 'wishes'}
        isSoftwareGl={isSoftwareGl}
        mats={mats}
        geos={geos}
        vistaTex={vistas.wishes}
        hoveredId={activeRoom === 'wishes' ? hoveredId : null}
        setHoveredId={setHoveredId}
        onFloorClick={handleFloorClick}
        onTriggerAction={onTriggerAction}
        wishCrystalRef={wishCrystalRef}
        wishRibbonsRef={wishRibbonsRef}
      />

      <CalmConservatoryRoom
        active={activeRoom === 'calm'}
        isSoftwareGl={isSoftwareGl}
        mats={mats}
        geos={geos}
        vistaTex={vistas.calm}
        hoveredId={activeRoom === 'calm' ? hoveredId : null}
        setHoveredId={setHoveredId}
        onFloorClick={handleFloorClick}
        onTriggerAction={onTriggerAction}
        breathOrbRef={breathOrbRef}
        breathRing1Ref={breathRing1Ref}
        breathRing2Ref={breathRing2Ref}
        windChimesRef={windChimesRef}
        rainGroupRef={rainGroupRef}
      />

      <CommunityTeaRoom
        active={activeRoom === 'community'}
        isSoftwareGl={isSoftwareGl}
        mats={mats}
        geos={geos}
        vistaTex={vistas.community}
        hoveredId={activeRoom === 'community' ? hoveredId : null}
        setHoveredId={setHoveredId}
        onFloorClick={handleFloorClick}
        onTriggerAction={onTriggerAction}
        teaSteamRef={teaSteamRef}
      />

      <SpiritualSanctumRoom
        active={activeRoom === 'spiritual_room'}
        isSoftwareGl={isSoftwareGl}
        mats={mats}
        geos={geos}
        vistaTex={vistas.spiritual_room}
        hoveredId={activeRoom === 'spiritual_room' ? hoveredId : null}
        setHoveredId={setHoveredId}
        onFloorClick={handleFloorClick}
        onTriggerAction={onTriggerAction}
        armillaryOuterRef={armillaryOuterRef}
        armillaryInnerRef={armillaryInnerRef}
        tarotBackTex={vistas.tarotBack}
      />

      <LakePavilionRoom
        active={activeRoom === 'lake'}
        isSoftwareGl={isSoftwareGl}
        mats={mats}
        geos={geos}
        vistaTex={vistas.lake}
        hoveredId={activeRoom === 'lake' ? hoveredId : null}
        setHoveredId={setHoveredId}
        onFloorClick={handleFloorClick}
        onTriggerAction={onTriggerAction}
        lanternFloatRef={lanternFloatRef}
      />

      {/* Shared Single Interior Traveler Avatar Rig */}
      <RoomAvatarRig
        activeRoom={activeRoom}
        roomWideView={roomWideView}
        robeColor={robeColor}
        contactShadowMat={mats.contactShadowMat}
        roomYawRef={roomYawRef}
        roomPitchRef={roomPitchRef}
        roomZoomRef={roomZoomRef}
        keyboardKeysRef={keyboardKeysRef}
        joystickVectorRef={joystickVectorRef}
        clickTarget={clickTarget}
        onClearClickTarget={onClearClickTarget}
        onHotspotChange={onHotspotChange}
        onNearDoorChange={onNearDoorChange}
      />

      {/* Shared Clickable Architectural Exit Door Threshold */}
      <group position={exitDoorPos}>
        <mesh
          rotation-x={-Math.PI / 2}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredId('exit_door');
          }}
          onPointerOut={() => setHoveredId(null)}
          onClick={(e) => {
            e.stopPropagation();
            onExitToOutdoor();
          }}
        >
          <planeGeometry args={[1.9, 0.85]} />
          <meshBasicMaterial
            color={hoveredId === 'exit_door' ? '#fde68a' : '#f59e0b'}
            transparent
            opacity={hoveredId === 'exit_door' ? 0.55 : 0.26}
          />
        </mesh>
        {[-0.43, 0.43].map((bz, i) => (
          <mesh key={`ex_bar_${i}`} position={[0, 0.012, bz]} material={mats.brass}>
            <boxGeometry args={[1.94, 0.022, 0.036]} />
          </mesh>
        ))}
        {[-0.95, 0.95].map((bx, i) => (
          <mesh key={`ex_b_${i}`} position={[bx, 0.04, -0.42]} material={mats.brass}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
          </mesh>
        ))}
        {[-0.95, 0.95].map((bx, i) => (
          <mesh key={`ex_f_${i}`} position={[bx, 0.04, 0.42]} material={mats.brass}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
