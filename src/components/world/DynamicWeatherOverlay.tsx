import React, { useEffect, useRef } from 'react';

export type WeatherMode = 'petals' | 'rain' | 'fireflies' | 'mist' | 'clear';

export interface WeatherOption {
  id: WeatherMode;
  label: string;
  subtitle: string;
}

export const WEATHER_OPTIONS: WeatherOption[] = [
  { id: 'petals', label: 'Hoa Rơi', subtitle: 'Cánh hoa đào trôi nhẹ trong gió đêm' },
  { id: 'rain', label: 'Mưa Đêm', subtitle: 'Hạt mưa dịu dàng gợn sóng mặt hồ' },
  { id: 'fireflies', label: 'Đom Đóm', subtitle: 'Ánh sáng nhỏ lấp lánh giữa màn đêm' },
  { id: 'mist', label: 'Sương Trăng', subtitle: 'Làn sương mỏng bảng lảng ánh trăng' },
  { id: 'clear', label: 'Tĩnh Lặng', subtitle: 'Bầu trời quang đãng không hiệu ứng' },
];

interface DynamicWeatherOverlayProps {
  mode: WeatherMode;
  dimmed?: boolean;
  lowMotion?: boolean;
}

interface PetalParticle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  rot: number;
  rotSpeed: number;
  flip: number;
  flipSpeed: number;
  opacity: number;
  color: string;
  glowColor: string;
}

interface RainDrop {
  x: number;
  y: number;
  len: number;
  speedY: number;
  speedX: number;
  width: number;
  opacity: number;
  depth: number;
}

interface RainRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

interface FireflyParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
  pulseSpeed: number;
  color: string;
}

interface MistWisp {
  x: number;
  y: number;
  width: number;
  height: number;
  speedX: number;
  opacity: number;
  phase: number;
}

const PETAL_PALETTE = [
  { color: 'rgba(251, 207, 232, 0.88)', glow: 'rgba(244, 114, 182, 0.35)' }, // Blossom pink
  { color: 'rgba(249, 168, 212, 0.82)', glow: 'rgba(236, 72, 153, 0.3)' },  // Soft rose
  { color: 'rgba(233, 213, 255, 0.85)', glow: 'rgba(192, 132, 252, 0.3)' }, // Lavender mist
  { color: 'rgba(254, 243, 199, 0.8)', glow: 'rgba(251, 191, 36, 0.25)' },  // Warm moonlight cream
];

const FIREFLY_COLORS = [
  '253, 224, 71',  // Warm gold
  '103, 232, 249', // Soft cyan
  '253, 164, 175', // Blush pink
  '196, 181, 253', // Lavender glow
];

export const DynamicWeatherOverlay: React.FC<DynamicWeatherOverlayProps> = ({
  mode,
  dimmed = false,
  lowMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (mode === 'clear' || lowMotion || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const motionFactor = 1;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Responsive particle density
    const isMobile = width < 640;

    // Initialize particle pools based on mode
    const petals: PetalParticle[] = [];
    const raindrops: RainDrop[] = [];
    const ripples: RainRipple[] = [];
    const fireflies: FireflyParticle[] = [];
    const wisps: MistWisp[] = [];

    if (mode === 'petals') {
      const count = isMobile ? 28 : 48;
      for (let i = 0; i < count; i++) {
        const tone = PETAL_PALETTE[i % PETAL_PALETTE.length];
        petals.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 5 + Math.random() * 6,
          speedY: (22 + Math.random() * 24) * motionFactor,
          speedX: (-8 - Math.random() * 14) * motionFactor,
          swayAmp: 18 + Math.random() * 26,
          swayFreq: 0.6 + Math.random() * 0.9,
          phase: Math.random() * Math.PI * 2,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 1.4 * motionFactor,
          flip: Math.random() * Math.PI * 2,
          flipSpeed: (0.9 + Math.random() * 1.4) * motionFactor,
          opacity: 0.45 + Math.random() * 0.45,
          color: tone.color,
          glowColor: tone.glow,
        });
      }
    } else if (mode === 'rain') {
      const count = isMobile ? 65 : 120;
      for (let i = 0; i < count; i++) {
        const depth = 0.4 + Math.random() * 0.6;
        raindrops.push({
          x: Math.random() * (width + 120),
          y: Math.random() * height,
          len: 14 + depth * 22,
          speedY: (360 + depth * 320) * motionFactor,
          speedX: (-55 - depth * 45) * motionFactor,
          width: 0.8 + depth * 0.9,
          opacity: 0.14 + depth * 0.26,
          depth,
        });
      }
    } else if (mode === 'fireflies') {
      const count = isMobile ? 24 : 44;
      for (let i = 0; i < count; i++) {
        fireflies.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 18 * motionFactor,
          vy: (-6 - Math.random() * 14) * motionFactor,
          radius: 1.8 + Math.random() * 2.4,
          phase: Math.random() * Math.PI * 2,
          pulseSpeed: (1.2 + Math.random() * 1.6) * motionFactor,
          color: FIREFLY_COLORS[i % FIREFLY_COLORS.length],
        });
      }
    } else if (mode === 'mist') {
      const wispCount = isMobile ? 6 : 10;
      for (let i = 0; i < wispCount; i++) {
        wisps.push({
          x: Math.random() * width,
          y: height * (0.15 + Math.random() * 0.72),
          width: 240 + Math.random() * 320,
          height: 70 + Math.random() * 90,
          speedX: (8 + Math.random() * 10) * (i % 2 === 0 ? 1 : -0.7) * motionFactor,
          opacity: 0.04 + Math.random() * 0.05,
          phase: Math.random() * Math.PI * 2,
        });
      }
      // Plus subtle moonlit dust motes
      const moteCount = isMobile ? 16 : 28;
      for (let i = 0; i < moteCount; i++) {
        fireflies.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 10 * motionFactor,
          vy: (-3 - Math.random() * 6) * motionFactor,
          radius: 1.2 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.8 + Math.random() * 0.8,
          color: '226, 232, 240',
        });
      }
    }

    let animId = 0;
    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const elapsed = now / 1000;

      ctx.clearRect(0, 0, width, height);

      if (mode === 'petals') {
        for (const p of petals) {
          p.y += p.speedY * dt;
          p.x += (p.speedX + Math.sin(elapsed * p.swayFreq + p.phase) * p.swayAmp) * dt;
          p.rot += p.rotSpeed * dt;
          p.flip += p.flipSpeed * dt;

          if (p.y > height + 24) {
            p.y = -24;
            p.x = Math.random() * (width + 80);
          }
          if (p.x < -30) p.x = width + 20;
          if (p.x > width + 30) p.x = -20;

          const scaleY = 0.45 + 0.55 * Math.abs(Math.cos(p.flip));

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, scaleY);
          ctx.globalAlpha = p.opacity;

          // Soft petal glow
          ctx.shadowColor = p.glowColor;
          ctx.shadowBlur = 8;
          ctx.fillStyle = p.color;

          // Organic teardrop / sakura petal curve
          const s = p.size;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.bezierCurveTo(s * 0.85, -s * 0.55, s * 0.75, s * 0.65, 0, s);
          ctx.bezierCurveTo(-s * 0.75, s * 0.65, -s * 0.85, -s * 0.55, 0, -s);
          ctx.fill();
          ctx.restore();
        }
      } else if (mode === 'rain') {
        // Subtle atmospheric sage-slate mist tint near upper sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.45);
        skyGrad.addColorStop(0, 'rgba(54, 82, 72, 0.16)');
        skyGrad.addColorStop(1, 'rgba(54, 82, 72, 0)');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height * 0.45);

        ctx.lineCap = 'round';
        for (const d of raindrops) {
          d.x += d.speedX * dt;
          d.y += d.speedY * dt;

          if (d.y > height + 20) {
            if (Math.random() < 0.24 && ripples.length < 24) {
              ripples.push({
                x: d.x,
                y: height - 18 - Math.random() * (height * 0.22),
                radius: 2,
                maxRadius: 12 + Math.random() * 16,
                opacity: 0.32,
              });
            }
            d.y = -30 - Math.random() * 40;
            d.x = Math.random() * (width + 140);
          }
          if (d.x < -30) {
            d.x = width + 30;
          }

          const dx = (d.speedX / d.speedY) * d.len;
          const grad = ctx.createLinearGradient(d.x, d.y, d.x + dx, d.y + d.len);
          grad.addColorStop(0, `rgba(226, 240, 234, 0)`);
          grad.addColorStop(0.7, `rgba(226, 240, 234, ${d.opacity * 1.1})`);
          grad.addColorStop(1, `rgba(248, 252, 249, ${d.opacity * 1.25})`);

          ctx.strokeStyle = grad;
          ctx.lineWidth = d.width;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + dx, d.y + d.len);
          ctx.stroke();
        }

        // Draw delicate surface ripples
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.radius += 28 * dt * motionFactor;
          r.opacity -= 0.42 * dt * motionFactor;
          if (r.opacity <= 0 || r.radius >= r.maxRadius) {
            ripples.splice(i, 1);
            continue;
          }
          ctx.save();
          ctx.strokeStyle = `rgba(125, 211, 252, ${r.opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.32, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      } else if (mode === 'fireflies') {
        for (const f of fireflies) {
          f.x += (f.vx + Math.sin(elapsed * 0.7 + f.phase) * 12) * dt;
          f.y += (f.vy + Math.cos(elapsed * 0.5 + f.phase) * 8) * dt;

          if (f.y < -20) f.y = height + 20;
          if (f.y > height + 20) f.y = -20;
          if (f.x < -20) f.x = width + 20;
          if (f.x > width + 20) f.x = -20;

          const glow = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(elapsed * f.pulseSpeed + f.phase));
          const haloR = f.radius * (4.5 + glow * 3.5);

          const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, haloR);
          grad.addColorStop(0, `rgba(255, 251, 235, ${0.85 * glow})`);
          grad.addColorStop(0.25, `rgba(${f.color}, ${0.55 * glow})`);
          grad.addColorStop(1, `rgba(${f.color}, 0)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(f.x, f.y, haloR, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (mode === 'mist') {
        // Drifting moonlit lake mist bands
        for (const w of wisps) {
          w.x += w.speedX * dt;
          const bobY = Math.sin(elapsed * 0.35 + w.phase) * 10;

          if (w.speedX > 0 && w.x - w.width > width) w.x = -w.width;
          if (w.speedX < 0 && w.x + w.width < 0) w.x = width + w.width;

          ctx.save();
          ctx.translate(w.x, w.y + bobY);
          ctx.scale(1, w.height / w.width);
          const mGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, w.width * 0.5);
          mGrad.addColorStop(0, `rgba(199, 210, 254, ${w.opacity})`);
          mGrad.addColorStop(0.6, `rgba(147, 197, 253, ${w.opacity * 0.35})`);
          mGrad.addColorStop(1, 'rgba(147, 197, 253, 0)');
          ctx.fillStyle = mGrad;
          ctx.beginPath();
          ctx.arc(0, 0, w.width * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Moonlit stardust motes
        for (const f of fireflies) {
          f.x += f.vx * dt;
          f.y += f.vy * dt;
          if (f.y < -15) f.y = height + 15;
          if (f.x < -15) f.x = width + 15;
          if (f.x > width + 15) f.x = -15;
          const glow = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(elapsed * f.pulseSpeed + f.phase));
          ctx.fillStyle = `rgba(${f.color}, ${glow})`;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [mode, lowMotion]);

  if (mode === 'clear' || lowMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-20 transition-opacity duration-700 ${
        dimmed ? 'opacity-20' : 'opacity-100'
      }`}
    />
  );
};
