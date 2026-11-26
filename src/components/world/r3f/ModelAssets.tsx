import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF, useAnimations, useTexture } from '@react-three/drei';

// Preload valid GLB/GLTF models
useGLTF.preload('/assets/3d/character/Soldier.glb');
useGLTF.preload('/assets/3d/furniture/SheenChair.glb');
useGLTF.preload('/assets/3d/furniture/LightsPunctualLamp.glb');
useGLTF.preload('/assets/3d/furniture/Lantern.glb');
useGLTF.preload('/assets/3d/furniture/coffeeMug.glb');
useGLTF.preload('/assets/3d/furniture/Flower.glb');
useGLTF.preload('/assets/3d/furniture/DiffuseTransmissionPlant.glb');
useGLTF.preload('/assets/3d/furniture/WoodenTable_01/WoodenTable_01.gltf');
useGLTF.preload('/assets/3d/furniture/binder_notebook/binder_notebook.gltf');

const WOOD_PBR_PATHS = [
  '/assets/3d/textures/wood_planks_diff_1k.jpg',
  '/assets/3d/textures/wood_planks_nor_1k.jpg',
  '/assets/3d/textures/wood_planks_rough_1k.jpg',
] as const;

WOOD_PBR_PATHS.forEach((path) => useTexture.preload(path));

export function useSharedWoodPBRTextures(): [THREE.Texture, THREE.Texture, THREE.Texture] {
  const [woodDiff, woodNor, woodRough] = useTexture([...WOOD_PBR_PATHS]) as [
    THREE.Texture,
    THREE.Texture,
    THREE.Texture,
  ];

  return useMemo(() => {
    [woodDiff, woodNor, woodRough].forEach((tex) => {
      if (tex.wrapS !== THREE.RepeatWrapping || tex.wrapT !== THREE.RepeatWrapping) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(6, 5);
        tex.anisotropy = 8;
        tex.needsUpdate = true;
      }
    });
    if (woodDiff.colorSpace !== THREE.SRGBColorSpace) {
      woodDiff.colorSpace = THREE.SRGBColorSpace;
      woodDiff.needsUpdate = true;
    }
    return [woodDiff, woodNor, woodRough];
  }, [woodDiff, woodNor, woodRough]);
}

function useClonedGLTF(path: string, castShadow = true, receiveShadow = true): THREE.Group {
  const { scene } = useGLTF(path);
  return useMemo(() => {
    const cloned = scene.clone(true);
    const embeddedLights: THREE.Light[] = [];
    cloned.traverse((obj) => {
      if ((obj as THREE.Light).isLight) {
        const light = obj as THREE.Light;
        light.intensity = 0;
        light.visible = false;
        embeddedLights.push(light);
        return;
      }
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const clonedMats = mats.map((m) => {
          if (!m) return m;
          const std = m as THREE.MeshStandardMaterial;
          if (std.map && std.map.anisotropy < 8) {
            std.map.anisotropy = 8;
          }
          if (std.emissive && std.emissiveIntensity !== undefined && std.emissiveIntensity > 0.45) {
            const copy = std.clone();
            copy.emissiveIntensity = 0.45;
            return copy;
          }
          return m;
        });
        mesh.material = Array.isArray(mesh.material) ? clonedMats : clonedMats[0];
      }
    });
    embeddedLights.forEach((l) => l.parent?.remove(l));
    return cloned;
  }, [scene, castShadow, receiveShadow]);
}

const sharedTreeBarkMat = new THREE.MeshStandardMaterial({ color: 0x6b4d37, roughness: 0.92 });
const sharedTreeLeafDarkMat = new THREE.MeshStandardMaterial({ color: 0x3f7146, roughness: 0.84 });
const sharedTreeLeafMidMat = new THREE.MeshStandardMaterial({ color: 0x548b51, roughness: 0.8 });
const sharedTreeLeafSunMat = new THREE.MeshStandardMaterial({ color: 0x6ea35f, roughness: 0.78 });

// 0. Lightweight Botanical Deciduous Tree
export const RealBotanicalTree: React.FC<{
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
}> = ({ position = [0, 0, 0], rotationY = 0, scale = 1.0 }) => {
  const branches = useMemo(
    () => [
      { pos: [0.38, 2.05, 0.2] as [number, number, number], rotZ: -0.46, rotX: 0.22, len: 1.15, r: 0.085 },
      { pos: [-0.42, 2.18, -0.15] as [number, number, number], rotZ: 0.5, rotX: -0.18, len: 1.2, r: 0.085 },
      { pos: [0.1, 2.35, -0.36] as [number, number, number], rotZ: -0.18, rotX: -0.45, len: 1.05, r: 0.075 },
    ],
    []
  );

  const canopyClusters = useMemo(
    () => [
      { pos: [0, 3.05, 0] as [number, number, number], r: 1.05, tier: 1 },
      { pos: [0.78, 2.65, 0.42] as [number, number, number], r: 0.82, tier: 2 },
      { pos: [-0.82, 2.7, -0.25] as [number, number, number], r: 0.85, tier: 0 },
      { pos: [0.2, 2.8, -0.75] as [number, number, number], r: 0.78, tier: 2 },
      { pos: [-0.25, 2.65, 0.68] as [number, number, number], r: 0.76, tier: 1 },
      { pos: [0.12, 3.65, 0.08] as [number, number, number], r: 0.72, tier: 2 },
    ],
    []
  );

  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <mesh position={[0, 1.18, 0]} material={sharedTreeBarkMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.28, 2.36, 10]} />
      </mesh>
      <mesh position={[0, 0.2, 0]} material={sharedTreeBarkMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.28, 0.42, 0.42, 10]} />
      </mesh>

      {branches.map((b, i) => (
        <mesh
          key={`br_${i}`}
          position={b.pos}
          rotation={[b.rotX, 0, b.rotZ]}
          material={sharedTreeBarkMat}
          castShadow
        >
          <cylinderGeometry args={[b.r * 0.65, b.r, b.len, 8]} />
        </mesh>
      ))}

      {canopyClusters.map((c, i) => {
        const mat =
          c.tier === 2
            ? sharedTreeLeafSunMat
            : c.tier === 1
              ? sharedTreeLeafMidMat
              : sharedTreeLeafDarkMat;
        return (
          <mesh
            key={`lf_${i}`}
            position={c.pos}
            scale={[1.15, 0.84, 1.08]}
            material={mat}
            castShadow
            receiveShadow
          >
            <dodecahedronGeometry args={[c.r, 1]} />
          </mesh>
        );
      })}
    </group>
  );
};

// 1. Rigged Humanoid Avatar (Three.js CC0 Soldier / Traveler Model with Skeletal Animations)
export const RealHumanoidAvatar: React.FC<{
  isMoving: boolean;
  scale?: number;
}> = ({ isMoving, scale = 0.009 }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/assets/3d/character/Soldier.glb');
  const { actions } = useAnimations(animations, groupRef);

  useEffect(() => {
    if (scene) {
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });
    }
  }, [scene]);

  useEffect(() => {
    if (!actions) return;
    if (isMoving) {
      actions['Idle']?.fadeOut(0.2);
      actions['Walk']?.reset().fadeIn(0.2).play();
    } else {
      actions['Walk']?.fadeOut(0.2);
      actions['Idle']?.reset().fadeIn(0.2).play();
    }
  }, [isMoving, actions]);

  return (
    <group ref={groupRef} scale={scale} position={[0, 0, 0]} rotation-y={Math.PI}>
      <primitive object={scene} />
    </group>
  );
};

interface FurnitureProps {
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
}

const DEFAULT_POS: [number, number, number] = [0, 0, 0];

// 2. Real Rustic Wooden Writing Desk (Poly Haven CC0: WoodenTable_01)
export const RealWritingDesk: React.FC<FurnitureProps> = React.memo(
  ({ position = DEFAULT_POS, rotationY = 0, scale = 1.0 }) => {
    const cloned = useClonedGLTF('/assets/3d/furniture/WoodenTable_01/WoodenTable_01.gltf', true, true);
    return (
      <group position={position} rotation-y={rotationY} scale={scale}>
        <primitive object={cloned} />
      </group>
    );
  }
);

// 3. Real 3D Journal Notebook (Poly Haven CC0: binder_notebook)
export const RealJournalNotebook: React.FC<FurnitureProps> = React.memo(
  ({ position = DEFAULT_POS, rotationY = 0, scale = 1.2 }) => {
    const cloned = useClonedGLTF('/assets/3d/furniture/binder_notebook/binder_notebook.gltf', true, true);
    return (
      <group position={position} rotation-y={rotationY} scale={scale}>
        <primitive object={cloned} />
      </group>
    );
  }
);

// 4. Real 3D Upholstered Sheen Armchair (Khronos CC0: SheenChair)
export const RealSheenChair: React.FC<FurnitureProps> = React.memo(
  ({ position = DEFAULT_POS, rotationY = 0, scale = 1.4 }) => {
    const cloned = useClonedGLTF('/assets/3d/furniture/SheenChair.glb', true, true);
    return (
      <group position={position} rotation-y={rotationY} scale={scale}>
        <primitive object={cloned} />
      </group>
    );
  }
);

// 5. Real 3D Reading Lamp (Khronos CC0: LightsPunctualLamp)
export const RealReadingLamp: React.FC<FurnitureProps> = React.memo(
  ({ position = DEFAULT_POS, rotationY = 0, scale = 0.28 }) => {
    const cloned = useClonedGLTF('/assets/3d/furniture/LightsPunctualLamp.glb', true, false);
    return (
      <group position={position} rotation-y={rotationY} scale={scale}>
        <primitive object={cloned} />
      </group>
    );
  }
);

// 6. Real 3D Brass & Glass Lantern (Khronos CC0: Lantern)
export const RealLantern: React.FC<FurnitureProps> = React.memo(
  ({ position = DEFAULT_POS, rotationY = 0, scale = 0.04 }) => {
    const cloned = useClonedGLTF('/assets/3d/furniture/Lantern.glb', true, false);
    return (
      <group position={position} rotation-y={rotationY} scale={scale}>
        <primitive object={cloned} />
      </group>
    );
  }
);

// 7. Real 3D Ceramic Tea Mug (Three.js CC0: coffeeMug)
export const RealCoffeeMug: React.FC<FurnitureProps> = React.memo(
  ({ position = DEFAULT_POS, rotationY = 0, scale = 0.035 }) => {
    const cloned = useClonedGLTF('/assets/3d/furniture/coffeeMug.glb', true, false);
    return (
      <group position={position} rotation-y={rotationY} scale={scale}>
        <primitive object={cloned} />
      </group>
    );
  }
);

// 8. Real Botanical Plant (Khronos CC0: DiffuseTransmissionPlant)
export const RealBotanicalPlant: React.FC<FurnitureProps> = React.memo(
  ({ position = DEFAULT_POS, rotationY = 0, scale = 0.55 }) => {
    const cloned = useClonedGLTF('/assets/3d/furniture/DiffuseTransmissionPlant.glb', true, true);
    return (
      <group position={position} rotation-y={rotationY} scale={scale}>
        <primitive object={cloned} />
      </group>
    );
  }
);

// 9. Real 3D Flower (Three.js CC0: Flower)
export const RealFlower: React.FC<FurnitureProps> = React.memo(
  ({ position = DEFAULT_POS, rotationY = 0, scale = 0.25 }) => {
    const cloned = useClonedGLTF('/assets/3d/furniture/Flower.glb', false, false);
    return (
      <group position={position} rotation-y={rotationY} scale={scale}>
        <primitive object={cloned} />
      </group>
    );
  }
);

