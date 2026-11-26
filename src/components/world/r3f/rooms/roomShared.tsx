import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useSharedWoodPBRTextures } from '../ModelAssets';
import {
  getCozyRugTexture,
  getBookSpineTexture,
  getJournalPageTexture,
  getTatamiMatTexture,
  getMosaicStoneTileTexture,
  getPagodaTileTexture,
  getFoliageSprigTexture,
  getLimeStuccoTexture,
  getBarkTexture,
  getBarkBumpTexture,
  getStainedGlassTexture,
  getZodiacMandalaTexture,
  getRakedZenSandTexture,
  getCalligraphyScrollTexture,
  getBrickFireplaceTexture,
  getWaterRippleTexture,
} from '../../ProceduralTextures';

import vistaJournalUrl from '../../../../assets/images/vista_journal_valley_1795579856335.jpg';
import vistaLettersUrl from '../../../../assets/images/vista_letters_sakura_1795579857551.jpg';
import vistaWishesUrl from '../../../../assets/images/vista_wishes_bamboo_1795579857946.jpg';
import vistaCalmUrl from '../../../../assets/images/vista_calm_willow_1795579857754.jpg';
import vistaCommunityUrl from '../../../../assets/images/vista_community_teahouse_1795579858340.jpg';
import vistaSpiritualUrl from '../../../../assets/images/vista_spiritual_cosmos_1795579858878.jpg';
import vistaLakeUrl from '../../../../assets/images/vista_lake_lanterns_1795579859464.jpg';
import tarotCardBackUrl from '../../../../assets/images/tarot_card_back_1795400313431.jpg';

const VISTA_ASSET_URLS = [
  vistaJournalUrl,
  vistaLettersUrl,
  vistaWishesUrl,
  vistaCalmUrl,
  vistaCommunityUrl,
  vistaSpiritualUrl,
  vistaLakeUrl,
  tarotCardBackUrl,
] as const;

VISTA_ASSET_URLS.forEach((u) => useTexture.preload(u));

export interface RoomVistaTextures {
  journal: THREE.Texture;
  letters: THREE.Texture;
  wishes: THREE.Texture;
  calm: THREE.Texture;
  community: THREE.Texture;
  spiritual_room: THREE.Texture;
  lake: THREE.Texture;
  tarotBack: THREE.Texture;
}

export function useRoomVistaTextures(): RoomVistaTextures {
  const loaded = useTexture([...VISTA_ASSET_URLS]) as THREE.Texture[];
  return useMemo(() => {
    loaded.forEach((tex) => {
      if (tex.colorSpace !== THREE.SRGBColorSpace || tex.anisotropy < 8) {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
      }
    });
    return {
      journal: loaded[0],
      letters: loaded[1],
      wishes: loaded[2],
      calm: loaded[3],
      community: loaded[4],
      spiritual_room: loaded[5],
      lake: loaded[6],
      tarotBack: loaded[7],
    };
  }, [loaded]);
}

export interface RoomSculptedGeometries {
  vaseGeo: THREE.LatheGeometry;
  brazierBowlGeo: THREE.LatheGeometry;
  candlestickGeo: THREE.LatheGeometry;
  teapotGeo: THREE.LatheGeometry;
  singingBowlGeo: THREE.LatheGeometry;
  flutedColumnGeo: THREE.LatheGeometry;
  lotusBowlGeo: THREE.LatheGeometry;
  conservatoryRibGeo: THREE.TubeGeometry;
  wishTrunkGeo: THREE.TubeGeometry;
  wishBranchLeftGeo: THREE.TubeGeometry;
  wishBranchRightGeo: THREE.TubeGeometry;
  wishRootGeo: THREE.TubeGeometry;
  sakuraBoughGeo: THREE.TubeGeometry;
  festoonCableGeo: THREE.TubeGeometry;
  moonGateWallGeo: THREE.ExtrudeGeometry;
  curvedEaveGeo: THREE.ExtrudeGeometry;
  lancetArchGeo: THREE.ExtrudeGeometry;
}

export function useRoomSculptedGeometries(): RoomSculptedGeometries {
  const geos = useMemo<RoomSculptedGeometries>(() => {
    const vasePts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.16, 0.02),
      new THREE.Vector2(0.24, 0.16),
      new THREE.Vector2(0.27, 0.34),
      new THREE.Vector2(0.19, 0.52),
      new THREE.Vector2(0.11, 0.65),
      new THREE.Vector2(0.16, 0.76),
      new THREE.Vector2(0.13, 0.78),
    ];
    const vaseGeo = new THREE.LatheGeometry(vasePts, 24);

    const brazierPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.24, 0.02),
      new THREE.Vector2(0.42, 0.12),
      new THREE.Vector2(0.56, 0.3),
      new THREE.Vector2(0.62, 0.44),
      new THREE.Vector2(0.66, 0.48),
      new THREE.Vector2(0.56, 0.5),
      new THREE.Vector2(0.5, 0.38),
      new THREE.Vector2(0.0, 0.34),
    ];
    const brazierBowlGeo = new THREE.LatheGeometry(brazierPts, 24);

    const candlePts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.12, 0.02),
      new THREE.Vector2(0.06, 0.07),
      new THREE.Vector2(0.032, 0.15),
      new THREE.Vector2(0.055, 0.22),
      new THREE.Vector2(0.028, 0.31),
      new THREE.Vector2(0.085, 0.38),
      new THREE.Vector2(0.09, 0.41),
      new THREE.Vector2(0.0, 0.41),
    ];
    const candlestickGeo = new THREE.LatheGeometry(candlePts, 18);

    const teapotPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.11, 0.01),
      new THREE.Vector2(0.17, 0.07),
      new THREE.Vector2(0.18, 0.14),
      new THREE.Vector2(0.12, 0.21),
      new THREE.Vector2(0.07, 0.23),
      new THREE.Vector2(0.09, 0.25),
      new THREE.Vector2(0.02, 0.27),
      new THREE.Vector2(0.0, 0.29),
    ];
    const teapotGeo = new THREE.LatheGeometry(teapotPts, 20);

    const bowlPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.12, 0.01),
      new THREE.Vector2(0.2, 0.08),
      new THREE.Vector2(0.24, 0.17),
      new THREE.Vector2(0.22, 0.18),
      new THREE.Vector2(0.18, 0.09),
      new THREE.Vector2(0.0, 0.04),
    ];
    const singingBowlGeo = new THREE.LatheGeometry(bowlPts, 22);

    const colPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.38, 0.0),
      new THREE.Vector2(0.38, 0.12),
      new THREE.Vector2(0.28, 0.19),
      new THREE.Vector2(0.24, 0.55),
      new THREE.Vector2(0.22, 0.92),
      new THREE.Vector2(0.34, 1.02),
      new THREE.Vector2(0.36, 1.12),
      new THREE.Vector2(0.0, 1.12),
    ];
    const flutedColumnGeo = new THREE.LatheGeometry(colPts, 18);

    const lotusPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.14, 0.02),
      new THREE.Vector2(0.24, 0.08),
      new THREE.Vector2(0.27, 0.17),
      new THREE.Vector2(0.21, 0.2),
      new THREE.Vector2(0.14, 0.1),
      new THREE.Vector2(0.0, 0.06),
    ];
    const lotusBowlGeo = new THREE.LatheGeometry(lotusPts, 14);

    const ribCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8.65, 0.0, 0),
      new THREE.Vector3(-8.5, 3.6, 0),
      new THREE.Vector3(-5.2, 5.95, 0),
      new THREE.Vector3(0, 6.65, 0),
      new THREE.Vector3(5.2, 5.95, 0),
      new THREE.Vector3(8.5, 3.6, 0),
      new THREE.Vector3(8.65, 0.0, 0),
    ]);
    const conservatoryRibGeo = new THREE.TubeGeometry(ribCurve, 34, 0.105, 8, false);

    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.0, 0),
      new THREE.Vector3(-0.18, 1.15, 0.1),
      new THREE.Vector3(0.1, 2.45, -0.06),
      new THREE.Vector3(-0.05, 3.75, 0.08),
    ]);
    const wishTrunkGeo = new THREE.TubeGeometry(trunkCurve, 22, 0.4, 12, false);

    const branchLeftCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.05, 2.55, 0),
      new THREE.Vector3(-1.05, 3.25, 0.34),
      new THREE.Vector3(-2.18, 3.72, 0.44),
      new THREE.Vector3(-2.95, 3.62, 0.14),
    ]);
    const wishBranchLeftGeo = new THREE.TubeGeometry(branchLeftCurve, 16, 0.16, 8, false);

    const branchRightCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.08, 2.7, -0.05),
      new THREE.Vector3(1.12, 3.42, -0.26),
      new THREE.Vector3(2.28, 3.85, 0.2),
      new THREE.Vector3(3.02, 3.75, 0.38),
    ]);
    const wishBranchRightGeo = new THREE.TubeGeometry(branchRightCurve, 16, 0.15, 8, false);

    const rootCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 0.76, 0.0),
      new THREE.Vector3(0.55, 0.28, 0.18),
      new THREE.Vector3(1.15, 0.07, 0.32),
      new THREE.Vector3(1.66, 0.0, 0.24),
    ]);
    const wishRootGeo = new THREE.TubeGeometry(rootCurve, 14, 0.14, 8, false);

    const sakuraCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.5, 0.65, 0.3),
      new THREE.Vector3(3.0, 1.0, 0.12),
      new THREE.Vector3(4.2, 0.78, -0.18),
    ]);
    const sakuraBoughGeo = new THREE.TubeGeometry(sakuraCurve, 16, 0.088, 8, false);

    const festoonPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = -7.2 + t * 14.4;
      const sag = Math.sin(t * Math.PI) * 0.74;
      festoonPts.push(new THREE.Vector3(x, -sag, 0));
    }
    const festoonCableGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(festoonPts),
      24,
      0.022,
      6,
      false
    );

    const gateShape = new THREE.Shape();
    gateShape.moveTo(-9.2, 0);
    gateShape.lineTo(9.2, 0);
    gateShape.lineTo(9.2, 6.0);
    gateShape.lineTo(-9.2, 6.0);
    gateShape.closePath();
    const moonHole = new THREE.Path();
    moonHole.absarc(0, 2.85, 2.62, 0, Math.PI * 2, true);
    gateShape.holes.push(moonHole);
    const moonGateWallGeo = new THREE.ExtrudeGeometry(gateShape, {
      depth: 0.32,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2,
      curveSegments: 40,
    });

    const eaveShape = new THREE.Shape();
    eaveShape.moveTo(0, 0);
    eaveShape.quadraticCurveTo(1.35, 0.08, 2.55, 0.86);
    eaveShape.lineTo(2.38, 1.08);
    eaveShape.quadraticCurveTo(1.22, 0.42, 0, 0.36);
    eaveShape.closePath();
    const curvedEaveGeo = new THREE.ExtrudeGeometry(eaveShape, {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2,
    });

    const archShape = new THREE.Shape();
    archShape.moveTo(-1.6, 0);
    archShape.lineTo(1.6, 0);
    archShape.lineTo(1.6, 5.95);
    archShape.lineTo(-1.6, 5.95);
    archShape.closePath();
    const lancetHole = new THREE.Path();
    lancetHole.moveTo(-1.12, 0.5);
    lancetHole.lineTo(-1.12, 3.72);
    lancetHole.quadraticCurveTo(-1.02, 4.86, 0, 5.38);
    lancetHole.quadraticCurveTo(1.02, 4.86, 1.12, 3.72);
    lancetHole.lineTo(1.12, 0.5);
    lancetHole.closePath();
    archShape.holes.push(lancetHole);
    const lancetArchGeo = new THREE.ExtrudeGeometry(archShape, {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2,
      curveSegments: 24,
    });

    return {
      vaseGeo,
      brazierBowlGeo,
      candlestickGeo,
      teapotGeo,
      singingBowlGeo,
      flutedColumnGeo,
      lotusBowlGeo,
      conservatoryRibGeo,
      wishTrunkGeo,
      wishBranchLeftGeo,
      wishBranchRightGeo,
      wishRootGeo,
      sakuraBoughGeo,
      festoonCableGeo,
      moonGateWallGeo,
      curvedEaveGeo,
      lancetArchGeo,
    };
  }, []);

  useEffect(
    () => () => {
      Object.values(geos).forEach((g) => g.dispose());
    },
    [geos]
  );

  return geos;
}

function createSoftContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(12, 16, 14, 0.56)');
  grad.addColorStop(0.52, 'rgba(12, 16, 14, 0.24)');
  grad.addColorStop(1, 'rgba(12, 16, 14, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface SharedRoomMaterials {
  timber: THREE.MeshPhysicalMaterial;
  darkTimber: THREE.MeshStandardMaterial;
  warmPlaster: THREE.MeshStandardMaterial;
  rosewoodWall: THREE.MeshStandardMaterial;
  sageWall: THREE.MeshStandardMaterial;
  teaWall: THREE.MeshStandardMaterial;
  spiritWall: THREE.MeshStandardMaterial;
  ceiling: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  marble: THREE.MeshPhysicalMaterial;
  brick: THREE.MeshStandardMaterial;
  pedestal: THREE.MeshStandardMaterial;
  stoveIron: THREE.MeshStandardMaterial;
  lacquerRed: THREE.MeshPhysicalMaterial;
  brass: THREE.MeshStandardMaterial;
  bronze: THREE.MeshStandardMaterial;
  bark: THREE.MeshStandardMaterial;
  paperCream: THREE.MeshStandardMaterial;
  shojiGlow: THREE.MeshStandardMaterial;
  stainedGlass: THREE.MeshStandardMaterial;
  ember: THREE.MeshStandardMaterial;
  velvet: THREE.MeshPhysicalMaterial;
  wineVelvet: THREE.MeshPhysicalMaterial;
  pondWater: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  crystalEmerald: THREE.MeshPhysicalMaterial;
  crystalAqua: THREE.MeshPhysicalMaterial;
  lanternGlow: THREE.MeshStandardMaterial;
  redSilkGlow: THREE.MeshStandardMaterial;
  sakuraFoliage: THREE.MeshStandardMaterial;
  oakFoliage: THREE.MeshStandardMaterial;
  willowFoliage: THREE.MeshStandardMaterial;
  tatamiFloor: THREE.MeshStandardMaterial;
  mosaicFloor: THREE.MeshStandardMaterial;
  pagodaFloor: THREE.MeshStandardMaterial;
  rugMat: THREE.MeshStandardMaterial;
  bookMat: THREE.MeshStandardMaterial;
  journalPageMat: THREE.MeshStandardMaterial;
  zodiacMat: THREE.MeshStandardMaterial;
  zenSandMat: THREE.MeshStandardMaterial;
  scrollMat: THREE.MeshStandardMaterial;
  tarotBackMat: THREE.MeshStandardMaterial;
  contactShadowMat: THREE.MeshBasicMaterial;
  leatherBrown: THREE.MeshStandardMaterial;
  cushionSage: THREE.MeshStandardMaterial;
}

export function useSharedRoomMaterials(
  tarotBackTex: THREE.Texture,
  isSoftwareGl = false
): SharedRoomMaterials {
  const [woodDiff, woodNor, woodRough] = useSharedWoodPBRTextures();
  const rugTex = useMemo(() => getCozyRugTexture(), []);
  const bookTex = useMemo(() => getBookSpineTexture(), []);
  const journalPageTex = useMemo(() => getJournalPageTexture(), []);
  const limeStuccoTex = useMemo(() => {
    const t = getLimeStuccoTexture();
    t.repeat.set(4, 2.5);
    t.anisotropy = 8;
    return t;
  }, []);
  const barkDiff = useMemo(() => getBarkTexture(), []);
  const barkBump = useMemo(() => getBarkBumpTexture(), []);
  const tatamiTex = useMemo(() => {
    const t = getTatamiMatTexture();
    t.repeat.set(5, 3.5);
    return t;
  }, []);
  const mosaicStoneTex = useMemo(() => {
    const t = getMosaicStoneTileTexture();
    t.repeat.set(5.5, 4);
    return t;
  }, []);
  const pagodaTileTex = useMemo(() => {
    const t = getPagodaTileTexture();
    t.repeat.set(4.5, 3);
    return t;
  }, []);
  const stainedGlassTex = useMemo(() => getStainedGlassTexture(), []);
  const zodiacTex = useMemo(() => getZodiacMandalaTexture(), []);
  const zenSandTex = useMemo(() => getRakedZenSandTexture(), []);
  const scrollTex = useMemo(() => getCalligraphyScrollTexture(), []);
  const brickTex = useMemo(() => {
    const t = getBrickFireplaceTexture();
    t.repeat.set(2, 2);
    return t;
  }, []);
  const waterTex = useMemo(() => {
    const t = getWaterRippleTexture();
    t.repeat.set(5, 3);
    return t;
  }, []);
  const contactShadowTex = useMemo(() => createSoftContactShadowTexture(), []);
  const foliage = useMemo(
    () => ({
      oak: getFoliageSprigTexture('oak'),
      sakura: getFoliageSprigTexture('sakura'),
      willow: getFoliageSprigTexture('willow'),
    }),
    []
  );

  const mats = useMemo<SharedRoomMaterials>(
    () => ({
      timber: new THREE.MeshPhysicalMaterial({
        map: woodDiff,
        normalMap: woodNor,
        roughnessMap: woodRough,
        color: 0x825738,
        roughness: 0.72,
        metalness: 0.04,
        clearcoat: 0.14,
        clearcoatRoughness: 0.55,
      }),
      darkTimber: new THREE.MeshStandardMaterial({ color: 0x452d1d, roughness: 0.74, metalness: 0.05 }),
      warmPlaster: new THREE.MeshStandardMaterial({
        map: limeStuccoTex,
        color: 0xf4ead8,
        roughness: 0.88,
        metalness: 0.02,
      }),
      rosewoodWall: new THREE.MeshStandardMaterial({
        map: limeStuccoTex,
        color: 0xead6c2,
        roughness: 0.86,
        metalness: 0.02,
      }),
      sageWall: new THREE.MeshStandardMaterial({
        map: limeStuccoTex,
        color: 0xd4e2d4,
        roughness: 0.86,
        metalness: 0.02,
      }),
      teaWall: new THREE.MeshStandardMaterial({
        map: limeStuccoTex,
        color: 0xe8ddc8,
        roughness: 0.86,
        metalness: 0.02,
      }),
      spiritWall: new THREE.MeshStandardMaterial({ color: 0x261f3d, roughness: 0.84, metalness: 0.06 }),
      ceiling: new THREE.MeshStandardMaterial({ color: 0x2d2219, roughness: 0.88 }),
      stone: new THREE.MeshStandardMaterial({ color: 0x7b837d, roughness: 0.9, metalness: 0.03 }),
      marble: new THREE.MeshPhysicalMaterial({
        color: 0xeef1ec,
        roughness: 0.34,
        metalness: 0.06,
        clearcoat: 0.45,
        clearcoatRoughness: 0.25,
      }),
      brick: new THREE.MeshStandardMaterial({ map: brickTex, color: 0xb8664b, roughness: 0.88 }),
      pedestal: new THREE.MeshStandardMaterial({ color: 0xcbc7bc, roughness: 0.66, metalness: 0.08 }),
      stoveIron: new THREE.MeshStandardMaterial({ color: 0x2a2b30, roughness: 0.48, metalness: 0.72 }),
      lacquerRed: new THREE.MeshPhysicalMaterial({
        color: 0x8c2320,
        roughness: 0.32,
        metalness: 0.06,
        clearcoat: 0.72,
        clearcoatRoughness: 0.22,
      }),
      brass: new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.24,
        metalness: 0.86,
        envMapIntensity: 1.1,
      }),
      bronze: new THREE.MeshStandardMaterial({
        color: 0x8f6b43,
        roughness: 0.34,
        metalness: 0.78,
        envMapIntensity: 1.0,
      }),
      bark: new THREE.MeshStandardMaterial({
        map: barkDiff,
        bumpMap: barkBump,
        color: 0x6b4e38,
        bumpScale: 0.035,
        roughness: 0.9,
        metalness: 0.02,
      }),
      paperCream: new THREE.MeshStandardMaterial({
        color: 0xfbf5e6,
        emissive: 0x5c4730,
        emissiveIntensity: 0.04,
        roughness: 0.82,
      }),
      shojiGlow: new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.22,
        roughness: 0.75,
      }),
      stainedGlass: new THREE.MeshStandardMaterial({
        map: stainedGlassTex,
        emissiveMap: stainedGlassTex,
        emissive: new THREE.Color(0xfef3c7),
        emissiveIntensity: 0.22,
        roughness: 0.28,
      }),
      ember: new THREE.MeshStandardMaterial({
        color: 0xfff7ed,
        emissive: 0xf97316,
        emissiveIntensity: 1.8,
        toneMapped: false,
      }),
      velvet: new THREE.MeshPhysicalMaterial({
        color: 0x245946,
        roughness: 0.76,
        sheen: 0.8,
        sheenColor: new THREE.Color(0x6ee7b7),
        sheenRoughness: 0.55,
      }),
      wineVelvet: new THREE.MeshPhysicalMaterial({
        color: 0x7c2d36,
        roughness: 0.76,
        sheen: 0.8,
        sheenColor: new THREE.Color(0xfca5a5),
        sheenRoughness: 0.55,
      }),
      pondWater: new THREE.MeshStandardMaterial({
        map: waterTex,
        color: 0x1e6b72,
        roughness: 0.14,
        metalness: 0.35,
        envMapIntensity: 1.1,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0xd9f0f5,
        transparent: true,
        opacity: 0.18,
        roughness: 0.12,
        metalness: 0.08,
        clearcoat: 0.45,
        clearcoatRoughness: 0.18,
        envMapIntensity: 0.4,
      }),
      crystalEmerald: new THREE.MeshPhysicalMaterial({
        color: 0x34d399,
        emissive: 0x059669,
        emissiveIntensity: 0.55,
        roughness: 0.12,
        metalness: 0.08,
        clearcoat: 1.0,
        ior: 1.54,
        transmission: isSoftwareGl ? 0 : 0.65,
        thickness: 0.85,
        envMapIntensity: 1.15,
        transparent: isSoftwareGl,
        opacity: isSoftwareGl ? 0.88 : 1.0,
      }),
      crystalAqua: new THREE.MeshPhysicalMaterial({
        color: 0x67e8f9,
        emissive: 0x0891b2,
        emissiveIntensity: 0.58,
        roughness: 0.12,
        metalness: 0.08,
        clearcoat: 1.0,
        ior: 1.5,
        transmission: isSoftwareGl ? 0 : 0.7,
        thickness: 0.95,
        envMapIntensity: 1.15,
        transparent: isSoftwareGl,
        opacity: isSoftwareGl ? 0.86 : 1.0,
      }),
      lanternGlow: new THREE.MeshStandardMaterial({
        color: 0xfffbeb,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.25,
        roughness: 0.28,
        toneMapped: false,
      }),
      redSilkGlow: new THREE.MeshStandardMaterial({
        color: 0xfff1f2,
        emissive: 0xe11d48,
        emissiveIntensity: 1.2,
        roughness: 0.28,
        toneMapped: false,
      }),
      sakuraFoliage: new THREE.MeshStandardMaterial({
        map: foliage.sakura,
        color: 0xffd6e6,
        alphaTest: 0.34,
        side: THREE.DoubleSide,
        roughness: 0.68,
      }),
      oakFoliage: new THREE.MeshStandardMaterial({
        map: foliage.oak,
        color: 0x528f44,
        alphaTest: 0.34,
        side: THREE.DoubleSide,
        roughness: 0.74,
      }),
      willowFoliage: new THREE.MeshStandardMaterial({
        map: foliage.willow,
        color: 0x5e9a54,
        alphaTest: 0.34,
        side: THREE.DoubleSide,
        roughness: 0.74,
      }),
      tatamiFloor: new THREE.MeshStandardMaterial({ map: tatamiTex, color: 0xdcc896, roughness: 0.78 }),
      mosaicFloor: new THREE.MeshStandardMaterial({ map: mosaicStoneTex, color: 0x9aa49e, roughness: 0.72, metalness: 0.08 }),
      pagodaFloor: new THREE.MeshStandardMaterial({
        map: pagodaTileTex,
        color: 0x6a7674,
        roughness: 0.64,
        metalness: 0.14,
      }),
      rugMat: new THREE.MeshStandardMaterial({ map: rugTex, color: 0xdfc9b2, roughness: 0.9 }),
      bookMat: new THREE.MeshStandardMaterial({ map: bookTex, color: 0xeadac8, roughness: 0.72 }),
      journalPageMat: new THREE.MeshStandardMaterial({ map: journalPageTex, color: 0xfaf3e3, roughness: 0.8 }),
      zodiacMat: new THREE.MeshStandardMaterial({
        map: zodiacTex,
        color: 0xd4be94,
        roughness: 0.42,
        metalness: 0.36,
      }),
      zenSandMat: new THREE.MeshStandardMaterial({ map: zenSandTex, color: 0xe6decb, roughness: 0.86 }),
      scrollMat: new THREE.MeshStandardMaterial({ map: scrollTex, color: 0xf2e7d0, roughness: 0.8 }),
      tarotBackMat: new THREE.MeshStandardMaterial({
        map: tarotBackTex,
        roughness: 0.45,
        metalness: 0.25,
      }),
      contactShadowMat: new THREE.MeshBasicMaterial({
        map: contactShadowTex,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
      leatherBrown: new THREE.MeshStandardMaterial({
        color: 0x6f432b,
        roughness: 0.56,
        metalness: 0.08,
      }),
      cushionSage: new THREE.MeshStandardMaterial({
        color: 0x527564,
        roughness: 0.88,
        metalness: 0.02,
      }),
    }),
    [
      isSoftwareGl,
      woodDiff,
      woodNor,
      woodRough,
      limeStuccoTex,
      barkDiff,
      barkBump,
      tatamiTex,
      mosaicStoneTex,
      pagodaTileTex,
      stainedGlassTex,
      zodiacTex,
      zenSandTex,
      scrollTex,
      brickTex,
      waterTex,
      contactShadowTex,
      foliage,
      rugTex,
      bookTex,
      journalPageTex,
      tarotBackTex,
    ]
  );

  useEffect(
    () => () => {
      contactShadowTex.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    },
    [mats, contactShadowTex]
  );

  return mats;
}

/**
 * 1. Soft Grounding Contact Shadow Disc beneath furniture clusters & columns
 */
export const ContactShadowDisc: React.FC<{
  position?: [number, number, number];
  radius?: number;
  mat: THREE.Material;
}> = React.memo(({ position = [0, 0.018, 0] as [number, number, number], radius = 1.25, mat }) => (
  <mesh position={position} rotation-x={-Math.PI / 2} material={mat}>
    <circleGeometry args={[radius, 24]} />
  </mesh>
));

/**
 * 2. Multi-Layer Diegetic RPG Hotspot Beacon Ring + Hover Light Pillar
 */
export const HotspotFloorRing: React.FC<{
  radius?: number;
  color?: string;
  hovered?: boolean;
  active?: boolean;
}> = ({ radius = 0.82, color = '#86efac', hovered = false, active = true }) => {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const pillarRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!active) return;
    const t = state.clock.getElapsedTime();
    const s = 1 + Math.sin(t * 2.8) * 0.06;
    if (outerRef.current) {
      outerRef.current.scale.set(s, s, 1);
      outerRef.current.rotation.z = t * 0.45;
    }
    if (innerRef.current) {
      innerRef.current.scale.set(1.02 - Math.sin(t * 2.8) * 0.04, 1.02 - Math.sin(t * 2.8) * 0.04, 1);
    }
    if (pillarRef.current) {
      pillarRef.current.rotation.y = t * 0.6;
    }
  });

  return (
    <group position={[0, 0.028, 0]}>
      <mesh ref={outerRef} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[radius * 0.86, radius, 32]} />
        <meshBasicMaterial
          color={hovered ? '#ffffff' : color}
          transparent
          opacity={hovered ? 0.95 : 0.62}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={innerRef} position={[0, -0.002, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[radius * 0.62, radius * 0.68, 28]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.55 : 0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
      {hovered && (
        <mesh ref={pillarRef} position={[0, 0.65, 0]}>
          <cylinderGeometry args={[radius * 0.82, radius * 0.94, 1.3, 24, 1, true]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.14}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

/**
 * 3. GLSL Organic Hearth / Brazier Flame Shader (Procedural FBM tongues + sparks)
 */
export const HearthFlameShader: React.FC<{
  position?: [number, number, number];
  size?: [number, number];
  active?: boolean;
  tint?: string;
}> = React.memo(({
  position = [0, 0, 0] as [number, number, number],
  size = [0.95, 0.82] as [number, number],
  active = true,
  tint = '#ff7b24',
}) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uTint: { value: new THREE.Color(tint) },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uTint;
          varying vec2 vUv;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
          }
          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
              mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
              u.y
            );
          }
          float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.55;
            for (int i = 0; i < 4; i++) {
              v += a * noise(p);
              p = p * 2.05 + vec2(1.7, 9.2);
              a *= 0.5;
            }
            return v;
          }

          void main() {
            vec2 uv = vUv;
            float xDist = abs(uv.x - 0.5) * 2.0;
            float sway = sin(uTime * 4.5 + uv.y * 5.0) * 0.08 * uv.y;
            float n = fbm(vec2((uv.x + sway) * 4.2, uv.y * 3.2 - uTime * 2.4));

            float shape = (1.0 - uv.y) * 1.12 - xDist * (0.72 + uv.y * 0.55);
            float flame = smoothstep(0.08, 0.72, shape + (n - 0.45) * 0.75);

            vec3 core = vec3(1.0, 0.96, 0.76);
            vec3 outer = uTint;
            vec3 col = mix(outer, core, smoothstep(0.35, 0.9, flame * (1.15 - uv.y * 0.65)));

            // Rising embers
            float sparkNoise = noise(vec2(uv.x * 16.0, uv.y * 12.0 - uTime * 3.8));
            float sparks = smoothstep(0.91, 0.985, sparkNoise) * smoothstep(0.15, 0.85, uv.y) * (1.0 - xDist);

            float alpha = clamp(flame * 0.95 + sparks * 0.75, 0.0, 1.0);
            gl_FragColor = vec4(col + core * sparks, alpha);
          }
        `,
      }),
    [tint]
  );

  useEffect(() => () => mat.dispose(), [mat]);

  useFrame((state) => {
    if (!active) return;
    mat.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <group position={position}>
      <mesh material={mat}>
        <planeGeometry args={size} />
      </mesh>
      <mesh rotation-y={Math.PI / 4} material={mat}>
        <planeGeometry args={[size[0] * 0.82, size[1] * 0.94]} />
      </mesh>
    </group>
  );
});

/**
 * 4. GLSL Indoor Water Caustics & Shimmering Ripples Plane
 */
export const IndoorWaterCausticsPlane: React.FC<{
  position?: [number, number, number];
  variant: 'circle' | 'rect';
  args: [number, number];
  shallowHex?: string;
  deepHex?: string;
  active?: boolean;
}> = React.memo(
  ({
    position = [0, 0, 0] as [number, number, number],
    variant,
    args,
    shallowHex = '#297282',
    deepHex = '#0f3646',
    active = true,
  }) => {
    const mat = useMemo(
      () =>
        new THREE.ShaderMaterial({
          transparent: true,
          uniforms: {
            uTime: { value: 0 },
            uShallow: { value: new THREE.Color(shallowHex) },
            uDeep: { value: new THREE.Color(deepHex) },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform vec3 uShallow;
            uniform vec3 uDeep;
            varying vec2 vUv;

            void main() {
              vec2 p = vUv * 8.0;
              float w1 = sin(p.x * 1.4 + uTime * 1.1 + cos(p.y * 1.3 - uTime * 0.8));
              float w2 = cos(p.y * 1.7 - uTime * 1.3 + sin(p.x * 1.1 + uTime * 0.9));
              float caust = pow(clamp(0.5 + 0.5 * (w1 * w2), 0.0, 1.0), 3.4);

              float distCenter = length(vUv - vec2(0.5)) * 2.0;
              vec3 baseCol = mix(uShallow, uDeep, clamp(distCenter * 0.85, 0.0, 1.0));
              vec3 glint = vec3(0.75, 0.95, 1.0) * caust * 0.42;

              // Subtle golden lantern reflection shimmer
              float lanternGlow = sin(vUv.x * 18.0 + uTime * 1.6) * cos(vUv.y * 12.0 - uTime);
              vec3 warmGlint = vec3(1.0, 0.84, 0.46) * smoothstep(0.65, 0.98, lanternGlow) * 0.16;

              gl_FragColor = vec4(baseCol + glint + warmGlint, 0.92);
            }
          `,
        }),
      [shallowHex, deepHex]
    );

    useEffect(() => () => mat.dispose(), [mat]);

    useFrame((state) => {
      if (!active) return;
      mat.uniforms.uTime.value = state.clock.getElapsedTime();
    });

    return (
      <mesh position={position} rotation-x={-Math.PI / 2} material={mat}>
        {variant === 'circle' ? (
          <circleGeometry args={[args[0], args[1]]} />
        ) : (
          <planeGeometry args={args} />
        )}
      </mesh>
    );
  }
);

/**
 * 5. GLSL Rain-Streaked Glass Shader Overlay for Căn Phòng Mưa Windows & Skylight
 */
export const RainyGlassShaderOverlay: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number];
  active?: boolean;
}> = React.memo(({
  position = [0, 0, 0] as [number, number, number],
  rotation = [0, 0, 0] as [number, number, number],
  size,
  active = true,
}) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uAspect: { value: size[0] / Math.max(0.1, size[1]) },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uAspect;
          varying vec2 vUv;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
          }

          void main() {
            vec2 uv = vec2(vUv.x * uAspect * 12.0, vUv.y * 8.0);
            float colId = floor(uv.x);
            float speed = 1.4 + hash(vec2(colId, 1.0)) * 1.6;
            float offset = hash(vec2(colId, 7.0)) * 10.0;
            float y = uv.y + uTime * speed + offset;

            float cellY = fract(y);
            float cellX = fract(uv.x) - 0.5;
            float wobble = sin(y * 3.1 + colId) * 0.14;

            // Raindrop head + trailing wet streak
            float drop = smoothstep(0.18, 0.02, length(vec2(cellX + wobble, (cellY - 0.85) * 1.8)));
            float trail = smoothstep(0.07, 0.0, abs(cellX + wobble)) * smoothstep(0.15, 0.85, cellY) * 0.45;

            float intensity = clamp(drop + trail, 0.0, 1.0);
            vec3 col = mix(vec3(0.55, 0.8, 0.9), vec3(0.92, 0.98, 1.0), drop);
            gl_FragColor = vec4(col, intensity * 0.52);
          }
        `,
      }),
    [size]
  );

  useEffect(() => () => mat.dispose(), [mat]);

  useFrame((state) => {
    if (!active) return;
    mat.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <mesh position={position} rotation={rotation} material={mat}>
      <planeGeometry args={size} />
    </mesh>
  );
});

/**
 * 6. Soft Volumetric Window / Moon-Gate Light Shaft (Edge-Faded GLSL Cone/Sheet)
 */
export const VolumetricLightShaft: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number];
  color?: string;
  opacity?: number;
}> = React.memo(
  ({
    position,
    rotation = [0.56, 0, 0] as [number, number, number],
    size = [1.55, 4.6] as [number, number],
    color = '#fef3c7',
    opacity = 0.12,
  }) => {
    const scaledOpacity = Math.min(opacity * 0.45, 0.07);
    const mat = useMemo(
      () =>
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          uniforms: {
            uColor: { value: new THREE.Color(color) },
            uOpacity: { value: scaledOpacity },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 uColor;
            uniform float uOpacity;
            varying vec2 vUv;
            void main() {
              float edgeX = smoothstep(0.0, 0.35, vUv.x) * (1.0 - smoothstep(0.65, 1.0, vUv.x));
              float edgeY = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.68, 1.0, vUv.y));
              float alpha = edgeX * edgeY * uOpacity;
              gl_FragColor = vec4(uColor, alpha);
            }
          `,
        }),
      [color, scaledOpacity]
    );

    useEffect(() => () => mat.dispose(), [mat]);

    return (
      <mesh position={position} rotation={rotation} material={mat}>
        <planeGeometry args={size} />
      </mesh>
    );
  }
);

/**
 * 7. Instanced Ambient Floating Dust Motes (Zero Per-Frame Allocations)
 */
const _moteDummy = new THREE.Object3D();

export const AmbientDustMotes: React.FC<{
  count?: number;
  bounds?: [number, number, number];
  origin?: [number, number, number];
  color?: string;
  active?: boolean;
}> = React.memo(
  ({
    count = 38,
    bounds = [10, 3.6, 7.5],
    origin = [0, 2.0, -0.6],
    color = '#fde68a',
    active = true,
  }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const geo = useMemo(() => new THREE.SphereGeometry(0.028, 6, 6), []);
    const mat = useMemo(
      () =>
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.72,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      [color]
    );

    const seeds = useMemo(() => {
      return Array.from({ length: count }, (_, i) => {
        const s1 = Math.sin(i * 12.9898) * 43758.5453;
        const s2 = Math.sin(i * 78.233 + 1.4) * 43758.5453;
        const s3 = Math.sin(i * 39.425 + 2.7) * 43758.5453;
        return {
          bx: (s1 - Math.floor(s1) - 0.5) * bounds[0],
          by: (s2 - Math.floor(s2) - 0.5) * bounds[1],
          bz: (s3 - Math.floor(s3) - 0.5) * bounds[2],
          speed: 0.35 + ((i * 7) % 10) * 0.04,
          phase: i * 0.7,
        };
      });
    }, [count, bounds]);

    useEffect(() => {
      if (meshRef.current) {
        seeds.forEach((s, idx) => {
          _moteDummy.position.set(origin[0] + s.bx, origin[1] + s.by, origin[2] + s.bz);
          _moteDummy.scale.setScalar(1);
          _moteDummy.updateMatrix();
          meshRef.current!.setMatrixAt(idx, _moteDummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
        meshRef.current.computeBoundingSphere();
      }
      return () => {
        geo.dispose();
        mat.dispose();
      };
    }, [geo, mat, seeds, origin]);

    useFrame((state) => {
      if (!active || !meshRef.current) return;
      const t = state.clock.getElapsedTime();
      for (let i = 0; i < seeds.length; i++) {
        const s = seeds[i];
        _moteDummy.position.set(
          origin[0] + s.bx + Math.sin(t * s.speed + s.phase) * 0.24,
          origin[1] + s.by + Math.cos(t * s.speed * 0.85 + s.phase) * 0.18,
          origin[2] + s.bz + Math.sin(t * s.speed * 0.7 + s.phase * 1.3) * 0.2
        );
        const pulse = 0.7 + 0.45 * Math.sin(t * 2.1 + s.phase);
        _moteDummy.scale.setScalar(pulse);
        _moteDummy.updateMatrix();
        meshRef.current.setMatrixAt(i, _moteDummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return <instancedMesh ref={meshRef} args={[geo, mat, count]} />;
  }
);

/**
 * 8. Detailed Interior Vietnamese Silk Lantern with Bamboo Ribs & Tassel
 */
export const InteriorSilkLantern: React.FC<{
  position: [number, number, number];
  variant?: 'amber' | 'red';
  mats: SharedRoomMaterials;
}> = React.memo(({ position, variant = 'amber', mats }) => (
  <group position={position}>
    <mesh position={[0, 0.28, 0]} material={mats.darkTimber}>
      <cylinderGeometry args={[0.012, 0.012, 0.56, 6]} />
    </mesh>
    <mesh position={[0, 0.03, 0]} material={mats.brass}>
      <cylinderGeometry args={[0.085, 0.075, 0.045, 14]} />
    </mesh>
    <mesh
      position={[0, -0.17, 0]}
      scale={[0.21, 0.25, 0.21]}
      material={variant === 'red' ? mats.redSilkGlow : mats.lanternGlow}
    >
      <sphereGeometry args={[1, 18, 12]} />
    </mesh>
    {[-0.08, -0.17, -0.26].map((ry, idx) => (
      <mesh key={`rib_${idx}`} position={[0, ry, 0]} rotation-x={Math.PI / 2} material={mats.darkTimber}>
        <torusGeometry args={[idx === 1 ? 0.215 : 0.19, 0.008, 6, 20]} />
      </mesh>
    ))}
    <mesh position={[0, -0.37, 0]} material={mats.brass}>
      <cylinderGeometry args={[0.07, 0.08, 0.045, 14]} />
    </mesh>
    <mesh position={[0, -0.43, 0]} material={mats.brass}>
      <sphereGeometry args={[0.032, 10, 8]} />
    </mesh>
    <mesh position={[0, -0.56, 0]} material={mats.lacquerRed}>
      <cylinderGeometry args={[0.016, 0.036, 0.22, 8]} />
    </mesh>
  </group>
));

/**
 * 9. True 3D Row of Hardbound Leather & Cloth Books + Brass Bookend
 */
const BOOK_PALETTE = [
  '#7c2d12',
  '#1e3a8a',
  '#14532d',
  '#831843',
  '#4c1d95',
  '#78350f',
  '#1f2937',
  '#0f5132',
];

export const BookshelfBooks3D: React.FC<{
  width: number;
  position?: [number, number, number];
  seed?: number;
  mats: SharedRoomMaterials;
}> = React.memo(({ width, position = [0, 0, 0] as [number, number, number], seed = 0, mats }) => {
  const volumes = useMemo(() => {
    const list: { x: number; w: number; h: number; d: number; col: string; tilt: number }[] = [];
    let cursor = -width * 0.46;
    let i = 0;
    while (cursor < width * 0.43) {
      const bw = 0.075 + ((i * 13 + seed * 7) % 5) * 0.014;
      const bh = 0.4 + ((i * 19 + seed * 11) % 7) * 0.034;
      const bd = 0.26 + ((i * 5 + seed * 3) % 4) * 0.02;
      const isTilted = (i + seed) % 13 === 11 && cursor + 0.16 < width * 0.43;
      list.push({
        x: cursor + bw * 0.5,
        w: bw - 0.008,
        h: bh,
        d: bd,
        col: BOOK_PALETTE[(i + seed) % BOOK_PALETTE.length],
        tilt: isTilted ? -0.16 : 0,
      });
      cursor += bw + (isTilted ? 0.055 : 0.004);
      i++;
    }
    return list;
  }, [width, seed]);

  return (
    <group position={position}>
      {volumes.map((v, idx) => (
        <group key={`bk3d_${idx}`} position={[v.x, v.h * 0.5, 0.04]} rotation-z={v.tilt}>
          <mesh castShadow>
            <boxGeometry args={[v.w, v.h, v.d]} />
            <meshStandardMaterial color={v.col} roughness={0.68} />
          </mesh>
          {/* Gilded Spine Ribbon */}
          <mesh position={[0, v.h * 0.24, v.d * 0.5 + 0.003]} material={mats.brass}>
            <boxGeometry args={[v.w * 0.72, 0.025, 0.006]} />
          </mesh>
          <mesh position={[0, -v.h * 0.26, v.d * 0.5 + 0.003]} material={mats.brass}>
            <boxGeometry args={[v.w * 0.72, 0.02, 0.006]} />
          </mesh>
        </group>
      ))}
      <mesh position={[width * 0.46, 0.15, 0.05]} material={mats.brass}>
        <boxGeometry args={[0.04, 0.3, 0.24]} />
      </mesh>
    </group>
  );
});

/**
 * 10. Sculpted Framed Botanical/Landscape Wall Art
 */
export const CarvedPictureFrame: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  size?: [number, number];
  texture: THREE.Texture;
  mats: SharedRoomMaterials;
}> = React.memo(({ position, rotationY = 0, size = [1.5, 1.05], texture, mats }) => {
  const [w, h] = size;
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh material={mats.darkTimber} castShadow>
        <boxGeometry args={[w + 0.18, h + 0.18, 0.08]} />
      </mesh>
      <mesh position={[0, 0, 0.045]} material={mats.brass}>
        <boxGeometry args={[w + 0.06, h + 0.06, 0.02]} />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={texture} roughness={0.55} />
      </mesh>
    </group>
  );
});

// Wide Curved Panoramic Exterior Backdrop Painting (Seamless Across Pan/Orbit Drag)
export const PanoramicVistaBackdrop: React.FC<{
  texture: THREE.Texture;
  radius?: number;
  height?: number;
  y?: number;
  zOffset?: number;
}> = React.memo(({ texture, radius = 20.5, height = 11.4, y = 3.9, zOffset = 3.4 }) => (
  <mesh position={[0, y, zOffset]} rotation-y={Math.PI * 0.68} scale={[-1, 1, 1]}>
    <cylinderGeometry args={[radius, radius, height, 48, 1, true, 0, Math.PI * 0.64]} />
    <meshBasicMaterial map={texture} color="#e8ece6" side={THREE.DoubleSide} />
  </mesh>
));

// Open Cutaway Front Curb Threshold (Keeps Camera Sightline 100% Unobstructed)
export const CutawayCurbThreshold: React.FC<{
  width: number;
  zPos: number;
  trimMat: THREE.Material;
}> = React.memo(({ width, zPos, trimMat }) => {
  const half = width * 0.5;
  return (
    <group position={[0, 0, zPos]}>
      <mesh position={[0, 0.04, 0]} material={trimMat} receiveShadow>
        <boxGeometry args={[width, 0.08, 0.28]} />
      </mesh>
      <mesh position={[-half + 2.35, 0.22, 0]} material={trimMat} receiveShadow>
        <boxGeometry args={[4.5, 0.36, 0.2]} />
      </mesh>
      <mesh position={[half - 2.35, 0.22, 0]} material={trimMat} receiveShadow>
        <boxGeometry args={[4.5, 0.36, 0.2]} />
      </mesh>
      <mesh position={[-half + 0.12, 0.36, 0]} material={trimMat} castShadow>
        <boxGeometry args={[0.26, 0.72, 0.26]} />
      </mesh>
      <mesh position={[half - 0.12, 0.36, 0]} material={trimMat} castShadow>
        <boxGeometry args={[0.26, 0.72, 0.26]} />
      </mesh>
    </group>
  );
});
