import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import {
  groundHeightAt,
  distanceToStream,
  lakeNormDist,
  PATH_ROUTES,
  streamCenterX,
  LAKE_CENTER,
  LAKE_RADIUS_X,
  LAKE_RADIUS_Z,
} from './worldLayout';
import { getSunlitCobbleTexture, getStoneFoundationTexture } from '../ProceduralTextures';

export { groundHeightAt } from './worldLayout';

// Curved 3-blade botanical grass clump geometry
function createGrassClumpGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const bladeAngles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
  let vertOffset = 0;

  bladeAngles.forEach((angle, bIdx) => {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const lean = 0.1 + bIdx * 0.025;
    const h = 0.34 + (bIdx % 2) * 0.08;
    const w = 0.048;

    const pts = [
      [-w * sinA, 0, w * cosA],
      [w * sinA, 0, -w * cosA],
      [-w * 0.55 * sinA + lean * 0.4 * cosA, h * 0.55, w * 0.55 * cosA + lean * 0.4 * sinA],
      [w * 0.55 * sinA + lean * 0.4 * cosA, h * 0.55, -w * 0.55 * cosA + lean * 0.4 * sinA],
      [lean * cosA, h, lean * sinA],
    ];
    pts.forEach((p, idx) => {
      positions.push(p[0], p[1], p[2]);
      normals.push(cosA * 0.25, 0.92, sinA * 0.25);
      uvs.push(idx % 2, idx < 2 ? 0 : idx < 4 ? 0.5 : 1);
    });

    indices.push(
      vertOffset + 0, vertOffset + 1, vertOffset + 2,
      vertOffset + 1, vertOffset + 3, vertOffset + 2,
      vertOffset + 2, vertOffset + 3, vertOffset + 4
    );
    vertOffset += 5;
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// Sculpted Layered Limestone Karst Mountain Range Framing the Horizon (r = 86 .. 192)
const DistantMountainRange: React.FC = () => {
  const { mountainGeo, mountainMat } = useMemo(() => {
    const radialSegs = 128;
    const ringSegs = 16;
    const innerR = 86;
    const outerR = 192;

    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const footEmerald = new THREE.Color('#3f6142');
    const lushSlope = new THREE.Color('#4c724c');
    const karstGranite = new THREE.Color('#6b7b72');
    const ridgeBlue = new THREE.Color('#869da6');
    const mistPeak = new THREE.Color('#dbe8ea');

    for (let rIdx = 0; rIdx <= ringSegs; rIdx++) {
      const rt = rIdx / ringSegs;
      const radius = THREE.MathUtils.lerp(innerR, outerR, rt);
      // Multi-ridge envelope creating foreground & far limestone mountain chains
      const mainEnvelope = Math.sin(rt * Math.PI * 0.94);
      const subRidge = Math.abs(Math.sin(rt * Math.PI * 2.2)) * 0.35;

      for (let aIdx = 0; aIdx <= radialSegs; aIdx++) {
        const angle = (aIdx / radialSegs) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        // Towering limestone karst spires on North, North-East & Southern horizon
        const northBias = Math.max(0, -Math.sin(angle)) * 15;
        const karstSpire = Math.pow(Math.abs(Math.sin(angle * 4.5 + 0.3 + rt * 1.4)), 1.8) * 26;
        const cragDetail = Math.abs(Math.cos(angle * 11.0 - rt * 3.1)) * 11.5;
        const rockShelf = Math.sin(angle * 19.0 + rt * 6.0) * 3.8;
        const y = -2.0 + (mainEnvelope + subRidge) * (15 + karstSpire + cragDetail + rockShelf + northBias);

        positions.push(x, y, z);

        const c = footEmerald.clone();
        if (y > 38) {
          c.copy(ridgeBlue).lerp(mistPeak, THREE.MathUtils.clamp((y - 38) / 18, 0, 1));
        } else if (y > 24) {
          c.copy(karstGranite).lerp(ridgeBlue, (y - 24) / 14);
        } else if (y > 10) {
          c.copy(lushSlope).lerp(karstGranite, (y - 10) / 14);
        } else {
          c.lerp(lushSlope, THREE.MathUtils.clamp(y / 10, 0, 1));
        }
        c.toArray(colors, (rIdx * (radialSegs + 1) + aIdx) * 3);
      }
    }

    for (let rIdx = 0; rIdx < ringSegs; rIdx++) {
      for (let aIdx = 0; aIdx < radialSegs; aIdx++) {
        const a = rIdx * (radialSegs + 1) + aIdx;
        const b = a + radialSegs + 1;
        const c = a + 1;
        const d = b + 1;
        indices.push(a, b, c, c, b, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.02,
      flatShading: true,
    });

    return { mountainGeo: geo, mountainMat: mat };
  }, []);

  return <mesh geometry={mountainGeo} material={mountainMat} receiveShadow />;
};

// Continuous Curving Cobblestone Pathway Ribbons + Scenic Cliffside Wooden-Railed Stairs
const WindingCobblePaths: React.FC = () => {
  const cobbleTex = useMemo(() => {
    const tex = getSunlitCobbleTexture();
    tex.repeat.set(1.2, 6);
    return tex;
  }, []);

  const pathMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: cobbleTex,
        roughness: 0.88,
        metalness: 0.02,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    [cobbleTex]
  );

  const routeMeshes = useMemo(() => {
    return PATH_ROUTES.map((pts) => {
      const curve = new THREE.CatmullRomCurve3(pts);
      const length = curve.getLength();
      const segs = Math.max(20, Math.round(length * 2.2));
      const width = 1.65;
      const halfW = width / 2;

      const positions: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];
      const sampled = curve.getSpacedPoints(segs);

      for (let i = 0; i <= segs; i++) {
        const p = sampled[i];
        const nextP = sampled[Math.min(segs, i + 1)];
        const prevP = sampled[Math.max(0, i - 1)];
        const tangent = new THREE.Vector3().subVectors(nextP, prevP);
        tangent.y = 0;
        if (tangent.lengthSq() < 0.0001) tangent.set(0, 0, 1);
        tangent.normalize();

        const side = new THREE.Vector3(-tangent.z, 0, tangent.x);
        const lx = p.x - side.x * halfW;
        const lz = p.z - side.z * halfW;
        const rx = p.x + side.x * halfW;
        const rz = p.z + side.z * halfW;

        const ly = groundHeightAt(lx, lz) + 0.035;
        const ry = groundHeightAt(rx, rz) + 0.035;

        positions.push(lx, ly, lz, rx, ry, rz);
        const vCoord = (i / segs) * (length / 4.2);
        uvs.push(0, vCoord, 1, vCoord);

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
    });
  }, []);

  // Carved Stone & Timber Cliffside Stairs ascending to Phong Tam Linh (-10.5,-18.5 -> -15.5,-29.0)
  const { hillStairs, railGeoL, railGeoR } = useMemo(() => {
    const start = new THREE.Vector3(-10.5, 0, -18.5);
    const end = new THREE.Vector3(-15.5, 0, -29.0);
    const count = 18;
    const steps: Array<{ x: number; y: number; z: number; rotY: number; hasPost: boolean }> = [];
    const rotY = Math.atan2(end.x - start.x, end.z - start.z);
    const perpX = Math.cos(rotY) * 1.05;
    const perpZ = -Math.sin(rotY) * 1.05;
    const ptsL: THREE.Vector3[] = [];
    const ptsR: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const sx = THREE.MathUtils.lerp(start.x, end.x, t);
      const sz = THREE.MathUtils.lerp(start.z, end.z, t);
      const sy = groundHeightAt(sx, sz) + 0.06;
      steps.push({ x: sx, y: sy, z: sz, rotY, hasPost: i % 3 === 0 || i === count - 1 });
      ptsL.push(new THREE.Vector3(sx - perpX, sy + 0.85, sz - perpZ));
      ptsR.push(new THREE.Vector3(sx + perpX, sy + 0.85, sz + perpZ));
    }

    return {
      hillStairs: steps,
      railGeoL: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsL), 24, 0.045, 7, false),
      railGeoR: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsR), 24, 0.045, 7, false),
    };
  }, []);

  const stoneMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: getStoneFoundationTexture(), roughness: 0.88 }),
    []
  );
  const railWoodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x6e472d, roughness: 0.82 }),
    []
  );

  return (
    <group>
      {routeMeshes.map((geo, idx) => (
        <mesh key={`trail_${idx}`} geometry={geo} material={pathMat} receiveShadow />
      ))}

      {hillStairs.map((st, idx) => (
        <group key={`hill_stair_${idx}`} position={[st.x, st.y, st.z]} rotation-y={st.rotY}>
          <mesh material={stoneMat} castShadow receiveShadow>
            <boxGeometry args={[2.05, 0.14, 0.56]} />
          </mesh>
          {st.hasPost && (
            <>
              <mesh position={[-1.05, 0.44, 0]} material={railWoodMat} castShadow>
                <cylinderGeometry args={[0.045, 0.055, 0.9, 7]} />
              </mesh>
              <mesh position={[1.05, 0.44, 0]} material={railWoodMat} castShadow>
                <cylinderGeometry args={[0.045, 0.055, 0.9, 7]} />
              </mesh>
            </>
          )}
        </group>
      ))}
      <mesh geometry={railGeoL} material={railWoodMat} castShadow />
      <mesh geometry={railGeoR} material={railWoodMat} castShadow />
    </group>
  );
};

// Precompute rough avoidance for flora placement so tufts don't poke inside houses or water
function isBlockedForFlora(x: number, z: number): boolean {
  if (lakeNormDist(x, z) < 1.03) return true;
  if (distanceToStream(x, z) < 3.1 && z > -52 && z < 32) return true;
  if (Math.hypot(x, z + 4) < 3.8) return true;
  if (Math.hypot(x + 32, z + 2) < 4.0) return true;
  if (Math.hypot(x + 28, z - 24) < 2.6) return true;
  if (Math.hypot(x + 16, z + 34) < 3.8) return true;
  if (Math.hypot(x - 44, z + 22) < 3.6) return true;
  if (Math.hypot(x - 40, z - 12) < 3.8) return true;
  if (Math.hypot(x - 26, z - 32) < 3.8) return true;
  return false;
}

export const SculptedTerrain: React.FC<{ isSoftwareGl?: boolean }> = ({ isSoftwareGl = false }) => {
  const [grassDiff, grassNor, grassRough] = useLoader(THREE.TextureLoader, [
    '/assets/3d/textures/grass_diff_1k.jpg',
    '/assets/3d/textures/grass_nor_1k.jpg',
    '/assets/3d/textures/grass_rough_1k.jpg',
  ]);

  useMemo(() => {
    [grassDiff, grassNor, grassRough].forEach((tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(34, 34);
      tex.anisotropy = 4;
    });
    grassDiff.colorSpace = THREE.SRGBColorSpace;
  }, [grassDiff, grassNor, grassRough]);

  const { valleyGeo, valleyMat } = useMemo(() => {
    const segs = isSoftwareGl ? 96 : 144;
    const plane = new THREE.PlaneGeometry(196, 196, segs, segs);
    plane.rotateX(-Math.PI / 2);

    const pos = plane.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const sunlitMeadow = new THREE.Color('#8ea25a');
    const lushGrass = new THREE.Color('#708a49');
    const pineSlope = new THREE.Color('#536e4a');
    const dampMoss = new THREE.Color('#5f784c');
    const riverbedSand = new THREE.Color('#a89b7c');

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = groundHeightAt(x, z);
      pos.setY(i, y);

      const dLake = lakeNormDist(x, z);
      const dStream = distanceToStream(x, z);

      if (y < 0.08 || (dStream < 2.6 && z > -50 && z < 32) || dLake < 1.04) {
        const wetT = THREE.MathUtils.clamp((y + 0.3) / 0.55, 0, 1);
        riverbedSand.clone().lerp(dampMoss, wetT * 0.75).toArray(colors, i * 3);
      } else if (y > 2.2) {
        const slopeT = THREE.MathUtils.clamp((y - 2.2) / 5.0, 0, 1);
        lushGrass.clone().lerp(pineSlope, slopeT).toArray(colors, i * 3);
      } else {
        const blend = 0.5 + 0.5 * Math.sin(x * 0.14 + z * 0.12);
        lushGrass.clone().lerp(sunlitMeadow, blend).toArray(colors, i * 3);
      }
    }

    plane.computeVertexNormals();
    plane.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      map: grassDiff,
      normalMap: grassNor,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughnessMap: grassRough,
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.02,
    });

    return { valleyGeo: plane, valleyMat: mat };
  }, [grassDiff, grassNor, grassRough, isSoftwareGl]);

  // 1. Sculpted River & Lake Boulders (InstancedMesh)
  const boulderRef = useRef<THREE.InstancedMesh>(null);
  const bouldersData = useMemo(() => {
    const items: Array<{ x: number; y: number; z: number; sx: number; sy: number; sz: number; ry: number; color: string }> = [];
    const palette = ['#8f968f', '#7c847d', '#a2a79e', '#6f7872', '#95998c'];

    // Stream bank boulders along winding brook
    for (let i = 0; i < 64; i++) {
      const z = -48 + (i / 64) * 76;
      const side = i % 2 === 0 ? -1 : 1;
      const offset = 2.7 + (i % 5) * 0.35;
      const x = streamCenterX(z) + side * offset;
      const y = groundHeightAt(x, z) + 0.12;
      const s = 0.45 + (i % 4) * 0.25;
      items.push({
        x, y, z,
        sx: s * 1.25, sy: s * 0.65, sz: s * 0.95,
        ry: (i * 0.85) % Math.PI,
        color: palette[i % palette.length],
      });
    }

    // Waterfall cliff rocks at NE spring (x ~ 50, z ~ -47)
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 1.4 - 0.5;
      const rad = 3.2 + (i % 3) * 1.3;
      const x = streamCenterX(-47) + Math.cos(angle) * rad;
      const z = -47 + Math.sin(angle) * rad;
      const y = groundHeightAt(x, z) + (i % 3) * 0.55;
      const s = 1.1 + (i % 4) * 0.42;
      items.push({
        x, y, z,
        sx: s * 1.3, sy: s * 0.95, sz: s * 1.1,
        ry: i * 0.7,
        color: palette[(i + 1) % palette.length],
      });
    }

    // Shoreline rocks around Ho Hoa Dang
    for (let i = 0; i < 42; i++) {
      const angle = (i / 42) * Math.PI * 2;
      // Leave pier gap & stream inlet gap
      const x = LAKE_CENTER.x + Math.cos(angle) * (LAKE_RADIUS_X + 0.8 + (i % 3) * 0.45);
      const z = LAKE_CENTER.z + Math.sin(angle) * (LAKE_RADIUS_Z + 0.6 + (i % 3) * 0.4);
      if (Math.abs(x) < 2.4 && z < 26) continue;
      if (distanceToStream(x, z) < 3.4) continue;
      const y = groundHeightAt(x, z) + 0.1;
      const s = 0.5 + (i % 4) * 0.28;
      items.push({
        x, y, z,
        sx: s * 1.3, sy: s * 0.6, sz: s,
        ry: angle + i * 0.4,
        color: palette[i % palette.length],
      });
    }

    return items;
  }, []);

  useLayoutEffect(() => {
    const mesh = boulderRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    bouldersData.forEach((b, idx) => {
      dummy.position.set(b.x, b.y, b.z);
      dummy.rotation.set(0.08, b.ry, 0.04);
      dummy.scale.set(b.sx, b.sy, b.sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
      col.set(b.color);
      mesh.setColorAt(idx, col);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [bouldersData]);

  // 2. Botanical Grass Clusters Across Open Meadows (InstancedMesh)
  const grassClumpGeo = useMemo(() => createGrassClumpGeometry(), []);
  const tuftRef = useRef<THREE.InstancedMesh>(null);
  const tuftsData = useMemo(() => {
    const items: Array<{ x: number; y: number; z: number; s: number; ry: number; color: string }> = [];
    const greens = ['#4e8242', '#5b924c', '#45733a', '#689b56', '#7ba861'];
    const total = isSoftwareGl ? 620 : 1150;
    for (let i = 0; i < total; i++) {
      const goldenAngle = i * 2.39996;
      const r = 1.6 + Math.sqrt(i / total) * 64;
      const x = Math.cos(goldenAngle) * r;
      const z = Math.sin(goldenAngle) * r;
      if (isBlockedForFlora(x, z)) continue;
      const y = groundHeightAt(x, z);
      if (y < 0.2) continue;
      items.push({
        x, y, z,
        s: 0.95 + (i % 5) * 0.22,
        ry: (i * 1.1) % (Math.PI * 2),
        color: greens[i % greens.length],
      });
    }
    return items;
  }, [isSoftwareGl]);

  useLayoutEffect(() => {
    const mesh = tuftRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    tuftsData.forEach((t, idx) => {
      dummy.position.set(t.x, t.y - 0.01, t.z);
      dummy.rotation.set(0, t.ry, 0);
      dummy.scale.setScalar(t.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
      col.set(t.color);
      mesh.setColorAt(idx, col);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [tuftsData]);

  // 3. Lavender & Daisy Wildflower Fields (Biome-themed meadows!)
  const lavenderRef = useRef<THREE.InstancedMesh>(null);
  const lavenderData = useMemo(() => {
    const items: Array<{ x: number; y: number; z: number; s: number; color: string }> = [];
    const purples = ['#8b5cf6', '#a78bfa', '#7c3aed', '#c4b5fd', '#9d79ec'];
    const count = isSoftwareGl ? 240 : 460;
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996;
      const r = 4.2 + Math.sqrt(i / count) * 18.5;
      // Clustered in Western Meadow around Vuon Tam Tinh (-32, -2) -> toward central path
      const x = -25 + Math.cos(a) * r;
      const z = 1 + Math.sin(a) * r * 0.85;
      if (isBlockedForFlora(x, z)) continue;
      const y = groundHeightAt(x, z);
      if (y < 0.35) continue;
      items.push({
        x, y: y + 0.19, z,
        s: 0.75 + (i % 4) * 0.2,
        color: purples[i % purples.length],
      });
    }
    return items;
  }, [isSoftwareGl]);

  useLayoutEffect(() => {
    const mesh = lavenderRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    lavenderData.forEach((f, idx) => {
      dummy.position.set(f.x, f.y, f.z);
      dummy.rotation.set((idx % 3) * 0.08, idx * 0.7, 0);
      dummy.scale.set(f.s * 0.55, f.s * 1.45, f.s * 0.55);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
      col.set(f.color);
      mesh.setColorAt(idx, col);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [lavenderData]);

  // 4. Sunlit Meadow Daisies & Cherry Blossom Field (Central Meadow & East Orchard)
  const flowerRef = useRef<THREE.InstancedMesh>(null);
  const flowersData = useMemo(() => {
    const items: Array<{ x: number; y: number; z: number; s: number; color: string }> = [];
    const palette = ['#fef9c3', '#fbcfe8', '#fde68a', '#f9a8d4', '#fffbeb', '#fed7aa'];
    const count = isSoftwareGl ? 220 : 400;
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996 + 0.6;
      const r = 2.4 + Math.sqrt(i / count) * 44;
      const x = 6 + Math.cos(a) * r;
      const z = 4 + Math.sin(a) * r * 0.78;
      if (isBlockedForFlora(x, z)) continue;
      const y = groundHeightAt(x, z);
      if (y < 0.28) continue;
      items.push({
        x, y: y + 0.14, z,
        s: 0.8 + (i % 4) * 0.24,
        color: palette[i % palette.length],
      });
    }
    return items;
  }, [isSoftwareGl]);

  useLayoutEffect(() => {
    const mesh = flowerRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    flowersData.forEach((f, idx) => {
      dummy.position.set(f.x, f.y, f.z);
      dummy.rotation.set(0.18, idx * 0.9, 0.1);
      dummy.scale.set(f.s, f.s * 0.55, f.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
      col.set(f.color);
      mesh.setColorAt(idx, col);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [flowersData]);

  // 5. Lakeside & Stream Bank Reeds (InstancedMesh)
  const reedRef = useRef<THREE.InstancedMesh>(null);
  const reedsData = useMemo(() => {
    const items: Array<{ x: number; y: number; z: number; h: number; ry: number }> = [];
    for (let i = 0; i < 120; i++) {
      let x = 0;
      let z = 0;
      if (i < 65) {
        const angle = (i / 65) * Math.PI * 2;
        x = LAKE_CENTER.x + Math.cos(angle) * (LAKE_RADIUS_X - 0.35 + (i % 3) * 0.45);
        z = LAKE_CENTER.z + Math.sin(angle) * (LAKE_RADIUS_Z - 0.35 + (i % 3) * 0.45);
        if (Math.abs(x) < 2.2 && z < 26) continue;
      } else {
        const sz = -44 + ((i - 65) / 55) * 68;
        const side = i % 2 === 0 ? 1 : -1;
        x = streamCenterX(sz) + side * (2.3 + (i % 3) * 0.4);
        z = sz;
      }
      const y = groundHeightAt(x, z);
      items.push({
        x, y: Math.max(-0.08, y), z,
        h: 0.85 + (i % 4) * 0.25,
        ry: (i * 1.4) % (Math.PI * 2),
      });
    }
    return items;
  }, []);

  useLayoutEffect(() => {
    const mesh = reedRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    reedsData.forEach((r, idx) => {
      dummy.position.set(r.x, r.y + r.h * 0.45, r.z);
      dummy.rotation.set(0.08 * Math.sin(idx), r.ry, 0.08 * Math.cos(idx));
      dummy.scale.set(1, r.h, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [reedsData]);

  return (
    <group>
      {/* 1. Expansive Valley Sculpted Terrain */}
      <mesh geometry={valleyGeo} material={valleyMat} receiveShadow />

      {/* 2. Surrounding 3D Layered Mountain Ridges */}
      <DistantMountainRange />

      {/* 3. Winding Cobblestone Trails & Hilltop Stone Stairs */}
      <WindingCobblePaths />

      {/* 4. Stream & Shoreline Mossy Boulders */}
      <instancedMesh
        ref={boulderRef}
        args={[undefined, undefined, bouldersData.length]}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[0.78, 1]} />
        <meshStandardMaterial roughness={0.88} metalness={0.04} />
      </instancedMesh>

      {/* 5. Meadow Grass Tufts */}
      <instancedMesh
        ref={tuftRef}
        args={[grassClumpGeo, undefined, tuftsData.length]}
        receiveShadow
      >
        <meshStandardMaterial roughness={0.86} metalness={0.02} side={THREE.DoubleSide} />
      </instancedMesh>

      {/* 6. Western Lavender Wildflower Spikes */}
      <instancedMesh
        ref={lavenderRef}
        args={[undefined, undefined, lavenderData.length]}
      >
        <coneGeometry args={[0.09, 0.34, 6]} />
        <meshStandardMaterial roughness={0.72} />
      </instancedMesh>

      {/* 7. Sunlit Wildflower Blossoms */}
      <instancedMesh
        ref={flowerRef}
        args={[undefined, undefined, flowersData.length]}
      >
        <icosahedronGeometry args={[0.095, 0]} />
        <meshStandardMaterial roughness={0.62} emissive="#fef3c7" emissiveIntensity={0.06} />
      </instancedMesh>

      {/* 8. Lakeside & Brook Cattail Reeds */}
      <instancedMesh
        ref={reedRef}
        args={[undefined, undefined, reedsData.length]}
        castShadow
      >
        <cylinderGeometry args={[0.018, 0.032, 1.0, 5]} />
        <meshStandardMaterial color="#4e7540" roughness={0.82} />
      </instancedMesh>
    </group>
  );
};
