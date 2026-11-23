import {
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
  LinearSRGBColorSpace,
} from 'three';
import { createSeededRandom, fbm2D } from './seededRandom.js';

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function finalizeTexture(canvas, { repeatX = 1, repeatY = 1, isColor = true } = {}) {
  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = isColor ? SRGBColorSpace : LinearSRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Tekstur serat kayu Dark Walnut / Deep Mahogany (albedo + bump)
 */
export function createWoodTextures({
  baseRgb = [54, 34, 23],
  grainRgb = [26, 15, 10],
  highlightRgb = [82, 54, 36],
  seed = 101,
  repeatX = 1,
  repeatY = 1,
} = {}) {
  const size = 512;
  const albedoCanvas = makeCanvas(size, size);
  const bumpCanvas = makeCanvas(size, size);
  const aCtx = albedoCanvas.getContext('2d');
  const bCtx = bumpCanvas.getContext('2d');

  const aImg = aCtx.createImageData(size, size);
  const bImg = bCtx.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = x / size;
      const ny = y / size;
      const warp = fbm2D(nx * 4.5, ny * 18.0, 4, seed) * 0.35;
      const ring = Math.sin((nx * 14.0 + warp * 8.0) * Math.PI);
      const fine = fbm2D(nx * 42.0, ny * 6.0, 3, seed + 31);
      const t = Math.max(0, Math.min(1, 0.5 + 0.35 * ring + 0.25 * (fine - 0.5)));

      const idx = (y * size + x) * 4;
      const r = grainRgb[0] + (baseRgb[0] - grainRgb[0]) * t + (highlightRgb[0] - baseRgb[0]) * Math.pow(t, 3);
      const g = grainRgb[1] + (baseRgb[1] - grainRgb[1]) * t + (highlightRgb[1] - baseRgb[1]) * Math.pow(t, 3);
      const b = grainRgb[2] + (baseRgb[2] - grainRgb[2]) * t + (highlightRgb[2] - baseRgb[2]) * Math.pow(t, 3);

      aImg.data[idx] = Math.min(255, r);
      aImg.data[idx + 1] = Math.min(255, g);
      aImg.data[idx + 2] = Math.min(255, b);
      aImg.data[idx + 3] = 255;

      const bumpVal = Math.floor(95 + t * 135);
      bImg.data[idx] = bumpVal;
      bImg.data[idx + 1] = bumpVal;
      bImg.data[idx + 2] = bumpVal;
      bImg.data[idx + 3] = 255;
    }
  }

  aCtx.putImageData(aImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);

  return {
    map: finalizeTexture(albedoCanvas, { repeatX, repeatY, isColor: true }),
    bumpMap: finalizeTexture(bumpCanvas, { repeatX, repeatY, isColor: false }),
  };
}

/**
 * Tekstur urat kelopak mawar putih-ivory organik + bump halus
 */
export function createPetalTextures(seed = 202) {
  const size = 512;
  const mapCanvas = makeCanvas(size, size);
  const bumpCanvas = makeCanvas(size, size);
  const mCtx = mapCanvas.getContext('2d');
  const bCtx = bumpCanvas.getContext('2d');

  // Gradasi dasar ivory hangat ke putih krem
  const grad = mCtx.createLinearGradient(0, size, 0, 0);
  grad.addColorStop(0.0, '#dfd4be');
  grad.addColorStop(0.24, '#efe6d5');
  grad.addColorStop(0.68, '#f9f5ec');
  grad.addColorStop(1.0, '#fdfbf7');
  mCtx.fillStyle = grad;
  mCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  const rng = createSeededRandom(seed);
  // Urat halus memancar dari pangkal kelopak
  for (let i = 0; i < 64; i += 1) {
    const startX = size * (0.35 + rng() * 0.3);
    const endX = size * (0.04 + (i / 63) * 0.92);
    const cpX = (startX + endX) * 0.5 + (rng() - 0.5) * 34;
    const cpY = size * (0.45 + (rng() - 0.5) * 0.2);

    mCtx.beginPath();
    mCtx.moveTo(startX, size);
    mCtx.quadraticCurveTo(cpX, cpY, endX, size * (0.04 + rng() * 0.08));
    mCtx.strokeStyle = i % 3 === 0 ? 'rgba(214, 200, 178, 0.22)' : 'rgba(255, 253, 248, 0.28)';
    mCtx.lineWidth = 0.8 + rng() * 1.1;
    mCtx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(startX, size);
    bCtx.quadraticCurveTo(cpX, cpY, endX, size * 0.05);
    bCtx.strokeStyle = 'rgba(165, 165, 165, 0.34)';
    bCtx.lineWidth = 1.1;
    bCtx.stroke();
  }

  return {
    map: finalizeTexture(mapCanvas, { isColor: true }),
    bumpMap: finalizeTexture(bumpCanvas, { isColor: false }),
  };
}

/**
 * Tekstur daun mawar hijau zamrud klasik dengan tulang daun
 */
export function createLeafTextures(seed = 303) {
  const size = 256;
  const mapCanvas = makeCanvas(size, size);
  const bumpCanvas = makeCanvas(size, size);
  const mCtx = mapCanvas.getContext('2d');
  const bCtx = bumpCanvas.getContext('2d');

  const grad = mCtx.createLinearGradient(0, size, 0, 0);
  grad.addColorStop(0, '#1c3024');
  grad.addColorStop(0.55, '#274232');
  grad.addColorStop(1, '#34523e');
  mCtx.fillStyle = grad;
  mCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#787878';
  bCtx.fillRect(0, 0, size, size);

  // Tulang daun utama
  mCtx.strokeStyle = 'rgba(132, 158, 120, 0.45)';
  mCtx.lineWidth = 3;
  mCtx.beginPath();
  mCtx.moveTo(size * 0.5, size);
  mCtx.lineTo(size * 0.5, size * 0.06);
  mCtx.stroke();

  bCtx.strokeStyle = '#c8c8c8';
  bCtx.lineWidth = 3.5;
  bCtx.beginPath();
  bCtx.moveTo(size * 0.5, size);
  bCtx.lineTo(size * 0.5, size * 0.06);
  bCtx.stroke();

  const rng = createSeededRandom(seed);
  for (let i = 1; i <= 7; i += 1) {
    const y = size * (1 - i * 0.12);
    const span = size * (0.38 - Math.abs(i - 3.5) * 0.05);
    [-1, 1].forEach((dir) => {
      mCtx.beginPath();
      mCtx.moveTo(size * 0.5, y);
      mCtx.quadraticCurveTo(
        size * 0.5 + dir * span * 0.5,
        y - 8,
        size * 0.5 + dir * span,
        y - 22 + (rng() - 0.5) * 4
      );
      mCtx.strokeStyle = 'rgba(128, 152, 114, 0.35)';
      mCtx.lineWidth = 1.5;
      mCtx.stroke();

      bCtx.beginPath();
      bCtx.moveTo(size * 0.5, y);
      bCtx.lineTo(size * 0.5 + dir * span, y - 22);
      bCtx.strokeStyle = '#b4b4b4';
      bCtx.lineWidth = 1.8;
      bCtx.stroke();
    });
  }

  return {
    map: finalizeTexture(mapCanvas, { isColor: true }),
    bumpMap: finalizeTexture(bumpCanvas, { isColor: false }),
  };
}

/**
 * Tekstur sampul kulit buku langka abad ke-17 berornamen emas
 */
export function createLeatherBookTexture({
  coverHex = '#4a181d',
  goldHex = '#cfa866',
  seed = 404,
} = {}) {
  const size = 512;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const rng = createSeededRandom(seed);

  ctx.fillStyle = coverHex;
  ctx.fillRect(0, 0, size, size);

  // Bintik pori kulit antik
  for (let i = 0; i < 3200; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    ctx.fillStyle = rng() > 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,235,205,0.04)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Bingkai emboss emas ganda
  ctx.strokeStyle = goldHex;
  ctx.lineWidth = 5;
  ctx.strokeRect(28, 28, size - 56, size - 56);
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, size - 84, size - 84);

  // Medali tengah heraldik
  ctx.save();
  ctx.translate(size * 0.5, size * 0.5);
  ctx.strokeStyle = goldHex;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 56, 82, 0, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 24);
    ctx.lineTo(Math.cos(a) * 46, Math.sin(a) * 66);
    ctx.stroke();
  }
  ctx.restore();

  return finalizeTexture(canvas, { isColor: true });
}

/**
 * Tekstur perkamen tua dengan kaligrafi dekoratif halus
 */
export function createParchmentTexture(seed = 505) {
  const size = 512;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const rng = createSeededRandom(seed);

  const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, 40, size * 0.5, size * 0.5, size * 0.72);
  grad.addColorStop(0, '#efe3c8');
  grad.addColorStop(0.75, '#e2d1b0');
  grad.addColorStop(1, '#c8b28a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Serat kertas rag
  for (let i = 0; i < 1800; i += 1) {
    ctx.fillStyle = rng() > 0.45 ? 'rgba(130, 98, 58, 0.06)' : 'rgba(255, 250, 238, 0.08)';
    ctx.fillRect(rng() * size, rng() * size, 1 + rng() * 3, 1);
  }

  // Baris tulisan tangan kaligrafi klasik tidak mencolok
  ctx.strokeStyle = 'rgba(68, 46, 30, 0.42)';
  ctx.lineWidth = 1.35;
  for (let row = 0; row < 14; row += 1) {
    const y = 68 + row * 26;
    const lineEnd = size - (row === 13 ? 190 : 72 + rng() * 35);
    ctx.beginPath();
    let x = 64;
    ctx.moveTo(x, y);
    while (x < lineEnd) {
      const step = 8 + rng() * 12;
      const wave = (rng() - 0.5) * 7;
      ctx.quadraticCurveTo(x + step * 0.5, y + wave, x + step, y + (rng() - 0.5) * 2.5);
      x += step;
    }
    ctx.stroke();
  }

  return finalizeTexture(canvas, { isColor: true });
}

/**
 * Lukisan minyak klasik abad ke-17 untuk bingkai dinding galeri
 */
export function createRoyalPaintingTexture(variant = 0, seed = 606) {
  const w = 512;
  const h = 640;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const rng = createSeededRandom(seed + variant * 53);

  // Latar chiaroscuro gelap
  const bg = ctx.createRadialGradient(w * 0.48, h * 0.36, 24, w * 0.5, h * 0.5, h * 0.72);
  if (variant === 0) {
    bg.addColorStop(0, '#5c3c28');
    bg.addColorStop(0.55, '#2b1a14');
    bg.addColorStop(1, '#120b09');
  } else if (variant === 1) {
    bg.addColorStop(0, '#4d3a2c');
    bg.addColorStop(0.55, '#24231e');
    bg.addColorStop(1, '#100d0b');
  } else {
    bg.addColorStop(0, '#786344');
    bg.addColorStop(0.5, '#354032');
    bg.addColorStop(1, '#141712');
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  if (variant < 2) {
    // Siluet potret bangsawan klasik dengan jubah beludru & kerah renda
    ctx.fillStyle = variant === 0 ? '#5b1922' : '#233b31';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.78, 155, 195, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // Selempang emas
    ctx.strokeStyle = '#c8a25e';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(w * 0.35, h * 0.58);
    ctx.lineTo(w * 0.66, h * 0.88);
    ctx.stroke();

    // Kerah renda ivory
    ctx.fillStyle = '#eadfc9';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.53, 58, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wajah chiaroscuro hangat
    const faceGrad = ctx.createRadialGradient(w * 0.47, h * 0.35, 10, w * 0.5, h * 0.37, 74);
    faceGrad.addColorStop(0, '#e3be99');
    faceGrad.addColorStop(0.7, '#b58663');
    faceGrad.addColorStop(1, '#5e3f2d');
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.37, 54, 72, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Lanskap pastoral klasik di balik pilar
    ctx.fillStyle = '#293528';
    ctx.fillRect(0, h * 0.56, w, h * 0.44);
    ctx.fillStyle = '#c9a66b';
    ctx.beginPath();
    ctx.arc(w * 0.62, h * 0.36, 44, 0, Math.PI * 2);
    ctx.fill();
  }

  // Craquelure halus lukisan tua
  ctx.strokeStyle = 'rgba(18, 12, 8, 0.16)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 160; i += 1) {
    const sx = rng() * w;
    const sy = rng() * h;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (rng() - 0.5) * 44, sy + (rng() - 0.5) * 44);
    ctx.stroke();
  }

  return finalizeTexture(canvas, { isColor: true });
}

/**
 * Karpet klasik Persia (Burgundy, Antique Gold, Muted Emerald)
 */
export function createPersianCarpetTexture(seed = 707) {
  const size = 512;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const rng = createSeededRandom(seed);

  ctx.fillStyle = '#4e161f';
  ctx.fillRect(0, 0, size, size);

  // Bingkai tepi zamrud & emas
  ctx.strokeStyle = '#c6a05c';
  ctx.lineWidth = 18;
  ctx.strokeRect(18, 18, size - 36, size - 36);

  ctx.strokeStyle = '#223a2f';
  ctx.lineWidth = 24;
  ctx.strokeRect(42, 42, size - 84, size - 84);

  ctx.strokeStyle = '#d8b878';
  ctx.lineWidth = 4;
  ctx.strokeRect(62, 62, size - 124, size - 124);

  // Medali tengah
  ctx.save();
  ctx.translate(size * 0.5, size * 0.5);
  ctx.fillStyle = '#233b30';
  ctx.beginPath();
  ctx.ellipse(0, 0, 110, 148, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cfa968';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = '#681e29';
  ctx.beginPath();
  ctx.ellipse(0, 0, 62, 86, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Tekstur tenunan benang
  for (let i = 0; i < 4000; i += 1) {
    ctx.fillStyle = rng() > 0.5 ? 'rgba(255,240,210,0.05)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(rng() * size, rng() * size, 2, 2);
  }

  return finalizeTexture(canvas, { isColor: true });
}

/**
 * Tekstur bulu pena angsa/angsa liar (ivory & russet)
 */
export function createFeatherTexture() {
  const w = 256;
  const h = 512;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, w, h);

  const grad = ctx.createLinearGradient(0, h, 0, 0);
  grad.addColorStop(0, '#d8c5a3');
  grad.addColorStop(0.55, '#f2eadb');
  grad.addColorStop(1, '#faf6ee');

  // Bentuk siluet bulu
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(w * 0.48, h * 0.96);
  ctx.quadraticCurveTo(w * 0.14, h * 0.62, w * 0.24, h * 0.14);
  ctx.quadraticCurveTo(w * 0.48, h * 0.02, w * 0.52, h * 0.04);
  ctx.quadraticCurveTo(w * 0.84, h * 0.22, w * 0.78, h * 0.68);
  ctx.quadraticCurveTo(w * 0.64, h * 0.88, w * 0.5, h * 0.96);
  ctx.closePath();
  ctx.fill();

  // Helai barb halus
  ctx.strokeStyle = 'rgba(138, 114, 84, 0.28)';
  ctx.lineWidth = 1;
  for (let y = 30; y < h - 40; y += 5) {
    ctx.beginPath();
    ctx.moveTo(w * 0.49, y);
    ctx.lineTo(w * 0.18, y - 16);
    ctx.moveTo(w * 0.5, y);
    ctx.lineTo(w * 0.8, y - 14);
    ctx.stroke();
  }

  // Batang rachis tengah
  ctx.strokeStyle = '#efe5d1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.49, h);
  ctx.quadraticCurveTo(w * 0.48, h * 0.5, w * 0.5, h * 0.04);
  ctx.stroke();

  return finalizeTexture(canvas, { isColor: true });
}