import * as THREE from 'three';
import type { WorldZone } from '../WorldEnvironment';
import type { WeatherMode } from '../DynamicWeatherOverlay';
import { SANCTUARY_ZONES } from './worldLayout';

export interface ZoneAtmospherePreset {
  id: WorldZone['id'];
  skyTop: THREE.Color;
  skyHorizon: THREE.Color;
  sunColor: THREE.Color;
  sunGlow: number;
  sunElevation: number; // -0.05..0.55
  sunAzimuth: number; // angle in XZ
  fogColor: THREE.Color;
  fogDensity: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  keyColor: THREE.Color;
  keyIntensity: number;
}

export const ZONE_ATMOSPHERE_PRESETS: Record<WorldZone['id'], ZoneAtmospherePreset> = {
  // Center Sky-Island Sanctuary: Clear sunlit blue sky & fresh sunlit mint horizon
  journal: {
    id: 'journal',
    skyTop: new THREE.Color('#4a86b8'),
    skyHorizon: new THREE.Color('#ddf0e4'),
    sunColor: new THREE.Color('#fff5d6'),
    sunGlow: 0.78,
    sunElevation: 0.34,
    sunAzimuth: -0.58,
    fogColor: new THREE.Color('#d2e6d9'),
    fogDensity: 0.0036,
    hemiSky: new THREE.Color('#e6f3f8'),
    hemiGround: new THREE.Color('#5a6b38'),
    hemiIntensity: 1.12,
    keyColor: new THREE.Color('#fff5de'),
    keyIntensity: 1.65,
  },
  // Hồ Hoa Đăng Sky-Island Lake
  lake: {
    id: 'lake',
    skyTop: new THREE.Color('#447fb2'),
    skyHorizon: new THREE.Color('#d8eee6'),
    sunColor: new THREE.Color('#fff0c8'),
    sunGlow: 0.82,
    sunElevation: 0.28,
    sunAzimuth: -0.52,
    fogColor: new THREE.Color('#cde4dc'),
    fogDensity: 0.0038,
    hemiSky: new THREE.Color('#e2f1f7'),
    hemiGround: new THREE.Color('#4b6745'),
    hemiIntensity: 1.08,
    keyColor: new THREE.Color('#fff2d4'),
    keyIntensity: 1.62,
  },
  // Western Lavender & Meadow Sanctuary
  community: {
    id: 'community',
    skyTop: new THREE.Color('#4f89ba'),
    skyHorizon: new THREE.Color('#e3f2e3'),
    sunColor: new THREE.Color('#fff7de'),
    sunGlow: 0.76,
    sunElevation: 0.36,
    sunAzimuth: -0.62,
    fogColor: new THREE.Color('#d6e9dc'),
    fogDensity: 0.0037,
    hemiSky: new THREE.Color('#e8f4f8'),
    hemiGround: new THREE.Color('#5e7240'),
    hemiIntensity: 1.12,
    keyColor: new THREE.Color('#fff6e0'),
    keyIntensity: 1.65,
  },
  // Ancient Wish Tree Terrace
  wishes: {
    id: 'wishes',
    skyTop: new THREE.Color('#4b85b7'),
    skyHorizon: new THREE.Color('#e6eed6'),
    sunColor: new THREE.Color('#ffeeb8'),
    sunGlow: 0.82,
    sunElevation: 0.31,
    sunAzimuth: -0.55,
    fogColor: new THREE.Color('#dbe8d6'),
    fogDensity: 0.0037,
    hemiSky: new THREE.Color('#e8f2f4'),
    hemiGround: new THREE.Color('#5b6d3c'),
    hemiIntensity: 1.1,
    keyColor: new THREE.Color('#fff1d2'),
    keyIntensity: 1.64,
  },
  // Northern Karst Highland Shrine
  spiritual_room: {
    id: 'spiritual_room',
    skyTop: new THREE.Color('#3d76a6'),
    skyHorizon: new THREE.Color('#d2e8ec'),
    sunColor: new THREE.Color('#f7f2dc'),
    sunGlow: 0.72,
    sunElevation: 0.32,
    sunAzimuth: -0.48,
    fogColor: new THREE.Color('#c8e0e2'),
    fogDensity: 0.0041,
    hemiSky: new THREE.Color('#dceef5'),
    hemiGround: new THREE.Color('#4d6346'),
    hemiIntensity: 1.05,
    keyColor: new THREE.Color('#faf4e2'),
    keyIntensity: 1.56,
  },
  // Eastern Tea Gazebo Orchard
  stranger_chat: {
    id: 'stranger_chat',
    skyTop: new THREE.Color('#528cbe'),
    skyHorizon: new THREE.Color('#e9f0d8'),
    sunColor: new THREE.Color('#fff3cf'),
    sunGlow: 0.8,
    sunElevation: 0.35,
    sunAzimuth: -0.5,
    fogColor: new THREE.Color('#dbe9d8'),
    fogDensity: 0.0036,
    hemiSky: new THREE.Color('#eaf4f6'),
    hemiGround: new THREE.Color('#617440'),
    hemiIntensity: 1.12,
    keyColor: new THREE.Color('#fff4db'),
    keyIntensity: 1.66,
  },
  // Memory Post Office Terrace
  letters: {
    id: 'letters',
    skyTop: new THREE.Color('#5592c4'),
    skyHorizon: new THREE.Color('#f2ebd0'),
    sunColor: new THREE.Color('#ffe7b3'),
    sunGlow: 0.84,
    sunElevation: 0.29,
    sunAzimuth: -0.45,
    fogColor: new THREE.Color('#e2ead6'),
    fogDensity: 0.0037,
    hemiSky: new THREE.Color('#ecf3f2'),
    hemiGround: new THREE.Color('#647242'),
    hemiIntensity: 1.1,
    keyColor: new THREE.Color('#fff0cf'),
    keyIntensity: 1.64,
  },
  // Rain & Breath Conservatory
  rain_room: {
    id: 'rain_room',
    skyTop: new THREE.Color('#477fa8'),
    skyHorizon: new THREE.Color('#cce4e2'),
    sunColor: new THREE.Color('#f2f6e6'),
    sunGlow: 0.54,
    sunElevation: 0.3,
    sunAzimuth: -0.56,
    fogColor: new THREE.Color('#c6dedc'),
    fogDensity: 0.0046,
    hemiSky: new THREE.Color('#dfeef2'),
    hemiGround: new THREE.Color('#4a664b'),
    hemiIntensity: 1.04,
    keyColor: new THREE.Color('#f2f7ec'),
    keyIntensity: 1.46,
  },
  // Listening Alcove
  listening_alcove: {
    id: 'listening_alcove',
    skyTop: new THREE.Color('#4b87b8'),
    skyHorizon: new THREE.Color('#dcefe4'),
    sunColor: new THREE.Color('#fff3d4'),
    sunGlow: 0.76,
    sunElevation: 0.33,
    sunAzimuth: -0.58,
    fogColor: new THREE.Color('#d2e6da'),
    fogDensity: 0.0038,
    hemiSky: new THREE.Color('#e5f3f7'),
    hemiGround: new THREE.Color('#596c3c'),
    hemiIntensity: 1.1,
    keyColor: new THREE.Color('#fff4dc'),
    keyIntensity: 1.62,
  },
  // Personal Garden Terrace
  personal_garden: {
    id: 'personal_garden',
    skyTop: new THREE.Color('#528ec0'),
    skyHorizon: new THREE.Color('#e4f2de'),
    sunColor: new THREE.Color('#fff6d8'),
    sunGlow: 0.8,
    sunElevation: 0.36,
    sunAzimuth: -0.6,
    fogColor: new THREE.Color('#d7eadb'),
    fogDensity: 0.0035,
    hemiSky: new THREE.Color('#eaf5f7'),
    hemiGround: new THREE.Color('#5f733e'),
    hemiIntensity: 1.14,
    keyColor: new THREE.Color('#fff6df'),
    keyIntensity: 1.68,
  },
};

function addScaledColor(out: THREE.Color, src: THREE.Color, w: number): void {
  out.r += src.r * w;
  out.g += src.g * w;
  out.b += src.b * w;
}

export interface BlendedAtmosphere {
  skyTop: THREE.Color;
  skyHorizon: THREE.Color;
  sunColor: THREE.Color;
  sunGlow: number;
  sunDir: THREE.Vector3;
  fogColor: THREE.Color;
  fogDensity: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  keyColor: THREE.Color;
  keyIntensity: number;
}

const _rainTintTop = new THREE.Color('#4e687e');
const _rainTintHor = new THREE.Color('#c2d6d8');
const _nightTintTop = new THREE.Color('#182b49');
const _nightTintHor = new THREE.Color('#476b8a');
const _mistTintHor = new THREE.Color('#e2efe9');

/**
 * Smoothly blends zone atmospheric moods based on avatar world XZ position,
 * preserving the clear sunlit blue sky, emerald meadow greens, and sea-of-clouds haze.
 */
export function computeTargetAtmosphere(
  avatarX: number,
  avatarZ: number,
  weatherMode: WeatherMode,
  out: BlendedAtmosphere
): void {
  out.skyTop.setRGB(0, 0, 0);
  out.skyHorizon.setRGB(0, 0, 0);
  out.sunColor.setRGB(0, 0, 0);
  out.fogColor.setRGB(0, 0, 0);
  out.hemiSky.setRGB(0, 0, 0);
  out.hemiGround.setRGB(0, 0, 0);
  out.keyColor.setRGB(0, 0, 0);

  let sunGlowAcc = 0;
  let sunElevAcc = 0;
  let sunAzimSin = 0;
  let sunAzimCos = 0;
  let fogDensAcc = 0;
  let hemiIntAcc = 0;
  let keyIntAcc = 0;
  let weightSum = 0;

  for (const zone of SANCTUARY_ZONES) {
    const preset = ZONE_ATMOSPHERE_PRESETS[zone.id];
    if (!preset) continue;
    const dist = Math.hypot(avatarX - zone.position.x, avatarZ - zone.position.z);
    const w = 1 / (1 + Math.pow(dist / 13.5, 2.35));
    weightSum += w;

    addScaledColor(out.skyTop, preset.skyTop, w);
    addScaledColor(out.skyHorizon, preset.skyHorizon, w);
    addScaledColor(out.sunColor, preset.sunColor, w);
    addScaledColor(out.fogColor, preset.fogColor, w);
    addScaledColor(out.hemiSky, preset.hemiSky, w);
    addScaledColor(out.hemiGround, preset.hemiGround, w);
    addScaledColor(out.keyColor, preset.keyColor, w);

    sunGlowAcc += preset.sunGlow * w;
    sunElevAcc += preset.sunElevation * w;
    sunAzimSin += Math.sin(preset.sunAzimuth) * w;
    sunAzimCos += Math.cos(preset.sunAzimuth) * w;
    fogDensAcc += preset.fogDensity * w;
    hemiIntAcc += preset.hemiIntensity * w;
    keyIntAcc += preset.keyIntensity * w;
  }

  const inv = weightSum > 0.0001 ? 1 / weightSum : 1;
  out.skyTop.multiplyScalar(inv);
  out.skyHorizon.multiplyScalar(inv);
  out.sunColor.multiplyScalar(inv);
  out.fogColor.multiplyScalar(inv);
  out.hemiSky.multiplyScalar(inv);
  out.hemiGround.multiplyScalar(inv);
  out.keyColor.multiplyScalar(inv);

  out.sunGlow = sunGlowAcc * inv;
  const sunElev = sunElevAcc * inv;
  const sunAzim = Math.atan2(sunAzimSin * inv, sunAzimCos * inv);
  out.fogDensity = fogDensAcc * inv;
  out.hemiIntensity = hemiIntAcc * inv;
  out.keyIntensity = keyIntAcc * inv;

  // Bright azure-mint coastal breeze near SE sky lagoon (x > 24, z > 38)
  const coastDist = Math.hypot(avatarX - 38, avatarZ - 47);
  if (coastDist < 26) {
    const coastWeight = (1 - THREE.MathUtils.clamp(coastDist / 26, 0, 1)) * 0.55;
    out.skyTop.lerp(new THREE.Color('#3f8ec4'), coastWeight);
    out.skyHorizon.lerp(new THREE.Color('#cceef6'), coastWeight);
    out.fogColor.lerp(new THREE.Color('#cce8ec'), coastWeight);
    out.sunColor.lerp(new THREE.Color('#fff5d6'), coastWeight);
    out.keyColor.lerp(new THREE.Color('#fff6e0'), coastWeight);
    out.sunGlow = THREE.MathUtils.lerp(out.sunGlow, 0.84, coastWeight);
    out.fogDensity = THREE.MathUtils.lerp(out.fogDensity, 0.0033, coastWeight);
  }

  out.sunDir
    .set(Math.sin(sunAzim) * Math.cos(sunElev), Math.sin(sunElev), -Math.cos(sunAzim) * Math.cos(sunElev))
    .normalize();

  if (weatherMode === 'rain') {
    out.skyTop.lerp(_rainTintTop, 0.52);
    out.skyHorizon.lerp(_rainTintHor, 0.52);
    out.fogColor.lerp(_rainTintHor, 0.52);
    out.fogDensity = Math.max(out.fogDensity, 0.0052);
    out.sunGlow *= 0.4;
    out.keyIntensity *= 0.78;
  } else if (weatherMode === 'mist') {
    out.skyHorizon.lerp(_mistTintHor, 0.48);
    out.fogColor.lerp(_mistTintHor, 0.54);
    out.fogDensity = Math.max(out.fogDensity, 0.0062);
    out.sunGlow *= 0.72;
  } else if (weatherMode === 'fireflies') {
    out.skyTop.lerp(_nightTintTop, 0.68);
    out.skyHorizon.lerp(_nightTintHor, 0.58);
    out.fogColor.lerp(_nightTintHor, 0.58);
    out.fogDensity = Math.max(out.fogDensity, 0.0048);
    out.sunColor.set('#fef3c7');
    out.sunGlow = 0.55;
    out.hemiSky.set('#8ab4d8');
    out.hemiIntensity *= 0.78;
    out.keyColor.set('#dbeafe');
    out.keyIntensity *= 0.68;
  }
}
