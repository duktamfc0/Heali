import * as THREE from 'three';
import type { WorldZone } from '../WorldEnvironment';

export const VALLEY_PLAYABLE_RADIUS = 72;
export const LAKE_CENTER = { x: 0, z: 34 };
export const LAKE_RADIUS_X = 18.5;
export const LAKE_RADIUS_Z = 14.5;

/**
 * Analytical meandering stream center X(z) flowing from NE mountain cascade (z=-55)
 * down into the eastern cove of Ho Hoa Dang (z=32).
 */
export function streamCenterX(z: number): number {
  const t = THREE.MathUtils.clamp((z + 55) / 87, 0, 1);
  return 52 * (1 - t) + 10 * t + Math.sin(z * 0.085) * 4.2;
}

/**
 * Signed distance from any (x, z) to the brook centerline (approx horizontal offset scaled by slope angle).
 */
export function distanceToStream(x: number, z: number): number {
  if (z < -56 || z > 32) return 999;
  const cx = streamCenterX(z);
  const dx = x - cx;
  // Estimate curve tangent dx/dz for perpendicular distance approximation
  const slope = -42 / 87 + Math.cos(z * 0.085) * 0.085 * 4.2;
  const invNorm = 1 / Math.sqrt(1 + slope * slope);
  return Math.abs(dx) * invNorm;
}

/**
 * Normalized radial distance inside the elliptical lantern lake (<1 means inside water basin).
 */
export function lakeNormDist(x: number, z: number): number {
  const dx = (x - LAKE_CENTER.x) / LAKE_RADIUS_X;
  const dz = (z - LAKE_CENTER.z) / LAKE_RADIUS_Z;
  // Slight organic shoreline undulation
  const angle = Math.atan2(dz, dx);
  const wobble = 1 + 0.06 * Math.sin(angle * 3 + 0.7) + 0.04 * Math.cos(angle * 5 - 1.1);
  return Math.sqrt(dx * dx + dz * dz) / wobble;
}

export interface BridgeSpec {
  id: string;
  x: number;
  z: number;
  rotY: number;
  length: number;
  width: number;
  archHeight: number;
  baseY: number;
}

function computeStreamCrossingAngle(z: number): number {
  const dx = streamCenterX(z + 0.5) - streamCenterX(z - 0.5);
  // Stream tangent points along (dx, 1); bridge spans perpendicular (1, -dx) -> angle from +X axis
  return Math.atan2(-dx, 1);
}

export const WORLD_BRIDGES: BridgeSpec[] = [
  {
    id: 'bridge_meadow',
    x: streamCenterX(6),
    z: 6,
    rotY: computeStreamCrossingAngle(6) - Math.PI * 0.06,
    length: 8.6,
    width: 2.35,
    archHeight: 0.92,
    baseY: 0.62,
  },
  {
    id: 'bridge_bamboo',
    x: streamCenterX(-20),
    z: -20,
    rotY: computeStreamCrossingAngle(-20) + Math.PI * 0.05,
    length: 8.8,
    width: 2.25,
    archHeight: 0.96,
    baseY: 1.05,
  },
];

// Flat pad centers blended smoothly into terrain heightmap so every building sits flush
interface BuildingPad {
  x: number;
  z: number;
  targetY: number;
  flatRadius: number;
  blendRadius: number;
}

const BUILDING_PADS: BuildingPad[] = [
  { x: 0, z: -4, targetY: 0.68, flatRadius: 4.6, blendRadius: 9.0 },        // Nha Nhat Ky
  { x: -32, z: -2, targetY: 1.25, flatRadius: 4.8, blendRadius: 9.5 },      // Vuon Tam Tinh
  { x: -28, z: 24, targetY: 1.18, flatRadius: 4.2, blendRadius: 8.5 },      // Cay Uoc Nguyen
  { x: -16, z: -34, targetY: 3.15, flatRadius: 5.2, blendRadius: 12.0 },    // Phong Tam Linh (Elevated Hilltop Terrace)
  { x: 44, z: -22, targetY: 1.55, flatRadius: 4.5, blendRadius: 9.5 },      // Goc Gap Go (Bamboo Tea Pavilion)
  { x: 40, z: 12, targetY: 1.12, flatRadius: 4.8, blendRadius: 9.5 },       // Buu Dien Ky Uc
  { x: 26, z: 32, targetY: 0.72, flatRadius: 4.5, blendRadius: 8.8 },       // Can Phong Mua (Lakeshore Conservatory)
];

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Shared Valley Terrain Heightmap f(x, z).
 * Used identically by terrain mesh, avatar walker, trees, shrubs, flowers, rocks, fences, and buildings.
 */
export function groundHeightAt(x: number, z: number): number {
  // Base gentle undulating valley floor
  const broadHills =
    Math.sin(x * 0.042 + 0.4) * 0.65 +
    Math.cos(z * 0.048 - 0.3) * 0.65 +
    Math.sin((x - z) * 0.028) * 0.55;

  const microRelief =
    Math.sin(x * 0.16) * 0.11 +
    Math.cos(z * 0.18) * 0.11 +
    Math.sin((x + z) * 0.11) * 0.08;

  // Slope downward toward southern lake & gentle rise toward northern foothills
  const northSlope = THREE.MathUtils.clamp((-z - 8) * 0.055, 0, 2.4);
  let y = 0.78 + broadHills * 0.48 + microRelief + northSlope;

  // Elevated foothill plateau behind Spiritual Sanctuary & North edge
  const dSpirit = Math.hypot(x + 16, z + 34);
  if (dSpirit < 18) {
    const mound = (1 - smoothstep(5.5, 18, dSpirit)) * 1.45;
    y += mound;
  }

  // Outer perimeter foothill rise (for r > 60) framing the open valley naturally
  const rCenter = Math.hypot(x, z);
  if (rCenter > 56) {
    const rimT = smoothstep(56, 98, rCenter);
    const peakWave = 1 + 0.35 * Math.sin(Math.atan2(z, x) * 5 + 1.1) + 0.2 * Math.cos(x * 0.08);
    y += rimT * rimT * 14.5 * peakWave;
  }

  // Smooth building terrace pads
  for (const pad of BUILDING_PADS) {
    const d = Math.hypot(x - pad.x, z - pad.z);
    if (d < pad.blendRadius) {
      const w = 1 - smoothstep(pad.flatRadius, pad.blendRadius, d);
      y = THREE.MathUtils.lerp(y, pad.targetY, w);
    }
  }

  // Carve winding brook channel into terrain (below water surface y=0.0)
  const dStream = distanceToStream(x, z);
  if (dStream < 5.2 && z > -52) {
    const channelT = 1 - smoothstep(1.85, 5.2, dStream);
    // Keep waterfall head slightly elevated north of z=-45
    const bedDepth = z < -44 ? -0.2 : -0.82;
    y = THREE.MathUtils.lerp(y, bedDepth, channelT);
  }

  // Carve Ho Hoa Dang Lake basin
  const lDist = lakeNormDist(x, z);
  if (lDist < 1.24) {
    const basinT = 1 - smoothstep(0.86, 1.24, lDist);
    y = THREE.MathUtils.lerp(y, -1.25, basinT);
  }

  return y;
}

/**
 * Returns deck height if (x, z) is standing on the Lake Pier or either Arched Wooden Bridge.
 */
export function walkableSurfaceHeightAt(x: number, z: number): number {
  // 1. Check Lakeside Wooden Pier: x in [-1.25, 1.25], z in [19.4, 26.8]
  if (Math.abs(x) <= 1.25 && z >= 19.2 && z <= 27.0) {
    return 0.42;
  }

  // 2. Check Arched Wooden Bridges
  for (const b of WORLD_BRIDGES) {
    const dx = x - b.x;
    const dz = z - b.z;
    const cos = Math.cos(-b.rotY);
    const sin = Math.sin(-b.rotY);
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;
    if (Math.abs(localX) <= b.length * 0.52 && Math.abs(localZ) <= b.width * 0.55) {
      const t = THREE.MathUtils.clamp((localX + b.length / 2) / b.length, 0, 1);
      return b.baseY + b.archHeight * Math.sin(t * Math.PI) + 0.14;
    }
  }

  return groundHeightAt(x, z);
}

export function isOnBridgeOrPier(x: number, z: number): boolean {
  if (Math.abs(x) <= 1.25 && z >= 19.2 && z <= 27.0) return true;
  for (const b of WORLD_BRIDGES) {
    const dx = x - b.x;
    const dz = z - b.z;
    const cos = Math.cos(-b.rotY);
    const sin = Math.sin(-b.rotY);
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;
    if (Math.abs(localX) <= b.length * 0.54 && Math.abs(localZ) <= b.width * 0.56) {
      return true;
    }
  }
  return false;
}

export const SANCTUARY_ZONES: WorldZone[] = [
  {
    id: 'journal',
    name: 'Nhà nhật ký',
    subtitle: 'Gian phòng gỗ ấm áp giữa đồng hoa',
    position: new THREE.Vector3(0, 0, 0.2),
    radius: 4.2,
    promptText: 'Ghé vào nhà',
    iconName: 'BookOpen',
  },
  {
    id: 'lake',
    name: 'Hồ hoa đăng',
    subtitle: 'Thả trôi ưu phiền & gửi gắm lời nguyện cầu',
    position: new THREE.Vector3(0, 0, 23.5),
    radius: 4.4,
    promptText: 'Thả hoa đăng',
    iconName: 'Waves',
  },
  {
    id: 'community',
    name: 'Vườn tâm tình',
    subtitle: 'Đồi hoa oải hương & sẻ chia ẩn danh',
    position: new THREE.Vector3(-32, 0, -2),
    radius: 4.8,
    promptText: 'Vào khu vườn',
    iconName: 'MessageSquareHeart',
  },
  {
    id: 'wishes',
    name: 'Cây ước nguyện',
    subtitle: 'Cội cổ thụ ven hồ & dải lụa cam kết',
    position: new THREE.Vector3(-28, 0, 24),
    radius: 4.8,
    promptText: 'Treo thẻ ước',
    iconName: 'TreeDeciduous',
  },
  {
    id: 'spiritual_room',
    name: 'Phòng tâm linh',
    subtitle: 'Đài thiền trên đồi thông nhìn xuống thung lũng',
    position: new THREE.Vector3(-16, 0, -34),
    radius: 4.6,
    promptText: 'Vào phòng tâm linh',
    iconName: 'Sparkles',
  },
  {
    id: 'stranger_chat',
    name: 'Góc gặp gỡ',
    subtitle: 'Trà thất bên suối trúc & trò chuyện 1:1',
    position: new THREE.Vector3(44, 0, -22),
    radius: 4.6,
    promptText: 'Trò chuyện ngay',
    iconName: 'MessageCircle',
  },
  {
    id: 'letters',
    name: 'Bưu điện ký ức',
    subtitle: 'Ngôi nhà bên vườn đào & hòm thư chưa gửi',
    position: new THREE.Vector3(40, 0, 12),
    radius: 4.6,
    promptText: 'Viết thư chưa gửi',
    iconName: 'Mail',
  },
  {
    id: 'rain_room',
    name: 'Căn phòng mưa',
    subtitle: 'Nhà kính bên vịnh liễu & thanh âm mưa rơi',
    position: new THREE.Vector3(26, 0, 32),
    radius: 4.6,
    promptText: 'Nghe thanh âm',
    iconName: 'CloudRain',
  },
];

// Winding Scenic Footpath Splines connecting all zones cleanly across meadows, stairs, and bridges
export const PATH_ROUTES: THREE.Vector3[][] = [
  // 1. Central Crossroads (0, 3) -> Nha Nhat Ky (0, -0.5)
  [
    new THREE.Vector3(0, 0, 6),
    new THREE.Vector3(-0.6, 0, 3.0),
    new THREE.Vector3(0, 0, 0.2),
  ],
  // 2. Central Crossroads (0, 6) -> Ho Hoa Dang Pier (0, 20.5)
  [
    new THREE.Vector3(0, 0, 6),
    new THREE.Vector3(0.9, 0, 11.5),
    new THREE.Vector3(-0.5, 0, 16.5),
    new THREE.Vector3(0, 0, 20.2),
  ],
  // 3. Central Meadow -> Vuon Tam Tinh (-32, -2) through Lavender Meadow
  [
    new THREE.Vector3(-2.5, 0, 3.5),
    new THREE.Vector3(-10.5, 0, 4.2),
    new THREE.Vector3(-19.5, 0, 1.5),
    new THREE.Vector3(-27.5, 0, -1.0),
    new THREE.Vector3(-30.5, 0, -1.8),
  ],
  // 4. Vuon Tam Tinh (-32, -2) -> Cay Uoc Nguyen (-28, 24) along Western Grove
  [
    new THREE.Vector3(-32, 0, 2.5),
    new THREE.Vector3(-33, 0, 10.5),
    new THREE.Vector3(-30.5, 0, 17.5),
    new THREE.Vector3(-28, 0, 22.0),
  ],
  // 5. Cay Uoc Nguyen (-28, 24) -> Lakeside Pier (0, 20.2)
  [
    new THREE.Vector3(-24.5, 0, 24.5),
    new THREE.Vector3(-16.5, 0, 22.8),
    new THREE.Vector3(-8.5, 0, 20.8),
    new THREE.Vector3(0, 0, 20.2),
  ],
  // 6. Central Meadow -> Phong Tam Linh Foothill Stairs (-16, -34)
  [
    new THREE.Vector3(-3.5, 0, -2.5),
    new THREE.Vector3(-7.0, 0, -10.5),
    new THREE.Vector3(-11.0, 0, -19.5),
    new THREE.Vector3(-14.5, 0, -26.5),
    new THREE.Vector3(-16.0, 0, -30.5),
  ],
  // 7. Central Meadow -> Bridge 1 -> Buu Dien Ky Uc (40, 12)
  [
    new THREE.Vector3(2.8, 0, 2.8),
    new THREE.Vector3(10.5, 0, 5.2),
    new THREE.Vector3(WORLD_BRIDGES[0].x - 4.0, 0, WORLD_BRIDGES[0].z - 0.6),
  ],
  [
    new THREE.Vector3(WORLD_BRIDGES[0].x + 4.0, 0, WORLD_BRIDGES[0].z + 0.8),
    new THREE.Vector3(31.5, 0, 8.8),
    new THREE.Vector3(37.5, 0, 11.4),
  ],
  // 8. Central Meadow -> Bridge 2 -> Bamboo Tea Pavilion (44, -22)
  [
    new THREE.Vector3(4.5, 0, -6.5),
    new THREE.Vector3(13.5, 0, -13.5),
    new THREE.Vector3(21.5, 0, -18.0),
    new THREE.Vector3(WORLD_BRIDGES[1].x - 4.1, 0, WORLD_BRIDGES[1].z - 0.5),
  ],
  [
    new THREE.Vector3(WORLD_BRIDGES[1].x + 4.1, 0, WORLD_BRIDGES[1].z - 0.4),
    new THREE.Vector3(38.0, 0, -21.2),
    new THREE.Vector3(42.2, 0, -22.0),
  ],
  // 9. Buu Dien Ky Uc (40, 12) -> Can Phong Mua (26, 32)
  [
    new THREE.Vector3(39.0, 0, 15.5),
    new THREE.Vector3(36.0, 0, 22.5),
    new THREE.Vector3(30.5, 0, 28.5),
    new THREE.Vector3(27.0, 0, 30.8),
  ],
  // 10. Pier Shore (0, 20.2) -> Can Phong Mua (26, 32) along South-East Shore
  [
    new THREE.Vector3(2.5, 0, 20.5),
    new THREE.Vector3(10.5, 0, 19.5),
    new THREE.Vector3(19.5, 0, 24.5),
    new THREE.Vector3(24.5, 0, 29.8),
  ],
];

// Solid obstacle circles for avatar collision (all spaced cleanly!)
export const WORLD_OBSTACLES: Array<{ x: number; z: number; radius: number }> = [
  { x: 0, z: -4, radius: 3.1 },        // Nha Nhat Ky
  { x: -3.2, z: -1.6, radius: 1.0 },   // Outdoor armchair & tea table
  { x: -32, z: -2, radius: 3.2 },      // Vuon Tam Tinh pavilion
  { x: -28, z: 24, radius: 2.2 },      // Cay Uoc Nguyen trunk
  { x: -16, z: -34, radius: 3.1 },     // Phong Tam Linh pavilion
  { x: 44, z: -22, radius: 3.0 },      // Goc Gap Go tea pavilion
  { x: 40, z: 12, radius: 3.1 },       // Buu Dien Ky Uc
  { x: 26, z: 32, radius: 3.1 },       // Can Phong Mua glasshouse
];
