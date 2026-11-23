import * as THREE from 'three';
import {
  getStoneFoundationTexture,
  getWoodPlankTexture,
  getMossyRoofTexture,
  getGlowingWindowTexture,
} from './ProceduralTextures';

export interface CottageOptions {
  width?: number;
  depth?: number;
  height?: number;
  hasChimney?: boolean;
  hasDormer?: boolean;
  hasPorch?: boolean;
  cottageType?: 'journal' | 'letters' | 'rain_cabin';
  accentColor?: number;
}

/**
 * Creates a richly detailed Storybook / Fairytale Cottage
 * Inspired by Panel 2 of the Heali Art Direction:
 * Stone foundation, timber-framed stucco walls, steep mossy roof with curved eaves,
 * stone chimney with warm glow, dormer windows, flower boxes, and a rustic wooden porch.
 */
export function createStorybookCottage(options: CottageOptions = {}): THREE.Group {
  const {
    width = 4.4,
    depth = 3.6,
    height = 2.8,
    hasChimney = true,
    hasDormer = true,
    hasPorch = true,
    cottageType = 'journal',
    accentColor = 0xf59e0b,
  } = options;

  const cottage = new THREE.Group();

  // Shared textures & materials
  const stoneTex = getStoneFoundationTexture();
  const woodTex = getWoodPlankTexture();
  const roofTex = getMossyRoofTexture();
  const windowTex = getGlowingWindowTexture();

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    roughness: 0.9,
    metalness: 0.05,
  });

  const timberMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.8,
    metalness: 0.1,
  });

  const wallStuccoMat = new THREE.MeshStandardMaterial({
    color: 0xeddcc8, // soft warm cream plaster
    roughness: 0.95,
    metalness: 0.02,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    map: roofTex,
    roughness: 0.85,
    metalness: 0.05,
  });

  const windowGlowMat = new THREE.MeshStandardMaterial({
    map: windowTex,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.85,
    roughness: 0.3,
  });

  // 1. Elevated Stone Foundation Plinth (0.4m high)
  const foundationGeo = new THREE.BoxGeometry(width + 0.3, 0.45, depth + 0.3);
  const foundation = new THREE.Mesh(foundationGeo, stoneMat);
  foundation.position.y = 0.225;
  foundation.castShadow = true;
  foundation.receiveShadow = true;
  cottage.add(foundation);

  // 2. Main Stucco Walls Body
  const wallGeo = new THREE.BoxGeometry(width, height, depth);
  const walls = new THREE.Mesh(wallGeo, wallStuccoMat);
  walls.position.y = 0.45 + height / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  cottage.add(walls);

  // 3. Exposed Timber Framing (Corner Posts, Horizontal Beams, Diagonal Braces)
  const beamThickness = 0.16;
  const beamDepth = 0.08;

  // Corner timber pillars
  const cornerPositions = [
    [-width / 2, -depth / 2],
    [width / 2, -depth / 2],
    [-width / 2, depth / 2],
    [width / 2, depth / 2],
  ];

  cornerPositions.forEach(([cx, cz]) => {
    const postGeo = new THREE.BoxGeometry(beamThickness, height, beamThickness);
    const post = new THREE.Mesh(postGeo, timberMat);
    post.position.set(cx, 0.45 + height / 2, cz);
    post.castShadow = true;
    cottage.add(post);
  });

  // Horizontal timber belt & eave beam
  const eaveBeamX = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, beamThickness, beamThickness), timberMat);
  eaveBeamX.position.set(0, 0.45 + height, depth / 2);
  cottage.add(eaveBeamX);

  const eaveBeamXBack = eaveBeamX.clone();
  eaveBeamXBack.position.z = -depth / 2;
  cottage.add(eaveBeamXBack);

  // Diagonal cross-timber braces on side walls
  const braceLen = Math.sqrt((width * 0.4) ** 2 + height ** 2);
  const braceGeo = new THREE.BoxGeometry(beamThickness * 0.8, braceLen, beamDepth);

  const braceL = new THREE.Mesh(braceGeo, timberMat);
  braceL.position.set(-width / 2 - 0.02, 0.45 + height / 2, 0);
  braceL.rotation.y = Math.PI / 2;
  braceL.rotation.z = 0.35;
  cottage.add(braceL);

  const braceR = new THREE.Mesh(braceGeo, timberMat);
  braceR.position.set(width / 2 + 0.02, 0.45 + height / 2, 0);
  braceR.rotation.y = Math.PI / 2;
  braceR.rotation.z = -0.35;
  cottage.add(braceR);

  // 4. Steep Curved Fairytale Roof with Overhangs
  const roofPeakHeight = 1.9;
  const roofOverhang = 0.45;
  const roofSlopeLen = Math.sqrt((depth / 2 + roofOverhang) ** 2 + roofPeakHeight ** 2);

  // Front slope
  const roofFrontGeo = new THREE.BoxGeometry(width + roofOverhang * 2, 0.18, roofSlopeLen + 0.2);
  const roofFront = new THREE.Mesh(roofFrontGeo, roofMat);
  const slopeAngle = Math.atan2(roofPeakHeight, depth / 2 + roofOverhang);

  roofFront.position.set(
    0,
    0.45 + height + roofPeakHeight / 2 - 0.05,
    (depth / 2 + roofOverhang) / 2
  );
  roofFront.rotation.x = -slopeAngle;
  roofFront.castShadow = true;
  cottage.add(roofFront);

  // Back slope
  const roofBack = new THREE.Mesh(roofFrontGeo, roofMat);
  roofBack.position.set(
    0,
    0.45 + height + roofPeakHeight / 2 - 0.05,
    -(depth / 2 + roofOverhang) / 2
  );
  roofBack.rotation.x = slopeAngle;
  roofBack.castShadow = true;
  cottage.add(roofBack);

  // Roof Ridge Beam
  const ridgeGeo = new THREE.BoxGeometry(width + roofOverhang * 2 + 0.15, 0.22, 0.25);
  const ridge = new THREE.Mesh(ridgeGeo, timberMat);
  ridge.position.set(0, 0.45 + height + roofPeakHeight, 0);
  cottage.add(ridge);

  // Triangular Gable Walls (Filling sides between walls and roof)
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-depth / 2, 0);
  gableShape.lineTo(depth / 2, 0);
  gableShape.lineTo(0, roofPeakHeight);
  gableShape.closePath();

  const gableGeo = new THREE.ShapeGeometry(gableShape);

  const gableLeft = new THREE.Mesh(gableGeo, wallStuccoMat);
  gableLeft.position.set(-width / 2 + 0.01, 0.45 + height, 0);
  gableLeft.rotation.y = -Math.PI / 2;
  cottage.add(gableLeft);

  const gableRight = new THREE.Mesh(gableGeo, wallStuccoMat);
  gableRight.position.set(width / 2 - 0.01, 0.45 + height, 0);
  gableRight.rotation.y = Math.PI / 2;
  cottage.add(gableRight);

  // 5. Stone Chimney with Warm Smoke Hint
  if (hasChimney) {
    const chimneyGroup = new THREE.Group();
    chimneyGroup.position.set(width / 2 - 0.5, 0, -depth / 4);

    // Chimney base
    const chimBaseGeo = new THREE.BoxGeometry(0.7, height + roofPeakHeight + 0.6, 0.7);
    const chimBase = new THREE.Mesh(chimBaseGeo, stoneMat);
    chimBase.position.y = (height + roofPeakHeight + 0.6) / 2;
    chimBase.castShadow = true;
    chimneyGroup.add(chimBase);

    // Chimney top crown
    const chimCrownGeo = new THREE.BoxGeometry(0.85, 0.18, 0.85);
    const chimCrown = new THREE.Mesh(chimCrownGeo, stoneMat);
    chimCrown.position.y = height + roofPeakHeight + 0.6;
    chimneyGroup.add(chimCrown);

    // Terracotta pot
    const chimPotGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.35, 12);
    const chimPotMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.8 });
    const chimPot = new THREE.Mesh(chimPotGeo, chimPotMat);
    chimPot.position.y = height + roofPeakHeight + 0.8;
    chimneyGroup.add(chimPot);

    cottage.add(chimneyGroup);
  }

  // 6. Dormer Window on Roof (If enabled)
  if (hasDormer) {
    const dormerGroup = new THREE.Group();
    dormerGroup.position.set(-width * 0.22, 0.45 + height + roofPeakHeight * 0.35, depth / 2 + 0.05);

    // Dormer body
    const dormerBodyGeo = new THREE.BoxGeometry(0.9, 0.8, 0.8);
    const dormerBody = new THREE.Mesh(dormerBodyGeo, wallStuccoMat);
    dormerBody.position.z = 0.2;
    dormerGroup.add(dormerBody);

    // Dormer roof
    const dormerRoofGeo = new THREE.ConeGeometry(0.75, 0.6, 4);
    const dormerRoof = new THREE.Mesh(dormerRoofGeo, roofMat);
    dormerRoof.position.set(0, 0.6, 0.2);
    dormerRoof.rotation.y = Math.PI / 4;
    dormerGroup.add(dormerRoof);

    // Dormer glowing window
    const dormerWin = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), windowGlowMat);
    dormerWin.position.set(0, 0.15, 0.61);
    dormerGroup.add(dormerWin);

    cottage.add(dormerGroup);
  }

  // 7. Ground Floor Glowing Windows with Window Flower Boxes
  const winW = 0.85;
  const winH = 0.95;

  // Front right bay window
  const frontWin = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), windowGlowMat);
  frontWin.position.set(width * 0.24, 0.45 + height * 0.48, depth / 2 + 0.02);
  cottage.add(frontWin);

  // Front window timber frame surround
  const frameGeo = new THREE.BoxGeometry(winW + 0.12, winH + 0.12, 0.06);
  const winFrame = new THREE.Mesh(frameGeo, timberMat);
  winFrame.position.set(width * 0.24, 0.45 + height * 0.48, depth / 2 + 0.01);
  cottage.add(winFrame);

  // Flower Box under window
  const flowerBoxGeo = new THREE.BoxGeometry(winW + 0.2, 0.22, 0.25);
  const flowerBox = new THREE.Mesh(flowerBoxGeo, timberMat);
  flowerBox.position.set(width * 0.24, 0.45 + height * 0.48 - winH / 2 - 0.1, depth / 2 + 0.12);
  flowerBox.castShadow = true;
  cottage.add(flowerBox);

  // Colorful Flowers inside box
  const flowerColors = [0xf43f5e, 0xec4899, 0xfb7185, 0xffffff];
  for (let i = 0; i < 7; i++) {
    const col = flowerColors[i % flowerColors.length];
    const flower = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.08, 0),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, emissive: col, emissiveIntensity: 0.3 })
    );
    flower.position.set(
      width * 0.24 + (i - 3) * 0.12,
      0.45 + height * 0.48 - winH / 2 + 0.06,
      depth / 2 + 0.14
    );
    cottage.add(flower);
  }

  // Side Window
  const sideWin = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), windowGlowMat);
  sideWin.position.set(-width / 2 - 0.02, 0.45 + height * 0.48, 0);
  sideWin.rotation.y = -Math.PI / 2;
  cottage.add(sideWin);

  // Warm Interior Light spilling outside
  const interiorLight = new THREE.PointLight(0xf8d6a2, 2.2, 7.5);
  interiorLight.position.set(width * 0.24, 0.45 + height * 0.5, depth / 2 + 0.6);
  cottage.add(interiorLight);

  // 8. Front Entrance Porch & Door
  if (hasPorch) {
    const porchGroup = new THREE.Group();
    const porchX = -width * 0.25;
    porchGroup.position.set(porchX, 0, depth / 2);

    // Stone Steps
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.55), stoneMat);
    step1.position.set(0, 0.09, 0.3);
    porchGroup.add(step1);

    const step2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 0.45), stoneMat);
    step2.position.set(0, 0.27, 0.15);
    porchGroup.add(step2);

    // Rustic Wood Front Door
    const doorGeo = new THREE.BoxGeometry(0.85, 1.65, 0.08);
    const door = new THREE.Mesh(doorGeo, timberMat);
    door.position.set(0, 0.45 + 0.82, 0.02);
    porchGroup.add(door);

    // Door Handle & Strap Hinges
    const handleGeo = new THREE.TorusGeometry(0.04, 0.012, 8, 12);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.3 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0.3, 0.45 + 0.82, 0.08);
    porchGroup.add(handle);

    // Porch Canopy Posts
    const porchPostGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8);
    const postL = new THREE.Mesh(porchPostGeo, timberMat);
    postL.position.set(-0.55, 0.9, 0.6);
    postL.castShadow = true;
    porchGroup.add(postL);

    const postR = new THREE.Mesh(porchPostGeo, timberMat);
    postR.position.set(0.55, 0.9, 0.6);
    postR.castShadow = true;
    porchGroup.add(postR);

    // Porch Gable Canopy Roof
    const canopyShape = new THREE.Shape();
    canopyShape.moveTo(-0.7, 0);
    canopyShape.lineTo(0.7, 0);
    canopyShape.lineTo(0, 0.5);
    canopyShape.closePath();

    const canopyGeo = new THREE.ExtrudeGeometry(canopyShape, { depth: 0.75, bevelEnabled: false });
    const canopy = new THREE.Mesh(canopyGeo, roofMat);
    canopy.position.set(0, 1.8, 0.65);
    canopy.rotation.y = Math.PI;
    canopy.castShadow = true;
    porchGroup.add(canopy);

    // Hanging Vintage Iron Lantern on Porch
    const porchLantern = createVintageLantern();
    porchLantern.position.set(0.4, 1.75, 0.55);
    porchGroup.add(porchLantern);

    cottage.add(porchGroup);
  }

  // 9. Destination Specific Prop Details
  if (cottageType === 'letters') {
    // Hanging Carved Signboard "BƯU ĐIỆN KÝ ỨC"
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.32, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x2e1065, roughness: 0.7 })
    );
    signBoard.position.set(-width * 0.25, 0.45 + height * 0.9, depth / 2 + 0.25);
    cottage.add(signBoard);

    // Wooden Mailbox Post outside
    const mailbox = new THREE.Group();
    mailbox.position.set(-width * 0.48, 0, depth / 2 + 0.9);

    const mbPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8), timberMat);
    mbPost.position.y = 0.55;
    mailbox.add(mbPost);

    const mbBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.25, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.6, emissive: 0x6366f1, emissiveIntensity: 0.3 })
    );
    mbBox.position.set(0, 1.15, 0);
    mailbox.add(mbBox);

    cottage.add(mailbox);
  } else if (cottageType === 'rain_cabin') {
    // Large Panoramic Floor-to-Ceiling Glass Window for the Rain Room
    const glassFrame = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.55, height * 0.7, 0.1),
      timberMat
    );
    glassFrame.position.set(0, 0.45 + height * 0.5, depth / 2 + 0.03);
    cottage.add(glassFrame);

    const rainGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.5, height * 0.65),
      new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.75,
        roughness: 0.1,
        metalness: 0.2,
        clearcoat: 1.0,
      })
    );
    rainGlass.position.set(0, 0.45 + height * 0.5, depth / 2 + 0.09);
    cottage.add(rainGlass);
  }

  return cottage;
}

/**
 * Creates a Vintage Fairy-tale Lamp Post with hanging warm lantern
 * As shown in Panel 2 of the reference image
 */
export function createVintageLampPost(height: number = 2.4): THREE.Group {
  const lampPost = new THREE.Group();

  const timberMat = new THREE.MeshStandardMaterial({
    map: getWoodPlankTexture(),
    roughness: 0.8,
  });

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.85,
    roughness: 0.3,
  });

  // Base stone mount
  const baseStone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.3, 8),
    new THREE.MeshStandardMaterial({ map: getStoneFoundationTexture(), roughness: 0.9 })
  );
  baseStone.position.y = 0.15;
  lampPost.add(baseStone);

  // Main vertical timber post
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, height, 8), timberMat);
  post.position.y = height / 2 + 0.15;
  post.castShadow = true;
  lampPost.add(post);

  // Curved iron arm extending to the side
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 8), ironMat);
  arm.position.set(0.3, height + 0.1, 0);
  arm.rotation.z = -Math.PI / 3;
  lampPost.add(arm);

  // Hanging chain & lantern
  const lantern = createVintageLantern();
  lantern.position.set(0.55, height - 0.1, 0);
  lampPost.add(lantern);

  // Warm Point Light casting ambient radiance
  const light = new THREE.PointLight(0xf8d6a2, 1.8, 8.5);
  light.position.set(0.55, height - 0.2, 0);
  lampPost.add(light);

  return lampPost;
}

/**
 * Creates a Vintage Glass Lantern
 */
export function createVintageLantern(): THREE.Group {
  const lanternGroup = new THREE.Group();

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.8,
    roughness: 0.3,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });

  // Lantern Cap
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.15, 6), ironMat);
  cap.position.y = 0.22;
  lanternGroup.add(cap);

  // Glass chamber
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.25, 6), glassMat);
  glass.position.y = 0.05;
  lanternGroup.add(glass);

  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.06, 6), ironMat);
  base.position.y = -0.1;
  lanternGroup.add(base);

  return lanternGroup;
}
