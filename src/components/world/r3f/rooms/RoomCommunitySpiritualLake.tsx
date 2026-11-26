import React, { Suspense } from 'react';
import * as THREE from 'three';
import {
  RealBotanicalPlant,
  RealCoffeeMug,
  RealLantern,
  RealReadingLamp,
  RealSheenChair,
  RealWritingDesk,
} from '../ModelAssets';
import {
  AmbientDustMotes,
  BookshelfBooks3D,
  ContactShadowDisc,
  CutawayCurbThreshold,
  HotspotFloorRing,
  IndoorWaterCausticsPlane,
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

export const CommunityTeaRoom: React.FC<
  RoomCommonProps & {
    teaSteamRef: React.RefObject<THREE.Group | null>;
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
    teaSteamRef,
  }) => (
    <group visible={active}>
      {/* Expansive Tatami Mat Hall (18.2m x 12.8m) + Raised Dark Cedar Engawa Veranda Border */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow onClick={onFloorClick}>
        <planeGeometry args={[18.2, 12.8]} />
        <primitive object={mats.tatamiFloor} attach="material" />
      </mesh>
      <mesh position={[0, 0.04, -5.45]} material={mats.darkTimber} receiveShadow>
        <boxGeometry args={[18.2, 0.08, 1.85]} />
      </mesh>

      {/* Panoramic Golden-Hour Terraced Tea Hills Outside Open Veranda */}
      <PanoramicVistaBackdrop texture={vistaTex} radius={20.8} height={11.6} y={3.9} zOffset={3.4} />

      {/* Left & Right Walls with Detailed Kumiko Shoji Lattice Screens & Tokonoma Scrolls */}
      {[-8.9, 8.9].map((wx, sIdx) => {
        const inward = sIdx === 0 ? 1 : -1;
        return (
          <group key={`cm_sw_${sIdx}`} position={[wx, 0, 0]}>
            <mesh
              position={[0, 2.9, 0]}
              rotation-y={sIdx === 0 ? Math.PI / 2 : -Math.PI / 2}
              material={mats.teaWall}
            >
              <boxGeometry args={[12.8, 5.8, 0.26]} />
            </mesh>
            {/* Dark Cedar Wainscoting & Top Frieze */}
            <mesh position={[inward * 0.14, 0.45, 0]} material={mats.darkTimber}>
              <boxGeometry args={[0.08, 0.9, 12.6]} />
            </mesh>
            {/* Warm Shoji Paper Window */}
            <mesh
              position={[inward * 0.15, 2.45, -0.8]}
              rotation-y={sIdx === 0 ? Math.PI / 2 : -Math.PI / 2}
              material={mats.shojiGlow}
            >
              <planeGeometry args={[7.2, 3.35]} />
            </mesh>
            {/* Kumiko Shoji Vertical Mullions */}
            {[-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6].map((sz, i) => (
              <mesh
                key={`sjv_${i}`}
                position={[inward * 0.17, 2.45, sz - 0.8]}
                material={mats.darkTimber}
              >
                <boxGeometry args={[0.045, 3.4, 0.065]} />
              </mesh>
            ))}
            {/* Kumiko Shoji Horizontal Transom Rails */}
            {[0.82, 1.65, 2.48, 3.32, 4.1].map((sy, i) => (
              <mesh
                key={`sjh_${i}`}
                position={[inward * 0.17, sy, -0.8]}
                material={mats.darkTimber}
              >
                <boxGeometry args={[0.045, 0.06, 7.28]} />
              </mesh>
            ))}
            {/* Tokonoma Calligraphy Scroll + Roller Rods + Ikebana Shelf */}
            <group position={[inward * 0.18, 2.8, 3.85]} rotation-y={sIdx === 0 ? Math.PI / 2 : -Math.PI / 2}>
              <mesh material={mats.scrollMat}>
                <planeGeometry args={[1.15, 2.3]} />
              </mesh>
              <mesh position={[0, 1.17, 0.02]} rotation-z={Math.PI / 2} material={mats.darkTimber}>
                <cylinderGeometry args={[0.032, 0.032, 1.32, 10]} />
              </mesh>
              <mesh position={[0, -1.17, 0.02]} rotation-z={Math.PI / 2} material={mats.darkTimber}>
                <cylinderGeometry args={[0.036, 0.036, 1.34, 10]} />
              </mesh>
            </group>
            <mesh position={[inward * 0.45, 0.92, 3.85]} material={mats.darkTimber} castShadow>
              <boxGeometry args={[0.56, 0.08, 1.4]} />
            </mesh>
            <mesh position={[inward * 0.45, 0.96, 3.85]} geometry={geos.vaseGeo} material={mats.marble} scale={0.55} />
          </group>
        );
      })}

      {/* Back Open Veranda Colonnade + Warm Draped Festoon String Lights */}
      <group position={[0, 0, -6.25]}>
        {[-7.2, -3.6, 0, 3.6, 7.2].map((px, i) => (
          <group key={`cm_col_${i}`} position={[px, 0, 0]}>
            <mesh position={[0, 0.08, 0]} material={mats.stone}>
              <cylinderGeometry args={[0.2, 0.24, 0.16, 12]} />
            </mesh>
            <mesh position={[0, 2.9, 0]} material={mats.darkTimber} castShadow>
              <cylinderGeometry args={[0.15, 0.18, 5.65, 12]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.52, 0]} material={mats.darkTimber}>
          <boxGeometry args={[18.0, 0.1, 0.14]} />
        </mesh>
        <mesh position={[0, 5.55, 0]} material={mats.darkTimber}>
          <boxGeometry args={[18.0, 0.26, 0.28]} />
        </mesh>
        {/* Festoon String Light Cable + 9 Warm Amber Bulbs */}
        <group position={[0, 4.75, 0.24]}>
          <mesh geometry={geos.festoonCableGeo} material={mats.darkTimber} />
          {[-5.6, -4.2, -2.8, -1.4, 0, 1.4, 2.8, 4.2, 5.6].map((bx, i) => {
            const t = (bx + 7.2) / 14.4;
            const sag = Math.sin(t * Math.PI) * 0.74;
            return (
              <mesh key={`fb_${i}`} position={[bx, -sag - 0.08, 0]} material={mats.lanternGlow}>
                <sphereGeometry args={[0.082, 10, 8]} />
              </mesh>
            );
          })}
        </group>
      </group>

      {/* Golden-Hour Veranda Volumetric Light Shafts */}
      {[-3.2, 3.2].map((lx, idx) => (
        <VolumetricLightShaft
          key={`cmbeam_${idx}`}
          position={[lx, 2.25, -3.6]}
          rotation={[0.52, 0, 0]}
          size={[2.6, 5.6]}
          color="#fde68a"
          opacity={0.12}
        />
      ))}

      {/* Vaulted Timber Ceiling + Hanging Silk Lanterns */}
      <group position={[0, 5.8, -1.0]}>
        <mesh position={[-4.5, 0.68, 0]} rotation-z={-0.22} material={mats.ceiling}>
          <boxGeometry args={[9.6, 0.14, 11.0]} />
        </mesh>
        <mesh position={[4.5, 0.68, 0]} rotation-z={0.22} material={mats.ceiling}>
          <boxGeometry args={[9.6, 0.14, 11.0]} />
        </mesh>
        <InteriorSilkLantern position={[-4.5, -0.32, -1.2]} variant="red" mats={mats} />
        <InteriorSilkLantern position={[4.5, -0.32, -1.2]} variant="amber" mats={mats} />
        <InteriorSilkLantern position={[-4.15, -0.32, 2.0]} variant="amber" mats={mats} />
        <InteriorSilkLantern position={[3.15, -0.32, 2.0]} variant="red" mats={mats} />
      </group>

      {/* Hotspot 1: Multi-Panel Tường Giấy Tâm Tình Rack */}
      <group
        position={[-4.15, 0, -1.45]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId('cm_rack');
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAction('open_confessions');
        }}
      >
        <ContactShadowDisc position={[0, 0.018, 0]} radius={1.75} mat={mats.contactShadowMat} />
        {[-1.5, 0, 1.5].map((px, i) => (
          <mesh key={`crp_${i}`} position={[px, 1.38, 0]} material={mats.darkTimber} castShadow>
            <cylinderGeometry args={[0.06, 0.075, 2.75, 10]} />
          </mesh>
        ))}
        <mesh position={[0, 2.7, 0]} material={mats.darkTimber}>
          <boxGeometry args={[3.4, 0.14, 0.14]} />
        </mesh>
        <mesh position={[0, 1.32, 0]} material={mats.darkTimber}>
          <boxGeometry args={[3.2, 0.08, 0.08]} />
        </mesh>
        <mesh position={[0, 0.08, 0]} material={mats.darkTimber}>
          <boxGeometry args={[3.3, 0.16, 0.42]} />
        </mesh>
        {[-1.5, 1.5].map((lx, i) => (
          <mesh key={`crg_${i}`} position={[lx, 2.86, 0]} material={mats.lanternGlow}>
            <sphereGeometry args={[0.12, 10, 8]} />
          </mesh>
        ))}
        {/* 8 Hanging Glowing Confession Paper Notes with Lacquer Pins */}
        {[-1.2, -0.84, -0.48, -0.15, 0.18, 0.52, 0.86, 1.2].map((sx, idx) => (
          <group key={`csc_${idx}`} position={[sx, 1.98 - (idx % 2) * 0.16, 0.05]}>
            <mesh material={mats.paperCream}>
              <boxGeometry args={[0.26, 0.78, 0.025]} />
            </mesh>
            <mesh position={[0, 0.31, 0.018]} material={mats.lacquerRed}>
              <cylinderGeometry args={[0.026, 0.026, 0.018, 8]} />
            </mesh>
            <mesh position={[0, -0.34, 0.016]} material={mats.brass}>
              <sphereGeometry args={[0.02, 8, 6]} />
            </mesh>
          </group>
        ))}
        <HotspotFloorRing
          radius={1.55}
          color="#fcd34d"
          hovered={hoveredId === 'cm_rack'}
          active={active}
        />
      </group>

      {/* Hotspot 2: Carved Low Cedar Chabudai Tea Table + Tetsubin Teapot + Ceramic Incense + Zabuton Cushions */}
      <group
        position={[3.15, 0, -0.55]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId('cm_tea');
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAction('open_stranger_chat');
        }}
      >
        <ContactShadowDisc position={[0, 0.018, 0]} radius={1.9} mat={mats.contactShadowMat} />
        <mesh position={[0, 0.4, 0]} material={mats.darkTimber} castShadow>
          <cylinderGeometry args={[1.02, 1.02, 0.09, 28]} />
        </mesh>
        <mesh position={[0, 0.2, 0]} material={mats.darkTimber}>
          <cylinderGeometry args={[0.24, 0.36, 0.4, 14]} />
        </mesh>
        {/* Bamboo Tea Tray */}
        <mesh position={[0, 0.46, 0]} material={mats.timber}>
          <boxGeometry args={[0.92, 0.03, 0.64]} />
        </mesh>
        {/* Bronze Incense Censer & Ceramic Tea Caddy */}
        <mesh position={[-0.24, 0.51, 0.16]} material={mats.bronze}>
          <cylinderGeometry args={[0.075, 0.06, 0.08, 12]} />
        </mesh>
        <mesh position={[0.26, 0.51, 0.14]} material={mats.lacquerRed}>
          <cylinderGeometry args={[0.065, 0.06, 0.1, 12]} />
        </mesh>
        {/* Sculpted Cast-Iron Tetsubin Teapot & Steam Wisps */}
        <mesh position={[0.04, 0.47, -0.14]} geometry={geos.teapotGeo} material={mats.stoveIron} castShadow />
        <group ref={teaSteamRef} position={[0.04, 0, -0.14]}>
          {[0, 1, 2].map((idx) => (
            <mesh key={`st_${idx}`} position={[0, 0.78 + idx * 0.14, 0]}>
              <sphereGeometry args={[0.038, 6, 6]} />
              <meshBasicMaterial color="#fef3c7" transparent opacity={0.36} depthWrite={false} />
            </mesh>
          ))}
        </group>
        {/* 4 Plush Bordered Zabuton Floor Cushions */}
        {[
          [-1.32, 0.2, mats.wineVelvet],
          [1.32, -0.2, mats.cushionSage],
          [0.2, 1.28, mats.leatherBrown],
          [-0.2, -1.28, mats.cushionSage],
        ].map(([zx, zz, mat], idx) => (
          <group key={`zab_${idx}`} position={[zx as number, 0.09, zz as number]}>
            <mesh material={mat as THREE.Material} castShadow>
              <cylinderGeometry args={[0.38, 0.4, 0.16, 16]} />
            </mesh>
            <mesh position={[0, 0.085, 0]} material={mats.brass}>
              <torusGeometry args={[0.35, 0.012, 6, 16]} />
            </mesh>
          </group>
        ))}
        <Suspense fallback={null}>
          <RealCoffeeMug position={[-0.32, 0.48, -0.06]} scale={0.038} />
          <RealCoffeeMug position={[0.32, 0.48, -0.08]} scale={0.038} />
          <RealLantern position={[0.56, 0.46, 0.34]} scale={0.026} />
        </Suspense>
        <HotspotFloorRing
          radius={1.65}
          color="#fde68a"
          hovered={hoveredId === 'cm_tea'}
          active={active}
        />
      </group>

      {/* Indoor Potted Bamboo Clusters */}
      {[
        [-6.65, 2.15],
        [6.65, -3.7],
      ].map(([bx, bz], i) => (
        <group key={`cm_bam_${i}`} position={[bx, 0, bz]}>
          <ContactShadowDisc position={[0, 0.018, 0]} radius={0.68} mat={mats.contactShadowMat} />
          <mesh geometry={geos.vaseGeo} material={mats.stone} scale={1.15} castShadow />
          <Suspense fallback={null}>
            <RealBotanicalPlant position={[0, 0.68, 0]} scale={0.9} />
          </Suspense>
        </group>
      ))}

      <AmbientDustMotes
        count={isSoftwareGl ? 18 : 40}
        bounds={[15.4, 4.6, 10.2]}
        origin={[0, 2.2, -0.8]}
        color="#fde68a"
        active={active}
      />

      <CutawayCurbThreshold width={18.0} zPos={6.25} trimMat={mats.darkTimber} />
    </group>
  )
);

export const SpiritualSanctumRoom: React.FC<
  RoomCommonProps & {
    armillaryOuterRef: React.RefObject<THREE.Mesh | null>;
    armillaryInnerRef: React.RefObject<THREE.Mesh | null>;
    tarotBackTex: THREE.Texture;
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
    armillaryOuterRef,
    armillaryInnerRef,
  }) => (
    <group visible={active}>
      {/* Expansive Obsidian Pagoda Floor (18.6m x 13.2m) + Large Inlaid Golden Zodiac Mandala Disc */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow onClick={onFloorClick}>
        <planeGeometry args={[18.6, 13.2]} />
        <primitive object={mats.pagodaFloor} attach="material" />
      </mesh>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0.015, -0.45]}
        material={mats.zodiacMat}
        receiveShadow
        onClick={onFloorClick}
      >
        <circleGeometry args={[4.5, 56]} />
      </mesh>

      {/* Panoramic Aurora & Starry Peaks Panorama */}
      <PanoramicVistaBackdrop texture={vistaTex} radius={21.2} height={11.8} y={4.0} zOffset={3.4} />

      {/* Left & Right Sanctum Walls with Gilded-Capital Cinnabar Columns at x = ±9.1 */}
      {[-9.1, 9.1].map((wx, sIdx) => (
        <group key={`sp_sw_${sIdx}`} position={[wx, 0, 0]}>
          <mesh
            position={[0, 3.0, 0]}
            rotation-y={sIdx === 0 ? Math.PI / 2 : -Math.PI / 2}
            material={mats.spiritWall}
          >
            <boxGeometry args={[13.2, 6.0, 0.26]} />
          </mesh>
          {[-4.6, 0, 4.6].map((pz, i) => (
            <group key={`spcol_${i}`} position={[sIdx === 0 ? 0.28 : -0.28, 0, pz]}>
              <mesh position={[0, 0.1, 0]} material={mats.stone}>
                <cylinderGeometry args={[0.24, 0.28, 0.2, 14]} />
              </mesh>
              <mesh position={[0, 3.0, 0]} material={mats.lacquerRed} castShadow>
                <cylinderGeometry args={[0.17, 0.21, 5.8, 14]} />
              </mesh>
              <mesh position={[0, 5.8, 0]} material={mats.brass}>
                <cylinderGeometry args={[0.26, 0.18, 0.22, 14]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* Back Gothic-Celestial Triple Lancet Arch Colonnade (z = -6.45) */}
      <group position={[0, 0, -6.45]}>
        {[-3.3, 0, 3.3].map((ax, i) => (
          <group key={`sp_arch_${i}`} position={[ax, 0, 0]}>
            <mesh geometry={geos.lancetArchGeo} material={mats.spiritWall} receiveShadow />
            <mesh position={[0, 2.95, 0.14]} material={mats.glass}>
              <planeGeometry args={[2.26, 4.9]} />
            </mesh>
            {/* Stained Glass Rose Medallion in Upper Lancet */}
            <mesh position={[0, 4.15, 0.16]} material={mats.stainedGlass}>
              <circleGeometry args={[0.72, 24]} />
            </mesh>
            <mesh position={[0, 4.15, 0.17]} material={mats.brass}>
              <torusGeometry args={[0.73, 0.025, 8, 28]} />
            </mesh>
          </group>
        ))}
        {/* Slender Stone/Gilded Mullion Columns Sealing Arch Seams */}
        {[-4.95, -1.65, 1.65, 4.95].map((mx, mi) => (
          <mesh key={`sp_mcol_${mi}`} position={[mx, 3.0, 0.15]} material={mats.lacquerRed} castShadow>
            <cylinderGeometry args={[0.12, 0.14, 6.0, 12]} />
          </mesh>
        ))}
        {/* Side Infill Wall Panels */}
        <mesh position={[-7.1, 3.0, 0.14]} material={mats.spiritWall}>
          <boxGeometry args={[4.4, 6.0, 0.28]} />
        </mesh>
        <mesh position={[7.1, 3.0, 0.14]} material={mats.spiritWall}>
          <boxGeometry args={[4.4, 6.0, 0.28]} />
        </mesh>
      </group>

      {/* Celestial Indigo-Gold Volumetric Light Shafts Descending onto Zodiac Mandala */}
      <VolumetricLightShaft
        position={[0, 2.9, -3.1]}
        rotation={[0.45, 0, 0]}
        size={[3.1, 6.2]}
        color="#ddd6fe"
        opacity={0.13}
      />
      <VolumetricLightShaft
        position={[-3.3, 2.9, -3.3]}
        rotation={[0.45, 0, 0.14]}
        size={[2.0, 6.0]}
        color="#fde68a"
        opacity={0.11}
      />
      <VolumetricLightShaft
        position={[3.3, 2.9, -3.3]}
        rotation={[0.45, 0, -0.14]}
        size={[2.0, 6.0]}
        color="#fde68a"
        opacity={0.11}
      />

      {/* Vaulted Gilded Celestial Ceiling Ribs & Hanging Silk Lanterns */}
      <group position={[0, 6.0, -1.0]}>
        <mesh position={[-4.5, 0.72, 0]} rotation-z={-0.25} material={mats.spiritWall}>
          <boxGeometry args={[9.8, 0.14, 11.4]} />
        </mesh>
        <mesh position={[4.5, 0.72, 0]} rotation-z={0.25} material={mats.spiritWall}>
          <boxGeometry args={[9.8, 0.14, 11.4]} />
        </mesh>
        {[-3.8, -0.8, 2.2].map((bz, idx) => (
          <mesh key={`sp_rib_${idx}`} position={[0, 0.15, bz]} material={mats.brass}>
            <boxGeometry args={[15.6, 0.12, 0.12]} />
          </mesh>
        ))}
        <InteriorSilkLantern position={[-4.5, -0.35, -0.8]} variant="amber" mats={mats} />
        <InteriorSilkLantern position={[4.5, -0.35, -0.8]} variant="red" mats={mats} />
        <InteriorSilkLantern position={[-4.25, -0.35, 2.2]} variant="red" mats={mats} />
        <InteriorSilkLantern position={[4.25, -0.35, 2.2]} variant="amber" mats={mats} />
      </group>

      {/* Corner Mystic Bookcases with True 3D Leather Grimoires */}
      {[-6.75, 6.75].map((bx, i) => (
        <group key={`sp_bk_${i}`} position={[bx, 0, -4.2]} rotation-y={i === 0 ? 0.55 : -0.55}>
          <ContactShadowDisc position={[0, 0.018, 0]} radius={1.45} mat={mats.contactShadowMat} />
          <mesh position={[0, 1.65, 0]} material={mats.darkTimber} castShadow>
            <boxGeometry args={[2.15, 3.3, 0.5]} />
          </mesh>
          <mesh position={[0, 3.35, 0]} material={mats.brass}>
            <boxGeometry args={[2.25, 0.09, 0.56]} />
          </mesh>
          {[0.38, 1.12, 1.86, 2.6].map((sy, si) => (
            <group key={`sp_bks_${si}`} position={[0, sy, 0.04]}>
              <mesh position={[0, -0.02, 0]} material={mats.darkTimber}>
                <boxGeometry args={[2.0, 0.04, 0.44]} />
              </mesh>
              <BookshelfBooks3D width={1.92} seed={i * 7 + si * 5 + 3} mats={mats} />
            </group>
          ))}
        </group>
      ))}

      {/* Hotspot 1: 3-Tier Marble Dais + Monumental Celestial Brass Armillary Sphere */}
      <group
        position={[0, 0, -2.45]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId('sp_armillary');
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAction('open_spiritual_tuvi');
        }}
      >
        <ContactShadowDisc position={[0, 0.018, 0]} radius={1.65} mat={mats.contactShadowMat} />
        <mesh position={[0, 0.1, 0]} material={mats.stone} receiveShadow>
          <cylinderGeometry args={[1.3, 1.44, 0.2, 26]} />
        </mesh>
        <mesh position={[0, 0.24, 0]} material={mats.stone} receiveShadow>
          <cylinderGeometry args={[1.05, 1.15, 0.1, 24]} />
        </mesh>
        <mesh position={[0, 0.28, 0]} geometry={geos.flutedColumnGeo} material={mats.darkTimber} scale={0.96} castShadow />
        <mesh position={[0, 1.36, 0]} material={mats.brass}>
          <cylinderGeometry args={[0.46, 0.46, 0.07, 18]} />
        </mesh>
        <group position={[0, 2.04, 0]}>
          <mesh rotation-x={Math.PI / 6} material={mats.brass}>
            <torusGeometry args={[0.7, 0.028, 10, 40]} />
          </mesh>
          <mesh rotation-y={Math.PI / 3} material={mats.brass}>
            <torusGeometry args={[0.64, 0.02, 8, 36]} />
          </mesh>
          <mesh ref={armillaryOuterRef} material={mats.brass}>
            <torusGeometry args={[0.58, 0.03, 10, 36]} />
          </mesh>
          <mesh ref={armillaryInnerRef} material={mats.brass}>
            <torusGeometry args={[0.42, 0.024, 10, 32]} />
          </mesh>
          <mesh material={mats.lanternGlow}>
            <sphereGeometry args={[0.14, 16, 16]} />
          </mesh>
        </group>
        <HotspotFloorRing
          radius={1.4}
          color="#ddd6fe"
          hovered={hoveredId === 'sp_armillary'}
          active={active}
        />
      </group>

      {/* Hotspot 2: Octagonal Emerald-Velvet Tarot Sanctuary Table + Gold-Back Cards + Crystal Orb + Candlesticks */}
      <group
        position={[-4.25, 0, 0.35]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId('sp_tarot');
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAction('open_spiritual_tarot');
        }}
      >
        <ContactShadowDisc position={[0, 0.018, 0]} radius={1.25} mat={mats.contactShadowMat} />
        <mesh position={[0, 0.76, 0]} material={mats.velvet} castShadow>
          <cylinderGeometry args={[0.92, 0.92, 0.11, 8]} />
        </mesh>
        <mesh position={[0, 0.81, 0]} rotation-x={Math.PI / 2} material={mats.brass}>
          <torusGeometry args={[0.88, 0.014, 6, 8]} />
        </mesh>
        <mesh position={[0, 0.38, 0]} material={mats.darkTimber}>
          <cylinderGeometry args={[0.17, 0.34, 0.76, 14]} />
        </mesh>
        {/* 7 Fanned Tarot Cards Textured with Custom tarot_card_back Art */}
        {[-0.44, -0.29, -0.14, 0, 0.14, 0.29, 0.44].map((cx, idx) => (
          <mesh
            key={`tc_${idx}`}
            position={[cx, 0.83, Math.abs(idx - 3) * 0.036 + 0.1]}
            rotation={[-Math.PI / 2, 0, (idx - 3) * 0.2]}
            material={mats.tarotBackMat}
          >
            <planeGeometry args={[0.15, 0.24]} />
          </mesh>
        ))}
        {/* Crystal Gazing Orb on Brass Ring Stand + Tall Brass Candlesticks + Grimoire */}
        <mesh position={[0, 0.84, -0.34]} material={mats.brass}>
          <cylinderGeometry args={[0.1, 0.12, 0.05, 14]} />
        </mesh>
        <mesh position={[0, 0.96, -0.34]} material={mats.crystalAqua}>
          <sphereGeometry args={[0.14, 18, 18]} />
        </mesh>
        {[-0.56, 0.56].map((kx, idx) => (
          <group key={`sp_cd_${idx}`} position={[kx, 0.815, -0.28]}>
            <mesh geometry={geos.candlestickGeo} material={mats.brass} scale={0.72} />
            <mesh position={[0, 0.33, 0]} material={mats.lanternGlow}>
              <sphereGeometry args={[0.034, 8, 8]} />
            </mesh>
          </group>
        ))}
        <group position={[-0.54, 0.84, 0.24]} rotation-y={0.45}>
          <mesh material={mats.leatherBrown}>
            <boxGeometry args={[0.24, 0.05, 0.32]} />
          </mesh>
          <mesh position={[0.01, 0, 0]} material={mats.paperCream}>
            <boxGeometry args={[0.21, 0.04, 0.29]} />
          </mesh>
        </group>
        <HotspotFloorRing
          radius={1.25}
          color="#fde68a"
          hovered={hoveredId === 'sp_tarot'}
          active={active}
        />
      </group>

      {/* Hotspot 3: 1:1 Advisor Counsel Nook (Twin Armchairs + Brass Incense Burner + Reading Lamp) */}
      <group
        position={[4.25, 0, 0.45]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId('sp_chair');
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAction('open_spiritual_chairs');
        }}
      >
        <ContactShadowDisc position={[0, 0.018, 0]} radius={1.5} mat={mats.contactShadowMat} />
        <Suspense fallback={null}>
          <RealSheenChair position={[-0.55, 0, -0.28]} rotationY={Math.PI / 4} scale={1.36} />
          <RealSheenChair position={[0.78, 0, 0.32]} rotationY={-Math.PI * 0.65} scale={1.36} />
          <RealReadingLamp position={[0.14, 0.62, -0.4]} scale={0.24} />
        </Suspense>
        <mesh position={[0.14, 0.31, -0.4]} material={mats.darkTimber} castShadow>
          <cylinderGeometry args={[0.38, 0.29, 0.62, 16]} />
        </mesh>
        <mesh position={[0.22, 0.63, -0.2]} geometry={geos.singingBowlGeo} material={mats.bronze} scale={0.72} />
        <HotspotFloorRing
          radius={1.3}
          color="#f5d0fe"
          hovered={hoveredId === 'sp_chair'}
          active={active}
        />
      </group>

      <Suspense fallback={null}>
        <RealLantern position={[-5.5, 2.6, -5.85]} scale={0.048} />
        <RealLantern position={[5.5, 2.6, -5.85]} scale={0.048} />
      </Suspense>

      <AmbientDustMotes
        count={isSoftwareGl ? 20 : 46}
        bounds={[15.8, 5.0, 10.6]}
        origin={[0, 2.4, -0.8]}
        color="#e9d5ff"
        active={active}
      />

      <CutawayCurbThreshold width={18.4} zPos={6.45} trimMat={mats.lacquerRed} />
    </group>
  )
);

export const LakePavilionRoom: React.FC<
  RoomCommonProps & {
    lanternFloatRef: React.RefObject<THREE.Group | null>;
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
    lanternFloatRef,
  }) => (
    <group visible={active}>
      {/* Expansive Timber Thủy Đình Pavilion Deck (17.6m x 12.2m) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0.4]} receiveShadow onClick={onFloorClick}>
        <planeGeometry args={[17.6, 12.2]} />
        <primitive object={mats.timber} attach="material" />
      </mesh>
      <mesh position={[0, -0.11, 0.4]} material={mats.darkTimber}>
        <boxGeometry args={[17.7, 0.22, 12.3]} />
      </mesh>

      {/* Vast Shimmering Moonlit Lake with GLSL Caustics & Panoramic Karst Lantern Vista */}
      <IndoorWaterCausticsPlane
        position={[0, -0.34, -7.2]}
        variant="rect"
        args={[62, 36]}
        shallowHex="#1d5669"
        deepHex="#09212c"
        active={active}
      />
      <PanoramicVistaBackdrop texture={vistaTex} radius={22.5} height={12.2} y={4.1} zOffset={2.4} />

      {/* 16 Drifting Glowing Lotus Lanterns & Lily Pads Across Lake Surface */}
      <group ref={lanternFloatRef} position={[0, -0.32, -7.2]}>
        {[
          [-6.4, 0, -0.9],
          [-4.3, 0, -2.9],
          [-2.0, 0, -1.3],
          [0.3, 0, -3.7],
          [2.6, 0, -1.6],
          [5.1, 0, -3.2],
          [6.9, 0, -1.0],
          [-5.6, 0, -4.8],
          [-2.2, 0, -5.6],
          [1.9, 0, -5.1],
          [5.9, 0, -5.3],
          [-0.5, 0, -2.0],
          [3.8, 0, -4.1],
          [-3.5, 0, -4.2],
          [-7.5, 0, -3.1],
          [7.4, 0, -3.5],
        ].map(([lx, ly, lz], i) => (
          <group key={`fl_${i}`} position={[lx, ly, lz]}>
            <mesh position={[0, 0.02, 0]} geometry={geos.lotusBowlGeo} material={mats.lanternGlow} />
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.42, 0.42, 0.03, 14]} />
              <meshStandardMaterial color="#366242" roughness={0.75} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Detailed Moored Wooden Sampan Boat with Hull Ribs, Arched Bamboo Canopy (Mui Thuyền) & Oar */}
      <group position={[-5.8, -0.22, -7.8]} rotation-y={0.38}>
        <mesh material={mats.darkTimber} castShadow>
          <boxGeometry args={[3.5, 0.3, 0.96]} />
        </mesh>
        {/* Interior Hull Ribs / Thwarts */}
        {[-1.1, -0.45, 0.45, 1.1].map((rx, ri) => (
          <mesh key={`srib_${ri}`} position={[rx, 0.17, 0]} material={mats.timber}>
            <boxGeometry args={[0.1, 0.05, 0.88]} />
          </mesh>
        ))}
        {/* Woven Bamboo Canopy (Mui Thuyền) */}
        <mesh position={[0, 0.42, 0]} rotation-z={Math.PI / 2} material={mats.teaWall} castShadow>
          <cylinderGeometry args={[0.47, 0.47, 1.56, 14, 1, false, 0, Math.PI]} />
        </mesh>
        {[-0.72, 0, 0.72].map((ax, ai) => (
          <mesh key={`smui_${ai}`} position={[ax, 0.42, 0]} rotation-y={Math.PI / 2} material={mats.darkTimber}>
            <torusGeometry args={[0.48, 0.022, 6, 16, Math.PI]} />
          </mesh>
        ))}
        {/* Tapered Bow & Stern */}
        <mesh position={[-1.9, 0.1, 0]} rotation-z={0.35} material={mats.darkTimber}>
          <coneGeometry args={[0.47, 0.88, 6]} />
        </mesh>
        <mesh position={[1.9, 0.1, 0]} rotation-z={-0.35} material={mats.darkTimber}>
          <coneGeometry args={[0.47, 0.88, 6]} />
        </mesh>
        {/* Wooden Oar Resting Across Gunwale */}
        <group position={[0.45, 0.22, 0.42]} rotation-y={0.22} rotation-z={0.08}>
          <mesh rotation-z={Math.PI / 2} material={mats.timber}>
            <cylinderGeometry args={[0.025, 0.025, 2.35, 8]} />
          </mesh>
          <mesh position={[-1.25, 0, 0]} material={mats.timber}>
            <boxGeometry args={[0.52, 0.02, 0.14]} />
          </mesh>
        </group>
        {/* Glowing Bow Lantern */}
        <mesh position={[1.48, 0.38, 0]} material={mats.lanternGlow}>
          <sphereGeometry args={[0.13, 10, 8]} />
        </mesh>
      </group>

      {/* Grand Thủy Đình Cinnabar Pillars, Double-Tiered Roof & 4 Upturned Vietnamese Eaves */}
      {[-7.8, -2.7, 2.7, 7.8].map((px, i) => (
        <group key={`lk_pl_${i}`} position={[px, 0, -5.5]}>
          <mesh position={[0, 0.1, 0]} material={mats.stone}>
            <cylinderGeometry args={[0.24, 0.28, 0.2, 14]} />
          </mesh>
          <mesh position={[0, 2.8, 0]} material={mats.lacquerRed} castShadow>
            <cylinderGeometry args={[0.17, 0.2, 5.4, 14]} />
          </mesh>
          <mesh position={[0, 5.42, 0]} material={mats.brass}>
            <cylinderGeometry args={[0.25, 0.18, 0.16, 14]} />
          </mesh>
        </group>
      ))}
      {[-7.8, 7.8].map((px, i) => (
        <group key={`lk_fpl_${i}`} position={[px, 0, 0.6]}>
          <mesh position={[0, 0.1, 0]} material={mats.stone}>
            <cylinderGeometry args={[0.24, 0.28, 0.2, 14]} />
          </mesh>
          <mesh position={[0, 2.8, 0]} material={mats.lacquerRed} castShadow>
            <cylinderGeometry args={[0.17, 0.2, 5.4, 14]} />
          </mesh>
          <mesh position={[0, 5.42, 0]} material={mats.brass}>
            <cylinderGeometry args={[0.25, 0.18, 0.16, 14]} />
          </mesh>
        </group>
      ))}

      {/* Carved Waterfront Balustrade with Lotus Post Finials */}
      <mesh position={[0, 0.66, -5.65]} material={mats.darkTimber}>
        <boxGeometry args={[17.2, 0.11, 0.15]} />
      </mesh>
      <mesh position={[0, 0.18, -5.65]} material={mats.darkTimber}>
        <boxGeometry args={[17.2, 0.08, 0.12]} />
      </mesh>
      {[-6.6, -5.5, -4.4, -3.3, -2.2, -1.1, 0, 1.1, 2.2, 3.3, 4.4, 5.5, 6.6].map((rx, i) => (
        <mesh key={`lk_rl_${i}`} position={[rx, 0.34, -5.65]} material={mats.darkTimber}>
          <boxGeometry args={[0.085, 0.66, 0.085]} />
        </mesh>
      ))}

      {/* Tiered Roof Beams + 4 Upturned Corner Roof Eaves + Hanging Silk Lanterns */}
      <mesh position={[0, 5.48, -5.5]} material={mats.darkTimber}>
        <boxGeometry args={[17.6, 0.28, 0.34]} />
      </mesh>
      <mesh position={[0, 5.48, 0.6]} material={mats.darkTimber}>
        <boxGeometry args={[17.6, 0.24, 0.28]} />
      </mesh>
      <mesh position={[-7.8, 5.48, -5.5]} geometry={geos.curvedEaveGeo} material={mats.lacquerRed} scale={[-1, 1, 1]} />
      <mesh position={[7.8, 5.48, -5.5]} geometry={geos.curvedEaveGeo} material={mats.lacquerRed} />
      <mesh position={[-7.8, 5.48, 0.6]} geometry={geos.curvedEaveGeo} material={mats.lacquerRed} scale={[-1, 1, 1]} />
      <mesh position={[7.8, 5.48, 0.6]} geometry={geos.curvedEaveGeo} material={mats.lacquerRed} />
      <mesh position={[0, 6.02, -2.45]} material={mats.ceiling}>
        <boxGeometry args={[18.2, 0.2, 7.2]} />
      </mesh>
      <InteriorSilkLantern position={[-5.2, 5.0, -5.35]} variant="red" mats={mats} />
      <InteriorSilkLantern position={[-1.6, 5.0, -5.35]} variant="amber" mats={mats} />
      <InteriorSilkLantern position={[1.6, 5.0, -5.35]} variant="amber" mats={mats} />
      <InteriorSilkLantern position={[5.2, 5.0, -5.35]} variant="red" mats={mats} />

      <VolumetricLightShaft
        position={[0, 2.75, -4.2]}
        rotation={[0.45, 0, 0]}
        size={[5.6, 5.6]}
        color="#fde68a"
        opacity={0.11}
      />

      {/* Hotspot 1: Woven Lotus Lantern Release Basket & Kneeling Pier Mat */}
      <group
        position={[-3.25, 0, -1.85]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId('lk_basket');
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAction('open_float_lantern');
        }}
      >
        <ContactShadowDisc position={[0, 0.018, 0]} radius={0.96} mat={mats.contactShadowMat} />
        <mesh position={[0, 0.32, 0]} material={mats.darkTimber} castShadow>
          <cylinderGeometry args={[0.62, 0.48, 0.64, 18]} />
        </mesh>
        <mesh position={[0, 0.63, 0]} rotation-x={Math.PI / 2} material={mats.brass}>
          <torusGeometry args={[0.61, 0.018, 8, 22]} />
        </mesh>
        <mesh position={[-0.2, 0.66, 0.12]} geometry={geos.lotusBowlGeo} material={mats.lanternGlow} scale={0.9} />
        <mesh position={[0.2, 0.66, -0.1]} geometry={geos.lotusBowlGeo} material={mats.lanternGlow} scale={0.9} />
        <mesh position={[0.04, 0.66, 0.24]} geometry={geos.lotusBowlGeo} material={mats.redSilkGlow} scale={0.78} />
        {/* Kneeling Pier Cushion Beside Basket */}
        <mesh position={[0.85, 0.06, 0.42]} material={mats.cushionSage} castShadow>
          <cylinderGeometry args={[0.36, 0.38, 0.12, 16]} />
        </mesh>
        <HotspotFloorRing
          radius={1.2}
          color="#fde68a"
          hovered={hoveredId === 'lk_basket'}
          active={active}
        />
      </group>

      {/* Hotspot 2: Carved Gift-Lantern Wrapping Desk & Lakeside Armchair */}
      <group
        position={[3.75, 0, -0.55]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId('lk_gift');
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          e.stopPropagation();
          onTriggerAction('open_send_gift');
        }}
      >
        <ContactShadowDisc position={[0, 0.018, 0]} radius={1.45} mat={mats.contactShadowMat} />
        <ContactShadowDisc position={[1.55, 0.018, 1.7]} radius={0.76} mat={mats.contactShadowMat} />
        <Suspense fallback={null}>
          <RealWritingDesk position={[0, 0, 0]} rotationY={-0.35} scale={1.16} />
          <RealLantern position={[0.14, 0.68, 0]} scale={0.04} />
          <RealSheenChair position={[1.55, 0, 1.7]} rotationY={-Math.PI / 1.4} scale={1.34} />
        </Suspense>
        <mesh position={[-0.28, 0.69, 0.1]} geometry={geos.lotusBowlGeo} material={mats.lanternGlow} scale={0.88} />
        {/* Silk Wrapping Ribbon Spools */}
        <mesh position={[0.42, 0.72, -0.12]} material={mats.lacquerRed}>
          <cylinderGeometry args={[0.055, 0.055, 0.08, 12]} />
        </mesh>
        <mesh position={[0.56, 0.72, -0.06]} material={mats.brass}>
          <cylinderGeometry args={[0.048, 0.048, 0.08, 12]} />
        </mesh>
        <HotspotFloorRing
          radius={1.25}
          color="#fdba74"
          hovered={hoveredId === 'lk_gift'}
          active={active}
        />
      </group>

      <Suspense fallback={null}>
        <RealLantern position={[-7.0, 2.6, -5.2]} scale={0.05} />
        <RealLantern position={[7.0, 2.6, -5.2]} scale={0.05} />
      </Suspense>

      <AmbientDustMotes
        count={isSoftwareGl ? 20 : 48}
        bounds={[16.2, 4.6, 11.4]}
        origin={[0, 2.0, -2.5]}
        color="#fde68a"
        active={active}
      />

      <CutawayCurbThreshold width={17.6} zPos={6.4} trimMat={mats.darkTimber} />
    </group>
  )
);
