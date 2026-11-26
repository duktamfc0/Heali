import React, { useRef, useState, useCallback, useEffect, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Sparkles as DreiSparkles } from '@react-three/drei';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FloatingIslandsWorld } from './FloatingIslandsWorld';
import { SculptedTerrain, groundHeightAt } from './R3FTerrain';
import { ReflectiveLake } from './R3FLake';
import {
  StorybookCottage,
  CozyGardenArmchair,
  TerracottaCactusPot,
  VintageLampPost,
  ConfessionGardenPavilion,
  StrangerTeaGazebo,
  SpiritualPavilion,
} from './R3FCottages';
import {
  BotanicalTreesRing,
  GreatWishTreeR3F,
  WaterLilyR3F,
  GardenButterflies,
  GardenShrubsAndBenches,
  SoaringWhiteCranes,
  liveAvatarWorldPos,
} from './R3FNature';
import {
  MienQueCountryside,
  MienNuiHighlands,
  MienBienCoastalBay,
  VietnamesePeacefulEffects,
} from './R3FVillageRegions';
import { computeTargetAtmosphere, type BlendedAtmosphere } from './zoneAtmosphere';
import { R3FRoomStage } from './R3FRoomStage';
import {
  DonghuaPostProcessing,
  DonghuaSeaOfClouds,
  FloatingSkyLanterns,
  DriftingBlossomPetals,
  CelestialGodRays,
  TravelerFootstepTrails,
  WaterfallMistPlumes,
} from './DonghuaPostFX';
import {
  ROOM_METADATA,
  liveSceneActivity,
  type ActiveRoomHotspot,
  type RoomActionId,
  type RoomLocationId,
  type VietnameseRegionId,
} from './roomTypes';
import {
  ControllableAvatarR3F,
  StylizedTravelerCharacter,
  resolveAvatarCollision,
} from './R3FAvatar';
import {
  SANCTUARY_ZONES,
  VIETNAMESE_REGION_PRESETS,
  WORLD_BRIDGES,
  walkableSurfaceHeightAt,
} from './worldLayout';
import { WorldHUD } from '../WorldHUD';
import type { WorldZone } from '../WorldEnvironment';
import type { WeatherMode } from '../DynamicWeatherOverlay';
import { soundEngine } from '../../../services/soundEngine';
import {
  MessageCircle,
  X,
  DoorOpen,
  Compass,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  LayoutGrid,
  Eye,
  RotateCcw,
} from 'lucide-react';

export interface R3FSceneProps {
  weatherMode?: WeatherMode;
  onChangeWeatherMode?: (mode: WeatherMode) => void;
  requestedRoom?: { room: RoomLocationId; seq: number } | null;
  requestedRegion?: { region: VietnameseRegionId; seq: number } | null;
  fullViewport?: boolean;
  isAudioBarVisible?: boolean;
  isDrawerOpen?: boolean;
  onLocationChange?: (location: RoomLocationId) => void;
  onInteriorChange?: (isInside: boolean) => void;
  onSelectZone: (zoneId: WorldZone['id']) => void;
  onTriggerAction: (action: RoomActionId) => void;
  onOpenFloatModal: () => void;
  onOpenAllFeatures?: () => void;
}

interface SoulWhisper {
  name: string;
  avatarRole: string;
  quote: string;
  x: number;
  z: number;
  robeColor: number;
}

const AMBIENT_SOULS: SoulWhisper[] = [
  {
    name: 'Tâm Hồn Lặng Lẽ',
    avatarRole: 'Bên bến gỗ Hồ Hoa Đăng',
    quote: 'Mỗi chiếc đèn hoa đăng trôi đi đều nhẹ nhàng mang theo một nỗi niềm đã sẵn sàng được buông xuống...',
    x: 2.8,
    z: 19.6,
    robeColor: 0x2d7a58,
  },
  {
    name: 'Bạn Lữ Hành Xa Xứ',
    avatarRole: 'Dưới cội cây ước nguyện',
    quote: 'Đừng vội thúc ép bản thân phải lành lặn ngay hôm nay. Cho phép mình được ngồi nghỉ một chút bên mặt hồ bình yên.',
    x: -24.5,
    z: 24.8,
    robeColor: 0xb86642,
  },
  {
    name: 'Người Pha Trà Bên Suối',
    avatarRole: 'Trên cầu gỗ qua suối nhỏ',
    quote: 'Tiếng nước chảy qua khe đá luôn nhắc chúng ta rằng mọi cảm xúc nặng nề rồi cũng sẽ trôi qua.',
    x: 21.5,
    z: 4.8,
    robeColor: 0xc79238,
  },
];

const TELEPORT_DOORSTEPS: Partial<Record<WorldZone['id'], { x: number; z: number }>> = {
  journal: { x: 0, z: 0.6 },
  lake: { x: 0, z: 22.8 },
  community: { x: -29.2, z: -1.4 },
  wishes: { x: -24.8, z: 24.2 },
  spiritual_room: { x: -16.0, z: -30.2 },
  stranger_chat: { x: 41.2, z: -21.2 },
  letters: { x: 37.2, z: 11.4 },
  rain_room: { x: 24.0, z: 30.2 },
};

function mapZoneIdToRoom(zoneId: WorldZone['id']): RoomLocationId {
  switch (zoneId) {
    case 'journal':
      return 'journal';
    case 'letters':
      return 'letters';
    case 'wishes':
    case 'personal_garden':
      return 'wishes';
    case 'rain_room':
      return 'calm';
    case 'community':
    case 'stranger_chat':
    case 'listening_alcove':
      return 'community';
    case 'spiritual_room':
      return 'spiritual_room';
    case 'lake':
      return 'lake';
    default:
      return 'outdoor';
  }
}

function isSoftwareRenderer(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return false;
    const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
    return /SwiftShader|llvmpipe|Software|Microsoft Basic Render/i.test(renderer);
  } catch {
    return false;
  }
}

const DynamicSkyDome: React.FC<{
  weatherMode: WeatherMode;
  hemiLightRef: React.RefObject<THREE.HemisphereLight | null>;
  keyLightRef: React.RefObject<THREE.DirectionalLight | null>;
}> = ({ weatherMode, hemiLightRef, keyLightRef }) => {
  const { scene } = useThree();

  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color('#4a86b8') },
          uHorizon: { value: new THREE.Color('#ddf0e4') },
          uSunColor: { value: new THREE.Color('#fff5d6') },
          uSunDir: { value: new THREE.Vector3(-0.6, 0.35, -0.7).normalize() },
          uSunGlow: { value: 0.78 },
          uTime: { value: 0 },
        },
        vertexShader: `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * viewMatrix * worldPos;
          }
        `,
        fragmentShader: `
          uniform vec3 uTop;
          uniform vec3 uHorizon;
          uniform vec3 uSunColor;
          uniform vec3 uSunDir;
          uniform float uSunGlow;
          uniform float uTime;
          varying vec3 vDir;

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
            float a = 0.54;
            for (int i = 0; i < 4; i++) {
              v += a * noise(p);
              p = p * 2.04 + vec2(2.3, 5.7);
              a *= 0.5;
            }
            return v;
          }

          void main() {
            float elev = clamp(vDir.y, -0.2, 1.0);
            float t = smoothstep(-0.08, 0.56, elev);
            vec3 skyCol = mix(uHorizon, uTop, t);

            vec3 normDir = normalize(vDir);
            vec3 normSun = normalize(uSunDir);
            float sunDot = max(0.0, dot(normDir, normSun));

            // Warm sunlit atmospheric scatter near horizon toward the sun
            float horizonBand = exp(-abs(elev) * 6.5);
            skyCol += uSunColor * horizonBand * (0.16 + 0.34 * pow(sunDot, 3.0)) * uSunGlow;

            if (elev > 0.015) {
              vec2 cloudUv = vDir.xz / (elev + 0.22) * 1.15 + vec2(uTime * 0.008, uTime * 0.0035);
              float nBase = fbm(cloudUv * 1.85);
              float nDetail = fbm(cloudUv * 4.4 - vec2(uTime * 0.005, 1.7));
              float cloud = smoothstep(0.46, 0.84, nBase * 0.68 + nDetail * 0.32);
              float silverRim = smoothstep(0.44, 0.72, nBase) * pow(sunDot, 5.0);
              float horizonFade = smoothstep(0.015, 0.16, elev) * (1.0 - smoothstep(0.48, 0.9, elev));
              vec3 cloudBase = mix(uTop * 0.7 + vec3(0.32), vec3(0.99, 0.99, 1.0), smoothstep(0.48, 0.82, nBase));
              vec3 cloudColor = mix(cloudBase, uSunColor * 1.08, 0.24 + silverRim * 0.55);
              skyCol = mix(skyCol, cloudColor, cloud * 0.62 * horizonFade);
            }

            float sunDisc = smoothstep(0.9965, 0.9992, sunDot) * 1.4;
            float halo = pow(sunDot, 5.0) * 0.26 + pow(sunDot, 18.0) * 0.38;
            skyCol += uSunColor * (halo + sunDisc) * uSunGlow;

            gl_FragColor = vec4(skyCol, 1.0);
          }
        `,
      }),
    []
  );

  useEffect(() => () => skyMat.dispose(), [skyMat]);

  const targetAtmos = useMemo<BlendedAtmosphere>(
    () => ({
      skyTop: new THREE.Color('#4a86b8'),
      skyHorizon: new THREE.Color('#ddf0e4'),
      sunColor: new THREE.Color('#fff5d6'),
      sunGlow: 0.78,
      sunDir: new THREE.Vector3(-0.6, 0.35, -0.7),
      fogColor: new THREE.Color('#d2e6d9'),
      fogDensity: 0.0036,
      hemiSky: new THREE.Color('#e6f3f8'),
      hemiGround: new THREE.Color('#5a6b38'),
      hemiIntensity: 1.12,
      keyColor: new THREE.Color('#fff5de'),
      keyIntensity: 1.65,
    }),
    []
  );

  useFrame((state, delta) => {
    if (!liveSceneActivity.isOutdoor) return;
    const dt = Math.min(0.08, delta);
    const blend = 1 - Math.exp(-2.1 * dt);

    computeTargetAtmosphere(liveAvatarWorldPos.x, liveAvatarWorldPos.z, weatherMode, targetAtmos);

    skyMat.uniforms.uTime.value = state.clock.getElapsedTime();
    (skyMat.uniforms.uTop.value as THREE.Color).lerp(targetAtmos.skyTop, blend);
    (skyMat.uniforms.uHorizon.value as THREE.Color).lerp(targetAtmos.skyHorizon, blend);
    (skyMat.uniforms.uSunColor.value as THREE.Color).lerp(targetAtmos.sunColor, blend);
    (skyMat.uniforms.uSunDir.value as THREE.Vector3).lerp(targetAtmos.sunDir, blend).normalize();
    skyMat.uniforms.uSunGlow.value = THREE.MathUtils.damp(
      skyMat.uniforms.uSunGlow.value,
      targetAtmos.sunGlow,
      2.2,
      dt
    );

    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.lerp(targetAtmos.fogColor, blend);
      scene.fog.density = THREE.MathUtils.damp(scene.fog.density, targetAtmos.fogDensity, 2.2, dt);
    }

    if (hemiLightRef.current) {
      hemiLightRef.current.color.lerp(targetAtmos.hemiSky, blend);
      hemiLightRef.current.groundColor.lerp(targetAtmos.hemiGround, blend);
      hemiLightRef.current.intensity = THREE.MathUtils.damp(
        hemiLightRef.current.intensity,
        targetAtmos.hemiIntensity,
        2.2,
        dt
      );
    }

    if (keyLightRef.current) {
      keyLightRef.current.color.lerp(targetAtmos.keyColor, blend);
      keyLightRef.current.intensity = THREE.MathUtils.damp(
        keyLightRef.current.intensity,
        targetAtmos.keyIntensity,
        2.2,
        dt
      );
    }
  });

  return (
    <mesh material={skyMat}>
      <sphereGeometry args={[240, 36, 24]} />
    </mesh>
  );
};

const SceneAtmosphereController: React.FC<{
  activeLocation: RoomLocationId;
  weatherMode: WeatherMode;
}> = ({ activeLocation, weatherMode }) => {
  const { scene, gl } = useThree();
  const roomBgRef = useRef(new THREE.Color('#1f1712'));
  const sharedFogRef = useRef<THREE.FogExp2 | null>(null);

  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const roomEnv = new RoomEnvironment();
    const envTex = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    roomEnv.dispose();
    scene.environment = envTex;
    scene.environmentIntensity = 0.42;
    return () => {
      scene.environment = null;
      envTex.dispose();
      pmremGenerator.dispose();
    };
  }, [gl, scene]);

  useEffect(() => {
    if (!sharedFogRef.current) {
      sharedFogRef.current = new THREE.FogExp2(0xd2e6d9, 0.0036);
      scene.fog = sharedFogRef.current;
    }

    if (activeLocation !== 'outdoor') {
      const meta = ROOM_METADATA[activeLocation];
      roomBgRef.current.set(meta.bgHex);
      scene.background = roomBgRef.current;
      scene.environmentIntensity = 0.22;
      sharedFogRef.current.color.set(meta.fogHex);
      sharedFogRef.current.density = 0.016;
      return;
    }

    scene.background = null;
    scene.environmentIntensity = 0.42;
    sharedFogRef.current.color.setHex(0xd2e6d9);
    sharedFogRef.current.density = 0.0036;
  }, [activeLocation, weatherMode, scene]);

  return null;
};

const WorldContent: React.FC<{
  isSoftwareGl: boolean;
  weatherMode: WeatherMode;
  robeColor: number;
  cameraMode: 'follow' | 'isometric' | 'cinematic';
  cameraZoom: number;
  cameraYawRef: React.MutableRefObject<number>;
  cameraPitchRef: React.MutableRefObject<number>;
  dragDeltaRef: React.MutableRefObject<number>;
  keyboardKeysRef: React.MutableRefObject<{ [key: string]: boolean }>;
  joystickVectorRef: React.MutableRefObject<{ dx: number; dy: number }>;
  clickTarget: THREE.Vector3 | null;
  teleportTarget: { x: number; z: number; seq: number } | null;
  onClearClickTarget: () => void;
  onSetClickTarget: (pt: THREE.Vector3) => void;
  onNearbyZoneChange: (zone: WorldZone | null) => void;
  onSelectWhisper: (soul: SoulWhisper) => void;
  onInteractZone: (zone: WorldZone) => void;
  onEnterRoom: (room: RoomLocationId) => void;
  avatarPosRef: React.MutableRefObject<THREE.Vector3>;
}> = ({
  isSoftwareGl,
  weatherMode,
  robeColor,
  cameraMode,
  cameraZoom,
  cameraYawRef,
  cameraPitchRef,
  dragDeltaRef,
  keyboardKeysRef,
  joystickVectorRef,
  clickTarget,
  teleportTarget,
  onClearClickTarget,
  onSetClickTarget,
  onNearbyZoneChange,
  onSelectWhisper,
  onInteractZone,
  onEnterRoom,
  avatarPosRef,
}) => {
  const isFireflies = weatherMode === 'fireflies';
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);

  return (
    <>
      <DynamicSkyDome
        weatherMode={weatherMode}
        hemiLightRef={hemiLightRef}
        keyLightRef={keyLightRef}
      />

      <hemisphereLight
        ref={hemiLightRef}
        args={[0xe6f3f8, 0x5a6b38, 1.12]}
        position={[0, 50, 0]}
      />

      <directionalLight
        ref={keyLightRef}
        position={[-34, 48, 36]}
        intensity={1.65}
        color="#fff5de"
        castShadow={!isSoftwareGl}
        shadow-mapSize={isSoftwareGl ? [512, 512] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
      >
        <orthographicCamera attach="shadow-camera" args={[-62, 62, 62, -62, 2.0, 150]} />
      </directionalLight>

      <directionalLight position={[32, 24, -36]} intensity={0.45} color="#cfe8f7" />

      <DreiSparkles
        count={isSoftwareGl ? 36 : isFireflies ? 120 : 60}
        scale={[75, 8, 75]}
        position={[0, 3.2, 6]}
        size={isFireflies ? 3.2 : 2.1}
        speed={0.25}
        opacity={isFireflies ? 0.82 : 0.48}
        color={isFireflies ? '#fde047' : '#fef9c3'}
      />

      <group
        onClick={(e) => {
          if (dragDeltaRef.current > 8) return;
          e.stopPropagation();
          if (e.point.y >= -0.2 && e.point.y <= 5.5) {
            const resolved = resolveAvatarCollision(
              e.point.x,
              e.point.z,
              avatarPosRef.current.x,
              avatarPosRef.current.z
            );
            onSetClickTarget(new THREE.Vector3(resolved.x, 0, resolved.z));
          }
        }}
      >
        <SculptedTerrain isSoftwareGl={isSoftwareGl} />
      </group>

      <ReflectiveLake onSelectLantern={() => onEnterRoom('lake')} />
      <WaterLilyR3F position={[-9.5, 0.05, 31.2]} scale={1.1} />
      <WaterLilyR3F position={[8.6, 0.05, 30.8]} scale={1.0} />
      <WaterLilyR3F position={[-4.8, 0.05, 39.2]} scale={1.15} />
      <WaterLilyR3F position={[-11.8, 0.05, 25.8]} scale={0.95} />
      <WaterLilyR3F position={[5.2, 0.05, 27.6]} scale={0.9} />

      <BotanicalTreesRing />
      <SoaringWhiteCranes />
      <GardenShrubsAndBenches />
      <GardenButterflies />

      {/* Donghua Atmospheric Cloud Sea, God Rays, Waterfall Mist, Sky Lanterns, Blossoms & Lotus Footsteps */}
      <DonghuaSeaOfClouds />
      <CelestialGodRays isSoftwareGl={isSoftwareGl} />
      <WaterfallMistPlumes isSoftwareGl={isSoftwareGl} />
      <FloatingSkyLanterns isSoftwareGl={isSoftwareGl} />
      <DriftingBlossomPetals isSoftwareGl={isSoftwareGl} />
      <TravelerFootstepTrails isSoftwareGl={isSoftwareGl} />

      {/* Floating Sky-Island Underbelly, Edge-Plunging Waterfalls, Vines & Satellite Sky Islands */}
      <FloatingIslandsWorld isSoftwareGl={isSoftwareGl} />

      {/* Vietnamese Cultural Landscapes: Miền Quê, Miền Núi, Miền Biển, Yên Bình */}
      <MienQueCountryside isSoftwareGl={isSoftwareGl} />
      <MienNuiHighlands />
      <MienBienCoastalBay isSoftwareGl={isSoftwareGl} />
      <VietnamesePeacefulEffects />

      {/* Cottages & Sanctuary Pavilions Across the Valley */}
      <StorybookCottage
        position={[0, groundHeightAt(0, -4), -4]}
        rotationY={0.08}
        type="journal"
        labelTitle="Nhà nhật ký"
        labelSubtitle="Vào phòng 3D"
        onLabelClick={() => onInteractZone(SANCTUARY_ZONES[0])}
      />
      <CozyGardenArmchair position={[-3.2, groundHeightAt(-3.2, -1.6), -1.6]} rotationY={0.5} />
      <TerracottaCactusPot position={[-2.1, groundHeightAt(-2.1, -1.1), -1.1]} />
      <VintageLampPost position={[2.4, groundHeightAt(2.4, -0.5), -0.5]} />

      <ConfessionGardenPavilion
        position={[-32, groundHeightAt(-32, -2), -2]}
        onLabelClick={() => onInteractZone(SANCTUARY_ZONES[2])}
      />
      <VintageLampPost position={[-28.2, groundHeightAt(-28.2, 0.4), 0.4]} />

      <GreatWishTreeR3F
        position={[-28, groundHeightAt(-28, 24), 24]}
        onLabelClick={() => onInteractZone(SANCTUARY_ZONES[3])}
      />

      <SpiritualPavilion
        position={[-16, groundHeightAt(-16, -34), -34]}
        onLabelClick={() => onInteractZone(SANCTUARY_ZONES[4])}
      />

      <StrangerTeaGazebo
        position={[44, groundHeightAt(44, -22), -22]}
        onLabelClick={() => onInteractZone(SANCTUARY_ZONES[5])}
      />
      <VintageLampPost position={[39.5, groundHeightAt(39.5, -20.5), -20.5]} />

      <StorybookCottage
        position={[40, groundHeightAt(40, 12), 12]}
        rotationY={-1.05}
        type="letters"
        labelTitle="Bưu điện ký ức"
        labelSubtitle="Vào phòng 3D"
        onLabelClick={() => onInteractZone(SANCTUARY_ZONES[6])}
      />
      <VintageLampPost position={[36.2, groundHeightAt(36.2, 10.6), 10.6]} />

      <StorybookCottage
        position={[26, groundHeightAt(26, 32), 32]}
        rotationY={-0.78}
        type="rain_cabin"
        labelTitle="Căn phòng mưa"
        labelSubtitle="Vào phòng 3D"
        onLabelClick={() => onInteractZone(SANCTUARY_ZONES[7])}
      />

      <VintageLampPost
        position={[
          WORLD_BRIDGES[0].x - 4.4,
          groundHeightAt(WORLD_BRIDGES[0].x - 4.4, WORLD_BRIDGES[0].z - 1.2),
          WORLD_BRIDGES[0].z - 1.2,
        ]}
      />
      <VintageLampPost
        position={[
          WORLD_BRIDGES[1].x - 4.4,
          groundHeightAt(WORLD_BRIDGES[1].x - 4.4, WORLD_BRIDGES[1].z + 1.2),
          WORLD_BRIDGES[1].z + 1.2,
        ]}
      />

      {AMBIENT_SOULS.map((s, idx) => (
        <group
          key={`soul_${idx}`}
          position={[s.x, walkableSurfaceHeightAt(s.x, s.z), s.z]}
          rotation-y={idx === 0 ? Math.PI * 0.85 : 0.6}
          onClick={(e) => {
            e.stopPropagation();
            onSelectWhisper(s);
          }}
        >
          <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.32, 16]} />
            <meshBasicMaterial color="#1f2e22" transparent opacity={0.2} />
          </mesh>
          <StylizedTravelerCharacter robeColor={s.robeColor} isMoving={false} />
        </group>
      ))}

      {clickTarget && (
        <mesh
          position={[
            clickTarget.x,
            walkableSurfaceHeightAt(clickTarget.x, clickTarget.z) + 0.05,
            clickTarget.z,
          ]}
          rotation-x={-Math.PI / 2}
        >
          <ringGeometry args={[0.24, 0.42, 24]} />
          <meshBasicMaterial color="#86efac" transparent opacity={0.82} side={THREE.DoubleSide} />
        </mesh>
      )}

      <ControllableAvatarR3F
        robeColor={robeColor}
        cameraMode={cameraMode}
        cameraZoom={cameraZoom}
        cameraYawRef={cameraYawRef}
        cameraPitchRef={cameraPitchRef}
        keyboardKeysRef={keyboardKeysRef}
        joystickVectorRef={joystickVectorRef}
        clickTarget={clickTarget}
        teleportTarget={teleportTarget}
        onClearClickTarget={onClearClickTarget}
        zones={SANCTUARY_ZONES}
        onNearbyZoneChange={onNearbyZoneChange}
        avatarPosRef={avatarPosRef}
      />
    </>
  );
};

class SceneErrorBoundary extends React.Component<
  { children: React.ReactNode; onSelectZone: (zoneId: WorldZone['id']) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onSelectZone: (zoneId: WorldZone['id']) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: unknown) {
    console.error('3D Sanctuary fallback triggered:', err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#d8e7da] via-[#edf3eb] to-[#faf7ef] text-[#273829]">
          <div className="max-w-md rounded-2xl bg-[#faf7ef]/92 border border-[#cfd8c9] p-6 shadow-md space-y-3">
            <h3 className="text-lg font-serif-healing font-medium text-[#273829]">
              Khu vườn bình yên Heali
            </h3>
            <p className="text-xs text-[#546455] leading-relaxed">
              Trình duyệt hiện tại chưa bật tăng tốc đồ họa WebGL 3D. Bạn vẫn có thể ghé từng góc nhỏ chữa lành ngay bên dưới.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => this.props.onSelectZone('journal')}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#46613e] text-[#faf7ef] text-xs font-medium hover:bg-[#3a5233] transition"
              >
                Nhà nhật ký
              </button>
              <button
                type="button"
                onClick={() => this.props.onSelectZone('stranger_chat')}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#f1ede2] text-[#273829] border border-[#cfd8c9] text-xs font-medium hover:bg-[#e7e2d3] transition"
              >
                Góc gặp gỡ 1:1
              </button>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-white/80 text-[#546455] border border-[#cfd8c9] text-xs font-medium hover:bg-white transition"
              >
                Thử tải lại 3D
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const FrustumCullingOptimizer: React.FC<{ activeLocation: RoomLocationId }> = ({
  activeLocation,
}) => {
  const { scene } = useThree();
  useEffect(() => {
    const applyCulling = () => {
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
          if (!obj.userData?.dynamicBounds) {
            obj.frustumCulled = true;
          }
          if (obj.geometry) {
            if (!obj.geometry.boundingSphere) obj.geometry.computeBoundingSphere();
            if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
          }
          if (obj instanceof THREE.InstancedMesh && !obj.boundingSphere && !obj.userData?.dynamicBounds) {
            obj.computeBoundingSphere();
          }
        }
      });
    };

    applyCulling();
    const timer = window.setTimeout(applyCulling, 350);
    return () => window.clearTimeout(timer);
  }, [scene, activeLocation]);
  return null;
};

export const R3FScene: React.FC<R3FSceneProps> = ({
  weatherMode = 'petals',
  onChangeWeatherMode,
  requestedRoom,
  requestedRegion,
  fullViewport = false,
  isAudioBarVisible = true,
  isDrawerOpen = false,
  onLocationChange,
  onInteriorChange,
  onSelectZone,
  onTriggerAction,
  onOpenAllFeatures,
}) => {
  const [activeLocation, setActiveLocation] = useState<RoomLocationId>(
    requestedRoom?.room ?? 'outdoor'
  );
  liveSceneActivity.isOutdoor = activeLocation === 'outdoor';

  const [transitionVeil, setTransitionVeil] = useState(false);
  const transitionTimerRef = useRef<number | null>(null);
  const lastRequestedSeqRef = useRef<number>(-1);
  const lastRequestedRegionSeqRef = useRef<number>(-1);

  const pulseTransitionVeil = useCallback(() => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
    setTransitionVeil(true);
    transitionTimerRef.current = window.setTimeout(() => {
      setTransitionVeil(false);
    }, 170);
  }, []);

  useEffect(
    () => () => {
      if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    },
    []
  );

  useEffect(() => {
    if (!requestedRoom) return;
    if (requestedRoom.seq === lastRequestedSeqRef.current) return;
    lastRequestedSeqRef.current = requestedRoom.seq;
    if (requestedRoom.room !== activeLocation) {
      pulseTransitionVeil();
    }
    roomYawRef.current = 0.14;
    roomPitchRef.current = 0.36;
    roomZoomRef.current = 1.04;
    setRoomWideView(false);
    setActiveLocation(requestedRoom.room);
    setClickTarget(null);
    setActiveHotspot(null);
    setNearExitDoor(false);
    setShowRoomSwitcher(false);
  }, [requestedRoom, activeLocation, pulseTransitionVeil]);

  useEffect(() => {
    liveSceneActivity.isOutdoor = activeLocation === 'outdoor';
    onInteriorChange?.(activeLocation !== 'outdoor');
    onLocationChange?.(activeLocation);
  }, [activeLocation, onInteriorChange, onLocationChange]);

  const isSoftwareGl = useMemo(() => isSoftwareRenderer(), []);
  const [currentZone, setCurrentZone] = useState<WorldZone | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<ActiveRoomHotspot | null>(null);
  const [nearExitDoor, setNearExitDoor] = useState(false);
  const [showRoomSwitcher, setShowRoomSwitcher] = useState(false);
  const [roomWideView, setRoomWideView] = useState(false);
  const [robeColor, setRobeColor] = useState<number>(0x2d7a58);
  const [cameraMode, setCameraMode] = useState<'follow' | 'isometric' | 'cinematic'>('follow');
  const [cameraZoom, setCameraZoom] = useState<number>(1.0);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [activeWhisper, setActiveWhisper] = useState<SoulWhisper | null>(null);

  const keyboardKeysRef = useRef<{ [key: string]: boolean }>({});
  const joystickVectorRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [clickTarget, setClickTarget] = useState<THREE.Vector3 | null>(null);
  const [teleportTarget, setTeleportTarget] = useState<{ x: number; z: number; seq: number } | null>(null);
  const avatarPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-3.5, 0.7, 5.5));

  const cameraYawRef = useRef<number>(0.24);
  const cameraPitchRef = useRef<number>(0.48);
  const roomYawRef = useRef<number>(0.14);
  const roomPitchRef = useRef<number>(0.36);
  const roomZoomRef = useRef<number>(1.04);
  const draggingRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });
  const [isDraggingCamera, setIsDraggingCamera] = useState(false);
  const dragDeltaRef = useRef<number>(0);

  const handleClearClickTarget = useCallback(() => {
    setClickTarget((prev) => (prev === null ? prev : null));
  }, []);

  const enterRoom = useCallback(
    (room: RoomLocationId) => {
      if (room !== activeLocation) {
        pulseTransitionVeil();
      }
      roomYawRef.current = 0.14;
      roomPitchRef.current = 0.36;
      roomZoomRef.current = 1.04;
      setRoomWideView(false);
      setClickTarget(null);
      setActiveHotspot(null);
      setNearExitDoor(false);
      setShowRoomSwitcher(false);
      setActiveLocation(room);
    },
    [activeLocation, pulseTransitionVeil]
  );

  const handleToggleRoomView = useCallback(() => {
    setRoomWideView((prev) => {
      const next = !prev;
      roomYawRef.current = 0.14;
      roomPitchRef.current = next ? 0.42 : 0.36;
      roomZoomRef.current = next ? 1.02 : 1.04;
      return next;
    });
  }, []);

  const handleResetRoomCamera = useCallback(() => {
    roomYawRef.current = 0.14;
    roomPitchRef.current = roomWideView ? 0.42 : 0.36;
    roomZoomRef.current = roomWideView ? 1.02 : 1.04;
  }, [roomWideView]);

  const handleResetOutdoorCamera = useCallback(() => {
    cameraYawRef.current = 0.24;
    cameraPitchRef.current = 0.48;
    setCameraZoom(1.0);
    setCameraMode('follow');
  }, []);

  const exitToValley = useCallback(
    (fromRoom?: Exclude<RoomLocationId, 'outdoor'>) => {
      const doorstep = fromRoom ? ROOM_METADATA[fromRoom].exitDoorstep : { x: 0, z: 0.8 };
      pulseTransitionVeil();
      setClickTarget(null);
      setActiveHotspot(null);
      setNearExitDoor(false);
      setShowRoomSwitcher(false);
      setActiveLocation('outdoor');
      setTeleportTarget((prev) => ({ x: doorstep.x, z: doorstep.z, seq: (prev?.seq ?? 0) + 1 }));
    },
    [pulseTransitionVeil]
  );

  const handleInteractZone = useCallback(
    (zone: WorldZone) => {
      const targetRoom = mapZoneIdToRoom(zone.id);
      if (targetRoom !== 'outdoor') {
        enterRoom(targetRoom);
      } else {
        onSelectZone(zone.id);
      }
    },
    [enterRoom, onSelectZone]
  );

  const handleTeleportToZone = useCallback(
    (zoneId: WorldZone['id']) => {
      const targetRoom = mapZoneIdToRoom(zoneId);
      const spot = TELEPORT_DOORSTEPS[zoneId];
      const target = SANCTUARY_ZONES.find((z) => z.id === zoneId);
      if (activeLocation !== 'outdoor' && targetRoom !== 'outdoor') {
        enterRoom(targetRoom);
        return;
      }
      setActiveLocation('outdoor');
      if (spot && target) {
        setTeleportTarget((prev) => ({ x: spot.x, z: spot.z, seq: (prev?.seq ?? 0) + 1 }));
        setClickTarget(null);
        setCurrentZone(target);
      } else if (targetRoom !== 'outdoor') {
        enterRoom(targetRoom);
      }
    },
    [activeLocation, enterRoom]
  );

  const handleTeleportToRegion = useCallback(
    (regionId: VietnameseRegionId) => {
      const preset = VIETNAMESE_REGION_PRESETS.find((r) => r.id === regionId);
      if (!preset) return;
      if (activeLocation !== 'outdoor') {
        pulseTransitionVeil();
      }
      setActiveLocation('outdoor');
      setActiveHotspot(null);
      setNearExitDoor(false);
      setShowRoomSwitcher(false);
      setClickTarget(null);
      setCurrentZone(null);
      cameraYawRef.current = preset.yaw;
      setTeleportTarget((prev) => ({ x: preset.x, z: preset.z, seq: (prev?.seq ?? 0) + 1 }));
    },
    [activeLocation, pulseTransitionVeil]
  );

  useEffect(() => {
    if (!requestedRegion) return;
    if (requestedRegion.seq === lastRequestedRegionSeqRef.current) return;
    lastRequestedRegionSeqRef.current = requestedRegion.seq;
    handleTeleportToRegion(requestedRegion.region);
  }, [requestedRegion, handleTeleportToRegion]);

  useEffect(() => {
    if (isDrawerOpen) {
      keyboardKeysRef.current = {};
      joystickVectorRef.current = { dx: 0, dy: 0 };
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      keyboardKeysRef.current[e.key.toLowerCase()] = true;

      if (e.key === 'Escape' && activeLocation !== 'outdoor') {
        e.preventDefault();
        exitToValley(activeLocation);
        return;
      }

      if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        if (activeLocation !== 'outdoor') {
          e.preventDefault();
          if (nearExitDoor) {
            exitToValley(activeLocation);
          } else if (activeHotspot) {
            onTriggerAction(activeHotspot.action);
          } else {
            onTriggerAction(ROOM_METADATA[activeLocation].primaryAction);
          }
        } else if (currentZone) {
          e.preventDefault();
          handleInteractZone(currentZone);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keyboardKeysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isDrawerOpen, activeLocation, activeHotspot, nearExitDoor, currentZone, handleInteractZone, onTriggerAction, exitToValley]);

  const handleToggleSound = useCallback(() => {
    setSoundMuted((prev) => {
      const next = !prev;
      if (next) {
        soundEngine.setVolume('master', 0);
      } else {
        soundEngine.setVolume('master', 0.7);
        if (!soundEngine.getIsPlaying()) {
          soundEngine.start();
        }
      }
      return next;
    });
  }, []);

  const activeRoomMeta = activeLocation !== 'outdoor' ? ROOM_METADATA[activeLocation] : null;
  const heightClasses = fullViewport
    ? isAudioBarVisible
      ? 'h-[calc(100vh-204px)] lg:h-[calc(100vh-148px)] min-h-[410px]'
      : 'h-[calc(100vh-138px)] lg:h-[calc(100vh-84px)] min-h-[480px]'
    : 'h-[600px] sm:h-[670px]';

  return (
    <div
      onWheel={(e) => {
        if (Math.abs(e.deltaY) === 0) return;
        if (activeLocation === 'outdoor') {
          setCameraZoom((prev) => THREE.MathUtils.clamp(prev + e.deltaY * 0.0008, 0.55, 2.55));
        } else {
          roomZoomRef.current = THREE.MathUtils.clamp(
            roomZoomRef.current + e.deltaY * 0.0007,
            0.5,
            1.75
          );
        }
      }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement | null)?.closest('button, a, input, select, textarea')) return;
        draggingRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
        setIsDraggingCamera(true);
        dragDeltaRef.current = 0;
      }}
      onPointerMove={(e) => {
        if (!draggingRef.current.active) return;
        const dx = e.clientX - draggingRef.current.lastX;
        const dy = e.clientY - draggingRef.current.lastY;
        draggingRef.current.lastX = e.clientX;
        draggingRef.current.lastY = e.clientY;
        dragDeltaRef.current += Math.hypot(dx, dy);
        if (activeLocation === 'outdoor') {
          cameraYawRef.current -= dx * 0.0065;
          cameraPitchRef.current = THREE.MathUtils.clamp(
            cameraPitchRef.current + dy * 0.005,
            0.18,
            1.22
          );
        } else {
          roomYawRef.current -= dx * 0.0065;
          roomPitchRef.current = THREE.MathUtils.clamp(
            roomPitchRef.current + dy * 0.005,
            0.12,
            1.05
          );
        }
      }}
      onPointerUp={() => {
        draggingRef.current.active = false;
        setIsDraggingCamera(false);
      }}
      onPointerCancel={() => {
        draggingRef.current.active = false;
        setIsDraggingCamera(false);
      }}
      onPointerLeave={() => {
        draggingRef.current.active = false;
        setIsDraggingCamera(false);
      }}
      className={`relative ${
        isMobileFrame
          ? 'mx-auto w-full max-w-[420px] aspect-[9/16] max-h-[820px]'
          : `w-full ${heightClasses}`
      } ${isDraggingCamera ? 'cursor-grabbing' : 'cursor-grab'} rounded-3xl overflow-hidden shadow-[0_24px_60px_rgba(39,56,41,0.14)] border border-[#dcd9cc] select-none touch-none`}
      style={{
        background: activeRoomMeta
          ? activeRoomMeta.bgHex
          : 'linear-gradient(180deg, #4a86b8 0%, #9ac7d6 52%, #ddf0e4 100%)',
      }}
    >
      <SceneErrorBoundary onSelectZone={onSelectZone}>
        <Canvas
          shadows={!isSoftwareGl}
          dpr={isSoftwareGl ? 1 : [1, 1.75]}
          camera={{ position: [-0.2, 8.8, 19.2], fov: 54, near: 0.2, far: 340 }}
          gl={{
            alpha: false,
            antialias: !isSoftwareGl,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.96,
          }}
        >
          <Suspense fallback={null}>
            <FrustumCullingOptimizer activeLocation={activeLocation} />
            <SceneAtmosphereController
              activeLocation={activeLocation}
              weatherMode={weatherMode}
            />
            <group visible={activeLocation === 'outdoor'}>
              <WorldContent
                isSoftwareGl={isSoftwareGl}
                weatherMode={weatherMode}
                robeColor={robeColor}
                cameraMode={cameraMode}
                cameraZoom={cameraZoom}
                cameraYawRef={cameraYawRef}
                cameraPitchRef={cameraPitchRef}
                dragDeltaRef={dragDeltaRef}
                keyboardKeysRef={keyboardKeysRef}
                joystickVectorRef={joystickVectorRef}
                clickTarget={clickTarget}
                teleportTarget={teleportTarget}
                onClearClickTarget={handleClearClickTarget}
                onSetClickTarget={setClickTarget}
                onNearbyZoneChange={setCurrentZone}
                onSelectWhisper={setActiveWhisper}
                onInteractZone={handleInteractZone}
                onEnterRoom={enterRoom}
                avatarPosRef={avatarPosRef}
              />
            </group>
            <group visible={activeLocation !== 'outdoor'}>
              <R3FRoomStage
                activeRoom={activeLocation === 'outdoor' ? null : activeLocation}
                isSoftwareGl={isSoftwareGl}
                roomWideView={roomWideView}
                robeColor={robeColor}
                roomYawRef={roomYawRef}
                roomPitchRef={roomPitchRef}
                roomZoomRef={roomZoomRef}
                dragDeltaRef={dragDeltaRef}
                keyboardKeysRef={keyboardKeysRef}
                joystickVectorRef={joystickVectorRef}
                clickTarget={clickTarget}
                onSetClickTarget={setClickTarget}
                onClearClickTarget={handleClearClickTarget}
                onTriggerAction={onTriggerAction}
                onHotspotChange={setActiveHotspot}
                onNearDoorChange={setNearExitDoor}
                onExitToOutdoor={() =>
                  exitToValley(activeLocation === 'outdoor' ? undefined : activeLocation)
                }
              />
            </group>
            {!isSoftwareGl && <DonghuaPostProcessing />}
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>

      {/* Smooth Doorway Transition Veil */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-25 bg-[#19241c] transition-opacity duration-200 ${
          transitionVeil ? 'opacity-55' : 'opacity-0'
        }`}
      />

      {/* ==================== IN-ROOM HUD ==================== */}
      {activeRoomMeta && (
        <>
          {/* Top-Left Room Header + Top-Right Quick Controls */}
          <div className="absolute top-3.5 inset-x-3.5 sm:top-4 sm:inset-x-5 z-30 flex flex-wrap items-start justify-between gap-2 pointer-events-none">
            <div className="pointer-events-auto rounded-2xl bg-[#faf7ef]/92 backdrop-blur-md border border-[#cfd8c9] px-4 py-2.5 shadow-lg text-[#273829] max-w-xs sm:max-w-sm">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[#46613e]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Không gian phòng 3D</span>
              </div>
              <h4 className="font-serif-healing text-base sm:text-lg font-medium leading-tight mt-0.5 text-[#273829]">
                {activeRoomMeta.name}
              </h4>
              <p className="hidden sm:block text-[11px] text-[#546455] mt-0.5 leading-snug">
                WASD hoặc chạm sàn · Kéo xoay góc nhìn, cuộn thu phóng · Nhấn{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-[#f1ede2] border border-[#cfd8c9] text-[10px]">
                  E
                </kbd>
              </p>
            </div>

            <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 relative">
              <button
                type="button"
                onClick={handleToggleRoomView}
                title="Chuyển góc nhìn chuẩn / bao quát phòng"
                className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#faf7ef]/92 hover:bg-[#faf7ef] backdrop-blur-md border border-[#cfd8c9] text-[#273829] text-xs font-medium shadow-md transition whitespace-nowrap"
              >
                <Eye className="w-4 h-4 text-[#46613e]" />
                <span className="hidden sm:inline">{roomWideView ? 'Toàn phòng' : 'Góc chuẩn'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetRoomCamera}
                title="Đặt lại góc nhìn phòng"
                className="min-h-[44px] w-[44px] flex items-center justify-center rounded-2xl bg-[#faf7ef]/92 hover:bg-[#faf7ef] backdrop-blur-md border border-[#cfd8c9] text-[#273829] shadow-md transition"
              >
                <RotateCcw className="w-4 h-4 text-[#46613e]" />
              </button>

              {onOpenAllFeatures && (
                <button
                  type="button"
                  onClick={onOpenAllFeatures}
                  className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#46613e] hover:bg-[#3a5233] text-[#faf7ef] text-xs font-medium shadow-md transition whitespace-nowrap"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chức năng</span>
                </button>
              )}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRoomSwitcher((p) => !p)}
                  className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#faf7ef]/92 hover:bg-[#faf7ef] backdrop-blur-md border border-[#cfd8c9] text-[#273829] text-xs font-medium shadow-md transition whitespace-nowrap"
                >
                  <Compass className="w-4 h-4 text-[#46613e]" />
                  <span>Đổi phòng</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#546455]" />
                </button>

                {showRoomSwitcher && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#faf7ef]/98 backdrop-blur-md border border-[#cfd8c9] shadow-2xl p-2 space-y-1 z-40">
                    {Object.values(ROOM_METADATA).map((rm) => {
                      const isCurr = rm.id === activeLocation;
                      return (
                        <button
                          key={rm.id}
                          type="button"
                          onClick={() => enterRoom(rm.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition ${
                            isCurr
                              ? 'bg-[#46613e] text-[#faf7ef] font-medium'
                              : 'hover:bg-[#f1ede2] text-[#273829]'
                          }`}
                        >
                          <div>{rm.name}</div>
                          <div
                            className={`text-[10px] truncate ${
                              isCurr ? 'text-[#dbe6d8]' : 'text-[#546455]'
                            }`}
                          >
                            {rm.subtitle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => exitToValley(activeRoomMeta.id)}
                className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#faf7ef]/92 hover:bg-[#faf7ef] backdrop-blur-md border border-[#cfd8c9] text-[#273829] text-xs font-medium shadow-md transition whitespace-nowrap"
              >
                <DoorOpen className="w-4 h-4 text-[#46613e]" />
                <span className="hidden xs:inline">Ra thung lũng</span>
                <span className="xs:hidden">Thoát</span>
              </button>
            </div>
          </div>

          {/* Bottom-Center Interaction Prompt Bar inside 3D Room */}
          <div className="absolute bottom-4 sm:bottom-5 inset-x-3 sm:inset-x-auto sm:right-5 md:right-auto md:left-1/2 md:-translate-x-1/2 z-20 sm:w-[390px] lg:w-[460px] pointer-events-auto">
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#faf7ef]/94 backdrop-blur-md border border-[#cfd8c9] shadow-xl">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#46613e]">
                  {nearExitDoor
                    ? 'Cửa ra khu vườn'
                    : activeHotspot
                      ? 'Vật phẩm tương tác [E]'
                      : 'Tương tác trong phòng'}
                </p>
                <h3 className="font-serif-healing text-sm sm:text-base font-medium text-[#273829] truncate">
                  {nearExitDoor
                    ? 'Quay lại thung lũng ngoài trời'
                    : activeHotspot
                      ? activeHotspot.label
                      : activeRoomMeta.primaryLabel}
                </h3>
                {activeHotspot && !nearExitDoor && (
                  <p className="text-[11px] text-[#546455] truncate">{activeHotspot.hint}</p>
                )}
              </div>

              {nearExitDoor ? (
                <button
                  type="button"
                  onClick={() => exitToValley(activeRoomMeta.id)}
                  className="shrink-0 min-h-[42px] flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#3a5233] text-[#faf7ef] text-xs font-medium shadow-sm transition active:scale-95 whitespace-nowrap"
                >
                  <DoorOpen className="w-4 h-4" />
                  <span>Ra ngoài</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onTriggerAction(activeHotspot?.action ?? activeRoomMeta.primaryAction)
                  }
                  className="shrink-0 min-h-[42px] flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#46613e] hover:bg-[#3a5233] text-[#faf7ef] text-xs font-medium shadow-sm transition active:scale-95 whitespace-nowrap"
                >
                  <span>Mở · E</span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom-Left Directional D-Pad inside 3D Rooms */}
          <div className="hidden sm:block absolute bottom-4 left-4 sm:left-5 z-20 pointer-events-auto select-none">
            <div className="grid grid-cols-3 gap-1 w-[116px]">
              <div />
              <button
                type="button"
                aria-label="Đi lên"
                onPointerDown={() => {
                  joystickVectorRef.current = { dx: 0, dy: -1 };
                }}
                onPointerUp={() => {
                  joystickVectorRef.current = { dx: 0, dy: 0 };
                }}
                onPointerLeave={() => {
                  joystickVectorRef.current = { dx: 0, dy: 0 };
                }}
                className="w-9 h-9 rounded-xl bg-[#faf7ef]/90 hover:bg-[#faf7ef] backdrop-blur-md border border-[#cfd8c9] text-[#273829] flex items-center justify-center shadow-md transition"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div />
              <button
                type="button"
                aria-label="Sang trái"
                onPointerDown={() => {
                  joystickVectorRef.current = { dx: -1, dy: 0 };
                }}
                onPointerUp={() => {
                  joystickVectorRef.current = { dx: 0, dy: 0 };
                }}
                onPointerLeave={() => {
                  joystickVectorRef.current = { dx: 0, dy: 0 };
                }}
                className="w-9 h-9 rounded-xl bg-[#faf7ef]/90 hover:bg-[#faf7ef] backdrop-blur-md border border-[#cfd8c9] text-[#273829] flex items-center justify-center shadow-md transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Đi xuống"
                onPointerDown={() => {
                  joystickVectorRef.current = { dx: 0, dy: 1 };
                }}
                onPointerUp={() => {
                  joystickVectorRef.current = { dx: 0, dy: 0 };
                }}
                onPointerLeave={() => {
                  joystickVectorRef.current = { dx: 0, dy: 0 };
                }}
                className="w-9 h-9 rounded-xl bg-[#faf7ef]/90 hover:bg-[#faf7ef] backdrop-blur-md border border-[#cfd8c9] text-[#273829] flex items-center justify-center shadow-md transition"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Sang phải"
                onPointerDown={() => {
                  joystickVectorRef.current = { dx: 1, dy: 0 };
                }}
                onPointerUp={() => {
                  joystickVectorRef.current = { dx: 0, dy: 0 };
                }}
                onPointerLeave={() => {
                  joystickVectorRef.current = { dx: 0, dy: 0 };
                }}
                className="w-9 h-9 rounded-xl bg-[#faf7ef]/90 hover:bg-[#faf7ef] backdrop-blur-md border border-[#cfd8c9] text-[#273829] flex items-center justify-center shadow-md transition"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ==================== OUTDOOR VALLEY HUD ==================== */}
      {activeLocation === 'outdoor' && (
        <WorldHUD
          weatherMode={weatherMode}
          onChangeWeatherMode={onChangeWeatherMode}
          currentZone={currentZone}
          featuredZone={SANCTUARY_ZONES[0]}
          allZones={SANCTUARY_ZONES}
          onInteractZone={handleInteractZone}
          onTeleportToZone={handleTeleportToZone}
          onOpenAllFeatures={onOpenAllFeatures}
          onQuickWriteJournal={() => onTriggerAction('open_journal')}
          robeColor={robeColor}
          onUpdateRobeColor={setRobeColor}
          cameraMode={cameraMode}
          onChangeCameraMode={setCameraMode}
          onResetCamera={handleResetOutdoorCamera}
          isZenMode={isZenMode}
          onToggleZenMode={() => setIsZenMode(!isZenMode)}
          isMobileFrame={isMobileFrame}
          onToggleMobileFrame={() => setIsMobileFrame((p) => !p)}
          soundMuted={soundMuted}
          onToggleSound={handleToggleSound}
          onJoystickMove={(dx, dy) => {
            joystickVectorRef.current = { dx, dy };
          }}
          onJoystickEnd={() => {
            joystickVectorRef.current = { dx: 0, dy: 0 };
          }}
        />
      )}

      {/* Ambient Soul Whisper Dialogue Box */}
      {activeWhisper && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-md">
          <div className="p-4 rounded-2xl bg-[#faf7ef]/95 backdrop-blur-md border border-[#cfd8c9] shadow-xl space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#e5e2d8]">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#46613e]" />
                <span className="text-xs font-semibold text-[#273829]">{activeWhisper.name}</span>
                <span className="text-[10px] text-[#7a8b7c]">· {activeWhisper.avatarRole}</span>
              </div>
              <button
                onClick={() => setActiveWhisper(null)}
                className="p-1 text-[#7a8b7c] hover:text-[#273829]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#3b4a3e] font-serif-healing italic leading-relaxed">
              “{activeWhisper.quote}”
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
