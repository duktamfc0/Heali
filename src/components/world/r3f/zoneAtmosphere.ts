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
  // Panel 1: Crisp sunlit emerald countryside meadow & green mountain morning
  journal: {
    id: 'journal',
    skyTop: new THREE.Color('#4a86b8'),
    skyHorizon: new THREE.Color('#ddf0e4'),
    sunColor: new THREE.Color('#fff5d6'),
    sunGlow: 0.72,
    sunElevation: 0.34,
    sunAzimuth: -0.75,
    fogColor: new THREE.Color('#d2e6d9'),
    fogDensity: 0.0044,
    hemiSky: new THREE.Color('#edf7f3'),
    hemiGround: new THREE.Color('#5a6b38'),
    hemiIntensity: 1.18,
    keyColor: new THREE.Color('#fff4d8'),
    keyIntensity: 1.85,
  },
  // Panel 2: Golden sunset lotus lake, misty karst peaks & waterside pavilion
  lake: {
    id: 'lake',
    skyTop: new THREE.Color('#516c9e'),
    skyHorizon: new THREE.Color('#f7cf92'),
    sunColor: new THREE.Color('#ffb954'),
    sunGlow: 1.15,
    sunElevation: 0.14,
    sunAzimuth: 0.35,
    fogColor: new THREE.Color('#e8cfa8'),
    fogDensity: 0.0047,
    hemiSky: new THREE.Color('#ffe8c8'),
    hemiGround: new THREE.Color('#566143'),
    hemiIntensity: 1.05,
    keyColor: new THREE.Color('#ffd391'),
    keyIntensity: 1.95,
  },
  // Lavender meadow rotunda under soft lilac-blue alpine afternoon
  community: {
    id: 'community',
    skyTop: new THREE.Color('#5468a6'),
    skyHorizon: new THREE.Color('#e3d7ee'),
    sunColor: new THREE.Color('#fff0df'),
    sunGlow: 0.65,
    sunElevation: 0.28,
    sunAzimuth: -1.1,
    fogColor: new THREE.Color('#dcd4e7'),
    fogDensity: 0.0047,
    hemiSky: new THREE.Color('#efe7f8'),
    hemiGround: new THREE.Color('#5b6149'),
    hemiIntensity: 1.12,
    keyColor: new THREE.Color('#ffeedb'),
    keyIntensity: 1.72,
  },
  // Jade lake shore & Ancient Wish Tree with turquoise reflections
  wishes: {
    id: 'wishes',
    skyTop: new THREE.Color('#4288b5'),
    skyHorizon: new THREE.Color('#d4eee9'),
    sunColor: new THREE.Color('#fff4c4'),
    sunGlow: 0.85,
    sunElevation: 0.26,
    sunAzimuth: -0.45,
    fogColor: new THREE.Color('#cce6de'),
    fogDensity: 0.0043,
    hemiSky: new THREE.Color('#e5f7f3'),
    hemiGround: new THREE.Color('#556b42'),
    hemiIntensity: 1.16,
    keyColor: new THREE.Color('#fff2cc'),
    keyIntensity: 1.82,
  },
  // Panel 3: High misty mountain pine cliff, cascading waterfalls & white cranes
  spiritual_room: {
    id: 'spiritual_room',
    skyTop: new THREE.Color('#3b5185'),
    skyHorizon: new THREE.Color('#cedaf0'),
    sunColor: new THREE.Color('#ffe7c7'),
    sunGlow: 0.78,
    sunElevation: 0.22,
    sunAzimuth: -0.95,
    fogColor: new THREE.Color('#c8d6ea'),
    fogDensity: 0.0054,
    hemiSky: new THREE.Color('#dbe6fa'),
    hemiGround: new THREE.Color('#495c4e'),
    hemiIntensity: 1.04,
    keyColor: new THREE.Color('#ffeed9'),
    keyIntensity: 1.58,
  },
  // Panel 4: Vibrant emerald-turquoise bamboo cascade valley & highland stream
  stranger_chat: {
    id: 'stranger_chat',
    skyTop: new THREE.Color('#3c8cc2'),
    skyHorizon: new THREE.Color('#d7f4ee'),
    sunColor: new THREE.Color('#fff9dc'),
    sunGlow: 0.82,
    sunElevation: 0.38,
    sunAzimuth: 0.85,
    fogColor: new THREE.Color('#ceeae2'),
    fogDensity: 0.0044,
    hemiSky: new THREE.Color('#e7fbf6'),
    hemiGround: new THREE.Color('#536e42'),
    hemiIntensity: 1.2,
    keyColor: new THREE.Color('#fff9e2'),
    keyIntensity: 1.88,
  },
  // Crimson plum blossom orchard & warm rose-gold dusk
  letters: {
    id: 'letters',
    skyTop: new THREE.Color('#645e96'),
    skyHorizon: new THREE.Color('#f7ced3'),
    sunColor: new THREE.Color('#ffcaa6'),
    sunGlow: 0.92,
    sunElevation: 0.19,
    sunAzimuth: 0.95,
    fogColor: new THREE.Color('#ebd2d6'),
    fogDensity: 0.0047,
    hemiSky: new THREE.Color('#fbe4e6'),
    hemiGround: new THREE.Color('#5d5846'),
    hemiIntensity: 1.08,
    keyColor: new THREE.Color('#ffe2cc'),
    keyIntensity: 1.74,
  },
  // Glass conservatory by willow bay in soft slate-jade rainlight
  rain_room: {
    id: 'rain_room',
    skyTop: new THREE.Color('#466778'),
    skyHorizon: new THREE.Color('#b6cfc9'),
    sunColor: new THREE.Color('#ddeee9'),
    sunGlow: 0.35,
    sunElevation: 0.25,
    sunAzimuth: 0.4,
    fogColor: new THREE.Color('#b1cbc6'),
    fogDensity: 0.006,
    hemiSky: new THREE.Color('#d2e5e0'),
    hemiGround: new THREE.Color('#4a5f51'),
    hemiIntensity: 1.02,
    keyColor: new THREE.Color('#e2f0ec'),
    keyIntensity: 1.38,
  },
  // Serene riverside listening cove
  listening_alcove: {
    id: 'listening_alcove',
    skyTop: new THREE.Color('#4a83b0'),
    skyHorizon: new THREE.Color('#d2ece6'),
    sunColor: new THREE.Color('#fff2cf'),
    sunGlow: 0.7,
    sunElevation: 0.27,
    sunAzimuth: 0.55,
    fogColor: new THREE.Color('#cce4df'),
    fogDensity: 0.0046,
    hemiSky: new THREE.Color('#e2f4f0'),
    hemiGround: new THREE.Color('#516645'),
    hemiIntensity: 1.12,
    keyColor: new THREE.Color('#fff0d6'),
    keyIntensity: 1.68,
  },
  // Sunlit personal sanctuary garden with flowers & calm terrace
  personal_garden: {
    id: 'personal_garden',
    skyTop: new THREE.Color('#4c90c2'),
    skyHorizon: new THREE.Color('#e4f2dd'),
    sunColor: new THREE.Color('#fff4c8'),
    sunGlow: 0.78,
    sunElevation: 0.35,
    sunAzimuth: -0.3,
    fogColor: new THREE.Color('#d7ebd9'),
    fogDensity: 0.0042,
    hemiSky: new THREE.Color('#eef8ef'),
    hemiGround: new THREE.Color('#5a6d3c'),
    hemiIntensity: 1.18,
    keyColor: new THREE.Color('#fff4d6'),
    keyIntensity: 1.82,
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

const _rainTintTop = new THREE.Color('#4d6973');
const _rainTintHor = new THREE.Color('#aac3be');
const _nightTintTop = new THREE.Color('#1f2c48');
const _nightTintHor = new THREE.Color('#6a7f99');
const _mistTintHor = new THREE.Color('#dceae4');

/**
 * Smoothly blends zone atmospheric moods based on avatar world XZ position,
 * then applies subtle weatherMode modifiers so moving between corners transforms
 * the light, sky sunset/emerald palette, sun height, and mist organically.
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
    // Smooth Gaussian-like influence so entering a zone (~8m) strongly reflects its mood
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
  out.sunDir
    .set(Math.sin(sunAzim) * Math.cos(sunElev), Math.sin(sunElev), -Math.cos(sunAzim) * Math.cos(sunElev))
    .normalize();
  out.fogDensity = fogDensAcc * inv;
  out.hemiIntensity = hemiIntAcc * inv;
  out.keyIntensity = keyIntAcc * inv;

  // Apply gentle weather overlays on top of zone atmosphere
  if (weatherMode === 'rain') {
    out.skyTop.lerp(_rainTintTop, 0.55);
    out.skyHorizon.lerp(_rainTintHor, 0.55);
    out.fogColor.lerp(_rainTintHor, 0.55);
    out.fogDensity = Math.max(out.fogDensity, 0.0064);
    out.sunGlow *= 0.32;
    out.keyIntensity *= 0.72;
  } else if (weatherMode === 'mist') {
    out.skyHorizon.lerp(_mistTintHor, 0.45);
    out.fogColor.lerp(_mistTintHor, 0.5);
    out.fogDensity = Math.max(out.fogDensity, 0.0076);
    out.sunGlow *= 0.65;
  } else if (weatherMode === 'fireflies') {
    out.skyTop.lerp(_nightTintTop, 0.72);
    out.skyHorizon.lerp(_nightTintHor, 0.62);
    out.fogColor.lerp(_nightTintHor, 0.62);
    out.fogDensity = Math.max(out.fogDensity, 0.0056);
    out.sunColor.set('#fef3c7');
    out.sunGlow = 0.55;
    out.hemiSky.set('#a8bad6');
    out.hemiIntensity *= 0.78;
    out.keyColor.set('#dbeafe');
    out.keyIntensity *= 0.62;
  }
}
