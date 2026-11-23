import * as THREE from 'three';
import {
  getFlagstoneTexture,
  getWaterRippleTexture,
} from './ProceduralTextures';
import {
  createStorybookCottage,
  createVintageLampPost,
} from './StorybookCottage';
import {
  createArchedWoodenBridge,
  createBlossomTree,
  createWeepingWillow,
  createGreatWishTree,
  createWaterLilyGroup,
  createMushroomCluster,
  createMossyBoulder,
} from './StorybookNature';

export interface WorldZone {
  id: 'lake' | 'journal' | 'community' | 'letters' | 'wishes' | 'rain_room' | 'personal_garden' | 'listening_alcove' | 'stranger_chat' | 'spiritual_room';
  name: string;
  subtitle: string;
  position: THREE.Vector3;
  radius: number;
  promptText: string;
  iconName: string;
}

export class WorldEnvironment {
  public scene: THREE.Scene;
  public zones: WorldZone[] = [];
  public collisionObstacles: Array<{ x: number; z: number; radius: number }> = [];
  public lanterns: Array<{ group: THREE.Group; seedX: number; seedZ: number; speed: number; id: string }> = [];
  public waterLilies: THREE.Group[] = [];
  public fireflies: Array<{ mesh: THREE.Mesh; seedX: number; seedY: number; seedZ: number; speed: number }> = [];
  public waterMesh?: THREE.Mesh;
  public blossomPetals?: THREE.Points;

  constructor(scene: THREE.Scene, isSoftwareGl: boolean = false) {
    this.scene = scene;
    this.setupZones();
    this.buildAtmosphereAndSky();
    this.buildSculptedTerrain(isSoftwareGl);
    this.buildMoonlitLake(isSoftwareGl);
    this.buildCurvedPathways();
    this.buildArchedBridge();
    this.buildArchitecturalCottages(isSoftwareGl);
    this.buildLushLandscaping(isSoftwareGl);
    this.buildLakeDecorations(isSoftwareGl);
    this.buildFireflies();
  }

  private setupZones() {
    this.zones = [
      {
        id: 'lake',
        name: 'Hồ Hoa Đăng',
        subtitle: 'Thả trôi ưu phiền & Gửi gắm lời nguyện cầu',
        position: new THREE.Vector3(0, 0, -4.8),
        radius: 3.5,
        promptText: 'Nhấn [E] hoặc Chạm để Thả Hoa Đăng',
        iconName: 'Waves',
      },
      {
        id: 'journal',
        name: 'Ngôi Nhà Nhật Ký',
        subtitle: 'Gian phòng riêng tư & Đo lường tâm trạng',
        position: new THREE.Vector3(8.0, 0, -0.5),
        radius: 3.8,
        promptText: 'Nhấn [E] hoặc Chạm để Mở Nhật Ký',
        iconName: 'BookOpen',
      },
      {
        id: 'community',
        name: 'Khu Vườn Tâm Tình',
        subtitle: 'Không gian thổ lộ ẩn danh & Lắng nghe đồng cảm',
        position: new THREE.Vector3(-8.0, 0, -1.5),
        radius: 4.0,
        promptText: 'Nhấn [E] hoặc Chạm để Vào Khu Vườn',
        iconName: 'MessageSquareHeart',
      },
      {
        id: 'letters',
        name: 'Bưu Điện Ký Ức',
        subtitle: 'Hòm thư bí mật & Nghi thức buông bỏ',
        position: new THREE.Vector3(8.5, 0, 8.0),
        radius: 3.8,
        promptText: 'Nhấn [E] hoặc Chạm để Viết Thư',
        iconName: 'Mail',
      },
      {
        id: 'wishes',
        name: 'Cây Ước Nguyện',
        subtitle: 'Cội cây ý niệm & Cam kết lành mạnh',
        position: new THREE.Vector3(-9.0, 0, 7.5),
        radius: 4.2,
        promptText: 'Nhấn [E] hoặc Chạm để Treo Thẻ Ước',
        iconName: 'TreeDeciduous',
      },
      {
        id: 'rain_room',
        name: 'Căn Phòng Mưa',
        subtitle: 'Thanh âm mưa đêm, phím đàn piano & thư giãn',
        position: new THREE.Vector3(-1.5, 0, 10.0),
        radius: 3.8,
        promptText: 'Nhấn [E] hoặc Chạm để Nghe Thanh Âm',
        iconName: 'CloudRain',
      },
      {
        id: 'personal_garden',
        name: 'Khu Vườn Của Riêng Bạn',
        subtitle: 'Không gian tự chăm sóc & Mầm hoa nội tâm',
        position: new THREE.Vector3(4.8, 0, 10.5),
        radius: 3.4,
        promptText: 'Nhấn [E] hoặc Chạm để Chăm Sóc Vườn',
        iconName: 'Sparkles',
      },
      {
        id: 'listening_alcove',
        name: 'Góc Lắng Nghe',
        subtitle: 'Người bạn đồng hành & Trò chuyện 1:1 (Sắp ra mắt)',
        position: new THREE.Vector3(1.0, 0, 14.5),
        radius: 3.0,
        promptText: 'Nhấn [E] để Khám Phá (Sắp ra mắt)',
        iconName: 'Heart',
      },
    ];
  }

  // 1. Atmosphere, Celestial Moon, Distant Mountains & Stars
  private buildAtmosphereAndSky() {
    this.scene.background = new THREE.Color(0x11172f);
    this.scene.fog = new THREE.FogExp2(0x141838, 0.018);

    // Glowing Full Moon with Multi-Layer Halo
    const moonGroup = new THREE.Group();
    moonGroup.position.set(22, 28, -45);

    // Moon Core
    const moonGeo = new THREE.SphereGeometry(3.6, 24, 24);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xfffae6 });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moonGroup.add(moon);

    // Moon Outer Soft Halo Rings
    const halo1 = new THREE.Mesh(
      new THREE.CircleGeometry(6.5, 32),
      new THREE.MeshBasicMaterial({ color: 0xffedd5, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    halo1.position.z = -0.1;
    moonGroup.add(halo1);

    const halo2 = new THREE.Mesh(
      new THREE.CircleGeometry(11.0, 32),
      new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
    );
    halo2.position.z = -0.2;
    moonGroup.add(halo2);

    this.scene.add(moonGroup);

    // Distant Layered Mountain Silhouettes for Depth
    const mountainColors = [0x1a1d3b, 0x14162e, 0x0f1124];
    mountainColors.forEach((col, idx) => {
      const dist = 60 + idx * 18;
      const count = 10;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const mx = Math.cos(angle) * dist;
        const mz = Math.sin(angle) * dist;
        const mHeight = 14 + Math.sin(i * 1.8) * 6 - idx * 2;
        const mWidth = 24 + Math.cos(i * 1.4) * 8;

        const mGeo = new THREE.ConeGeometry(mWidth / 2, mHeight, 6);
        const mMat = new THREE.MeshBasicMaterial({ color: col });
        const mountain = new THREE.Mesh(mGeo, mMat);
        mountain.position.set(mx, mHeight / 2 - 4, mz);
        this.scene.add(mountain);
      }
    });

    // Scattered Non-uniform Celestial Stars
    const starCount = 380;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 85.0;

      // Keep stars mostly in upper hemisphere
      const y = Math.abs(r * Math.cos(phi)) + 12;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const z = r * Math.sin(phi) * Math.sin(theta);

      starPos[i * 3] = x;
      starPos[i * 3 + 1] = y;
      starPos[i * 3 + 2] = z;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.65,
      transparent: true,
      opacity: 0.85,
    });
    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);
  }

  // 2. Sculpted Organic Terrain with Shoreline and Slopes
  private buildSculptedTerrain(isSoftwareGl: boolean) {
    // High-resolution sculpted ground plane
    const segs = isSoftwareGl ? 48 : 72;
    const terrainGeo = new THREE.PlaneGeometry(54, 54, segs, segs);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const grassColor = new THREE.Color(0x191c3d);
    const mossColor = new THREE.Color(0x1e2742);
    const shoreColor = new THREE.Color(0x131428);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i); // rotated plane, Y holds Z coord

      const distFromCenter = Math.sqrt(x * x + (z - 2) * (z - 2));

      // Sculpt natural knolls and hollows
      let y = 0.35;

      // Gentle rolling hill in northwest and northeast
      if (z > 4) {
        y += Math.sin(x * 0.25) * 0.3 + Math.cos(z * 0.2) * 0.4;
      }

      // Shoreline slope down to water around Z = -2 to Z = -14
      if (z < 0) {
        const lakeDist = Math.sqrt(x * x + (z + 6) * (z + 6));
        if (lakeDist < 7.5) {
          // Hollow basin for the lake
          const t = Math.max(0, (7.5 - lakeDist) / 7.5);
          y -= t * 1.6;
        }
      }

      // Outer island boundary tapering
      if (distFromCenter > 20) {
        const edgeDrop = Math.min(3.0, (distFromCenter - 20) * 0.6);
        y -= edgeDrop;
      }

      pos.setY(i, y);

      // Color blending
      if (y < -0.1) {
        shoreColor.toArray(colors, i * 3);
      } else if ((x + z) % 3 === 0) {
        mossColor.toArray(colors, i * 3);
      } else {
        grassColor.toArray(colors, i * 3);
      }
    }

    terrainGeo.computeVertexNormals();
    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.05,
    });

    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.position.set(0, 0, 0);
    terrain.receiveShadow = !isSoftwareGl;
    this.scene.add(terrain);

    // Natural Riverbank Stones along the water edge
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const rx = Math.cos(angle) * (6.8 + Math.sin(i * 2) * 0.6);
      const rz = -6.0 + Math.sin(angle) * (5.4 + Math.cos(i * 1.5) * 0.5);

      const boulder = createMossyBoulder(0.8 + Math.random() * 0.7);
      boulder.position.set(rx, 0.05, rz);
      boulder.rotation.y = Math.random() * Math.PI;
      this.scene.add(boulder);

      this.collisionObstacles.push({ x: rx, z: rz, radius: 0.6 });
    }
  }

  // 3. Moonlit Lake with Water Ripple Shader and Reflection
  private buildMoonlitLake(isSoftwareGl: boolean) {
    // Water Surface
    const lakeGeo = new THREE.CircleGeometry(7.8, 32);
    const rippleTex = getWaterRippleTexture();
    rippleTex.repeat.set(3, 3);

    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x0f223f, // deep moonlit sapphire blue
      roughness: 0.12,
      metalness: 0.35,
      bumpMap: rippleTex,
      bumpScale: 0.05,
    });

    const lake = new THREE.Mesh(lakeGeo, lakeMat);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(0, 0.04, -6.0);
    this.scene.add(lake);
    this.waterMesh = lake;

    // Curved Wooden Pier extending into the lake
    const pierGroup = new THREE.Group();
    pierGroup.position.set(0, 0.08, -3.2);

    // Pier Planks
    const pierDeckGeo = new THREE.BoxGeometry(2.4, 0.14, 4.0);
    const pierDeck = new THREE.Mesh(
      pierDeckGeo,
      new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.8 })
    );
    pierDeck.position.set(0, 0.07, -1.8);
    pierDeck.castShadow = true;
    pierDeck.receiveShadow = true;
    pierGroup.add(pierDeck);

    // Pier Timber Posts
    [
      [-1.1, -0.4],
      [1.1, -0.4],
      [-1.1, -3.4],
      [1.1, -3.4],
    ].forEach(([px, pz]) => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x271913, roughness: 0.9 })
      );
      post.position.set(px, 0.2, pz);
      pierGroup.add(post);
    });

    // Warm Lanterns at pier corners
    const pierLanternL = createVintageLampPost(1.6);
    pierLanternL.position.set(-1.1, 0.14, -3.4);
    pierGroup.add(pierLanternL);

    const pierLanternR = createVintageLampPost(1.6);
    pierLanternR.position.set(1.1, 0.14, -3.4);
    pierLanternR.rotation.y = Math.PI;
    pierGroup.add(pierLanternR);

    // Lake edge bench for contemplation
    const benchGroup = new THREE.Group();
    benchGroup.position.set(0, 0.14, -3.6);
    const benchSeat = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.08, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x4a3227, roughness: 0.8 })
    );
    benchSeat.position.y = 0.35;
    benchGroup.add(benchSeat);
    pierGroup.add(benchGroup);

    this.scene.add(pierGroup);
  }

  // 4. Beautiful Curving Stone Flagstone Pathways Connecting Everything
  private buildCurvedPathways() {
    const pathTex = getFlagstoneTexture();
    pathTex.repeat.set(1.2, 8);

    const pathMat = new THREE.MeshStandardMaterial({
      map: pathTex,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });

    const createPathSegment = (points: THREE.Vector3[], width: number = 1.8) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const segCount = 28;
      const pathGeo = new THREE.PlaneGeometry(width, curve.getLength(), 2, segCount);
      pathGeo.rotateX(-Math.PI / 2);

      // Align plane vertices along curve
      const pos = pathGeo.attributes.position;
      const sampledPoints = curve.getSpacedPoints(segCount);
      const halfW = width / 2;

      for (let i = 0; i <= segCount; i++) {
        const pt = sampledPoints[i];
        const nextPt = sampledPoints[Math.min(segCount, i + 1)];
        const dir = new THREE.Vector3().subVectors(nextPt, pt).normalize();
        const normal = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

        const idxL = i * 2;
        const idxR = i * 2 + 1;

        pos.setXYZ(idxL, pt.x - normal.x * halfW, 0.06, pt.z - normal.z * halfW);
        pos.setXYZ(idxR, pt.x + normal.x * halfW, 0.06, pt.z + normal.z * halfW);
      }

      pathGeo.computeVertexNormals();
      const pathMesh = new THREE.Mesh(pathGeo, pathMat);
      pathMesh.receiveShadow = true;
      this.scene.add(pathMesh);
    };

    // Central path branching from Pier to Central Crossroads
    createPathSegment([
      new THREE.Vector3(0, 0, -2.2),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 2.5),
    ]);

    // Path leading to Journal Cottage (East)
    createPathSegment([
      new THREE.Vector3(0, 0, 1.5),
      new THREE.Vector3(3.5, 0, 1.2),
      new THREE.Vector3(6.5, 0, 0.2),
      new THREE.Vector3(8.0, 0, 0.5),
    ]);

    // Path leading to Letter House (South-East)
    createPathSegment([
      new THREE.Vector3(0, 0, 2.5),
      new THREE.Vector3(3.8, 0, 4.8),
      new THREE.Vector3(6.8, 0, 6.8),
      new THREE.Vector3(8.2, 0, 7.8),
    ]);

    // Path leading to Confession Garden (West)
    createPathSegment([
      new THREE.Vector3(0, 0, 1.5),
      new THREE.Vector3(-3.5, 0, 1.0),
      new THREE.Vector3(-6.2, 0, -0.4),
      new THREE.Vector3(-7.8, 0, -1.2),
    ]);

    // Path leading to Wish Tree (South-West)
    createPathSegment([
      new THREE.Vector3(0, 0, 2.5),
      new THREE.Vector3(-3.8, 0, 4.6),
      new THREE.Vector3(-6.8, 0, 6.4),
      new THREE.Vector3(-8.6, 0, 7.4),
    ]);

    // Path leading to Rain Room & Personal Garden (South)
    createPathSegment([
      new THREE.Vector3(0, 0, 2.5),
      new THREE.Vector3(0, 0, 6.0),
      new THREE.Vector3(-1.2, 0, 8.8),
      new THREE.Vector3(-1.5, 0, 10.2),
    ]);

    createPathSegment([
      new THREE.Vector3(0, 0, 6.0),
      new THREE.Vector3(2.6, 0, 8.2),
      new THREE.Vector3(4.6, 0, 10.2),
    ]);
  }

  // 5. Arched Wooden Bridge Across Inlet (Panel 1 of Reference Image)
  private buildArchedBridge() {
    // Beautiful arched bridge placed over western inlet of the lake
    const bridge = createArchedWoodenBridge(6.8, 1.8, 0.95);
    bridge.position.set(-5.6, 0.05, -5.2);
    bridge.rotation.y = 0.45;
    this.scene.add(bridge);

    // Collisions for bridge rails
    this.collisionObstacles.push({ x: -5.6, z: -5.2, radius: 0.8 });
  }

  // 6. Architecturally Detailed Storybook Cottages
  private buildArchitecturalCottages(isSoftwareGl: boolean) {
    // A. Ngôi Nhà Nhật Ký (Journal Cottage - East)
    const journalCottage = createStorybookCottage({
      width: 4.6,
      depth: 3.8,
      height: 2.9,
      hasChimney: true,
      hasDormer: true,
      hasPorch: true,
      cottageType: 'journal',
    });
    journalCottage.position.set(8.2, 0, -0.2);
    journalCottage.rotation.y = -Math.PI / 6;
    this.scene.add(journalCottage);

    // Lamp post next to cottage path
    const journalLamp = createVintageLampPost(2.3);
    journalLamp.position.set(6.4, 0, 1.4);
    this.scene.add(journalLamp);

    this.collisionObstacles.push({ x: 8.2, z: -0.2, radius: 2.8 });

    // B. Bưu Điện Ký Ức (Letter House - South East)
    const letterHouse = createStorybookCottage({
      width: 4.4,
      depth: 3.6,
      height: 2.8,
      hasChimney: true,
      hasDormer: false,
      hasPorch: true,
      cottageType: 'letters',
    });
    letterHouse.position.set(8.5, 0, 8.0);
    letterHouse.rotation.y = -Math.PI / 4;
    this.scene.add(letterHouse);

    const letterLamp = createVintageLampPost(2.3);
    letterLamp.position.set(6.8, 0, 7.2);
    this.scene.add(letterLamp);

    this.collisionObstacles.push({ x: 8.5, z: 8.0, radius: 2.7 });

    // C. Căn Phòng Mưa (Rain Room - South Lakehouse)
    const rainHouse = createStorybookCottage({
      width: 4.8,
      depth: 3.8,
      height: 2.8,
      hasChimney: true,
      hasDormer: true,
      hasPorch: true,
      cottageType: 'rain_cabin',
    });
    rainHouse.position.set(-1.5, 0, 10.2);
    rainHouse.rotation.y = Math.PI;
    this.scene.add(rainHouse);

    const rainLamp = createVintageLampPost(2.3);
    rainLamp.position.set(-0.2, 0, 8.8);
    this.scene.add(rainLamp);

    this.collisionObstacles.push({ x: -1.5, z: 10.2, radius: 2.9 });

    // D. Khu Vườn Tâm Tình (Confession Garden Pavilion - West)
    const gardenPavilion = new THREE.Group();
    gardenPavilion.position.set(-8.0, 0, -1.5);

    // Stone Plinth
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.4, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x24263f, roughness: 0.9 })
    );
    plinth.position.y = 0.2;
    gardenPavilion.add(plinth);

    // Timber Pillars (6 pillars in circle)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 2.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.8 })
      );
      pillar.position.set(Math.cos(angle) * 2.6, 1.5, Math.sin(angle) * 2.6);
      gardenPavilion.add(pillar);
    }

    // Hexagonal Open Timber Canopy
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(3.4, 1.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x312e52, roughness: 0.85 })
    );
    canopy.position.y = 3.4;
    canopy.castShadow = true;
    gardenPavilion.add(canopy);

    // Central Hanging Warm Lantern
    const centerLantern = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 1.5 })
    );
    centerLantern.position.y = 2.4;
    gardenPavilion.add(centerLantern);

    const gardenLight = new THREE.PointLight(0xfef08a, 2.0, 9);
    gardenLight.position.y = 2.4;
    gardenPavilion.add(gardenLight);

    // Circular Stone Benches inside
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x3a3c63, roughness: 0.8 });
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + 0.3;
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.4), benchMat);
      b.position.set(Math.cos(angle) * 1.8, 0.45, Math.sin(angle) * 1.8);
      b.rotation.y = -angle + Math.PI / 2;
      gardenPavilion.add(b);
    }

    this.scene.add(gardenPavilion);
    this.collisionObstacles.push({ x: -8.0, z: -1.5, radius: 2.8 });
  }

  // 7. Lush Landscaping: Blossom Trees, Willows, Ancient Wish Tree, Mushrooms, Flowers
  private buildLushLandscaping(isSoftwareGl: boolean) {
    // A. Blossoming Pink Sakura/Peach Trees (Panel 1 of Reference Image)
    const blossomPositions = [
      [-3.8, -4.5, 1.1],
      [-2.4, -6.8, 1.0],
      [4.2, -4.8, 1.2],
      [5.5, -7.2, 1.1],
      [3.2, 3.5, 0.9],
      [-4.5, 3.2, 0.95],
    ];

    blossomPositions.forEach(([bx, bz, s]) => {
      const blossomTree = createBlossomTree(s);
      blossomTree.position.set(bx, 0, bz);
      blossomTree.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(blossomTree);
      this.collisionObstacles.push({ x: bx, z: bz, radius: 0.6 });
    });

    // B. Weeping Willows Near Water Shore
    const willowPositions = [
      [2.2, -5.8, 1.15],
      [-5.2, -2.8, 1.1],
    ];

    willowPositions.forEach(([wx, wz, s]) => {
      const willow = createWeepingWillow(s);
      willow.position.set(wx, 0, wz);
      willow.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(willow);
      this.collisionObstacles.push({ x: wx, z: wz, radius: 0.7 });
    });

    // C. The Great Ancient Wish Tree (Panel 4 of Reference Image)
    const wishTree = createGreatWishTree();
    wishTree.position.set(-9.0, 0, 7.5);
    this.scene.add(wishTree);
    this.collisionObstacles.push({ x: -9.0, z: 7.5, radius: 2.4 });

    // D. Bioluminescent Fairy Mushrooms along rocky bank (Panel 1 of Reference Image)
    const mushroomLocs = [
      [-1.8, -3.2],
      [1.6, -3.4],
      [-4.2, -4.8],
      [3.8, -4.2],
      [-7.2, 5.8],
    ];

    mushroomLocs.forEach(([mx, mz]) => {
      const shrooms = createMushroomCluster(mx, mz);
      this.scene.add(shrooms);
    });

    // E. Drifting Blossom Petals in Air
    const petalCount = 70;
    const petalGeo = new THREE.BufferGeometry();
    const petalPos = new Float32Array(petalCount * 3);

    for (let i = 0; i < petalCount; i++) {
      petalPos[i * 3] = (Math.random() - 0.5) * 28;
      petalPos[i * 3 + 1] = Math.random() * 4 + 0.2;
      petalPos[i * 3 + 2] = (Math.random() - 0.5) * 28;
    }

    petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPos, 3));
    const petalMat = new THREE.PointsMaterial({
      color: 0xfda4af,
      size: 0.22,
      transparent: true,
      opacity: 0.75,
    });
    this.blossomPetals = new THREE.Points(petalGeo, petalMat);
    this.scene.add(this.blossomPetals);
  }

  // 8. Lake Water Lilies with Glowing Lotus Blossoms & Candlelight Lanterns
  private buildLakeDecorations(isSoftwareGl: boolean) {
    // Water Lily Groups scattered in serene coves
    const lilyLocs = [
      [-2.4, -6.5],
      [2.8, -6.8],
      [-4.2, -5.8],
      [1.8, -8.2],
      [-1.5, -8.5],
    ];

    lilyLocs.forEach(([lx, lz]) => {
      const lilies = createWaterLilyGroup(lx, lz);
      this.scene.add(lilies);
      this.waterLilies.push(lilies);
    });

    // 14 Floating Lanterns on Lake
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.4,
      roughness: 0.3,
    });

    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const rad = 2.4 + (i % 3) * 1.5;
      const seedX = Math.cos(angle) * rad;
      const seedZ = -6.0 + Math.sin(angle) * (rad * 0.8);

      const lanGroup = new THREE.Group();
      lanGroup.position.set(seedX, 0.06, seedZ);

      // Wooden Floating Base
      const lanBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.04, 0.32),
        new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.8 })
      );
      lanGroup.add(lanBase);

      // Glowing Paper Octahedron
      const lanPaper = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), lanternMat);
      lanPaper.position.y = 0.16;
      lanGroup.add(lanPaper);

      // Soft Candle PointLight
      const lanLight = new THREE.PointLight(0xfef08a, 0.8, 3.2);
      lanLight.position.y = 0.18;
      lanGroup.add(lanLight);

      this.scene.add(lanGroup);
      this.lanterns.push({
        group: lanGroup,
        seedX,
        seedZ,
        speed: 0.4 + (i % 5) * 0.1,
        id: `lan_${i}`,
      });
    }
  }

  // 9. Ambient Fireflies
  private buildFireflies() {
    const fireflyMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    const fireflyGeo = new THREE.SphereGeometry(0.04, 6, 6);

    for (let i = 0; i < 35; i++) {
      const mesh = new THREE.Mesh(fireflyGeo, fireflyMat);
      const seedX = (Math.random() - 0.5) * 26;
      const seedY = 0.4 + Math.random() * 2.2;
      const seedZ = (Math.random() - 0.5) * 26;
      mesh.position.set(seedX, seedY, seedZ);
      this.scene.add(mesh);

      this.fireflies.push({
        mesh,
        seedX,
        seedY,
        seedZ,
        speed: 0.8 + Math.random() * 0.6,
      });
    }
  }

  // Smooth Collision Resolution
  public resolveCollision(x: number, z: number, currentPos?: { x: number; z: number }): { x: number; z: number } {
    let newX = x;
    let newZ = z;

    // Island boundary radius (~22m from center)
    const distFromOrigin = Math.sqrt(newX * newX + (newZ - 2) * (newZ - 2));
    if (distFromOrigin > 21) {
      if (currentPos) {
        newX = currentPos.x;
        newZ = currentPos.z;
      } else {
        const angle = Math.atan2(newZ - 2, newX);
        newX = Math.cos(angle) * 20.5;
        newZ = 2 + Math.sin(angle) * 20.5;
      }
    }

    // Lake water edge collision (Unless on Pier or Arched Bridge)
    const distFromLakeCenter = Math.sqrt(newX * newX + (newZ + 6.0) * (newZ + 6.0));
    const isOnPier = Math.abs(newX) < 1.3 && newZ <= -2.0 && newZ >= -5.6;
    const isOnBridge = Math.sqrt((newX + 5.6) ** 2 + (newZ + 5.2) ** 2) < 3.2;

    if (distFromLakeCenter < 6.8 && !isOnPier && !isOnBridge) {
      // Push back to lakeshore
      const angle = Math.atan2(newZ + 6.0, newX);
      newX = Math.cos(angle) * 6.85;
      newZ = -6.0 + Math.sin(angle) * 6.85;
    }

    // Obstacle collisions (Cottages, boulders, tree trunks)
    for (const obs of this.collisionObstacles) {
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

  // Animation Update Tick
  public update(time: number) {
    // Water lanterns bobbing
    this.lanterns.forEach((lan, idx) => {
      lan.group.position.x = lan.seedX + Math.sin(time * 0.6 + idx) * 0.3;
      lan.group.position.y = 0.06 + Math.sin(time * 1.5 + idx * 0.8) * 0.035;
      lan.group.position.z = lan.seedZ + Math.cos(time * 0.5 + idx) * 0.22;
    });

    // Fireflies floating
    this.fireflies.forEach((f, idx) => {
      f.mesh.position.x = f.seedX + Math.sin(time * f.speed + idx) * 0.8;
      f.mesh.position.y = f.seedY + Math.cos(time * f.speed * 1.2 + idx) * 0.35;
      f.mesh.position.z = f.seedZ + Math.sin(time * f.speed * 0.7 + idx) * 0.6;
    });

    // Drifting blossom petals
    if (this.blossomPetals) {
      const pos = this.blossomPetals.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let py = pos.getY(i) - 0.008;
        if (py < 0.1) py = 3.8;
        pos.setY(i, py);
        pos.setX(i, pos.getX(i) + Math.sin(time * 0.8 + i) * 0.004);
      }
      pos.needsUpdate = true;
    }

    // Subtle water ripples bump texture offset
    if (this.waterMesh && (this.waterMesh.material as THREE.MeshStandardMaterial).bumpMap) {
      const map = (this.waterMesh.material as THREE.MeshStandardMaterial).bumpMap!;
      map.offset.x = (time * 0.015) % 1;
      map.offset.y = (time * 0.02) % 1;
    }
  }
}
