import * as THREE from 'three';

/**
 * High-quality procedural textures generated via HTML5 Canvas
 * Zero external network dependencies, 100% reliable, styled to match the Heali dreamscape.
 */

// Helper to create an offscreen canvas
function createOffscreen(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

// Cache textures so we don't recreate them needlessly
const textureCache: { [key: string]: THREE.CanvasTexture } = {};

/**
 * 1. Curving Flagstone / Cobblestone Path Texture
 */
export function getFlagstoneTexture(): THREE.CanvasTexture {
  if (textureCache['flagstone']) return textureCache['flagstone'];

  const { canvas, ctx } = createOffscreen(512, 512);

  // Background dirt/moss base
  ctx.fillStyle = '#1c1d36';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle moss noise
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 3 + 1;
    ctx.fillStyle = Math.random() > 0.5 ? '#243b34' : '#172722';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw irregular flagstones
  const stones = [
    { x: 40, y: 50, rx: 55, ry: 40, rot: 0.1, color: '#3a3c63' },
    { x: 160, y: 45, rx: 50, ry: 35, rot: -0.15, color: '#434670' },
    { x: 280, y: 55, rx: 60, ry: 42, rot: 0.2, color: '#35375c' },
    { x: 420, y: 50, rx: 65, ry: 40, rot: -0.05, color: '#3f426b' },

    { x: 100, y: 140, rx: 65, ry: 45, rot: -0.1, color: '#444874' },
    { x: 225, y: 145, rx: 50, ry: 38, rot: 0.25, color: '#37395e' },
    { x: 350, y: 135, rx: 65, ry: 42, rot: -0.2, color: '#494d7d' },
    { x: 470, y: 140, rx: 45, ry: 35, rot: 0.1, color: '#393c61' },

    { x: 45, y: 240, rx: 50, ry: 40, rot: 0.15, color: '#36395e' },
    { x: 165, y: 235, rx: 60, ry: 45, rot: -0.05, color: '#434772' },
    { x: 290, y: 240, rx: 55, ry: 40, rot: 0.12, color: '#3c3f68' },
    { x: 420, y: 230, rx: 62, ry: 42, rot: -0.18, color: '#464a78' },

    { x: 95, y: 340, rx: 58, ry: 42, rot: -0.2, color: '#3e416a' },
    { x: 220, y: 335, rx: 60, ry: 45, rot: 0.1, color: '#494d7d' },
    { x: 345, y: 345, rx: 55, ry: 38, rot: -0.1, color: '#36385d' },
    { x: 465, y: 330, rx: 50, ry: 36, rot: 0.2, color: '#40436d' },

    { x: 50, y: 440, rx: 55, ry: 40, rot: 0.05, color: '#444874' },
    { x: 170, y: 445, rx: 52, ry: 38, rot: -0.12, color: '#37395f' },
    { x: 295, y: 440, rx: 62, ry: 45, rot: 0.18, color: '#454976' },
    { x: 425, y: 445, rx: 58, ry: 40, rot: -0.08, color: '#3b3e66' },
  ];

  stones.forEach((s) => {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);

    // Stone body
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s.rx, s.ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stone highlight at top edge (moonlight sheen)
    ctx.strokeStyle = '#5c6096';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, -2, s.rx - 3, s.ry - 3, 0, Math.PI * 0.9, Math.PI * 2.1);
    ctx.stroke();

    // Stone bottom shadow
    ctx.strokeStyle = '#141426';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, 2, s.rx - 2, s.ry - 2, 0, 0, Math.PI);
    ctx.stroke();

    ctx.restore();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache['flagstone'] = texture;
  return texture;
}

/**
 * 2. Warm Oak / Cedar Wood Plank Texture (For Bridges, Docks, Timber Beams)
 */
export function getWoodPlankTexture(): THREE.CanvasTexture {
  if (textureCache['wood_plank']) return textureCache['wood_plank'];

  const { canvas, ctx } = createOffscreen(512, 512);

  // Warm cedar base
  ctx.fillStyle = '#8b5e3c';
  ctx.fillRect(0, 0, 512, 512);

  const plankHeight = 64;
  for (let y = 0; y < 512; y += plankHeight) {
    ctx.fillStyle = (y / plankHeight) % 2 === 0 ? '#9c6b46' : '#8e5f3d';
    ctx.fillRect(0, y, 512, plankHeight - 3);

    ctx.strokeStyle = '#734b2e';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 7; i++) {
      const lineY = y + (i * plankHeight) / 7 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.bezierCurveTo(150, lineY + Math.random() * 5 - 2.5, 350, lineY + Math.random() * 5 - 2.5, 512, lineY);
      ctx.stroke();
    }

    ctx.strokeStyle = '#b4845e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y + 2);
    ctx.lineTo(512, y + 2);
    ctx.stroke();

    ctx.fillStyle = '#5a3a23';
    ctx.fillRect(0, y + plankHeight - 3, 512, 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache['wood_plank'] = texture;
  return texture;
}

/**
 * 3. Storybook Forest-Sage Shingle Roof Texture
 */
export function getMossyRoofTexture(): THREE.CanvasTexture {
  if (textureCache['mossy_roof']) return textureCache['mossy_roof'];

  const { canvas, ctx } = createOffscreen(512, 512);

  // Fresh forest-sage green shingle base
  ctx.fillStyle = '#3f8a58';
  ctx.fillRect(0, 0, 512, 512);

  const rowH = 42;
  const colW = 64;

  for (let r = 0; r < 512; r += rowH) {
    const isOdd = Math.floor(r / rowH) % 2 === 1;
    const offset = isOdd ? colW / 2 : 0;

    for (let c = -colW; c < 512 + colW; c += colW) {
      const x = c + offset;
      const y = r;

      ctx.fillStyle = (r + c) % 3 === 0 ? '#45945f' : (r + c) % 3 === 1 ? '#3b8253' : '#4fa069';
      ctx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);

      if (Math.random() > 0.55) {
        ctx.fillStyle = Math.random() > 0.5 ? '#5bad74' : '#35744a';
        ctx.beginPath();
        ctx.arc(x + colW / 2 + (Math.random() * 8 - 4), y + rowH / 2, Math.random() * 10 + 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = '#5db479';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x + 2, y + 2, colW - 4, rowH - 4);

      ctx.fillStyle = '#2d633f';
      ctx.fillRect(x, y + rowH - 3, colW, 3);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache['mossy_roof'] = texture;
  return texture;
}

/**
 * 4. Cozy Glowing Latticed Window Texture (Warm Golden Interior Glow)
 */
export function getGlowingWindowTexture(): THREE.CanvasTexture {
  if (textureCache['glowing_window']) return textureCache['glowing_window'];

  const { canvas, ctx } = createOffscreen(256, 256);

  // Outer timber frame
  ctx.fillStyle = '#2d1c14';
  ctx.fillRect(0, 0, 256, 256);

  // Inner warm light gradient
  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 130);
  grad.addColorStop(0, '#fff4cc');
  grad.addColorStop(0.3, '#fed7aa');
  grad.addColorStop(0.7, '#f59e0b');
  grad.addColorStop(1, '#b45309');

  ctx.fillStyle = grad;
  ctx.fillRect(16, 16, 224, 224);

  // Soft curtain silhouettes at sides
  ctx.fillStyle = 'rgba(162, 70, 30, 0.45)';
  ctx.beginPath();
  ctx.moveTo(16, 16);
  ctx.quadraticCurveTo(70, 128, 20, 240);
  ctx.lineTo(16, 240);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(240, 16);
  ctx.quadraticCurveTo(186, 128, 236, 240);
  ctx.lineTo(240, 240);
  ctx.fill();

  // Dark timber muntins / window pane lattice
  ctx.strokeStyle = '#26150e';
  ctx.lineWidth = 8;

  // Window border
  ctx.strokeRect(16, 16, 224, 224);

  // Center vertical divider
  ctx.beginPath();
  ctx.moveTo(128, 16);
  ctx.lineTo(128, 240);
  ctx.stroke();

  // Horizontal lattice dividers
  ctx.lineWidth = 6;
  [76, 136, 196].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(240, y);
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache['glowing_window'] = texture;
  return texture;
}

/**
 * 5. Light Botanical Stone Foundation & Steps Texture
 */
export function getStoneFoundationTexture(): THREE.CanvasTexture {
  if (textureCache['stone_foundation']) return textureCache['stone_foundation'];

  const { canvas, ctx } = createOffscreen(512, 512);

  // Soft cream-gray mortar background
  ctx.fillStyle = '#9aa39c';
  ctx.fillRect(0, 0, 512, 512);

  const colors = ['#b8c0b8', '#c6cdc5', '#a9b3ac', '#cfd6ce', '#b0bab2'];
  for (let y = 0; y < 512; y += 45) {
    let x = y % 90 === 0 ? 0 : -30;
    while (x < 512) {
      const w = Math.random() * 40 + 50;
      const h = 36;
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.beginPath();
      ctx.roundRect(x + 4, y + 4, w - 8, h - 8, 6);
      ctx.fill();

      ctx.strokeStyle = '#dde3dc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 6);
      ctx.lineTo(x + w - 8, y + 6);
      ctx.stroke();

      x += w;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache['stone_foundation'] = texture;
  return texture;
}

/**
 * 6. Tranquil Jade-Sage Water Ripple Map
 */
export function getWaterRippleTexture(): THREE.CanvasTexture {
  if (textureCache['water_ripple']) return textureCache['water_ripple'];

  const { canvas, ctx } = createOffscreen(256, 256);

  ctx.fillStyle = '#476e5e';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 28; i++) {
    const cx = Math.random() * 256;
    const cy = Math.random() * 256;
    const r = Math.random() * 46 + 14;

    ctx.strokeStyle = 'rgba(220, 238, 229, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache['water_ripple'] = texture;
  return texture;
}

/**
 * 7. Polished Interior Hardwood Parquet Plank Texture
 */
export function getParquetFloorTexture(): THREE.CanvasTexture {
  if (textureCache['parquet_floor']) return textureCache['parquet_floor'];

  const { canvas, ctx } = createOffscreen(512, 512);

  // Deep rich walnut wood base
  ctx.fillStyle = '#2a1a12';
  ctx.fillRect(0, 0, 512, 512);

  const plankW = 64;
  const plankH = 128;

  for (let y = 0; y < 512; y += plankH) {
    for (let x = 0; x < 512; x += plankW) {
      const isShifted = Math.floor(y / plankH) % 2 === 1;
      const actualX = (x + (isShifted ? plankW / 2 : 0)) % 512;

      // Slight tone shift per wood plank
      const toneSeed = (x * 13 + y * 7) % 5;
      ctx.fillStyle =
        toneSeed === 0 ? '#382218' :
        toneSeed === 1 ? '#42281d' :
        toneSeed === 2 ? '#2e1b13' :
        toneSeed === 3 ? '#3f251a' : '#331d15';
      ctx.fillRect(actualX + 1, y + 1, plankW - 2, plankH - 2);

      // Fine wood grain
      ctx.strokeStyle = '#22130c';
      ctx.lineWidth = 1;
      for (let g = 0; g < 4; g++) {
        const grainX = actualX + g * 15 + Math.random() * 4;
        ctx.beginPath();
        ctx.moveTo(grainX, y);
        ctx.bezierCurveTo(grainX + 3, y + plankH * 0.4, grainX - 3, y + plankH * 0.7, grainX, y + plankH);
        ctx.stroke();
      }

      // Plank seams
      ctx.strokeStyle = '#180d08';
      ctx.lineWidth = 2;
      ctx.strokeRect(actualX, y, plankW, plankH);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache['parquet_floor'] = texture;
  return texture;
}

/**
 * 8. Cozy Woolen Fleece Area Rug Texture with Subtle Nordic Diamond Pattern
 */
export function getCozyRugTexture(): THREE.CanvasTexture {
  if (textureCache['cozy_rug']) return textureCache['cozy_rug'];

  const { canvas, ctx } = createOffscreen(512, 512);

  // Soft cream / oatmeal base
  ctx.fillStyle = '#dfd6c8';
  ctx.fillRect(0, 0, 512, 512);

  // Fleece texture fibers
  for (let i = 0; i < 4000; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? '#f5eee3' : '#cebeaa';
    ctx.beginPath();
    ctx.arc(rx, ry, Math.random() * 2 + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Woven muted charcoal diamond motifs
  ctx.strokeStyle = '#7c6d60';
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 4]);

  for (let y = 64; y <= 448; y += 128) {
    for (let x = 64; x <= 448; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, y - 48);
      ctx.lineTo(x + 48, y);
      ctx.lineTo(x, y + 48);
      ctx.lineTo(x - 48, y);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Rug fringed border
  ctx.setLineDash([]);
  ctx.strokeStyle = '#938274';
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, 480, 480);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache['cozy_rug'] = texture;
  return texture;
}

/**
 * 9. Bookshelf Spines Texture
 */
export function getBookSpineTexture(): THREE.CanvasTexture {
  if (textureCache['book_spines']) return textureCache['book_spines'];

  const { canvas, ctx } = createOffscreen(512, 256);

  ctx.fillStyle = '#26150e';
  ctx.fillRect(0, 0, 512, 256);

  const colors = ['#831843', '#1e3a8a', '#14532d', '#78350f', '#3b0764', '#701a75', '#451a03', '#1f2937'];
  let currentX = 8;

  while (currentX < 500) {
    const bookW = Math.random() * 16 + 18;
    const bookH = 220 + Math.random() * 26;
    const color = colors[Math.floor(Math.random() * colors.length)];

    ctx.fillStyle = color;
    ctx.fillRect(currentX, 256 - bookH, bookW - 2, bookH);

    // Gold foil ribs & title bands
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(currentX + 2, 256 - bookH + 20, bookW - 6, 3);
    ctx.fillRect(currentX + 2, 256 - bookH + 28, bookW - 6, 2);
    ctx.fillRect(currentX + 2, 256 - 35, bookW - 6, 2);

    // Spine shading
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(currentX, 256 - bookH, 3, bookH);
    ctx.fillRect(currentX + bookW - 4, 256 - bookH, 2, bookH);

    currentX += bookW;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache['book_spines'] = texture;
  return texture;
}

/**
 * 10. Open Journal Notebook Pages Texture
 */
export function getJournalPageTexture(): THREE.CanvasTexture {
  if (textureCache['journal_page']) return textureCache['journal_page'];

  const { canvas, ctx } = createOffscreen(512, 384);

  // Aged parchment background
  ctx.fillStyle = '#faf3e0';
  ctx.fillRect(0, 0, 512, 384);

  // Center seam spine shadow
  const grad = ctx.createLinearGradient(230, 0, 282, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.5, 'rgba(92,58,34,0.4)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(230, 0, 52, 384);

  // Handwritten cursive text line silhouettes
  ctx.fillStyle = '#6b4f3b';
  // Left page lines
  for (let y = 50; y < 340; y += 18) {
    const lineWidth = Math.random() * 60 + 130;
    ctx.fillRect(40, y, lineWidth, 2);
    // Bullet / small sketch
    if (y % 54 === 0) {
      ctx.beginPath();
      ctx.arc(32, y + 1, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Right page lines
  for (let y = 50; y < 340; y += 18) {
    const lineWidth = Math.random() * 70 + 120;
    ctx.fillRect(285, y, lineWidth, 2);
  }

  // Crimson ribbon bookmark
  ctx.fillStyle = '#be123c';
  ctx.beginPath();
  ctx.moveTo(252, 0);
  ctx.lineTo(260, 0);
  ctx.lineTo(264, 384);
  ctx.lineTo(256, 370);
  ctx.lineTo(248, 384);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache['journal_page'] = texture;
  return texture;
}

/**
 * 11. Realistic Fissured Oak/Pine Bark Albedo + Bump Texture Pair
 */
export function getBarkTexture(): THREE.CanvasTexture {
  if (textureCache['bark_diff']) return textureCache['bark_diff'];
  const { canvas, ctx } = createOffscreen(256, 512);

  ctx.fillStyle = '#4e3929';
  ctx.fillRect(0, 0, 256, 512);

  // Vertical bark fissures & plates
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 512;
    const w = 4 + Math.random() * 14;
    const h = 40 + Math.random() * 110;
    const shade = Math.random();
    ctx.fillStyle =
      shade < 0.35
        ? 'rgba(34, 22, 14, 0.72)'
        : shade < 0.72
          ? 'rgba(102, 77, 56, 0.55)'
          : 'rgba(122, 108, 86, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.5, h * 0.5, (Math.random() - 0.5) * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle pale sage lichen patches
  for (let i = 0; i < 42; i++) {
    ctx.fillStyle = 'rgba(126, 148, 114, 0.25)';
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 512, 3 + Math.random() * 8, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  textureCache['bark_diff'] = texture;
  return texture;
}

export function getBarkBumpTexture(): THREE.CanvasTexture {
  if (textureCache['bark_bump']) return textureCache['bark_bump'];
  const { canvas, ctx } = createOffscreen(256, 512);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 512);

  for (let i = 0; i < 160; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 512;
    const v = Math.random() > 0.45 ? 215 : 35;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x, y, 3 + Math.random() * 6, 36 + Math.random() * 90);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache['bark_bump'] = texture;
  return texture;
}

/**
 * 12. Alpha-Cutout Botanical Foliage Sprig Texture (Deciduous / Sakura / Pine / Willow / Crimson Plum / Tropical Palm)
 */
export function getFoliageSprigTexture(
  variant: 'oak' | 'sakura' | 'pine' | 'willow' | 'crimson_plum' | 'tropical_palm'
): THREE.CanvasTexture {
  const key = `foliage_sprig_${variant}`;
  if (textureCache[key]) return textureCache[key];

  const { canvas, ctx } = createOffscreen(256, 256);
  ctx.clearRect(0, 0, 256, 256);

  if (variant === 'tropical_palm') {
    // Broad lush banana / fan palm fronds radiating outward
    const frondColors = ['#2e6f34', '#3d8540', '#4f9c4b', '#66b256'];
    const angles = [-1.15, -0.75, -0.35, 0.05, 0.45, 0.85, 1.2];
    angles.forEach((ang, idx) => {
      ctx.save();
      ctx.translate(128, 232);
      ctx.rotate(ang);
      ctx.fillStyle = frondColors[idx % frondColors.length];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-24, -95, -8, -192);
      ctx.quadraticCurveTo(0, -206, 8, -192);
      ctx.quadraticCurveTo(24, -95, 0, 0);
      ctx.fill();

      ctx.strokeStyle = 'rgba(218, 244, 174, 0.36)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(0, -186);
      ctx.stroke();
      ctx.restore();
    });
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    textureCache[key] = texture;
    return texture;
  }

  // Subtle twig stems inside spray
  ctx.strokeStyle =
    variant === 'sakura' || variant === 'crimson_plum' ? '#3f2622' : '#4a3928';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(128, 244);
  ctx.quadraticCurveTo(124, 150, 128, 46);
  ctx.moveTo(126, 172);
  ctx.quadraticCurveTo(86, 134, 54, 108);
  ctx.moveTo(128, 152);
  ctx.quadraticCurveTo(170, 118, 202, 92);
  ctx.stroke();

  if (variant === 'pine') {
    const shades = ['#21442c', '#2b5638', '#356844', '#1d3b27', '#427750'];
    for (let i = 0; i < 130; i++) {
      const cx = 128 + (Math.random() - 0.5) * 145;
      const cy = 38 + Math.random() * 190;
      const dx = (Math.random() - 0.5) * 44;
      const dy = -12 - Math.random() * 28;
      ctx.strokeStyle = shades[i % shades.length];
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + dx, cy + dy);
      ctx.stroke();
    }
  } else if (variant === 'willow') {
    const shades = ['#538148', '#689657', '#446e3c', '#7aa764'];
    // Vertical cascading narrow willow leaves along drooping tendrils
    for (let strand = 0; strand < 7; strand++) {
      const sx = 46 + strand * 27 + (Math.random() - 0.5) * 8;
      ctx.strokeStyle = '#5c6b3d';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sx, 12);
      ctx.quadraticCurveTo(sx + (Math.random() - 0.5) * 14, 128, sx, 244);
      ctx.stroke();
      for (let y = 18; y < 242; y += 12) {
        const side = y % 24 === 0 ? 1 : -1;
        ctx.fillStyle = shades[(strand + y) % shades.length];
        ctx.save();
        ctx.translate(sx + side * 4, y);
        ctx.rotate(side * 0.35);
        ctx.beginPath();
        ctx.ellipse(0, 0, 3.2, 11.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  } else {
    const leafColors =
      variant === 'sakura'
        ? ['#fbcfe8', '#f9a8d4', '#f472b6', '#fce7f3', '#fff1f2']
        : variant === 'crimson_plum'
          ? ['#e11d48', '#f43f5e', '#be123c', '#fb7185', '#fda4af']
          : ['#3f6b3a', '#4e8046', '#619352', '#355c31', '#75a65e'];

    const count = variant === 'sakura' || variant === 'crimson_plum' ? 74 : 56;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const rad = Math.sqrt(Math.random()) * 94;
      const lx = 128 + Math.cos(angle) * rad;
      const ly = 128 + Math.sin(angle) * rad * 0.92;
      const isBlossom = variant === 'sakura' || variant === 'crimson_plum';
      const rx = isBlossom ? 10 + Math.random() * 9 : 13 + Math.random() * 11;
      const ry = isBlossom ? 9 + Math.random() * 7 : 8 + Math.random() * 7;

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(angle + Math.random() * 1.1);
      ctx.fillStyle = leafColors[i % leafColors.length];
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Subtle petal core or leaf midrib
      if (isBlossom) {
        ctx.fillStyle =
          variant === 'crimson_plum' ? 'rgba(254, 240, 138, 0.55)' : 'rgba(244, 63, 94, 0.32)';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(255,255,230,0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-rx * 0.7, 0);
        ctx.lineTo(rx * 0.7, 0);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  textureCache[key] = texture;
  return texture;
}

/**
 * 13. Warm Weathered Lime Stucco Wall Texture & Subtle Bump Map
 */
export function getLimeStuccoTexture(): THREE.CanvasTexture {
  if (textureCache['lime_stucco']) return textureCache['lime_stucco'];
  const { canvas, ctx } = createOffscreen(512, 512);

  ctx.fillStyle = '#efe7d8';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle warm mineral blotches
  for (let i = 0; i < 420; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 8 + Math.random() * 28;
    ctx.fillStyle =
      Math.random() > 0.5 ? 'rgba(227, 214, 193, 0.28)' : 'rgba(252, 249, 242, 0.24)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Faint lower wall dampness patina
  const patina = ctx.createLinearGradient(0, 380, 0, 512);
  patina.addColorStop(0, 'rgba(130, 140, 118, 0)');
  patina.addColorStop(1, 'rgba(120, 130, 108, 0.16)');
  ctx.fillStyle = patina;
  ctx.fillRect(0, 380, 512, 132);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  textureCache['lime_stucco'] = texture;
  return texture;
}

/**
 * 14. Rich Slate / Cedar Roof Tile Texture
 */
export function getSlateShingleTexture(
  palette: 'slate' | 'terracotta' | 'moss_cedar' = 'slate'
): THREE.CanvasTexture {
  const key = `roof_tile_${palette}`;
  if (textureCache[key]) return textureCache[key];
  const { canvas, ctx } = createOffscreen(512, 512);

  const colors =
    palette === 'terracotta'
      ? ['#9f4e37', '#8c412d', '#ad5940', '#7e3a28']
      : palette === 'moss_cedar'
        ? ['#455d49', '#3b513f', '#526b55', '#4c5b43']
        : ['#414d54', '#374249', '#4c5961', '#3b484e'];

  ctx.fillStyle = colors[1];
  ctx.fillRect(0, 0, 512, 512);

  const rows = 12;
  const cols = 10;
  const rowH = 512 / rows;
  const colW = 512 / cols;

  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 1 ? colW * 0.5 : 0;
    for (let c = -1; c <= cols; c++) {
      const x = c * colW + offset;
      const y = r * rowH;
      ctx.fillStyle = colors[(r * 7 + c * 3 + 100) % colors.length];
      ctx.fillRect(x + 1.5, y + 1.5, colW - 3, rowH - 3);

      // Tile bottom overlap shadow
      ctx.fillStyle = 'rgba(18, 22, 24, 0.36)';
      ctx.fillRect(x, y + rowH - 4, colW, 4);

      // Sunlit upper bevel
      ctx.fillStyle = 'rgba(255, 250, 240, 0.1)';
      ctx.fillRect(x + 2, y + 2, colW - 4, 3);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  textureCache[key] = texture;
  return texture;
}

/**
 * 15. Natural Sunlit Stepping Cobblestone & Earth Path Texture
 */
export function getSunlitCobbleTexture(): THREE.CanvasTexture {
  if (textureCache['sunlit_cobble']) return textureCache['sunlit_cobble'];
  const { canvas, ctx } = createOffscreen(512, 512);

  ctx.fillStyle = '#9b9178';
  ctx.fillRect(0, 0, 512, 512);

  // Fine gravel & moss earth base
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = Math.random() > 0.4 ? '#8a826b' : '#748262';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
  }

  // Flagstone slabs
  const stonePalette = ['#d8d3c5', '#c8c3b6', '#dfdbd0', '#beb9ab', '#cfc9bb'];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 5; col++) {
      const sx = col * 102 + (row % 2 === 0 ? 48 : 22) + (Math.random() - 0.5) * 14;
      const sy = row * 85 + 42 + (Math.random() - 0.5) * 12;
      const rx = 28 + Math.random() * 14;
      const ry = 22 + Math.random() * 11;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate((Math.random() - 0.5) * 0.5);
      ctx.fillStyle = stonePalette[(row * 5 + col) % stonePalette.length];
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(72, 68, 56, 0.35)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  textureCache['sunlit_cobble'] = texture;
  return texture;
}

