import * as THREE from 'three';
import { getWoodPlankTexture, getStoneFoundationTexture } from './ProceduralTextures';

/**
 * Procedural Natural Landscaping Elements:
 * Blossoming Pink Trees, Weeping Willows, Ancient Wish Tree, Arched Wooden Bridge,
 * Floating Water Lilies with Glowing Blossoms, Fairy Mushrooms, and River Boulders.
 */

// 1. Arched Wooden Bridge (Inspired by Panel 1 of Reference Image)
export function createArchedWoodenBridge(length: number = 7.0, width: number = 1.6, archHeight: number = 0.9): THREE.Group {
  const bridge = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    map: getWoodPlankTexture(),
    roughness: 0.8,
  });

  const numSegments = 16;
  const plankThickness = 0.08;

  // Build arched walkway using curved planks
  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments;
    const x = (t - 0.5) * length;
    // Parabolic arch formula
    const y = archHeight * Math.sin(t * Math.PI) + 0.1;
    const tangentAngle = Math.atan((archHeight * Math.PI * Math.cos(t * Math.PI)) / length);

    const plankGeo = new THREE.BoxGeometry(length / numSegments * 0.92, plankThickness, width);
    const plank = new THREE.Mesh(plankGeo, woodMat);
    plank.position.set(x, y, 0);
    plank.rotation.z = tangentAngle;
    plank.castShadow = true;
    plank.receiveShadow = true;
    bridge.add(plank);

    // Balustrade Posts every 2 segments
    if (i % 2 === 0) {
      [-width / 2 + 0.05, width / 2 - 0.05].forEach((zPos) => {
        const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8);
        const post = new THREE.Mesh(postGeo, woodMat);
        post.position.set(x, y + 0.45, zPos);
        post.rotation.z = tangentAngle;
        bridge.add(post);
      });
    }
  }

  // Curved Handrails along both sides
  [-width / 2 + 0.05, width / 2 - 0.05].forEach((zPos) => {
    const railPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const x = (t - 0.5) * length;
      const y = archHeight * Math.sin(t * Math.PI) + 0.95;
      railPoints.push(new THREE.Vector3(x, y, zPos));
    }
    const railCurve = new THREE.CatmullRomCurve3(railPoints);
    const railGeo = new THREE.TubeGeometry(railCurve, 20, 0.04, 8, false);
    const rail = new THREE.Mesh(railGeo, woodMat);
    bridge.add(rail);
  });

  // Stone Abutments / Piers at bridge ends
  const stoneMat = new THREE.MeshStandardMaterial({
    map: getStoneFoundationTexture(),
    roughness: 0.9,
  });

  [-length / 2, length / 2].forEach((xPos) => {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, width + 0.4), stoneMat);
    pier.position.set(xPos, -0.4, 0);
    pier.castShadow = true;
    bridge.add(pier);
  });

  // Lanterns on bridge posts (Center of bridge)
  [-width / 2 + 0.05, width / 2 - 0.05].forEach((zPos) => {
    const lanCap = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12, 0),
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.2,
      })
    );
    lanCap.position.set(0, archHeight + 1.05, zPos);
    bridge.add(lanCap);

    const bridgeLight = new THREE.PointLight(0xfef08a, 1.2, 5.0);
    bridgeLight.position.set(0, archHeight + 1.05, zPos);
    bridge.add(bridgeLight);
  });

  return bridge;
}

// 2. Blossoming Pink Sakura / Peach Tree (Panel 1 of Reference Image)
export function createBlossomTree(scale: number = 1.0): THREE.Group {
  const tree = new THREE.Group();

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x3d271d,
    roughness: 0.9,
  });

  const blossomColors = [0xf472b6, 0xec4899, 0xfda4af, 0xffe4e6];

  // Sculpted curvy trunk
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.2, 1.2, 0.1),
    new THREE.Vector3(-0.3, 2.4, 0.2),
    new THREE.Vector3(0, 3.6, 0),
  ]);
  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 12, 0.28, 8, false);
  const trunk = new THREE.Mesh(trunkGeo, barkMat);
  trunk.castShadow = true;
  tree.add(trunk);

  // Sprawling branches
  const branchCoords = [
    { start: [0.1, 2.2, 0.1], end: [1.2, 3.2, 0.8], radius: 0.15 },
    { start: [-0.2, 2.6, 0.1], end: [-1.4, 3.4, -0.6], radius: 0.14 },
    { start: [0, 3.2, -0.2], end: [0.4, 4.2, -1.2], radius: 0.12 },
  ];

  branchCoords.forEach((b) => {
    const bCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(...b.start),
      new THREE.Vector3(...b.end),
    ]);
    const bMesh = new THREE.Mesh(new THREE.TubeGeometry(bCurve, 8, b.radius, 6, false), barkMat);
    bMesh.castShadow = true;
    tree.add(bMesh);
  });

  // Cloud-like Volumetric Foliage Clusters (Blossom Puffs)
  const foliagePuffs = [
    { pos: [0, 4.0, 0], r: 1.4, col: 0xf472b6 },
    { pos: [1.3, 3.4, 0.8], r: 1.1, col: 0xec4899 },
    { pos: [-1.4, 3.6, -0.6], r: 1.15, col: 0xfda4af },
    { pos: [0.5, 4.4, -1.1], r: 1.05, col: 0xf472b6 },
    { pos: [-0.6, 4.2, 0.9], r: 1.0, col: 0xffe4e6 },
  ];

  foliagePuffs.forEach((f) => {
    const puffMat = new THREE.MeshStandardMaterial({
      color: f.col,
      roughness: 0.75,
      metalness: 0.05,
      emissive: f.col,
      emissiveIntensity: 0.15,
    });
    const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(f.r, 1), puffMat);
    puff.position.set(f.pos[0], f.pos[1], f.pos[2]);
    puff.castShadow = true;
    tree.add(puff);
  });

  tree.scale.set(scale, scale, scale);
  return tree;
}

// 3. Weeping Willow Tree (Cây Liễu Rủ Bên Hồ)
export function createWeepingWillow(scale: number = 1.0): THREE.Group {
  const willow = new THREE.Group();

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x36281e,
    roughness: 0.9,
  });

  // Leaning trunk toward the water
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.4, 1.4, -0.4),
    new THREE.Vector3(0.9, 2.8, -0.9),
  ]);
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 10, 0.35, 8, false), barkMat);
  trunk.castShadow = true;
  willow.add(trunk);

  // Willow Canopy Dome
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x4d7c5b,
    roughness: 0.8,
  });
  const canopyDome = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 10), canopyMat);
  canopyDome.position.set(0.9, 3.1, -0.9);
  canopyDome.scale.set(1.4, 0.9, 1.4);
  canopyDome.castShadow = true;
  willow.add(canopyDome);

  // Drooping Willow Vines/Curtains
  const vineMat = new THREE.MeshStandardMaterial({
    color: 0x5a8f6b,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const rad = 1.3 + Math.random() * 0.4;
    const vx = 0.9 + Math.cos(angle) * rad;
    const vz = -0.9 + Math.sin(angle) * rad;
    const len = 1.6 + Math.random() * 1.2;

    const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.01, len, 4), vineMat);
    vine.position.set(vx, 3.1 - len / 2, vz);
    willow.add(vine);
  }

  willow.scale.set(scale, scale, scale);
  return willow;
}

// 4. The Great Ancient Wish Tree (Cội Cây Ước Nguyện - Panel 4 of Reference Image)
export function createGreatWishTree(): THREE.Group {
  const wishTree = new THREE.Group();

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x2e2017,
    roughness: 0.95,
  });

  // Massive Twisted Root Clusters emerging from the ground
  const rootAngles = [0, 0.8, 1.7, 2.6, 3.5, 4.4, 5.3];
  rootAngles.forEach((a) => {
    const rootCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2),
      new THREE.Vector3(Math.cos(a) * 1.4, 0.4, Math.sin(a) * 1.4),
      new THREE.Vector3(0, 1.2, 0),
    ]);
    const rootMesh = new THREE.Mesh(new THREE.TubeGeometry(rootCurve, 8, 0.32, 8, false), barkMat);
    rootMesh.castShadow = true;
    wishTree.add(rootMesh);
  });

  // Giant Main Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.85, 1.4, 4.2, 12);
  const trunk = new THREE.Mesh(trunkGeo, barkMat);
  trunk.position.y = 2.1;
  trunk.castShadow = true;
  wishTree.add(trunk);

  // Spreading Great Limbs
  const limbCoords = [
    { start: [0, 3.8, 0], end: [2.2, 5.2, 1.2], r: 0.35 },
    { start: [0, 3.8, 0], end: [-2.4, 5.4, -0.8], r: 0.38 },
    { start: [0, 4.0, 0], end: [0.6, 5.6, -2.2], r: 0.32 },
    { start: [0, 4.0, 0], end: [-1.2, 5.5, 2.0], r: 0.34 },
  ];

  limbCoords.forEach((l) => {
    const limbCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(...l.start),
      new THREE.Vector3(...l.end),
    ]);
    const limbMesh = new THREE.Mesh(new THREE.TubeGeometry(limbCurve, 8, l.r, 8, false), barkMat);
    limbMesh.castShadow = true;
    wishTree.add(limbMesh);
  });

  // Lush Multi-Tiered Foliage Dome
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x22543d, // deep forest emerald
    roughness: 0.8,
    emissive: 0x143425,
    emissiveIntensity: 0.2,
  });

  const leafClusters = [
    { pos: [0, 6.2, 0], r: 2.5 },
    { pos: [2.2, 5.4, 1.2], r: 1.8 },
    { pos: [-2.4, 5.6, -0.8], r: 2.0 },
    { pos: [0.6, 5.8, -2.2], r: 1.7 },
    { pos: [-1.2, 5.7, 2.0], r: 1.9 },
  ];

  leafClusters.forEach((c) => {
    const cluster = new THREE.Mesh(new THREE.DodecahedronGeometry(c.r, 1), foliageMat);
    cluster.position.set(c.pos[0], c.pos[1], c.pos[2]);
    cluster.castShadow = true;
    wishTree.add(cluster);
  });

  // Golden Wish Intention Tags & Lanterns hanging from limbs
  const tagMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.7,
    roughness: 0.4,
  });

  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const dist = 1.4 + (i % 3) * 0.5;
    const tx = Math.cos(angle) * dist;
    const tz = Math.sin(angle) * dist;
    const ty = 4.2 - (i % 4) * 0.3;

    // Hanging tag
    const tag = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.02), tagMat);
    tag.position.set(tx, ty, tz);
    tag.rotation.y = angle;
    wishTree.add(tag);

    // Connecting string
    const string = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.4, 4),
      new THREE.MeshBasicMaterial({ color: 0xfffbeb })
    );
    string.position.set(tx, ty + 0.2, tz);
    wishTree.add(string);
  }

  // Warm Celestial Tree Light in Center
  const treeGlow = new THREE.PointLight(0xfef08a, 2.5, 12);
  treeGlow.position.set(0, 3.8, 0);
  wishTree.add(treeGlow);

  return wishTree;
}

// 5. Floating Water Lilies with Glowing Blossoms (Panel 4 of Reference Image)
export function createWaterLilyGroup(x: number, z: number): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, 0.02, z);

  const padMat = new THREE.MeshStandardMaterial({
    color: 0x15803d, // rich water lily green
    roughness: 0.7,
    side: THREE.DoubleSide,
  });

  // 3-4 Lily pads with notched slit
  for (let i = 0; i < 4; i++) {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.35 + Math.random() * 0.15, 16, 0, Math.PI * 1.85), padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(
      Math.sin((i / 4) * Math.PI * 2) * 0.4,
      0,
      Math.cos((i / 4) * Math.PI * 2) * 0.4
    );
    group.add(pad);
  }

  // Glowing Lotus Blossom in center
  const petalMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xf472b6,
    emissiveIntensity: 0.7,
    roughness: 0.4,
  });

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 4), petalMat);
    petal.position.set(Math.cos(angle) * 0.12, 0.1, Math.sin(angle) * 0.12);
    petal.rotation.z = Math.cos(angle) * 0.45;
    petal.rotation.x = Math.sin(angle) * 0.45;
    group.add(petal);
  }

  // Glowing Stamen
  const stamen = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  stamen.position.y = 0.12;
  group.add(stamen);

  return group;
}

// 6. Bioluminescent Fairy Mushrooms (Panel 1 of Reference Image)
export function createMushroomCluster(x: number, z: number): THREE.Group {
  const cluster = new THREE.Group();
  cluster.position.set(x, 0, z);

  const capMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.85,
    roughness: 0.3,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.9,
  });

  [
    { dx: 0, dz: 0, h: 0.4, r: 0.28 },
    { dx: 0.25, dz: 0.15, h: 0.3, r: 0.2 },
    { dx: -0.2, dz: -0.15, h: 0.22, r: 0.16 },
  ].forEach((m) => {
    // Stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, m.h, 8), stemMat);
    stem.position.set(m.dx, m.h / 2, m.dz);
    cluster.add(stem);

    // Glowing Cap
    const cap = new THREE.Mesh(new THREE.SphereGeometry(m.r, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
    cap.position.set(m.dx, m.h, m.dz);
    cluster.add(cap);
  });

  return cluster;
}

// 7. Natural Mossy River Boulders
export function createMossyBoulder(scale: number = 1.0): THREE.Mesh {
  const boulderGeo = new THREE.DodecahedronGeometry(0.6 * scale, 1);
  // Flatten slightly to make it rest naturally
  boulderGeo.scale(1.2, 0.7, 1.0);

  const boulderMat = new THREE.MeshStandardMaterial({
    color: 0x33364f,
    roughness: 0.92,
    metalness: 0.05,
  });

  const boulder = new THREE.Mesh(boulderGeo, boulderMat);
  boulder.castShadow = true;
  boulder.receiveShadow = true;
  return boulder;
}
