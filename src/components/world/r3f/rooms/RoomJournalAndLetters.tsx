import React, { Suspense } from 'react';
import * as THREE from 'three';
import {
  RealWritingDesk,
  RealJournalNotebook,
  RealSheenChair,
  RealReadingLamp,
  RealLantern,
  RealCoffeeMug,
  RealBotanicalPlant,
} from '../ModelAssets';
import {
  AmbientDustMotes,
  BookshelfBooks3D,
  CarvedPictureFrame,
  ContactShadowDisc,
  CutawayCurbThreshold,
  HearthFlameShader,
  HotspotFloorRing,
  InteriorSilkLantern,
  PanoramicVistaBackdrop,
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

export const JournalLibraryRoom: React.FC<
  RoomCommonProps & {
    crystalRef: React.RefObject<THREE.Mesh | null>;
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
    crystalRef,
  }) => (
    <group visible={active}>
      {/* Expansive Polished Timber Library Floor (17.6m x 12.6m) & Woven Wool Rug */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow onClick={onFloorClick}>
        <planeGeometry args={[17.6, 12.6]} />
        <primitive object={mats.timber} attach="material" />
      </mesh>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0.25, 0.015, 0.35]}
        material={mats.rugMat}
        receiveShadow
        onClick={onFloorClick}
      >
        <planeGeometry args={[8.8, 5.9]} />
      </mesh>

      {/* Panoramic Sunlit Valley Vista Outside Grand Cathedral Window */}
      <PanoramicVistaBackdrop texture={vistaTex} radius={20.8} height={11.6} y={3.9} zOffset={3.4} />

      {/* Left & Right Walls (12.6m deep, 5.75m tall) with Wainscoting, Baseboards, Crown Molding & Pilasters */}
      {[-8.65, 8.65].map((wx, sIdx) => (
        <group key={`j_sw_${sIdx}`} position={[wx, 0, 0]}>
          <mesh
            position={[0, 2.88, 0]}
            rotation-y={sIdx === 0 ? Math.PI / 2 : -Math.PI / 2}
            material={mats.warmPlaster}
          >
            <boxGeometry args={[12.6, 5.76, 0.28]} />
          </mesh>
          <mesh position={[sIdx === 0 ? 0.15 : -0.15, 0.6, 0]} material={mats.darkTimber} receiveShadow>
            <boxGeometry args={[0.07, 1.2, 12.5]} />
          </mesh>
          <mesh position={[sIdx === 0 ? 0.18 : -0.18, 1.22, 0]} material={mats.darkTimber}>
            <boxGeometry args={[0.1, 0.08, 12.55]} />
          </mesh>
          <mesh position={[sIdx === 0 ? 0.18 : -0.18, 0.09, 0]} material={mats.darkTimber}>
            <boxGeometry args={[0.11, 0.18, 12.55]} />
          </mesh>
          <mesh position={[sIdx === 0 ? 0.19 : -0.19, 5.66, 0]} material={mats.darkTimber}>
            <boxGeometry args={[0.14, 0.2, 12.55]} />
          </mesh>
          {[-4.4, -1.5, 1.5, 4.4].map((pz, pIdx) => (
            <mesh
              key={`jp_${pIdx}`}
              position={[sIdx === 0 ? 0.16 : -0.16, 2.88, pz]}
              material={mats.darkTimber}
              castShadow
            >
              <boxGeometry args={[0.2, 5.76, 0.24]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Framed Valley Artwork on Right Wall */}
      <CarvedPictureFrame
        position={[8.42, 2.9, -1.6]}
        rotationY={-Math.PI / 2}
        size={[2.1, 1.38]}
        texture={vistaTex}
        mats={mats}
      />
      <CarvedPictureFrame
        position={[8.42, 2.9, 2.8]}
        rotationY={-Math.PI / 2}
        size={[1.65, 1.15]}
        texture={vistaTex}
        mats={mats}
      />

      {/* Back Wall Framing Cathedral Window & Hearth Fireplace Bay (z = -6.15) */}
      <group position={[0, 0, -6.15]}>
        <mesh position={[-6.5, 2.88, 0]} material={mats.warmPlaster}>
          <boxGeometry args={[4.6, 5.76, 0.28]} />
        </mesh>
        <mesh position={[-0.95, 2.88, 0]} material={mats.warmPlaster}>
          <boxGeometry args={[1.1, 5.76, 0.28]} />
        </mesh>
        <mesh position={[7.25, 2.88, 0]} material={mats.warmPlaster}>
          <boxGeometry args={[3.1, 5.76, 0.28]} />
        </mesh>
        <mesh position={[2.65, 0.5, 0]} material={mats.darkTimber} receiveShadow>
          <boxGeometry args={[6.4, 1.0, 0.3]} />
        </mesh>
        <mesh position={[2.65, 5.08, 0]} material={mats.warmPlaster}>
          <boxGeometry args={[6.4, 1.36, 0.28]} />
        </mesh>

        {/* Grand Cathedral Window Frame + Mullions + Stained Glass Transoms */}
        <group position={[2.65, 2.75, 0.05]}>
          <mesh position={[0, -1.72, 0.1]} material={mats.darkTimber} castShadow>
            <boxGeometry args={[6.25, 0.14, 0.38]} />
          </mesh>
          <mesh position={[0, 1.74, 0.08]} material={mats.darkTimber}>
            <boxGeometry args={[6.25, 0.16, 0.32]} />
          </mesh>
          <mesh material={mats.glass}>
            <planeGeometry args={[6.0, 3.4]} />
          </mesh>
          {[-2.96, -1.48, 0, 1.48, 2.96].map((mx, i) => (
            <mesh key={`jwm_${i}`} position={[mx, 0, 0.04]} material={mats.darkTimber}>
              <boxGeometry args={[0.1, 3.4, 0.12]} />
            </mesh>
          ))}
          <mesh position={[0, 0.68, 0.04]} material={mats.darkTimber}>
            <boxGeometry args={[6.0, 0.1, 0.12]} />
          </mesh>
          <mesh position={[0, -0.5, 0.04]} material={mats.darkTimber}>
            <boxGeometry args={[6.0, 0.06, 0.08]} />
          </mesh>
          {[-2.22, -0.74, 0.74, 2.22].map((sx, i) => (
            <mesh key={`jsg_${i}`} position={[sx, 1.2, 0.02]} material={mats.stainedGlass}>
              <planeGeometry args={[1.34, 0.88]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Volumetric Golden Sunbeams Pouring Through Cathedral Window */}
      {[0.7, 2.65, 4.5].map((lx, idx) => (
        <VolumetricLightShaft
          key={`jbeam_${idx}`}
          position={[lx, 2.0, -3.55]}
          rotation={[0.56, 0, 0]}
          size={[1.8, 5.4]}
          color="#fef3c7"
          opacity={0.14}
        />
      ))}

      {/* Exterior Garden Foliage Silhouettes Outside Window */}
      <mesh position={[0.4, 2.05, -7.25]} material={mats.oakFoliage}>
        <planeGeometry args={[3.8, 3.4]} />
      </mesh>
      <mesh position={[5.2, 2.2, -7.35]} material={mats.oakFoliage}>
        <planeGeometry args={[3.8, 3.4]} />
      </mesh>

      {/* Lofty Vaulted Timber Ceiling Trusses, Hanging Hoi An Silk Lanterns & Rose Skylight */}
      <group position={[0, 5.75, -0.9]}>
        <mesh position={[-4.2, 0.82, 0]} rotation-z={-0.24} material={mats.ceiling}>
          <boxGeometry args={[9.2, 0.16, 10.6]} />
        </mesh>
        <mesh position={[4.2, 0.82, 0]} rotation-z={0.24} material={mats.ceiling}>
          <boxGeometry args={[9.2, 0.16, 10.6]} />
        </mesh>
        {[-4.2, -1.4, 1.4, 4.2].map((bz, idx) => (
          <group key={`jraf_${idx}`} position={[0, 0.3, bz]}>
            <mesh position={[-4.0, 0.56, 0]} rotation-z={-0.24} material={mats.darkTimber}>
              <boxGeometry args={[8.8, 0.22, 0.2]} />
            </mesh>
            <mesh position={[4.0, 0.56, 0]} rotation-z={0.24} material={mats.darkTimber}>
              <boxGeometry args={[8.8, 0.22, 0.2]} />
            </mesh>
            <mesh position={[0, -0.1, 0]} material={mats.darkTimber}>
              <boxGeometry args={[14.2, 0.16, 0.18]} />
            </mesh>
          </group>
        ))}
        {/* Rose Skylight */}
        <mesh position={[0, 1.15, -0.5]} rotation-x={Math.PI / 2} material={mats.stainedGlass}>
          <circleGeometry args={[1.35, 32]} />
        </mesh>
        {/* Hanging Hoi An Silk Lanterns */}
        <InteriorSilkLantern position={[-4.4, -0.25, -1.4]} variant="red" mats={mats} />
        <InteriorSilkLantern position={[4.4, -0.25, -1.4]} variant="amber" mats={mats} />
        <InteriorSilkLantern position={[-2.8, -0.25, 1.4]} variant="amber" mats={mats} />
        <InteriorSilkLantern position={[2.8, -0.25, 1.4]} variant="red" mats={mats} />
      </group>

      {/* Massive Sculpted Brick & Stone Hearth Fireplace + Carved Mantelpiece + Artwork */}
      <group position={[-3.6, 0, -4.85]}>
        <ContactShadowDisc position={[0, 0.018, 0.42]} radius={1.95} mat={mats.contactShadowMat} />
        <mesh position={[0, 0.11, 0.42]} material={mats.stone} receiveShadow>
          <boxGeometry args={[3.1, 0.22, 1.85]} />
        </mesh>
        <mesh position={[0, 1.55, 0]} material={mats.brick} castShadow receiveShadow>
          <boxGeometry args={[2.55, 2.9, 1.25]} />
        </mesh>
        <mesh position={[0, 4.35, -0.12]} material={mats.brick} castShadow>
          <boxGeometry args={[1.55, 2.8, 0.96]} />
        </mesh>
        {/* Stone Arch Keystone Frame around Firebox */}
        <mesh position={[-0.82, 0.85, 0.64]} material={mats.stone} castShadow>
          <boxGeometry args={[0.32, 1.3, 0.16]} />
        </mesh>
        <mesh position={[0.82, 0.85, 0.64]} material={mats.stone} castShadow>
          <boxGeometry args={[0.32, 1.3, 0.16]} />
        </mesh>
        <mesh position={[0, 1.48, 0.65]} material={mats.stone} castShadow>
          <boxGeometry args={[1.98, 0.26, 0.18]} />
        </mesh>
        {/* Carved Mantelpiece Shelf, Mantel Clock & Brass Candlesticks */}
        <mesh position={[0, 2.42, 0.28]} material={mats.darkTimber} castShadow>
          <boxGeometry args={[2.9, 0.16, 1.05]} />
        </mesh>
        <mesh position={[-0.96, 2.5, 0.56]} material={mats.brass} geometry={geos.candlestickGeo} />
        <mesh position={[0.96, 2.5, 0.56]} material={mats.brass} geometry={geos.candlestickGeo} />
        <mesh position={[-0.96, 2.94, 0.56]} material={mats.lanternGlow}>
          <sphereGeometry args={[0.044, 8, 8]} />
        </mesh>
        <mesh position={[0.96, 2.94, 0.56]} material={mats.lanternGlow}>
          <sphereGeometry args={[0.044, 8, 8]} />
        </mesh>
        {/* Mantel Brass Clock */}
        <group position={[0, 2.68, 0.56]}>
          <mesh material={mats.darkTimber}>
            <boxGeometry args={[0.42, 0.36, 0.16]} />
          </mesh>
          <mesh position={[0, 0.02, 0.09]} rotation-x={Math.PI / 2} material={mats.brass}>
            <cylinderGeometry args={[0.13, 0.13, 0.03, 18]} />
          </mesh>
          <mesh position={[0, 0.02, 0.11]} material={mats.paperCream}>
            <circleGeometry args={[0.105, 16]} />
          </mesh>
        </group>
        <CarvedPictureFrame
          position={[0, 3.65, 0.42]}
          size={[1.38, 0.92]}
          texture={vistaTex}
          mats={mats}
        />
        {/* Glowing Firebox, Iron Grate, Ember Bed, Stacked Firewood & GLSL Flame */}
        <mesh position={[0, 0.8, 0.62]} material={mats.stoveIron}>
          <boxGeometry args={[1.38, 1.15, 0.08]} />
        </mesh>
        {[-0.45, -0.22, 0, 0.22, 0.45].map((gx, gi) => (
          <mesh key={`fgr_${gi}`} position={[gx, 0.44, 0.78]} material={mats.stoveIron}>
            <boxGeometry args={[0.035, 0.24, 0.035]} />
          </mesh>
        ))}
        <mesh position={[0, 0.36, 0.72]} rotation-x={-Math.PI / 2} material={mats.ember}>
          <circleGeometry args={[0.46, 16]} />
        </mesh>
        <HearthFlameShader position={[0, 0.76, 0.72]} size={[1.12, 0.94]} active={active} tint="#ff7b24" />
        <mesh position={[-0.22, 0.44, 0.73]} rotation-z={0.2} material={mats.darkTimber}>
          <cylinderGeometry args={[0.08, 0.085, 0.72, 8]} />
        </mesh>
        <mesh position={[0.2, 0.44, 0.73]} rotation-z={-0.22} material={mats.darkTimber}>
          <cylinderGeometry args={[0.08, 0.085, 0.72, 8]} />
        </mesh>
      </group>

      {/* Left Wall Towering 3-Bay Walnut Library Bookcase + True 3D Book Rows + Rolling Ladder */}
      <group position={[-8.08, 0, -0.1]} rotation-y={Math.PI / 2}>
        <mesh position={[0, 2.3, -0.14]} material={mats.darkTimber} castShadow>
          <boxGeometry args={[10.4, 4.6, 0.56]} />
        </mesh>
        {/* Top Carved Cornice Crown */}
        <mesh position={[0, 4.64, -0.04]} material={mats.darkTimber} castShadow>
          <boxGeometry args={[10.65, 0.18, 0.72]} />
        </mesh>
        {/* Bay Vertical Dividers */}
        {[-5.1, -1.7, 1.7, 5.1].map((dx, di) => (
          <mesh key={`jbd_${di}`} position={[dx, 2.3, 0.16]} material={mats.darkTimber} castShadow>
            <boxGeometry args={[0.16, 4.5, 0.52]} />
          </mesh>
        ))}
        {[0.55, 1.48, 2.4, 3.32, 4.22].map((sy, idx) => (
          <group key={`j_sh_${idx}`} position={[0, sy, 0.16]}>
            <mesh position={[0, -0.05, 0]} material={mats.darkTimber}>
              <boxGeometry args={[10.1, 0.08, 0.5]} />
            </mesh>
            {idx < 4 && (
              <>
                <BookshelfBooks3D width={3.15} position={[-3.4, -0.01, 0.02]} seed={idx * 5 + 1} mats={mats} />
                <BookshelfBooks3D width={3.15} position={[0, -0.01, 0.02]} seed={idx * 7 + 3} mats={mats} />
                <BookshelfBooks3D width={3.15} position={[3.4, -0.01, 0.02]} seed={idx * 9 + 5} mats={mats} />
              </>
            )}
          </group>
        ))}
        {/* Brass Ladder Rail + Wooden Rolling Ladder */}
        <mesh position={[0, 3.65, 0.44]} rotation-z={Math.PI / 2} material={mats.brass}>
          <cylinderGeometry args={[0.024, 0.024, 10.0, 8]} />
        </mesh>
        <group position={[1.75, 0, 0.58]} rotation-x={-0.16}>
          <mesh position={[-0.26, 1.95, 0]} material={mats.timber}>
            <boxGeometry args={[0.07, 3.9, 0.09]} />
          </mesh>
          <mesh position={[0.26, 1.95, 0]} material={mats.timber}>
            <boxGeometry args={[0.07, 3.9, 0.09]} />
          </mesh>
          {[0.42, 0.94, 1.46, 1.98, 2.5, 3.02, 3.54].map((ry, i) => (
            <mesh key={`lad_${i}`} position={[0, ry, 0]} material={mats.timber}>
              <boxGeometry args={[0.5, 0.045, 0.08]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Left Foreground Corner Nook: Armchair & Pedestal Brass Armillary Globe */}
      <group position={[-5.4, 0, 2.9]}>
        <ContactShadowDisc position={[0, 0.018, 0]} radius={0.95} mat={mats.contactShadowMat} />
        <Suspense fallback={null}>
          <RealSheenChair position={[-0.35, 0, 0.15]} rotationY={Math.PI * 0.72} scale={1.38} />
        </Suspense>
        <mesh position={[0.52, 0.34, -0.15]} material={mats.darkTimber} castShadow>
          <cylinderGeometry args={[0.32, 0.28, 0.68, 16]} />
        </mesh>
        <mesh position={[0.52, 0.7, -0.15]} material={mats.brass}>
          <cylinderGeometry args={[0.34, 0.34, 0.04, 16]} />
        </mesh>
        <mesh position={[0.52, 0.94, -0.15]} material={mats.bronze}>
          <sphereGeometry args={[0.17, 16, 12]} />
        </mesh>
        <mesh position={[0.52, 0.94, -0.15]} rotation-z={0.41} material={mats.brass}>
          <torusGeometry args={[0.22, 0.014, 8, 24]} />
        </mesh>
      </group>

      {/* Right Lounge Alcove: Tufted Velvet Reading Sofa, Throw Pillows & Low Tea Table + Celadon Tea Set */}
      <group position={[5.75, 0, 1.05]} rotation-y={-Math.PI / 2.15}>
        <ContactShadowDisc position={[0, 0.018, 0.32]} radius={1.95} mat={mats.contactShadowMat} />
        <mesh position={[0, 0.3, 0]} material={mats.velvet} castShadow>
          <boxGeometry args={[2.45, 0.4, 1.02]} />
        </mesh>
        <mesh position={[0, 0.74, -0.38]} material={mats.velvet} castShadow>
          <boxGeometry args={[2.45, 0.72, 0.26]} />
        </mesh>
        <mesh position={[-1.12, 0.56, 0]} material={mats.velvet} castShadow>
          <boxGeometry args={[0.24, 0.52, 1.02]} />
        </mesh>
        <mesh position={[1.12, 0.56, 0]} material={mats.velvet} castShadow>
          <boxGeometry args={[0.24, 0.52, 1.02]} />
        </mesh>
        {/* Sofa Cushion Dividers & Throw Pillows */}
        {[-0.65, 0.65].map((px, pi) => (
          <mesh
            key={`spill_${pi}`}
            position={[px, 0.62, -0.14]}
            rotation={[0.22, pi === 0 ? 0.25 : -0.25, pi === 0 ? -0.18 : 0.18]}
            material={pi === 0 ? mats.cushionSage : mats.wineVelvet}
            castShadow
          >
            <boxGeometry args={[0.46, 0.38, 0.14]} />
          </mesh>
        ))}
        {/* Carved Low Tea Table + Serving Tray + Celadon Tea Set */}
        <mesh position={[0, 0.36, 1.18]} material={mats.darkTimber} castShadow>
          <boxGeometry args={[1.38, 0.09, 0.78]} />
        </mesh>
        <mesh position={[0, 0.415, 1.18]} material={mats.timber}>
          <boxGeometry args={[0.88, 0.03, 0.54]} />
        </mesh>
        {[
          [-0.55, 0.88],
          [0.55, 0.88],
          [-0.55, 1.48],
          [0.55, 1.48],
        ].map(([lx, lz], li) => (
          <mesh key={`jtl_${li}`} position={[lx, 0.18, lz]} material={mats.darkTimber}>
            <cylinderGeometry args={[0.045, 0.03, 0.36, 8]} />
          </mesh>
        ))}
        <mesh position={[-0.16, 0.43, 1.16]} geometry={geos.teapotGeo} material={mats.marble} scale={0.84} castShadow />
        <mesh position={[0.24, 0.46, 1.24]} material={mats.marble}>
          <cylinderGeometry args={[0.05, 0.04, 0.08, 12]} />
        </mesh>
        <mesh position={[0.38, 0.46, 1.08]} material={mats.marble}>
          <cylinderGeometry args={[0.05, 0.04, 0.08, 12]} />
        </mesh>
      </group>

      {/* Hotspot 1: Writing Desk & Open Handwritten Journal + Leather Book Stack */}
      <group
        position={[0, 0, 0.2]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId('j_desk');
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAction('open_journal');
        }}
      >
        <ContactShadowDisc position={[0, 0.018, 0]} radius={1.55} mat={mats.contactShadowMat} />
        <Suspense fallback={null}>
          <RealWritingDesk position={[0, 0, 0]} scale={1.24} />
          <RealJournalNotebook position={[-0.24, 0.69, 0.08]} rotationY={-0.14} scale={1.32} />
          <RealReadingLamp position={[0.68, 0.68, -0.18]} scale={0.3} />
          <RealCoffeeMug position={[-0.62, 0.69, -0.14]} scale={0.042} />
        </Suspense>
        <mesh position={[0.18, 0.71, 0.08]} rotation={[-Math.PI / 2, 0, 0.08]} material={mats.journalPageMat}>
          <planeGeometry args={[0.48, 0.35]} />
        </mesh>
        <mesh position={[-0.66, 0.715, 0.2]} rotation-y={0.18} material={mats.lacquerRed}>
          <boxGeometry args={[0.24, 0.045, 0.17]} />
        </mesh>
        <mesh position={[-0.64, 0.76, 0.19]} rotation-y={-0.1} material={mats.velvet}>
          <boxGeometry args={[0.22, 0.045, 0.16]} />
        </mesh>
        <HotspotFloorRing
          radius={1.25}
          color="#f5d07a"
          hovered={hoveredId === 'j_desk'}
          active={active}
        />
      </group>

      {/* Hotspot 2: Fluted Marble Column + Emerald Mood Crystal */}
      <group
        position={[4.85, 0, -2.85]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId('j_crystal');
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAction('open_mood_checkin');
        }}
      >
        <ContactShadowDisc position={[0, 0.018, 0]} radius={0.82} mat={mats.contactShadowMat} />
        <mesh material={mats.marble} geometry={geos.flutedColumnGeo} scale={1.08} castShadow receiveShadow />
        <mesh position={[0, 1.22, 0]} material={mats.brass}>
          <cylinderGeometry args={[0.4, 0.4, 0.07, 18]} />
        </mesh>
        <mesh ref={crystalRef} position={[0, 1.52, 0]} material={mats.crystalEmerald}>
          <octahedronGeometry args={[0.31, 0]} />
        </mesh>
        <HotspotFloorRing
          radius={0.86}
          color="#6ee7b7"
          hovered={hoveredId === 'j_crystal'}
          active={active}
        />
      </group>

      {/* Sculpted Ceramic Vase + Botanical Foliage & GLTF Lounge Props */}
      <group position={[6.85, 0, -4.45]}>
        <ContactShadowDisc position={[0, 0.018, 0]} radius={0.7} mat={mats.contactShadowMat} />
        <mesh material={mats.stone} geometry={geos.vaseGeo} scale={1.25} castShadow />
        <Suspense fallback={null}>
          <RealBotanicalPlant position={[0, 0.76, 0]} scale={0.85} />
        </Suspense>
      </group>

      <ContactShadowDisc position={[1.75, 0.018, 0.45]} radius={0.74} mat={mats.contactShadowMat} />
      <Suspense fallback={null}>
        <RealSheenChair position={[1.75, 0, 0.45]} rotationY={-Math.PI / 3.4} scale={1.45} />
        <RealLantern position={[-6.4, 2.4, -4.8]} scale={0.046} />
        <RealLantern position={[6.4, 2.4, -4.8]} scale={0.046} />
      </Suspense>

      <AmbientDustMotes
        count={isSoftwareGl ? 18 : 42}
        bounds={[14.5, 4.4, 10.2]}
        origin={[0, 2.3, -0.8]}
        color="#fde68a"
        active={active}
      />

      <CutawayCurbThreshold width={17.6} zPos={6.2} trimMat={mats.darkTimber} />
    </group>
  )
);

export const LettersPostRoom: React.FC<RoomCommonProps> = React.memo(
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
  }) => (
    <group visible={active}>
      {/* Expansive Hardwood Postal Hall (17.8m x 12.6m) & Woven Center Rug */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow onClick={onFloorClick}>
        <planeGeometry args={[17.8, 12.6]} />
        <primitive object={mats.timber} attach="material" />
      </mesh>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0.015, 0.2]}
        material={mats.rugMat}
        receiveShadow
        onClick={onFloorClick}
      >
        <planeGeometry args={[8.6, 5.8]} />
      </mesh>

      {/* Twilight Sakura Panorama Outside Veranda Windows */}
      <PanoramicVistaBackdrop texture={vistaTex} radius={20.8} height={11.6} y={3.9} zOffset={3.4} />

      {/* Left & Right Walls with Wainscoting, Baseboards & Crown Trim */}
      {[-8.75, 8.75].map((wx, sIdx) => (
        <group key={`l_sw_${sIdx}`} position={[wx, 0, 0]}>
          <mesh
            position={[0, 2.88, 0]}
            rotation-y={sIdx === 0 ? Math.PI / 2 : -Math.PI / 2}
            material={mats.rosewoodWall}
          >
            <boxGeometry args={[12.6, 5.76, 0.28]} />
          </mesh>
          <mesh position={[sIdx === 0 ? 0.15 : -0.15, 0.6, 0]} material={mats.darkTimber} receiveShadow>
            <boxGeometry args={[0.07, 1.2, 12.5]} />
          </mesh>
          <mesh position={[sIdx === 0 ? 0.18 : -0.18, 1.22, 0]} material={mats.darkTimber}>
            <boxGeometry args={[0.1, 0.08, 12.55]} />
          </mesh>
          <mesh position={[sIdx === 0 ? 0.18 : -0.18, 0.09, 0]} material={mats.darkTimber}>
            <boxGeometry args={[0.11, 0.18, 12.55]} />
          </mesh>
          <mesh position={[sIdx === 0 ? 0.19 : -0.19, 5.66, 0]} material={mats.darkTimber}>
            <boxGeometry args={[0.14, 0.2, 12.55]} />
          </mesh>
          {[-4.2, 0, 4.2].map((pz, pIdx) => (
            <mesh
              key={`lp_${pIdx}`}
              position={[sIdx === 0 ? 0.16 : -0.16, 2.88, pz]}
              material={mats.darkTimber}
              castShadow
            >
              <boxGeometry args={[0.2, 5.76, 0.24]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Framed Sakura Coastal Paintings on Left & Right Walls */}
      <CarvedPictureFrame
        position={[-8.52, 2.95, 1.8]}
        rotationY={Math.PI / 2}
        size={[1.9, 1.28]}
        texture={vistaTex}
        mats={mats}
      />
      <CarvedPictureFrame
        position={[8.52, 2.95, -0.6]}
        rotationY={-Math.PI / 2}
        size={[1.9, 1.28]}
        texture={vistaTex}
        mats={mats}
      />

      {/* Back Wall with Triple French Veranda Windows & Louvered Coastal Sea-Teal Shutters */}
      <group position={[0, 0, -6.15]}>
        <mesh position={[0, 0.5, 0]} material={mats.darkTimber} receiveShadow>
          <boxGeometry args={[17.8, 1.0, 0.3]} />
        </mesh>
        <mesh position={[-7.4, 2.88, 0]} material={mats.rosewoodWall}>
          <boxGeometry args={[3.0, 5.76, 0.28]} />
        </mesh>
        <mesh position={[7.4, 2.88, 0]} material={mats.rosewoodWall}>
          <boxGeometry args={[3.0, 5.76, 0.28]} />
        </mesh>
        <mesh position={[0, 5.14, 0]} material={mats.rosewoodWall}>
          <boxGeometry args={[17.8, 1.24, 0.28]} />
        </mesh>

        {/* Wide Triple Veranda Glass Mullions + Louvered Sea-Teal Shutters */}
        <group position={[0, 2.82, 0.05]}>
          <mesh position={[0, -1.78, 0.1]} material={mats.darkTimber} castShadow>
            <boxGeometry args={[12.0, 0.14, 0.38]} />
          </mesh>
          <mesh position={[0, 1.8, 0.08]} material={mats.darkTimber}>
            <boxGeometry args={[12.0, 0.16, 0.32]} />
          </mesh>
          <mesh material={mats.glass}>
            <planeGeometry args={[11.8, 3.55]} />
          </mesh>
          {[-5.85, -2.95, 0, 2.95, 5.85].map((mx, i) => (
            <mesh key={`lwm_${i}`} position={[mx, 0, 0.04]} material={mats.darkTimber}>
              <boxGeometry args={[0.11, 3.55, 0.12]} />
            </mesh>
          ))}
          <mesh position={[0, 0.56, 0.04]} material={mats.darkTimber}>
            <boxGeometry args={[11.8, 0.1, 0.12]} />
          </mesh>
          {[-6.35, 6.35].map((sx, i) => (
            <group
              key={`l_shut_${i}`}
              position={[sx, 0, 0.14]}
              rotation-y={i === 0 ? 0.24 : -0.24}
            >
              <mesh castShadow>
                <boxGeometry args={[0.84, 3.45, 0.08]} />
                <meshStandardMaterial color="#4b8085" roughness={0.7} />
              </mesh>
              {[-1.1, -0.55, 0, 0.55, 1.1].map((ly, li) => (
                <mesh key={`sl_${li}`} position={[0, ly, 0.045]} rotation-x={0.25}>
                  <boxGeometry args={[0.7, 0.08, 0.03]} />
                  <meshStandardMaterial color="#3b696e" roughness={0.75} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      </group>

      {/* Volumetric Rose-Gold Dusk Light Shafts Through Veranda Windows */}
      {[-2.1, 2.1].map((lx, idx) => (
        <VolumetricLightShaft
          key={`lbeam_${idx}`}
          position={[lx, 2.05, -3.45]}
          rotation={[0.54, 0, 0]}
          size={[2.4, 5.4]}
          color="#fed7aa"
          opacity={0.13}
        />
      ))}

      {/* Lofty Vaulted Ceiling + Hanging Coastal Silk Lanterns */}
      <group position={[0, 5.75, -0.9]}>
        <mesh position={[-4.25, 0.82, 0]} rotation-z={-0.24} material={mats.ceiling}>
          <boxGeometry args={[9.3, 0.16, 10.6]} />
        </mesh>
        <mesh position={[4.25, 0.82, 0]} rotation-z={0.24} material={mats.ceiling}>
          <boxGeometry args={[9.3, 0.16, 10.6]} />
        </mesh>
        {[-3.8, -0.6, 2.6].map((bz, idx) => (
          <mesh key={`lbeam_${idx}`} position={[0, 0.2, bz]} material={mats.darkTimber}>
            <boxGeometry args={[14.4, 0.18, 0.2]} />
          </mesh>
        ))}
        <InteriorSilkLantern position={[-4.1, -0.24, -0.6]} variant="amber" mats={mats} />
        <InteriorSilkLantern position={[4.1, -0.24, -0.6]} variant="red" mats={mats} />
      </group>

      {/* Sculpted Sakura Boughs & Blossom Clusters Outside Veranda */}
      <group position={[-5.8, 2.85, -7.45]}>
        <mesh geometry={geos.sakuraBoughGeo} material={mats.bark} />
        <mesh position={[2.8, 0.9, 0.2]} material={mats.sakuraFoliage}>
          <planeGeometry args={[3.4, 2.6]} />
        </mesh>
      </group>
      <group position={[5.8, 2.95, -7.45]} scale={[-1, 1, 1]}>
        <mesh geometry={geos.sakuraBoughGeo} material={mats.bark} />
        <mesh position={[2.8, 0.9, 0.2]} material={mats.sakuraFoliage}>
          <planeGeometry args={[3.4, 2.6]} />
        </mesh>
      </group>

      {/* Grand 24-Cubby Wooden Sorting Pigeonholes with Recessed Dividers + Vintage Brass Station Clock */}
      <group position={[-3.8, 2.25, -5.7]}>
        <mesh material={mats.darkTimber} castShadow>
          <boxGeometry args={[5.2, 2.35, 0.4]} />
        </mesh>
        {/* Horizontal & Vertical Cubby Grid Dividers */}
        {[-0.38, 0.38].map((hy, hi) => (
          <mesh key={`lch_${hi}`} position={[0, hy, 0.21]} material={mats.timber}>
            <boxGeometry args={[5.05, 0.06, 0.08]} />
          </mesh>
        ))}
        {[-1.58, -0.79, 0, 0.79, 1.58].map((vx, vi) => (
          <mesh key={`lcv_${vi}`} position={[vx, 0, 0.21]} material={mats.timber}>
            <boxGeometry args={[0.06, 2.2, 0.08]} />
          </mesh>
        ))}
        {[-1.98, -1.19, -0.4, 0.4, 1.19, 1.98].map((cx, idx) => (
          <React.Fragment key={`lcub_${idx}`}>
            {[-0.74, 0, 0.74].map((cy, rIdx) => (
              <group key={`lc_${idx}_${rIdx}`} position={[cx, cy, 0.21]}>
                {(idx + rIdx) % 3 === 0 ? (
                  <mesh rotation-x={Math.PI / 2} material={mats.paperCream}>
                    <cylinderGeometry args={[0.08, 0.08, 0.26, 10]} />
                  </mesh>
                ) : (
                  <>
                    <mesh material={mats.paperCream}>
                      <boxGeometry args={[0.52, 0.34, 0.09]} />
                    </mesh>
                    <mesh position={[0, 0, 0.048]} material={mats.lacquerRed}>
                      <cylinderGeometry args={[0.042, 0.042, 0.02, 12]} />
                    </mesh>
                  </>
                )}
              </group>
            ))}
          </React.Fragment>
        ))}
        {/* Vintage Wall Clock Centered Above Pigeonholes */}
        <group position={[0, 1.8, 0.16]}>
          <mesh rotation-x={Math.PI / 2} material={mats.brass}>
            <cylinderGeometry args={[0.48, 0.48, 0.12, 24]} />
          </mesh>
          <mesh position={[0, 0, 0.07]} material={mats.paperCream}>
            <circleGeometry args={[0.4, 24]} />
          </mesh>
          <mesh position={[0, 0.1, 0.08]} material={mats.darkTimber}>
            <boxGeometry args={[0.032, 0.24, 0.02]} />
          </mesh>
          <mesh position={[0.1, 0, 0.08]} material={mats.darkTimber}>
            <boxGeometry args={[0.18, 0.032, 0.02]} />
          </mesh>
        </group>
      </group>

      {/* Hotspot 1: Cedar Postal Writing Desk with Brass Balance Scale, Wax Seals, Quill & Leather Mail Satchel */}
      <group
        position={[-3.55, 0, -0.75]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId('l_desk');
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAction('open_letters');
        }}
      >
        <ContactShadowDisc position={[0, 0.018, 0]} radius={1.6} mat={mats.contactShadowMat} />
        <Suspense fallback={null}>
          <RealWritingDesk position={[0, 0, 0]} scale={1.22} />
          <RealReadingLamp position={[0.66, 0.68, -0.18]} scale={0.28} />
          <RealSheenChair position={[-1.5, 0, 0.05]} rotationY={Math.PI / 2.5} scale={1.38} />
        </Suspense>
        {/* Leather Postal Satchel Resting Against Desk Side */}
        <group position={[0.92, 0.24, 0.28]} rotation-y={-0.38}>
          <mesh material={mats.leatherBrown} castShadow>
            <boxGeometry args={[0.24, 0.44, 0.38]} />
          </mesh>
          <mesh position={[0.08, 0.06, 0]} material={mats.brass}>
            <boxGeometry args={[0.1, 0.07, 0.07]} />
          </mesh>
        </group>
        {/* Sealed Envelope Stack + Brass Stamp */}
        <mesh position={[-0.2, 0.7, 0.1]} rotation-y={0.18} material={mats.paperCream}>
          <boxGeometry args={[0.5, 0.06, 0.34]} />
        </mesh>
        <mesh position={[-0.2, 0.74, 0.1]} material={mats.lacquerRed}>
          <cylinderGeometry args={[0.06, 0.06, 0.025, 14]} />
        </mesh>
        {/* Brass Letter Balance Scale */}
        <group position={[0.42, 0.68, 0.1]}>
          <mesh geometry={geos.candlestickGeo} material={mats.brass} scale={0.78} />
          <mesh position={[0, 0.32, 0]} material={mats.brass}>
            <boxGeometry args={[0.42, 0.024, 0.024]} />
          </mesh>
          <mesh position={[-0.2, 0.24, 0]} material={mats.brass}>
            <cylinderGeometry args={[0.09, 0.055, 0.025, 14]} />
          </mesh>
          <mesh position={[0.2, 0.24, 0]} material={mats.brass}>
            <cylinderGeometry args={[0.09, 0.055, 0.025, 14]} />
          </mesh>
        </group>
        <mesh position={[0.14, 0.72, -0.05]} material={mats.bronze}>
          <cylinderGeometry args={[0.048, 0.058, 0.1, 12]} />
        </mesh>
        <mesh position={[0.2, 0.87, -0.05]} rotation={[0.2, 0, -0.35]} material={mats.paperCream}>
          <coneGeometry args={[0.028, 0.34, 8]} />
        </mesh>
        <HotspotFloorRing
          radius={1.25}
          color="#fdba74"
          hovered={hoveredId === 'l_desk'}
          active={active}
        />
      </group>

      {/* Hotspot 2: Raised Stone Hearth & Sculpted Tripod Bronze Ash Brazier + GLSL Flame */}
      <group
        position={[3.65, 0, -1.15]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId('l_brazier');
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAction('open_letters');
        }}
      >
        <ContactShadowDisc position={[0, 0.018, 0]} radius={1.42} mat={mats.contactShadowMat} />
        <mesh position={[0, 0.09, 0]} material={mats.stone} receiveShadow>
          <cylinderGeometry args={[1.15, 1.26, 0.18, 24]} />
        </mesh>
        {[0, 2.094, 4.188].map((ang, i) => (
          <mesh
            key={`lleg_${i}`}
            position={[Math.cos(ang) * 0.46, 0.34, Math.sin(ang) * 0.46]}
            material={mats.bronze}
            castShadow
          >
            <cylinderGeometry args={[0.072, 0.094, 0.42, 10]} />
          </mesh>
        ))}
        <mesh position={[0, 0.48, 0]} geometry={geos.brazierBowlGeo} material={mats.bronze} scale={1.1} castShadow />
        <mesh position={[0, 0.9, 0]} material={mats.ember}>
          <cylinderGeometry args={[0.5, 0.46, 0.11, 18]} />
        </mesh>
        <HearthFlameShader position={[0, 1.26, 0]} size={[0.76, 0.8]} active={active} tint="#fb923c" />
        <HotspotFloorRing
          radius={1.22}
          color="#fb923c"
          hovered={hoveredId === 'l_brazier'}
          active={active}
        />
      </group>

      {/* Detailed Nautical Brass Telescope on Mahogany Tripod Beside Veranda Window */}
      <group position={[2.95, 0, -4.45]} rotation-y={-0.35}>
        <ContactShadowDisc position={[0, 0.018, 0]} radius={0.62} mat={mats.contactShadowMat} />
        {[0, 2.09, 4.19].map((ang, i) => (
          <mesh
            key={`tleg_${i}`}
            position={[Math.cos(ang) * 0.24, 0.64, Math.sin(ang) * 0.24]}
            rotation={[Math.sin(ang) * 0.25, 0, -Math.cos(ang) * 0.25]}
            material={mats.darkTimber}
          >
            <cylinderGeometry args={[0.028, 0.036, 1.32, 8]} />
          </mesh>
        ))}
        <mesh position={[0, 1.28, 0]} material={mats.brass}>
          <sphereGeometry args={[0.07, 12, 10]} />
        </mesh>
        <mesh position={[0, 1.36, 0]} rotation-x={1.28} material={mats.brass} castShadow>
          <cylinderGeometry args={[0.08, 0.048, 0.96, 16]} />
        </mesh>
        <mesh position={[0, 1.48, -0.4]} rotation-x={1.28} material={mats.brass}>
          <cylinderGeometry args={[0.095, 0.09, 0.16, 16]} />
        </mesh>
      </group>

      {/* Red Lacquer Vintage Pillar Postbox & Tufted Mail Waiting Bench */}
      <group position={[6.75, 0, -3.8]}>
        <ContactShadowDisc position={[0, 0.018, 0]} radius={0.7} mat={mats.contactShadowMat} />
        <mesh position={[0, 0.08, 0]} material={mats.stone}>
          <cylinderGeometry args={[0.42, 0.46, 0.16, 18]} />
        </mesh>
        <mesh position={[0, 0.85, 0]} material={mats.lacquerRed} castShadow>
          <cylinderGeometry args={[0.35, 0.39, 1.54, 20]} />
        </mesh>
        <mesh position={[0, 1.66, 0]} material={mats.lacquerRed} castShadow>
          <sphereGeometry args={[0.36, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, 1.28, 0.34]} material={mats.brass}>
          <boxGeometry args={[0.36, 0.09, 0.06]} />
        </mesh>
        <mesh position={[0, 0.95, 0.35]} material={mats.brass}>
          <boxGeometry args={[0.24, 0.28, 0.03]} />
        </mesh>
      </group>

      <group position={[5.85, 0, 1.85]} rotation-y={-Math.PI / 2.2}>
        <ContactShadowDisc position={[0, 0.018, 0]} radius={1.25} mat={mats.contactShadowMat} />
        <mesh position={[0, 0.48, 0]} material={mats.wineVelvet} castShadow>
          <boxGeometry args={[2.2, 0.2, 0.8]} />
        </mesh>
        {[-0.92, 0.92].map((bx, bi) => (
          <mesh key={`mb_bol_${bi}`} position={[bx, 0.64, 0]} rotation-x={Math.PI / 2} material={mats.leatherBrown} castShadow>
            <cylinderGeometry args={[0.11, 0.11, 0.72, 12]} />
          </mesh>
        ))}
        {[-0.88, 0.88].map((lx, i) => (
          <mesh key={`mb_${i}`} position={[lx, 0.22, 0]} material={mats.darkTimber} castShadow>
            <boxGeometry args={[0.14, 0.44, 0.68]} />
          </mesh>
        ))}
      </group>

      <ContactShadowDisc position={[-6.5, 0.018, -4.1]} radius={0.72} mat={mats.contactShadowMat} />
      <Suspense fallback={null}>
        <RealBotanicalPlant position={[-6.5, 0, -4.1]} scale={0.88} />
        <RealLantern position={[-6.8, 2.5, -5.4]} scale={0.048} />
        <RealLantern position={[6.8, 2.5, -5.4]} scale={0.048} />
      </Suspense>

      <AmbientDustMotes
        count={isSoftwareGl ? 18 : 42}
        bounds={[14.8, 4.4, 10.4]}
        origin={[0, 2.3, -0.8]}
        color="#fbcfe8"
        active={active}
      />

      <CutawayCurbThreshold width={17.8} zPos={6.2} trimMat={mats.darkTimber} />
    </group>
  )
);
