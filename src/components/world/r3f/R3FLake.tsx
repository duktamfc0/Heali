import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { getWaterRippleTexture, getWoodPlankTexture } from '../ProceduralTextures';
import {
  LAKE_CENTER,
  LAKE_RADIUS_X,
  LAKE_RADIUS_Z,
  WORLD_BRIDGES,
  streamCenterX,
} from './worldLayout';
import { ArchedWoodenBridgeR3F } from './R3FNature';

export interface FloatingLanternData {
  id: string;
  x: number;
  z: number;
}

export const ReflectiveLake: React.FC<{
  onSelectLantern?: (id: string) => void;
}> = ({ onSelectLantern }) => {
  const rippleTex = useMemo(() => {
    const t = getWaterRippleTexture();
    t.repeat.set(10, 10);
    return t;
  }, []);

  const streamRippleTex = useMemo(() => {
    const t = getWaterRippleTexture();
    t.repeat.set(2.5, 24);
    return t;
  }, []);

  const foamMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const woodTex = getWoodPlankTexture();
  const woodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85 }),
    [woodTex]
  );
  const brassMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xd99b43, metalness: 0.7, roughness: 0.28 }),
    []
  );

  // Build meandering brook water ribbon BufferGeometry matching streamCenterX(z)
  const streamGeo = useMemo(() => {
    const zStart = -48;
    const zEnd = 28;
    const segs = 80;
    const halfWidth = 3.4;

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const z = THREE.MathUtils.lerp(zStart, zEnd, t);
      const cx = streamCenterX(z);
      const nextCx = streamCenterX(z + 0.5);
      const slope = (nextCx - cx) / 0.5;
      const invNorm = 1 / Math.sqrt(1 + slope * slope);
      // Perpendicular vector across stream
      const nx = invNorm;
      const nz = -slope * invNorm;

      positions.push(cx - nx * halfWidth, 0.025, z - nz * halfWidth);
      positions.push(cx + nx * halfWidth, 0.025, z + nz * halfWidth);
      uvs.push(0, t * 12, 1, t * 12);

      if (i < segs) {
        const base = i * 2;
        indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Animate gentle water current flow & waterfall foam pulse
  useFrame((state, delta) => {
    const dt = Math.min(0.05, delta);
    rippleTex.offset.x += dt * 0.012;
    rippleTex.offset.y += dt * 0.008;
    streamRippleTex.offset.y -= dt * 0.14;
    if (foamMatRef.current) {
      foamMatRef.current.opacity = 0.55 + Math.sin(state.clock.getElapsedTime() * 3.5) * 0.14;
    }
  });

  // Floating glowing lantern pods across Ho Hoa Dang
  const lanterns: FloatingLanternData[] = useMemo(() => {
    const coords: Array<[number, number]> = [
      [-5.2, 31.4],
      [-2.1, 33.2],
      [3.4, 31.8],
      [7.8, 33.6],
      [-8.6, 35.8],
      [1.8, 36.2],
      [-4.9, 37.8],
      [6.4, 37.5],
      [-11.2, 32.5],
      [-12.8, 36.8],
      [10.5, 35.2],
      [11.8, 30.8],
      [-6.5, 41.2],
      [4.5, 41.5],
      [-1.5, 29.4],
      [8.2, 39.8],
    ];
    return coords.map(([x, z], i) => ({ id: `pod_${i}`, x, z }));
  }, []);

  const cascadeX = streamCenterX(-47);

  // Sculpted swimming golden koi orbits in Ho Hoa Dang
  const koiGroupRef = useRef<THREE.Group>(null);
  const koiSpecs = useMemo(
    () => [
      { cx: -3.2, cz: 30.2, r: 2.1, speed: 0.42, phase: 0, color: '#f97316' },
      { cx: 4.5, cz: 31.8, r: 2.6, speed: 0.36, phase: 1.8, color: '#fb923c' },
      { cx: -6.8, cz: 35.5, r: 2.4, speed: 0.45, phase: 3.1, color: '#fef3c7' },
      { cx: 6.2, cz: 36.2, r: 1.9, speed: 0.5, phase: 4.4, color: '#ea580c' },
      { cx: 1.2, cz: 27.2, r: 1.7, speed: 0.48, phase: 2.3, color: '#fdba74' },
    ],
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (koiGroupRef.current) {
      koiGroupRef.current.children.forEach((koi, idx) => {
        const spec = koiSpecs[idx];
        if (!spec) return;
        const ang = t * spec.speed + spec.phase;
        koi.position.set(
          spec.cx + Math.cos(ang) * spec.r,
          0.035 + Math.sin(t * 2.2 + idx) * 0.008,
          spec.cz + Math.sin(ang) * spec.r * 0.72
        );
        koi.rotation.y = -ang;
      });
    }
  });

  // Curved stepping stone bridge from pier/shore toward waterside pavilion (-11, 29)
  const steppingStones = useMemo(() => {
    const stones: Array<{ x: number; z: number; rot: number; scale: number }> = [];
    const count = 9;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const x = THREE.MathUtils.lerp(-14.2, -7.8, t);
      const z = THREE.MathUtils.lerp(28.5, 25.4, t) + Math.sin(t * Math.PI) * 2.2;
      stones.push({ x, z, rot: t * 1.4, scale: 0.42 + (i % 2) * 0.08 });
    }
    return stones;
  }, []);

  return (
    <group>
      {/* 1. Ho Hoa Dang Lake Water Disc */}
      <mesh
        position={[LAKE_CENTER.x, 0.02, LAKE_CENTER.z]}
        rotation-x={-Math.PI / 2}
        scale={[LAKE_RADIUS_X + 2.8, LAKE_RADIUS_Z + 2.4, 1]}
        receiveShadow
      >
        <circleGeometry args={[1, 64]} />
        <meshStandardMaterial
          color="#2f6659"
          roughness={0.12}
          metalness={0.32}
          envMapIntensity={1.25}
          normalMap={rippleTex}
          normalScale={new THREE.Vector2(0.28, 0.28)}
        />
      </mesh>

      {/* 2. Flowing Winding Mountain Brook */}
      <mesh geometry={streamGeo} receiveShadow>
        <meshStandardMaterial
          color="#3e7668"
          roughness={0.12}
          metalness={0.28}
          envMapIntensity={1.2}
          normalMap={streamRippleTex}
          normalScale={new THREE.Vector2(0.32, 0.32)}
        />
      </mesh>

      {/* 3A. North-East Multi-Tiered Mountain Cascade Waterfall & Splash Pool */}
      <group position={[cascadeX, 0.04, -47.5]} rotation-y={-0.38}>
        {/* Mossy limestone crag backing cliff */}
        <mesh position={[0, 2.2, -2.1]} scale={[2.6, 2.5, 1.3]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.6, 1]} />
          <meshStandardMaterial color="#67726a" roughness={0.92} />
        </mesh>
        <mesh position={[-2.2, 1.4, -1.4]} scale={[1.4, 1.6, 1.2]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.3, 1]} />
          <meshStandardMaterial color="#58665d" roughness={0.92} />
        </mesh>
        <mesh position={[2.2, 1.3, -1.2]} scale={[1.4, 1.5, 1.2]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.2, 1]} />
          <meshStandardMaterial color="#5c6960" roughness={0.92} />
        </mesh>

        {/* Upper cliff chute */}
        <mesh position={[0, 2.35, -1.35]} rotation-x={0.42}>
          <planeGeometry args={[2.6, 3.2]} />
          <meshStandardMaterial
            color="#d9f3ec"
            emissive="#9cd1c3"
            emissiveIntensity={0.32}
            roughness={0.12}
            transparent
            opacity={0.82}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Mid ledge cascade */}
        <mesh position={[0, 1.05, -0.45]} rotation-x={0.38}>
          <planeGeometry args={[3.2, 2.1]} />
          <meshStandardMaterial
            color="#eafaf5"
            emissive="#b5e0d4"
            emissiveIntensity={0.34}
            roughness={0.12}
            transparent
            opacity={0.86}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Splash Pool Foam Rings */}
        <mesh position={[0, 0.05, 0.75]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.9, 2.5, 24]} />
          <meshBasicMaterial
            ref={foamMatRef}
            color="#eefbf6"
            transparent
            opacity={0.6}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 0.55, 0.25]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[2.3, 20]} />
          <meshBasicMaterial color="#e6f7f2" transparent opacity={0.22} depthWrite={false} />
        </mesh>
      </group>

      {/* 3B. Western Mountain Pine Cliff Waterfall Behind Phong Tam Linh */}
      <group position={[-25.5, 2.1, -43.5]} rotation-y={0.45}>
        <mesh position={[0, 2.1, -1.8]} scale={[2.4, 2.8, 1.2]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.5, 1]} />
          <meshStandardMaterial color="#627068" roughness={0.92} />
        </mesh>
        <mesh position={[0, 1.85, -0.8]} rotation-x={0.32}>
          <planeGeometry args={[2.1, 3.9]} />
          <meshStandardMaterial
            color="#e2f6f0"
            emissive="#aad9ce"
            emissiveIntensity={0.32}
            roughness={0.14}
            transparent
            opacity={0.82}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0.08, 0.35]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[2.1, 20]} />
          <meshStandardMaterial color="#488477" roughness={0.15} metalness={0.25} />
        </mesh>
        <mesh position={[0, 0.14, 0.4]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.7, 1.75, 20]} />
          <meshBasicMaterial color="#f0fdf9" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      </group>

      {/* 4. Two Arched Timber & Stone Bridges Spanning the Brook */}
      {WORLD_BRIDGES.map((b) => (
        <ArchedWoodenBridgeR3F
          key={b.id}
          position={[b.x, b.baseY, b.z]}
          rotationY={b.rotY}
          length={b.length}
          width={b.width}
          archHeight={b.archHeight}
        />
      ))}

      {/* 4B. Waterside Golden Sunset Tea Pavilion & Curved Stepping-Stone Bridge (Panel 2) */}
      <group
        position={[-14.5, 0.16, 28.8]}
        rotation-y={0.62}
        onClick={(e) => {
          e.stopPropagation();
          onSelectLantern?.('pavilion');
        }}
      >
        <mesh position={[0, 0.12, 0]} material={woodMat} castShadow receiveShadow>
          <boxGeometry args={[3.4, 0.14, 3.4]} />
        </mesh>
        {[
          [-1.35, -1.35],
          [1.35, -1.35],
          [-1.35, 1.35],
          [1.35, 1.35],
        ].map(([px, pz], idx) => (
          <React.Fragment key={`wp_${idx}`}>
            <mesh position={[px, -0.42, pz]} material={woodMat}>
              <cylinderGeometry args={[0.075, 0.085, 1.0, 8]} />
            </mesh>
            <mesh position={[px, 1.15, pz]} material={brassMat} castShadow>
              <cylinderGeometry args={[0.065, 0.08, 2.05, 8]} />
            </mesh>
          </React.Fragment>
        ))}
        {/* Curved Golden Two-Tier Pavilion Eaves */}
        <mesh position={[0, 2.38, 0]} rotation-y={Math.PI / 4} castShadow>
          <coneGeometry args={[2.95, 0.78, 4]} />
          <meshStandardMaterial color="#b9833a" roughness={0.65} metalness={0.22} />
        </mesh>
        <mesh position={[0, 2.86, 0]} rotation-y={Math.PI / 4} castShadow>
          <coneGeometry args={[1.75, 0.72, 4]} />
          <meshStandardMaterial color="#d49e4f" roughness={0.55} metalness={0.28} />
        </mesh>
        {/* Warm Pavilion Paper Lantern */}
        <mesh position={[0, 1.75, 0]}>
          <sphereGeometry args={[0.2, 10, 8]} />
          <meshStandardMaterial color="#fffbeb" emissive="#fbbf24" emissiveIntensity={0.95} />
        </mesh>
      </group>

      {steppingStones.map((st, idx) => (
        <mesh
          key={`step_stone_${idx}`}
          position={[st.x, 0.06, st.z]}
          rotation-y={st.rot}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[st.scale, st.scale * 1.08, 0.14, 9]} />
          <meshStandardMaterial color="#b4aba0" roughness={0.85} />
        </mesh>
      ))}

      {/* 5. Rustic Wooden Lakeside Pier Entering Ho Hoa Dang */}
      <group
        position={[0, 0.24, 19.6]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectLantern?.('pier');
        }}
      >
        {Array.from({ length: 16 }).map((_, idx) => {
          const pz = idx * 0.45;
          return (
            <mesh
              key={`plank_${idx}`}
              position={[0, 0.14, pz]}
              material={woodMat}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[2.15, 0.08, 0.39]} />
            </mesh>
          );
        })}

        <mesh position={[-0.95, 0.07, 3.4]} material={woodMat} castShadow>
          <boxGeometry args={[0.12, 0.12, 7.2]} />
        </mesh>
        <mesh position={[0.95, 0.07, 3.4]} material={woodMat} castShadow>
          <boxGeometry args={[0.12, 0.12, 7.2]} />
        </mesh>

        {[
          [-1.0, 0.2],
          [1.0, 0.2],
          [-1.0, 3.4],
          [1.0, 3.4],
          [-1.0, 6.8],
          [1.0, 6.8],
        ].map(([px, pz], idx) => (
          <group key={`post_${idx}`} position={[px, 0.15, pz]}>
            <mesh material={woodMat} castShadow>
              <cylinderGeometry args={[0.08, 0.095, 1.15, 8]} />
            </mesh>
            {idx >= 4 && (
              <group position={[0, 0.62, 0]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.11, 0.12, 0.2, 8]} />
                  <meshStandardMaterial
                    color="#fffbeb"
                    emissive="#f6c56e"
                    emissiveIntensity={0.75}
                    roughness={0.3}
                  />
                </mesh>
                <pointLight color="#fde68a" intensity={1.1} distance={6.5} />
              </group>
            )}
          </group>
        ))}
      </group>

      {/* 6. Moored Wooden Rowboat Gently Bobbing Beside Pier */}
      <Float speed={1.1} rotationIntensity={0.05} floatIntensity={0.08}>
        <group
          position={[2.6, 0.08, 25.4]}
          rotation-y={-0.42}
          onClick={(e) => {
            e.stopPropagation();
            onSelectLantern?.('boat');
          }}
        >
          <mesh scale={[0.85, 0.36, 1.75]} material={woodMat} castShadow receiveShadow>
            <sphereGeometry args={[0.75, 14, 10, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58]} />
          </mesh>
          <mesh position={[0, 0.05, -0.25]} material={woodMat} castShadow>
            <boxGeometry args={[0.88, 0.05, 0.24]} />
          </mesh>
          <mesh position={[0, 0.05, 0.32]} material={woodMat} castShadow>
            <boxGeometry args={[0.82, 0.05, 0.24]} />
          </mesh>
          <mesh position={[0, 0.18, -0.92]} material={brassMat}>
            <cylinderGeometry args={[0.06, 0.07, 0.16, 8]} />
          </mesh>
          <mesh position={[0, 0.18, -0.92]}>
            <sphereGeometry args={[0.052, 8, 8]} />
            <meshStandardMaterial color="#fffbeb" emissive="#fbbf24" emissiveIntensity={0.95} />
          </mesh>
        </group>
      </Float>

      {/* 6B. Graceful Swimming Golden Koi Beneath Ho Hoa Dang Surface */}
      <group ref={koiGroupRef}>
        {koiSpecs.map((spec, idx) => (
          <group key={`koi_${idx}`}>
            <mesh scale={[0.14, 0.08, 0.42]}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshStandardMaterial color={spec.color} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0, -0.34]} rotation-y={Math.PI / 2}>
              <coneGeometry args={[0.1, 0.22, 4]} />
              <meshStandardMaterial color={spec.color} roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 7. Floating Candle Raft Pods Across Lake */}
      {lanterns.map((lan, idx) => (
        <Float
          key={lan.id}
          speed={1.25 + (idx % 3) * 0.22}
          rotationIntensity={0.08}
          floatIntensity={0.14}
        >
          <group
            position={[lan.x, 0.06, lan.z]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectLantern?.(lan.id);
            }}
          >
            <mesh position={[0, -0.02, 0]} rotation-x={-Math.PI / 2}>
              <ringGeometry args={[0.45, 0.65, 20]} />
              <meshBasicMaterial color="#d8efe3" transparent opacity={0.22} depthWrite={false} />
            </mesh>
            <mesh receiveShadow castShadow>
              <cylinderGeometry args={[0.42, 0.36, 0.09, 16]} />
              <meshStandardMaterial color="#b28c62" roughness={0.85} metalness={0.04} />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.28, 0.28, 0.04, 14]} />
              <meshStandardMaterial color="#96724c" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.15, 0]} castShadow>
              <sphereGeometry args={[0.15, 12, 10]} />
              <meshStandardMaterial
                color="#fffbeb"
                emissive="#fde68a"
                emissiveIntensity={1.0}
                roughness={0.28}
              />
            </mesh>
          </group>
        </Float>
      ))}
    </group>
  );
};
