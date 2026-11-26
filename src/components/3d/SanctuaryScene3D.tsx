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
  const requestStaticRedrawRef = useRef<(() => void) | null>(null);
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
    requestStaticRedrawRef.current?.();
  }, [moodScore, breathPhase, breathRunning, activeEffect]);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  const staticRenderOnly = lowMotion || prefersReducedMotion;

  useEffect(() => {
    if (webglUnavailable) return;
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !staticRenderOnly,
        alpha: false,
        powerPreference: 'default',
      });
      const glCtx = renderer.getContext();
      if (!glCtx) {
        renderer.dispose();
        setWebglUnavailable(true);
        return;
      }

      const softwareGl = detectSoftwareWebGL(glCtx);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setPixelRatio(softwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));

      const width = Math.max(container.clientWidth || container.parentElement?.clientWidth || 0, 320);
      const height = Math.max(container.clientHeight || container.parentElement?.clientHeight || 0, 210);
      renderer.setSize(width, height, false);
      const canvasEl = renderer.domElement;
      canvasEl.style.position = 'absolute';
      canvasEl.style.inset = '0';
      canvasEl.style.width = '100%';
      canvasEl.style.height = '100%';
      canvasEl.style.display = 'block';
      container.replaceChildren(canvasEl);

      const vault = new TextureVault();
      const built = buildSanctuaryScene(variant, vault, softwareGl);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(built.backgroundHex);
      scene.fog = new THREE.FogExp2(built.fogColor, built.fogDensity);
      scene.add(built.root);

      let pmrem: THREE.PMREMGenerator | null = null;
      let roomEnv: RoomEnvironment | null = null;
      let envRT: THREE.WebGLRenderTarget | null = null;
      try {
        pmrem = new THREE.PMREMGenerator(renderer);
        roomEnv = new RoomEnvironment();
        envRT = pmrem.fromScene(roomEnv, 0.04);
        scene.environment = envRT.texture;
        scene.environmentIntensity = 0.55;
      } catch {
        // Fallback cleanly to directional + hemisphere scene lighting
      }

      const camera = new THREE.PerspectiveCamera(built.fov, width / height, 0.1, 100);
      camera.position.copy(built.cameraPosition);
      camera.lookAt(built.cameraTarget);

      if (!softwareGl) {
        try {
          renderer.compile(scene, camera);
        } catch {
          // Non-fatal pre-warm failure
        }
      }

      // Smooth pointer parallax + drag orbit
      let targetYaw = 0;
      let targetPitch = 0;
      let currentYaw = 0;
      let currentPitch = 0;
      let isDragging = false;
      let lastX = 0;
      let lastY = 0;

      const baseOffset = built.cameraPosition.clone().sub(built.cameraTarget);
      const radius = baseOffset.length();
      const baseTheta = Math.atan2(baseOffset.x, baseOffset.z);
      const basePhi = Math.acos(THREE.MathUtils.clamp(baseOffset.y / radius, -0.95, 0.95));

      let rafId = 0;
      let timeoutId = 0;
      let disposed = false;
      let contextLost = false;
      let prevTime = performance.now();
      const startTime = prevTime;

      const drawFrame = (dt: number, elapsed: number, sway = true) => {
        if (disposed || contextLost || !renderer) return;
        currentYaw = THREE.MathUtils.damp(currentYaw, targetYaw, 5, dt);
        currentPitch = THREE.MathUtils.damp(currentPitch, targetPitch, 5, dt);

        const theta = baseTheta + currentYaw + (sway ? Math.sin(elapsed * 0.18) * 0.03 : 0);
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

      // Draw frame 0 immediately so every tab displays its 3D scenery without blank delay
      drawFrame(0.016, 0, !staticRenderOnly);

      const requestStaticRedraw = () => {
        if (!staticRenderOnly || disposed || contextLost) return;
        window.cancelAnimationFrame(rafId);
        rafId = window.requestAnimationFrame(() => {
          drawFrame(0.05, 0, false);
        });
      };
      requestStaticRedrawRef.current = requestStaticRedraw;

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
          if (staticRenderOnly) requestStaticRedraw();
        } else if (!staticRenderOnly && rect.width > 0 && rect.height > 0) {
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
        if (staticRenderOnly) requestStaticRedraw();
      };

      canvasEl.addEventListener('pointerdown', onPointerDown);
      canvasEl.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      canvasEl.addEventListener('pointerleave', onPointerLeave);

      const handleContextLost = (e: Event) => {
        e.preventDefault();
        contextLost = true;
      };
      const handleContextRestored = () => {
        contextLost = false;
        drawFrame(0.016, (performance.now() - startTime) / 1000, !staticRenderOnly);
      };
      canvasEl.addEventListener('webglcontextlost', handleContextLost);
      canvasEl.addEventListener('webglcontextrestored', handleContextRestored);

      const resizeObserver = new ResizeObserver((entries) => {
        if (disposed || !renderer) return;
        const entry = entries[0];
        if (!entry) return;
        const w = Math.max(Math.round(entry.contentRect.width), 200);
        const h = Math.max(Math.round(entry.contentRect.height), 160);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        drawFrame(0.016, (performance.now() - startTime) / 1000, !staticRenderOnly);
      });
      resizeObserver.observe(container);

      const afterSoftwareDraw = (cb: () => void) => {
        const gl2 = renderer?.getContext() as WebGL2RenderingContext | null;
        if (gl2 && typeof gl2.fenceSync === 'function') {
          const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl2.flush();
          const poll = () => {
            if (disposed) {
              if (sync) gl2.deleteSync(sync);
              return;
            }
            const state = sync ? gl2.getSyncParameter(sync, gl2.SYNC_STATUS) : gl2.ALREADY_SIGNALED;
            if (state === gl2.UNSIGNALED) {
              timeoutId = window.setTimeout(poll, 5);
            } else {
              if (sync) gl2.deleteSync(sync);
              timeoutId = window.setTimeout(cb, 80);
            }
          };
          timeoutId = window.setTimeout(poll, 5);
        } else {
          timeoutId = window.setTimeout(cb, 80);
        }
      };

      const animate = (now: number) => {
        if (disposed || staticRenderOnly) return;
        if (!contextLost && renderer) {
          const dt = Math.min(0.08, Math.max(0.001, (now - prevTime) / 1000));
          prevTime = now;
          const elapsed = (now - startTime) / 1000;
          drawFrame(dt, elapsed, true);
        }

        if (softwareGl) {
          afterSoftwareDraw(() => {
            if (!disposed) {
              rafId = window.requestAnimationFrame(animate);
            }
          });
        } else {
          rafId = window.requestAnimationFrame(animate);
        }
      };

      if (!staticRenderOnly) {
        rafId = window.requestAnimationFrame(animate);
      }

      return () => {
        disposed = true;
        requestStaticRedrawRef.current = null;
        window.cancelAnimationFrame(rafId);
        window.clearTimeout(timeoutId);
        resizeObserver.disconnect();
        canvasEl.removeEventListener('pointerdown', onPointerDown);
        canvasEl.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        canvasEl.removeEventListener('pointerleave', onPointerLeave);
        canvasEl.removeEventListener('webglcontextlost', handleContextLost);
        canvasEl.removeEventListener('webglcontextrestored', handleContextRestored);
        built.dispose();
        vault.disposeAll();
        envRT?.dispose();
        roomEnv?.dispose();
        pmrem?.dispose();
        if (!contextLost) {
          try {
            renderer?.forceContextLoss();
          } catch {
            // ignore context loss errors during teardown
          }
        }
        renderer?.dispose();
        container.replaceChildren();
      };
    } catch {
      renderer?.dispose();
      setWebglUnavailable(true);
    }
  }, [variant, staticRenderOnly, webglUnavailable]);

  const palette = STATIC_DIORAMA_PALETTE[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-[#2d3e31]/70 dark:border-[#324236] bg-[#121c15] shadow-md select-none min-h-[210px] ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* WebGL Mount Layer OR Graceful Static Atmospheric Diorama Fallback */}
      {webglUnavailable ? (
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
          className={`absolute inset-0 z-0 w-full h-full transition-opacity duration-500 ${
            dimmed ? 'opacity-20' : 'opacity-100'
          }`}
        />
      )}

      {/* Readability Scrim (keeps overlaid text >= 4.5:1 without hiding the sunlit 3D vistas) */}
      <div
        aria-hidden="true"
        className={
          scrimClassName ||
          'absolute inset-0 z-[1] pointer-events-none bg-gradient-to-t from-[#0d1812]/82 via-[#101d16]/34 to-transparent'
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
