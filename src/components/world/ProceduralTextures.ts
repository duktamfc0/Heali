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

  const { canvas, ctx } = createOffscreen(1024, 1024);

  // Soft cream / oatmeal woven base
  ctx.fillStyle = '#ddd3c4';
  ctx.fillRect(0, 0, 1024, 1024);

  // Crisp weft & warp woven threads
  for (let y = 0; y < 1024; y += 6) {
    ctx.fillStyle = y % 12 === 0 ? 'rgba(246, 240, 230, 0.32)' : 'rgba(186, 170, 150, 0.24)';
    ctx.fillRect(0, y, 1024, 2);
  }
  for (let i = 0; i < 6500; i++) {
    const rx = ((i * 733) % 1024);
    const ry = ((i * 419) % 1024);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(248, 242, 232, 0.42)' : 'rgba(195, 179, 160, 0.38)';
    ctx.fillRect(rx, ry, 3, 2);
  }

  // Woven muted charcoal & sage geometric diamond motifs
  ctx.strokeStyle = '#736457';
  ctx.lineWidth = 5;
  ctx.setLineDash([8, 6]);

  for (let y = 128; y <= 896; y += 256) {
    for (let x = 128; x <= 896; x += 256) {
      ctx.beginPath();
      ctx.moveTo(x, y - 92);
      ctx.lineTo(x + 92, y);
      ctx.lineTo(x, y + 92);
      ctx.lineTo(x - 92, y);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y - 42);
      ctx.lineTo(x + 42, y);
      ctx.lineTo(x, y + 42);
      ctx.lineTo(x - 42, y);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Outer double border + tasseled edge
  ctx.setLineDash([]);
  ctx.strokeStyle = '#8b7a6c';
  ctx.lineWidth = 14;
  ctx.strokeRect(28, 28, 968, 968);
  ctx.strokeStyle = '#67584c';
  ctx.lineWidth = 4;
  ctx.strokeRect(52, 52, 920, 920);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textureCache['cozy_rug'] = texture;
  return texture;
}

/**
 * 9. Bookshelf Spines Texture (High-Definition Gold-Foil Leather Spines)
 */
export function getBookSpineTexture(): THREE.CanvasTexture {
  if (textureCache['book_spines']) return textureCache['book_spines'];

  const { canvas, ctx } = createOffscreen(1024, 512);

  ctx.fillStyle = '#20110b';
  ctx.fillRect(0, 0, 1024, 512);

  const colors = [
    '#7f1d1d',
    '#1e3a8a',
    '#14532d',
    '#78350f',
    '#4c1d95',
    '#701a75',
    '#451a03',
    '#1f2937',
    '#0f5132',
    '#92400e',
  ];
  let currentX = 12;
  let idx = 0;

  while (currentX < 1004) {
    const bookW = 30 + ((idx * 17) % 28);
    const bookH = 420 + ((idx * 31) % 72);
    const color = colors[idx % colors.length];
    const topY = 512 - bookH;

    ctx.fillStyle = color;
    ctx.fillRect(currentX, topY, bookW - 4, bookH);

    // Highlight spine curvature
    const spineGrad = ctx.createLinearGradient(currentX, 0, currentX + bookW - 4, 0);
    spineGrad.addColorStop(0, 'rgba(0,0,0,0.34)');
    spineGrad.addColorStop(0.28, 'rgba(255,255,255,0.14)');
    spineGrad.addColorStop(0.75, 'rgba(0,0,0,0.06)');
    spineGrad.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = spineGrad;
    ctx.fillRect(currentX, topY, bookW - 4, bookH);

    // Gold foil ribs, title plate & filigree bands
    ctx.fillStyle = '#eab308';
    ctx.fillRect(currentX + 3, topY + 28, bookW - 10, 5);
    ctx.fillRect(currentX + 3, topY + 40, bookW - 10, 3);
    ctx.fillRect(currentX + 3, 512 - 58, bookW - 10, 4);
    ctx.fillRect(currentX + 3, 512 - 44, bookW - 10, 3);

    if (idx % 2 === 0) {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
      ctx.fillRect(currentX + 6, topY + 64, bookW - 16, 46);
      ctx.fillStyle = '#3b2314';
      ctx.fillRect(currentX + 9, topY + 78, bookW - 22, 4);
      ctx.fillRect(currentX + 9, topY + 90, bookW - 22, 4);
    }

    currentX += bookW;
    idx++;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textureCache['book_spines'] = texture;
  return texture;
}

/**
 * 10. Open Journal Notebook Pages Texture (Crisp Ruled Parchment & Botanical Sketch)
 */
export function getJournalPageTexture(): THREE.CanvasTexture {
  if (textureCache['journal_page']) return textureCache['journal_page'];

  const { canvas, ctx } = createOffscreen(1024, 768);

  // Aged parchment background
  ctx.fillStyle = '#faf3e0';
  ctx.fillRect(0, 0, 1024, 768);

  // Faint ruled lines
  ctx.strokeStyle = 'rgba(138, 114, 90, 0.18)';
  ctx.lineWidth = 2;
  for (let y = 96; y < 688; y += 34) {
    ctx.beginPath();
    ctx.moveTo(72, y);
    ctx.lineTo(460, y);
    ctx.moveTo(564, y);
    ctx.lineTo(952, y);
    ctx.stroke();
  }

  // Center seam spine shadow
  const grad = ctx.createLinearGradient(460, 0, 564, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.5, 'rgba(92,58,34,0.44)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(460, 0, 104, 768);

  // Crisp handwritten ink line silhouettes
  ctx.fillStyle = '#5c4230';
  for (let i = 0, y = 90; y < 670; y += 34, i++) {
    const lineWidth = 240 + ((i * 53) % 130);
    ctx.fillRect(82, y, lineWidth, 4);
    if (i % 3 === 0) {
      ctx.beginPath();
      ctx.arc(64, y + 2, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0, y = 90; y < 670; y += 34, i++) {
    if (y > 460 && y < 620) continue; // reserve space for small leaf sketch
    const lineWidth = 220 + ((i * 67) % 140);
    ctx.fillRect(574, y, lineWidth, 4);
  }

  // Pressed botanical leaf ink sketch on lower right page
  ctx.strokeStyle = '#3f6244';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(720, 620);
  ctx.quadraticCurveTo(750, 540, 825, 480);
  ctx.stroke();
  [
    [742, 575, -0.5],
    [770, 540, 0.4],
    [795, 512, -0.4],
  ].forEach(([lx, ly, rot]) => {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.fillStyle = 'rgba(72, 118, 82, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  // Crimson ribbon bookmark
  ctx.fillStyle = '#be123c';
  ctx.beginPath();
  ctx.moveTo(504, 0);
  ctx.lineTo(520, 0);
  ctx.lineTo(526, 768);
  ctx.lineTo(512, 738);
  ctx.lineTo(498, 768);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
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

/**
 * 16. Fine Woven Japanese/East-Asian Tatami Mat Texture (Trà thất tâm tình)
 */
export function getTatamiMatTexture(): THREE.CanvasTexture {
  if (textureCache['tatami_mat']) return textureCache['tatami_mat'];
  const { canvas, ctx } = createOffscreen(1024, 1024);

  ctx.fillStyle = '#9aa86e';
  ctx.fillRect(0, 0, 1024, 1024);

  const mats = [
    { x: 0, y: 0, w: 512, h: 512, horiz: true },
    { x: 512, y: 0, w: 512, h: 512, horiz: false },
    { x: 0, y: 512, w: 512, h: 512, horiz: false },
    { x: 512, y: 512, w: 512, h: 512, horiz: true },
  ];

  mats.forEach((m, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#a4b277' : '#96a56b';
    ctx.fillRect(m.x + 18, m.y + 18, m.w - 36, m.h - 36);

    // Fine crisp Igusa rush reed weave
    ctx.strokeStyle = 'rgba(68, 78, 42, 0.24)';
    ctx.lineWidth = 2;
    if (m.horiz) {
      for (let yy = m.y + 24; yy < m.y + m.h - 22; yy += 8) {
        ctx.beginPath();
        ctx.moveTo(m.x + 22, yy);
        ctx.lineTo(m.x + m.w - 22, yy);
        ctx.stroke();
      }
    } else {
      for (let xx = m.x + 24; xx < m.x + m.w - 22; xx += 8) {
        ctx.beginPath();
        ctx.moveTo(xx, m.y + 22);
        ctx.lineTo(xx, m.y + m.h - 22);
        ctx.stroke();
      }
    }

    // Dark brocade cloth border (Heri)
    ctx.strokeStyle = '#2d3927';
    ctx.lineWidth = 26;
    ctx.strokeRect(m.x + 13, m.y + 13, m.w - 26, m.h - 26);

    // Gold brocade diamond thread on border
    ctx.strokeStyle = 'rgba(214, 178, 102, 0.42)';
    ctx.lineWidth = 3;
    ctx.strokeRect(m.x + 18, m.y + 18, m.w - 36, m.h - 36);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  textureCache['tatami_mat'] = texture;
  return texture;
}

/**
 * 17. Warm Travertine & Celadon Mosaic Stone Courtyard Texture (Đền Ước Nguyện / Phòng Mưa)
 */
export function getMosaicStoneTileTexture(): THREE.CanvasTexture {
  if (textureCache['mosaic_stone']) return textureCache['mosaic_stone'];
  const { canvas, ctx } = createOffscreen(1024, 1024);

  ctx.fillStyle = '#33423f';
  ctx.fillRect(0, 0, 1024, 1024);

  const tiles = 8;
  const size = 1024 / tiles;
  const palette = ['#5a6f69', '#4f635e', '#657a73', '#495b57', '#566b64'];

  for (let r = 0; r < tiles; r++) {
    for (let c = 0; c < tiles; c++) {
      const x = c * size;
      const y = r * size;
      ctx.fillStyle = palette[(r * 3 + c * 5) % palette.length];
      ctx.beginPath();
      ctx.roundRect(x + 5, y + 5, size - 10, size - 10, 10);
      ctx.fill();

      // Subtle mineral stone veins & bevels
      ctx.fillStyle = 'rgba(235, 244, 238, 0.1)';
      ctx.fillRect(x + 14, y + 14, size - 28, 6);
      ctx.fillStyle = 'rgba(18, 28, 26, 0.24)';
      ctx.fillRect(x + 14, y + size - 18, size - 28, 6);
      ctx.strokeStyle = 'rgba(218, 234, 226, 0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 18, y + size * 0.42);
      ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.54, x + size - 20, y + size * 0.36);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  textureCache['mosaic_stone'] = texture;
  return texture;
}

/**
 * 18. Deep Obsidian & Warm Gold Inlay Pagoda Floor Texture (Phòng Tâm Linh)
 */
export function getPagodaTileTexture(): THREE.CanvasTexture {
  if (textureCache['pagoda_tile']) return textureCache['pagoda_tile'];
  const { canvas, ctx } = createOffscreen(1024, 1024);

  ctx.fillStyle = '#171522';
  ctx.fillRect(0, 0, 1024, 1024);

  const step = 256;
  for (let y = 0; y < 1024; y += step) {
    for (let x = 0; x < 1024; x += step) {
      ctx.fillStyle = ((x + y) / step) % 2 === 0 ? '#242033' : '#1e1b2b';
      ctx.beginPath();
      ctx.roundRect(x + 8, y + 8, step - 16, step - 16, 14);
      ctx.fill();

      // Celestial brass double inlay border
      ctx.strokeStyle = 'rgba(218, 175, 86, 0.34)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 22, y + 22, step - 44, step - 44);
      ctx.strokeStyle = 'rgba(218, 175, 86, 0.16)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 32, y + 32, step - 64, step - 64);
    }
  }

  ctx.strokeStyle = 'rgba(229, 192, 108, 0.28)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(512, 512, 350, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(512, 512, 236, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  textureCache['pagoda_tile'] = texture;
  return texture;
}

export type PaintedVistaVariant =
  | 'meadow'
  | 'sakura'
  | 'moon'
  | 'rain_willow'
  | 'starry_peaks'
  | 'river_lanterns';

/**
 * 19. Rich Atmospheric Exterior Window Backdrop Painting (Displayed behind panoramic room glass)
 */
export function getPaintedVistaTexture(variant: PaintedVistaVariant): THREE.CanvasTexture {
  const key = `vista_${variant}`;
  if (textureCache[key]) return textureCache[key];

  const { canvas, ctx } = createOffscreen(512, 320);

  // Sky gradient per sanctuary biome
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 320);
  if (variant === 'meadow') {
    skyGrad.addColorStop(0, '#89c0d8');
    skyGrad.addColorStop(0.55, '#fde6c4');
    skyGrad.addColorStop(1, '#799c72');
  } else if (variant === 'sakura') {
    skyGrad.addColorStop(0, '#5a436e');
    skyGrad.addColorStop(0.55, '#f29e8e');
    skyGrad.addColorStop(1, '#4b3741');
  } else if (variant === 'moon') {
    skyGrad.addColorStop(0, '#10242c');
    skyGrad.addColorStop(0.6, '#284b4d');
    skyGrad.addColorStop(1, '#1c352a');
  } else if (variant === 'rain_willow') {
    skyGrad.addColorStop(0, '#2a414c');
    skyGrad.addColorStop(0.58, '#5b7c87');
    skyGrad.addColorStop(1, '#263d3c');
  } else if (variant === 'starry_peaks') {
    skyGrad.addColorStop(0, '#0f0e22');
    skyGrad.addColorStop(0.6, '#2b244e');
    skyGrad.addColorStop(1, '#1a152e');
  } else {
    skyGrad.addColorStop(0, '#132436');
    skyGrad.addColorStop(0.55, '#2b4f64');
    skyGrad.addColorStop(1, '#14303a');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 512, 320);

  // Sun, Full Moon, or Twinkling Stars
  if (variant === 'meadow') {
    const sun = ctx.createRadialGradient(350, 88, 6, 350, 88, 95);
    sun.addColorStop(0, 'rgba(255, 252, 232, 0.98)');
    sun.addColorStop(0.35, 'rgba(253, 224, 154, 0.52)');
    sun.addColorStop(1, 'rgba(253, 224, 154, 0)');
    ctx.fillStyle = sun;
    ctx.fillRect(240, 0, 230, 200);
  } else if (variant === 'moon' || variant === 'starry_peaks' || variant === 'river_lanterns') {
    // Twinkling night sky stars
    for (let i = 0; i < 65; i++) {
      ctx.fillStyle = `rgba(255, 248, 225, ${0.35 + ((i * 19) % 60) / 100})`;
      ctx.beginPath();
      ctx.arc((i * 83) % 512, (i * 47) % 190, i % 5 === 0 ? 1.8 : 1.0, 0, Math.PI * 2);
      ctx.fill();
    }
    const mx = variant === 'moon' ? 256 : variant === 'starry_peaks' ? 375 : 155;
    const my = variant === 'moon' ? 86 : 74;
    const moonGlow = ctx.createRadialGradient(mx, my, 12, mx, my, 92);
    moonGlow.addColorStop(0, 'rgba(255, 251, 235, 0.95)');
    moonGlow.addColorStop(0.3, 'rgba(254, 243, 199, 0.45)');
    moonGlow.addColorStop(1, 'rgba(254, 243, 199, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(mx, my, 92, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.arc(mx, my, 24, 0, Math.PI * 2);
    ctx.fill();
  }

  // Layered distant karst mountain ridges
  const drawRidge = (yBase: number, amp: number, freq: number, phase: number, col: string) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, 320);
    for (let x = 0; x <= 512; x += 8) {
      const y =
        yBase -
        Math.abs(Math.sin(x * freq + phase)) * amp -
        Math.sin(x * freq * 2.1 + phase * 1.4) * (amp * 0.3);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(512, 320);
    ctx.closePath();
    ctx.fill();
  };

  if (variant === 'meadow') {
    drawRidge(210, 58, 0.014, 0.5, '#7e9f94');
    drawRidge(238, 42, 0.018, 2.1, '#587d68');
    drawRidge(268, 22, 0.022, 1.0, '#446a49');
  } else if (variant === 'sakura') {
    drawRidge(212, 54, 0.013, 1.1, '#6f556e');
    drawRidge(242, 38, 0.019, 2.4, '#4c384b');
    // Framing cherry blossom clusters
    const blossoms = ['#fbcfe8', '#f9a8d4', '#f472b6', '#fce7f3'];
    for (let i = 0; i < 42; i++) {
      const bx = i < 21 ? (i * 11) % 190 : 340 + ((i * 13) % 175);
      const by = 18 + ((i * 29) % 130);
      ctx.fillStyle = blossoms[i % blossoms.length];
      ctx.beginPath();
      ctx.arc(bx, by, 7 + (i % 6), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (variant === 'rain_willow') {
    drawRidge(205, 52, 0.015, 0.9, '#39555f');
    drawRidge(242, 32, 0.02, 2.7, '#274046');
    // Soft mist band
    const mist = ctx.createLinearGradient(0, 170, 0, 275);
    mist.addColorStop(0, 'rgba(186, 230, 253, 0)');
    mist.addColorStop(0.5, 'rgba(186, 230, 253, 0.24)');
    mist.addColorStop(1, 'rgba(186, 230, 253, 0)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, 170, 512, 105);
  } else if (variant === 'starry_peaks') {
    drawRidge(205, 72, 0.016, 0.4, '#241d42');
    drawRidge(242, 46, 0.021, 1.9, '#191430');
  } else if (variant === 'moon') {
    drawRidge(214, 56, 0.014, 1.6, '#23423c');
    drawRidge(250, 34, 0.02, 0.8, '#172e28');
  } else {
    drawRidge(212, 50, 0.014, 0.8, '#1e3e4d');
    drawRidge(244, 30, 0.02, 2.2, '#132d38');
    // Distant glowing lotus lanterns on river
    for (let i = 0; i < 7; i++) {
      const lx = 55 + i * 68;
      const ly = 266 + (i % 3) * 12;
      const g = ctx.createRadialGradient(lx, ly, 2, lx, ly, 22);
      g.addColorStop(0, 'rgba(254, 243, 199, 0.95)');
      g.addColorStop(0.4, 'rgba(245, 158, 11, 0.45)');
      g.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lx, ly, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Soft foreground pine & tree silhouettes along bottom edge
  ctx.fillStyle =
    variant === 'meadow' ? '#2e4e35' : variant === 'sakura' ? '#362332' : '#101d1d';
  for (let x = 0; x <= 512; x += 26) {
    const h = 34 + ((x * 17) % 36);
    ctx.beginPath();
    ctx.moveTo(x - 16, 320);
    ctx.lineTo(x, 320 - h);
    ctx.lineTo(x + 16, 320);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  textureCache[key] = texture;
  return texture;
}

/**
 * 20. Botanical Stained Glass Rose & Arch Window Texture
 */
export function getStainedGlassTexture(): THREE.CanvasTexture {
  if (textureCache['stained_glass']) return textureCache['stained_glass'];
  const { canvas, ctx } = createOffscreen(1024, 1024);

  const bg = ctx.createRadialGradient(512, 512, 24, 512, 512, 512);
  bg.addColorStop(0, '#fef3c7');
  bg.addColorStop(0.35, '#a7f3d0');
  bg.addColorStop(0.7, '#7dd3fc');
  bg.addColorStop(1, '#315463');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 1024);

  const petalCols = ['#fbbf24', '#f472b6', '#6ee7b7', '#38bdf8', '#fde68a', '#c084fc'];
  for (let ring = 0; ring < 4; ring++) {
    const count = 8 + ring * 4;
    const rad = 110 + ring * 112;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      ctx.save();
      ctx.translate(512 + Math.cos(a) * rad, 512 + Math.sin(a) * rad);
      ctx.rotate(a);
      ctx.fillStyle = petalCols[(i + ring) % petalCols.length];
      ctx.globalAlpha = 0.74;
      ctx.beginPath();
      ctx.ellipse(0, 0, 44 + ring * 6, 22 + ring * 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.strokeStyle = '#1e2428';
  ctx.lineWidth = 8;
  [68, 178, 294, 412, 494].forEach((r) => {
    ctx.beginPath();
    ctx.arc(512, 512, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textureCache['stained_glass'] = texture;
  return texture;
}

/**
 * 21. Celestial Zodiac & Star-Chart Mandala Floor Inlay Texture (Phòng Tâm Linh)
 */
export function getZodiacMandalaTexture(): THREE.CanvasTexture {
  if (textureCache['zodiac_mandala']) return textureCache['zodiac_mandala'];
  const { canvas, ctx } = createOffscreen(1024, 1024);

  const bg = ctx.createRadialGradient(512, 512, 20, 512, 512, 512);
  bg.addColorStop(0, '#2c2448');
  bg.addColorStop(0.55, '#1b1730');
  bg.addColorStop(1, '#12101d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = `rgba(253, 230, 138, ${0.22 + ((i * 17) % 50) / 100})`;
    ctx.beginPath();
    ctx.arc((i * 193) % 1024, (i * 107) % 1024, i % 4 === 0 ? 3.0 : 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Crisp gilded brass concentric rings
  ctx.strokeStyle = 'rgba(222, 180, 92, 0.78)';
  [96, 192, 304, 412, 476].forEach((r, idx) => {
    ctx.lineWidth = idx === 2 || idx === 4 ? 6 : 3.2;
    ctx.beginPath();
    ctx.arc(512, 512, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 12 radial zodiac sectors & degree ticks
  ctx.strokeStyle = 'rgba(218, 175, 86, 0.48)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(512 + Math.cos(a) * 96, 512 + Math.sin(a) * 96);
    ctx.lineTo(512 + Math.cos(a) * 476, 512 + Math.sin(a) * 476);
    ctx.stroke();

    const rx = 512 + Math.cos(a + Math.PI / 12) * 444;
    const ry = 512 + Math.sin(a + Math.PI / 12) * 444;
    ctx.fillStyle = 'rgba(253, 224, 71, 0.72)';
    ctx.beginPath();
    ctx.arc(rx, ry, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Inscribed golden octagram
  ctx.strokeStyle = 'rgba(229, 192, 108, 0.65)';
  ctx.lineWidth = 4;
  for (let sq = 0; sq < 2; sq++) {
    ctx.save();
    ctx.translate(512, 512);
    ctx.rotate((sq * Math.PI) / 4);
    ctx.strokeRect(-214, -214, 428, 428);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textureCache['zodiac_mandala'] = texture;
  return texture;
}

/**
 * 22. Raked Zen Sand Ripples Texture (Phòng Mưa)
 */
export function getRakedZenSandTexture(): THREE.CanvasTexture {
  if (textureCache['zen_sand']) return textureCache['zen_sand'];
  const { canvas, ctx } = createOffscreen(1024, 1024);

  ctx.fillStyle = '#ddd6c7';
  ctx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(182, 173, 155, 0.35)' : 'rgba(247, 243, 234, 0.35)';
    ctx.fillRect((i * 149) % 1024, (i * 277) % 1024, 3, 3);
  }

  for (let y = 20; y < 1024; y += 26) {
    ctx.strokeStyle = 'rgba(130, 122, 106, 0.42)';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    for (let x = 0; x <= 1024; x += 24) {
      const yy = y + Math.sin(x * 0.015 + y * 0.01) * 5;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 252, 245, 0.48)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 0; x <= 1024; x += 24) {
      const yy = y + 5 + Math.sin(x * 0.015 + y * 0.01) * 5;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  [88, 120, 152, 184].forEach((r) => {
    ctx.strokeStyle = 'rgba(126, 118, 102, 0.48)';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(680, 380, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textureCache['zen_sand'] = texture;
  return texture;
}

/**
 * 23. Ink-Wash Botanical Calligraphy Scroll Texture (Trà Thất & Đền Ước Nguyện)
 */
export function getCalligraphyScrollTexture(): THREE.CanvasTexture {
  if (textureCache['calligraphy_scroll']) return textureCache['calligraphy_scroll'];
  const { canvas, ctx } = createOffscreen(512, 1024);

  // Silk scroll border
  ctx.fillStyle = '#c4a87e';
  ctx.fillRect(0, 0, 512, 1024);

  // Rice paper center
  ctx.fillStyle = '#f6eedc';
  ctx.fillRect(44, 84, 424, 856);

  // Soft ink-wash distant mountain
  ctx.fillStyle = 'rgba(72, 84, 78, 0.25)';
  ctx.beginPath();
  ctx.moveTo(44, 840);
  ctx.quadraticCurveTo(180, 640, 310, 730);
  ctx.quadraticCurveTo(410, 580, 468, 690);
  ctx.lineTo(468, 940);
  ctx.lineTo(44, 940);
  ctx.closePath();
  ctx.fill();

  // Bamboo stalk & leaves in sumi-e ink
  ctx.strokeStyle = '#2d3b32';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(356, 910);
  ctx.quadraticCurveTo(330, 580, 376, 240);
  ctx.stroke();

  const leafPts = [
    [340, 480, -0.8],
    [328, 420, -0.5],
    [356, 350, 0.7],
    [368, 284, -0.6],
  ];
  leafPts.forEach(([lx, ly, ang]) => {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(ang);
    ctx.fillStyle = '#28362e';
    ctx.beginPath();
    ctx.ellipse(0, 0, 46, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Brush-stroke enso circle + vertical ink characters
  ctx.strokeStyle = '#272320';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(176, 260, 68, 0.2, Math.PI * 1.88);
  ctx.stroke();

  ctx.fillStyle = '#2f2924';
  for (let y = 390; y <= 630; y += 52) {
    ctx.fillRect(144, y, 52 + ((y * 7) % 28), 8);
    ctx.fillRect(164, y - 12, 8, 36);
  }

  // Crimson artist chop seal
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(148, 710, 44, 44);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  textureCache['calligraphy_scroll'] = texture;
  return texture;
}

/**
 * 24. Warm Rustic Hearth Brick Texture (Nhà Nhật Ký)
 */
export function getBrickFireplaceTexture(): THREE.CanvasTexture {
  if (textureCache['brick_fireplace']) return textureCache['brick_fireplace'];
  const { canvas, ctx } = createOffscreen(1024, 1024);

  ctx.fillStyle = '#75685d';
  ctx.fillRect(0, 0, 1024, 1024);

  const brickColors = ['#7c3f2c', '#6e3626', '#8a4834', '#5c2d20', '#794131'];
  const rows = 14;
  const cols = 6;
  const rh = 1024 / rows;
  const cw = 1024 / cols;

  for (let r = 0; r < rows; r++) {
    const shift = r % 2 === 1 ? cw * 0.5 : 0;
    for (let c = -1; c <= cols; c++) {
      const bx = c * cw + shift;
      const by = r * rh;
      ctx.fillStyle = brickColors[(r * 5 + c * 3 + 50) % brickColors.length];
      ctx.beginPath();
      ctx.roundRect(bx + 5, by + 5, cw - 10, rh - 10, 6);
      ctx.fill();

      // Subtle brick top sheen & soot variation
      ctx.fillStyle = 'rgba(255, 238, 220, 0.08)';
      ctx.fillRect(bx + 10, by + 8, cw - 20, 5);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  textureCache['brick_fireplace'] = texture;
  return texture;
}



