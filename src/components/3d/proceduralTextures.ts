import * as THREE from 'three';

export function detectSoftwareWebGL(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) {
      const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
      if (/SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(renderer)) {
        return true;
      }
    }
    const baseRenderer = String(gl.getParameter(gl.RENDERER) || '');
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(baseRenderer);
  } catch {
    return false;
  }
}

export class TextureVault {
  private textures: THREE.Texture[] = [];

  track<T extends THREE.Texture>(tex: T): T {
    this.textures.push(tex);
    return tex;
  }

  disposeAll(): void {
    for (const tex of this.textures) {
      tex.dispose();
    }
    this.textures = [];
  }

  createSoftGlowSprite(hexColor = '#ffe5a3'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.22, hexColor);
      grad.addColorStop(0.55, 'rgba(255, 214, 140, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return this.track(tex);
  }

  createWoodGrain(baseHex = '#4b3626', streakHex = '#2f1f14'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 180; i++) {
        const y = (i / 180) * 512;
        ctx.strokeStyle = i % 3 === 0 ? streakHex : 'rgba(255,235,205,0.06)';
        ctx.lineWidth = 1 + (i % 4) * 0.8;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= 512; x += 32) {
          const wave = Math.sin(x * 0.015 + i * 0.4) * 5;
          ctx.lineTo(x, y + wave);
        }
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return this.track(tex);
  }

  createLinenPaper(inked = true): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 512, 512);
      grad.addColorStop(0, '#f9f4e6');
      grad.addColorStop(1, '#ede3cc');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Subtle paper fibers
      ctx.fillStyle = 'rgba(130, 110, 82, 0.05)';
      for (let i = 0; i < 900; i++) {
        const x = (Math.sin(i * 19.3) * 0.5 + 0.5) * 512;
        const y = (Math.cos(i * 31.7) * 0.5 + 0.5) * 512;
        ctx.fillRect(x, y, 2, 1);
      }

      if (inked) {
        ctx.strokeStyle = 'rgba(116, 130, 108, 0.25)';
        ctx.lineWidth = 1;
        for (let y = 74; y < 450; y += 28) {
          ctx.beginPath();
          ctx.moveTo(48, y);
          ctx.lineTo(464, y);
          ctx.stroke();
        }
        // Soft handwritten strokes
        ctx.strokeStyle = 'rgba(48, 66, 51, 0.58)';
        ctx.lineWidth = 1.6;
        for (let row = 0; row < 9; row++) {
          const y = 70 + row * 28;
          const len = 180 + ((row * 73) % 190);
          ctx.beginPath();
          ctx.moveTo(54, y);
          for (let x = 54; x < 54 + len; x += 12) {
            ctx.lineTo(x, y - Math.sin(x * 0.24 + row) * 2.5);
          }
          ctx.stroke();
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return this.track(tex);
  }

  createWaterRippleNormal(): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const imgData = ctx.createImageData(size, size);
      const data = imgData.data;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const u = (x / size) * Math.PI * 2;
          const v = (y / size) * Math.PI * 2;
          const dx =
            Math.cos(u * 4 + v * 2) * 0.35 +
            Math.cos(u * 7 - v * 5) * 0.22 +
            Math.sin(u * 3 + v * 6) * 0.18;
          const dy =
            Math.sin(v * 4 + u * 2) * 0.35 +
            Math.sin(v * 8 - u * 3) * 0.22 +
            Math.cos(u * 5 + v * 4) * 0.18;
          const idx = (y * size + x) * 4;
          data[idx] = Math.round((dx * 0.5 + 0.5) * 255);
          data[idx + 1] = Math.round((dy * 0.5 + 0.5) * 255);
          data[idx + 2] = 230;
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return this.track(tex);
  }

  createStoneMoss(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#475046';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 420; i++) {
        const x = ((i * 89) % 256);
        const y = ((i * 151) % 256);
        const r = 3 + (i % 10);
        ctx.fillStyle =
          i % 4 === 0
            ? 'rgba(78, 108, 67, 0.32)'
            : i % 2 === 0
            ? 'rgba(34, 41, 36, 0.22)'
            : 'rgba(128, 134, 120, 0.16)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return this.track(tex);
  }

  createTarotRuneFace(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 512, 768);
      grad.addColorStop(0, '#18241d');
      grad.addColorStop(0.5, '#223328');
      grad.addColorStop(1, '#141d17');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 768);

      ctx.strokeStyle = '#d8be82';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, 464, 720);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(38, 38, 436, 692);

      // Crescent moon & celestial rings
      ctx.save();
      ctx.translate(256, 360);
      ctx.strokeStyle = 'rgba(232, 204, 138, 0.86)';
      ctx.lineWidth = 2.5;
      for (const r of [140, 105, 58]) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Star rays
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * 65, Math.sin(ang) * 65);
        ctx.lineTo(Math.cos(ang) * 145, Math.sin(ang) * 145);
        ctx.stroke();
      }
      ctx.fillStyle = '#f3d999';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return this.track(tex);
  }

  createSkyDome(
    topHex: string,
    horizonHex: string,
    withStars = true,
    options?: {
      midHex?: string;
      cloudTint?: string;
      sunHex?: string;
      sunX?: number;
      sunY?: number;
    }
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, topHex);
      if (options?.midHex) {
        grad.addColorStop(0.38, options.midHex);
      }
      grad.addColorStop(0.62, horizonHex);
      grad.addColorStop(1, horizonHex);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Soft painterly cloud banks near horizon/mid-sky
      if (options?.cloudTint) {
        for (let i = 0; i < 42; i++) {
          const cx = ((i * 173 + 64) % 1024);
          const cy = 120 + ((i * 67) % 175);
          const rx = 55 + (i % 5) * 28;
          const ry = 14 + (i % 4) * 7;
          const cGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, rx);
          cGrad.addColorStop(0, options.cloudTint);
          cGrad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = cGrad;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(1, ry / rx);
          ctx.beginPath();
          ctx.arc(0, 0, rx, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Soft sun / moon halo painted into the sky
      if (options?.sunHex) {
        const sx = (options.sunX ?? 0.65) * 1024;
        const sy = (options.sunY ?? 0.34) * 512;
        const sunGrad = ctx.createRadialGradient(sx, sy, 6, sx, sy, 145);
        sunGrad.addColorStop(0, '#ffffff');
        sunGrad.addColorStop(0.18, options.sunHex);
        sunGrad.addColorStop(0.5, 'rgba(255, 224, 150, 0.22)');
        sunGrad.addColorStop(1, 'rgba(255, 224, 150, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sx, sy, 145, 0, Math.PI * 2);
        ctx.fill();
      }

      if (withStars) {
        for (let i = 0; i < 190; i++) {
          const x = ((i * 397 + 31) % 1024);
          const y = ((i * 113 + 17) % 240);
          const alpha = 0.22 + ((i % 7) / 10);
          const rad = i % 11 === 0 ? 1.8 : 1.0;
          ctx.fillStyle = `rgba(255, 245, 214, ${alpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return this.track(tex);
  }

  createWaterfallFoam(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 256, 512);
      const baseGrad = ctx.createLinearGradient(0, 0, 0, 512);
      baseGrad.addColorStop(0, 'rgba(224, 248, 255, 0.55)');
      baseGrad.addColorStop(0.5, 'rgba(242, 252, 255, 0.78)');
      baseGrad.addColorStop(1, 'rgba(255, 255, 255, 0.92)');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, 256, 512);

      for (let i = 0; i < 64; i++) {
        const x = (i * 23) % 256;
        const y = (i * 41) % 512;
        const len = 70 + (i % 5) * 40;
        const w = 3 + (i % 4) * 2.5;
        const streak = ctx.createLinearGradient(x, y, x, y + len);
        streak.addColorStop(0, 'rgba(255,255,255,0)');
        streak.addColorStop(0.5, 'rgba(255,255,255,0.85)');
        streak.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = streak;
        ctx.fillRect(x, y, w, len);
        if (y + len > 512) {
          ctx.fillRect(x, y - 512, w, len);
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return this.track(tex);
  }

  createLimestoneKarst(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#5a6b59');
      grad.addColorStop(0.35, '#70746b');
      grad.addColorStop(1, '#4c514b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      // Vertical cliff strata & moss veins
      for (let i = 0; i < 160; i++) {
        const x = (i * 37) % 256;
        const y = (i * 61) % 256;
        const w = 3 + (i % 6) * 2;
        const h = 18 + (i % 7) * 14;
        ctx.fillStyle =
          i % 3 === 0
            ? 'rgba(54, 96, 52, 0.42)'
            : i % 2 === 0
            ? 'rgba(155, 152, 138, 0.25)'
            : 'rgba(35, 38, 36, 0.28)';
        ctx.fillRect(x, y, w, h);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return this.track(tex);
  }

  createBotanicalSprig(kind: 'oak' | 'pine' | 'plum' | 'palm'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 256, 256);
      if (kind === 'plum') {
        // Twig + crimson plum blossoms
        ctx.strokeStyle = '#3b241d';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(20, 220);
        ctx.quadraticCurveTo(120, 140, 232, 62);
        ctx.stroke();

        const blooms = [
          [72, 168, 22], [116, 132, 26], [156, 108, 24],
          [198, 82, 21], [95, 190, 18], [148, 155, 20],
          [178, 132, 19], [216, 102, 16], [56, 138, 18],
        ];
        for (const [bx, by, r] of blooms) {
          for (let p = 0; p < 5; p++) {
            const ang = (p / 5) * Math.PI * 2;
            ctx.fillStyle = p % 2 === 0 ? '#e33b4a' : '#f25c6b';
            ctx.beginPath();
            ctx.arc(bx + Math.cos(ang) * r * 0.45, by + Math.sin(ang) * r * 0.45, r * 0.48, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#ffe27a';
          ctx.beginPath();
          ctx.arc(bx, by, r * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (kind === 'palm') {
        // Tropical banana / fan palm frond
        ctx.strokeStyle = '#4e7a34';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(128, 245);
        ctx.quadraticCurveTo(128, 135, 128, 28);
        ctx.stroke();
        for (let i = 0; i < 16; i++) {
          const t = i / 15;
          const y = 210 - t * 175;
          const span = Math.sin(t * Math.PI * 0.9 + 0.2) * 95;
          for (const dir of [-1, 1]) {
            ctx.fillStyle = i % 2 === 0 ? '#5c9438' : '#73ad46';
            ctx.beginPath();
            ctx.moveTo(128, y);
            ctx.quadraticCurveTo(128 + dir * span * 0.55, y - 14, 128 + dir * span, y + 8);
            ctx.quadraticCurveTo(128 + dir * span * 0.5, y + 10, 128, y + 6);
            ctx.fill();
          }
        }
      } else {
        // Rich layered leaf cluster (oak or cliff pine)
        const colors = kind === 'pine'
          ? ['#234f34', '#2e6642', '#3d7e4e']
          : ['#3b7438', '#4f9144', '#6bb054'];
        for (let i = 0; i < 48; i++) {
          const ang = (i * 137.5 * Math.PI) / 180;
          const rad = Math.sqrt(i / 48) * 84;
          const lx = 128 + Math.cos(ang) * rad;
          const ly = 128 + Math.sin(ang) * rad * 0.85;
          ctx.fillStyle = colors[i % colors.length];
          ctx.beginPath();
          ctx.ellipse(lx, ly, kind === 'pine' ? 24 : 20, kind === 'pine' ? 11 : 14, ang, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return this.track(tex);
  }
}
