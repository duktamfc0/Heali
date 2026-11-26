import React, { Suspense } from 'react';
import * as THREE from 'three';
import { RealBotanicalPlant, RealCoffeeMug, RealLantern } from '../ModelAssets';
import {
  AmbientDustMotes,
  ContactShadowDisc,
  CutawayCurbThreshold,
  HotspotFloorRing,
  IndoorWaterCausticsPlane,
  InteriorSilkLantern,
  PanoramicVistaBackdrop,
  RainyGlassShaderOverlay,
  VolumetricLightShaft,
  type RoomSculptedGeometries,
  type SharedRoomMaterials,
} from './roomShared';

interface RoomCommonProps {
  active: boolean;
  isSoftwareGl: boolean;
  mats: SharedRoomMaterials;
  geos: RoomSculptedGeometries;
  vistaTex: THREE.Texture;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  onFloorClick: (e: { stopPropagation: () => void; point: THREE.Vector3 }) => void;
  onTriggerAction: (action: any) => void;
}

export const WishesTempleRoom: React.FC<
  RoomCommonProps & {
    wishCrystalRef: React.RefObject<THREE.Mesh | null>;
    wishRibbonsRef: React.RefObject<THREE.Group | null>;
  }
> = React.memo(
  ({
    active,
    isSoftwareGl,
    mats,
    geos,
    vistaTex,
    hoveredId,
    setHoveredId,
    onFloorClick,
    onTriggerAction,
    wishCrystalRef,
    wishRibbonsRef,
  }) => (
    <group visible={active}>
      {/* Expansive Celadon Stone Courtyard Floor (18.4m x 13.0m) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow onClick={onFloorClick}>
        <planeGeometry args={[18.4, 13.0]} />
        <primitive object={mats.mosaicFloor} attach="material" />
      </mesh>

      {/* Panoramic Moonlit Bamboo Courtyard Outside Moon Gate */}
      <PanoramicVistaBackdrop texture={vistaTex} radius={21.0} height={11.8} y={4.0} zOffset={3.4} />

      {/* Open-Air Temple Colonnade (Left & Right Timber Walls + Cinnabar Lacquer Columns at x = ±9.0) */}
      {[-9.0, 9.0].map((wx, sIdx) => (
        <group key={`w_sw_${sIdx}`} position={[wx, 0, 0]}>
          <mesh
            position={[0, 2.95, 0]}
            rotation-y={sIdx === 0 ? Math.PI / 2 : -Math.PI / 2}
            material={mats.sageWall}
          >
            <boxGeometry args={[13.0, 5.9, 0.26]} />
          </mesh>
          <mesh position={[sIdx === 0 ? 0.14 : -0.14, 0.6, 0]} material={mats.darkTimber}>
            <boxGeometry args={[0.08, 1.2, 12.9]} />
          </mesh>
          {[-4.9, -1.65, 1.65, 4.9].map((pz, idx) => (
            <group key={`wcol_${idx}`} position={[sIdx === 0 ? 0.36 : -0.36, 0, pz]}>
              <mesh position={[0, 0.1, 0]} material={mats.stone}>
                <cylinderGeometry args={[0.24, 0.28, 0.2, 14]} />
              </mesh>
              <mesh position={[0, 2.95, 0]} material={mats.lacquerRed} castShadow>
                <cylinderGeometry args={[0.17, 0.21, 5.7, 14]} />
              </mesh>
              <mesh position={[0, 5.75, 0]} material={mats.brass}>
                <cylinderGeometry args={[0.25, 0.18, 0.18, 14]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* Sculpted Circular Moon Gate Wall at Back (-6.35) + Brass Bezel & Carved Hoành Phi Plaque */}
      <group position={[0, 0, -6.35]}>
        <mesh geometry={geos.moonGateWallGeo} material={mats.sageWall} receiveShadow />
        <mesh position={[0, 2.85, 0.18]} material={mats.darkTimber}>
          <torusGeometry args={[2.64, 0.13, 12, 48]} />
        </mesh>
        <mesh position={[0, 2.85, 0.24]} material={mats.brass}>
          <torusGeometry args={[2.51, 0.032, 8, 48]} />
        </mesh>
        <mesh position={[0, 5.66, 0.22]} material={mats.lacquerRed} castShadow>
          <boxGeometry args={[2.8, 0.46, 0.12]} />
        </mesh>
        <mesh position={[0, 5.66, 0.29]} material={mats.brass}>
          <boxGeometry args={[2.5, 0.28, 0.04]} />
        </mesh>
        {[-5.4, 5.4].map((cx, ci) => (
          <group key={`wgatecol_${ci}`} position={[cx, 0, 0.36]}>
            <mesh position={[0, 0.1, 0]} material={mats.stone}>
              <cylinderGeometry args={[0.24, 0.28, 0.2, 14]} />
            </mesh>
            <mesh position={[0, 2.95, 0]} material={mats.lacquerRed} castShadow>
              <cylinderGeometry args={[0.18, 0.22, 5.7, 14]} />
            </mesh>
            <mesh position={[0, 5.75, 0]} material={mats.brass}>
              <cylinderGeometry args={[0.26, 0.19, 0.18, 14]} />
            </mesh>
          </group>
        ))}
        {/* Mounted Silk Calligraphy Scrolls Flanking Moon Gate with Roller Bars */}
        {[-6.75, 6.75].map((sx, si) => (
          <group key={`wscroll_${si}`} position={[sx, 3.05, 0.36]}>
            <mesh material={mats.scrollMat}>
              <planeGeometry args={[1.05, 2.15]} />
            </mesh>
            <mesh position={[0, 1.1, 0.02]} rotation-z={Math.PI / 2} material={mats.darkTimber}>
              <cylinderGeometry args={[0.035, 0.035, 1.24, 10]} />
            </mesh>
            <mesh position={[0, -1.1, 0.02]} rotation-z={Math.PI / 2} material={mats.darkTimber}>
              <cylinderGeometry args={[0.04, 0.04, 1.26, 10]} />
            </mesh>
            {[-0.63, 0.63].map((ex, ei) => (
              <mesh key={`wscap_${ei}`} position={[ex, -1.1, 0.02]} rotation-z={Math.PI / 2} material={mats.brass}>
                <cylinderGeometry args={[0.045, 0.045, 0.06, 10]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* Cool Jade Moonlight Shaft Streaming Through Moon Gate */}
      <VolumetricLightShaft
        position={[0, 2.35, -3.7]}
        rotation={[0.48, 0, 0]}
        size={[3.5, 5.6]}
        color="#a7f3d0"
        opacity={0.13}
      />

      {/* Pagoda Temple Timber Beams & Hanging Silk Lanterns Overhead */}
      <group position={[0, 5.95, -1.0]}>
        {[-4.6, -2.1, 0.4, 2.9, 5.1].map((bz, idx) => (
          <mesh key={`wbeam_${idx}`} position={[0, 0, bz]} material={mats.darkTimber}>
            <boxGeometry args={[18.2, 0.22, 0.22]} />
          </mesh>
        ))}
        <mesh position={[-4.6, 0.68, 0]} rotation-z={-0.22} material={mats.ceiling}>
          <boxGeometry args={[9.8, 0.14, 11.2]} />
        </mesh>
        <mesh position={[4.6, 0.68, 0]} rotation-z={0.22} material={mats.ceiling}>
          <boxGeometry args={[9.8, 0.14, 11.2]} />
        </mesh>
        <InteriorSilkLantern position={[-4.8, -0.35, -1.5]} variant="amber" mats={mats} />
        <InteriorSilkLantern position={[4.8, -0.35, -1.5]} variant="red" mats={mats} />
        <InteriorSilkLantern position={[-4.8, -0.35, 2.2]} variant="red" mats={mats} />
        <InteriorSilkLantern position={[4.8, -0.35, 2.2]} variant="amber" mats={mats} />
      </group>

      {/* Crescent Moon Reflection Pool with Animated GLSL Caustics, Stepping Stones & Lotus Bowls */}
      <group position={[0.65, 0.02, -4.55]}>
        <IndoorWaterCausticsPlane
          variant="circle"
          args={[1.82, 36]}
          shallowHex="#2d7a74"
          deepHex="#103634"
          active={active}
        />
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.005, 0]} material={mats.stone}>
          <ringGeometry args={[1.8, 2.04, 32]} />
        </mesh>
        {[
          [-0.78, 0.04, 0.42],
          [0.68, 0.04, -0.32],
          [0.14, 0.04, 0.78],
          [-0.3, 0.04, -0.68],
        ].map(([lx, ly, lz], i) => (
          <group key={`wpond_l_${i}`} position={[lx, ly, lz]}>
            <mesh geometry={geos.lotusBowlGeo} material={mats.lanternGlow} scale={0.74} />
          </group>
        ))}
      </group>

      {/* Carved East-Asian Stone Tōrō Lantern & Tsukubai Bamboo Water Basin */}
      <group position={[6.45, 0, -4.05]}>
        <ContactShadowDisc position={[0, 0.018, 0]} radius={0.85} mat={mats.contactShadowMat} />
        <mesh position={[0, 0.25, 0]} material={mats.stone} castShadow>
          <cylinderGeometry args={[0.34, 0.45, 0.5, 8]} />
        </mesh>
        <mesh position={[0, 0.88, 0]} material={mats.stone} castShadow>
          <cylinderGeometry args={[0.17, 0.22, 0.85, 8]} />
        </mesh>
        <mesh position={[0, 1.32, 0]} material={mats.stone}>
          <cylinderGeometry args={[0.34, 0.26, 0.08, 6]} />
        </mesh>
        {/* Hollowed Firebox with Glowing Paper Core & Corner Stone Pillars */}
        <mesh position={[0, 1.5, 0]} material={mats.lanternGlow}>
          <boxGeometry args={[0.24, 0.28, 0.24]} />
        </mesh>
        {[
          [-0.14, -0.14],
          [0.14, -0.14],
          [-0.14, 0.14],
          [0.14, 0.14],
        ].map(([px, pz], pi) => (
          <mesh key={`toro_p_${pi}`} position={[px, 1.5, pz]} material={mats.stone}>
            <boxGeometry args={[0.055, 0.3, 0.055]} />
          </mesh>
        ))}
        <mesh position={[0, 1.84, 0]} material={mats.stone} castShadow>
          <coneGeometry args={[0.48, 0.38, 6]} />
        </mesh>
        <mesh position={[0, 2.06, 0]} material={mats.stone}>
          <sphereGeometry args={[0.08, 10, 8]} />
        </mesh>
        {/* Tsukubai Stone Water Basin & Bamboo Kakehi Spout */}
        <group position={[0.92, 0, 0.42]}>
          <mesh position={[0, 0.22, 0]} material={mats.stone} castShadow>
            <cylinderGeometry args={[0.32, 0.28, 0.44, 14]} />
          </mesh>
          <mesh position={[0, 0.445, 0]} rotation-x={-Math.PI / 2} material={mats.pondWater}>
            <circleGeometry args={[0.23, 14]} />
          </mesh>
          <mesh position={[0.24, 0.36, -0.18]} material={mats.darkTimber}>
            <cylinderGeometry args={[0.045, 0.05, 0.72, 8]} />
          </mesh>
          <mesh position={[0.1, 0.64, -0.08]} rotation-z={1.25} rotation-y={-0.5} material={mats.darkTimber}>
            <cylinderGeometry args={[0.025, 0.028, 0.4, 8]} />
          </mesh>
        </group>
      </group>

      {/* Hotspot 1: Monumental Sculpted Sacred Wish Tree with Gnarled Roots, Ema Plaques & Silk Ribbons */}
      <group
        position={[-2.85, 0, -1.45]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId('w_tree');
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAction('open_wishes');
        }}
      >
        <ContactShadowDisc position={[0, 0.018, 0]} radius={2.05} mat={mats.contactShadowMat} />
        <mesh position={[0, 0.1, 0]} material={mats.stone} receiveShadow>
          <cylinderGeometry args={[1.52, 1.7, 0.2, 26]} />
        </mesh>
        <mesh position={[0, 0.22, 0]} material={mats.darkTimber} receiveShadow>
          <cylinderGeometry args={[1.34, 1.42, 0.06, 26]} />
        </mesh>
        <group scale={1.12}>
          <mesh geometry={geos.wishTrunkGeo} material={mats.bark} castShadow />
          <mesh geometry={geos.wishBranchLeftGeo} material={mats.bark} castShadow />
          <mesh geometry={geos.wishBranchRightGeo} material={mats.bark} castShadow />
          {[0.15, 1.45, 2.75, 4.05, 5.25].map((ry, i) => (
            <mesh key={`wroot_${i}`} rotation-y={ry} geometry={geos.wishRootGeo} material={mats.bark} />
          ))}
        </group>

        {/* Layered Rich Botanical Canopy Sprigs */}
        {[
          [0, 3.95, 0, 3.55, mats.oakFoliage],
          [-1.75, 3.5, 0.3, 2.65, mats.sakuraFoliage],
          [1.85, 3.6, 0.18, 2.75, mats.oakFoliage],
          [-0.55, 3.85, -0.85, 2.45, mats.sakuraFoliage],
          [0.85, 3.75, 0.72, 2.4, mats.sakuraFoliage],
          [-2.35, 3.15, -0.25, 2.15, mats.oakFoliage],
          [2.3, 3.25, -0.15, 2.1, mats.sakuraFoliage],
        ].map(([fx, fy, fz, fsize, fmat], idx) => (
          <group key={`wf_${idx}`} position={[fx as number, fy as number, fz as number]}>
            <mesh material={fmat as THREE.Material}>
              <planeGeometry args={[fsize as number, fsize as number]} />
            </mesh>
            <mesh rotation-y={Math.PI / 2.2} material={fmat as THREE.Material}>
              <planeGeometry args={[fsize as number, fsize as number]} />
            </mesh>
          </group>
        ))}

        {/* 14 Swaying Silk Wish Ribbons & Wooden Ema Prayer Tablets */}
        <group ref={wishRibbonsRef}>
          {[
            [-1.55, 2.52, 0.48, '#e11d48'],
            [-1.12, 2.62, 0.72, '#f59e0b'],
            [-0.48, 2.74, -0.62, '#fef08a'],
            [0.4, 2.68, 0.78, '#fb7185'],
            [1.15, 2.6, -0.28, '#6ee7b7'],
            [-1.85, 2.45, -0.24, '#fbcfe8'],
            [1.68, 2.58, 0.52, '#fde047'],
            [2.05, 2.52, -0.2, '#fb7185'],
            [-2.2, 2.48, 0.18, '#fcd34d'],
            [0.84, 2.76, 0.48, '#a7f3d0'],
            [-0.75, 2.7, 0.58, '#fda4af'],
            [0.14, 2.8, -0.48, '#fbbf24'],
            [-1.35, 2.65, -0.45, '#fde68a'],
            [1.38, 2.64, -0.44, '#f9a8d4'],
          ].map(([rx, ry, rz, col], idx) => (
            <group key={`rib_${idx}`} position={[rx as number, ry as number, rz as number]}>
              <mesh>
                <boxGeometry args={[0.09, 0.74, 0.025]} />
                <meshStandardMaterial
                  color={col as string}
                  emissive={col as string}
                  emissiveIntensity={0.32}
                />
              </mesh>
              {idx % 2 === 0 && (
                <group position={[0, -0.18, 0.025]}>
                  <mesh material={mats.paperCream}>
                    <boxGeometry args={[0.16, 0.22, 0.02]} />
                  </mesh>
                  <mesh position={[0, 0.14, 0]} material={mats.lacquerRed}>
                    <cylinderGeometry args={[0.01, 0.01, 0.12, 6]} />
                  </mesh>
                </group>
              )}
            </group>
          ))}
        </group>

        <HotspotFloorRing
          radius={1.85}
          color="#a7f3d0"
          hovered={hoveredId === 'w_tree'}
          active={active}
        />
      </group>

      {/* Hotspot 2: Jade Mood Crystal Altar, Brass Censer & Porcelain Offering Vase */}
      <group
        position={[4.55, 0, -0.55]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId('w_crystal');
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAction('open_mood_checkin');
        }}
      >
        <ContactShadowDisc position={[0, 0.018, 0]} radius={1.25} mat={mats.contactShadowMat} />
        <mesh position={[0, 0.08, 0]} material={mats.stone} receiveShadow>
          <cylinderGeometry args={[0.92, 1.04, 0.16, 20]} />
        </mesh>
        <mesh position={[0, 0.16, 0]} geometry={geos.flutedColumnGeo} material={mats.stone} castShadow />
        <mesh position={[0, 1.32, 0]} material={mats.brass}>
          <cylinderGeometry args={[0.42, 0.42, 0.06, 16]} />
        </mesh>
        <mesh ref={wishCrystalRef} position={[0, 1.62, 0]} material={mats.crystalEmerald}>
          <octahedronGeometry args={[0.31, 0]} />
        </mesh>
        <mesh position={[-0.72, 0.16, 0.28]} geometry={geos.vaseGeo} material={mats.marble} scale={0.78} />
        <mesh position={[0.68, 0.22, 0.32]} geometry={geos.singingBowlGeo} material={mats.bronze} scale={0.72} />
        <HotspotFloorRing
          radius={1.12}
          color="#6ee7b7"
          hovered={hoveredId === 'w_crystal'}
          active={active}
        />
      </group>

      <Suspense fallback={null}>
        <RealLantern position={[-6.8, 2.45, -5.6]} scale={0.048} />
        <RealLantern position={[6.8, 2.45, -5.6]} scale={0.048} />
      </Suspense>

      <AmbientDustMotes
        count={isSoftwareGl ? 22 : 52}
        bounds={[15.6, 4.8, 10.6]}
        origin={[0, 2.3, -0.6]}
        color="#a7f3d0"
        active={active}
      />

      <CutawayCurbThreshold width={18.2} zPos={6.4} trimMat={mats.darkTimber} />
    </group>
  )
);

export const CalmConservatoryRoom: React.FC<
  RoomCommonProps & {
    breathOrbRef: React.RefObject<THREE.Mesh | null>;
    breathRing1Ref: React.RefObject<THREE.Mesh | null>;
    breathRing2Ref: React.RefObject<THREE.Mesh | null>;
    windChimesRef: React.RefObject<THREE.Group | null>;
    rainGroupRef: React.RefObject<THREE.Group | null>;
  }
> = React.memo(
  ({
    active,
    isSoftwareGl,
    mats,
    geos,
    vistaTex,
    hoveredId,
    setHoveredId,
    onFloorClick,
    onTriggerAction,
    breathOrbRef,
    breathRing1Ref,
    breathRing2Ref,
    windChimesRef,
    rainGroupRef,
  }) => (
    <group visible={active}>
      {/* Expansive Celadon Stone Conservatory Floor (18.0m x 12.8m) + Large Woven Center Rug */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow onClick={onFloorClick}>
        <planeGeometry args={[18.0, 12.8]} />
        <primitive object={mats.mosaicFloor} attach="material" />
      </mesh>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0.014, 0.35]}
        material={mats.rugMat}
        receiveShadow
        onClick={onFloorClick}
      >
        <planeGeometry args={[7.4, 5.0]} />
      </mesh>

      {/* Panoramic Misty River & Weeping Willow Panorama */}
      <PanoramicVistaBackdrop texture={vistaTex} radius={20.8} height={11.6} y={3.9} zOffset={3.4} />

      {/* Vaulted Wrought-Iron & Glass Conservatory Dome Ribs + Longitudinal Purlins */}
      <group position={[0, 0, 0]}>
        {[-5.8, -3.1, -0.4, 2.3, 5.0].map((rz, idx) => (
          <mesh
            key={`c_rib_${idx}`}
            position={[0, 0, rz]}
            geometry={geos.conservatoryRibGeo}
            material={mats.stoveIron}
            castShadow
          />
        ))}
        {/* Longitudinal Iron Purlins Connecting Dome Arches */}
        {[
          [-5.2, 5.95],
          [0, 6.65],
          [5.2, 5.95],
        ].map(([px, py], pi) => (
          <mesh key={`c_purlin_${pi}`} position={[px, py, -0.4]} material={mats.stoveIron}>
            <boxGeometry args={[0.1, 0.12, 11.0]} />
          </mesh>
        ))}

        {/* Glass Side Walls + Vertical Iron Mullions + Rain-Streaked GLSL Glass Overlays */}
        {[-8.65, 8.65].map((wx, sIdx) => (
          <group key={`c_sw_${sIdx}`} position={[wx, 0, 0]}>
            <mesh position={[0, 0.48, 0]} material={mats.stone} receiveShadow>
              <boxGeometry args={[0.32, 0.96, 12.6]} />
            </mesh>
            <mesh
              position={[0, 2.75, 0]}
              rotation-y={sIdx === 0 ? Math.PI / 2 : -Math.PI / 2}
              material={mats.glass}
            >
              <planeGeometry args={[12.4, 3.7]} />
            </mesh>
            <RainyGlassShaderOverlay
              position={[sIdx === 0 ? 0.02 : -0.02, 2.75, 0]}
              rotation={[0, sIdx === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
              size={[12.4, 3.7]}
              active={active}
            />
          </group>
        ))}

        {/* Back Conservatory Glass Curtain Wall + Mullions + Animated Rainy Glass Shader */}
        <mesh position={[0, 0.45, -6.15]} material={mats.stone} receiveShadow>
          <boxGeometry args={[17.6, 0.9, 0.32]} />
        </mesh>
        <mesh position={[0, 3.35, -6.15]} material={mats.glass}>
          <planeGeometry args={[17.2, 4.9]} />
        </mesh>
        {[-6.2, -3.1, 0, 3.1, 6.2].map((mx, mi) => (
          <mesh key={`c_bmul_${mi}`} position={[mx, 3.35, -6.13]} material={mats.stoveIron}>
            <boxGeometry args={[0.08, 4.9, 0.1]} />
          </mesh>
        ))}
        <RainyGlassShaderOverlay
          position={[0, 3.35, -6.12]}
          size={[17.2, 4.9]}
          active={active}
        />

        {/* Overhead Skylight Glass Vault */}
        <mesh position={[-3.85, 5.78, -0.4]} rotation-z={-0.34} material={mats.glass}>
          <planeGeometry args={[8.8, 11.2]} />
        </mesh>
        <mesh position={[3.85, 5.78, -0.4]} rotation-z={0.34} material={mats.glass}>
          <planeGeometry args={[8.8, 11.2]} />
        </mesh>
      </group>

      {/* Soft Sky-Dome Volumetric Light Shafts */}
      <VolumetricLightShaft
        position={[-2.2, 3.1, -1.4]}
        rotation={[0.4, 0, -0.18]}
        size={[2.6, 6.0]}
        color="#bae6fd"
        opacity={0.12}
      />
      <VolumetricLightShaft
        position={[2.2, 3.1, -1.4]}
        rotation={[0.4, 0, 0.18]}
        size={[2.6, 6.0]}
        color="#bae6fd"
        opacity={0.12}
      />

      {/* Indoor Shallow Pebble Reflection Brook with GLSL Caustics, Stepping Stones & Arched Mini-Bridge */}
      <group position={[0, 0.02, -4.65]}>
        <IndoorWaterCausticsPlane
          variant="rect"
          args={[15.8, 1.55]}
          shallowHex="#2d6e7d"
          deepHex="#12313b"
          active={active}
        />
        <mesh position={[0, 0.02, 0.8]} material={mats.stone}>
          <boxGeometry args={[15.9, 0.08, 0.14]} />
        </mesh>
        {[-5.6, -3.7, -1.8, 1.8, 3.7, 5.6].map((sx, idx) => (
          <mesh key={`st_${idx}`} position={[sx, 0.03, 0]} material={mats.stone}>
            <cylinderGeometry args={[0.36, 0.4, 0.06, 12]} />
          </mesh>
        ))}
        {/* Low Arched Cedar Mini-Bridge Crossing the Brook */}
        <group position={[0, 0.08, 0]}>
          <mesh position={[0, 0.06, 0]} material={mats.darkTimber} castShadow>
            <boxGeometry args={[1.3, 0.08, 1.95]} />
          </mesh>
          {[-0.6, 0.6].map((bx, bi) => (
            <group key={`cbr_${bi}`} position={[bx, 0, 0]}>
              <mesh position={[0, 0.24, -0.85]} material={mats.darkTimber}>
                <boxGeometry args={[0.07, 0.36, 0.07]} />
              </mesh>
              <mesh position={[0, 0.24, 0.85]} material={mats.darkTimber}>
                <boxGeometry args={[0.07, 0.36, 0.07]} />
              </mesh>
              <mesh position={[0, 0.39, 0]} material={mats.darkTimber}>
                <boxGeometry args={[0.06, 0.06, 1.85]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* Exterior Weeping Willow Fronds & Falling Raindrops Outside Conservatory */}
      <mesh position={[-4.5, 2.9, -7.05]} material={mats.willowFoliage}>
        <planeGeometry args={[4.2, 4.2]} />
      </mesh>
      <mesh position={[4.5, 2.9, -7.05]} material={mats.willowFoliage}>
        <planeGeometry args={[4.2, 4.2]} />
      </mesh>
      <group ref={rainGroupRef} position={[0, 0, -6.65]}>
        {Array.from({ length: isSoftwareGl ? 24 : 52 }).map((_, i) => (
          <mesh
            key={`rain_${i}`}
            position={[(i - (isSoftwareGl ? 12 : 26)) * 0.31, (i % 6) * 0.72 + 0.55, (i % 3) * 0.22]}
          >
            <cylinderGeometry args={[0.009, 0.009, 0.52, 4]} />
            <meshBasicMaterial color="#bae6fd" transparent opacity={0.62} />
          </mesh>
        ))}
      </group>

      {/* Hotspot 1: Sunken Teak Lotus Dais + 4-7-8 Breathing Aqua Orb + Inner Pulsing Core */}
      <group
        position={[0, 0, -0.95]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId('c_orb');
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAction('open_calm_breathe');
        }}
      >
        <ContactShadowDisc position={[0, 0.018, 0]} radius={1.36} mat={mats.contactShadowMat} />
        <mesh position={[0, 0.1, 0]} material={mats.darkTimber} receiveShadow>
          <cylinderGeometry args={[0.98, 1.12, 0.2, 24]} />
        </mesh>
        <mesh position={[0, 0.2, 0]} geometry={geos.flutedColumnGeo} material={mats.stone} scale={0.78} castShadow />
        <mesh position={[0, 1.08, 0]} material={mats.brass}>
          <cylinderGeometry args={[0.45, 0.45, 0.05, 18]} />
        </mesh>
        <mesh position={[0, 1.54, 0]} material={mats.lanternGlow}>
          <sphereGeometry args={[0.15, 12, 12]} />
        </mesh>
        <mesh ref={breathOrbRef} position={[0, 1.54, 0]} material={mats.crystalAqua}>
          <icosahedronGeometry args={[0.41, 2]} />
        </mesh>
        <mesh ref={breathRing1Ref} position={[0, 1.54, 0]} material={mats.brass}>
          <torusGeometry args={[0.6, 0.018, 8, 34]} />
        </mesh>
        <mesh ref={breathRing2Ref} position={[0, 1.54, 0]} material={mats.brass}>
          <torusGeometry args={[0.72, 0.014, 8, 34]} />
        </mesh>
        <HotspotFloorRing
          radius={1.25}
          color="#7dd3fc"
          hovered={hoveredId === 'c_orb'}
          active={active}
        />
      </group>

      {/* Hotspot 2: Acoustic Sanctuary — Multi-Part Brass Gramophone, Singing Bowls & Wind Chimes */}
      <group
        position={[-4.55, 0, 0.45]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId('c_chimes');
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAction('open_calm_audio');
        }}
      >
        <ContactShadowDisc position={[0, 0.018, 0]} radius={1.08} mat={mats.contactShadowMat} />
        {/* Carved Octagonal Gramophone Pedestal */}
        <mesh position={[0, 0.06, 0]} material={mats.darkTimber} receiveShadow>
          <cylinderGeometry args={[0.56, 0.6, 0.12, 8]} />
        </mesh>
        <mesh position={[0, 0.46, 0]} material={mats.darkTimber} castShadow>
          <cylinderGeometry args={[0.46, 0.5, 0.72, 8]} />
        </mesh>
        <mesh position={[0, 0.84, 0]} material={mats.brass}>
          <cylinderGeometry args={[0.48, 0.48, 0.05, 8]} />
        </mesh>
        {/* Vinyl Turntable & Articulated Tonearm */}
        <mesh position={[-0.08, 0.88, 0.04]} material={mats.stoveIron}>
          <cylinderGeometry args={[0.26, 0.26, 0.025, 22]} />
        </mesh>
        <mesh position={[-0.08, 0.9, 0.04]} material={mats.brass}>
          <cylinderGeometry args={[0.03, 0.03, 0.04, 10]} />
        </mesh>
        {/* Flared Brass Gramophone Horn + Elbow Neck */}
        <group position={[0.16, 1.05, -0.14]} rotation-y={0.45}>
          <mesh position={[0, -0.06, 0]} material={mats.brass}>
            <cylinderGeometry args={[0.04, 0.055, 0.22, 10]} />
          </mesh>
          <mesh position={[-0.14, 0.12, 0.12]} rotation-x={-0.38} rotation-z={0.4} material={mats.brass}>
            <coneGeometry args={[0.29, 0.48, 18, 1, true]} />
          </mesh>
          <mesh position={[-0.28, 0.28, 0.22]} rotation-x={1.19} rotation-y={-0.4} material={mats.brass}>
            <torusGeometry args={[0.29, 0.016, 8, 24]} />
          </mesh>
        </group>
        {/* Tibetan Brass Singing Bowls & Mallet */}
        <mesh position={[0.24, 0.87, 0.2]} geometry={geos.singingBowlGeo} material={mats.brass} scale={0.92} />
        <mesh position={[-0.3, 0.87, 0.28]} geometry={geos.singingBowlGeo} material={mats.bronze} scale={0.62} />
        <mesh position={[0.04, 0.88, 0.36]} rotation-z={Math.PI / 2} rotation-y={0.3} material={mats.darkTimber}>
          <cylinderGeometry args={[0.018, 0.022, 0.24, 8]} />
        </mesh>

        {/* Suspended Overhead 6-Tube Brass Wind Chimes */}
        <group ref={windChimesRef} position={[0, 3.25, 0]}>
          <mesh material={mats.darkTimber}>
            <cylinderGeometry args={[0.34, 0.34, 0.055, 16]} />
          </mesh>
          {[-0.22, -0.13, -0.04, 0.05, 0.14, 0.23].map((cx, i) => (
            <mesh key={`ch_${i}`} position={[cx, -0.48 - (i % 3) * 0.11, (i % 2 === 0 ? 1 : -1) * 0.07]} material={mats.brass}>
              <cylinderGeometry args={[0.024, 0.024, 0.86, 8]} />
            </mesh>
          ))}
          <mesh position={[0, -0.68, 0]} material={mats.darkTimber}>
            <cylinderGeometry args={[0.07, 0.07, 0.03, 12]} />
          </mesh>
          <mesh position={[0, -1.06, 0]} material={mats.lacquerRed}>
            <boxGeometry args={[0.14, 0.24, 0.02]} />
          </mesh>
        </group>
        <HotspotFloorRing
          radius={1.15}
          color="#a5f3fc"
          hovered={hoveredId === 'c_chimes'}
          active={active}
        />
      </group>

      {/* Hotspot 3: Raked Zen Sand Garden + Mossy Boulders + Quilted Grounding Cushions */}
      <group
        position={[4.55, 0, 0.55]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId('c_cushion');
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAction('open_calm_grounding');
        }}
      >
        <ContactShadowDisc position={[0, 0.018, 0]} radius={1.75} mat={mats.contactShadowMat} />
        <mesh position={[0, 0.045, 0]} material={mats.darkTimber} receiveShadow>
          <boxGeometry args={[2.85, 0.09, 2.55]} />
        </mesh>
        <mesh position={[0, 0.098, 0]} rotation-x={-Math.PI / 2} material={mats.zenSandMat} receiveShadow>
          <planeGeometry args={[2.6, 2.3]} />
        </mesh>
        {/* Zen Mossy River Boulders */}
        <mesh position={[0.68, 0.24, -0.55]} scale={[1.25, 0.78, 0.95]} material={mats.stone} castShadow>
          <dodecahedronGeometry args={[0.31, 1]} />
        </mesh>
        <mesh position={[0.32, 0.18, -0.66]} scale={[1.05, 0.72, 0.88]} material={mats.stone}>
          <dodecahedronGeometry args={[0.2, 1]} />
        </mesh>
        <mesh position={[0.82, 0.15, -0.22]} scale={[0.9, 0.65, 0.9]} material={mats.stone}>
          <dodecahedronGeometry args={[0.16, 1]} />
        </mesh>
        {/* Bamboo Sand Rake Resting on Frame Edge */}
        <group position={[-0.85, 0.11, -0.78]} rotation-y={0.42}>
          <mesh rotation-x={Math.PI / 2} material={mats.darkTimber}>
            <cylinderGeometry args={[0.016, 0.016, 0.86, 6]} />
          </mesh>
          <mesh position={[0, 0, 0.42]} material={mats.darkTimber}>
            <boxGeometry args={[0.34, 0.03, 0.03]} />
          </mesh>
        </group>
        {/* Twin Quilted Meditation Cushions & Tea Tray */}
        <mesh position={[-0.58, 0.2, 0.42]} material={mats.cushionSage} castShadow>
          <cylinderGeometry args={[0.48, 0.52, 0.2, 20]} />
        </mesh>
        <mesh position={[0.52, 0.18, 0.52]} material={mats.wineVelvet} castShadow>
          <cylinderGeometry args={[0.38, 0.4, 0.16, 18]} />
        </mesh>
        <mesh position={[0.08, 0.11, 0.48]} material={mats.darkTimber}>
          <boxGeometry args={[0.44, 0.03, 0.34]} />
        </mesh>
        <Suspense fallback={null}>
          <RealCoffeeMug position={[0.08, 0.13, 0.48]} scale={0.04} />
        </Suspense>
        <HotspotFloorRing
          radius={1.48}
          color="#bbf7d0"
          hovered={hoveredId === 'c_cushion'}
          active={active}
        />
      </group>

      {/* Ceramic Botanical Planters at Conservatory Corners */}
      {[-6.5, 6.5].map((px, i) => (
        <group key={`cpl_${i}`} position={[px, 0, -3.7]}>
          <ContactShadowDisc position={[0, 0.018, 0]} radius={0.68} mat={mats.contactShadowMat} />
          <mesh geometry={geos.vaseGeo} material={mats.marble} scale={1.25} castShadow />
          <Suspense fallback={null}>
            <RealBotanicalPlant position={[0, 0.74, 0]} scale={0.95} />
          </Suspense>
        </group>
      ))}

      <AmbientDustMotes
        count={isSoftwareGl ? 18 : 42}
        bounds={[15.2, 4.6, 10.4]}
        origin={[0, 2.2, -0.6]}
        color="#bae6fd"
        active={active}
      />

      <Suspense fallback={null}>
        <RealLantern position={[-7.0, 2.35, 2.2]} scale={0.045} />
        <RealLantern position={[7.0, 2.35, 2.2]} scale={0.045} />
      </Suspense>

      <CutawayCurbThreshold width={17.8} zPos={6.25} trimMat={mats.darkTimber} />
    </group>
  )
);
