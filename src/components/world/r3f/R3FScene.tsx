import React, { useRef, useState, useCallback, useEffect, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Sparkles as DreiSparkles } from '@react-three/drei';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
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
import { computeTargetAtmosphere, type BlendedAtmosphere } from './zoneAtmosphere';
import { R3FInteriorJournal } from './R3FInteriorJournal';
import {
  ControllableAvatarR3F,
  StylizedTravelerCharacter,
  resolveAvatarCollision,
} from './R3FAvatar';
import {
  SANCTUARY_ZONES,
  WORLD_BRIDGES,
  walkableSurfaceHeightAt,
} from './worldLayout';
import { WorldHUD } from '../WorldHUD';
import type { WorldZone } from '../WorldEnvironment';
import type { WeatherMode } from '../DynamicWeatherOverlay';
import { soundEngine } from '../../../services/soundEngine';
import { MessageCircle, X, DoorOpen, BookOpen } from 'lucide-react';

export interface R3FSceneProps {
  weatherMode?: WeatherMode;
  onChangeWeatherMode?: (mode: WeatherMode) => void;
  onInteriorChange?: (isInside: boolean) => void;
  onSelectZone: (zoneId: WorldZone['id']) => void;
  onOpenFloatModal: () => void;
  onOpenWriteLetter: () => void;
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
    robeColor: 0x5c7c66,
  },
  {
    name: 'Bạn Lữ Hành Xa Xứ',
    avatarRole: 'Dưới cội cây ước nguyện',
    quote: 'Đừng vội thúc ép bản thân phải lành lặn ngay hôm nay. Cho phép mình được ngồi nghỉ một chút bên mặt hồ bình yên.',
    x: -24.5,
    z: 24.8,
    robeColor: 0xb97a57,
  },
  {
    name: 'Người Pha Trà Bên Suối',
    avatarRole: 'Trên cầu gỗ qua suối nhỏ',
    quote: 'Tiếng nước chảy qua khe đá luôn nhắc chúng ta rằng mọi cảm xúc nặng nề rồi cũng sẽ trôi qua.',
    x: 21.5,
    z: 4.8,
    robeColor: 0x62733b,
  },
];

// Scenic entrance doorsteps when teleporting via "Các góc nhỏ"
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

// Smooth Painterly Sky Dome with Glowing Sun/Sunset Disc & Drifting Clouds
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

          void main() {
            float elev = clamp(vDir.y, -0.2, 1.0);
            float t = smoothstep(-0.06, 0.52, elev);
            vec3 skyCol = mix(uHorizon, uTop, t);

            // Soft layered painted valley clouds drifting along sky vault
            if (elev > 0.02) {
              vec2 cloudUv = vDir.xz / (elev + 0.24) * 1.45 + vec2(uTime * 0.009, uTime * 0.004);
              float c1 = noise(cloudUv * 2.2);
              float c2 = noise(cloudUv * 4.8 + vec2(3.1, 1.7));
              float cloud = smoothstep(0.54, 0.85, c1 * 0.65 + c2 * 0.35);
              float horizonFade = smoothstep(0.02, 0.18, elev) * (1.0 - smoothstep(0.45, 0.85, elev));
              vec3 cloudColor = mix(vec3(0.98, 0.99, 1.0), uSunColor, 0.24);
              skyCol = mix(skyCol, cloudColor, cloud * 0.48 * horizonFade);
            }

            // Glowing Solar/Sunset Disc & Atmospheric Corona
            float sunDot = max(0.0, dot(normalize(vDir), normalize(uSunDir)));
            float disc = smoothstep(0.9982, 0.9994, sunDot);
            float halo = pow(sunDot, 10.0) * 0.45 + pow(sunDot, 42.0) * 0.55;
            skyCol += uSunColor * (disc * 1.15 + halo * uSunGlow);

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
      fogDensity: 0.0045,
      hemiSky: new THREE.Color('#edf7f3'),
      hemiGround: new THREE.Color('#5a6b38'),
      hemiIntensity: 1.15,
      keyColor: new THREE.Color('#fff4d8'),
      keyIntensity: 1.8,
    }),
    []
  );

  useFrame((state, delta) => {
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

// Configure Studio Environment Reflection (RoomEnvironment PMREM) & Horizon Mist Fog
const SceneAtmosphereController: React.FC<{
  activeLocation: 'outdoor' | 'journal_interior';
  weatherMode: WeatherMode;
}> = ({ activeLocation, weatherMode }) => {
  const { scene, gl } = useThree();

  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.72;
    return () => {
      scene.environment = null;
      envTex.dispose();
      pmremGenerator.dispose();
    };
  }, [gl, scene]);

  useEffect(() => {
    if (activeLocation === 'journal_interior') {
      scene.background = new THREE.Color(0x1f1712);
      scene.fog = new THREE.FogExp2(0x271a14, 0.032);
      return;
    }

    scene.background = null;
    if (!(scene.fog instanceof THREE.FogExp2)) {
      scene.fog = new THREE.FogExp2(0xd6e6dc, 0.0048);
    }
  }, [activeLocation, weatherMode, scene]);

  return null;
};

// Inner 3D Environment Inside Canvas
const WorldContent: React.FC<{
  isSoftwareGl: boolean;
  weatherMode: WeatherMode;
  robeColor: number;
  cameraMode: 'follow' | 'isometric' | 'cinematic';
  cameraZoom: number;
  cameraYawRef: React.MutableRefObject<number>;
  dragDeltaRef: React.MutableRefObject<number>;
  keyboardKeys: { [key: string]: boolean };
  joystickVector: { dx: number; dy: number };
  clickTarget: THREE.Vector3 | null;
  teleportTarget: { x: number; z: number; seq: number } | null;
  onClearClickTarget: () => void;
  onSetClickTarget: (pt: THREE.Vector3) => void;
  onNearbyZoneChange: (zone: WorldZone | null) => void;
  onSelectWhisper: (soul: SoulWhisper) => void;
  onInteractZone: (zone: WorldZone) => void;
  onOpenFloatModal: () => void;
  avatarPosRef: React.MutableRefObject<THREE.Vector3>;
}> = ({
  isSoftwareGl,
  weatherMode,
  robeColor,
  cameraMode,
  cameraZoom,
  cameraYawRef,
  dragDeltaRef,
  keyboardKeys,
  joystickVector,
  clickTarget,
  teleportTarget,
  onClearClickTarget,
  onSetClickTarget,
  onNearbyZoneChange,
  onSelectWhisper,
  onInteractZone,
  onOpenFloatModal,
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

      {/* 1. Zone-Adaptive Daylight / Golden Sunset Valley Lighting Rig */}
      <hemisphereLight
        ref={hemiLightRef}
        args={[0xf0f7f3, 0x5c6838, 1.15]}
        position={[0, 50, 0]}
      />

      <directionalLight
        ref={keyLightRef}
        position={[-34, 48, 36]}
        intensity={1.75}
        color="#fff5de"
        castShadow={!isSoftwareGl}
        shadow-mapSize={isSoftwareGl ? [512, 512] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
      >
        <orthographicCamera attach="shadow-camera" args={[-62, 62, 62, -62, 2.0, 150]} />
      </directionalLight>

      <directionalLight position={[32, 24, -36]} intensity={0.48} color="#cce3da" />

      {/* Ambient Floating Sunlight Dust / Fireflies */}
      <DreiSparkles
        count={isFireflies ? 120 : 60}
        scale={[75, 8, 75]}
        position={[0, 3.2, 6]}
        size={isFireflies ? 3.2 : 2.1}
        speed={0.25}
        opacity={isFireflies ? 0.85 : 0.45}
        color={isFireflies ? '#fde047' : '#fef9c3'}
      />

      {/* 2. Expansive Valley Terrain, Distant Karst Mountains, Cobble Paths & Wildflowers */}
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

      {/* 3. Ho Hoa Dang Lake, Flowing Winding Brook, Waterfalls, Bridges, Koi & Waterside Pavilion */}
      <ReflectiveLake onSelectLantern={() => onOpenFloatModal()} />
      <WaterLilyR3F position={[-9.5, 0.05, 31.2]} scale={1.1} />
      <WaterLilyR3F position={[8.6, 0.05, 30.8]} scale={1.0} />
      <WaterLilyR3F position={[-4.8, 0.05, 39.2]} scale={1.15} />
      <WaterLilyR3F position={[-11.8, 0.05, 25.8]} scale={0.95} />
      <WaterLilyR3F position={[5.2, 0.05, 27.6]} scale={0.9} />

      {/* 4. Realistic Forest Biomes (Oaks, Sakuras, Crimson Plums, Palms, Pines, Willows, Bamboo) & Cranes */}
      <BotanicalTreesRing />
      <SoaringWhiteCranes />
      <GardenShrubsAndBenches />
      <GardenButterflies />

      {/* 5. Distinct Multi-Part Cottages & Sanctuary Pavilions Across the Valley */}
      {/* A. Nha Nhat Ky (Central Wildflower Meadow) */}
      <StorybookCottage
        position={[0, groundHeightAt(0, -4), -4]}
        rotationY={0.08}
        type="journal"
        labelTitle="Nhà nhật ký"
        labelSubtitle="Vào nhà viết nhật ký"
        onLabelClick={() => onInteractZone(SANCTUARY_ZONES[0])}
      />
      <CozyGardenArmchair position={[-3.2, groundHeightAt(-3.2, -1.6), -1.6]} rotationY={0.5} />
      <TerracottaCactusPot position={[-2.1, groundHeightAt(-2.1, -1.1), -1.1]} />
      <VintageLampPost position={[2.4, groundHeightAt(2.4, -0.5), -0.5]} />

      {/* B. Vuon Tam Tinh (West Lavender Meadow) */}
      <ConfessionGardenPavilion
        position={[-32, groundHeightAt(-32, -2), -2]}
        onLabelClick={() => onInteractZone(SANCTUARY_ZONES[2])}
      />
      <VintageLampPost position={[-28.2, groundHeightAt(-28.2, 0.4), 0.4]} />

      {/* C. Cay Uoc Nguyen (West Lakeside Knoll) */}
      <GreatWishTreeR3F
        position={[-28, groundHeightAt(-28, 24), 24]}
        onLabelClick={() => onInteractZone(SANCTUARY_ZONES[3])}
      />

      {/* D. Phong Tam Linh (Elevated Northern Mountain Foothill Terrace) */}
      <SpiritualPavilion
        position={[-16, groundHeightAt(-16, -34), -34]}
        onLabelClick={() => onInteractZone(SANCTUARY_ZONES[4])}
      />

      {/* E. Goc Gap Go (North-East Bamboo Brook Tea Pavilion across Bridge 2) */}
      <StrangerTeaGazebo
        position={[44, groundHeightAt(44, -22), -22]}
        onLabelClick={() => onInteractZone(SANCTUARY_ZONES[5])}
      />
      <VintageLampPost position={[39.5, groundHeightAt(39.5, -20.5), -20.5]} />

      {/* F. Buu Dien Ky Uc (East Cherry Blossom Orchard across Bridge 1) */}
      <StorybookCottage
        position={[40, groundHeightAt(40, 12), 12]}
        rotationY={-1.05}
        type="letters"
        labelTitle="Bưu điện ký ức"
        labelSubtitle="Thư chưa gửi"
        onLabelClick={() => onInteractZone(SANCTUARY_ZONES[6])}
      />
      <VintageLampPost position={[36.2, groundHeightAt(36.2, 10.6), 10.6]} />

      {/* G. Can Phong Mua (South-East Lakeshore Willow Conservatory) */}
      <StorybookCottage
        position={[26, groundHeightAt(26, 32), 32]}
        rotationY={-0.78}
        type="rain_cabin"
        labelTitle="Căn phòng mưa"
        labelSubtitle="Nhà kính & thanh âm mưa"
        onLabelClick={() => onInteractZone(SANCTUARY_ZONES[7])}
      />

      {/* Bridge Trail Lamp Posts */}
      <VintageLampPost
        position={[WORLD_BRIDGES[0].x - 4.4, groundHeightAt(WORLD_BRIDGES[0].x - 4.4, WORLD_BRIDGES[0].z - 1.2), WORLD_BRIDGES[0].z - 1.2]}
      />
      <VintageLampPost
        position={[WORLD_BRIDGES[1].x - 4.4, groundHeightAt(WORLD_BRIDGES[1].x - 4.4, WORLD_BRIDGES[1].z + 1.2), WORLD_BRIDGES[1].z + 1.2]}
      />

      {/* 6. Ambient Friendly Sanctuary Travelers */}
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
            <meshBasicMaterial color="#1e2a1f" transparent opacity={0.25} />
          </mesh>
          <StylizedTravelerCharacter robeColor={s.robeColor} isMoving={false} />
        </group>
      ))}

      {/* 7. Click Target Ring Marker */}
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
          <meshBasicMaterial color="#faf7ef" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 8. Controllable Main Traveler Avatar */}
      <ControllableAvatarR3F
        robeColor={robeColor}
        cameraMode={cameraMode}
        cameraZoom={cameraZoom}
        cameraYawRef={cameraYawRef}
        keyboardKeys={keyboardKeys}
        joystickVector={joystickVector}
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
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#d8e7de] via-[#b8d1c4] to-[#688d7c] text-[#223526]">
          <div className="max-w-md rounded-3xl bg-[#faf7ef]/95 border border-[#d6dfd2] p-6 shadow-xl space-y-3">
            <h3 className="text-lg font-bold font-serif-healing">
              Khu vườn bình yên Heali
            </h3>
            <p className="text-xs text-[#4f6452] leading-relaxed">
              Trình duyệt hiện tại chưa bật tăng tốc đồ họa WebGL 3D. Bạn vẫn có thể ghé từng góc nhỏ chữa lành ngay bên dưới.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => this.props.onSelectZone('journal')}
                className="px-3.5 py-2 rounded-xl bg-[#46613e] text-white text-xs font-semibold hover:bg-[#384f31] transition"
              >
                Nhà nhật ký
              </button>
              <button
                type="button"
                onClick={() => this.props.onSelectZone('stranger_chat')}
                className="px-3.5 py-2 rounded-xl bg-[#eef2e8] text-[#273829] border border-[#cfd8c9] text-xs font-medium hover:bg-white transition"
              >
                Góc gặp gỡ 1:1
              </button>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="px-3.5 py-2 rounded-xl bg-white/80 text-[#4f6452] border border-[#dcd9cc] text-xs font-medium hover:bg-white transition"
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

export const R3FScene: React.FC<R3FSceneProps> = ({
  weatherMode = 'petals',
  onChangeWeatherMode,
  onInteriorChange,
  onSelectZone,
  onOpenFloatModal,
  onOpenWriteLetter,
}) => {
  const [activeLocation, setActiveLocation] = useState<'outdoor' | 'journal_interior'>('outdoor');

  useEffect(() => {
    onInteriorChange?.(activeLocation === 'journal_interior');
  }, [activeLocation, onInteriorChange]);

  const isSoftwareGl = useMemo(() => isSoftwareRenderer(), []);
  const [currentZone, setCurrentZone] = useState<WorldZone | null>(null);
  const [robeColor, setRobeColor] = useState<number>(0x2d7a58);
  const [cameraMode, setCameraMode] = useState<'follow' | 'isometric' | 'cinematic'>('follow');
  const [cameraZoom, setCameraZoom] = useState<number>(1.0);
  const [isZenMode, setIsZenMode] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [activeWhisper, setActiveWhisper] = useState<SoulWhisper | null>(null);

  const [keyboardKeys, setKeyboardKeys] = useState<{ [key: string]: boolean }>({});
  const [joystickVector, setJoystickVector] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [clickTarget, setClickTarget] = useState<THREE.Vector3 | null>(null);
  const [teleportTarget, setTeleportTarget] = useState<{ x: number; z: number; seq: number } | null>(null);
  const avatarPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-3.5, 0.7, 5.5));

  // Mouse/pointer horizontal drag orbit state
  const cameraYawRef = useRef<number>(0);
  const draggingRef = useRef<{ active: boolean; lastX: number }>({ active: false, lastX: 0 });
  const dragDeltaRef = useRef<number>(0);

  const handleInteractZone = useCallback(
    (zone: WorldZone) => {
      if (zone.id === 'lake') {
        onOpenFloatModal();
      } else if (zone.id === 'letters') {
        onOpenWriteLetter();
      } else if (zone.id === 'journal') {
        setActiveLocation('journal_interior');
      } else {
        onSelectZone(zone.id);
      }
    },
    [onOpenFloatModal, onOpenWriteLetter, onSelectZone]
  );

  const handleTeleportToZone = useCallback((zoneId: WorldZone['id']) => {
    setActiveLocation('outdoor');
    const spot = TELEPORT_DOORSTEPS[zoneId];
    const target = SANCTUARY_ZONES.find((z) => z.id === zoneId);
    if (spot && target) {
      setTeleportTarget((prev) => ({ x: spot.x, z: spot.z, seq: (prev?.seq ?? 0) + 1 }));
      setClickTarget(null);
      setCurrentZone(target);
    } else if (zoneId === 'stranger_chat' || zoneId === 'spiritual_room') {
      onSelectZone(zoneId);
    }
  }, [onSelectZone]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeyboardKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: true }));
      if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        if (activeLocation === 'journal_interior') {
          e.preventDefault();
          onSelectZone('journal');
        } else if (currentZone) {
          e.preventDefault();
          handleInteractZone(currentZone);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeyboardKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeLocation, currentZone, handleInteractZone, onSelectZone]);

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

  return (
    <div
      onWheel={(e) => {
        if (Math.abs(e.deltaY) > 0) {
          setCameraZoom((prev) => THREE.MathUtils.clamp(prev + e.deltaY * 0.0007, 0.65, 1.85));
        }
      }}
      onPointerDown={(e) => {
        draggingRef.current = { active: true, lastX: e.clientX };
        dragDeltaRef.current = 0;
      }}
      onPointerMove={(e) => {
        if (!draggingRef.current.active) return;
        const dx = e.clientX - draggingRef.current.lastX;
        draggingRef.current.lastX = e.clientX;
        dragDeltaRef.current += Math.abs(dx);
        cameraYawRef.current -= dx * 0.0055;
      }}
      onPointerUp={() => {
        draggingRef.current.active = false;
      }}
      onPointerLeave={() => {
        draggingRef.current.active = false;
      }}
      className="relative w-full h-[600px] sm:h-[670px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-[#d6dfd2] select-none touch-none"
      style={{
        background:
          activeLocation === 'outdoor'
            ? 'linear-gradient(180deg, #9ec0cb 0%, #c8ded4 48%, #5b826d 100%)'
            : '#1f1712',
      }}
    >
      <SceneErrorBoundary onSelectZone={onSelectZone}>
        <Canvas
          shadows={!isSoftwareGl}
          dpr={isSoftwareGl ? 1 : [1, 1.75]}
          camera={{ position: [-3.5, 7.6, 18.2], fov: 46, near: 0.2, far: 340 }}
          gl={{
            alpha: true,
            antialias: !isSoftwareGl,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.06,
          }}
        >
          <Suspense fallback={null}>
            <SceneAtmosphereController
              activeLocation={activeLocation}
              weatherMode={weatherMode}
            />
            {activeLocation === 'outdoor' ? (
              <WorldContent
                isSoftwareGl={isSoftwareGl}
                weatherMode={weatherMode}
                robeColor={robeColor}
                cameraMode={cameraMode}
                cameraZoom={cameraZoom}
                cameraYawRef={cameraYawRef}
                dragDeltaRef={dragDeltaRef}
                keyboardKeys={keyboardKeys}
                joystickVector={joystickVector}
                clickTarget={clickTarget}
                teleportTarget={teleportTarget}
                onClearClickTarget={() => setClickTarget(null)}
                onSetClickTarget={setClickTarget}
                onNearbyZoneChange={setCurrentZone}
                onSelectWhisper={setActiveWhisper}
                onInteractZone={handleInteractZone}
                onOpenFloatModal={onOpenFloatModal}
                avatarPosRef={avatarPosRef}
              />
            ) : (
              <R3FInteriorJournal
                robeColor={robeColor}
                keyboardKeys={keyboardKeys}
                joystickVector={joystickVector}
                clickTarget={clickTarget}
                onClearClickTarget={() => setClickTarget(null)}
                onOpenJournalModal={() => onSelectZone('journal')}
                onExitToOutdoor={() => {
                  setActiveLocation('outdoor');
                  setTeleportTarget((prev) => ({ x: 0, z: 0.8, seq: (prev?.seq ?? 0) + 1 }));
                }}
              />
            )}
          </Suspense>
        </Canvas>
      </SceneErrorBoundary>

      {/* Interior Top Header Banner & Exit Control */}
      {activeLocation === 'journal_interior' && (
        <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between p-3 rounded-2xl bg-[#faf7ef]/95 border border-[#dedcd0] shadow-xl text-[#273829]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#ebf0e5] border border-[#cfd7c7]">
              <BookOpen className="w-5 h-5 text-[#46613e]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#273829] font-serif-healing">
                Bên trong Nhà nhật ký
              </h4>
              <p className="text-[10px] sm:text-xs text-[#556b56]">
                Nhấn <kbd className="px-1 py-0.5 rounded bg-[#e8ede2] border border-[#cfd7c7] text-[10px]">E</kbd> hoặc chạm vào cuốn sổ trên bàn gỗ để viết
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('heali:open-helpline'))}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#9b3d2b] hover:bg-[#823020] text-white font-semibold text-sm shadow-sm transition"
            >
              Cần giúp ngay
            </button>
            <button
              type="button"
              onClick={() => onSelectZone('journal')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#46613e] hover:bg-[#384f31] text-white font-semibold text-xs shadow-sm transition"
            >
              Mở Sổ Nhật Ký
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveLocation('outdoor');
                setTeleportTarget((prev) => ({ x: 0, z: 0.8, seq: (prev?.seq ?? 0) + 1 }));
              }}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#eef1e8] hover:bg-white text-[#273829] border border-[#d2d9ca] text-xs font-medium transition"
            >
              <DoorOpen className="w-4 h-4 text-[#46613e]" />
              <span>Ra vườn</span>
            </button>
          </div>
        </div>
      )}

      {/* World Interactive HUD Overlay */}
      {activeLocation === 'outdoor' && (
        <WorldHUD
          weatherMode={weatherMode}
          onChangeWeatherMode={onChangeWeatherMode}
          currentZone={currentZone}
          featuredZone={SANCTUARY_ZONES[0]}
          allZones={SANCTUARY_ZONES}
          onInteractZone={handleInteractZone}
          onTeleportToZone={handleTeleportToZone}
          onQuickWriteJournal={() => onSelectZone('journal')}
          robeColor={robeColor}
          onUpdateRobeColor={setRobeColor}
          cameraMode={cameraMode}
          onChangeCameraMode={setCameraMode}
          isZenMode={isZenMode}
          onToggleZenMode={() => setIsZenMode(!isZenMode)}
          soundMuted={soundMuted}
          onToggleSound={handleToggleSound}
          onJoystickMove={(dx, dy) => setJoystickVector({ dx, dy })}
          onJoystickEnd={() => setJoystickVector({ dx: 0, dy: 0 })}
        />
      )}

      {/* Ambient Soul Whisper Dialogue Box */}
      {activeWhisper && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-md">
          <div className="p-4 rounded-2xl bg-[#faf7ef]/95 border border-[#dcd9cc] shadow-xl text-[#273829] space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#e5e3d8]">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#46613e]" />
                <span className="text-xs font-bold text-[#273829]">{activeWhisper.name}</span>
                <span className="text-[10px] text-[#5c725e]">· {activeWhisper.avatarRole}</span>
              </div>
              <button
                onClick={() => setActiveWhisper(null)}
                className="p-1 text-[#5c725e] hover:text-[#273829]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#3b4e3d] italic leading-relaxed font-serif-healing">
              “{activeWhisper.quote}”
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
