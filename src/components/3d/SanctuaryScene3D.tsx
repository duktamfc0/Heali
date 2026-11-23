import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Eye, EyeOff } from 'lucide-react';
import { detectSoftwareWebGL, TextureVault } from './proceduralTextures';
import {
  buildSanctuaryScene,
  type BreathPhase3D,
  type SanctuarySceneVariant,
  type SceneLiveProps,
} from './scenes/buildSanctuaryScenes';

export type { SanctuarySceneVariant, BreathPhase3D };

interface SanctuaryScene3DProps {
  variant: SanctuarySceneVariant;
  moodScore?: number;
  breathPhase?: BreathPhase3D;
  breathRunning?: boolean;
  activeEffect?: boolean;
  lowMotion?: boolean;
  dimmed?: boolean;
  className?: string;
  allowPureViewToggle?: boolean;
  scrimClassName?: string;
  children?: React.ReactNode;
}

const STATIC_DIORAMA_PALETTE: Record<
  SanctuarySceneVariant,
  { bg: string; glowA: string; glowB: string }
> = {
  landing: {
    bg: 'from-[#2e3a52] via-[#5d4b37] to-[#1a332a]',
    glowA: 'rgba(255, 209, 102, 0.36)',
    glowB: 'rgba(65, 138, 114, 0.28)',
  },
  overview: {
    bg: 'from-[#275166] via-[#2b5848] to-[#173028]',
    glowA: 'rgba(159, 215, 230, 0.34)',
    glowB: 'rgba(122, 199, 155, 0.28)',
  },
  journal: {
    bg: 'from-[#2e5266] via-[#345436] to-[#1d2e20]',
    glowA: 'rgba(255, 240, 186, 0.32)',
    glowB: 'rgba(92, 125, 66, 0.28)',
  },
  letters: {
    bg: 'from-[#423859] via-[#5e3e3d] to-[#241b1b]',
    glowA: 'rgba(255, 185, 130, 0.34)',
    glowB: 'rgba(227, 59, 74, 0.24)',
  },
  wishes: {
    bg: 'from-[#28546b] via-[#2b5748] to-[#1a3428]',
    glowA: 'rgba(255, 245, 200, 0.34)',
    glowB: 'rgba(255, 180, 196, 0.25)',
  },
  calm: {
    bg: 'from-[#24597a] via-[#1c616c] to-[#14373c]',
    glowA: 'rgba(142, 210, 240, 0.36)',
    glowB: 'rgba(114, 227, 206, 0.3)',
  },
  community: {
    bg: 'from-[#363a5c] via-[#4a4563] to-[#1f3433]',
    glowA: 'rgba(255, 214, 156, 0.32)',
    glowB: 'rgba(157, 143, 194, 0.26)',
  },
  lake: {
    bg: 'from-[#2e3a52] via-[#5c4833] to-[#1a332a]',
    glowA: 'rgba(255, 209, 102, 0.36)',
    glowB: 'rgba(59, 120, 104, 0.28)',
  },
  spiritual: {
    bg: 'from-[#314163] via-[#42526e] to-[#1c2b29]',
    glowA: 'rgba(255, 234, 194, 0.32)',
    glowB: 'rgba(152, 178, 222, 0.26)',
  },
};

export const SanctuaryScene3D: React.FC<SanctuaryScene3DProps> = ({
  variant,
  moodScore = 3,
  breathPhase = 'inhale',
  breathRunning = false,
  activeEffect = false,
  lowMotion = false,
  dimmed = false,
  className = '',
  allowPureViewToggle = false,
  scrimClassName,
  children,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [pureView, setPureView] = useState(false);

  const liveRef = useRef<SceneLiveProps>({
    moodScore,
    breathPhase,
    breathRunning,
    activeEffect,
  });

  useEffect(() => {
    liveRef.current = {
      moodScore,
      breathPhase,
      breathRunning,
      activeEffect,
    };
  }, [moodScore, breathPhase, breathRunning, activeEffect]);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  const shouldUseStaticFallback = lowMotion || prefersReducedMotion || webglUnavailable;

  useEffect(() => {
    if (shouldUseStaticFallback) return;
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      const probeCanvas = document.createElement('canvas');
      const probeCtx =
        probeCanvas.getContext('webgl2', { powerPreference: 'default' }) ||
        probeCanvas.getContext('webgl', { powerPreference: 'default' });
      if (!probeCtx) {
        setWebglUnavailable(true);
        return;
      }
      const softwareGl = detectSoftwareWebGL(probeCtx);

      renderer = new THREE.WebGLRenderer({
        antialias: !softwareGl,
        alpha: false,
        powerPreference: softwareGl ? 'low-power' : 'high-performance',
      });
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setPixelRatio(softwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));

      const width = Math.max(container.clientWidth, 320);
      const height = Math.max(container.clientHeight, 200);
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      container.replaceChildren(renderer.domElement);

      const vault = new TextureVault();
      const built = buildSanctuaryScene(variant, vault, softwareGl);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(built.backgroundHex);
      scene.fog = new THREE.FogExp2(built.fogColor, built.fogDensity);
      scene.add(built.root);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      const envRT = pmrem.fromScene(roomEnv, 0.04);
      scene.environment = envRT.texture;
      scene.environmentIntensity = 0.55;

      const camera = new THREE.PerspectiveCamera(built.fov, width / height, 0.1, 100);
      camera.position.copy(built.cameraPosition);
      camera.lookAt(built.cameraTarget);

      // Smooth pointer parallax + drag orbit
      let targetYaw = 0;
      let targetPitch = 0;
      let currentYaw = 0;
      let currentPitch = 0;
      let isDragging = false;
      let lastX = 0;
      let lastY = 0;

      const onPointerDown = (e: PointerEvent) => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      };
      const onPointerMove = (e: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        if (isDragging) {
          const dx = e.clientX - lastX;
          const dy = e.clientY - lastY;
          lastX = e.clientX;
          lastY = e.clientY;
          targetYaw = THREE.MathUtils.clamp(targetYaw - dx * 0.0055, -0.75, 0.75);
          targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.0035, -0.25, 0.35);
        } else if (rect.width > 0 && rect.height > 0) {
          const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
          const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
          targetYaw = THREE.MathUtils.clamp(-nx * 0.16, -0.35, 0.35);
          targetPitch = THREE.MathUtils.clamp(ny * 0.08, -0.15, 0.15);
        }
      };
      const onPointerUp = () => {
        isDragging = false;
      };
      const onPointerLeave = () => {
        isDragging = false;
        targetYaw = 0;
        targetPitch = 0;
      };

      const canvasEl = renderer.domElement;
      canvasEl.addEventListener('pointerdown', onPointerDown);
      canvasEl.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      canvasEl.addEventListener('pointerleave', onPointerLeave);

      let contextLost = false;
      const handleContextLost = (e: Event) => {
        e.preventDefault();
        contextLost = true;
      };
      const handleContextRestored = () => {
        contextLost = false;
      };
      canvasEl.addEventListener('webglcontextlost', handleContextLost);
      canvasEl.addEventListener('webglcontextrestored', handleContextRestored);

      const resizeObserver = new ResizeObserver((entries) => {
        if (!renderer) return;
        const entry = entries[0];
        if (!entry) return;
        const w = Math.max(Math.round(entry.contentRect.width), 200);
        const h = Math.max(Math.round(entry.contentRect.height), 160);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      });
      resizeObserver.observe(container);

      const baseOffset = built.cameraPosition.clone().sub(built.cameraTarget);
      const radius = baseOffset.length();
      const baseTheta = Math.atan2(baseOffset.x, baseOffset.z);
      const basePhi = Math.acos(THREE.MathUtils.clamp(baseOffset.y / radius, -0.95, 0.95));

      let rafId = 0;
      let disposed = false;
      let prevTime = performance.now();
      let lastDrawAt = 0;
      const startTime = prevTime;

      const animate = (now: number) => {
        if (disposed) return;
        rafId = window.requestAnimationFrame(animate);
        if (contextLost || !renderer) return;

        // Pace software WebGL cleanly (~12fps) so browser main thread stays snappy
        if (softwareGl && now - lastDrawAt < 80) {
          return;
        }
        lastDrawAt = now;

        const dt = Math.min(0.08, Math.max(0.001, (now - prevTime) / 1000));
        prevTime = now;
        const elapsed = (now - startTime) / 1000;

        currentYaw = THREE.MathUtils.damp(currentYaw, targetYaw, 5, dt);
        currentPitch = THREE.MathUtils.damp(currentPitch, targetPitch, 5, dt);

        const theta = baseTheta + currentYaw + Math.sin(elapsed * 0.18) * 0.03;
        const phi = THREE.MathUtils.clamp(basePhi + currentPitch, 0.38, 1.38);

        camera.position.set(
          built.cameraTarget.x + radius * Math.sin(phi) * Math.sin(theta),
          built.cameraTarget.y + radius * Math.cos(phi),
          built.cameraTarget.z + radius * Math.sin(phi) * Math.cos(theta)
        );
        camera.lookAt(built.cameraTarget);

        built.update(dt, elapsed, liveRef.current);
        renderer.render(scene, camera);
      };

      rafId = window.requestAnimationFrame(animate);

      return () => {
        disposed = true;
        window.cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        canvasEl.removeEventListener('pointerdown', onPointerDown);
        canvasEl.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        canvasEl.removeEventListener('pointerleave', onPointerLeave);
        canvasEl.removeEventListener('webglcontextlost', handleContextLost);
        canvasEl.removeEventListener('webglcontextrestored', handleContextRestored);
        built.dispose();
        vault.disposeAll();
        envRT.dispose();
        roomEnv.dispose();
        pmrem.dispose();
        renderer?.dispose();
        container.replaceChildren();
      };
    } catch {
      renderer?.dispose();
      setWebglUnavailable(true);
    }
  }, [variant, shouldUseStaticFallback]);

  const palette = STATIC_DIORAMA_PALETTE[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-[#2d3e31]/70 dark:border-[#324236] bg-[#121c15] shadow-md select-none ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* WebGL Mount Layer OR Graceful Static Atmospheric Diorama Fallback */}
      {shouldUseStaticFallback ? (
        <div
          aria-hidden="true"
          className={`absolute inset-0 bg-gradient-to-br ${palette.bg}`}
        >
          <div
            className="absolute -top-14 left-1/4 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${palette.glowA}, transparent 70%)` }}
          />
          <div
            className="absolute -bottom-16 right-1/5 w-80 h-80 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${palette.glowB}, transparent 70%)` }}
          />
        </div>
      ) : (
        <div
          ref={mountRef}
          aria-hidden="true"
          className={`absolute inset-0 transition-opacity duration-500 ${
            dimmed ? 'opacity-20' : 'opacity-100'
          }`}
        />
      )}

      {/* Readability Scrim (keeps overlaid text >= 4.5:1 without hiding the sunlit 3D vistas) */}
      <div
        aria-hidden="true"
        className={
          scrimClassName ||
          'absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0d1812]/82 via-[#101d16]/34 to-transparent'
        }
      />

      {/* Optional Minimal Pure-3D Toggle Button */}
      {allowPureViewToggle && (
        <button
          type="button"
          onClick={() => setPureView((v) => !v)}
          className="absolute top-3.5 right-3.5 z-20 min-h-[36px] px-3 py-1.5 rounded-xl bg-[#121c15]/80 hover:bg-[#1a281e] border border-[#4a6250]/60 text-[#eef3ea] text-xs font-medium inline-flex items-center gap-1.5 transition"
          title={pureView ? 'Hiện nội dung trên khung cảnh 3D' : 'Thu gọn chữ để ngắm cảnh 3D'}
        >
          {pureView ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{pureView ? 'Hiện chữ' : 'Ngắm 3D'}</span>
        </button>
      )}

      {/* Overlaid UI Content */}
      {children && (
        <div
          className={`relative z-10 h-full transition-opacity duration-300 ${
            pureView ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
};
