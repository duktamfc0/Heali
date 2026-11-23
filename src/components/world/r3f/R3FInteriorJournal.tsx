import React, { useRef, useMemo, useState, Suspense } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import {
  RealWritingDesk,
  RealJournalNotebook,
  RealSheenChair,
  RealReadingLamp,
  RealLantern,
  RealCoffeeMug,
  RealBotanicalPlant,
} from './ModelAssets';
import { StylizedTravelerCharacter } from './R3FAvatar';
import {
  getCozyRugTexture,
  getBookSpineTexture,
} from '../ProceduralTextures';

export interface R3FInteriorJournalProps {
  robeColor?: number;
  keyboardKeys: { [key: string]: boolean };
  joystickVector: { dx: number; dy: number };
  clickTarget: THREE.Vector3 | null;
  onClearClickTarget: () => void;
  onOpenJournalModal: () => void;
  onExitToOutdoor: () => void;
}

// Module-scope math helpers
const _moveDir = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();

// Interior Collision Obstacles
const INTERIOR_OBSTACLES: Array<{ x: number; z: number; radius: number }> = [
  { x: 0, z: -1.8, radius: 0.95 },  // Fireplace stove
  { x: 0, z: 0.2, radius: 0.95 },   // Writing table
  { x: 1.4, z: 0.2, radius: 0.8 },  // Reading armchair
  { x: -3.0, z: 0, radius: 0.7 },   // Bookshelf left wall
  { x: 2.7, z: -1.8, radius: 0.65 }, // Potted plant
];

function resolveInteriorCollision(x: number, z: number): { x: number; z: number } {
  let newX = Math.max(-3.0, Math.min(3.0, x));
  let newZ = Math.max(-2.5, Math.min(2.7, z));

  for (const obs of INTERIOR_OBSTACLES) {
    const dx = newX - obs.x;
    const dz = newZ - obs.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < obs.radius) {
      const angle = Math.atan2(dz, dx);
      newX = obs.x + Math.cos(angle) * obs.radius;
      newZ = obs.z + Math.sin(angle) * obs.radius;
    }
  }

  return { x: newX, z: newZ };
}

export const R3FInteriorJournal: React.FC<R3FInteriorJournalProps> = ({
  robeColor = 0x2d7a58,
  keyboardKeys,
  joystickVector,
  clickTarget,
  onClearClickTarget,
  onOpenJournalModal,
  onExitToOutdoor,
}) => {
  const avatarRef = useRef<THREE.Group>(null);
  const fireLightRef = useRef<THREE.PointLight>(null);

  const [isNearDesk, setIsNearDesk] = useState(false);
  const [isNearDoor, setIsNearDoor] = useState(false);
  const [isMovingState, setIsMovingState] = useState(false);
  const isMovingRef = useRef(false);

  const rotationTargetRef = useRef(Math.PI); // Facing into the room

  // Load Poly Haven PBR wood plank floor textures
  const [woodDiff, woodNor, woodRough] = useLoader(THREE.TextureLoader, [
    '/assets/3d/textures/wood_planks_diff_1k.jpg',
    '/assets/3d/textures/wood_planks_nor_1k.jpg',
    '/assets/3d/textures/wood_planks_rough_1k.jpg',
  ]);

  useMemo(() => {
    [woodDiff, woodNor, woodRough].forEach((tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 4);
    });
    woodDiff.colorSpace = THREE.SRGBColorSpace;
  }, [woodDiff, woodNor, woodRough]);

  const rugTex = useMemo(() => getCozyRugTexture(), []);
  const bookTex = useMemo(() => getBookSpineTexture(), []);

  const timberMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: woodDiff, normalMap: woodNor, roughnessMap: woodRough, roughness: 0.8 }),
    [woodDiff, woodNor, woodRough]
  );
  const wallStuccoMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x473b32, roughness: 0.95 }),
    []
  );
  const ceilingMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x33251c, roughness: 0.9 }),
    []
  );
  const metalStoveMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.45, metalness: 0.8 }),
    []
  );
  const fireEmbersMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xffedd5, emissive: 0xf97316, emissiveIntensity: 2.2 }),
    []
  );

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const clampedDelta = Math.min(0.08, delta);
    const avatar = avatarRef.current;
    if (!avatar) return;

    // Fireplace flicker animation
    if (fireLightRef.current) {
      fireLightRef.current.intensity = 2.4 + Math.sin(time * 14) * 0.45 + Math.cos(time * 23) * 0.25;
    }

    _moveDir.set(0, 0, 0);

    // Keyboard controls
    if (keyboardKeys['w'] || keyboardKeys['arrowup']) _moveDir.z -= 1;
    if (keyboardKeys['s'] || keyboardKeys['arrowdown']) _moveDir.z += 1;
    if (keyboardKeys['a'] || keyboardKeys['arrowleft']) _moveDir.x -= 1;
    if (keyboardKeys['d'] || keyboardKeys['arrowright']) _moveDir.x += 1;

    // Joystick controls
    if (Math.abs(joystickVector.dx) > 0.05 || Math.abs(joystickVector.dy) > 0.05) {
      _moveDir.x += joystickVector.dx;
      _moveDir.z += joystickVector.dy;
      if (clickTarget) onClearClickTarget();
    }

    let isMoving = false;
    const speed = 4.0;

    if (_moveDir.lengthSq() > 0.001) {
      if (clickTarget) onClearClickTarget();
      _moveDir.normalize();
      rotationTargetRef.current = Math.atan2(_moveDir.x, _moveDir.z);
      isMoving = true;

      const nextX = avatar.position.x + _moveDir.x * speed * clampedDelta;
      const nextZ = avatar.position.z + _moveDir.z * speed * clampedDelta;
      const resolved = resolveInteriorCollision(nextX, nextZ);

      avatar.position.x = resolved.x;
      avatar.position.z = resolved.z;
    } else if (clickTarget) {
      const dx = clickTarget.x - avatar.position.x;
      const dz = clickTarget.z - avatar.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.2) {
        isMoving = true;
        rotationTargetRef.current = Math.atan2(dx, dz);
        const moveStep = Math.min(dist, speed * clampedDelta);
        const nextX = avatar.position.x + (dx / dist) * moveStep;
        const nextZ = avatar.position.z + (dz / dist) * moveStep;
        const resolved = resolveInteriorCollision(nextX, nextZ);

        avatar.position.x = resolved.x;
        avatar.position.z = resolved.z;
      } else {
        onClearClickTarget();
      }
    }

    if (isMoving !== isMovingRef.current) {
      isMovingRef.current = isMoving;
      setIsMovingState(isMoving);
    }

    // Smooth rotation
    const diffRot = rotationTargetRef.current - avatar.rotation.y;
    const normDiff = Math.atan2(Math.sin(diffRot), Math.cos(diffRot));
    avatar.rotation.y += normDiff * Math.min(1, clampedDelta * 12);

    // Check distances to desk and doorway
    const distToDesk = Math.sqrt(avatar.position.x ** 2 + (avatar.position.z - 0.2) ** 2);
    setIsNearDesk(distToDesk < 1.45);

    const distToDoor = Math.sqrt(avatar.position.x ** 2 + (avatar.position.z - 2.5) ** 2);
    setIsNearDoor(distToDoor < 1.1);

    // Interior Camera: Elevated Cozy Third-Person View
    _camPos.set(
      avatar.position.x * 0.45,
      avatar.position.y + 3.2,
      avatar.position.z + 3.8
    );
    state.camera.position.lerp(_camPos, clampedDelta * 4.0);

    _lookTarget.set(avatar.position.x * 0.3, avatar.position.y + 0.9, avatar.position.z - 0.6);
    state.camera.lookAt(_lookTarget);
  });

  return (
    <group>
      {/* 1. Interior Ambient & Warm Cove Uplighting */}
      <ambientLight color="#fed7aa" intensity={0.5} />
      <hemisphereLight args={[0xfde68a, 0x1c1917, 0.65]} position={[0, 4, 0]} />

      {/* Warm Fireplace Hearth Point Light */}
      <pointLight
        ref={fireLightRef}
        color="#fb923c"
        intensity={2.8}
        distance={7.5}
        decay={2}
        position={[0, 0.7, -1.6]}
        castShadow
        shadow-bias={-0.001}
      />

      {/* Desk Reading Lamp Light */}
      <pointLight color="#fef08a" intensity={2.0} distance={4.5} decay={2} position={[0.4, 1.15, 0.2]} />

      {/* Cove Warm Glow Along Ceiling Beams */}
      <pointLight color="#f59e0b" intensity={1.2} distance={8.0} position={[0, 3.8, 0]} />

      {/* 2. Room Shell: Floor & Rug */}
      {/* Poly Haven PBR Parquet Wood Floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[7.2, 6.8]} />
        <meshStandardMaterial
          map={woodDiff}
          normalMap={woodNor}
          roughnessMap={woodRough}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* Large Center Cozy Fleece Rug */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0.1]} receiveShadow>
        <planeGeometry args={[4.2, 3.4]} />
        <meshStandardMaterial map={rugTex} roughness={0.95} />
      </mesh>

      {/* 3. Walls & Wainscoting */}
      {/* Back Wall with Panoramic Window Frame */}
      <group position={[0, 0, -3.4]}>
        {/* Lower wainscot wall under window */}
        <mesh position={[0, 0.35, 0]} material={timberMat} receiveShadow>
          <boxGeometry args={[7.2, 0.7, 0.2]} />
        </mesh>
        {/* Left wall flank */}
        <mesh position={[-3.0, 2.0, 0]} material={wallStuccoMat}>
          <boxGeometry args={[1.2, 2.6, 0.2]} />
        </mesh>
        {/* Right wall flank */}
        <mesh position={[3.0, 2.0, 0]} material={wallStuccoMat}>
          <boxGeometry args={[1.2, 2.6, 0.2]} />
        </mesh>
        {/* Upper lintel wall above window */}
        <mesh position={[0, 3.4, 0]} material={wallStuccoMat}>
          <boxGeometry args={[7.2, 0.8, 0.2]} />
        </mesh>

        {/* Floor-to-ceiling panoramic glass window looking outdoors */}
        <group position={[0, 1.85, 0.02]}>
          {/* Glass pane looking out onto misty sage garden */}
          <mesh>
            <planeGeometry args={[4.8, 2.3]} />
            <meshPhysicalMaterial
              color="#9bbab0"
              transparent
              opacity={0.48}
              roughness={0.2}
              metalness={0.08}
              clearcoat={1.0}
            />
          </mesh>

          {/* Window mullions / warm timber frame grid */}
          {[-1.6, 0, 1.6].map((wx, idx) => (
            <mesh key={`wm_${idx}`} position={[wx, 0, 0.02]} material={timberMat}>
              <boxGeometry args={[0.08, 2.3, 0.08]} />
            </mesh>
          ))}
          <mesh position={[0, 0, 0.02]} material={timberMat}>
            <boxGeometry args={[4.8, 0.08, 0.08]} />
          </mesh>

          {/* Soft sage horizon mist visible through glass */}
          <mesh position={[0, 0, -0.6]}>
            <planeGeometry args={[5.2, 2.5]} />
            <meshBasicMaterial color="#b9cfc6" transparent opacity={0.55} />
          </mesh>
        </group>
      </group>

      {/* Left Wall (Bookshelf Wall) */}
      <mesh position={[-3.5, 1.9, 0]} rotation-y={Math.PI / 2} material={wallStuccoMat}>
        <boxGeometry args={[6.8, 3.8, 0.2]} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[3.5, 1.9, 0]} rotation-y={-Math.PI / 2} material={wallStuccoMat}>
        <boxGeometry args={[6.8, 3.8, 0.2]} />
      </mesh>

      {/* Front Wall with Exit Doorway */}
      <group position={[0, 1.9, 3.4]}>
        <mesh position={[-2.2, 0, 0]} material={wallStuccoMat}>
          <boxGeometry args={[2.8, 3.8, 0.2]} />
        </mesh>
        <mesh position={[2.2, 0, 0]} material={wallStuccoMat}>
          <boxGeometry args={[2.8, 3.8, 0.2]} />
        </mesh>
        <mesh position={[0, 1.35, 0]} material={wallStuccoMat}>
          <boxGeometry args={[1.6, 1.1, 0.2]} />
        </mesh>
        {/* Door Frame & Rustic Exit Door */}
        <mesh position={[0, -0.55, 0.02]} material={timberMat}>
          <boxGeometry args={[1.4, 2.5, 0.1]} />
        </mesh>
        {/* Door Iron Ring */}
        <mesh position={[0.45, -0.55, 0.1]} material={metalStoveMat}>
          <torusGeometry args={[0.06, 0.015, 8, 12]} />
        </mesh>
        {/* Exit Door Rug */}
        <mesh position={[0, -1.88, -0.45]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.2, 0.6]} />
          <meshStandardMaterial color="#475569" roughness={0.9} />
        </mesh>
      </group>

      {/* 4. Vaulted Ceiling & Exposed Timber Beams */}
      <group position={[0, 3.7, 0]}>
        {/* Left Sloped Ceiling */}
        <mesh position={[-1.85, 0.45, 0]} rotation-z={-0.28} material={ceilingMat}>
          <boxGeometry args={[3.9, 0.12, 6.8]} />
        </mesh>
        {/* Right Sloped Ceiling */}
        <mesh position={[1.85, 0.45, 0]} rotation-z={0.28} material={ceilingMat}>
          <boxGeometry args={[3.9, 0.12, 6.8]} />
        </mesh>

        {/* Heavy A-frame Timber Ridge Beams */}
        {[-2.4, -0.8, 0.8, 2.4].map((bz, idx) => (
          <group key={`beam_${idx}`} position={[0, 0.2, bz]}>
            <mesh position={[-1.7, 0.35, 0]} rotation-z={-0.28} material={timberMat}>
              <boxGeometry args={[3.8, 0.2, 0.18]} />
            </mesh>
            <mesh position={[1.7, 0.35, 0]} rotation-z={0.28} material={timberMat}>
              <boxGeometry args={[3.8, 0.2, 0.18]} />
            </mesh>
            {/* Horizontal Tie Beam */}
            <mesh position={[0, -0.15, 0]} material={timberMat}>
              <boxGeometry args={[5.2, 0.16, 0.16]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 5. Modern Black Wood-Burning Fireplace Stove */}
      <group position={[0, 0, -2.0]}>
        {/* Slate Hearth Base */}
        <mesh position={[0, 0.04, 0]} material={metalStoveMat}>
          <boxGeometry args={[1.4, 0.08, 1.1]} />
        </mesh>

        {/* Stove Body */}
        <mesh position={[0, 0.65, 0]} material={metalStoveMat} castShadow>
          <boxGeometry args={[0.9, 1.0, 0.7]} />
        </mesh>

        {/* Firebox Glass Window with Glowing Fire Embers */}
        <mesh position={[0, 0.62, 0.36]} material={fireEmbersMat}>
          <planeGeometry args={[0.62, 0.55]} />
        </mesh>

        {/* Glowing Logs Inside */}
        <mesh position={[-0.15, 0.38, 0.1]} rotation-z={0.2} material={timberMat}>
          <cylinderGeometry args={[0.07, 0.07, 0.5, 8]} />
        </mesh>
        <mesh position={[0.15, 0.38, 0.1]} rotation-z={-0.2} material={timberMat}>
          <cylinderGeometry args={[0.07, 0.07, 0.5, 8]} />
        </mesh>

        {/* Black Chimney Stovepipe Rising Through Roof */}
        <mesh position={[0, 2.5, 0]} material={metalStoveMat}>
          <cylinderGeometry args={[0.13, 0.13, 2.8, 16]} />
        </mesh>
      </group>

      {/* 6. Wall-to-Wall Floor-to-Ceiling Bookshelves (Left Wall) */}
      <group position={[-3.1, 0, 0]} rotation-y={Math.PI / 2}>
        <mesh position={[0, 1.5, -0.1]} material={timberMat} castShadow>
          <boxGeometry args={[5.2, 3.0, 0.45]} />
        </mesh>

        {[0.4, 1.1, 1.8, 2.5].map((sy, idx) => (
          <group key={`sh_${idx}`} position={[0, sy, 0.12]}>
            <mesh position={[0, -0.04, 0]} material={timberMat}>
              <boxGeometry args={[5.0, 0.06, 0.4]} />
            </mesh>
            <mesh position={[0, 0.28, 0]}>
              <planeGeometry args={[4.8, 0.55]} />
              <meshStandardMaterial map={bookTex} roughness={0.7} />
            </mesh>
          </group>
        ))}

        <pointLight color="#fde68a" intensity={1.1} distance={3.8} position={[0, 2.7, 0.5]} />
      </group>

      {/* 7. REAL FURNITURE: Poly Haven CC0 Writing Desk & Notebook + Khronos Sheen Chair */}
      <group
        position={[0, 0, 0.2]}
        onClick={(e) => {
          e.stopPropagation();
          onOpenJournalModal();
        }}
      >
        {/* Real 3D Wooden Writing Desk (Poly Haven CC0: WoodenTable_01) */}
        <Suspense fallback={null}>
          <RealWritingDesk position={[0, 0, 0]} rotationY={0} scale={1.05} />
        </Suspense>

        {/* Real 3D Leather Journal Notebook (Poly Haven CC0: binder_notebook) */}
        <Suspense fallback={null}>
          <RealJournalNotebook position={[-0.15, 0.58, 0.05]} rotationY={-0.12} scale={1.15} />
        </Suspense>

        {/* Interactive Floating Pulse Ring above Journal */}
        <mesh position={[-0.15, 0.72, 0.05]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.08, 0.14, 16]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>

        {/* Real 3D Desk Reading Lamp (Khronos CC0: LightsPunctualLamp) */}
        <Suspense fallback={null}>
          <RealReadingLamp position={[0.55, 0.56, -0.15]} scale={0.24} />
        </Suspense>

        {/* Real 3D Ceramic Tea Mug (Three.js CC0: coffeeMug) */}
        <Suspense fallback={null}>
          <RealCoffeeMug position={[-0.45, 0.58, -0.1]} scale={0.035} />
        </Suspense>
      </group>

      {/* Real 3D Sheen Armchair (Khronos CC0: SheenChair) */}
      <Suspense fallback={null}>
        <RealSheenChair position={[1.35, 0, 0.2]} rotationY={-Math.PI / 4} scale={1.3} />
      </Suspense>

      {/* Real 3D Brass Lantern on Bookshelf (Khronos CC0: Lantern) */}
      <Suspense fallback={null}>
        <RealLantern position={[-2.4, 1.85, 0.2]} scale={0.035} />
      </Suspense>

      {/* Real 3D Botanical Plant (Khronos CC0: DiffuseTransmissionPlant) */}
      <Suspense fallback={null}>
        <RealBotanicalPlant position={[2.7, 0, -1.8]} scale={0.65} />
      </Suspense>

      {/* 8. Matching Stylized Traveler Avatar */}
      <group ref={avatarRef} position={[0, 0, 2.0]}>
        <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.36, 16]} />
          <meshBasicMaterial color="#1b261c" transparent opacity={0.3} />
        </mesh>
        <mesh position={[0, 0.026, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.35, 0.4, 24]} />
          <meshBasicMaterial color="#f8faf5" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>

        <StylizedTravelerCharacter robeColor={robeColor} isMoving={isMovingState} />
      </group>

      {/* 9. Interactive HUD Prompts inside Room */}
      {isNearDesk && (
        <group position={[0, 1.35, 0.2]}>
          <mesh>
            <planeGeometry args={[1.6, 0.38]} />
            <meshBasicMaterial color="#0f172a" transparent opacity={0.85} />
          </mesh>
        </group>
      )}

      {/* 10. Exit Door Interaction Area */}
      <mesh
        position={[0, 0.05, 2.5]}
        rotation-x={-Math.PI / 2}
        onClick={(e) => {
          e.stopPropagation();
          onExitToOutdoor();
        }}
      >
        <planeGeometry args={[1.6, 0.8]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.15} />
      </mesh>
    </group>
  );
};
