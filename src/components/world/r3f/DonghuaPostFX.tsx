import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { liveSceneActivity } from './roomTypes';
import { liveAvatarWorldPos } from './R3FNature';
import { streamCenterX } from './worldLayout';

const DonghuaColorGradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uVignette: { value: 0.2 },
    uSaturation: { value: 1.07 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uVignette;
    uniform float uSaturation;
    varying vec2 vUv;

    void main() {
      // Subtle optical chromatic aberration towards screen edges
      vec2 centered = vUv - 0.5;
      float distSq = dot(centered, centered);
      vec2 caOffset = centered * distSq * 0.0028;

      float r = texture2D(tDiffuse, vUv + caOffset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - caOffset).b;
      float a = texture2D(tDiffuse, vUv).a;
      vec3 col = vec3(r, g, b);

      // Sunlit Donghua Sky-Island color grade (cool teal shadows, warm sunlit cream highlights)
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(luma), col, uSaturation);
      vec3 shadowTint = vec3(0.95, 0.99, 1.03);
      vec3 highTint = vec3(1.04, 1.01, 0.95);
      col *= mix(shadowTint, highTint, smoothstep(0.14, 0.88, luma));

      // Gentle radial lens vignette
      float vig = clamp(1.0 - distSq * uVignette * 2.0, 0.66, 1.0);
      col *= vig;

      gl_FragColor = vec4(col, a);
    }
  `,
};

/**
 * Selective HDR UnrealBloom + Cinematic Donghua Color Grading + OutputPass.
 * High bloom threshold (1.22) keeps indoor walls/floors crisp and free of white-out glare.
 */
export const DonghuaPostProcessing: React.FC = () => {
  const { gl, scene, camera, size } = useThree();

  const { composer, renderTarget, renderPass, bloomPass, gradePass, outputPass } = useMemo(() => {
    const rt = new THREE.WebGLRenderTarget(
      Math.max(1, size.width),
      Math.max(1, size.height),
      {
        type: THREE.HalfFloatType,
        samples: gl.capabilities.isWebGL2 ? 4 : 0,
      }
    );
    const comp = new EffectComposer(gl, rt);
    const rPass = new RenderPass(scene, camera);
    const bPass = new UnrealBloomPass(
      new THREE.Vector2(Math.max(1, size.width), Math.max(1, size.height)),
      0.2,
      0.38,
      1.22
    );
    const gPass = new ShaderPass(DonghuaColorGradeShader);
    const oPass = new OutputPass();

    comp.addPass(rPass);
    comp.addPass(bPass);
    comp.addPass(gPass);
    comp.addPass(oPass);

    return {
      composer: comp,
      renderTarget: rt,
      renderPass: rPass,
      bloomPass: bPass,
      gradePass: gPass,
      outputPass: oPass,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);

  useEffect(() => {
    const dpr = Math.min(gl.getPixelRatio(), 1.75);
    composer.setPixelRatio(dpr);
    composer.setSize(Math.max(1, size.width), Math.max(1, size.height));
    bloomPass.resolution.set(Math.max(1, size.width), Math.max(1, size.height));
  }, [composer, bloomPass, gl, size.width, size.height]);

  useEffect(() => {
    return () => {
      composer.dispose();
      renderTarget.dispose();
      renderPass.dispose?.();
      bloomPass.dispose();
      gradePass.dispose();
      outputPass.dispose();
    };
  }, [composer, renderTarget, renderPass, bloomPass, gradePass, outputPass]);

  useFrame(() => {
    composer.render();
  }, 1);

  return null;
};

/**
 * Volumetric Billowing Sea of Clouds ("Biển Mây") beneath and encircling the Floating Sky Islands.
 */
export const DonghuaSeaOfClouds: React.FC = () => {
  const deepFloorMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uCloudCore: { value: new THREE.Color('#ffffff') },
          uCloudRim: { value: new THREE.Color('#e6f3fc') },
          uCloudShadow: { value: new THREE.Color('#9ab7ce') },
        },
        vertexShader: `
          uniform float uTime;
          varying vec2 vWorldXZ;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            wp.y += sin(wp.x * 0.04 + uTime * 0.22) * 0.85 + cos(wp.z * 0.045 - uTime * 0.18) * 0.7;
            vWorldXZ = wp.xz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uCloudCore;
          uniform vec3 uCloudRim;
          uniform vec3 uCloudShadow;
          varying vec2 vWorldXZ;

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
            float a = 0.52;
            for (int i = 0; i < 4; i++) {
              v += a * noise(p);
              p = p * 2.04 + vec2(1.9, 6.4);
              a *= 0.5;
            }
            return v;
          }

          void main() {
            float r = length(vWorldXZ);
            float outerFade = 1.0 - smoothstep(185.0, 238.0, r);

            vec2 uv = vWorldXZ * 0.022 + vec2(uTime * 0.012, -uTime * 0.008);
            float n = fbm(uv);
            float wisps = smoothstep(0.28, 0.76, n);

            vec3 col = mix(uCloudShadow, uCloudCore, smoothstep(0.32, 0.78, n));
            col = mix(col, uCloudRim, smoothstep(0.68, 0.94, n) * 0.42);

            float alpha = wisps * outerFade * 0.78;
            if (alpha < 0.01) discard;
            gl_FragColor = vec4(col, alpha);
          }
        `,
      }),
    []
  );

  const rimCloudMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uCloudCore: { value: new THREE.Color('#f9fcff') },
          uCloudRim: { value: new THREE.Color('#fff9e8') },
          uCloudShadow: { value: new THREE.Color('#aac5da') },
        },
        vertexShader: `
          uniform float uTime;
          varying vec2 vWorldXZ;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            wp.y += sin(wp.x * 0.05 + uTime * 0.28) * 0.6 + cos(wp.z * 0.05 - uTime * 0.21) * 0.55;
            vWorldXZ = wp.xz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uCloudCore;
          uniform vec3 uCloudRim;
          uniform vec3 uCloudShadow;
          varying vec2 vWorldXZ;

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
            float a = 0.52;
            for (int i = 0; i < 4; i++) {
              v += a * noise(p);
              p = p * 2.05 + vec2(2.3, 5.1);
              a *= 0.5;
            }
            return v;
          }

          void main() {
            float r = length(vWorldXZ);
            float innerFade = smoothstep(82.0, 102.0, r);
            float outerFade = 1.0 - smoothstep(175.0, 226.0, r);

            vec2 uv = vWorldXZ * 0.028 + vec2(-uTime * 0.014, uTime * 0.01);
            float n = fbm(uv);
            float wisps = smoothstep(0.38, 0.78, n);

            vec3 col = mix(uCloudShadow, uCloudCore, smoothstep(0.38, 0.78, n));
            col = mix(col, uCloudRim, smoothstep(0.68, 0.92, n) * 0.45);

            float alpha = wisps * innerFade * outerFade * 0.58;
            if (alpha < 0.01) discard;
            gl_FragColor = vec4(col, alpha);
          }
        `,
      }),
    []
  );

  useEffect(() => {
    return () => {
      deepFloorMat.dispose();
      rimCloudMat.dispose();
    };
  }, [deepFloorMat, rimCloudMat]);

  useFrame((state) => {
    if (!liveSceneActivity.isOutdoor) return;
    const t = state.clock.getElapsedTime();
    deepFloorMat.uniforms.uTime.value = t;
    rimCloudMat.uniforms.uTime.value = t * 1.15 + 11.0;
  });

  return (
    <group>
      {/* Vast abyss sea of clouds supporting the floating islands */}
      <mesh position={[0, -21.5, 0]} rotation-x={-Math.PI / 2} material={deepFloorMat}>
        <circleGeometry args={[240, 64]} />
      </mesh>
      {/* Mid-level wispy cloud collar hugging the main sky-island cliffs */}
      <mesh position={[0, -8.5, 0]} rotation-x={-Math.PI / 2} material={rimCloudMat}>
        <ringGeometry args={[82, 228, 64, 8]} />
      </mesh>
    </group>
  );
};

const _lanternDummy = new THREE.Object3D();

/**
 * Ascending Luminous Sky Lanterns ("Đèn Khổng Minh") drifting gently over the sky island.
 */
export const FloatingSkyLanterns: React.FC<{ isSoftwareGl?: boolean }> = ({
  isSoftwareGl = false,
}) => {
  const count = isSoftwareGl ? 14 : 28;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const lanternGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.14, 0.02),
      new THREE.Vector2(0.22, 0.24),
      new THREE.Vector2(0.24, 0.44),
      new THREE.Vector2(0.16, 0.56),
      new THREE.Vector2(0.0, 0.58),
    ];
    return new THREE.LatheGeometry(pts, 10);
  }, []);

  const lanternMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#fef3c7',
        emissive: '#f59e0b',
        emissiveIntensity: 1.38,
        roughness: 0.35,
        toneMapped: false,
      }),
    []
  );

  const seeds = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const a = i * 2.39996;
      const r = 18 + ((i * 19) % 52);
      return {
        x: Math.cos(a) * r,
        z: 10 + Math.sin(a) * r * 0.85,
        baseY: 7 + (i % 7) * 3.2,
        speed: 0.42 + (i % 5) * 0.11,
        phase: i * 1.13,
        scale: 0.72 + (i % 4) * 0.16,
      };
    });
  }, [count]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (mesh) {
      seeds.forEach((s, idx) => {
        _lanternDummy.position.set(s.x, s.baseY, s.z);
        _lanternDummy.rotation.set(0, 0, 0);
        _lanternDummy.scale.setScalar(s.scale);
        _lanternDummy.updateMatrix();
        mesh.setMatrixAt(idx, _lanternDummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
    return () => {
      lanternGeo.dispose();
      lanternMat.dispose();
    };
  }, [lanternGeo, lanternMat, seeds]);

  useFrame((state) => {
    if (!liveSceneActivity.isOutdoor || !meshRef.current) return;
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const cycle = ((t * s.speed + s.phase * 2.5) % 24);
      const y = 6.5 + cycle;
      const swayX = Math.sin(t * 0.55 + s.phase) * 1.4;
      const swayZ = Math.cos(t * 0.48 + s.phase) * 1.2;
      _lanternDummy.position.set(s.x + swayX, y, s.z + swayZ);
      _lanternDummy.rotation.set(
        Math.sin(t * 0.9 + s.phase) * 0.07,
        t * 0.25 + s.phase,
        Math.cos(t * 0.85 + s.phase) * 0.07
      );
      const fadeScale =
        cycle < 2.0 ? cycle / 2.0 : cycle > 20.0 ? Math.max(0.01, (24.0 - cycle) / 4.0) : 1.0;
      _lanternDummy.scale.setScalar(s.scale * fadeScale);
      _lanternDummy.updateMatrix();
      meshRef.current.setMatrixAt(i, _lanternDummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[lanternGeo, lanternMat, count]} />;
};

const _petalDummy = new THREE.Object3D();

/**
 * Swirling Peach & Sakura Blossom Petals ("Hoa Đào") gliding across the island breeze.
 */
export const DriftingBlossomPetals: React.FC<{ isSoftwareGl?: boolean }> = ({
  isSoftwareGl = false,
}) => {
  const count = isSoftwareGl ? 65 : 155;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const petalGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.055);
    shape.quadraticCurveTo(0.045, -0.01, 0.032, 0.048);
    shape.quadraticCurveTo(0, 0.07, -0.032, 0.048);
    shape.quadraticCurveTo(-0.045, -0.01, 0, -0.055);
    return new THREE.ShapeGeometry(shape, 5);
  }, []);

  const petalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#fbcfe8',
        emissive: '#f472b6',
        emissiveIntensity: 0.16,
        roughness: 0.55,
        side: THREE.DoubleSide,
      }),
    []
  );

  const seeds = useMemo(() => {
    const palette = [
      new THREE.Color('#fbcfe8'),
      new THREE.Color('#f9a8d4'),
      new THREE.Color('#fde2e4'),
      new THREE.Color('#fef3c7'),
    ];
    return Array.from({ length: count }, (_, i) => {
      const a = i * 2.39996;
      const r = 3 + Math.sqrt(i / count) * 52;
      return {
        x: Math.cos(a) * r,
        z: 4 + Math.sin(a) * r * 0.85,
        fallSpeed: 0.55 + (i % 5) * 0.14,
        phase: i * 0.67,
        scale: 0.85 + (i % 4) * 0.22,
        color: palette[i % palette.length],
      };
    });
  }, [count]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (mesh) {
      seeds.forEach((s, idx) => {
        _petalDummy.position.set(s.x, 3.0, s.z);
        _petalDummy.scale.setScalar(s.scale);
        _petalDummy.updateMatrix();
        mesh.setMatrixAt(idx, _petalDummy.matrix);
        mesh.setColorAt(idx, s.color);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
    return () => {
      petalGeo.dispose();
      petalMat.dispose();
    };
  }, [petalGeo, petalMat, seeds]);

  useFrame((state) => {
    if (!liveSceneActivity.isOutdoor || !meshRef.current) return;
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const y = 9.5 - ((t * s.fallSpeed + s.phase * 1.4) % 9.2);
      const driftX = Math.sin(t * 0.75 + s.phase) * 1.85;
      const driftZ = Math.cos(t * 0.62 + s.phase) * 1.45;
      _petalDummy.position.set(s.x + driftX, y, s.z + driftZ);
      _petalDummy.rotation.set(
        t * 1.6 + s.phase,
        t * 1.1 + s.phase * 0.7,
        Math.sin(t * 1.4 + s.phase) * 0.9
      );
      _petalDummy.scale.setScalar(s.scale);
      _petalDummy.updateMatrix();
      meshRef.current.setMatrixAt(i, _petalDummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[petalGeo, petalMat, count]} />;
};

/**
 * Volumetric Cascading God Rays / Crepuscular Sunbeams (Thiên Quang Vạn Trượng).
 */
export const CelestialGodRays: React.FC<{ isSoftwareGl?: boolean }> = React.memo(({ isSoftwareGl = false }) => {
  const count = isSoftwareGl ? 3 : 7;

  const godRayMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color('#fff6d6') },
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
          uniform vec3 uColor;
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

          void main() {
            float centerDist = abs(vUv.x - 0.5) * 2.0;
            float beamCore = smoothstep(1.0, 0.0, centerDist);
            beamCore = pow(beamCore, 1.8);

            float topFade = smoothstep(0.0, 0.15, vUv.y);
            float bottomFade = smoothstep(1.0, 0.55, vUv.y);

            float dust = noise(vec2(vUv.x * 6.0, vUv.y * 3.5 - uTime * 0.12));
            float dustDetail = noise(vec2(vUv.x * 14.0 + uTime * 0.05, vUv.y * 8.0 - uTime * 0.22));

            float intensity = beamCore * topFade * bottomFade * (0.65 + dust * 0.25 + dustDetail * 0.15);
            float pulse = 0.88 + 0.12 * sin(uTime * 0.85);

            gl_FragColor = vec4(uColor, intensity * 0.15 * pulse);
          }
        `,
      }),
    []
  );

  useEffect(() => () => godRayMat.dispose(), [godRayMat]);

  useFrame((state) => {
    if (!liveSceneActivity.isOutdoor) return;
    godRayMat.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  const raySpecs = useMemo(() => {
    const specs = [
      { pos: [-24, 26, 12] as [number, number, number], rot: [-0.62, 0.45, -0.42] as [number, number, number], size: [16, 52] as [number, number] },
      { pos: [-16, 28, -6] as [number, number, number], rot: [-0.64, 0.42, -0.38] as [number, number, number], size: [20, 56] as [number, number] },
      { pos: [-8, 25, 24] as [number, number, number], rot: [-0.60, 0.52, -0.44] as [number, number, number], size: [18, 48] as [number, number] },
      { pos: [12, 27, 8] as [number, number, number], rot: [-0.66, 0.38, -0.35] as [number, number, number], size: [22, 54] as [number, number] },
      { pos: [26, 24, 22] as [number, number, number], rot: [-0.58, 0.48, -0.40] as [number, number, number], size: [18, 46] as [number, number] },
      { pos: [-32, 29, 28] as [number, number, number], rot: [-0.65, 0.50, -0.45] as [number, number, number], size: [16, 50] as [number, number] },
      { pos: [4, 28, -18] as [number, number, number], rot: [-0.68, 0.36, -0.32] as [number, number, number], size: [24, 58] as [number, number] },
    ];
    return specs.slice(0, count);
  }, [count]);

  return (
    <group>
      {raySpecs.map((s, idx) => (
        <group key={`godray_${idx}`} position={s.pos} rotation={s.rot}>
          <mesh material={godRayMat}>
            <planeGeometry args={s.size} />
          </mesh>
          <mesh rotation-y={Math.PI / 3} material={godRayMat}>
            <planeGeometry args={[s.size[0] * 0.85, s.size[1]]} />
          </mesh>
        </group>
      ))}
    </group>
  );
});

interface FootstepItem {
  x: number;
  y: number;
  z: number;
  birth: number;
}

const _stepDummy = new THREE.Object3D();

/**
 * Celestial Footstep Trails ("Bộ Bộ Sinh Liên" / Lotus Steps & Spirit Ripples).
 */
export const TravelerFootstepTrails: React.FC<{ isSoftwareGl?: boolean }> = React.memo(
  ({ isSoftwareGl = false }) => {
    const maxSteps = isSoftwareGl ? 8 : 16;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const lastPosRef = useRef(new THREE.Vector3(0, -999, 0));
    const stepsRef = useRef<FootstepItem[]>([]);

    const ringGeo = useMemo(() => new THREE.RingGeometry(0.12, 0.42, 18), []);
    const ringMat = useMemo(
      () =>
        new THREE.MeshBasicMaterial({
          color: '#fef08a',
          transparent: true,
          opacity: 0.72,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      []
    );

    useEffect(() => {
      return () => {
        ringGeo.dispose();
        ringMat.dispose();
      };
    }, [ringGeo, ringMat]);

    useFrame((state) => {
      if (!liveSceneActivity.isOutdoor || !meshRef.current) return;
      const t = state.clock.getElapsedTime();

      const dx = liveAvatarWorldPos.x - lastPosRef.current.x;
      const dz = liveAvatarWorldPos.z - lastPosRef.current.z;
      const distSq = dx * dx + dz * dz;

      if (distSq > 0.65) {
        lastPosRef.current.copy(liveAvatarWorldPos);
        stepsRef.current.unshift({
          x: liveAvatarWorldPos.x,
          y: liveAvatarWorldPos.y + 0.024,
          z: liveAvatarWorldPos.z,
          birth: t,
        });
        if (stepsRef.current.length > maxSteps) {
          stepsRef.current.pop();
        }
      }

      const mesh = meshRef.current;
      for (let i = 0; i < maxSteps; i++) {
        const item = stepsRef.current[i];
        if (!item) {
          _stepDummy.position.set(0, -999, 0);
          _stepDummy.scale.set(0.001, 0.001, 0.001);
          _stepDummy.updateMatrix();
          mesh.setMatrixAt(i, _stepDummy.matrix);
          continue;
        }

        const age = t - item.birth;
        const maxLife = 1.45;
        if (age >= maxLife) {
          _stepDummy.position.set(0, -999, 0);
          _stepDummy.scale.set(0.001, 0.001, 0.001);
          _stepDummy.updateMatrix();
          mesh.setMatrixAt(i, _stepDummy.matrix);
          continue;
        }

        const progress = age / maxLife;
        const scale = 0.5 + progress * 0.95;
        _stepDummy.position.set(item.x, item.y, item.z);
        _stepDummy.rotation.set(-Math.PI / 2, 0, item.birth * 2.4);
        _stepDummy.scale.setScalar(scale);
        _stepDummy.updateMatrix();
        mesh.setMatrixAt(i, _stepDummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });

    return (
      <instancedMesh
        ref={meshRef}
        args={[ringGeo, ringMat, maxSteps]}
        frustumCulled={false}
        userData={{ dynamicBounds: true }}
      />
    );
  }
);

const _mistDummy = new THREE.Object3D();

/**
 * Volumetric Waterfall Spray Mist Plumes billow at the base of cascades.
 */
export const WaterfallMistPlumes: React.FC<{ isSoftwareGl?: boolean }> = React.memo(
  ({ isSoftwareGl = false }) => {
    const count = isSoftwareGl ? 14 : 28;
    const meshRef = useRef<THREE.InstancedMesh>(null);

    const geo = useMemo(() => new THREE.SphereGeometry(0.75, 8, 8), []);
    const mat = useMemo(
      () =>
        new THREE.MeshBasicMaterial({
          color: '#f0fdf9',
          transparent: true,
          opacity: 0.16,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      []
    );

    const centers = useMemo(
      () => [
        { cx: streamCenterX(-47), cy: 0.4, cz: -47.0 },
        { cx: -25.5, cy: 2.2, cz: -43.0 },
      ],
      []
    );

    useEffect(() => {
      const mesh = meshRef.current;
      if (mesh) {
        const halfCount = count / 2;
        for (let i = 0; i < count; i++) {
          const c = i < halfCount ? centers[0] : centers[1];
          _mistDummy.position.set(c.cx, c.cy + 0.8, c.cz);
          _mistDummy.scale.setScalar(1.2);
          _mistDummy.updateMatrix();
          mesh.setMatrixAt(i, _mistDummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
      }
      return () => {
        geo.dispose();
        mat.dispose();
      };
    }, [geo, mat, count, centers]);

    useFrame((state) => {
      if (!liveSceneActivity.isOutdoor || !meshRef.current) return;
      const t = state.clock.getElapsedTime();
      const mesh = meshRef.current;
      const halfCount = count / 2;

      for (let i = 0; i < count; i++) {
        const c = i < halfCount ? centers[0] : centers[1];
        const localIdx = i % halfCount;
        const cycle = ((t * 0.45 + localIdx * 0.35) % 1.0);
        const ang = localIdx * 1.8 + t * 0.15;
        const rad = 0.5 + cycle * 1.8;

        const x = c.cx + Math.cos(ang) * rad;
        const z = c.cz + Math.sin(ang) * rad;
        const y = c.cy + cycle * 1.6;
        const scale = 0.6 + cycle * 1.4;

        _mistDummy.position.set(x, y, z);
        _mistDummy.scale.setScalar(scale);
        _mistDummy.updateMatrix();
        mesh.setMatrixAt(i, _mistDummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });

    return <instancedMesh ref={meshRef} args={[geo, mat, count]} />;
  }
);
