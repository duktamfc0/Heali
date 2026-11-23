import * as THREE from 'three';
import { TextureVault } from '../proceduralTextures';

export type SanctuarySceneVariant =
  | 'landing'
  | 'overview'
  | 'journal'
  | 'letters'
  | 'wishes'
  | 'calm'
  | 'community'
  | 'lake'
  | 'spiritual';

export type BreathPhase3D = 'inhale' | 'hold' | 'exhale';

export interface SceneLiveProps {
  moodScore?: number;
  breathPhase?: BreathPhase3D;
  breathRunning?: boolean;
  activeEffect?: boolean;
  isDark?: boolean;
}

export interface BuiltSanctuaryScene {
  root: THREE.Group;
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  fov: number;
  fogColor: number;
  fogDensity: number;
  backgroundHex: number;
  update: (dt: number, elapsed: number, live: SceneLiveProps) => void;
  dispose: () => void;
}

class AssetTracker {
  geometries: THREE.BufferGeometry[] = [];
  materials: THREE.Material[] = [];

  geo<T extends THREE.BufferGeometry>(g: T): T {
    this.geometries.push(g);
    return g;
  }

  mat<T extends THREE.Material>(m: T): T {
    this.materials.push(m);
    return m;
  }

  disposeAll(): void {
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
    this.geometries = [];
    this.materials = [];
  }
}

interface FloatingParticle {
  baseX: number;
  baseY: number;
  baseZ: number;
  speed: number;
  phase: number;
  scale: number;
}

interface CraneActor {
  group: THREE.Group;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
  centerX: number;
  centerZ: number;
  radiusX: number;
  radiusZ: number;
  baseY: number;
  speed: number;
  phase: number;
}

interface KoiActor {
  group: THREE.Group;
  tail: THREE.Mesh;
  centerX: number;
  centerZ: number;
  radius: number;
  speed: number;
  phase: number;
}

function createParticles(
  tracker: AssetTracker,
  count: number,
  color: number,
  spread: { x: number; y: number; z: number; yMin: number },
  size = 0.045,
  glowMap?: THREE.Texture
): {
  mesh: THREE.InstancedMesh;
  items: FloatingParticle[];
  dummy: THREE.Object3D;
} {
  const geo = tracker.geo(new THREE.PlaneGeometry(size * 2.4, size * 2.4));
  const mat = tracker.mat(
    new THREE.MeshBasicMaterial({
      color,
      map: glowMap || null,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const items: FloatingParticle[] = [];
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i++) {
    const p: FloatingParticle = {
      baseX: Math.sin(i * 12.9898) * 0.5 * spread.x * 2,
      baseY: spread.yMin + Math.abs(Math.cos(i * 78.233)) * spread.y,
      baseZ: Math.sin(i * 45.164) * 0.5 * spread.z * 2,
      speed: 0.35 + (i % 7) * 0.14,
      phase: i * 1.13,
      scale: 0.55 + (i % 5) * 0.22,
    };
    items.push(p);
    dummy.position.set(p.baseX, p.baseY, p.baseZ);
    dummy.scale.setScalar(p.scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  return { mesh, items, dummy };
}

function buildLotusLantern(
  tracker: AssetTracker,
  isSoftwareGl: boolean,
  warmHex = 0xffc873
): THREE.Group {
  const group = new THREE.Group();

  const baseProfile = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(0.24, 0.01),
    new THREE.Vector2(0.29, 0.05),
    new THREE.Vector2(0.22, 0.08),
    new THREE.Vector2(0.01, 0.07),
  ];
  const baseGeo = tracker.geo(new THREE.LatheGeometry(baseProfile, 16));
  const leafMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0x3b6e3f,
      roughness: 0.55,
      metalness: 0.05,
    })
  );
  group.add(new THREE.Mesh(baseGeo, leafMat));

  const petalGeo = tracker.geo(new THREE.ConeGeometry(0.11, 0.28, 5));
  const petalMat = tracker.mat(
    new THREE.MeshPhysicalMaterial({
      color: 0xfff2e8,
      emissive: warmHex,
      emissiveIntensity: 0.55,
      roughness: 0.42,
      clearcoat: isSoftwareGl ? 0 : 0.25,
      side: THREE.DoubleSide,
    })
  );

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeo, petalMat);
    petal.position.set(Math.cos(angle) * 0.15, 0.14, Math.sin(angle) * 0.15);
    petal.rotation.y = -angle;
    petal.rotation.z = -0.58;
    group.add(petal);
  }

  const flame = new THREE.Mesh(
    tracker.geo(new THREE.SphereGeometry(0.055, 10, 10)),
    tracker.mat(new THREE.MeshBasicMaterial({ color: warmHex }))
  );
  flame.scale.set(0.8, 1.5, 0.8);
  flame.position.y = 0.18;
  flame.name = 'flame';
  group.add(flame);

  return group;
}

function buildPinkLotusFlower(tracker: AssetTracker, isSoftwareGl: boolean, x: number, z: number, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const pad = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(0.42, 0.4, 0.02, 16)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x437c42, roughness: 0.65 }))
  );
  g.add(pad);

  const petalGeo = tracker.geo(new THREE.ConeGeometry(0.09, 0.24, 5));
  const petalMat = tracker.mat(
    new THREE.MeshPhysicalMaterial({
      color: 0xf7a7bf,
      emissive: 0x6b283d,
      emissiveIntensity: 0.15,
      roughness: 0.35,
      clearcoat: isSoftwareGl ? 0 : 0.3,
    })
  );
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const p = new THREE.Mesh(petalGeo, petalMat);
    p.position.set(Math.cos(ang) * 0.11, 0.08, Math.sin(ang) * 0.11);
    p.rotation.y = -ang;
    p.rotation.z = -0.68;
    g.add(p);
  }
  const core = new THREE.Mesh(
    tracker.geo(new THREE.SphereGeometry(0.06, 8, 8)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xf7d168, roughness: 0.45 }))
  );
  core.position.y = 0.1;
  g.add(core);
  g.position.set(x, 0.02, z);
  g.scale.setScalar(scale);
  return g;
}

function addKarstMountains(
  root: THREE.Group,
  tracker: AssetTracker,
  vault: TextureVault,
  specs: Array<[number, number, number, number, number, number?]>
) {
  const karstTex = vault.createLimestoneKarst();
  const rockMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      map: karstTex,
      roughness: 0.9,
      metalness: 0.04,
    })
  );
  const mossCapMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0x3b6d3c,
      roughness: 0.88,
    })
  );

  for (const [x, z, rBase, height, seed, tint] of specs) {
    const colMat = tint
      ? tracker.mat(
          new THREE.MeshStandardMaterial({
            map: karstTex,
            color: tint,
            roughness: 0.9,
          })
        )
      : rockMat;
    const peakGeo = tracker.geo(new THREE.ConeGeometry(rBase, height, 8, 4));
    const posAttr = peakGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      const jitter = Math.sin(vx * 1.4 + seed) * Math.cos(vz * 1.3 - seed) * (rBase * 0.16);
      if (vy < height * 0.45) {
        posAttr.setX(i, vx + jitter);
        posAttr.setZ(i, vz - jitter * 0.7);
      }
    }
    peakGeo.computeVertexNormals();
    const peak = new THREE.Mesh(peakGeo, colMat);
    peak.position.set(x, height * 0.42 - 0.5, z);
    peak.rotation.y = seed;
    root.add(peak);

    // Verdant forest cap clinging to upper slope
    const cap = new THREE.Mesh(tracker.geo(new THREE.DodecahedronGeometry(rBase * 0.42, 1)), mossCapMat);
    cap.scale.set(1.2, 0.55, 1.0);
    cap.position.set(x, height * 0.65 - 0.5, z);
    root.add(cap);
  }
}

function addWaterfallChute(
  root: THREE.Group,
  tracker: AssetTracker,
  vault: TextureVault,
  x: number,
  yBase: number,
  z: number,
  width: number,
  height: number,
  rotY = 0
): THREE.Texture {
  const foamTex = vault.createWaterfallFoam();
  foamTex.repeat.set(1, 1.8);

  const group = new THREE.Group();
  group.position.set(x, yBase, z);
  group.rotation.y = rotY;

  // Flanking dark wet cliff boulders
  const cliffMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      map: vault.createLimestoneKarst(),
      color: 0x626b62,
      roughness: 0.85,
    })
  );
  for (const side of [-1, 1]) {
    const flank = new THREE.Mesh(tracker.geo(new THREE.ConeGeometry(width * 0.85, height * 1.18, 7)), cliffMat);
    flank.position.set(side * (width * 0.78), height * 0.5, -0.35);
    flank.scale.set(1, 1, 0.85);
    group.add(flank);
  }

  // Curved falling water ribbon
  const fallGeo = tracker.geo(new THREE.PlaneGeometry(width, height, 4, 12));
  const pos = fallGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vy = pos.getY(i);
    const norm = 1 - (vy + height * 0.5) / height; // 0 top -> 1 bottom
    pos.setZ(i, Math.pow(norm, 1.35) * 0.65);
  }
  fallGeo.computeVertexNormals();

  const fallMat = tracker.mat(
    new THREE.MeshBasicMaterial({
      map: foamTex,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  const chute = new THREE.Mesh(fallGeo, fallMat);
  chute.position.set(0, height * 0.5, 0.08);
  group.add(chute);

  // Churning white foam ring at water impact
  const splash = new THREE.Mesh(
    tracker.geo(new THREE.CircleGeometry(width * 0.9, 20)),
    tracker.mat(
      new THREE.MeshBasicMaterial({
        color: 0xe6f8ff,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
      })
    )
  );
  splash.rotation.x = -Math.PI / 2;
  splash.position.set(0, 0.04, 0.65);
  group.add(splash);

  root.add(group);
  return foamTex;
}

function addBotanicalBoughCluster(
  root: THREE.Group,
  tracker: AssetTracker,
  tex: THREE.Texture,
  x: number,
  y: number,
  z: number,
  scale = 1.6,
  rotZ = 0
) {
  const mat = tracker.mat(
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.15,
      side: THREE.DoubleSide,
    })
  );
  const planeGeo = tracker.geo(new THREE.PlaneGeometry(scale, scale));
  for (let i = 0; i < 3; i++) {
    const card = new THREE.Mesh(planeGeo, mat);
    card.position.set(x + (i - 1) * scale * 0.26, y + (i % 2) * 0.18, z - i * 0.12);
    card.rotation.z = rotZ + (i - 1) * 0.25;
    card.rotation.y = (i - 1) * 0.35;
    root.add(card);
  }
}

function addTraditionalPavilion(
  root: THREE.Group,
  tracker: AssetTracker,
  vault: TextureVault,
  x: number,
  y: number,
  z: number,
  roofHex = 0xd8a648,
  pillarHex = 0xb56d2c,
  scale = 1
) {
  const group = new THREE.Group();
  const woodMat = tracker.mat(new THREE.MeshStandardMaterial({ map: vault.createWoodGrain('#724c28', '#422814'), roughness: 0.72 }));
  const pillarMat = tracker.mat(new THREE.MeshStandardMaterial({ color: pillarHex, roughness: 0.5, metalness: 0.1 }));
  const roofMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: roofHex,
      roughness: 0.42,
      metalness: 0.22,
    })
  );

  // Stilts & wooden deck
  const deck = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(1.4, 1.45, 0.12, 8)), woodMat);
  deck.position.y = 0.28;
  group.add(deck);

  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const px = Math.cos(ang) * 1.1;
    const pz = Math.sin(ang) * 1.1;
    const stilt = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.05, 0.06, 0.45, 8)), woodMat);
    stilt.position.set(px, 0.05, pz);
    const col = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.055, 0.065, 1.35, 10)), pillarMat);
    col.position.set(px, 0.98, pz);
    group.add(stilt, col);
  }

  // Two-tier curved Asian hip roof
  const lowerRoof = new THREE.Mesh(tracker.geo(new THREE.ConeGeometry(1.75, 0.62, 8)), roofMat);
  lowerRoof.position.y = 1.85;
  const upperRoof = new THREE.Mesh(tracker.geo(new THREE.ConeGeometry(1.15, 0.56, 8)), roofMat);
  upperRoof.position.y = 2.38;
  const finial = new THREE.Mesh(
    tracker.geo(new THREE.SphereGeometry(0.09, 10, 10)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0xf4cc68, metalness: 0.85, roughness: 0.25 }))
  );
  finial.position.y = 2.72;
  group.add(lowerRoof, upperRoof, finial);

  // Warm hanging lantern inside pavilion
  const lantern = new THREE.Mesh(
    tracker.geo(new THREE.SphereGeometry(0.14, 10, 10)),
    tracker.mat(new THREE.MeshBasicMaterial({ color: 0xffd578 }))
  );
  lantern.position.y = 1.35;
  group.add(lantern);

  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  root.add(group);
}

function addCountrysideCottage(
  root: THREE.Group,
  tracker: AssetTracker,
  vault: TextureVault,
  x: number,
  y: number,
  z: number,
  rotY = 0.35
) {
  const g = new THREE.Group();
  const wallMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      color: 0xe3d6b8,
      roughness: 0.88,
    })
  );
  const stoneMat = tracker.mat(
    new THREE.MeshStandardMaterial({
      map: vault.createStoneMoss(),
      roughness: 0.92,
    })
  );
  const roofMat = tracker.mat(new THREE.MeshStandardMaterial({ color: 0x5c534a, roughness: 0.82 }));
  const windowGlow = tracker.mat(new THREE.MeshBasicMaterial({ color: 0xffcf7a }));

  const body = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(2.2, 1.35, 1.65)), wallMat);
  body.position.y = 0.68;
  g.add(body);

  const foundation = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(2.34, 0.28, 1.78)), stoneMat);
  foundation.position.y = 0.14;
  g.add(foundation);

  const roof = new THREE.Mesh(tracker.geo(new THREE.ConeGeometry(1.82, 0.95, 4)), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.22, 1, 0.92);
  roof.position.y = 1.8;
  g.add(roof);

  const chimney = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.26, 0.72, 0.26)), stoneMat);
  chimney.position.set(-0.65, 2.05, -0.35);
  g.add(chimney);

  const door = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.42, 0.85, 0.06)),
    tracker.mat(new THREE.MeshStandardMaterial({ color: 0x7d3a27, roughness: 0.7 }))
  );
  door.position.set(0.45, 0.56, 0.83);
  g.add(door);

  for (const wx of [-0.45, -0.05]) {
    const win = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.32, 0.34, 0.06)), windowGlow);
    win.position.set(wx, 0.72, 0.83);
    g.add(win);
  }

  g.position.set(x, y, z);
  g.rotation.y = rotY;
  root.add(g);
}

function addSoaringCranes(
  root: THREE.Group,
  tracker: AssetTracker,
  count: number,
  centerX: number,
  centerZ: number,
  baseY: number,
  radius: number
): CraneActor[] {
  const bodyMat = tracker.mat(new THREE.MeshStandardMaterial({ color: 0xfbf9f4, roughness: 0.45 }));
  const tipMat = tracker.mat(new THREE.MeshStandardMaterial({ color: 0x1e2228, roughness: 0.6 }));
  const actors: CraneActor[] = [];

  for (let i = 0; i < count; i++) {
    const g = new THREE.Group();
    const torso = new THREE.Mesh(tracker.geo(new THREE.ConeGeometry(0.055, 0.36, 6)), bodyMat);
    torso.rotation.x = Math.PI / 2;
    g.add(torso);

    const neck = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.015, 0.022, 0.22, 6)), bodyMat);
    neck.rotation.x = Math.PI * 0.42;
    neck.position.set(0, 0.05, 0.22);
    g.add(neck);

    const wingGeo = tracker.geo(new THREE.BoxGeometry(0.34, 0.012, 0.14));
    const leftWing = new THREE.Mesh(wingGeo, bodyMat);
    leftWing.position.set(-0.18, 0.02, 0);
    const leftTip = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.11, 0.013, 0.12)), tipMat);
    leftTip.position.set(-0.16, 0, 0);
    leftWing.add(leftTip);

    const rightWing = new THREE.Mesh(wingGeo, bodyMat);
    rightWing.position.set(0.18, 0.02, 0);
    const rightTip = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.11, 0.013, 0.12)), tipMat);
    rightTip.position.set(0.16, 0, 0);
    rightWing.add(rightTip);

    g.add(leftWing, rightWing);
    g.scale.setScalar(0.85 + (i % 3) * 0.15);
    root.add(g);

    actors.push({
      group: g,
      leftWing,
      rightWing,
      centerX,
      centerZ,
      radiusX: radius * (0.75 + (i % 3) * 0.22),
      radiusZ: radius * 0.62,
      baseY: baseY + (i % 3) * 0.55,
      speed: 0.26 + (i % 2) * 0.08,
      phase: i * 1.45,
    });
  }
  return actors;
}

function addSwimmingKoi(
  root: THREE.Group,
  tracker: AssetTracker,
  count: number,
  centerX: number,
  centerZ: number,
  radius: number
): KoiActor[] {
  const colors = [0xff6b38, 0xffaa33, 0xf54e38, 0xff8d42, 0xf6c343];
  const actors: KoiActor[] = [];
  for (let i = 0; i < count; i++) {
    const g = new THREE.Group();
    const mat = tracker.mat(
      new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        emissive: 0x3b1204,
        emissiveIntensity: 0.25,
        roughness: 0.35,
      })
    );
    const body = new THREE.Mesh(tracker.geo(new THREE.SphereGeometry(0.11, 10, 8)), mat);
    body.scale.set(0.55, 0.42, 1.65);
    const tail = new THREE.Mesh(tracker.geo(new THREE.ConeGeometry(0.065, 0.18, 4)), mat);
    tail.rotation.x = Math.PI / 2;
    tail.position.z = -0.18;
    g.add(body, tail);
    g.position.y = -0.05;
    root.add(g);

    actors.push({
      group: g,
      tail,
      centerX,
      centerZ,
      radius: radius * (0.55 + (i % 4) * 0.22),
      speed: 0.35 + (i % 3) * 0.12,
      phase: i * 1.65,
    });
  }
  return actors;
}

function updateCranesAndKoi(cranes: CraneActor[], koi: KoiActor[], elapsed: number) {
  for (const c of cranes) {
    const ang = elapsed * c.speed + c.phase;
    const x = c.centerX + Math.cos(ang) * c.radiusX;
    const z = c.centerZ + Math.sin(ang) * c.radiusZ;
    const nx = c.centerX + Math.cos(ang + 0.05) * c.radiusX;
    const nz = c.centerZ + Math.sin(ang + 0.05) * c.radiusZ;
    c.group.position.set(x, c.baseY + Math.sin(elapsed * 1.3 + c.phase) * 0.22, z);
    c.group.lookAt(nx, c.group.position.y, nz);
    const flap = Math.sin(elapsed * 5.2 + c.phase) * 0.45;
    c.leftWing.rotation.z = flap;
    c.rightWing.rotation.z = -flap;
  }

  for (const k of koi) {
    const ang = -elapsed * k.speed + k.phase;
    const x = k.centerX + Math.cos(ang) * k.radius;
    const z = k.centerZ + Math.sin(ang) * k.radius;
    const nx = k.centerX + Math.cos(ang - 0.06) * k.radius;
    const nz = k.centerZ + Math.sin(ang - 0.06) * k.radius;
    k.group.position.set(x, -0.04, z);
    k.group.lookAt(nx, -0.04, nz);
    k.tail.rotation.y = Math.sin(elapsed * 7.5 + k.phase) * 0.38;
  }
}

export function buildSanctuaryScene(
  variant: SanctuarySceneVariant,
  vault: TextureVault,
  isSoftwareGl: boolean
): BuiltSanctuaryScene {
  const tracker = new AssetTracker();
  const root = new THREE.Group();
  const glowTex = vault.createSoftGlowSprite();

  let cameraPosition = new THREE.Vector3(0, 2.3, 6.2);
  let cameraTarget = new THREE.Vector3(0, 0.7, 0);
  let fov = 42;
  let fogColor = 0x8ea89a;
  let fogDensity = 0.024;
  let backgroundHex = 0x8ea89a;

  const addPaintedSky = (
    topHex: string,
    midHex: string,
    horizonHex: string,
    options?: { stars?: boolean; cloudTint?: string; sunHex?: string; sunX?: number; sunY?: number }
  ) => {
    const skyGeo = tracker.geo(new THREE.SphereGeometry(46, 28, 18));
    const skyTex = vault.createSkyDome(topHex, horizonHex, Boolean(options?.stars), {
      midHex,
      cloudTint: options?.cloudTint,
      sunHex: options?.sunHex,
      sunX: options?.sunX,
      sunY: options?.sunY,
    });
    const skyMat = tracker.mat(
      new THREE.MeshBasicMaterial({
        map: skyTex,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    root.add(new THREE.Mesh(skyGeo, skyMat));
  };

  // ===========================================================================
  // 1. LANDING & LAKE / LANTERN NIGHT SCENES
  //    Golden Sunset Lotus Lake + Waterside Pavilion + Karst Waterfall + Koi & Cranes
  // ===========================================================================
  if (variant === 'landing' || variant === 'lake') {
    const isPanLake = variant === 'lake';
    cameraPosition = isPanLake ? new THREE.Vector3(0, 2.15, 6.9) : new THREE.Vector3(-1.35, 2.25, 6.6);
    cameraTarget = new THREE.Vector3(0.2, 0.9, -2.5);
    fov = 42;
    fogColor = 0xdfbe8c;
    fogDensity = 0.022;
    backgroundHex = 0xdfbe8c;

    addPaintedSky('#7483a6', '#e3a56b', '#f8dfb0', {
      stars: false,
      cloudTint: 'rgba(255, 232, 196, 0.38)',
      sunHex: '#ffd166',
      sunX: 0.62,
      sunY: 0.34,
    });

    const hemi = new THREE.HemisphereLight(0xffe1b0, 0x2f4d3a, 1.15);
    const sunDir = new THREE.DirectionalLight(0xffcb80, 1.85);
    sunDir.position.set(6, 7, -10);
    const pavilionGlow = new THREE.PointLight(0xffb85c, 3.6, 14, 1.5);
    pavilionGlow.position.set(3.2, 1.5, -4.4);
    root.add(hemi, sunDir, pavilionGlow);

    // Glowing Golden Setting Sun orb
    const sunOrb = new THREE.Mesh(
      tracker.geo(new THREE.SphereGeometry(1.15, 20, 20)),
      tracker.mat(new THREE.MeshBasicMaterial({ color: 0xffd26a }))
    );
    sunOrb.position.set(4.5, 4.6, -21);
    root.add(sunOrb);

    // Emerald-Jade Rippling Lake Water
    const waterNormal = vault.createWaterRippleNormal();
    const water = new THREE.Mesh(
      tracker.geo(new THREE.PlaneGeometry(52, 52, isSoftwareGl ? 24 : 48, isSoftwareGl ? 24 : 48)),
      tracker.mat(
        new THREE.MeshPhysicalMaterial({
          color: 0x3b7868,
          roughness: 0.14,
          metalness: 0.18,
          normalMap: waterNormal,
          normalScale: new THREE.Vector2(0.42, 0.42),
          clearcoat: isSoftwareGl ? 0 : 0.85,
        })
      )
    );
    water.rotation.x = -Math.PI / 2;
    root.add(water);

    // Dramatic Limestone Karst Peaks + Twin Cascading Waterfalls
    addKarstMountains(root, tracker, vault, [
      [-6.8, -14.5, 3.6, 8.8, 0.6],
      [-2.2, -16.8, 4.2, 10.2, 1.8],
      [3.8, -15.5, 3.4, 8.2, 2.9],
      [7.8, -12.8, 3.1, 7.2, 4.1],
      [-4.2, -9.2, 2.2, 4.8, 1.2],
    ]);
    const fallA = addWaterfallChute(root, tracker, vault, -4.2, 0.0, -8.5, 1.15, 4.6, 0.28);

    // Golden Two-Tier Waterside Tea Pavilion ("Nhà thủy tạ") + Curved Boardwalk
    addTraditionalPavilion(root, tracker, vault, 3.3, 0.02, -4.6, 0xe8b54c, 0xc78932, 1.05);
    const woodMat = tracker.mat(
      new THREE.MeshStandardMaterial({ map: vault.createWoodGrain('#8a623c', '#53381e'), roughness: 0.78 })
    );
    const plankGeo = tracker.geo(new THREE.BoxGeometry(0.95, 0.07, 0.36));
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      const px = 2.9 + Math.sin(t * Math.PI * 0.75) * 1.15;
      const pz = -3.0 + t * 5.6;
      const plank = new THREE.Mesh(plankGeo, woodMat);
      plank.position.set(px, 0.12, pz);
      plank.rotation.y = Math.cos(t * Math.PI * 0.75) * 0.32;
      root.add(plank);
    }

    // Small Wooden Sampan Boat gliding softly
    const sampan = new THREE.Group();
    const hull = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.55, 0.14, 1.5)), woodMat);
    const canopy = new THREE.Mesh(
      tracker.geo(new THREE.CylinderGeometry(0.24, 0.24, 0.65, 10, 1, false, 0, Math.PI)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: 0x4b4238, roughness: 0.85 }))
    );
    canopy.rotation.z = Math.PI / 2;
    canopy.rotation.y = Math.PI / 2;
    canopy.position.y = 0.12;
    sampan.add(hull, canopy);
    sampan.position.set(-1.35, 0.05, -3.2);
    sampan.rotation.y = 0.45;
    root.add(sampan);

    // Pink Lotus Clusters + Floating Glow Lotus Lanterns + Koi + Soaring Cranes
    for (const [lx, lz, ls] of [
      [-2.1, 2.3, 0.95],
      [-1.3, 2.8, 0.8],
      [1.2, 2.7, 0.9],
      [2.1, 2.0, 0.75],
      [-2.6, 0.8, 0.85],
    ]) {
      root.add(buildPinkLotusFlower(tracker, isSoftwareGl, lx, lz, ls));
    }

    const lanterns: { group: THREE.Group; baseX: number; baseZ: number; phase: number }[] = [];
    const lanternCoords = [
      [0.45, 1.75, 0xffcc70],
      [1.55, 0.35, 0xffb36b],
      [-0.45, -0.75, 0xffe09c],
      [-2.0, 0.0, 0xffd280],
      [0.85, -1.9, 0xffb86c],
    ] as const;
    lanternCoords.forEach(([lx, lz, col], idx) => {
      const l = buildLotusLantern(tracker, isSoftwareGl, col);
      l.position.set(lx, 0.02, lz);
      l.scale.setScalar(0.85 + (idx % 3) * 0.12);
      root.add(l);
      lanterns.push({ group: l, baseX: lx, baseZ: lz, phase: idx * 1.3 });
    });

    const cranes = addSoaringCranes(root, tracker, isSoftwareGl ? 3 : 5, -0.5, -6.5, 3.4, 3.8);
    const koi = addSwimmingKoi(root, tracker, isSoftwareGl ? 3 : 5, 0.4, 0.6, 1.9);

    const sunDust = createParticles(
      tracker,
      isSoftwareGl ? 24 : 52,
      0xffe7a8,
      { x: 6, y: 3.4, z: 6, yMin: 0.2 },
      0.055,
      glowTex
    );
    root.add(sunDust.mesh);

    return {
      root,
      cameraPosition,
      cameraTarget,
      fov,
      fogColor,
      fogDensity,
      backgroundHex,
      update: (dt, elapsed) => {
        waterNormal.offset.x += dt * 0.022;
        waterNormal.offset.y += dt * 0.014;
        fallA.offset.y -= dt * 0.72;
        pavilionGlow.intensity = 3.4 + Math.sin(elapsed * 2.2) * 0.35;
        sampan.position.x = -1.35 + Math.sin(elapsed * 0.25) * 0.35;
        sampan.rotation.z = Math.sin(elapsed * 1.1) * 0.025;

        updateCranesAndKoi(cranes, koi, elapsed);

        for (const l of lanterns) {
          l.group.position.y = 0.02 + Math.sin(elapsed * 1.25 + l.phase) * 0.03;
          l.group.position.x = l.baseX + Math.sin(elapsed * 0.4 + l.phase) * 0.1;
          l.group.rotation.y = elapsed * 0.12 + l.phase;
          const flame = l.group.getObjectByName('flame');
          if (flame) flame.scale.y = 1.45 + Math.sin(elapsed * 7 + l.phase) * 0.18;
        }

        for (let i = 0; i < sunDust.items.length; i++) {
          const p = sunDust.items[i];
          sunDust.dummy.position.set(
            p.baseX + Math.sin(elapsed * p.speed + p.phase) * 0.35,
            p.baseY + Math.cos(elapsed * p.speed * 0.8 + p.phase) * 0.22,
            p.baseZ + Math.sin(elapsed * p.speed * 0.6 + p.phase) * 0.28
          );
          sunDust.dummy.scale.setScalar(p.scale * (0.75 + Math.sin(elapsed * 2.4 + p.phase) * 0.25));
          sunDust.dummy.lookAt(cameraPosition);
          sunDust.dummy.updateMatrix();
          sunDust.mesh.setMatrixAt(i, sunDust.dummy.matrix);
        }
        sunDust.mesh.instanceMatrix.needsUpdate = true;
      },
      dispose: () => tracker.disposeAll(),
    };
  }

  // ===========================================================================
  // 2. OVERVIEW SCENE — Sunlit Terraced Emerald Valley + Mood Crystal (Mood Reactive)
  // ===========================================================================
  if (variant === 'overview') {
    cameraPosition = new THREE.Vector3(0, 2.05, 5.5);
    cameraTarget = new THREE.Vector3(0, 0.95, -0.5);
    fov = 42;
    fogColor = 0xa7d6cc;
    fogDensity = 0.024;
    backgroundHex = 0xa7d6cc;

    addPaintedSky('#5da9d8', '#9fd5e6', '#dcf0dc', {
      stars: false,
      cloudTint: 'rgba(255, 255, 255, 0.48)',
      sunHex: '#fff4c2',
      sunX: 0.72,
      sunY: 0.26,
    });

    const hemi = new THREE.HemisphereLight(0xe4f5eb, 0x2f5439, 1.15);
    const key = new THREE.DirectionalLight(0xfff4dc, 1.75);
    key.position.set(4, 7, 4);
    const coreLight = new THREE.PointLight(0x7ac79b, 4.2, 11, 1.5);
    coreLight.position.set(0, 1.25, 0.5);
    root.add(hemi, key, coreLight);

    // Emerald Valley Water Basin + Background Karst Mountains & Waterfall
    const waterNormal = vault.createWaterRippleNormal();
    const valleyWater = new THREE.Mesh(
      tracker.geo(new THREE.PlaneGeometry(46, 46)),
      tracker.mat(
        new THREE.MeshPhysicalMaterial({
          color: 0x388578,
          roughness: 0.14,
          normalMap: waterNormal,
          clearcoat: isSoftwareGl ? 0 : 0.85,
        })
      )
    );
    valleyWater.rotation.x = -Math.PI / 2;
    valleyWater.position.y = -0.18;
    root.add(valleyWater);

    addKarstMountains(root, tracker, vault, [
      [-5.5, -13.5, 3.2, 7.8, 0.4],
      [0.4, -15.5, 4.0, 9.2, 1.7],
      [5.8, -12.5, 3.0, 6.8, 2.8],
    ]);
    const fallTex = addWaterfallChute(root, tracker, vault, 2.6, -0.18, -8.5, 1.0, 4.2, -0.25);

    // Terraced Moss & Stone Sanctuary Pedestal
    const basin = new THREE.Mesh(
      tracker.geo(new THREE.CylinderGeometry(2.15, 2.55, 0.36, 32)),
      tracker.mat(new THREE.MeshStandardMaterial({ map: vault.createStoneMoss(), roughness: 0.75 }))
    );
    basin.position.y = -0.08;
    root.add(basin);

    const pool = new THREE.Mesh(
      tracker.geo(new THREE.CircleGeometry(1.9, 32)),
      tracker.mat(
        new THREE.MeshPhysicalMaterial({
          color: 0x266b5c,
          roughness: 0.1,
          normalMap: waterNormal,
          clearcoat: isSoftwareGl ? 0 : 0.9,
        })
      )
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.11;
    root.add(pool);

    // Central faceted mood crystal
    const crystalGeo = tracker.geo(new THREE.OctahedronGeometry(0.68, 0));
    crystalGeo.scale(0.82, 1.45, 0.82);
    const crystalMat = tracker.mat(
      new THREE.MeshPhysicalMaterial({
        color: 0x8ad1a8,
        emissive: 0x2e6e4a,
        emissiveIntensity: 0.55,
        roughness: 0.14,
        metalness: 0.08,
        clearcoat: isSoftwareGl ? 0 : 1,
        iridescence: isSoftwareGl ? 0 : 0.75,
        transparent: true,
        opacity: 0.92,
      })
    );
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 1.32;
    root.add(crystal);

    const ringMat = tracker.mat(
      new THREE.MeshStandardMaterial({ color: 0xd6b877, metalness: 0.88, roughness: 0.24 })
    );
    const ringA = new THREE.Mesh(tracker.geo(new THREE.TorusGeometry(1.12, 0.022, 12, 48)), ringMat);
    const ringB = new THREE.Mesh(tracker.geo(new THREE.TorusGeometry(1.38, 0.016, 12, 48)), ringMat);
    ringA.position.y = 1.3;
    ringB.position.y = 1.3;
    root.add(ringA, ringB);

    const satOrbs: THREE.Mesh[] = [];
    const moodHexes = [0x6f7fa8, 0x76949f, 0x7ab892, 0xc7be73, 0xe8b976];
    for (let i = 0; i < 5; i++) {
      const orbMat = tracker.mat(
        new THREE.MeshStandardMaterial({
          color: moodHexes[i],
          emissive: moodHexes[i],
          emissiveIntensity: 0.45,
          roughness: 0.25,
        })
      );
      const orb = new THREE.Mesh(tracker.geo(new THREE.SphereGeometry(0.11, 16, 16)), orbMat);
      root.add(orb);
      satOrbs.push(orb);
    }

    root.add(buildPinkLotusFlower(tracker, isSoftwareGl, -1.65, 1.45, 0.75));
    root.add(buildPinkLotusFlower(tracker, isSoftwareGl, 1.72, 1.35, 0.72));
    const cranes = addSoaringCranes(root, tracker, isSoftwareGl ? 2 : 4, -1.2, -7.0, 3.3, 3.2);

    const aura = createParticles(
      tracker,
      isSoftwareGl ? 22 : 48,
      0xe6fff0,
      { x: 3.4, y: 2.5, z: 3.0, yMin: 0.25 },
      0.048,
      glowTex
    );
    root.add(aura.mesh);

    const targetColor = new THREE.Color(0x7ac79b);
    const currentColor = new THREE.Color(0x7ac79b);

    return {
      root,
      cameraPosition,
      cameraTarget,
      fov,
      fogColor,
      fogDensity,
      backgroundHex,
      update: (dt, elapsed, live) => {
        waterNormal.offset.x += dt * 0.018;
        fallTex.offset.y -= dt * 0.7;
        updateCranesAndKoi(cranes, [], elapsed);

        const moodIdx = Math.max(0, Math.min(4, (live.moodScore || 3) - 1));
        targetColor.setHex(moodHexes[moodIdx]);
        currentColor.lerp(targetColor, 1 - Math.exp(-3.5 * dt));

        crystalMat.color.copy(currentColor);
        crystalMat.emissive.copy(currentColor).multiplyScalar(0.5);
        coreLight.color.copy(currentColor);

        crystal.position.y = 1.3 + Math.sin(elapsed * 1.4) * 0.08;
        crystal.rotation.y = elapsed * 0.35;
        ringA.rotation.x = Math.PI * 0.32 + Math.sin(elapsed * 0.4) * 0.15;
        ringA.rotation.y = elapsed * 0.28;
        ringB.rotation.x = -Math.PI * 0.28 + Math.cos(elapsed * 0.35) * 0.15;
        ringB.rotation.z = -elapsed * 0.22;

        satOrbs.forEach((orb, idx) => {
          const ang = elapsed * 0.25 + (idx / 5) * Math.PI * 2;
          const isSelectedMood = idx === moodIdx;
          const rad = isSelectedMood ? 1.55 : 1.78;
          orb.position.set(
            Math.cos(ang) * rad,
            0.98 + Math.sin(elapsed * 1.1 + idx) * 0.16,
            Math.sin(ang) * rad
          );
          const sc = isSelectedMood ? 1.55 : 0.85;
          orb.scale.setScalar(THREE.MathUtils.damp(orb.scale.x, sc, 6, dt));
        });

        for (let i = 0; i < aura.items.length; i++) {
          const p = aura.items[i];
          aura.dummy.position.set(
            p.baseX + Math.sin(elapsed * p.speed + p.phase) * 0.22,
            p.baseY + Math.cos(elapsed * p.speed + p.phase) * 0.18,
            p.baseZ
          );
          aura.dummy.lookAt(cameraPosition);
          aura.dummy.scale.setScalar(p.scale);
          aura.dummy.updateMatrix();
          aura.mesh.setMatrixAt(i, aura.dummy.matrix);
        }
        aura.mesh.instanceMatrix.needsUpdate = true;
      },
      dispose: () => tracker.disposeAll(),
    };
  }

  // ===========================================================================
  // 3. JOURNAL SCENE — Countryside Cedar Veranda overlooking Sunlit River, Cottage & Palms
  // ===========================================================================
  if (variant === 'journal') {
    cameraPosition = new THREE.Vector3(0.35, 2.05, 4.65);
    cameraTarget = new THREE.Vector3(0, 0.72, -1.5);
    fov = 42;
    fogColor = 0xb9dec4;
    fogDensity = 0.022;
    backgroundHex = 0xb9dec4;

    addPaintedSky('#5da8db', '#a7dced', '#ddf1d5', {
      stars: false,
      cloudTint: 'rgba(255, 255, 255, 0.5)',
      sunHex: '#fff0ba',
      sunX: 0.25,
      sunY: 0.26,
    });

    const hemi = new THREE.HemisphereLight(0xeef7e4, 0x304a2b, 1.18);
    const morningSun = new THREE.DirectionalLight(0xfff1cf, 1.75);
    morningSun.position.set(-5, 7, 3);
    const candleLight = new THREE.PointLight(0xffb454, 4.0, 9, 1.6);
    candleLight.position.set(-1.1, 1.12, -0.35);
    root.add(hemi, morningSun, candleLight);

    // Emerald River stretching out beyond the veranda
    const waterNormal = vault.createWaterRippleNormal();
    const river = new THREE.Mesh(
      tracker.geo(new THREE.PlaneGeometry(44, 44)),
      tracker.mat(
        new THREE.MeshPhysicalMaterial({
          color: 0x45804d,
          roughness: 0.15,
          normalMap: waterNormal,
          clearcoat: isSoftwareGl ? 0 : 0.8,
        })
      )
    );
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, -0.55, -8);
    root.add(river);

    // Opposite Countryside Bank + Stone Cottage + Tropical Banana Palms + Green Hills
    const farBank = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(10, 0.7, 6.5)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: 0x5c7d42, roughness: 0.92 }))
    );
    farBank.position.set(-3.2, -0.42, -6.5);
    root.add(farBank);

    addCountrysideCottage(root, tracker, vault, -3.5, -0.06, -6.2, 0.42);
    const palmTex = vault.createBotanicalSprig('palm');
    const oakTex = vault.createBotanicalSprig('oak');
    addBotanicalBoughCluster(root, tracker, palmTex, -1.6, 1.15, -5.6, 2.3, 0.05);
    addBotanicalBoughCluster(root, tracker, oakTex, -5.2, 1.8, -7.8, 3.0, -0.1);
    addBotanicalBoughCluster(root, tracker, oakTex, 3.8, 1.45, -6.8, 2.7, 0.12);

    addKarstMountains(root, tracker, vault, [
      [-6.5, -14.0, 3.5, 7.6, 0.3, 0x62805e],
      [-0.2, -16.5, 4.4, 8.8, 1.5, 0x5c7c5c],
      [6.2, -14.2, 3.6, 7.2, 2.6, 0x648361],
    ]);

    // Foreground Rich Walnut Veranda Desk
    const deskTex = vault.createWoodGrain('#593d29', '#322014');
    const desk = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(7.2, 0.28, 3.4)),
      tracker.mat(new THREE.MeshStandardMaterial({ map: deskTex, roughness: 0.65 }))
    );
    desk.position.set(0, -0.14, 0.35);
    root.add(desk);

    // Open Linen Journal + Fountain Pen
    const bookGroup = new THREE.Group();
    const coverMat = tracker.mat(new THREE.MeshStandardMaterial({ color: 0x354a37, roughness: 0.82 }));
    const cover = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(2.15, 0.05, 1.5)), coverMat);
    cover.position.y = 0.03;
    bookGroup.add(cover);

    const pageTex = vault.createLinenPaper(true);
    const pageMat = tracker.mat(new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.88 }));
    const leftPage = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.98, 0.06, 1.4)), pageMat);
    leftPage.position.set(-0.51, 0.075, 0);
    leftPage.rotation.z = 0.045;
    const rightPage = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(0.98, 0.06, 1.4)), pageMat);
    rightPage.position.set(0.51, 0.075, 0);
    rightPage.rotation.z = -0.045;
    bookGroup.add(leftPage, rightPage);

    const brassMat = tracker.mat(new THREE.MeshStandardMaterial({ color: 0xd8b56b, metalness: 0.85, roughness: 0.25 }));
    const penBody = new THREE.Mesh(
      tracker.geo(new THREE.CylinderGeometry(0.028, 0.025, 1.05, 12)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: 0x1e2c22, roughness: 0.35, metalness: 0.2 }))
    );
    penBody.rotation.z = Math.PI / 2;
    penBody.rotation.y = 0.42;
    penBody.position.set(0.7, 0.13, 0.48);
    const penTip = new THREE.Mesh(tracker.geo(new THREE.ConeGeometry(0.024, 0.12, 10)), brassMat);
    penTip.rotation.z = -Math.PI / 2;
    penTip.position.set(0.55, 0, 0);
    penBody.add(penTip);
    bookGroup.add(penBody);
    bookGroup.rotation.y = -0.18;
    bookGroup.position.set(0.15, 0, 0.25);
    root.add(bookGroup);

    // Beeswax Candle
    const candleGroup = new THREE.Group();
    const saucer = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.28, 0.22, 0.06, 20)), brassMat);
    const wax = new THREE.Mesh(
      tracker.geo(new THREE.CylinderGeometry(0.16, 0.17, 0.68, 20)),
      tracker.mat(new THREE.MeshPhysicalMaterial({ color: 0xf6ead0, roughness: 0.45, clearcoat: isSoftwareGl ? 0 : 0.2 }))
    );
    wax.position.y = 0.36;
    const flame = new THREE.Mesh(
      tracker.geo(new THREE.SphereGeometry(0.045, 12, 12)),
      tracker.mat(new THREE.MeshBasicMaterial({ color: 0xffd076 }))
    );
    flame.scale.set(0.75, 1.85, 0.75);
    flame.position.y = 0.78;
    candleGroup.add(saucer, wax, flame);
    candleGroup.position.set(-1.1, 0.03, -0.35);
    root.add(candleGroup);

    // Ceramic Teacup + Steam
    const cupProfile = [
      new THREE.Vector2(0.01, 0),
      new THREE.Vector2(0.18, 0),
      new THREE.Vector2(0.26, 0.18),
      new THREE.Vector2(0.29, 0.42),
      new THREE.Vector2(0.26, 0.43),
      new THREE.Vector2(0.22, 0.16),
      new THREE.Vector2(0.01, 0.04),
    ];
    const teacup = new THREE.Mesh(
      tracker.geo(new THREE.LatheGeometry(cupProfile, 24)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: 0xeee8d8, roughness: 0.4 }))
    );
    teacup.position.set(1.38, 0.01, -0.35);
    root.add(teacup);

    const steam = createParticles(
      tracker,
      isSoftwareGl ? 18 : 34,
      0xffffff,
      { x: 0.35, y: 1.4, z: 0.35, yMin: 0.48 },
      0.04,
      glowTex
    );
    steam.mesh.position.set(1.38, 0, -0.35);
    root.add(steam.mesh);

    return {
      root,
      cameraPosition,
      cameraTarget,
      fov,
      fogColor,
      fogDensity,
      backgroundHex,
      update: (dt, elapsed) => {
        waterNormal.offset.x += dt * 0.015;
        candleLight.intensity = 3.8 + Math.sin(elapsed * 6.5) * 0.35;
        flame.scale.y = 1.8 + Math.sin(elapsed * 8.1) * 0.18;
        flame.rotation.z = Math.sin(elapsed * 4.5) * 0.08;

        for (let i = 0; i < steam.items.length; i++) {
          const p = steam.items[i];
          const progress = (((elapsed * 0.28 * p.speed + p.phase) % 1) + 1) % 1;
          steam.dummy.position.set(
            p.baseX * 0.35 + Math.sin(progress * 6 + p.phase) * 0.06,
            0.46 + progress * 1.1,
            p.baseZ * 0.35
          );
          const fade = Math.sin(progress * Math.PI) * 0.9;
          steam.dummy.scale.setScalar(p.scale * (0.6 + progress) * Math.max(0.05, fade));
          steam.dummy.lookAt(cameraPosition);
          steam.dummy.updateMatrix();
          steam.mesh.setMatrixAt(i, steam.dummy.matrix);
        }
        steam.mesh.instanceMatrix.needsUpdate = true;
      },
      dispose: () => tracker.disposeAll(),
    };
  }

  // ===========================================================================
  // 4. UNSENT LETTERS SCENE — Crimson Plum Blossom Cliff Terrace at Rose-Gold Dusk (Burn Reactive)
  // ===========================================================================
  if (variant === 'letters') {
    cameraPosition = new THREE.Vector3(0.2, 2.05, 4.6);
    cameraTarget = new THREE.Vector3(0, 0.55, -0.8);
    fov = 41;
    fogColor = 0xc99c8c;
    fogDensity = 0.025;
    backgroundHex = 0xc99c8c;

    addPaintedSky('#746a9c', '#cf8d8a', '#f3c3a2', {
      stars: false,
      cloudTint: 'rgba(255, 220, 210, 0.38)',
      sunHex: '#ffb982',
      sunX: 0.72,
      sunY: 0.38,
    });

    const hemi = new THREE.HemisphereLight(0xf6c9b8, 0x3b2723, 1.05);
    const warmSpot = new THREE.PointLight(0xffa463, 4.2, 12, 1.5);
    warmSpot.position.set(0.4, 2.2, 1.2);
    const emberLight = new THREE.PointLight(0xff6b35, 1.8, 8, 1.5);
    emberLight.position.set(0, 0.4, 0.2);
    root.add(hemi, warmSpot, emberLight);

    // Distant Dusk Karst Valley & Calm River
    const river = new THREE.Mesh(
      tracker.geo(new THREE.PlaneGeometry(46, 46)),
      tracker.mat(new THREE.MeshPhysicalMaterial({ color: 0x5c5f6e, roughness: 0.16, clearcoat: isSoftwareGl ? 0 : 0.75 }))
    );
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, -0.8, -8);
    root.add(river);

    addKarstMountains(root, tracker, vault, [
      [-6.2, -13.5, 3.4, 8.2, 0.5, 0x6e606b],
      [0.8, -15.8, 4.1, 9.6, 1.9, 0x625663],
      [6.4, -13.0, 3.2, 7.6, 3.1, 0x6e5f68],
    ]);

    // Framing Crimson Plum Blossom ("Mai đỏ") boughs overhanging upper corners
    const plumTex = vault.createBotanicalSprig('plum');
    addBotanicalBoughCluster(root, tracker, plumTex, 1.9, 2.1, -1.6, 2.0, 0.18);
    addBotanicalBoughCluster(root, tracker, plumTex, -2.0, 2.25, -2.1, 1.8, -0.22);

    // Cliffside Slate Writing Table
    const desk = new THREE.Mesh(
      tracker.geo(new THREE.BoxGeometry(6.8, 0.28, 3.2)),
      tracker.mat(new THREE.MeshStandardMaterial({ map: vault.createWoodGrain('#4b3227', '#291a13'), roughness: 0.72 }))
    );
    desk.position.set(0, -0.14, 0.35);
    root.add(desk);

    // Parchment Envelope + Crimson Wax Seal
    const envelopeGroup = new THREE.Group();
    const paperMat = tracker.mat(new THREE.MeshStandardMaterial({ map: vault.createLinenPaper(false), roughness: 0.82 }));
    const body = new THREE.Mesh(tracker.geo(new THREE.BoxGeometry(2.15, 0.06, 1.38)), paperMat);
    body.position.y = 0.04;
    envelopeGroup.add(body);

    const flapShape = new THREE.Shape();
    flapShape.moveTo(-1.05, 0);
    flapShape.lineTo(1.05, 0);
    flapShape.lineTo(0, -0.72);
    flapShape.closePath();
    const flap = new THREE.Mesh(
      tracker.geo(
        new THREE.ExtrudeGeometry(flapShape, { depth: 0.025, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008 })
      ),
      paperMat
    );
    flap.rotation.x = Math.PI / 2;
    flap.position.set(0, 0.09, -0.66);
    envelopeGroup.add(flap);

    const waxMat = tracker.mat(
      new THREE.MeshPhysicalMaterial({ color: 0xa32c28, roughness: 0.32, clearcoat: isSoftwareGl ? 0 : 0.45 })
    );
    const waxSeal = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.18, 0.2, 0.045, 24)), waxMat);
    waxSeal.position.set(0, 0.1, 0.05);
    const waxRim = new THREE.Mesh(tracker.geo(new THREE.TorusGeometry(0.13, 0.024, 10, 24)), waxMat);
    waxRim.rotation.x = Math.PI / 2;
    waxRim.position.set(0, 0.125, 0.05);
    envelopeGroup.add(waxSeal, waxRim);
    envelopeGroup.rotation.y = -0.16;
    envelopeGroup.position.set(0, 0, 0.25);
    root.add(envelopeGroup);

    // Bronze Incense / Ash Bowl
    const bowlProfile = [
      new THREE.Vector2(0.01, 0),
      new THREE.Vector2(0.28, 0.02),
      new THREE.Vector2(0.42, 0.26),
      new THREE.Vector2(0.36, 0.3),
      new THREE.Vector2(0.31, 0.26),
      new THREE.Vector2(0.01, 0.06),
    ];
    const bowl = new THREE.Mesh(
      tracker.geo(new THREE.LatheGeometry(bowlProfile, 24)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: 0x7c5d3a, metalness: 0.72, roughness: 0.35 }))
    );
    bowl.position.set(-1.35, 0, -0.45);
    root.add(bowl);

    // Rising Ember Sparks (reactive to burning unsent letter)
    const embers = createParticles(
      tracker,
      isSoftwareGl ? 28 : 60,
      0xffa458,
      { x: 2.2, y: 2.4, z: 1.5, yMin: 0.1 },
      0.044,
      glowTex
    );
    root.add(embers.mesh);

    let emberBoost = 0;

    return {
      root,
      cameraPosition,
      cameraTarget,
      fov,
      fogColor,
      fogDensity,
      backgroundHex,
      update: (dt, elapsed, live) => {
        const targetBoost = live.activeEffect ? 1 : 0;
        emberBoost = THREE.MathUtils.damp(emberBoost, targetBoost, 4, dt);
        emberLight.intensity = 1.6 + emberBoost * 4.5 + Math.sin(elapsed * 5) * 0.3;
        envelopeGroup.position.y = Math.sin(elapsed * 0.9) * 0.015;

        const speedMul = 1 + emberBoost * 2.5;
        for (let i = 0; i < embers.items.length; i++) {
          const p = embers.items[i];
          const progress = (((elapsed * 0.22 * p.speed * speedMul + p.phase) % 1) + 1) % 1;
          const swirl = elapsed * (0.4 + emberBoost * 1.6) + p.phase;
          embers.dummy.position.set(
            p.baseX * (1 - progress * 0.35) + Math.sin(swirl) * (0.12 + emberBoost * 0.35),
            0.08 + progress * 2.5,
            p.baseZ * 0.5 + Math.cos(swirl) * 0.15
          );
          const sc = p.scale * (1 + emberBoost * 0.75) * Math.sin(progress * Math.PI);
          embers.dummy.scale.setScalar(Math.max(0.04, sc));
          embers.dummy.lookAt(cameraPosition);
          embers.dummy.updateMatrix();
          embers.mesh.setMatrixAt(i, embers.dummy.matrix);
        }
        embers.mesh.instanceMatrix.needsUpdate = true;
      },
      dispose: () => tracker.disposeAll(),
    };
  }

  // ===========================================================================
  // 5. WISH TREE SCENE — Ancient Wish Tree beside Mountain Waterfall + Cranes + Petals
  // ===========================================================================
  if (variant === 'wishes') {
    cameraPosition = new THREE.Vector3(0.15, 2.05, 5.7);
    cameraTarget = new THREE.Vector3(0, 1.35, -0.4);
    fov = 42;
    fogColor = 0xaad8d0;
    fogDensity = 0.022;
    backgroundHex = 0xaad8d0;

    addPaintedSky('#56a5d6', '#9fd7e3', '#d6f0de', {
      stars: false,
      cloudTint: 'rgba(255, 255, 255, 0.48)',
      sunHex: '#fff5c8',
      sunX: 0.75,
      sunY: 0.25,
    });

    const hemi = new THREE.HemisphereLight(0xebf7e4, 0x2b4d30, 1.18);
    const sun = new THREE.DirectionalLight(0xfff1cf, 1.78);
    sun.position.set(5, 7, 4);
    const treeGlow = new THREE.PointLight(0xffcb7d, 2.2, 8, 1.6);
    treeGlow.position.set(0, 1.7, 0.9);
    root.add(hemi, sun, treeGlow);

    // Turquoise Mountain Lagoon & Distant Karst Waterfall
    const waterNormal = vault.createWaterRippleNormal();
    const lagoon = new THREE.Mesh(
      tracker.geo(new THREE.PlaneGeometry(46, 46)),
      tracker.mat(
        new THREE.MeshPhysicalMaterial({
          color: 0x348c8a,
          roughness: 0.14,
          normalMap: waterNormal,
          clearcoat: isSoftwareGl ? 0 : 0.85,
        })
      )
    );
    lagoon.rotation.x = -Math.PI / 2;
    lagoon.position.y = -0.28;
    root.add(lagoon);

    addKarstMountains(root, tracker, vault, [
      [-6.0, -13.0, 3.3, 8.2, 0.8],
      [-0.5, -15.5, 4.0, 9.6, 2.1],
      [5.5, -12.8, 3.2, 7.8, 3.3],
    ]);
    const fallTex = addWaterfallChute(root, tracker, vault, -3.5, -0.28, -8.8, 1.25, 4.8, 0.22);

    // Mossy Stone Island Pedestal
    const stone = new THREE.Mesh(
      tracker.geo(new THREE.CylinderGeometry(1.75, 2.25, 0.56, 28)),
      tracker.mat(new THREE.MeshStandardMaterial({ map: vault.createStoneMoss(), roughness: 0.88 }))
    );
    stone.position.y = -0.22;
    root.add(stone);

    const grass = new THREE.Mesh(
      tracker.geo(new THREE.SphereGeometry(1.7, 24, 14)),
      tracker.mat(new THREE.MeshStandardMaterial({ color: 0x457c42, roughness: 0.88 }))
    );
    grass.scale.set(1, 0.22, 1);
    grass.position.y = 0.02;
    root.add(grass);

    // Ancient Multi-Branch Curved Trunk + Oak & Plum Blossom Canopy
    const barkMat = tracker.mat(new THREE.MeshStandardMaterial({ color: 0x4b3526, roughness: 0.9 }));
    const branches = [
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.15, 0.75, 0.08),
        new THREE.Vector3(-0.08, 1.55, -0.05),
        new THREE.Vector3(0.25, 2.25, 0),
      ],
      [
        new THREE.Vector3(-0.08, 1.15, 0.04),
        new THREE.Vector3(-0.65, 1.55, 0.22),
        new THREE.Vector3(-1.15, 1.85, 0.28),
      ],
      [
        new THREE.Vector3(0.04, 1.45, -0.02),
        new THREE.Vector3(0.75, 1.8, -0.2),
        new THREE.Vector3(1.22, 2.02, -0.1),
      ],
    ];
    branches.forEach((pts, idx) => {
      const curve = new THREE.CatmullRomCurve3(pts);
      const radius = idx === 0 ? 0.14 : 0.085;
      root.add(new THREE.Mesh(tracker.geo(new THREE.TubeGeometry(curve, 18, radius, 10, false)), barkMat));
    });

    const oakTex = vault.createBotanicalSprig('oak');
    const plumTex = vault.createBotanicalSprig('plum');
    addBotanicalBoughCluster(root, tracker, oakTex, 0.25, 2.35, 0.0, 1.8, 0.05);
    addBotanicalBoughCluster(root, tracker, plumTex, -1.05, 1.95, 0.22, 1.55, -0.18);
    addBotanicalBoughCluster(root, tracker, oakTex, 1.15, 2.1, -0.08, 1.45, 0.15);

    // Swaying Crimson & Gold Silk Wish Ribbons
    const ribbons: { mesh: THREE.Mesh; phase: number }[] = [];
    const ribbonGeo = tracker.geo(new THREE.PlaneGeometry(0.085, 0.42));
    ribbonGeo.translate(0, -0.21, 0);
    const ribbonPalette = [0xc94f3d, 0xe8b86b, 0xdf6e57, 0xf2d188];
    const ribbonAnchors = [
      [-1.05, 1.78, 0.35],
      [-0.78, 1.56, 0.22],
      [0.2, 2.05, 0.22],
      [0.72, 1.75, -0.05],
      [1.12, 1.9, -0.12],
      [-0.18, 1.95, -0.2],
    ];
    ribbonAnchors.forEach(([rx, ry, rz], idx) => {
      const mat = tracker.mat(
        new THREE.MeshStandardMaterial({
          color: ribbonPalette[idx % ribbonPalette.length],
          emissive: ribbonPalette[idx % ribbonPalette.length],
          emissiveIntensity: 0.2,
          side: THREE.DoubleSide,
          roughness: 0.6,
        })
      );
      const ribbon = new THREE.Mesh(ribbonGeo, mat);
      ribbon.position.set(rx, ry, rz);
      root.add(ribbon);
      ribbons.push({ mesh: ribbon, phase: idx * 1.1 });
    });

    const cranes = addSoaringCranes(root, tracker, isSoftwareGl ? 3 : 4, 1.5, -7.2, 3.4, 3.4);

    const petals = createParticles(
      tracker,
      isSoftwareGl ? 22 : 50,
      0xffb4c4,
      { x: 4.5, y: 2.8, z: 3.5, yMin: 0.15 },
      0.048,
      glowTex
    );
    root.add(petals.mesh);

    return {
      root,
      cameraPosition,
      cameraTarget,
      fov,
      fogColor,
      fogDensity,
      backgroundHex,
      update: (dt, elapsed) => {
        waterNormal.offset.x += dt * 0.016;
        fallTex.offset.y -= dt * 0.72;
        updateCranesAndKoi(cranes, [], elapsed);

        for (const r of ribbons) {
          r.mesh.rotation.z = Math.sin(elapsed * 1.45 + r.phase) * 0.14;
          r.mesh.rotation.x = Math.cos(elapsed * 1.1 + r.phase) * 0.08;
        }
        for (let i = 0; i < petals.items.length; i++) {
          const p = petals.items[i];
          const drift = (((elapsed * 0.16 * p.speed + p.phase) % 1) + 1) % 1;
          petals.dummy.position.set(
            p.baseX + Math.sin(elapsed * 0.9 + p.phase) * 0.45,
            2.9 - drift * 2.75,
            p.baseZ + Math.cos(elapsed * 0.7 + p.phase) * 0.25
          );
          petals.dummy.scale.setScalar(p.scale * Math.sin(drift * Math.PI));
          petals.dummy.lookAt(cameraPosition);
          petals.dummy.updateMatrix();
          petals.mesh.setMatrixAt(i, petals.dummy.matrix);
        }
        petals.mesh.instanceMatrix.needsUpdate = true;
      },
      dispose: () => tracker.disposeAll(),
    };
  }

  // ===========================================================================
  // 6. CALM SCENE — Azure Multi-Tiered Lagoon & Cliff Waterfall Steps (Breath Reactive)
  // ===========================================================================
  if (variant === 'calm') {
    cameraPosition = new THREE.Vector3(0, 1.95, 5.4);
    cameraTarget = new THREE.Vector3(0, 1.0, -0.5);
    fov = 42;
    fogColor = 0x9ad8e3;
    fogDensity = 0.022;
    backgroundHex = 0x9ad8e3;

    addPaintedSky('#4ba6e3', '#8ed2f0', '#dcf4ee', {
      stars: false,
      cloudTint: 'rgba(255, 255, 255, 0.55)',
      sunHex: '#fff9d6',
      sunX: 0.68,
      sunY: 0.24,
    });

    const hemi = new THREE.HemisphereLight(0xdef5ff, 0x265445, 1.2);
    const sunKey = new THREE.DirectionalLight(0xfff4dd, 1.75);
    sunKey.position.set(4, 7, 4);
    const auraLight = new THREE.PointLight(0x6fe6d0, 3.6, 10, 1.5);
    auraLight.position.set(0, 1.15, 0.3);
    root.add(hemi, sunKey, auraLight);

    // Vibrant Turquoise Lagoon Water
    const waterNormal = vault.createWaterRippleNormal();
    const lagoon = new THREE.Mesh(
      tracker.geo(new THREE.PlaneGeometry(48, 48)),
      tracker.mat(
        new THREE.MeshPhysicalMaterial({
          color: 0x2299a8,
          roughness: 0.12,
          metalness: 0.16,
          normalMap: waterNormal,
          clearcoat: isSoftwareGl ? 0 : 0.9,
        })
      )
    );
    lagoon.rotation.x = -Math.PI / 2;
    root.add(lagoon);

    // Twin Mountain Cascades + Distant Vermilion Pagoda + Winding Cliff Steps
    addKarstMountains(root, tracker, vault, [
      [-5.6, -13.2, 3.4, 8.2, 0.5, 0x567d62],
      [0.2, -15.5, 4.2, 9.2, 1.9, 0x4f785f],
      [5.8, -12.6, 3.3, 7.6, 3.0, 0x5c8062],
    ]);
    const fallTexA = addWaterfallChute(root, tracker, vault, -3.4, 0.0, -7.8, 1.1, 4.8, 0.28);
    const fallTexB = addWaterfallChute(root, tracker, vault, 2.2, 0.0, -9.2, 0.95, 3.5, -0.2);

    addTraditionalPavilion(root, tracker, vault, 4.1, 1.65, -8.5, 0x8e2c26, 0xb8372c, 0.75);

    // Winding Wooden Cliffside Staircase on left
    const stepMat = tracker.mat(
      new THREE.MeshStandardMaterial({ map: vault.createWoodGrain('#7c5a3c', '#452f1d'), roughness: 0.78 })
    );
    const stepGeo = tracker.geo(new THREE.BoxGeometry(0.7, 0.08, 0.34));
    for (let s = 0; s < 10; s++) {
      const t = s / 9;
      const step = new THREE.Mesh(stepGeo, stepMat);
      step.position.set(-4.6 + Math.sin(t * 2.0) * 0.4, 0.18 + t * 2.2, -5.0 - t * 2.5);
      step.rotation.y = 0.25;
      root.add(step);
    }

    // Pink Lotus Pond Accent + Framing Crimson Blossom Branch
    const plumTex = vault.createBotanicalSprig('plum');
    addBotanicalBoughCluster(root, tracker, plumTex, 2.2, 2.25, -1.8, 1.75, 0.2);
    root.add(buildPinkLotusFlower(tracker, isSoftwareGl, -1.65, 1.75, 0.88));
    root.add(buildPinkLotusFlower(tracker, isSoftwareGl, 1.75, 1.65, 0.85));

    // Expanding Zen Water Ripple Rings
    const ringWaves: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const rMat = tracker.mat(
        new THREE.MeshBasicMaterial({
          color: 0xc2f8ee,
          transparent: true,
          opacity: 0.42 - i * 0.1,
        })
      );
      const r = new THREE.Mesh(tracker.geo(new THREE.RingGeometry(0.95 + i * 0.45, 0.99 + i * 0.45, 48)), rMat);
      r.rotation.x = -Math.PI / 2;
      r.position.y = 0.03;
      root.add(r);
      ringWaves.push(r);
    }

    // Breath Sphere Core + Shell
    const sphereGroup = new THREE.Group();
    sphereGroup.position.y = 1.15;
    const coreMat = tracker.mat(
      new THREE.MeshPhysicalMaterial({
        color: 0x72e3ce,
        emissive: 0x1e8a78,
        emissiveIntensity: 0.65,
        roughness: 0.16,
        clearcoat: isSoftwareGl ? 0 : 1,
        iridescence: isSoftwareGl ? 0 : 0.85,
        transparent: true,
        opacity: 0.9,
      })
    );
    sphereGroup.add(new THREE.Mesh(tracker.geo(new THREE.SphereGeometry(0.56, 32, 24)), coreMat));
    const shell = new THREE.Mesh(
      tracker.geo(new THREE.IcosahedronGeometry(0.76, 1)),
      tracker.mat(
        new THREE.MeshStandardMaterial({ color: 0xe6fff9, wireframe: true, transparent: true, opacity: 0.28 })
      )
    );
    sphereGroup.add(shell);
    root.add(sphereGroup);

    const cranes = addSoaringCranes(root, tracker, isSoftwareGl ? 3 : 4, -0.5, -7.2, 3.6, 3.6);
    const breathDust = createParticles(
      tracker,
      isSoftwareGl ? 24 : 48,
      0xd8fff6,
      { x: 3.2, y: 2.2, z: 3.0, yMin: 0.2 },
      0.044,
      glowTex
    );
    root.add(breathDust.mesh);

    let currentScale = 1.0;

    return {
      root,
      cameraPosition,
      cameraTarget,
      fov,
      fogColor,
      fogDensity,
      backgroundHex,
      update: (dt, elapsed, live) => {
        waterNormal.offset.x += dt * 0.018;
        fallTexA.offset.y -= dt * 0.78;
        fallTexB.offset.y -= dt * 0.65;
        updateCranesAndKoi(cranes, [], elapsed);

        let targetScale = 1.0 + Math.sin(elapsed * 1.1) * 0.08;
        let targetIntensity = 0.65;
        if (live.breathRunning) {
          if (live.breathPhase === 'inhale') {
            targetScale = 1.38;
            targetIntensity = 0.95;
          } else if (live.breathPhase === 'hold') {
            targetScale = 1.42;
            targetIntensity = 1.25;
          } else {
            targetScale = 0.86;
            targetIntensity = 0.45;
          }
        }
        currentScale = THREE.MathUtils.damp(currentScale, targetScale, live.breathRunning ? 2.1 : 3.5, dt);
        sphereGroup.scale.setScalar(currentScale);
        sphereGroup.position.y = 1.15 + Math.sin(elapsed * 0.95) * 0.05;
        shell.rotation.y = elapsed * 0.22;
        shell.rotation.x = Math.sin(elapsed * 0.3) * 0.15;
        coreMat.emissiveIntensity = THREE.MathUtils.damp(coreMat.emissiveIntensity, targetIntensity, 3, dt);
        auraLight.intensity = 3.0 + currentScale * 1.7;

        ringWaves.forEach((rw, idx) => {
          const wScale = 0.9 + (currentScale - 0.86) * 0.45 + Math.sin(elapsed * 1.2 + idx) * 0.04;
          rw.scale.setScalar(wScale);
        });

        for (let i = 0; i < breathDust.items.length; i++) {
          const p = breathDust.items[i];
          const radial = 0.85 + (currentScale - 1) * 0.55;
          breathDust.dummy.position.set(
            p.baseX * radial + Math.sin(elapsed * 0.5 + p.phase) * 0.15,
            p.baseY + Math.cos(elapsed * 0.6 + p.phase) * 0.12,
            p.baseZ * radial
          );
          breathDust.dummy.scale.setScalar(p.scale);
          breathDust.dummy.lookAt(cameraPosition);
          breathDust.dummy.updateMatrix();
          breathDust.mesh.setMatrixAt(i, breathDust.dummy.matrix);
        }
        breathDust.mesh.instanceMatrix.needsUpdate = true;
      },
      dispose: () => tracker.disposeAll(),
    };
  }

  // ===========================================================================
  // 7. COMMUNITY SCENE — Twilight Riverside Tea Pavilion, Lotus & Floating Lanterns
  // ===========================================================================
  if (variant === 'community') {
    cameraPosition = new THREE.Vector3(0, 1.95, 5.4);
    cameraTarget = new THREE.Vector3(0, 0.82, -1.5);
    fov = 42;
    fogColor = 0xb9b4d6;
    fogDensity = 0.023;
    backgroundHex = 0xb9b4d6;

    addPaintedSky('#5c639c', '#9d8fc2', '#e8c7b8', {
      stars: true,
      cloudTint: 'rgba(240, 224, 248, 0.36)',
      sunHex: '#ffdca8',
      sunX: 0.3,
      sunY: 0.34,
    });

    const hemi = new THREE.HemisphereLight(0xd9d2f2, 0x26382b, 1.05);
    const lanternLightA = new THREE.PointLight(0xffbd6b, 3.6, 10, 1.5);
    lanternLightA.position.set(-0.95, 1.15, 0.2);
    const lanternLightB = new THREE.PointLight(0xffcf87, 3.5, 10, 1.5);
    lanternLightB.position.set(0.95, 1.15, -0.2);
    root.add(hemi, lanternLightA, lanternLightB);

    const waterNormal = vault.createWaterRippleNormal();
    const water = new THREE.Mesh(
      tracker.geo(new THREE.PlaneGeometry(46, 46)),
      tracker.mat(
        new THREE.MeshPhysicalMaterial({
          color: 0x386663,
          roughness: 0.15,
          normalMap: waterNormal,
          clearcoat: isSoftwareGl ? 0 : 0.85,
        })
      )
    );
    water.rotation.x = -Math.PI / 2;
    root.add(water);

    addKarstMountains(root, tracker, vault, [
      [-6.0, -13.5, 3.5, 8.2, 0.7, 0x5c6178],
      [0.6, -15.8, 4.2, 9.4, 1.8, 0x52586e],
      [6.2, -12.8, 3.3, 7.6, 2.9, 0x5c6375],
    ]);

    // Traditional Waterside Tea Gazebo across the river
    addTraditionalPavilion(root, tracker, vault, 2.9, 0.02, -5.8, 0xd8a648, 0x994a2b, 0.92);

    // Central Round Wooden Tea Pier Tray + Twin Teacups + Twin Floating Lotus Lanterns
    const tray = new THREE.Mesh(
      tracker.geo(new THREE.CylinderGeometry(1.15, 1.08, 0.1, 32)),
      tracker.mat(new THREE.MeshStandardMaterial({ map: vault.createWoodGrain('#6b4b33', '#362316'), roughness: 0.72 }))
    );
    tray.position.y = 0.08;
    root.add(tray);

    const cupMat = tracker.mat(new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 0.38 }));
    for (const cx of [-0.34, 0.34]) {
      const cup = new THREE.Mesh(tracker.geo(new THREE.CylinderGeometry(0.14, 0.1, 0.2, 16)), cupMat);
      cup.position.set(cx, 0.23, 0.1);
      root.add(cup);
    }

    root.add(buildPinkLotusFlower(tracker, isSoftwareGl, -2.0, 1.3, 0.85));
    root.add(buildPinkLotusFlower(tracker, isSoftwareGl, 2.1, 1.15, 0.8));

    const leftL = buildLotusLantern(tracker, isSoftwareGl, 0xffc66d);
    leftL.position.set(-1.35, 0.02, -0.35);
    leftL.scale.setScalar(1.18);
    const rightL = buildLotusLantern(tracker, isSoftwareGl, 0xffd78e);
    rightL.position.set(1.35, 0.02, -0.25);
    rightL.scale.setScalar(1.14);
    root.add(leftL, rightL);

    const koi = addSwimmingKoi(root, tracker, isSoftwareGl ? 3 : 4, 0.0, 0.8, 1.8);
    const sparks = createParticles(
      tracker,
      isSoftwareGl ? 24 : 50,
      0xffe0a1,
      { x: 4.5, y: 2.5, z: 3.5, yMin: 0.2 },
      0.05,
      glowTex
    );
    root.add(sparks.mesh);

    return {
      root,
      cameraPosition,
      cameraTarget,
      fov,
      fogColor,
      fogDensity,
      backgroundHex,
      update: (dt, elapsed) => {
        waterNormal.offset.x += dt * 0.015;
        updateCranesAndKoi([], koi, elapsed);
        leftL.position.y = 0.02 + Math.sin(elapsed * 1.1) * 0.03;
        rightL.position.y = 0.02 + Math.cos(elapsed * 1.0) * 0.03;
        leftL.rotation.y = elapsed * 0.12;
        rightL.rotation.y = -elapsed * 0.1;

        for (let i = 0; i < sparks.items.length; i++) {
          const p = sparks.items[i];
          sparks.dummy.position.set(
            p.baseX + Math.sin(elapsed * p.speed + p.phase) * 0.25,
            p.baseY + Math.cos(elapsed * p.speed + p.phase) * 0.2,
            p.baseZ
          );
          sparks.dummy.scale.setScalar(p.scale);
          sparks.dummy.lookAt(cameraPosition);
          sparks.dummy.updateMatrix();
          sparks.mesh.setMatrixAt(i, sparks.dummy.matrix);
        }
        sparks.mesh.instanceMatrix.needsUpdate = true;
      },
      dispose: () => tracker.disposeAll(),
    };
  }

  // ===========================================================================
  // 8. SPIRITUAL SCENE — Crimson Mountain Pagoda + Gnarled Cliff Pine + Astrolabe & Tarot
  // ===========================================================================
  cameraPosition = new THREE.Vector3(0, 2.0, 5.45);
  cameraTarget = new THREE.Vector3(0, 1.05, -0.8);
  fov = 42;
  fogColor = 0xb8c5e3;
  fogDensity = 0.024;
  backgroundHex = 0xb8c5e3;

  addPaintedSky('#5c78b8', '#98b2de', '#d8daf0', {
    stars: true,
    cloudTint: 'rgba(255, 240, 248, 0.42)',
    sunHex: '#ffeac2',
    sunX: 0.74,
    sunY: 0.28,
  });

  const hemi = new THREE.HemisphereLight(0xd9e4fa, 0x263226, 1.12);
  const goldLight = new THREE.PointLight(0xffcf77, 4.0, 12, 1.5);
  goldLight.position.set(0.8, 1.8, 1.6);
  const rimLight = new THREE.DirectionalLight(0xc2d8ff, 1.35);
  rimLight.position.set(-4, 5, -3);
  root.add(hemi, goldLight, rimLight);

  // Misty Mountain Lake + Karst Peaks + Cliff Pine + Foaming Waterfall + Crimson Pagoda
  const waterNormal = vault.createWaterRippleNormal();
  const lake = new THREE.Mesh(
    tracker.geo(new THREE.PlaneGeometry(46, 46)),
    tracker.mat(
      new THREE.MeshPhysicalMaterial({
        color: 0x3b6c61,
        roughness: 0.14,
        normalMap: waterNormal,
        clearcoat: isSoftwareGl ? 0 : 0.85,
      })
    )
  );
  lake.rotation.x = -Math.PI / 2;
  lake.position.y = -0.25;
  root.add(lake);

  addKarstMountains(root, tracker, vault, [
    [-5.8, -12.8, 3.5, 8.6, 0.9, 0x5c6b78],
    [0.0, -15.5, 4.3, 9.8, 2.2, 0x536275],
    [5.8, -12.2, 3.4, 8.2, 3.5, 0x5d6c7a],
  ]);
  const spiritFallTex = addWaterfallChute(root, tracker, vault, -3.6, -0.25, -8.0, 1.1, 4.8, 0.28);

  // Gnarled Cliff Pine & Crimson Plum Bough
  const pineTex = vault.createBotanicalSprig('pine');
  const plumTex = vault.createBotanicalSprig('plum');
  addBotanicalBoughCluster(root, tracker, pineTex, -3.5, 3.6, -6.5, 2.4, -0.15);
  addBotanicalBoughCluster(root, tracker, plumTex, 2.1, 2.25, -1.7, 1.7, 0.22);

  // Two-Tier Crimson Pagoda on the Right Ridge
  addTraditionalPavilion(root, tracker, vault, 3.6, 0.95, -7.8, 0x7a2320, 0xc23b2c, 0.85);

  // Mossy Sanctuary Stone Altar
  const altar = new THREE.Mesh(
    tracker.geo(new THREE.CylinderGeometry(1.9, 2.2, 0.34, 32)),
    tracker.mat(new THREE.MeshStandardMaterial({ map: vault.createStoneMoss(), roughness: 0.72 }))
  );
  altar.position.y = -0.14;
  root.add(altar);

  // Brass Armillary Astrolabe Rings
  const brassMat = tracker.mat(
    new THREE.MeshStandardMaterial({ color: 0xd9b86c, metalness: 0.88, roughness: 0.24 })
  );
  const ring1 = new THREE.Mesh(tracker.geo(new THREE.TorusGeometry(1.22, 0.025, 14, 56)), brassMat);
  const ring2 = new THREE.Mesh(tracker.geo(new THREE.TorusGeometry(1.04, 0.02, 14, 56)), brassMat);
  const ring3 = new THREE.Mesh(tracker.geo(new THREE.TorusGeometry(0.86, 0.016, 12, 48)), brassMat);
  ring1.position.y = 1.22;
  ring2.position.y = 1.22;
  ring3.position.y = 1.22;
  root.add(ring1, ring2, ring3);

  // Central Floating Tarot Monolith Card
  const runeTex = vault.createTarotRuneFace();
  const cardMat = tracker.mat(
    new THREE.MeshPhysicalMaterial({
      map: runeTex,
      roughness: 0.25,
      metalness: 0.15,
      clearcoat: isSoftwareGl ? 0 : 0.8,
    })
  );
  const edgeMat = tracker.mat(new THREE.MeshStandardMaterial({ color: 0xd8be82, metalness: 0.85, roughness: 0.28 }));
  const tarotSlab = new THREE.Mesh(
    tracker.geo(new THREE.BoxGeometry(0.68, 1.04, 0.035)),
    [edgeMat, edgeMat, edgeMat, edgeMat, cardMat, cardMat]
  );
  tarotSlab.position.y = 1.22;
  root.add(tarotSlab);

  const cranes = addSoaringCranes(root, tracker, isSoftwareGl ? 3 : 5, 0.2, -7.2, 3.5, 3.8);
  const stars = createParticles(
    tracker,
    isSoftwareGl ? 24 : 52,
    0xf5db98,
    { x: 4.0, y: 2.8, z: 3.0, yMin: 0.25 },
    0.045,
    glowTex
  );
  root.add(stars.mesh);

  return {
    root,
    cameraPosition,
    cameraTarget,
    fov,
    fogColor,
    fogDensity,
    backgroundHex,
    update: (dt, elapsed) => {
      waterNormal.offset.x += dt * 0.016;
      spiritFallTex.offset.y -= dt * 0.72;
      updateCranesAndKoi(cranes, [], elapsed);

      tarotSlab.position.y = 1.22 + Math.sin(elapsed * 1.15) * 0.06;
      tarotSlab.rotation.y = Math.sin(elapsed * 0.48) * 0.32;
      ring1.rotation.y = elapsed * 0.18;
      ring1.rotation.x = 0.45 + Math.sin(elapsed * 0.3) * 0.15;
      ring2.rotation.x = -elapsed * 0.22;
      ring2.rotation.z = 0.65;
      ring3.rotation.y = -elapsed * 0.3;
      ring3.rotation.z = Math.cos(elapsed * 0.4) * 0.35;

      for (let i = 0; i < stars.items.length; i++) {
        const p = stars.items[i];
        stars.dummy.position.set(
          p.baseX + Math.sin(elapsed * 0.5 + p.phase) * 0.15,
          p.baseY + Math.cos(elapsed * 0.6 + p.phase) * 0.15,
          p.baseZ
        );
        stars.dummy.scale.setScalar(p.scale * (0.7 + Math.sin(elapsed * 2.2 + p.phase) * 0.3));
        stars.dummy.lookAt(cameraPosition);
        stars.dummy.updateMatrix();
        stars.mesh.setMatrixAt(i, stars.dummy.matrix);
      }
      stars.mesh.instanceMatrix.needsUpdate = true;
    },
    dispose: () => tracker.disposeAll(),
  };
}
